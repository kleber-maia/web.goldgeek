'use server';

import { requireAdmin } from '@/lib/auth';
import { ShippingService } from '@/lib/services/shipping.service';
import { ReturnService } from '@/lib/services/return.service';
import { serializePrismaData } from '@/lib/db/utils';
import type { ShippingCarrier, ShippingLabelType, ShippingLabelStatus, ReturnStatus } from '@prisma/client';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateLabelInput {
  kitId: string;
  type: ShippingLabelType;
  carrier: ShippingCarrier;
  trackingNumber: string;
  labelUrl?: string;
  labelData?: string;
  cost?: number;
}

/**
 * Create shipping label (admin only)
 */
export async function createShippingLabel(
  data: CreateLabelInput
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const label = await ShippingService.createLabel(data, session.id);

    // If this is a return label, create/update return record
    if (data.type === 'RETURN') {
      const existingReturn = await ReturnService.getAll({ kitId: data.kitId });

      if (existingReturn.length === 0) {
        await ReturnService.create(
          {
            kitId: data.kitId,
            notes: 'Return label created',
          },
          session.id
        );
      }

      // Update return status
      const returns = await ReturnService.getAll({ kitId: data.kitId });
      if (returns.length > 0) {
        await ReturnService.updateStatus(
          returns[0].id,
          'LABEL_CREATED',
          session.id
        );
        await ReturnService.updateTracking(returns[0].id, data.trackingNumber);
      }
    }

    return {
      success: true,
      data: serializePrismaData(label),
    };
  } catch (error: any) {
    console.error('Error creating shipping label:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shipping label',
    };
  }
}

/**
 * Update label status (admin only)
 */
export async function updateLabelStatus(
  labelId: string,
  status: ShippingLabelStatus
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const label = await ShippingService.updateStatus(
      labelId,
      status,
      session.id
    );

    return {
      success: true,
      data: serializePrismaData(label),
    };
  } catch (error: any) {
    console.error('Error updating label status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update label status',
    };
  }
}

/**
 * Void shipping label (admin only)
 */
export async function voidShippingLabel(labelId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const label = await ShippingService.voidLabel(labelId, session.id);

    return {
      success: true,
      data: serializePrismaData(label),
    };
  } catch (error: any) {
    console.error('Error voiding shipping label:', error);
    return {
      success: false,
      error: error.message || 'Failed to void shipping label',
    };
  }
}

/**
 * Get all shipping labels (admin only)
 */
export async function getAllShippingLabels(filters?: {
  type?: ShippingLabelType;
  carrier?: ShippingCarrier;
  status?: ShippingLabelStatus;
  kitId?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const labels = await ShippingService.getAll(filters);

    return {
      success: true,
      data: serializePrismaData(labels),
    };
  } catch (error: any) {
    console.error('Error getting shipping labels:', error);
    return {
      success: false,
      error: error.message || 'Failed to get shipping labels',
    };
  }
}

/**
 * Get all returns (admin only)
 */
export async function getAllReturns(): Promise<ActionResult> {
  try {
    await requireAdmin();

    const returns = await ReturnService.getAll();

    return {
      success: true,
      data: serializePrismaData(returns),
    };
  } catch (error: any) {
    console.error('Error getting returns:', error);
    return {
      success: false,
      error: error.message || 'Failed to get returns',
    };
  }
}

/**
 * Update return status (admin only)
 */
export async function updateReturnStatus(
  returnId: string,
  status: ReturnStatus
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const returnRecord = await ReturnService.updateStatus(
      returnId,
      status,
      session.id
    );

    return {
      success: true,
      data: serializePrismaData(returnRecord),
    };
  } catch (error: any) {
    console.error('Error updating return status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update return status',
    };
  }
}
