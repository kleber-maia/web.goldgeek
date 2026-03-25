'use server';

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface BadgeCounts {
  requests: number;
  offers: number;
  payments: number;
  returns: number;
}

/**
 * Get attention-needed counts for admin navigation badges.
 * Each actionable item appears in exactly ONE badge (no double-counting).
 *
 * - requests: PENDING kits (admin needs to send kit/label)
 * - offers: kits needing evaluation + draft offers not yet sent
 * - payments: accepted offers without payment + active payments (PENDING/PROCESSING)
 * - returns: declined offers without return record + active returns (PENDING/LABEL_CREATED)
 */
export async function getAdminBadgeCounts(): Promise<BadgeCounts> {
  try {
    await requireAdmin();

    const [
      pendingKits,
      evalKits,
      draftOffers,
      unpaidOffers,
      activePayments,
      unreturned,
      activeReturns,
    ] = await Promise.all([
      // Requests: PENDING kits
      prisma.kit.count({ where: { status: 'PENDING' } }),
      // Offers: kits in EVALUATING with no offers yet
      prisma.kit.count({ where: { status: 'EVALUATING', offers: { none: {} } } }),
      // Offers: draft offers not sent
      prisma.offer.count({ where: { status: 'DRAFT' } }),
      // Payments: accepted offers without payment record
      prisma.offer.count({ where: { status: 'ACCEPTED', payment: null } }),
      // Payments: active payments needing admin processing
      prisma.payment.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      // Returns: declined offers without return record
      prisma.offer.count({ where: { status: 'DECLINED', kit: { returns: { none: {} } } } }),
      // Returns: active returns needing admin action
      prisma.return.count({ where: { status: { in: ['PENDING', 'LABEL_CREATED'] } } }),
    ]);

    return {
      requests: pendingKits,
      offers: evalKits + draftOffers,
      payments: unpaidOffers + activePayments,
      returns: unreturned + activeReturns,
    };
  } catch {
    return { requests: 0, offers: 0, payments: 0, returns: 0 };
  }
}
