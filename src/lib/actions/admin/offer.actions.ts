'use server';

import { requireAdmin } from '@/lib/auth';
import { OfferService } from '@/lib/services/offer.service';
import { ItemService } from '@/lib/services/item.service';
import { serializePrismaData } from '@/lib/db/utils';
import { offerSchema, type OfferInput } from '@/lib/validators/offer';
import type { OfferStatus } from '@prisma/client';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generate offer from kit items (admin only)
 */
export async function generateOffer(kitId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    // Get all items for the kit
    const items = await ItemService.getByKitId(kitId);

    if (items.length === 0) {
      return { success: false, error: 'No items found for this kit' };
    }

    // Calculate total value
    const totalValue = items.reduce((total, item) => {
      const value = item.finalValue || item.estimatedValue || 0;
      return total + parseFloat(value.toString());
    }, 0);

    // Create item breakdown
    const itemBreakdown = items.map((item) => ({
      itemId: item.id,
      description: item.description,
      value: (item.finalValue || item.estimatedValue || 0).toString(),
    }));

    const offerData: OfferInput = {
      totalValue,
      itemBreakdown,
    };

    const offer = await OfferService.create(kitId, offerData, session.id);

    return {
      success: true,
      data: serializePrismaData(offer),
    };
  } catch (error: any) {
    console.error('Error generating offer:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate offer',
    };
  }
}

/**
 * Create custom offer (admin only)
 */
export async function createOffer(
  kitId: string,
  data: OfferInput
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const validated = offerSchema.parse(data);
    const offer = await OfferService.create(kitId, validated, session.id);

    return {
      success: true,
      data: serializePrismaData(offer),
    };
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return {
      success: false,
      error: error.message || 'Failed to create offer',
    };
  }
}

/**
 * Send offer to customer (admin only)
 */
export async function sendOffer(offerId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    const offer = await OfferService.send(offerId, session.id);

    return {
      success: true,
      data: serializePrismaData(offer),
    };
  } catch (error: any) {
    console.error('Error sending offer:', error);
    return {
      success: false,
      error: error.message || 'Failed to send offer',
    };
  }
}

/**
 * Update offer status (admin only)
 */
export async function updateOfferStatus(
  offerId: string,
  status: OfferStatus
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const offer = await OfferService.updateStatus(offerId, status);

    return {
      success: true,
      data: serializePrismaData(offer),
    };
  } catch (error: any) {
    console.error('Error updating offer status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update offer status',
    };
  }
}

/**
 * Get all offers (admin only)
 */
export async function getAllOffers(filters?: {
  status?: OfferStatus;
  kitId?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();

    const offers = await OfferService.getAll(filters);

    return {
      success: true,
      data: serializePrismaData(offers),
    };
  } catch (error: any) {
    console.error('Error getting offers:', error);
    return {
      success: false,
      error: error.message || 'Failed to get offers',
    };
  }
}

/**
 * Get accepted offers without payment (for Payments funnel page).
 */
export async function getAcceptedOffersWithoutPayment(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const offers = await OfferService.getAcceptedWithoutPayment();
    return { success: true, data: serializePrismaData(offers) };
  } catch (error: any) {
    console.error('Error getting unpaid offers:', error);
    return { success: false, error: error.message || 'Failed to get unpaid offers' };
  }
}

/**
 * Get declined offers without return record (for Returns funnel page).
 */
export async function getDeclinedOffersWithoutReturn(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const offers = await OfferService.getDeclinedWithoutReturn();
    return { success: true, data: serializePrismaData(offers) };
  } catch (error: any) {
    console.error('Error getting unreturned offers:', error);
    return { success: false, error: error.message || 'Failed to get unreturned offers' };
  }
}

/**
 * Get offer details (admin only)
 */
export async function getOfferDetails(offerId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const offer = await OfferService.getById(offerId);

    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    return {
      success: true,
      data: serializePrismaData(offer),
    };
  } catch (error: any) {
    console.error('Error getting offer details:', error);
    return {
      success: false,
      error: error.message || 'Failed to get offer details',
    };
  }
}
