import { z } from 'zod';
export const shippingLabelSchema = z.object({
  kitId: z.string().min(1),
  type: z.enum(['INBOUND', 'RETURN', 'KIT_DELIVERY']),
  carrier: z.enum(['FEDEX', 'USPS']),
  trackingNumber: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9 -]+$/, 'Enter the carrier tracking number'),
  labelUrl: z.url().refine(value => new URL(value).protocol === 'https:', 'Label links must use HTTPS').optional(),
  labelData: z.string().max(700000, 'The PDF must be smaller than 500 KB').optional(),
  cost: z.number().finite().nonnegative().max(10000).optional(),
  externalId: z.string().max(200).optional(),
});
