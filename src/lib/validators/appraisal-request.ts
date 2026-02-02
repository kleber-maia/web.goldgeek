import { z } from 'zod';
import { addressSchema } from './customer';

export const appraisalRequestSchema = z.object({
  kitType: z.enum(['PHYSICAL', 'DIGITAL']),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
  customer: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    companyName: z.string().optional(),
  }),
  shippingAddress: addressSchema,
});

export type AppraisalRequestInput = z.infer<typeof appraisalRequestSchema>;
