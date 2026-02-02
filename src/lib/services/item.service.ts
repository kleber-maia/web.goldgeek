import { prisma } from '@/lib/db';
import type { Item } from '@prisma/client';
import type { ItemInput, UpdateItemInput } from '@/lib/validators/item';
import { ActivityService } from './activity.service';

export class ItemService {
  /**
   * Add item to kit
   */
  static async create(kitId: string, data: ItemInput, userId?: string): Promise<Item> {
    const item = await prisma.item.create({
      data: {
        kitId,
        type: data.type,
        description: data.description,
        metalType: data.metalType,
        weight: data.weight,
        purity: data.purity,
        quantity: data.quantity,
        condition: data.condition,
        notes: data.notes,
        imageUrls: data.imageUrls,
        estimatedValue: data.estimatedValue,
        finalValue: data.finalValue,
      },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId,
      userId,
      type: 'ITEM_ADDED',
      title: 'Item Added',
      description: `${data.description} added to kit`,
      metadata: { itemId: item.id },
    });

    return item;
  }

  /**
   * Get item by ID
   */
  static async getById(itemId: string): Promise<Item | null> {
    return prisma.item.findUnique({
      where: { id: itemId },
    });
  }

  /**
   * Get all items for a kit
   */
  static async getByKitId(kitId: string): Promise<Item[]> {
    return prisma.item.findMany({
      where: { kitId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Update item
   */
  static async update(
    itemId: string,
    data: UpdateItemInput,
    userId?: string
  ): Promise<Item> {
    const item = await prisma.item.update({
      where: { id: itemId },
      data,
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: item.kitId,
      userId,
      type: 'ITEM_UPDATED',
      title: 'Item Updated',
      description: `${data.description || 'Item'} updated`,
      metadata: { itemId: item.id },
    });

    return item;
  }

  /**
   * Delete item
   */
  static async delete(itemId: string, userId?: string): Promise<void> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    await prisma.item.delete({
      where: { id: itemId },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: item.kitId,
      userId,
      type: 'ITEM_REMOVED',
      title: 'Item Removed',
      description: `${item.description} removed from kit`,
      metadata: { itemId },
    });
  }

  /**
   * Calculate total value of items in a kit
   */
  static async calculateKitValue(kitId: string): Promise<number> {
    const items = await prisma.item.findMany({
      where: { kitId },
    });

    return items.reduce((total, item) => {
      const value = item.finalValue || item.estimatedValue || 0;
      return total + parseFloat(value.toString());
    }, 0);
  }
}
