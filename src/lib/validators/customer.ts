import { z } from 'zod';

export const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  street1: z.string().trim().min(1, 'Street address is required').max(200),
  street2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'Enter a two-letter state code'),
  zipCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code'),
  country: z.string().trim().regex(/^US$/, 'Shipping is available within the US').default('US'),
  isDefault: z.boolean().default(false),
});

export const customerProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z.string().trim().max(30).optional(),
  companyName: z.string().trim().max(200).optional(),
});

export const paymentPreferencesSchema = z.object({
  method: z.enum(['CHECK', 'ACH', 'ZELLE', 'PAYPAL', 'VENMO']),
  accountInfo: z.object({ paypalEmail: z.string().max(254).optional(), zellePhone: z.string().max(254).optional(), bankRouting: z.string().max(30).optional(), bankAccount: z.string().max(30).optional(), venmoHandle: z.string().max(30).optional() }).optional(),
});

export const accountKitRequestSchema = z.object({
  requestId: z.string().uuid().optional(),
  kitType: z.enum(['PHYSICAL', 'DIGITAL']),
  estimatedValue: z.number().finite().min(0).max(10000000).optional(),
  notes: z.string().trim().max(2000).optional(),
  shippingAddress: addressSchema.extend({ type: z.literal('shipping') }),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
export type PaymentPreferencesInput = z.infer<typeof paymentPreferencesSchema>;
