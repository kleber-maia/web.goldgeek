import { prisma } from '@/lib/db';
import { generateOfferNumber, calculateOfferExpiration } from '@/lib/db/utils';
import type { Offer, OfferStatus } from '@prisma/client';
import type { OfferInput } from '@/lib/validators/offer';
import { ActivityService } from './activity.service';
import { sendOfferReadyEmail } from '@/lib/email';
import { SettingsService } from './settings.service';

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

    const offer = await prisma.offer.create({
      data: {
        kitId,
        offerNumber,
        totalValue: data.totalValue,
        itemBreakdown: data.itemBreakdown,
        notes: data.notes,
        expiresAt,
        status: 'DRAFT',
      },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId,
      userId,
      type: 'OFFER_GENERATED',
      title: 'Offer Generated',
      description: `Offer ${offerNumber} generated for $${data.totalValue}`,
      metadata: { offerId: offer.id },
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
  static async send(offerId: string, userId?: string): Promise<Offer> {
    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        kit: { include: { customer: true } },
      },
    });

    // Update kit status
    await prisma.kit.update({
      where: { id: offer.kitId },
      data: { status: 'OFFER_SENT' },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: offer.kitId,
      userId,
      type: 'OFFER_SENT',
      title: 'Offer Sent',
      description: `Offer ${offer.offerNumber} sent to customer`,
      metadata: { offerId: offer.id },
    });

    // Send email to customer
    const customerEmail = offer.kit.customer?.email;
    if (customerEmail) {
      const companyInfo = await SettingsService.getCompanyInfo();
      const appUrl = companyInfo.websiteUrl || process.env.NEXT_PUBLIC_APP_URL || '';
      const offerUrl = `${appUrl}/account/kits/${offer.kitId}`;
      const totalValue = parseFloat(offer.totalValue.toString());
      sendOfferReadyEmail(customerEmail, offer.offerNumber, totalValue, offerUrl).catch(err =>
        console.error('Failed to send offer ready email:', err)
      );
    }

    return offer;
  }

  /**
   * Customer accepts offer
   */
  static async accept(offerId: string, userId?: string): Promise<Offer> {
    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      include: {
        kit: true,
      },
    });

    // Update kit status
    await prisma.kit.update({
      where: { id: offer.kitId },
      data: { status: 'ACCEPTED' },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: offer.kitId,
      userId,
      type: 'OFFER_ACCEPTED',
      title: 'Offer Accepted',
      description: `Offer ${offer.offerNumber} accepted by customer`,
      metadata: { offerId: offer.id },
    });

    return offer;
  }

  /**
   * Customer declines offer
   */
  static async decline(offerId: string, userId?: string): Promise<Offer> {
    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
      include: {
        kit: true,
      },
    });

    // Update kit status
    await prisma.kit.update({
      where: { id: offer.kitId },
      data: { status: 'DECLINED' },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: offer.kitId,
      userId,
      type: 'OFFER_DECLINED',
      title: 'Offer Declined',
      description: `Offer ${offer.offerNumber} declined by customer`,
      metadata: { offerId: offer.id },
    });

    return offer;
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
    const result = await prisma.offer.updateMany({
      where: {
        status: 'SENT',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
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
    const where: any = {};

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
