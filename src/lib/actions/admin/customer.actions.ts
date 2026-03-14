'use server';

import { requireAdmin } from '@/lib/auth';
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
export async function getAllCustomers(): Promise<ActionResult> {
  try {
    await requireAdmin();

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
      data: serializePrismaData(customers),
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
export async function getCustomerById(customerId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: true,
        kits: {
          include: {
            items: true,
            offers: true,
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

    return {
      success: true,
      data: serializePrismaData(customer),
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
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
      },
    });

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
): Promise<ActionResult> {
  try {
    await requireAdmin();

    // Find existing default address or first address
    const existing = await prisma.address.findFirst({
      where: { customerId },
      orderBy: { isDefault: 'desc' },
    });

    if (existing) {
      const address = await prisma.address.update({
        where: { id: existing.id },
        data: {
          street1: data.street1.trim(),
          street2: data.street2?.trim() || null,
          city: data.city.trim(),
          state: data.state.trim(),
          zipCode: data.zipCode.trim(),
        },
      });
      return { success: true, data: serializePrismaData(address) };
    } else {
      const address = await prisma.address.create({
        data: {
          street1: data.street1.trim(),
          street2: data.street2?.trim() || null,
          city: data.city.trim(),
          state: data.state.trim(),
          zipCode: data.zipCode.trim(),
          customerId,
          type: 'shipping',
          isDefault: true,
        },
      });
      return { success: true, data: serializePrismaData(address) };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update address';
    console.error('Error updating customer address:', error);
    return { success: false, error: message };
  }
}
