import { prisma } from '@/lib/db';
import type { Prisma, NotificationOutbox } from '@prisma/client';
import { deliveryContext } from '@/lib/email/delivery-context';
import { appRoutes, buildAbsoluteUrl } from '@/lib/url';

export class NotificationService {
  static async enqueue(tx: Prisma.TransactionClient, kind: string, aggregateId: string, key: string) {
    await tx.notificationOutbox.upsert({ where: { key }, create: { kind, aggregateId, key }, update: {} });
  }

  static async drain(limit = 25, deliver: (row: NotificationOutbox) => Promise<boolean> = row => this.deliver(row)): Promise<{ delivered: number; failed: number }> {
    let delivered = 0;
    let failed = 0;
    const batchSize = Number.isFinite(limit) ? Math.min(100, Math.max(0, Math.floor(limit))) : 25;
    for (let index = 0; index < batchSize; index++) {
      // Lease each job immediately before delivery, not while it waits behind other jobs.
      const [row] = await prisma.$queryRaw<NotificationOutbox[]>`
        UPDATE "NotificationOutbox" SET "lockedUntil" = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '5 minutes', "attempts" = "attempts" + 1
        WHERE "id" IN (SELECT "id" FROM "NotificationOutbox" WHERE "sentAt" IS NULL
          AND "nextAttemptAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AND ("lockedUntil" IS NULL OR "lockedUntil" < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'))
          ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
      if (!row) break;
      const ownership = { id: row.id, lockedUntil: row.lockedUntil };
      try {
        const sent = await deliveryContext.run(row.id, () => deliver(row));
        if (!sent) throw new Error('Provider did not confirm delivery');
        const result = await prisma.notificationOutbox.updateMany({ where: ownership, data: { sentAt: new Date(), lockedUntil: null, lastError: null } });
        delivered += result.count;
      } catch {
        const result = await prisma.notificationOutbox.updateMany({ where: ownership, data: { lockedUntil: null, lastError: 'Delivery failed; retry scheduled', nextAttemptAt: new Date(Date.now() + Math.min(3600, 30 * 2 ** row.attempts) * 1000) } });
        failed += result.count;
      }
    }
    return { delivered, failed };
  }

  private static async deliver(row: NotificationOutbox): Promise<boolean> {
    const email = await import('@/lib/email');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (row.kind.startsWith('CARRIER:')) {
      const { FedExClient } = await import('@/lib/fedex/client');
      const label = await prisma.shippingLabel.findUniqueOrThrow({ where: { id: row.aggregateId }, include: { kit: true } });
      if (row.kind === 'CARRIER:VOID') {
        if (label.voidedAt || label.status !== 'VOIDED') return true;
        await FedExClient.cancelShipment(label.trackingNumber);
        await prisma.shippingLabel.updateMany({ where: { id: label.id, status: 'VOIDED', voidedAt: null }, data: { voidedAt: new Date() } });
        return true;
      }
      if (label.status === 'VOIDED' || label.kit.status === 'CANCELLED') return true;
      if (!baseUrl) throw new Error('Application URL is required');
      await FedExClient.subscribeTracking(label.trackingNumber, `${baseUrl}/api/webhooks/fedex`);
      return true;
    }
    if (row.kind === 'KIT:CREATED') {
      const kit = await prisma.kit.findUniqueOrThrow({ where: { id: row.aggregateId }, include: { customer: true } });
      if (kit.status === 'CANCELLED') return true;
      return email.sendKitCreatedEmail(kit.customer.email, kit.kitNumber, kit.type, { baseUrl, actionUrl: buildAbsoluteUrl(baseUrl || 'http://localhost:3000', appRoutes.accountKit(kit.id)) });
    }
    if (row.kind.startsWith('OFFER:')) {
      const offer = await prisma.offer.findUniqueOrThrow({ where: { id: row.aggregateId }, include: { kit: { include: { customer: true } } } });
      if (offer.kit.status === 'CANCELLED' || row.kind !== `OFFER:${offer.status}`) return true;
      const kitUrl = buildAbsoluteUrl(baseUrl || 'http://localhost:3000', appRoutes.accountKit(offer.kitId));
      if (offer.status === 'SENT') return email.sendOfferReadyEmail(offer.kit.customer.email, offer.offerNumber, Number(offer.totalValue), kitUrl, baseUrl);
      if (offer.status === 'EXPIRED') return email.sendOfferExpiredEmail(offer.kit.customer.email, offer.offerNumber, offer.kit.kitNumber, kitUrl, baseUrl);
      const admins = await prisma.user.findMany({ select: { email: true } });
      if (!admins.length) return true;
      const recipients = admins.map(admin => admin.email);
      const name = `${offer.kit.customer.firstName} ${offer.kit.customer.lastName}`.trim();
      if (offer.status === 'ACCEPTED') return email.sendOfferAcceptedAdminEmail(recipients, offer.offerNumber, offer.kit.kitNumber, name, Number(offer.totalValue), baseUrl);
      if (offer.status === 'DECLINED') return email.sendOfferDeclinedAdminEmail(recipients, offer.offerNumber, offer.kit.kitNumber, name, baseUrl);
      return true;
    }
    if (row.kind === 'PAYMENT:SENT') {
      const payment = await prisma.payment.findUniqueOrThrow({ where: { id: row.aggregateId }, include: { customer: true, offer: { include: { kit: true } } } });
      if (!['SENT', 'COMPLETED'].includes(payment.status) || payment.offer.kit.status === 'CANCELLED') return true;
      return email.sendPaymentSentEmail(payment.customer.email, payment.paymentNumber, Number(payment.amount), payment.method, payment.trackingNumber || undefined, baseUrl);
    }
    if (row.kind.startsWith('RETURN:')) {
      const record = await prisma.return.findUniqueOrThrow({ where: { id: row.aggregateId }, include: { kit: { include: { customer: true } } } });
      if (record.kit.status === 'CANCELLED') return true;
      if (row.kind === 'RETURN:DELIVERED' && record.status === 'DELIVERED') return email.sendReturnDeliveredEmail(record.kit.customer.email, record.kit.kitNumber, record.returnNumber, baseUrl);
      if (row.kind === 'RETURN:IN_TRANSIT' && record.status === 'IN_TRANSIT') return email.sendReturnShippedEmail(record.kit.customer.email, record.kit.kitNumber, record.returnNumber, record.trackingNumber || '', baseUrl);
      return true;
    }
    if (row.kind.startsWith('SHIPPING:')) {
      const label = await prisma.shippingLabel.findUniqueOrThrow({ where: { id: row.aggregateId }, include: { kit: { include: { customer: true, returns: { orderBy: { createdAt: 'desc' }, take: 1 } } } } });
      if (label.kit.status === 'CANCELLED' || label.status === 'VOIDED') return true;
      const recipient = label.kit.customer.email;
      const kitNumber = label.kit.kitNumber;
      const returnNumber = label.kit.returns[0]?.returnNumber || '';
      switch (row.kind) {
        case 'SHIPPING:KIT_DELIVERY:IN_TRANSIT': return email.sendKitShippedToCustomerEmail(recipient, kitNumber, label.trackingNumber, baseUrl);
        case 'SHIPPING:INBOUND:IN_TRANSIT': return email.sendPackageInTransitEmail(recipient, kitNumber, label.trackingNumber, baseUrl);
        case 'SHIPPING:INBOUND:DELIVERED': return email.sendKitReceivedEmail(recipient, kitNumber, baseUrl);
        case 'SHIPPING:RETURN:IN_TRANSIT': return email.sendReturnShippedEmail(recipient, kitNumber, returnNumber, label.trackingNumber, baseUrl);
        case 'SHIPPING:RETURN:DELIVERED': return email.sendReturnDeliveredEmail(recipient, kitNumber, returnNumber, baseUrl);
        default: return true;
      }
    }
    throw new Error('Unknown notification kind');
  }
}
