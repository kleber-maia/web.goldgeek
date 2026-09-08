import { historyQuery, HISTORY_PAGE_SIZE, type HistoryQuery } from '@/lib/account/history';
import { activeKitStatuses, completedKitStatuses } from '@/lib/account/kit-policy';
import { prisma } from '@/lib/db';
import type { Customer, Address, KitStatus, Prisma } from '@prisma/client';
import { customerProfileSchema, addressSchema, type AddressInput, type CustomerProfileInput } from '@/lib/validators/customer';

const customerKitIncludes = {
  items: { select: { id: true, quantity: true } },
  offers: { orderBy: [{ sentAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'desc' }], where: { status: { not: 'DRAFT' } } },
  shippingLabels: { select: { type: true, status: true } },
} satisfies Prisma.KitInclude;

export class CustomerService {
  static async getDashboard(customerId: string) {
    const availableOffer = { status: 'OFFER_SENT' as const, offers: { some: { status: 'SENT' as const, expiresAt: { gt: new Date() } } } };
    const [kits, payments, actionKits, totalKits, activeKits, offersReady, earned] = await Promise.all([
      this.getKits(customerId), this.getPayments(customerId),
      prisma.kit.findMany({ where: { customerId, OR: [availableOffer, { type: 'DIGITAL', status: { in: ['PENDING', 'SHIPPED'] }, shippingLabels: { none: { type: 'INBOUND', status: { in: ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'] } } } }] }, include: customerKitIncludes, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20 }),
      prisma.kit.count({ where: { customerId } }),
      prisma.kit.count({ where: { customerId, status: { in: [...activeKitStatuses] as KitStatus[] } } }),
      prisma.kit.count({ where: { customerId, ...availableOffer } }),
      prisma.payment.aggregate({ where: { customerId, status: { in: ['SENT', 'COMPLETED'] } }, _sum: { amount: true } }),
    ]);
    return { kits, payments, actionKits, stats: { totalKits, activeKits, offersReady, totalEarned: Number(earned._sum.amount || 0) } };
  }

  /**
   * Get customer by ID
   */
  static async getById(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: true,
      },
    });
  }

  /**
   * Get customer by email
   */
  static async getByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        addresses: true,
      },
    });
  }

  /**
   * Create or update customer profile
   */
  static async upsertProfile(
    customerId: string,
    data: CustomerProfileInput
  ): Promise<Customer> {
    return prisma.customer.update({
      where: { id: customerId },
      data: customerProfileSchema.parse(data),
    });
  }

  /**
   * Add address for customer
   */
  static async addAddress(
    customerId: string,
    address: AddressInput
  ): Promise<Address> {
    const validated = addressSchema.parse(address);
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customerId} FOR UPDATE`;
      const existingDefault = await tx.address.findFirst({ where: { customerId, type: validated.type, isDefault: true } });
      const isDefault = validated.isDefault || !existingDefault;
      if (isDefault) await tx.address.updateMany({ where: { customerId, type: validated.type }, data: { isDefault: false } });
      return tx.address.create({ data: { ...validated, isDefault, customerId } });
    });
  }

  static async updateAddress(addressId: string, customerId: string, data: Partial<AddressInput>): Promise<Address> {
    const validated = addressSchema.partial().parse(data);
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customerId} FOR UPDATE`;
      const address = await tx.address.findUnique({ where: { id: addressId, customerId } });
      if (!address) throw new Error('Address not found');
      const type = validated.type || address.type;
      const existingDefault = await tx.address.findFirst({ where: { customerId, type, isDefault: true, id: { not: addressId } } });
      const isDefault = validated.isDefault ?? (address.isDefault || !existingDefault);
      if (isDefault) await tx.address.updateMany({ where: { customerId, type }, data: { isDefault: false } });
      const updated = await tx.address.update({ where: { id: addressId, customerId }, data: { ...validated, isDefault } });
      if (type !== address.type || !isDefault) {
        const previousDefault = await tx.address.findFirst({ where: { customerId, type: address.type, isDefault: true } });
        if (!previousDefault) {
          const fallback = await tx.address.findFirst({ where: { customerId, type: address.type }, orderBy: { id: 'asc' } });
          if (fallback) await tx.address.update({ where: { id: fallback.id }, data: { isDefault: true } });
        }
      }
      return updated;
    });
  }

  static async deleteAddress(addressId: string, customerId: string): Promise<void> {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customerId} FOR UPDATE`;
      const deleted = await tx.address.delete({ where: { id: addressId, customerId } });
      if (deleted.isDefault) {
        const fallback = await tx.address.findFirst({ where: { customerId, type: deleted.type }, orderBy: { id: 'asc' } });
        if (fallback) await tx.address.update({ where: { id: fallback.id }, data: { isDefault: true } });
      }
    });
  }

  /**
   * Get customer's kits
   */
  static async getKits(customerId: string, input?: HistoryQuery) {
    const query = historyQuery(input);
    return prisma.kit.findMany({
      where: { customerId, ...(input ? { kitNumber: { contains: query.q, mode: "insensitive" }, ...(query.status === "all" ? {} : { status: { in: [...(query.status === "active" ? activeKitStatuses : completedKitStatuses)] as KitStatus[] } }) } : {}) },
      ...(input ? { skip: (query.page - 1) * HISTORY_PAGE_SIZE, take: HISTORY_PAGE_SIZE + 1 } : { take: 5, skip: 0 }),
      include: customerKitIncludes,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * Get customer's payments
   */
  static async getPayments(customerId: string, page?: number) {
    return prisma.payment.findMany({
      where: { customerId },
      ...(page ? { skip: (historyQuery({ page }).page - 1) * HISTORY_PAGE_SIZE, take: HISTORY_PAGE_SIZE + 1 } : { take: 5, skip: 0 }),
      include: {
        offer: {
          include: {
            kit: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  static async getReturns(customerId: string, page = 1) {
    return prisma.return.findMany({ where: { kit: { customerId } }, include: { kit: { select: { id: true, kitNumber: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (historyQuery({ page }).page - 1) * HISTORY_PAGE_SIZE, take: HISTORY_PAGE_SIZE + 1 });
  }

  /**
   * Get all customers (for admin)
   */
  static async getAll() {
    return prisma.customer.findMany({
      include: {
        addresses: true,
        kits: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * Search customers by name or email
   */
  static async search(query: string) {
    const searchTerm = query.toLowerCase().trim();
    return prisma.customer.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        addresses: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}
