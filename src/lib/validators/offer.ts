import { z } from 'zod';

export const itemBreakdownSchema = z.object({
  itemId: z.string(),
  description: z.string(),
  value: z.string(), // Stored as string to preserve decimal precision
});

export const offerSchema = z.object({
  totalValue: z.number().positive('Total value must be positive'),
  itemBreakdown: z.array(itemBreakdownSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export type OfferInput = z.infer<typeof offerSchema>;
export type ItemBreakdown = z.infer<typeof itemBreakdownSchema>;
