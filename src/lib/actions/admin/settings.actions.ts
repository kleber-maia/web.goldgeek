'use server';

import { requireAdmin } from '@/lib/auth';
import { SettingsService, type CompanySettingsInput } from '@/lib/services/settings.service';
import { serializePrismaData } from '@/lib/db/utils';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getCompanySettings() {
  try {
    await requireAdmin();
    const settings = await SettingsService.getCompanySettings();
    return { success: true, data: serializePrismaData(settings) };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get settings' };
  }
}

export async function saveCompanySettings(
  data: CompanySettingsInput
) {
  try {
    await requireAdmin();
    const settings = await SettingsService.upsertCompanySettings(data);
    return { success: true, data: serializePrismaData(settings) };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' };
  }
}
