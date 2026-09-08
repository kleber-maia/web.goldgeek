'use server';
import { requireAdmin } from '@/lib/auth';
import * as AdminBadgeService from '@/lib/services/admin-badge.service';
export type { BadgeCounts } from '@/lib/services/admin-badge.service';

export async function getAdminBadgeCounts() {
  await requireAdmin();
  return AdminBadgeService.getAdminBadgeCounts();
}
