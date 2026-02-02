import { z } from 'zod';

export const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().default('US'),
  isDefault: z.boolean().default(false),
});

export const customerProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

export const paymentPreferencesSchema = z.object({
  method: z.enum(['CHECK', 'ACH', 'ZELLE', 'PAYPAL', 'VENMO']),
  accountInfo: z.record(z.any()).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
export type PaymentPreferencesInput = z.infer<typeof paymentPreferencesSchema>;
