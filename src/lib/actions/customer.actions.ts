'use server';

import { requireAuth } from '@/lib/auth';
import { CustomerService } from '@/lib/services/customer.service';
import { KitService } from '@/lib/services/kit.service';
import { OfferService } from '@/lib/services/offer.service';
import { ReturnService } from '@/lib/services/return.service';
import {
  customerProfileSchema,
  addressSchema,
  paymentPreferencesSchema,
  type CustomerProfileInput,
  type AddressInput,
  type PaymentPreferencesInput,
} from '@/lib/validators/customer';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Update customer profile
 */
export async function updateProfile(
  data: CustomerProfileInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const validated = customerProfileSchema.parse(data);
    const customer = await CustomerService.upsertProfile(session.userId, validated);

    return {
      success: true,
      data: customer,
    };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile',
    };
  }
}

/**
 * Add address
 */
export async function addAddress(data: AddressInput): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    // Get customer
    const customer = await CustomerService.getByUserId(session.userId);
    if (!customer) {
      return { success: false, error: 'Customer profile not found' };
    }

    const validated = addressSchema.parse(data);
    const address = await CustomerService.addAddress(customer.id, validated);

    return {
      success: true,
      data: address,
    };
  } catch (error: any) {
    console.error('Error adding address:', error);
    return {
      success: false,
      error: error.message || 'Failed to add address',
    };
  }
}

/**
 * Update address
 */
export async function updateAddress(
  addressId: string,
  data: Partial<AddressInput>
): Promise<ActionResult> {
  try {
    await requireAuth();

    const address = await CustomerService.updateAddress(addressId, data);

    return {
      success: true,
      data: address,
    };
  } catch (error: any) {
    console.error('Error updating address:', error);
    return {
      success: false,
      error: error.message || 'Failed to update address',
    };
  }
}

/**
 * Delete address
 */
export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    await requireAuth();

    await CustomerService.deleteAddress(addressId);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete address',
    };
  }
}

/**
 * Accept offer
 */
export async function acceptOffer(offerId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const offer = await OfferService.accept(offerId, session.userId);

    return {
      success: true,
      data: offer,
    };
  } catch (error: any) {
    console.error('Error accepting offer:', error);
    return {
      success: false,
      error: error.message || 'Failed to accept offer',
    };
  }
}

/**
 * Decline offer
 */
export async function declineOffer(offerId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const offer = await OfferService.decline(offerId, session.userId);

    // Create return for declined offer
    const offerWithKit = await OfferService.getById(offerId);
    if (offerWithKit) {
      await ReturnService.create(
        {
          kitId: offerWithKit.kitId,
          reason: 'Customer declined offer',
        },
        session.userId
      );
    }

    return {
      success: true,
      data: offer,
    };
  } catch (error: any) {
    console.error('Error declining offer:', error);
    return {
      success: false,
      error: error.message || 'Failed to decline offer',
    };
  }
}

/**
 * Update payment preferences (stored in metadata or separate table)
 */
export async function updatePaymentPreferences(
  data: PaymentPreferencesInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const validated = paymentPreferencesSchema.parse(data);

    // TODO: Store payment preferences securely
    // For now, we'll just validate and return success
    // In production, encrypt accountInfo before storing

    return {
      success: true,
      data: validated,
    };
  } catch (error: any) {
    console.error('Error updating payment preferences:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment preferences',
    };
  }
}

/**
 * Get customer kits
 */
export async function getMyKits(): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const customer = await CustomerService.getByUserId(session.userId);
    if (!customer) {
      return { success: false, error: 'Customer profile not found' };
    }

    const kits = await CustomerService.getKits(customer.id);

    return {
      success: true,
      data: kits,
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
 * Get kit details
 */
export async function getKitDetails(kitId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const kit = await KitService.getById(kitId);

    if (!kit) {
      return { success: false, error: 'Kit not found' };
    }

    // Verify ownership
    if (kit.customer.userId !== session.userId && session.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      data: kit,
    };
  } catch (error: any) {
    console.error('Error getting kit details:', error);
    return {
      success: false,
      error: error.message || 'Failed to get kit details',
    };
  }
}
