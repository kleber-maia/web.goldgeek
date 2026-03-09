'use server';

import { requireAdmin } from '@/lib/auth';
import { SettingsService, type CompanySettingsInput } from '@/lib/services/settings.service';
import { serializePrismaData } from '@/lib/db/utils';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getCompanySettings(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const settings = await SettingsService.getCompanySettings();
    return { success: true, data: serializePrismaData(settings) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get settings' };
  }
}

export async function saveCompanySettings(
  data: CompanySettingsInput
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const settings = await SettingsService.upsertCompanySettings(data);
    return { success: true, data: serializePrismaData(settings) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save settings' };
  }
}
