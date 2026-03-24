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
 * Only counts items waiting for admin action.
 */
export async function getAdminBadgeCounts(): Promise<BadgeCounts> {
  try {
    await requireAdmin();

    const [requests, offers, payments, returns] = await Promise.all([
      // Kits in PENDING — admin hasn't sent kit/label yet
      prisma.kit.count({ where: { status: 'PENDING' } }),
      // Offers in DRAFT — admin created but hasn't sent to customer
      prisma.offer.count({ where: { status: 'DRAFT' } }),
      // Payments in PENDING or PROCESSING — admin needs to process & send
      prisma.payment.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      // Returns in PENDING or LABEL_CREATED — admin needs to create label & ship
      prisma.return.count({ where: { status: { in: ['PENDING', 'LABEL_CREATED'] } } }),
    ]);

    return { requests, offers, payments, returns };
  } catch {
    return { requests: 0, offers: 0, payments: 0, returns: 0 };
  }
}
