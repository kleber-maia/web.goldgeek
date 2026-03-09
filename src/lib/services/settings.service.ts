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
}

export class SettingsService {
  private static readonly ID = 'singleton';

  static async getCompanySettings(): Promise<CompanySettings | null> {
    return prisma.companySettings.findUnique({
      where: { id: this.ID },
    });
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
      },
    });
  }
}
