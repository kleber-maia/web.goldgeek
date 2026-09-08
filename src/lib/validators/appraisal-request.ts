import { z } from 'zod';
import { accountKitRequestSchema, customerProfileSchema } from './customer';

export const appraisalRequestSchema = accountKitRequestSchema.extend({
  customer: customerProfileSchema.extend({
    email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  }),
});

export type AppraisalRequestInput = z.infer<typeof appraisalRequestSchema>;
