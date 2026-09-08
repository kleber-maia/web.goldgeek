'use server';

import { requireAdmin } from '@/lib/auth';
import { ItemService } from '@/lib/services/item.service';
import { serializePrismaData } from '@/lib/db/utils';
import { itemSchema, updateItemSchema, type ItemInput, type UpdateItemInput } from '@/lib/validators/item';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Add item to kit (admin only)
 */
export async function addItemToKit(
  kitId: string,
  data: ItemInput
) {
  try {
    const session = await requireAdmin();

    const validated = itemSchema.parse(data);
    const item = await ItemService.create(kitId, validated, session.id);

    return {
      success: true,
      data: serializePrismaData(item),
    };
  } catch (error: unknown) {
    console.error('Error adding item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item',
    };
  }
}

/**
 * Update item (admin only)
 */
export async function updateItem(
  itemId: string,
  data: UpdateItemInput
) {
  try {
    const session = await requireAdmin();

    const validated = updateItemSchema.parse(data);
    const item = await ItemService.update(itemId, validated, session.id);

    return {
      success: true,
      data: serializePrismaData(item),
    };
  } catch (error: unknown) {
    console.error('Error updating item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item',
    };
  }
}

/**
 * Delete item (admin only)
 */
export async function deleteItem(itemId: string) {
  try {
    const session = await requireAdmin();

    await ItemService.delete(itemId, session.id);

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete item',
    };
  }
}

/**
 * Get items for kit (admin only)
 */
export async function getKitItems(kitId: string) {
  try {
    await requireAdmin();

    const items = await ItemService.getByKitId(kitId);

    return {
      success: true,
      data: serializePrismaData(items),
    };
  } catch (error: unknown) {
    console.error('Error getting items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get items',
    };
  }
}
