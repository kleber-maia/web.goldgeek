import { prisma } from '@/lib/db';
import { generatePaymentNumber, generateReturnNumber } from '@/lib/db/utils';
import type { PaymentMethod } from '@prisma/client';
import { PaymentDetailsService } from './payment-details.service';
import { NotificationService } from './notification.service';

export class OfferDecisionService {
  static async respond(offerId: string, customerId: string, decision: 'ACCEPTED' | 'DECLINED', method?: PaymentMethod) {
    return prisma.$transaction(async (tx) => {
      const initial = await tx.offer.findUnique({ where: { id: offerId, kit: { customerId } }, select: { kitId: true } });
      if (!initial) throw new Error('Offer not found.');
      await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${initial.kitId} FOR UPDATE`;
      const offer = await tx.offer.findUniqueOrThrow({ where: { id: offerId, kit: { customerId } }, include: { payment: true, kit: { include: { customer: { include: { addresses: true } }, returns: true } } } });
      if (offer.status === decision && offer.kit.status !== 'CANCELLED' && (decision === 'ACCEPTED' ? offer.payment : offer.kit.returns.length)) return offer;
      const now = new Date();
      if (offer.status !== 'SENT' || offer.expiresAt <= now || offer.kit.status !== 'OFFER_SENT') throw new Error('This offer is no longer available. Return to your kit for the latest status.');
      const latest = await tx.offer.findFirst({ where: { kitId: offer.kitId, status: 'SENT' }, orderBy: [{ sentAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }] });
      if (latest?.id !== offer.id) throw new Error('A newer offer is available. Return to your kit to review it.');
      if (decision === 'ACCEPTED') {
        const preferences = PaymentDetailsService.preferences(offer.kit.customer.paymentPreferences);
        const chosenMethod = method || preferences.method;
        let destination = PaymentDetailsService.validate(chosenMethod, preferences.accountInfo);
        if (chosenMethod === 'CHECK') {
          destination = PaymentDetailsService.checkDestination(offer.kit.customer, offer.kit.shippingAddress);
        }
        const payment = await tx.payment.create({ data: { offerId, customerId: offer.kit.customerId, paymentNumber: generatePaymentNumber(), amount: offer.totalValue, method: chosenMethod, accountInfo: PaymentDetailsService.encrypt(destination) } });
        await tx.timelineEvent.create({ data: { kitId: offer.kitId, type: 'PAYMENT_INITIATED', title: 'Payment requested', metadata: { paymentId: payment.id } } });
      } else {
        const returnRecord = await tx.return.create({ data: { kitId: offer.kitId, returnNumber: generateReturnNumber(), reason: 'Customer declined offer' } });
        await tx.timelineEvent.create({ data: { kitId: offer.kitId, type: 'RETURN_REQUESTED', title: 'Return requested', metadata: { returnId: returnRecord.id } } });
      }
      const updated = await tx.offer.update({ where: { id: offerId }, data: { status: decision, respondedAt: now } });
      await tx.offer.updateMany({ where: { kitId: offer.kitId, id: { not: offer.id }, status: { in: ['SENT', 'DRAFT'] } }, data: { status: 'EXPIRED' } });
      await tx.kit.update({ where: { id: offer.kitId }, data: { status: decision } });
      await tx.timelineEvent.create({ data: { kitId: offer.kitId, type: decision === 'ACCEPTED' ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED', title: decision === 'ACCEPTED' ? 'Offer accepted' : 'Offer declined', metadata: { offerId } } });
      await NotificationService.enqueue(tx, `OFFER:${decision}`, offerId, `offer:${offerId}:${decision}`);
      return updated;
    });
  }
}
