'use server';

import { requireAuth, requireCustomer } from '@/lib/auth';
import { CustomerService } from '@/lib/services/customer.service';
import { KitService } from '@/lib/services/kit.service';
import { OfferService } from '@/lib/services/offer.service';
import { ReturnService } from '@/lib/services/return.service';
import { PaymentService } from '@/lib/services/payment.service';
import { SettingsService } from '@/lib/services/settings.service';
import { prisma } from '@/lib/db';
import { serializePrismaData } from '@/lib/db/utils';
import { PaymentMethod } from '@prisma/client';
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
    const session = await requireCustomer();

    const validated = customerProfileSchema.parse(data);
    const customer = await CustomerService.upsertProfile(session.id, validated);

    return {
      success: true,
      data: serializePrismaData(customer),
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
      data: serializePrismaData(address),
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
      data: serializePrismaData(address),
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
export async function acceptOffer(
  offerId: string,
  paymentMethod?: PaymentMethod
): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const method = paymentMethod && Object.values(PaymentMethod).includes(paymentMethod)
      ? paymentMethod
      : 'CHECK';

    const offer = await OfferService.accept(offerId, session.id);

    const existingPayment = await prisma.payment.findUnique({
      where: { offerId },
      select: { id: true },
    });

    if (!existingPayment) {
      await PaymentService.create(
        {
          offerId,
          customerId: session.id,
          amount: parseFloat(offer.totalValue.toString()),
          method,
        },
        session.id
      );
    }

    return {
      success: true,
      data: serializePrismaData(offer),
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
      data: serializePrismaData(offer),
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
      data: serializePrismaData(kits),
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
      data: serializePrismaData(kit),
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

export interface KitOfferSummary {
  kitId: string;
  kitNumber: string;
  offerId: string;
  offerValue: number;
  offerExpiresAt?: string;
  defaultPaymentMethod?: PaymentMethod;
}

type OfferLike = {
  id: string;
  status: string;
  totalValue: { toString(): string };
  expiresAt?: Date | null;
  createdAt: Date;
};

export async function getKitOfferSummary(
  kitId: string
): Promise<ActionResult<KitOfferSummary>> {
  try {
    const session = await requireCustomer();

    const kit = await KitService.getById(kitId);
    if (!kit) {
      return { success: false, error: 'Kit not found' };
    }

    if (kit.customerId !== session.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const offers = (kit.offers || []) as OfferLike[];
    const sortedOffers = [...offers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const activeOffer = sortedOffers.find((offer) => offer.status === 'SENT');

    if (!activeOffer) {
      return { success: false, error: 'No pending offer available' };
    }

    const lastPayment = await prisma.payment.findFirst({
      where: { customerId: session.id },
      orderBy: { createdAt: 'desc' },
      select: { method: true },
    });
    const allowedMethods = new Set<PaymentMethod>(['CHECK', 'PAYPAL', 'ZELLE', 'ACH']);
    const defaultMethod =
      lastPayment?.method && allowedMethods.has(lastPayment.method)
        ? lastPayment.method
        : 'CHECK';

    return {
      success: true,
      data: {
        kitId: kit.id,
        kitNumber: kit.kitNumber,
        offerId: activeOffer.id,
        offerValue: parseFloat(activeOffer.totalValue.toString()),
        offerExpiresAt: activeOffer.expiresAt?.toISOString(),
        defaultPaymentMethod: defaultMethod,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get offer summary';
    console.error('Error getting offer summary:', error);
    return {
      success: false,
      error: message,
    };
  }
}

export interface ShippingLabelData {
  kitId: string;
  kitNumber: string;
  trackingNumber: string;
  labelData?: string; // base64 PDF from FedEx API, if available
  from: {
    name?: string;
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zip: string;
  };
  to: {
    name: string;
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zip: string;
  };
}

export async function getShippingLabelData(
  kitId: string
): Promise<ActionResult<ShippingLabelData>> {
  try {
    const session = await requireCustomer();

    const kit = await KitService.getById(kitId);
    if (!kit) {
      return { success: false, error: 'Kit not found' };
    }

    if (kit.customerId !== session.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const customerName = `${kit.customer.firstName} ${kit.customer.lastName}`.trim();

    const shippingSnapshot = kit.shippingAddress as
      | {
          street1: string;
          street2?: string | null;
          city: string;
          state: string;
          zipCode: string;
        }
      | null;

    const defaultAddress =
      kit.customer.addresses.find((address) => address.type === 'shipping' && address.isDefault) ||
      kit.customer.addresses.find((address) => address.type === 'shipping') ||
      kit.customer.addresses[0];

    const fromAddress = shippingSnapshot || defaultAddress;
    if (!fromAddress) {
      return { success: false, error: 'Shipping address not found' };
    }

    const inboundLabel = kit.shippingLabels?.find((label) => label.type === 'INBOUND');
    const trackingNumber =
      inboundLabel?.trackingNumber ||
      kit.trackingNumber ||
      `7489${Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, '0')}`;

    // Use saved company settings for the "To" address; fall back to placeholder
    const companySettings = await SettingsService.getCompanySettings();
    const toAddress = companySettings && companySettings.street1
      ? {
          name: companySettings.name,
          street1: companySettings.street1,
          street2: companySettings.street2 ?? null,
          city: companySettings.city,
          state: companySettings.state,
          zip: companySettings.zipCode,
        }
      : {
          name: 'Gold Geek',
          street1: '1234 Gold Avenue',
          street2: null,
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
        };

    return {
      success: true,
      data: {
        kitId: kit.id,
        kitNumber: kit.kitNumber,
        trackingNumber,
        labelData: inboundLabel?.labelData ?? undefined,
        from: {
          name: customerName || undefined,
          street1: fromAddress.street1,
          street2: fromAddress.street2 ?? null,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zipCode,
        },
        to: toAddress,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get shipping label data';
    console.error('Error getting shipping label data:', error);
    return {
      success: false,
      error: message,
    };
  }
}
