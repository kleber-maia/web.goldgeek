'use server';

import { requireAdmin } from '@/lib/auth';
import { KitService } from '@/lib/services/kit.service';
import { serializePrismaData } from '@/lib/db/utils';
import type { KitStatus } from '@prisma/client';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all kits (admin only)
 */
export async function getAllKits(filters?: {
  status?: KitStatus;
  search?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const kits = await KitService.getAll(filters);

    return {
      success: true,
      data: serializePrismaData(kits),
    };
  } catch (error: any) {
    console.error('Error getting kits:', error);
    return {
      success: false,
      error: error.message || 'Failed to get kits',
    };
  }
}

/**
 * Get kit details (admin only)
 */
export async function getKitDetails(kitId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const kit = await KitService.getById(kitId);

    if (!kit) {
      return { success: false, error: 'Kit not found' };
    }

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: any) {
    console.error('Error getting kit details:', error);
    return {
      success: false,
      error: error.message || 'Failed to get kit details',
    };
  }
}

/**
 * Update kit status (admin only)
 */
export async function updateKitStatus(
  kitId: string,
  status: KitStatus
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const kit = await KitService.updateStatus(kitId, status, session.id);

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: any) {
    console.error('Error updating kit status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update kit status',
    };
  }
}

/**
 * Update kit notes (admin only)
 */
export async function updateKitNotes(
  kitId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const kit = await KitService.updateNotes(kitId, notes, session.id);

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: any) {
    console.error('Error updating kit notes:', error);
    return {
      success: false,
      error: error.message || 'Failed to update kit notes',
    };
  }
}

/**
 * Delete kit (admin only)
 */
export async function deleteKit(kitId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await KitService.delete(kitId);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting kit:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete kit',
    };
  }
}
