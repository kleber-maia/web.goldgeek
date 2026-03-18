'use server';

import { SettingsService, type CompanyInfo } from '@/lib/services/settings.service';

/**
 * Fetch company info for use in public pages, account pages, and layouts.
 * No auth required — this is non-sensitive data (name, phone, social links, etc.).
 */
export async function getPublicCompanyInfo(): Promise<CompanyInfo> {
  return SettingsService.getCompanyInfo();
}
