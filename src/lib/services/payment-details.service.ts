import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { Prisma, PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/db';
import { addressSchema, paymentPreferencesSchema } from '@/lib/validators/customer';

const detailsSchema = z.record(z.string(), z.string());
const envelopeSchema = z.object({ version: z.literal(1), iv: z.string(), tag: z.string(), ciphertext: z.string() });
const methodSchema = paymentPreferencesSchema.shape.method;

function encryptionKey(): Buffer {
  const key = process.env.PAYMENT_DATA_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error('Secure payment storage is not configured. Please contact support.');
  return Buffer.from(key, 'hex');
}

export class PaymentDetailsService {
  static validateSnapshot(method: PaymentMethod, details: Record<string, string>): void {
    if (method === 'CHECK') {
      z.string().trim().min(1, 'The saved check payee is missing. Review payment details before sending.').parse(details.name);
      addressSchema.parse({ ...details, type: 'shipping' });
    } else this.validate(method, details);
  }

  static checkDestination(customer: { firstName: string; lastName: string }, snapshot: unknown): Record<string, string> {
    if (!customer.firstName.trim() || !customer.lastName.trim()) throw new Error('Complete your name in Settings before accepting.');
    const address = addressSchema.parse({ type: 'shipping', ...(snapshot && typeof snapshot === 'object' ? snapshot : {}) });
    return { name: `${customer.firstName} ${customer.lastName}`.trim(), street1: address.street1, street2: address.street2 || '', city: address.city, state: address.state, zipCode: address.zipCode, country: address.country };
  }

  static encrypt(details: Record<string, string>): Prisma.InputJsonObject {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(details), 'utf8'), cipher.final()]);
    return { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
  }

  static decrypt(value: unknown): Record<string, string> {
    if (value == null) return {};
    const envelope = envelopeSchema.safeParse(value);
    if (!envelope.success) return detailsSchema.parse(value);
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(envelope.data.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(envelope.data.tag, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(envelope.data.ciphertext, 'base64')), decipher.final()]);
    return detailsSchema.parse(JSON.parse(plain.toString('utf8')));
  }

  static preferences(value: unknown): { method: PaymentMethod; accountInfo: Record<string, string> } {
    const parsed = z.object({ method: methodSchema, accountInfo: z.unknown().optional() }).safeParse(value);
    return parsed.success ? { method: parsed.data.method, accountInfo: this.decrypt(parsed.data.accountInfo) } : { method: 'CHECK', accountInfo: {} };
  }

  static mask(details: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(details).map(([key, value]) => [key, key === 'bankAccount' || key === 'bankRouting' ? `****${value.slice(-4)}` : value]));
  }

  static validate(method: PaymentMethod, details: Record<string, string>): Record<string, string> {
    switch (method) {
      case 'CHECK': return {};
      case 'PAYPAL': return { paypalEmail: z.email('Save a valid PayPal email in Settings first.').parse(details.paypalEmail) };
      case 'ZELLE': {
        const destination = details.zellePhone?.trim() || '';
        if (!z.email().safeParse(destination).success && (!/^\+?[\d ()-]+$/.test(destination) || !/^\d{10,15}$/.test(destination.replace(/\D/g, '')))) throw new Error('Save a valid Zelle phone or email in Settings first.');
        return { zellePhone: destination };
      }
      case 'VENMO': return { venmoHandle: z.string().regex(/^@?[\w-]{5,30}$/, 'Save a valid Venmo handle in Settings first.').parse(details.venmoHandle) };
      case 'ACH': {
        const routing = z.string().regex(/^\d{9}$/, 'Save a nine-digit bank routing number in Settings first.').parse(details.bankRouting);
        if (routing === '000000000' || [...routing].reduce((sum, digit, i) => sum + Number(digit) * [3, 7, 1][i % 3], 0) % 10 !== 0) throw new Error('Check the bank routing number; its check digit is invalid.');
        return {
        bankRouting: routing,
        bankAccount: z.string().regex(/^\d{4,17}$/, 'Save a valid bank account number in Settings first.').parse(details.bankAccount),
        };
      }
      default: throw new Error('Choose a supported payment method.');
    }
  }

  static async save(customerId: string, method: PaymentMethod, incoming: Record<string, string>) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Customer" WHERE "id" = ${customerId} FOR UPDATE`;
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
      const previous = this.preferences(customer.paymentPreferences).accountInfo;
      const merged = { ...previous };
      for (const [key, value] of Object.entries(incoming)) {
        if (value.startsWith('****') && value === this.mask(previous)[key]) continue;
        merged[key] = value.trim();
      }
      this.validate(method, merged);
      await tx.customer.update({ where: { id: customerId }, data: { paymentPreferences: { method, accountInfo: this.encrypt(merged) } } });
      return { method, accountInfo: this.mask(merged) };
    });
  }
}
