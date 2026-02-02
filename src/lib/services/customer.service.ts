import { prisma } from '@/lib/db';
import type { Customer, Address } from '@prisma/client';
import type { AddressInput, CustomerProfileInput } from '@/lib/validators/customer';

export class CustomerService {
  /**
   * Get customer by user ID
   */
  static async getByUserId(userId: string) {
    return prisma.customer.findUnique({
      where: { userId },
      include: {
        user: true,
        addresses: true,
      },
    });
  }

  /**
   * Get customer by ID
   */
  static async getById(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: true,
        addresses: true,
      },
    });
  }

  /**
   * Create or update customer profile
   */
  static async upsertProfile(
    userId: string,
    data: CustomerProfileInput
  ): Promise<Customer> {
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (existingCustomer) {
      return prisma.customer.update({
        where: { id: existingCustomer.id },
        data,
      });
    }

    return prisma.customer.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  /**
   * Add address for customer
   */
  static async addAddress(
    customerId: string,
    address: AddressInput
  ): Promise<Address> {
    // If this is the default address, unset other defaults
    if (address.isDefault) {
      await prisma.address.updateMany({
        where: {
          customerId,
          type: address.type,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return prisma.address.create({
      data: {
        ...address,
        customerId,
      },
    });
  }

  /**
   * Update address
   */
  static async updateAddress(
    addressId: string,
    data: Partial<AddressInput>
  ): Promise<Address> {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          customerId: address.customerId,
          type: address.type,
          id: { not: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  /**
   * Delete address
   */
  static async deleteAddress(addressId: string): Promise<void> {
    await prisma.address.delete({
      where: { id: addressId },
    });
  }

  /**
   * Get customer's kits
   */
  static async getKits(customerId: string) {
    return prisma.kit.findMany({
      where: { customerId },
      include: {
        items: true,
        offers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get customer's payments
   */
  static async getPayments(customerId: string) {
    return prisma.payment.findMany({
      where: { customerId },
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
    });
  }
}
