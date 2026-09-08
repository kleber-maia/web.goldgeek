'use server';
import { requireAdmin } from '@/lib/auth';
import * as AnalyticsService from '@/lib/services/analytics.service';
export type { ActionResult, AnalyticsData } from '@/lib/services/analytics.service';

export async function getAnalytics() {
  await requireAdmin();
  return AnalyticsService.getAnalytics();
}
