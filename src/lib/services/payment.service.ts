import { prisma } from '@/lib/db';
import { generatePaymentNumber } from '@/lib/db/utils';
import type { Payment, PaymentMethod, PaymentStatus } from '@prisma/client';
import { ActivityService } from './activity.service';
import { sendPaymentSentEmail } from '@/lib/email';

export interface CreatePaymentInput {
  offerId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  accountInfo?: any; // Should be encrypted
  notes?: string;
}

export class PaymentService {
  /**
   * Create a payment
   */
  static async create(data: CreatePaymentInput, userId?: string): Promise<Payment> {
    const paymentNumber = generatePaymentNumber();

    // Get the offer to get the kit ID
    const offer = await prisma.offer.findUnique({
      where: { id: data.offerId },
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    const payment = await prisma.payment.create({
      data: {
        offerId: data.offerId,
        customerId: data.customerId,
        paymentNumber,
        amount: data.amount,
        method: data.method,
        accountInfo: data.accountInfo,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: offer.kitId,
      userId,
      type: 'PAYMENT_INITIATED',
      title: 'Payment Initiated',
      description: `Payment ${paymentNumber} initiated for $${data.amount}`,
      metadata: { paymentId: payment.id },
    });

    return payment;
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
    userId?: string
  ): Promise<Payment> {
    const updates: any = { status };

    // Set timestamps based on status
    switch (status) {
      case 'PROCESSING':
        updates.initiatedAt = new Date();
        break;
      case 'SENT':
        updates.sentAt = new Date();
        break;
      case 'COMPLETED':
        updates.completedAt = new Date();
        break;
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updates,
      include: {
        offer: {
          include: {
            kit: true,
          },
        },
        customer: true,
      },
    });

    // Update kit status if payment is sent
    if (status === 'SENT' || status === 'COMPLETED') {
      await prisma.kit.update({
        where: { id: payment.offer.kitId },
        data: { status: 'PAID' },
      });
    }

    // Log activity
    let eventType: any = 'PAYMENT_INITIATED';
    let title = 'Payment Status Updated';

    if (status === 'SENT') {
      eventType = 'PAYMENT_SENT';
      title = 'Payment Sent';
    } else if (status === 'COMPLETED') {
      eventType = 'PAYMENT_COMPLETED';
      title = 'Payment Completed';
    }

    await ActivityService.logEvent({
      kitId: payment.offer.kitId,
      userId,
      type: eventType,
      title,
      description: `Payment ${payment.paymentNumber} status: ${status}`,
      metadata: { paymentId: payment.id, status },
    });

    // Send email when payment is sent
    if (status === 'SENT' && payment.customer?.email) {
      const amount = parseFloat(payment.amount.toString());
      const methodDisplay = payment.method.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      sendPaymentSentEmail(
        payment.customer.email,
        payment.paymentNumber,
        amount,
        methodDisplay,
        payment.trackingNumber ?? undefined
      ).catch(err => console.error('Failed to send payment sent email:', err));
    }

    return payment;
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
    const where: any = {};

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
