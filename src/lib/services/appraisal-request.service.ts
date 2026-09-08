import { prisma } from '@/lib/db';
import { appraisalRequestSchema, type AppraisalRequestInput } from '@/lib/validators/appraisal-request';
import { KitService } from './kit.service';
import { accountKitRequestSchema } from '@/lib/validators/customer';

export class AppraisalRequestService {
  static async createFromAccount(customerId: string, input: unknown) {
    const data = accountKitRequestSchema.parse(input);
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customerId} FOR UPDATE`;
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
      if (!customer.firstName.trim() || !customer.lastName.trim()) throw new Error('Add your first and last name in Settings before requesting a kit.');
      const existingAddress = await tx.address.findFirst({ where: { customerId, type: 'shipping' } });
      if (!existingAddress) await tx.address.create({ data: { ...data.shippingAddress, customerId, isDefault: true } });
      return KitService.createInTransaction(tx, { customerId, requestId: data.requestId, type: data.kitType, shippingAddress: data.shippingAddress, estimatedValue: data.estimatedValue, notes: data.notes });
    });
  }

  static async create(input: AppraisalRequestInput, authenticatedCustomerId?: string) {
    const data = appraisalRequestSchema.parse(input);
    const email = data.customer.email.toLowerCase();
    return prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
      let customer = await tx.customer.findUnique({ where: { email } });
      if (customer && customer.id !== authenticatedCustomerId) throw new Error('Please sign in to request another kit for this email address.');
      if (customer) {
        customer = await tx.customer.update({ where: { id: customer.id }, data: data.customer });
      } else {
        customer = await tx.customer.create({ data: { ...data.customer, email } });
      }
      const existingAddress = await tx.address.findFirst({ where: { customerId: customer.id, type: 'shipping' } });
      if (!existingAddress) await tx.address.create({ data: { ...data.shippingAddress, customerId: customer.id, isDefault: true } });
      const kit = await KitService.createInTransaction(tx, {
        customerId: customer.id, requestId: data.requestId, type: data.kitType,
        estimatedValue: data.estimatedValue, notes: data.notes, shippingAddress: data.shippingAddress,
      });
      return { customer, kit };
    });
  }
}
