import { prisma } from '@/lib/db';
import type { CompanySettings } from '@prisma/client';

export interface CompanySettingsInput {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  supportEmail?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
}

/**
 * Resolved company info with defaults applied — safe to use anywhere.
 */
export interface CompanyInfo {
  name: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  supportEmail: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
}

const DEFAULTS: CompanyInfo = {
  name: 'Gold Geek',
  street1: '',
  street2: null,
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  supportEmail: '',
  websiteUrl: '',
  instagramUrl: '',
  facebookUrl: '',
};

export class SettingsService {
  private static readonly ID = 'singleton';

  static async getCompanySettings(): Promise<CompanySettings | null> {
    return prisma.companySettings.findUnique({
      where: { id: this.ID },
    });
  }

  /**
   * Returns company info with all defaults resolved — never null.
   * Use this everywhere instead of getCompanySettings() to avoid
   * scattering fallback logic across the codebase.
   */
  static async getCompanyInfo(): Promise<CompanyInfo> {
    try {
      const s = await this.getCompanySettings();
      if (!s) return { ...DEFAULTS };
      return {
        name: s.name || DEFAULTS.name,
        street1: s.street1 || DEFAULTS.street1,
        street2: s.street2 ?? DEFAULTS.street2,
        city: s.city || DEFAULTS.city,
        state: s.state || DEFAULTS.state,
        zipCode: s.zipCode || DEFAULTS.zipCode,
        phone: s.phone || DEFAULTS.phone,
        email: s.email || DEFAULTS.email,
        supportEmail: s.supportEmail || DEFAULTS.supportEmail,
        websiteUrl: s.websiteUrl || DEFAULTS.websiteUrl,
        instagramUrl: s.instagramUrl || DEFAULTS.instagramUrl,
        facebookUrl: s.facebookUrl || DEFAULTS.facebookUrl,
      };
    } catch {
      // New columns may not exist yet — return defaults
      return { ...DEFAULTS };
    }
  }

  static async upsertCompanySettings(
    data: CompanySettingsInput
  ): Promise<CompanySettings> {
    return prisma.companySettings.upsert({
      where: { id: this.ID },
      update: {
        name: data.name,
        street1: data.street1,
        street2: data.street2 ?? null,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email ?? null,
        supportEmail: data.supportEmail ?? null,
        websiteUrl: data.websiteUrl ?? null,
        instagramUrl: data.instagramUrl ?? null,
        facebookUrl: data.facebookUrl ?? null,
      },
      create: {
        id: this.ID,
        name: data.name,
        street1: data.street1,
        street2: data.street2 ?? null,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email ?? null,
        supportEmail: data.supportEmail ?? null,
        websiteUrl: data.websiteUrl ?? null,
        instagramUrl: data.instagramUrl ?? null,
        facebookUrl: data.facebookUrl ?? null,
      },
    });
  }
}
