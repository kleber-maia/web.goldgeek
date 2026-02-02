import { z } from 'zod';

export const itemSchema = z.object({
  type: z.enum(['JEWELRY', 'COINS', 'BULLION', 'SCRAP', 'WATCHES', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  metalType: z.enum(['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM']).optional(),
  weight: z.number().positive('Weight must be positive').optional(),
  purity: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  condition: z.string().optional(),
  notes: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  estimatedValue: z.number().positive().optional(),
  finalValue: z.number().positive().optional(),
});

export const updateItemSchema = itemSchema.partial().required({ description: true });

export type ItemInput = z.infer<typeof itemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
