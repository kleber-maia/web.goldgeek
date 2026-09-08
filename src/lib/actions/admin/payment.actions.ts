'use server';

import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { PaymentService } from '@/lib/services/payment.service';
import { serializePrismaData } from '@/lib/db/utils';
import type { PaymentMethod, PaymentStatus } from '@prisma/client';
import { buildBaseUrlFromHeaders, resolveBaseUrl } from '@/lib/url';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessPaymentInput {
  offerId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  accountInfo?: Record<string, string>;
  notes?: string;
}

export async function getPaymentDestination(paymentId: string): Promise<ActionResult<Record<string, string>>> {
  try {
    const session = await requireAdmin();
    return { success: true, data: await PaymentService.getDestination(paymentId, session.id) };
  } catch {
    return { success: false, error: 'Unable to load payout details. Check secure payment storage before sending payment.' };
  }
}

/**
 * Process payment for accepted offer (admin only)
 */
export async function processPayment(
  data: ProcessPaymentInput
) {
  try {
    const session = await requireAdmin();

    const payment = await PaymentService.create(data, session.id);

    return {
      success: true,
      data: serializePrismaData(payment),
    };
  } catch (error: unknown) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    };
  }
}

/**
 * Update payment status (admin only)
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
) {
  try {
    const session = await requireAdmin();
    const baseUrl = resolveBaseUrl(
      buildBaseUrlFromHeaders(await headers()),
      process.env.NEXT_PUBLIC_APP_URL
    );

    const payment = await PaymentService.updateStatus(
      paymentId,
      status,
      session.id,
      baseUrl
    );

    return {
      success: true,
      data: serializePrismaData(payment),
    };
  } catch (error: unknown) {
    console.error('Error updating payment status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment status',
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
) {
  try {
    await requireAdmin();

    const payment = await PaymentService.updateTracking(
      paymentId,
      trackingNumber,
      checkNumber
    );

    return {
      success: true,
      data: serializePrismaData(payment),
    };
  } catch (error: unknown) {
    console.error('Error updating payment tracking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment tracking',
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
}) {
  try {
    await requireAdmin();

    const payments = await PaymentService.getAll(filters);

    return {
      success: true,
      data: serializePrismaData(payments),
    };
  } catch (error: unknown) {
    console.error('Error getting payments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payments',
    };
  }
}

/**
 * Bulk update payment statuses (admin only)
 */
export async function bulkUpdatePaymentStatus(
  paymentIds: string[],
  status: PaymentStatus
) {
  try {
    const session = await requireAdmin();
    const baseUrl = resolveBaseUrl(
      buildBaseUrlFromHeaders(await headers()),
      process.env.NEXT_PUBLIC_APP_URL
    );

    const results = await Promise.allSettled(
      paymentIds.map((id) =>
        PaymentService.updateStatus(id, status, session.id, baseUrl)
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      data: { succeeded, failed, total: paymentIds.length },
    };
  } catch (error: unknown) {
    console.error('Error bulk updating payment status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk update payments',
    };
  }
}

/**
 * Get payment details (admin only)
 */
export async function getPaymentDetails(
  paymentId: string
) {
  try {
    await requireAdmin();

    const payment = await PaymentService.getById(paymentId);

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    return {
      success: true,
      data: serializePrismaData(payment),
    };
  } catch (error: unknown) {
    console.error('Error getting payment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment details',
    };
  }
}
