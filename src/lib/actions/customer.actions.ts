'use server';

import { requireAuth, requireCustomer } from '@/lib/auth';
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

export interface ActionResult<T = unknown> {
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
    const session = await requireCustomer();

    const validated = customerProfileSchema.parse(data);
    const customer = await CustomerService.upsertProfile(session.id, validated);

    return {
      success: true,
      data: customer,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Add address
 */
export async function addAddress(data: AddressInput): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const validated = addressSchema.parse(data);
    const address = await CustomerService.addAddress(session.id, validated);

    return {
      success: true,
      data: address,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add address';
    console.error('Error adding address:', error);
    return {
      success: false,
      error: message,
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
    await requireCustomer();

    const address = await CustomerService.updateAddress(addressId, data);

    return {
      success: true,
      data: address,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update address';
    console.error('Error updating address:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete address
 */
export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    await requireCustomer();

    await CustomerService.deleteAddress(addressId);

    return {
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete address';
    console.error('Error deleting address:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Accept offer
 */
export async function acceptOffer(offerId: string): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const offer = await OfferService.accept(offerId, session.id);

    return {
      success: true,
      data: offer,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to accept offer';
    console.error('Error accepting offer:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Decline offer
 */
export async function declineOffer(offerId: string): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const offer = await OfferService.decline(offerId, session.id);

    // Create return for declined offer
    const offerWithKit = await OfferService.getById(offerId);
    if (offerWithKit) {
      await ReturnService.create(
        {
          kitId: offerWithKit.kitId,
          reason: 'Customer declined offer',
        },
        session.id
      );
    }

    return {
      success: true,
      data: offer,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to decline offer';
    console.error('Error declining offer:', error);
    return {
      success: false,
      error: message,
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
    await requireCustomer();

    const validated = paymentPreferencesSchema.parse(data);

    // TODO: Store payment preferences securely
    // For now, we'll just validate and return success
    // In production, encrypt accountInfo before storing

    return {
      success: true,
      data: validated,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update payment preferences';
    console.error('Error updating payment preferences:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get customer kits
 */
export async function getMyKits(): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const kits = await CustomerService.getKits(session.id);

    return {
      success: true,
      data: kits,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get kits';
    console.error('Error getting kits:', error);
    return {
      success: false,
      error: message,
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

    // Verify ownership (admins can view any kit)
    if (kit.customerId !== session.id && session.type !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      data: kit,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get kit details';
    console.error('Error getting kit details:', error);
    return {
      success: false,
      error: message,
    };
  }
}
