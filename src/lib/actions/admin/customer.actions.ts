'use server';

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface ActionResult<T = any> {
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
        user: true,
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
      data: customers,
    };
  } catch (error: any) {
    console.error('Error getting customers:', error);
    return {
      success: false,
      error: error.message || 'Failed to get customers',
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
        user: true,
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
      data: customer,
    };
  } catch (error: any) {
    console.error('Error getting customer:', error);
    return {
      success: false,
      error: error.message || 'Failed to get customer',
    };
  }
}
