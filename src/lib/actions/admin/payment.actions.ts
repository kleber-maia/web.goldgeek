'use server';

import { requireAdmin } from '@/lib/auth';
import { PaymentService } from '@/lib/services/payment.service';
import type { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessPaymentInput {
  offerId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  accountInfo?: any;
  notes?: string;
}

/**
 * Process payment for accepted offer (admin only)
 */
export async function processPayment(
  data: ProcessPaymentInput
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const payment = await PaymentService.create(data, session.userId);

    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payment',
    };
  }
}

/**
 * Update payment status (admin only)
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const payment = await PaymentService.updateStatus(
      paymentId,
      status,
      session.userId
    );

    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment status',
    };
  }
}

/**
 * Update payment tracking (admin only)
 */
export async function updatePaymentTracking(
  paymentId: string,
  trackingNumber: string,
  checkNumber?: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const payment = await PaymentService.updateTracking(
      paymentId,
      trackingNumber,
      checkNumber
    );

    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    console.error('Error updating payment tracking:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment tracking',
    };
  }
}

/**
 * Get all payments (admin only)
 */
export async function getAllPayments(filters?: {
  status?: PaymentStatus;
  customerId?: string;
  method?: PaymentMethod;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const payments = await PaymentService.getAll(filters);

    return {
      success: true,
      data: payments,
    };
  } catch (error: any) {
    console.error('Error getting payments:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payments',
    };
  }
}

/**
 * Get payment details (admin only)
 */
export async function getPaymentDetails(
  paymentId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const payment = await PaymentService.getById(paymentId);

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    console.error('Error getting payment details:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment details',
    };
  }
}
