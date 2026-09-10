import { prisma } from '@/lib/db';
import { generateReturnNumber } from '@/lib/db/utils';
import type { Return, ReturnStatus, Prisma, EventType } from '@prisma/client';
import { ShippingTransitionService } from './shipping-transition.service';
import { NotificationService } from './notification.service';

export interface CreateReturnInput {
  kitId: string;
  reason?: string;
  notes?: string;
}

export class ReturnService {
  /**
   * Create a return for declined offer
   */
  static async create(data: CreateReturnInput, userId?: string): Promise<Return> {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${data.kitId} FOR UPDATE`;
      const kit = await tx.kit.findUniqueOrThrow({ where: { id: data.kitId } });
      if (kit.status !== 'DECLINED') throw new Error('Returns require a declined offer.');
      const existing = await tx.return.findFirst({ where: { kitId: data.kitId }, orderBy: { createdAt: 'desc' } });
      if (existing) return existing;
      const record = await tx.return.create({ data: { ...data, returnNumber: generateReturnNumber(), status: 'PENDING' } });
      await tx.timelineEvent.create({ data: { kitId: data.kitId, userId, type: 'RETURN_REQUESTED', title: 'Return requested', metadata: { returnId: record.id } } });
      return record;
    });
  }

  /**
   * Get return by ID
   */
  static async getById(returnId: string) {
    return prisma.return.findUnique({
      where: { id: returnId },
      include: {
        kit: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
    });
  }

  /**
   * Get return by return number
   */
  static async getByReturnNumber(returnNumber: string) {
    return prisma.return.findUnique({
      where: { returnNumber },
      include: {
        kit: {
          include: {
            customer: true,
          },
        },
      },
    });
  }

  /**
   * Update return status
   */
  static async updateStatus(
    returnId: string,
    status: ReturnStatus,
    userId?: string
  ): Promise<Return> {
    const current = await prisma.return.findUniqueOrThrow({ where: { id: returnId }, select: { kitId: true } });
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${current.kitId} FOR UPDATE`;
      const latest = await tx.return.findUniqueOrThrow({ where: { id: returnId }, include: { kit: { include: { shippingLabels: { where: { type: 'RETURN', status: { not: 'VOIDED' } }, orderBy: { createdAt: 'desc' }, take: 1 } } } } });
      if (latest.status === status) return latest;
      if (latest.status === 'DELIVERED') throw new Error('A delivered return cannot move backwards.');
      if (latest.kit.status !== 'DECLINED') throw new Error('This kit is not awaiting a return.');
      const allowed: Record<ReturnStatus, ReturnStatus[]> = { PENDING: ['LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'], LABEL_CREATED: ['IN_TRANSIT', 'DELIVERED', 'FAILED'], IN_TRANSIT: ['DELIVERED', 'FAILED'], FAILED: ['LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED'], DELIVERED: [] };
      if (!allowed[latest.status].includes(status)) throw new Error('This return cannot move backwards.');
      const label = latest.kit.shippingLabels[0];
      if (label && (status === 'IN_TRANSIT' || status === 'DELIVERED')) {
        await ShippingTransitionService.applyInTransaction(tx, label.id, status, userId);
        return tx.return.findUniqueOrThrow({ where: { id: returnId } });
      }
      if (label && status === 'FAILED') await ShippingTransitionService.applyInTransaction(tx, label.id, 'EXCEPTION', userId);
      if (['LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED'].includes(status) && !latest.trackingNumber?.trim()) throw new Error('Save the return tracking number before updating shipment status.');
      const now = new Date();
      const record = await tx.return.update({ where: { id: returnId }, data: { status, ...(status === 'IN_TRANSIT' ? { shippedAt: now } : {}), ...(status === 'DELIVERED' ? { deliveredAt: now } : {}) } });
      if (status === 'DELIVERED') await tx.kit.update({ where: { id: latest.kitId }, data: { status: 'RETURNED', completedAt: now } });
      const eventTypes: Record<ReturnStatus, EventType> = { PENDING: 'RETURN_REQUESTED', LABEL_CREATED: 'RETURN_LABEL_CREATED', IN_TRANSIT: 'RETURN_SHIPPED', DELIVERED: 'RETURN_DELIVERED', FAILED: 'STATUS_CHANGED' };
      const event = await tx.timelineEvent.create({ data: { kitId: latest.kitId, userId, type: eventTypes[status], title: `Return ${status.toLowerCase().replaceAll('_', ' ')}`, metadata: { returnId, status, ...(status === 'FAILED' ? { milestone: 'RETURN_FAILED' } : {}) } } });
      if (status === 'IN_TRANSIT' || status === 'DELIVERED') await NotificationService.enqueue(tx, `RETURN:${status}`, returnId, event.id);
      return record;
    });
  }

  /**
   * Update tracking number
   */
  static async updateTracking(
    returnId: string,
    trackingNumber: string
  ): Promise<Return> {
    const value = trackingNumber.trim();
    if (!/^[A-Za-z0-9 -]{1,100}$/.test(value)) throw new Error('Enter a valid tracking number.');
    const initial = await prisma.return.findUniqueOrThrow({ where: { id: returnId } });
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${initial.kitId} FOR UPDATE`;
      const current = await tx.return.findUniqueOrThrow({ where: { id: returnId }, include: { kit: true } });
      if (current.trackingNumber === value) return current;
      if (current.kit.status !== 'DECLINED' || ['IN_TRANSIT', 'DELIVERED'].includes(current.status)) throw new Error('Tracking cannot change after the return ships.');
      const label = await tx.shippingLabel.findFirst({ where: { kitId: initial.kitId, type: 'RETURN', status: { not: 'VOIDED' } } });
      if (label && label.trackingNumber !== value) throw new Error('Tracking must match the saved carrier label.');
      return tx.return.update({ where: { id: returnId }, data: { trackingNumber: value } });
    });
  }

  /**
   * Get all returns with filters
   */
  static async getAll(filters?: {
    status?: ReturnStatus;
    kitId?: string;
  }) {
    const where: Prisma.ReturnWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.kitId) {
      where.kitId = filters.kitId;
    }

    return prisma.return.findMany({
      where,
      include: {
        kit: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
