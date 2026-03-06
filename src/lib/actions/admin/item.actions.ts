'use server';

import { requireAdmin } from '@/lib/auth';
import { ItemService } from '@/lib/services/item.service';
import { serializePrismaData } from '@/lib/db/utils';
import { itemSchema, updateItemSchema, type ItemInput, type UpdateItemInput } from '@/lib/validators/item';

export interface ActionResult<T = any> {
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
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const validated = itemSchema.parse(data);
    const item = await ItemService.create(kitId, validated, session.id);

    return {
      success: true,
      data: serializePrismaData(item),
    };
  } catch (error: any) {
    console.error('Error adding item:', error);
    return {
      success: false,
      error: error.message || 'Failed to add item',
    };
  }
}

/**
 * Update item (admin only)
 */
export async function updateItem(
  itemId: string,
  data: UpdateItemInput
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const validated = updateItemSchema.parse(data);
    const item = await ItemService.update(itemId, validated, session.id);

    return {
      success: true,
      data: serializePrismaData(item),
    };
  } catch (error: any) {
    console.error('Error updating item:', error);
    return {
      success: false,
      error: error.message || 'Failed to update item',
    };
  }
}

/**
 * Delete item (admin only)
 */
export async function deleteItem(itemId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    await ItemService.delete(itemId, session.id);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete item',
    };
  }
}

/**
 * Get items for kit (admin only)
 */
export async function getKitItems(kitId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const items = await ItemService.getByKitId(kitId);

    return {
      success: true,
      data: serializePrismaData(items),
    };
  } catch (error: any) {
    console.error('Error getting items:', error);
    return {
      success: false,
      error: error.message || 'Failed to get items',
    };
  }
}
