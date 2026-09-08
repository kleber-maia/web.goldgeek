import { OfferDecisionService } from './offer-decision.service';
import { prisma } from '@/lib/db';
import { generateOfferNumber, calculateOfferExpiration } from '@/lib/db/utils';
import type { Offer, OfferStatus, PaymentMethod, Prisma } from '@prisma/client';
import type { OfferInput } from '@/lib/validators/offer';
import { NotificationService } from './notification.service';

export class OfferService {
  /**
   * Create an offer for a kit
   */
  static async create(
    kitId: string,
    data: OfferInput,
    userId?: string
  ): Promise<Offer> {
    const offerNumber = generateOfferNumber();
    const expiresAt = calculateOfferExpiration();

    const offer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${kitId} FOR UPDATE`;
      const kit = await tx.kit.findUniqueOrThrow({ where: { id: kitId } });
      if (!['EVALUATING', 'OFFER_SENT'].includes(kit.status)) throw new Error('This kit is not available for a new offer.');
      await tx.offer.updateMany({ where: { kitId, status: 'DRAFT' }, data: { status: 'EXPIRED' } });
      const created = await tx.offer.create({ data: { kitId, offerNumber, totalValue: data.totalValue, itemBreakdown: data.itemBreakdown, notes: data.notes, expiresAt, status: 'DRAFT' } });
      await tx.timelineEvent.create({ data: { kitId, userId, type: 'OFFER_GENERATED', title: 'Offer generated', metadata: { offerId: created.id } } });
      return created;
    });

    return offer;
  }

  /**
   * Get offer by ID
   */
  static async getById(offerId: string) {
    return prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        kit: {
          include: {
            items: true,
            customer: true,
            timeline: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        payment: true,
      },
    });
  }

  /**
   * Get offer by offer number
   */
  static async getByOfferNumber(offerNumber: string) {
    return prisma.offer.findUnique({
      where: { offerNumber },
      include: {
        kit: {
          include: {
            items: true,
            customer: true,
          },
        },
        payment: true,
      },
    });
  }

  /**
   * Get all offers for a kit
   */
  static async getByKitId(kitId: string): Promise<Offer[]> {
    return prisma.offer.findMany({
      where: { kitId },
      include: {
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Send offer to customer
   */
  static async send(
    offerId: string,
    userId?: string,
    baseUrl?: string
  ): Promise<Offer> {
    const offer = await prisma.$transaction(async (tx) => {
      const initial = await tx.offer.findUniqueOrThrow({ where: { id: offerId } });
      await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${initial.kitId} FOR UPDATE`;
      const current = await tx.offer.findUniqueOrThrow({ where: { id: offerId }, include: { kit: true } });
      if (current.status !== 'DRAFT' || !['EVALUATING', 'OFFER_SENT'].includes(current.kit.status)) throw new Error('Only a draft offer for an available kit can be sent.');
      await tx.offer.updateMany({ where: { kitId: current.kitId, status: 'SENT', id: { not: offerId } }, data: { status: 'EXPIRED' } });
      const sent = await tx.offer.update({ where: { id: offerId }, data: { status: 'SENT', sentAt: new Date(), expiresAt: calculateOfferExpiration() }, include: { kit: { include: { customer: true } } } });
      await tx.kit.update({ where: { id: current.kitId }, data: { status: 'OFFER_SENT' } });
      await tx.timelineEvent.create({ data: { kitId: current.kitId, userId, type: 'OFFER_SENT', title: 'Offer sent', metadata: { offerId } } });
      await NotificationService.enqueue(tx, "OFFER:SENT", offerId, `offer:${offerId}:sent`);
      return sent;
    });

    return offer;
  }

  /**
   * Customer accepts offer
   */
  static async accept(offerId: string, customerId: string, method?: PaymentMethod): Promise<Offer> {
    return OfferDecisionService.respond(offerId, customerId, 'ACCEPTED', method);
  }

  static async decline(offerId: string, customerId: string): Promise<Offer> {
    return OfferDecisionService.respond(offerId, customerId, 'DECLINED');
  }

  /**
   * Update offer status
   */
  static async updateStatus(offerId: string, status: OfferStatus): Promise<Offer> {
    return prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });
  }

  /**
   * Mark expired offers
   */
  static async markExpired(): Promise<number> {
    const candidates = await prisma.offer.findMany({ where: { status: 'SENT', expiresAt: { lte: new Date() } }, select: { id: true, kitId: true }, take: 500, orderBy: { expiresAt: 'asc' } });
    let count = 0;
    for (const candidate of candidates) {
      count += await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${candidate.kitId} FOR UPDATE`;
        const changed = await tx.offer.updateMany({ where: { id: candidate.id, status: 'SENT', expiresAt: { lte: new Date() } }, data: { status: 'EXPIRED' } });
        if (!changed.count) return 0;
        await tx.timelineEvent.create({ data: { kitId: candidate.kitId, type: 'STATUS_CHANGED', title: 'Offer expired', metadata: { offerId: candidate.id } } });
        await NotificationService.enqueue(tx, 'OFFER:EXPIRED', candidate.id, `offer:${candidate.id}:expired`);
        return 1;
      });
    }
    return count;
  }

  /**
   * Get accepted offers that have no payment record yet.
   * Used by the Payments funnel page "Awaiting Payment" tab.
   */
  static async getAcceptedWithoutPayment() {
    return prisma.offer.findMany({
      where: {
        status: 'ACCEPTED',
        payment: null,
      },
      include: {
        kit: { include: { customer: true } },
      },
      orderBy: {
        respondedAt: 'asc',
      },
    });
  }

  /**
   * Get declined offers where the kit has no return record yet.
   * Used by the Returns funnel page "Needs Return" tab.
   */
  static async getDeclinedWithoutReturn() {
    return prisma.offer.findMany({
      where: {
        status: 'DECLINED',
        kit: { returns: { none: {} } },
      },
      include: {
        kit: { include: { customer: true, items: true } },
      },
      orderBy: {
        respondedAt: 'asc',
      },
    });
  }

  /**
   * Get all offers with filters
   */
  static async getAll(filters?: {
    status?: OfferStatus;
    kitId?: string;
  }) {
    const where: Prisma.OfferWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.kitId) {
      where.kitId = filters.kitId;
    }

    return prisma.offer.findMany({
      where,
      include: {
        kit: {
          include: {
            customer: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
