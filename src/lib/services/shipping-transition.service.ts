import { prisma } from '@/lib/db';
import type { ShippingLabelStatus, EventType, Prisma } from '@prisma/client';
import { NotificationService } from './notification.service';

export class ShippingTransitionService {
  static async apply(labelId: string, status: ShippingLabelStatus, userId?: string, eventAt = new Date(), receiptId?: string) {
    return prisma.$transaction(tx => this.applyInTransaction(tx, labelId, status, userId, eventAt, receiptId));
  }

  /** Shares the kit lock with manual return updates. */
  static async applyInTransaction(tx: Prisma.TransactionClient, labelId: string, status: ShippingLabelStatus, userId?: string, eventAt = new Date(), receiptId?: string) {
      const initial = await tx.shippingLabel.findUniqueOrThrow({ where: { id: labelId } });
      await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${initial.kitId} FOR UPDATE`;
      const label = await tx.shippingLabel.findUniqueOrThrow({ where: { id: labelId }, include: { kit: true } });
      if (receiptId) {
        if (await tx.carrierReceipt.findUnique({ where: { id: receiptId } })) return label;
        await tx.carrierReceipt.create({ data: { id: receiptId, trackingNumber: label.trackingNumber } });
      }
      if (label.status === 'VOIDED' || label.kit.status === 'CANCELLED') return label;
      // A late carrier scan can supply missing history without reopening a delivered shipment.
      if (receiptId && label.status === 'DELIVERED' && status === 'IN_TRANSIT' && !label.shippedAt &&
        label.deliveredAt && Number.isFinite(eventAt.getTime()) && eventAt <= label.deliveredAt) {
        const updated = await tx.shippingLabel.update({ where: { id: labelId }, data: { shippedAt: eventAt } });
        if (label.type === 'KIT_DELIVERY' || (label.type === 'INBOUND' && label.kit.type === 'DIGITAL')) {
          await tx.kit.updateMany({ where: { id: label.kitId, kitSentAt: null }, data: { kitSentAt: eventAt } });
        }
        if (label.type === 'RETURN') {
          await tx.return.updateMany({ where: { kitId: label.kitId, trackingNumber: label.trackingNumber, shippedAt: null }, data: { shippedAt: eventAt } });
        }
        const type: EventType = label.type === 'KIT_DELIVERY' ? 'KIT_SENT' : label.type === 'RETURN' ? 'RETURN_SHIPPED' : 'PACKAGE_IN_TRANSIT';
        await tx.timelineEvent.create({ data: { kitId: label.kitId, userId, type, title: 'Shipment date confirmed by delayed carrier scan', metadata: { labelId, labelType: label.type, historical: true }, createdAt: eventAt } });
        return updated;
      }
      if (label.status === 'DELIVERED' && status !== 'DELIVERED') return label;
      if (receiptId && label.lastCarrierEventAt && (eventAt < label.lastCarrierEventAt || (eventAt.getTime() === label.lastCarrierEventAt.getTime() && status !== 'DELIVERED'))) return label;
      if (label.status === status) {
        if (receiptId) await tx.shippingLabel.update({ where: { id: labelId }, data: { lastCarrierEventAt: eventAt } });
        return label;
      }
      const updated = await tx.shippingLabel.update({ where: { id: labelId }, data: {
        status,
        ...(receiptId ? { lastCarrierEventAt: eventAt } : {}),
        ...(status === 'IN_TRANSIT' && !label.shippedAt ? { shippedAt: eventAt } : {}),
        ...(status === 'DELIVERED' ? { deliveredAt: eventAt } : {}),
        ...(status === 'VOIDED' ? { voidedAt: eventAt } : {}),
      } });
      let type: EventType = 'STATUS_CHANGED';
      let title = `Shipping status: ${status.toLowerCase().replaceAll('_', ' ')}`;
      if (label.type === 'INBOUND') {
        if (status === 'IN_TRANSIT') {
          await tx.kit.updateMany({ where: { id: label.kitId, status: 'PENDING' }, data: { status: 'SHIPPED', kitSentAt: eventAt } });
          type = 'PACKAGE_IN_TRANSIT'; title = 'Items in transit to Gold Geek';
        } else if (status === 'DELIVERED') {
          await tx.kit.updateMany({ where: { id: label.kitId, status: { in: ['PENDING', 'SHIPPED'] } }, data: { status: 'EVALUATING', receivedAt: eventAt, evaluationStartAt: eventAt } });
          type = 'PACKAGE_DELIVERED'; title = 'Items received for evaluation';
        }
      } else if (label.type === 'KIT_DELIVERY' && status === 'IN_TRANSIT') {
        await tx.kit.updateMany({ where: { id: label.kitId, status: 'PENDING' }, data: { status: 'SHIPPED', kitSentAt: eventAt } });
        type = 'KIT_SENT'; title = 'Kit shipped to you';
      } else if (label.type === 'KIT_DELIVERY' && status === 'DELIVERED') {
        await tx.kit.updateMany({ where: { id: label.kitId, status: 'PENDING' }, data: { status: 'SHIPPED' } });
        type = 'PACKAGE_DELIVERED'; title = 'Empty kit delivered to customer';
      } else if (label.type === 'RETURN' && ['IN_TRANSIT', 'DELIVERED'].includes(status)) {
        const returnRecord = await tx.return.findFirst({ where: { kitId: label.kitId }, orderBy: { createdAt: 'desc' } });
        if (!returnRecord) throw new Error('Return shipment has no return record');
        await tx.return.update({ where: { id: returnRecord.id }, data: { status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT', trackingNumber: label.trackingNumber, ...(status === 'DELIVERED' ? { deliveredAt: eventAt } : { shippedAt: eventAt }) } });
        if (status === 'DELIVERED') await tx.kit.updateMany({ where: { id: label.kitId, status: 'DECLINED' }, data: { status: 'RETURNED', completedAt: eventAt } });
        type = status === 'DELIVERED' ? 'RETURN_DELIVERED' : 'RETURN_SHIPPED'; title = status === 'DELIVERED' ? 'Return delivered' : 'Return shipped';
      }
      const event = await tx.timelineEvent.create({ data: { kitId: label.kitId, userId, type, title, description: `${label.carrier}: ${label.trackingNumber}`, metadata: { labelId, labelType: label.type, oldStatus: label.status, newStatus: status }, createdAt: eventAt } });
      await NotificationService.enqueue(tx, `SHIPPING:${label.type}:${status}`, labelId, event.id);
      return updated;
  }
}
