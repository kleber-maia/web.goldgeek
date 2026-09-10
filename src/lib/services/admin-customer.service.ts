import { kitLifecycleLabel } from '@/lib/account/kit-policy';
import { z } from 'zod';
import { CustomerService } from './customer.service';
import { kitSummaryShipping, withKitIssuance } from './kit-summary';
import { customerProfileSchema } from '@/lib/validators/customer';
import { PaymentDetailsService } from '@/lib/services/payment-details.service';

import { prisma } from '@/lib/db';
import { serializePrismaData } from '@/lib/db/utils';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all customers (admin only)
 */
export async function getAllCustomers() {
  try {


    const customers = await prisma.customer.findMany({
      include: {
        addresses: true,
        kits: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: serializePrismaData(customers.map(customer => ({ ...customer, paymentPreferences: null, payments: customer.payments.map(({ accountInfo: _private, ...payment }) => payment) }))),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get customers';
    console.error('Error getting customers:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get customer by ID (admin only)
 */
export async function getCustomerById(customerId: string) {
  try {


    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: true,
        kits: {
          include: {
            items: true,
            offers: true,
            ...kitSummaryShipping,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        payments: {
          include: {
            offer: {
              include: {
                kit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    const preferences = PaymentDetailsService.preferences(customer.paymentPreferences);
    return {
      success: true,
      data: serializePrismaData({ ...customer, kits: customer.kits.map(withKitIssuance).map(kit => ({ ...kit, statusLabel: kitLifecycleLabel(kit) })), paymentPreferences: { ...preferences, accountInfo: PaymentDetailsService.mask(preferences.accountInfo) }, payments: customer.payments.map(({ accountInfo: _private, ...payment }) => payment) }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get customer';
    console.error('Error getting customer:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update customer profile (admin only)
 */
export async function updateCustomerProfile(
  customerId: string,
  data: { firstName: string; lastName: string; email: string; phone?: string }
) {
  try {


    const profile = customerProfileSchema.extend({ email: z.string().trim().toLowerCase().email().max(254) }).parse(data);
    const customer = await prisma.customer.update({ where: { id: customerId }, data: profile, select: { id: true, firstName: true, lastName: true, email: true, phone: true } });

    return { success: true, data: serializePrismaData(customer) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update customer';
    console.error('Error updating customer profile:', error);
    return { success: false, error: message };
  }
}

/**
 * Update customer address (admin only)
 * Updates existing default/first address, or creates a new one if none exists.
 */
export async function updateCustomerAddress(
  customerId: string,
  data: { street1: string; street2?: string; city: string; state: string; zipCode: string }
) {
  try {


    const existing = await prisma.address.findFirst({ where: { customerId, type: 'shipping' }, orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] });
    const address = existing
      ? await CustomerService.updateAddress(existing.id, customerId, { ...data, street2: data.street2 || '', type: 'shipping' })
      : await CustomerService.addAddress(customerId, { ...data, type: 'shipping', country: 'US', isDefault: true });
    return { success: true, data: serializePrismaData(address) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update address';
    console.error('Error updating customer address:', error);
    return { success: false, error: message };
  }
}
