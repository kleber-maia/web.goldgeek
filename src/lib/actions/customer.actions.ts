'use server';
import { revalidatePath } from 'next/cache';
import { historyQuery, HISTORY_PAGE_SIZE, type HistoryQuery } from '@/lib/account/history';

import { canPrepareDigitalKit, isActionableOffer, compareOffers } from '@/lib/account/kit-policy';
import { customerActivity } from '@/lib/account/customer-activity';
import { z } from 'zod';
import { requireAuth, requireCustomer } from '@/lib/auth';
import { AppraisalRequestService } from '@/lib/services/appraisal-request.service';
import { CustomerService } from '@/lib/services/customer.service';
import { KitService } from '@/lib/services/kit.service';
import { OfferService } from '@/lib/services/offer.service';
import { PaymentDetailsService } from '@/lib/services/payment-details.service';
import { SettingsService } from '@/lib/services/settings.service';
import { ShippingService } from '@/lib/services/shipping.service';
import type { NearbyFedExLocation } from '@/lib/fedex/types';
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
) {
  try {
    const session = await requireCustomer();

    const validated = customerProfileSchema.parse(data);
    const customer = await CustomerService.upsertProfile(session.id, validated);

    return {
      success: true,
      data: { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone },
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to update profile';
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
export async function addAddress(data: AddressInput) {
  try {
    const session = await requireCustomer();

    const validated = addressSchema.parse(data);
    const address = await CustomerService.addAddress(session.id, validated);

    return {
      success: true,
      data: serializePrismaData(address),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to add address';
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
) {
  try {
    const session = await requireCustomer();

    const address = await CustomerService.updateAddress(addressId, session.id, data);

    return {
      success: true,
      data: serializePrismaData(address),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to update address';
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
export async function deleteAddress(addressId: string) {
  try {
    const session = await requireCustomer();

    await CustomerService.deleteAddress(addressId, session.id);

    return {
      success: true,
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to delete address';
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
) {
  try {
    const session = await requireCustomer();

    const offer = await OfferService.accept(offerId, session.id, paymentMethod);

    return {
      success: true,
      data: { id: offer.id, status: offer.status },
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to accept offer';
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
export async function declineOffer(offerId: string) {
  try {
    const session = await requireCustomer();

    // Pass undefined for userId — session.id is a Customer ID, not a User (admin) ID.
    const offer = await OfferService.decline(offerId, session.id);

    return {
      success: true,
      data: { id: offer.id, status: offer.status },
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to decline offer';
    console.error('Error declining offer:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update payment preferences
 */
export async function updatePaymentPreferences(
  data: PaymentPreferencesInput
) {
  try {
    const session = await requireCustomer();

    const validated = paymentPreferencesSchema.parse(data);

    const saved = await PaymentDetailsService.save(session.id, validated.method, validated.accountInfo || {});
    return { success: true, data: saved };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to update payment preferences';
    console.error('Error updating payment preferences:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update kit type (PHYSICAL/DIGITAL)
 */
export async function updateKitType(
  kitId: string,
  type: 'PHYSICAL' | 'DIGITAL'
) {
  try {
    const session = await requireCustomer();

    if (type !== 'PHYSICAL' && type !== 'DIGITAL') {
      return { success: false, error: 'Invalid kit type' };
    }

    const kit = await KitService.getById(kitId);
    if (!kit) {
      return { success: false, error: 'Kit not found' };
    }

    if (kit.customerId !== session.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!['PENDING', 'SHIPPED'].includes(kit.status)) {
      return { success: false, error: 'Kit type can only be changed before shipping' };
    }

    if (kit.shippingLabels && kit.shippingLabels.length > 0) {
      return { success: false, error: 'Kit type cannot be changed after a label has been issued' };
    }

    const updated = await KitService.updateType(kitId, type);

    return {
      success: true,
      data: serializePrismaData(updated),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to update kit type';
    console.error('Error updating kit type:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get customer kits
 */
export async function getMyKits(input: HistoryQuery = {}) {
  try {
    const session = await requireCustomer();

    const kits = await CustomerService.getKits(session.id, input);

    return {
      success: true,
      hasMore: kits.length > HISTORY_PAGE_SIZE,
      data: serializePrismaData(kits.slice(0, HISTORY_PAGE_SIZE).map(kit => ({ id: kit.id, kitNumber: kit.kitNumber, type: kit.type, status: kit.status, createdAt: kit.createdAt,
        items: kit.items.map(item => ({ id: item.id, quantity: item.quantity })),
        offers: kit.offers.map(offer => ({ status: offer.status, totalValue: offer.totalValue, createdAt: offer.createdAt, sentAt: offer.sentAt, expiresAt: offer.expiresAt })),
        shippingLabels: kit.shippingLabels.map(label => ({ type: label.type, status: label.status, packetAccessedAt: label.packetAccessedAt })),
      }))),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get kits';
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
export async function getKitDetails(kitId: string) {
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
      data: serializePrismaData({
        id: kit.id, kitNumber: kit.kitNumber, type: kit.type, status: kit.status,
        createdAt: kit.createdAt, estimatedValue: kit.estimatedValue, shippingAddress: kit.shippingAddress,
        items: kit.items.map(item => ({ id: item.id, type: item.type, description: item.description, quantity: item.quantity, metalType: item.metalType, weight: item.weight, purity: item.purity, finalValue: null })),
        offers: kit.offers.filter(offer => offer.status !== 'DRAFT').map(offer => ({ id: offer.id, status: offer.status, totalValue: offer.totalValue, itemBreakdown: offer.itemBreakdown, createdAt: offer.createdAt, sentAt: offer.sentAt, expiresAt: offer.expiresAt, payment: offer.payment ? { id: offer.payment.id, method: offer.payment.method, status: offer.payment.status, amount: offer.payment.amount } : null })),
        shippingLabels: kit.shippingLabels.filter(label => label.status !== 'VOIDED').map(label => ({ id: label.id, type: label.type, carrier: label.carrier, trackingNumber: label.trackingNumber, status: label.status, createdAt: label.createdAt, packetAccessedAt: label.packetAccessedAt, shippedAt: label.shippedAt, deliveredAt: label.deliveredAt })),
        returns: kit.returns.map(item => ({ id: item.id, returnNumber: item.returnNumber, status: item.status, createdAt: item.createdAt, trackingNumber: item.trackingNumber, shippedAt: item.shippedAt, deliveredAt: item.deliveredAt })),
        timeline: kit.timeline.map(customerActivity).filter(Boolean),
      }),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get kit details';
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
  paymentDestinations: Record<string, string>;
  mailingAddress: string;
}

type OfferLike = {
  id: string;
  status: string;
  totalValue: { toString(): string };
  expiresAt?: Date | null;
  createdAt: Date;
  sentAt?: Date | null;
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
    const sortedOffers = [...offers].sort(compareOffers);
    const activeOffer = sortedOffers.find(offer => isActionableOffer(offer));

    if (!activeOffer || kit.status !== 'OFFER_SENT') {
      return { success: false, error: 'No pending offer available' };
    }

    const preferences = PaymentDetailsService.preferences(kit.customer.paymentPreferences);
    const defaultMethod = preferences.method;
    const paymentDestinations = PaymentDetailsService.mask(preferences.accountInfo);

    return {
      success: true,
      data: {
        kitId: kit.id,
        kitNumber: kit.kitNumber,
        offerId: activeOffer.id,
        offerValue: parseFloat(activeOffer.totalValue.toString()),
        offerExpiresAt: activeOffer.expiresAt?.toISOString(),
        defaultPaymentMethod: defaultMethod,
        paymentDestinations,
        mailingAddress: kit.shippingAddress ? (() => { const a = kit.shippingAddress as Record<string, string>; return [a.street1, a.street2, a.city, a.state, a.zipCode, a.country].filter(Boolean).join(', '); })() : 'Add a shipping address in Settings',
      },
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get offer summary';
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

    const inboundLabel = await ShippingService.printableInbound(kit, fromAddress);
    const trackingNumber = inboundLabel.trackingNumber;

    // Use saved company settings for the "To" address
    const companyInfo = await SettingsService.getCompanyInfo();
    const toAddress = {
      name: companyInfo.name,
      street1: companyInfo.street1,
      street2: companyInfo.street2,
      city: companyInfo.city,
      state: companyInfo.state,
      zip: companyInfo.zipCode,
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
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get shipping label data';
    console.error('Error getting shipping label data:', error);
    return {
      success: false,
      error: message,
    };
  }
}

export interface DigitalKitData {
  kitId: string;
  labelId: string;
  packetAccessedAt: string | null;
  kitNumber: string;
  trackingNumber: string;
  labelData?: string;
  kitCreatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: {
      street1: string;
      street2?: string | null;
      city: string;
      state: string;
      zip: string;
    };
  };
  company: {
    name: string;
    phone: string;
    email: string;
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zip: string;
  };
  fedexLocations: NearbyFedExLocation[];
}

/**
 * Get customer's payment history
 */
export async function getMyPayments(page = 1) {
  try {
    const session = await requireCustomer();

    const payments = await CustomerService.getPayments(session.id, historyQuery({ page }).page);

    return {
      success: true,
      hasMore: payments.length > HISTORY_PAGE_SIZE,
      data: serializePrismaData(payments.slice(0, HISTORY_PAGE_SIZE).map(payment => ({ id: payment.id, paymentNumber: payment.paymentNumber, amount: payment.amount, method: payment.method, status: payment.status, createdAt: payment.createdAt, completedAt: payment.completedAt, trackingNumber: payment.trackingNumber, checkNumber: payment.checkNumber, offer: { kit: payment.offer.kit } }))),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get payments';
    console.error('Error getting payments:', error);
    return { success: false, error: message };
  }
}

/**
 * Get customer's returns
 */
export async function getMyReturns(page = 1) {
  try {
    const session = await requireCustomer();

    const returns = await CustomerService.getReturns(session.id, historyQuery({ page }).page);

    return {
      success: true,
      hasMore: returns.length > HISTORY_PAGE_SIZE,
      data: serializePrismaData(returns.slice(0, HISTORY_PAGE_SIZE).map(item => ({ id: item.id, returnNumber: item.returnNumber, status: item.status, trackingNumber: item.trackingNumber, createdAt: item.createdAt, shippedAt: item.shippedAt, deliveredAt: item.deliveredAt, kit: item.kit }))),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get returns';
    console.error('Error getting returns:', error);
    return { success: false, error: message };
  }
}

/**
 * Create a kit from the logged-in customer dashboard
 */
export async function createKitFromAccount(data: {
  requestId?: string;
  kitType: 'PHYSICAL' | 'DIGITAL';
  estimatedValue?: number;
  notes?: string;
  shippingAddress: {
    type: 'shipping' | 'billing';
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    isDefault?: boolean;
  };
}) {
  try {
    const session = await requireCustomer();
    const kit = await AppraisalRequestService.createFromAccount(session.id, data);

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to create kit';
    console.error('Error creating kit from account:', error);
    return { success: false, error: message };
  }
}

export async function getDigitalKitData(
  kitId: string
): Promise<ActionResult<DigitalKitData>> {
  try {
    const session = await requireCustomer();

    const kit = await KitService.getById(kitId);
    if (!kit) {
      return { success: false, error: 'Kit not found' };
    }

    if (kit.customerId !== session.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!canPrepareDigitalKit(kit)) {
      return { success: false, error: 'Digital Kit documents are available only for digital kits awaiting shipment.' };
    }

    const customerName = `${kit.customer.firstName} ${kit.customer.lastName}`.trim();

    const shippingSnapshot = kit.shippingAddress as
      | { street1: string; street2?: string | null; city: string; state: string; zipCode: string }
      | null;

    const defaultAddress =
      kit.customer.addresses.find((a) => a.type === 'shipping' && a.isDefault) ||
      kit.customer.addresses.find((a) => a.type === 'shipping') ||
      kit.customer.addresses[0];

    const fromAddress = shippingSnapshot || defaultAddress;
    if (!fromAddress) {
      return { success: false, error: 'Shipping address not found' };
    }

    const inboundLabel = await ShippingService.printableInbound(kit, fromAddress);
    const trackingNumber = inboundLabel.trackingNumber;

    // Company settings
    const companyInfo = await SettingsService.getCompanyInfo();
    const company = {
      name: companyInfo.name,
      phone: companyInfo.phone,
      email: companyInfo.supportEmail || companyInfo.email,
      street1: companyInfo.street1,
      street2: companyInfo.street2,
      city: companyInfo.city,
      state: companyInfo.state,
      zip: companyInfo.zipCode,
    };

    // Location search is optional; the carrier locator link works independently.
    const fedexLocations: NearbyFedExLocation[] = [];

    return {
      success: true,
      data: {
        kitId: kit.id,
        labelId: inboundLabel.id,
        packetAccessedAt: inboundLabel.packetAccessedAt?.toISOString() ?? null,
        kitNumber: kit.kitNumber,
        trackingNumber,
        labelData: inboundLabel?.labelData ?? undefined,
        kitCreatedAt: kit.createdAt.toISOString(),
        customer: {
          firstName: kit.customer.firstName,
          lastName: kit.customer.lastName,
          email: kit.customer.email,
          phone: kit.customer.phone,
          address: {
            street1: fromAddress.street1,
            street2: fromAddress.street2 ?? null,
            city: fromAddress.city,
            state: fromAddress.state,
            zip: fromAddress.zipCode,
          },
        },
        company,
        fedexLocations,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Please check your entries." : error instanceof Error ? error.message : 'Failed to get digital kit data';
    console.error('Error getting digital kit data:', error);
    return {
      success: false,
      error: message,
    };
  }
}

export async function recordDigitalKitAccess(kitId: string, labelId: string): Promise<ActionResult<string>> {
  try {
    const session = await requireCustomer();
    const ids = z.object({ kitId: z.string().min(1).max(128), labelId: z.string().min(1).max(128) }).parse({ kitId, labelId });
    const accessedAt = await ShippingService.recordPacketAccess(ids.kitId, ids.labelId, session.id);
    revalidatePath('/account');
    revalidatePath(`/account/kit/${ids.kitId}`);
    return { success: true, data: accessedAt.toISOString() };
  } catch {
    return { success: false, error: 'We could not save your progress. Retry, or reload if your shipping label has changed.' };
  }
}

export async function applyCurrentShippingAddress(kitId: string): Promise<ActionResult> {
  try {
    const session = await requireCustomer();
    await KitService.applyProfileDestination(kitId, session.id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to change the destination.' };
  }
}
