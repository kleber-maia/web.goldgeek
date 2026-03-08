'use server';

import { requireAdmin } from '@/lib/auth';
import { ShippingService } from '@/lib/services/shipping.service';
import { ReturnService } from '@/lib/services/return.service';
import { KitService } from '@/lib/services/kit.service';
import { FedExClient } from '@/lib/fedex/client';
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

// ---------------------------------------------------------------------------
// FedEx-specific actions
// ---------------------------------------------------------------------------

/**
 * Generate FedEx labels for a PHYSICAL kit (KIT_DELIVERY + INBOUND).
 * Returns both labels as { kitDelivery, inbound }.
 */
export async function generatePhysicalKitFedExLabels(
  kitId: string
): Promise<ActionResult<{ kitDelivery: any; inbound: any }>> {
  try {
    const session = await requireAdmin();

    const kit = await KitService.getById(kitId);
    if (!kit) return { success: false, error: 'Kit not found' };
    if (kit.type !== 'PHYSICAL') {
      return { success: false, error: 'This action is only for PHYSICAL kits' };
    }

    const customerAddress = resolveCustomerAddress(kit);
    if (!customerAddress) {
      return {
        success: false,
        error: 'No shipping address on file for this customer',
      };
    }

    const [kitDeliveryLabel, inboundLabel] =
      await ShippingService.generatePhysicalKitLabels(kitId, customerAddress, session.id);

    return {
      success: true,
      data: {
        kitDelivery: serializePrismaData(kitDeliveryLabel),
        inbound: serializePrismaData(inboundLabel),
      },
    };
  } catch (error: any) {
    console.error('Error generating physical kit FedEx labels:', error);
    return { success: false, error: error.message || 'Failed to generate labels' };
  }
}

/**
 * Generate a FedEx RETURN label for a kit (Gold Geek → customer).
 */
export async function generateReturnFedExLabel(
  kitId: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const kit = await KitService.getById(kitId);
    if (!kit) return { success: false, error: 'Kit not found' };

    const customerAddress = resolveCustomerAddress(kit);
    if (!customerAddress) {
      return {
        success: false,
        error: 'No shipping address on file for this customer',
      };
    }

    const label = await ShippingService.generateReturnLabel(
      kitId,
      customerAddress,
      session.id
    );

    // Create/update return record
    const existingReturns = await ReturnService.getAll({ kitId });
    if (existingReturns.length === 0) {
      await ReturnService.create({ kitId, notes: 'Return label created via FedEx' }, session.id);
    }
    const returns = await ReturnService.getAll({ kitId });
    if (returns.length > 0) {
      await ReturnService.updateStatus(returns[0].id, 'LABEL_CREATED', session.id);
      await ReturnService.updateTracking(returns[0].id, label.trackingNumber);
    }

    return { success: true, data: serializePrismaData(label) };
  } catch (error: any) {
    console.error('Error generating return FedEx label:', error);
    return { success: false, error: error.message || 'Failed to generate return label' };
  }
}

/**
 * Validate a customer address via FedEx Address Validation API.
 */
export async function validateAddressWithFedEx(address: {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const result = await FedExClient.validateAddress(address);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error validating address:', error);
    return { success: false, error: error.message || 'Address validation failed' };
  }
}

// ---------------------------------------------------------------------------
// Helper: resolve the best available customer address for a kit
// ---------------------------------------------------------------------------

function resolveCustomerAddress(kit: {
  shippingAddress?: unknown;
  customer: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    addresses: Array<{
      street1: string;
      street2?: string | null;
      city: string;
      state: string;
      zipCode: string;
      type: string;
      isDefault: boolean;
    }>;
  };
}): {
  name: string;
  phone?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
} | null {
  const snapshot = kit.shippingAddress as {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;

  const addr =
    snapshot ??
    kit.customer.addresses.find((a) => a.type === 'shipping' && a.isDefault) ??
    kit.customer.addresses.find((a) => a.type === 'shipping') ??
    kit.customer.addresses[0];

  if (!addr) return null;

  return {
    name: `${kit.customer.firstName} ${kit.customer.lastName}`.trim(),
    phone: kit.customer.phone ?? undefined,
    street1: addr.street1,
    street2: addr.street2 ?? undefined,
    city: addr.city,
    state: addr.state,
    zipCode: addr.zipCode,
  };
}
