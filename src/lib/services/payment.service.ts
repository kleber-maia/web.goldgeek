import { prisma } from '@/lib/db';
import { generatePaymentNumber } from '@/lib/db/utils';
import type { Payment, PaymentMethod, PaymentStatus, Prisma, EventType } from '@prisma/client';
import { PaymentDetailsService } from './payment-details.service';
import { NotificationService } from './notification.service';

export interface CreatePaymentInput {
  offerId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  accountInfo?: Record<string, string>;
  notes?: string;
}

export class PaymentService {
  /**
   * Create a payment
   */
  static async create(data: CreatePaymentInput, userId?: string): Promise<Payment> {
    return prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUniqueOrThrow({ where: { id: data.offerId }, include: { kit: { include: { customer: true } } } });
      await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${offer.kitId} FOR UPDATE`;
      const kit = await tx.kit.findUniqueOrThrow({ where: { id: offer.kitId } });
      if (offer.status !== 'ACCEPTED' || !['ACCEPTED', 'PAID'].includes(kit.status) || data.customerId !== kit.customerId) throw new Error('Payment does not match an accepted offer.');
      const existing = await tx.payment.findUnique({ where: { offerId: data.offerId } });
      if (existing && existing.status !== 'FAILED') return existing;
      const details = existing ? PaymentDetailsService.decrypt(existing.accountInfo) : data.method === 'CHECK'
        ? PaymentDetailsService.checkDestination(offer.kit.customer, kit.shippingAddress)
        : PaymentDetailsService.validate(data.method, data.accountInfo || PaymentDetailsService.preferences(offer.kit.customer.paymentPreferences).accountInfo);
      const payment = existing
        ? await tx.payment.update({ where: { id: existing.id, status: 'FAILED' }, data: { status: 'PENDING', initiatedAt: null, sentAt: null, completedAt: null } })
        : await tx.payment.create({ data: { offerId: offer.id, customerId: kit.customerId, paymentNumber: generatePaymentNumber(), amount: offer.totalValue, method: data.method, accountInfo: PaymentDetailsService.encrypt(details), notes: data.notes } });
      await tx.timelineEvent.create({ data: { kitId: kit.id, userId, type: 'PAYMENT_INITIATED', title: existing ? 'Payment retry requested' : 'Payment requested', metadata: { paymentId: payment.id, retry: Boolean(existing) } } });
      return payment;
    });
  }

  static async getDestination(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { offer: true } });
    await prisma.timelineEvent.create({ data: { kitId: payment.offer.kitId, userId, type: 'NOTE_ADDED', title: 'Payout destination reviewed', metadata: { paymentId } } });
    return PaymentDetailsService.decrypt(payment.accountInfo);
  }

  /**
   * Get payment by ID
   */
  static async getById(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        offer: {
          include: {
            kit: true,
          },
        },
        customer: true,
      },
    });
  }

  /**
   * Get payment by payment number
   */
  static async getByPaymentNumber(paymentNumber: string) {
    return prisma.payment.findUnique({
      where: { paymentNumber },
      include: {
        offer: {
          include: {
            kit: true,
          },
        },
        customer: true,
      },
    });
  }

  /**
   * Update payment status
   */
  static async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    userId?: string,
    _baseUrl?: string
  ): Promise<Payment> {
    return prisma.$transaction(async (tx) => {
      const initial = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { offer: true } });
      await tx.$queryRaw`SELECT "id" FROM "Kit" WHERE "id" = ${initial.offer.kitId} FOR UPDATE`;
      const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { offer: { include: { kit: true } } } });
      const allowed: Record<PaymentStatus, PaymentStatus[]> = { PENDING: ['PROCESSING', 'SENT', 'FAILED'], PROCESSING: ['SENT', 'FAILED'], SENT: ['COMPLETED', 'FAILED'], COMPLETED: [], FAILED: ['PENDING'] };
      if (current.status === status) return current;
      if (current.offer.kit.status === 'CANCELLED' || !allowed[current.status].includes(status)) throw new Error('This payment status change is not allowed.');
      if (status === 'PROCESSING' || status === 'SENT') PaymentDetailsService.validateSnapshot(current.method, PaymentDetailsService.decrypt(current.accountInfo));
      const now = new Date();
      const updates: Prisma.PaymentUpdateInput = { status, ...(status === 'PROCESSING' ? { initiatedAt: now } : {}), ...(status === 'SENT' ? { sentAt: now } : {}), ...(status === 'COMPLETED' ? { completedAt: now } : {}) };
      const payment = await tx.payment.update({ where: { id: paymentId }, data: updates });
      if (status === 'SENT' || status === 'COMPLETED') await tx.kit.update({ where: { id: current.offer.kitId }, data: { status: 'PAID', completedAt: now } });
      if (status === 'FAILED') await tx.kit.updateMany({ where: { id: current.offer.kitId, status: 'PAID' }, data: { status: 'ACCEPTED', completedAt: null } });
      const type: EventType = status === 'SENT' ? 'PAYMENT_SENT' : status === 'COMPLETED' ? 'PAYMENT_COMPLETED' : 'PAYMENT_INITIATED';
      const event = await tx.timelineEvent.create({ data: { kitId: current.offer.kitId, userId, type, title: `Payment ${status.toLowerCase()}`, metadata: { paymentId, oldStatus: current.status, newStatus: status } } });
      if (status === 'SENT') await NotificationService.enqueue(tx, 'PAYMENT:SENT', paymentId, event.id);
      return payment;
    });
  }

  /**
   * Update payment tracking info
   */
  static async updateTracking(
    paymentId: string,
    trackingNumber: string,
    checkNumber?: string
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        trackingNumber,
        checkNumber,
      },
    });
  }

  /**
   * Get all payments with filters
   */
  static async getAll(filters?: {
    status?: PaymentStatus;
    customerId?: string;
    method?: PaymentMethod;
  }) {
    const where: Prisma.PaymentWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    return prisma.payment.findMany({
      where,
      include: {
        offer: {
          include: {
            kit: true,
          },
        },
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
