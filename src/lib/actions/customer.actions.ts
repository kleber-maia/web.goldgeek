'use server';

import { headers } from 'next/headers';
import { requireAuth, requireCustomer } from '@/lib/auth';
import { CustomerService } from '@/lib/services/customer.service';
import { KitService } from '@/lib/services/kit.service';
import { OfferService } from '@/lib/services/offer.service';
import { ReturnService } from '@/lib/services/return.service';
import { PaymentService } from '@/lib/services/payment.service';
import { SettingsService } from '@/lib/services/settings.service';
import { ShippingService } from '@/lib/services/shipping.service';
import { FedExClient } from '@/lib/fedex/client';
import type { NearbyFedExLocation } from '@/lib/fedex/types';
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
import { sendOfferAcceptedAdminEmail, sendOfferDeclinedAdminEmail, sendKitCreatedEmail } from '@/lib/email';
import { buildBaseUrlFromHeaders, resolveBaseUrl } from '@/lib/url';

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

    // Pass undefined for userId — session.id is a Customer ID, not a User (admin) ID.
    // TimelineEvent.userId is a FK to the User table (admins only).
    const offer = await OfferService.accept(offerId, undefined);

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
        undefined
      );
    }

    // Notify admins
    const offerWithKit = await OfferService.getById(offerId);
    if (offerWithKit) {
      const adminUsers = await prisma.user.findMany({ select: { email: true } });
      const adminEmails = adminUsers.map((u) => u.email);
      if (adminEmails.length > 0) {
        const baseUrl = resolveBaseUrl(
          buildBaseUrlFromHeaders(await headers()),
          process.env.NEXT_PUBLIC_APP_URL
        );
        const customerName = offerWithKit.kit.customer
          ? `${offerWithKit.kit.customer.firstName} ${offerWithKit.kit.customer.lastName}`.trim()
          : 'Customer';
        sendOfferAcceptedAdminEmail(
          adminEmails,
          offerWithKit.offerNumber,
          offerWithKit.kit.kitNumber,
          customerName,
          parseFloat(offerWithKit.totalValue.toString()),
          baseUrl,
        ).catch(err => console.error('Failed to send offer accepted admin email:', err));
      }
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

    // Pass undefined for userId — session.id is a Customer ID, not a User (admin) ID.
    const offer = await OfferService.decline(offerId, undefined);

    // Create return for declined offer
    const offerWithKit = await OfferService.getById(offerId);
    if (offerWithKit) {
      await ReturnService.create(
        {
          kitId: offerWithKit.kitId,
          reason: 'Customer declined offer',
        },
        undefined
      );

      // Notify admins
      const adminUsers = await prisma.user.findMany({ select: { email: true } });
      const adminEmails = adminUsers.map((u) => u.email);
      if (adminEmails.length > 0) {
        const baseUrl = resolveBaseUrl(
          buildBaseUrlFromHeaders(await headers()),
          process.env.NEXT_PUBLIC_APP_URL
        );
        const customerName = offerWithKit.kit.customer
          ? `${offerWithKit.kit.customer.firstName} ${offerWithKit.kit.customer.lastName}`.trim()
          : 'Customer';
        sendOfferDeclinedAdminEmail(
          adminEmails,
          offerWithKit.offerNumber,
          offerWithKit.kit.kitNumber,
          customerName,
          baseUrl,
        ).catch(err => console.error('Failed to send offer declined admin email:', err));
      }
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
 * Update payment preferences
 */
export async function updatePaymentPreferences(
  data: PaymentPreferencesInput
): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const validated = paymentPreferencesSchema.parse(data);

    await prisma.customer.update({
      where: { id: session.id },
      data: {
        paymentPreferences: {
          method: validated.method,
          accountInfo: validated.accountInfo || {},
        },
      },
    });

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
 * Update kit type (PHYSICAL/DIGITAL)
 */
export async function updateKitType(
  kitId: string,
  type: 'PHYSICAL' | 'DIGITAL'
): Promise<ActionResult> {
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
    const message = error instanceof Error ? error.message : 'Failed to update kit type';
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

    let inboundLabel = kit.shippingLabels?.find((label) => label.type === 'INBOUND');

    // Auto-generate FedEx inbound label for digital kits when none exists
    if (!inboundLabel && kit.type === 'DIGITAL' && ['PENDING', 'SHIPPED'].includes(kit.status)) {
      const customerName = `${kit.customer.firstName} ${kit.customer.lastName}`.trim();
      const addr = shippingSnapshot || defaultAddress;
      if (addr) {
        const generated = await ShippingService.generateFedExLabel(kitId, 'INBOUND', {
          name: customerName || 'Customer',
          phone: kit.customer.phone ?? undefined,
          street1: addr.street1,
          street2: addr.street2 ?? undefined,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
        });
        inboundLabel = generated;
      }
    }

    const trackingNumber =
      inboundLabel?.trackingNumber ||
      kit.trackingNumber ||
      '';

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
    const message = error instanceof Error ? error.message : 'Failed to get shipping label data';
    console.error('Error getting shipping label data:', error);
    return {
      success: false,
      error: message,
    };
  }
}

export interface DigitalKitData {
  kitId: string;
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
export async function getMyPayments(): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const payments = await prisma.payment.findMany({
      where: { customerId: session.id },
      include: {
        offer: {
          include: {
            kit: { select: { id: true, kitNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: serializePrismaData(payments),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get payments';
    console.error('Error getting payments:', error);
    return { success: false, error: message };
  }
}

/**
 * Get customer's returns
 */
export async function getMyReturns(): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const returns = await prisma.return.findMany({
      where: {
        kit: { customerId: session.id },
      },
      include: {
        kit: { select: { id: true, kitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: serializePrismaData(returns),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get returns';
    console.error('Error getting returns:', error);
    return { success: false, error: message };
  }
}

/**
 * Create a kit from the logged-in customer dashboard
 */
export async function createKitFromAccount(data: {
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
}): Promise<ActionResult> {
  try {
    const session = await requireCustomer();

    const customer = await CustomerService.getById(session.id);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    // Add address if customer has none, or use the provided one
    const existingShipping = customer.addresses.find(
      (a) => a.type === 'shipping'
    );
    if (!existingShipping && data.shippingAddress) {
      await CustomerService.addAddress(session.id, {
        type: data.shippingAddress.type,
        street1: data.shippingAddress.street1,
        street2: data.shippingAddress.street2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        zipCode: data.shippingAddress.zipCode,
        country: data.shippingAddress.country || 'US',
        isDefault: true,
      });
    }

    const kit = await KitService.create({
      customerId: session.id,
      type: data.kitType,
      estimatedValue: data.estimatedValue,
      notes: data.notes,
      shippingAddress: {
        street1: data.shippingAddress.street1,
        street2: data.shippingAddress.street2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        zipCode: data.shippingAddress.zipCode,
        country: data.shippingAddress.country || 'US',
      },
    });

    // Send confirmation email
    if (customer.email) {
      const baseUrl = resolveBaseUrl(
        buildBaseUrlFromHeaders(await headers()),
        process.env.NEXT_PUBLIC_APP_URL
      );
      sendKitCreatedEmail(
        customer.email,
        kit.kitNumber,
        data.kitType,
        baseUrl
      ).catch(err => console.error('Failed to send kit created email:', err));
    }

    return {
      success: true,
      data: serializePrismaData(kit),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create kit';
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

    let inboundLabel = kit.shippingLabels?.find((label) => label.type === 'INBOUND');

    // Auto-generate FedEx inbound label for digital kits when none exists
    if (!inboundLabel && kit.type === 'DIGITAL' && ['PENDING', 'SHIPPED'].includes(kit.status)) {
      const addr = shippingSnapshot || defaultAddress;
      if (addr) {
        const generated = await ShippingService.generateFedExLabel(kitId, 'INBOUND', {
          name: customerName || 'Customer',
          phone: kit.customer.phone ?? undefined,
          street1: addr.street1,
          street2: addr.street2 ?? undefined,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
        });
        inboundLabel = generated;
      }
    }

    const trackingNumber = inboundLabel?.trackingNumber || kit.trackingNumber || '';

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

    // Fetch nearby FedEx locations (non-blocking)
    let fedexLocations: NearbyFedExLocation[] = [];
    try {
      fedexLocations = await FedExClient.searchLocations(
        fromAddress.zipCode,
        fromAddress.state,
        fromAddress.city,
        4
      );
    } catch (err) {
      console.error('FedEx location search failed (non-fatal):', err);
    }

    return {
      success: true,
      data: {
        kitId: kit.id,
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
    const message = error instanceof Error ? error.message : 'Failed to get digital kit data';
    console.error('Error getting digital kit data:', error);
    return {
      success: false,
      error: message,
    };
  }
}
