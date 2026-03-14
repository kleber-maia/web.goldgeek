'use server';

import { requireAdmin } from '@/lib/auth';
import { KitService } from '@/lib/services/kit.service';
import { CustomerService } from '@/lib/services/customer.service';
import { serializePrismaData } from '@/lib/db/utils';
import { sendKitCreatedEmail } from '@/lib/email';
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
 * Update kit type (admin only)
 */
export async function updateKitType(
  kitId: string,
  type: 'PHYSICAL' | 'DIGITAL'
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const kit = await KitService.updateType(kitId, type);

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: any) {
    console.error('Error updating kit type:', error);
    return {
      success: false,
      error: error.message || 'Failed to update kit type',
    };
  }
}

/**
 * Create kit for customer (admin only)
 */
export async function createKitForCustomer(data: {
  customerId: string;
  kitType: 'PHYSICAL' | 'DIGITAL';
  estimatedValue?: number;
  notes?: string;
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const customer = await CustomerService.getById(data.customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    const kit = await KitService.create({
      customerId: data.customerId,
      type: data.kitType,
      estimatedValue: data.estimatedValue,
      notes: data.notes,
      shippingAddress: {
        street1: data.shippingAddress.street1,
        street2: data.shippingAddress.street2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        zipCode: data.shippingAddress.zipCode,
        country: 'US',
      },
    });

    // Send confirmation email to customer
    sendKitCreatedEmail(customer.email, kit.kitNumber, data.kitType).catch(err =>
      console.error('Failed to send kit created email:', err)
    );

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: any) {
    console.error('Error creating kit for customer:', error);
    return {
      success: false,
      error: error.message || 'Failed to create kit',
    };
  }
}

/**
 * Bulk update kit statuses (admin only)
 */
export async function bulkUpdateKitStatus(
  kitIds: string[],
  status: KitStatus
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const results = await Promise.allSettled(
      kitIds.map((id) => KitService.updateStatus(id, status, session.id))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      data: { succeeded, failed, total: kitIds.length },
    };
  } catch (error: any) {
    console.error('Error bulk updating kit status:', error);
    return {
      success: false,
      error: error.message || 'Failed to bulk update kits',
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
