import { addressSchema } from '@/lib/validators/customer';
import { prisma } from '@/lib/db';
import { generateKitNumber } from '@/lib/db/utils';
import type { Kit, KitStatus, KitType, Prisma } from '@prisma/client';
import { NotificationService } from './notification.service';
import { ActivityService } from './activity.service';
import { ShippingTransitionService } from './shipping-transition.service';
import { kitSummaryShipping, withKitIssuance } from './kit-summary';

export interface CreateKitInput {
  customerId: string;
  requestId?: string;
  type: KitType;
  estimatedValue?: number;
  notes?: string;
  shippingAddress: Prisma.InputJsonObject; // Address snapshot
}

export class AwaitingShipmentKitError extends Error {
  constructor(public readonly kitId: string, kitNumber: string) {
    super(`Kit ${kitNumber} is still awaiting shipment. Ship your items or cancel that kit before requesting another.`);
    this.name = 'AwaitingShipmentKitError';
  }
}

export class KitService {
  static async getAwaitingShipment(customerId: string, db: Pick<Prisma.TransactionClient, 'kit'> = prisma) {
    return db.kit.findFirst({
      where: { customerId, OR: [{ status: 'PENDING' }, { type: 'PHYSICAL', status: 'SHIPPED' }], shippingLabels: { none: { type: 'INBOUND', status: { in: ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'] } } } },
      select: { id: true, kitNumber: true, type: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  static async applyProfileDestination(kitId: string, customerId: string) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${kitId} FOR UPDATE`;
      const kit = await tx.kit.findUniqueOrThrow({ where: { id: kitId, customerId } });
      if (!['OFFER_SENT', 'DECLINED'].includes(kit.status)) throw new Error('This destination is locked. Contact support for shipping changes.');
      if (await tx.shippingLabel.findFirst({ where: { kitId, type: 'RETURN', OR: [{ status: { not: 'VOIDED' } }, { voidedAt: null }] } })) throw new Error('The return label is already being prepared. Contact support before changing the destination.');
      if (await tx.shippingOperation.findFirst({ where: { kitId, type: 'RETURN', status: { not: 'READY' } } })) throw new Error('A carrier request is in progress. Contact support.');
      const address = await tx.address.findFirst({ where: { customerId, type: 'shipping', isDefault: true } });
      if (!address) throw new Error('Save your current shipping address in Settings first.');
      const parsed = addressSchema.parse({ ...address, street2: address.street2 ?? undefined });
      await tx.kit.update({ where: { id: kitId }, data: { shippingAddress: parsed } });
      await tx.timelineEvent.create({ data: { kitId, type: 'NOTE_ADDED', title: 'Customer corrected return/check destination', description: 'The customer explicitly applied their current shipping address before payout or return label preparation.', metadata: { address: parsed } } });
      return parsed;
    });
  }

  /**
   * Create a new kit
   */
  static async create(data: CreateKitInput): Promise<Kit> {
    return prisma.$transaction(tx => this.createInTransaction(tx, data));
  }

  static async createInTransaction(tx: Prisma.TransactionClient, data: CreateKitInput): Promise<Kit> {
    await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${data.customerId} FOR UPDATE`;
    if (data.requestId) {
      const existing = await tx.kit.findUnique({ where: { requestId: data.requestId } });
      if (existing) {
        if (existing.customerId !== data.customerId) throw new Error('Invalid kit request');
        return existing;
      }
    }
    const awaiting = await this.getAwaitingShipment(data.customerId, tx);
    if (awaiting) throw new AwaitingShipmentKitError(awaiting.id, awaiting.kitNumber);
    const kit = await tx.kit.create({ data: { ...data, kitNumber: generateKitNumber() } });
    await tx.timelineEvent.create({ data: { kitId: kit.id, type: 'KIT_CREATED', title: 'Kit requested' } });
    await NotificationService.enqueue(tx, 'KIT:CREATED', kit.id, `kit:${kit.id}:created`);
    return kit;
  }

  /**
   * Get kit by ID with all relations
   */
  static async getById(kitId: string) {
    return prisma.kit.findUnique({
      where: { id: kitId },
      include: {
        customer: {
          include: {
            addresses: true,
          },
        },
        items: true,
        offers: {
          orderBy: [{ sentAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'desc' }],
          include: {
            payment: true,
          },
        },
        shippingLabels: true,
        shippingOperations: { select: { id: true, type: true, status: true, updatedAt: true } },
        returns: true,
        timeline: {
          include: {
            user: { select: { id: true, email: true } },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Get kit by kit number
   */
  static async getByKitNumber(kitNumber: string) {
    return prisma.kit.findUnique({
      where: { kitNumber },
      include: {
        customer: true,
        items: true,
        offers: true,
        timeline: {
          include: {
            user: { select: { id: true, email: true } },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Update kit status
   */
  static async updateStatus(
    kitId: string,
    status: KitStatus,
    userId?: string
  ): Promise<Kit> {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${kitId} FOR UPDATE`;
      const previous = await tx.kit.findUniqueOrThrow({ where: { id: kitId } });
      return this.transitionInTransaction(tx, previous, status, userId);
    });
  }

  static async cancelForCustomer(kitId: string, customerId: string): Promise<Kit> {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${kitId} FOR UPDATE`;
      const previous = await tx.kit.findUnique({ where: { id: kitId, customerId } });
      if (!previous) throw new Error('Kit not found');
      return this.transitionInTransaction(tx, previous, 'CANCELLED');
    });
  }

  private static async transitionInTransaction(tx: Prisma.TransactionClient, previous: Kit, status: KitStatus, userId?: string): Promise<Kit> {
    const kitId = previous.id;
    if (previous.status === status) return previous;
    const transitions: Partial<Record<KitStatus, KitStatus[]>> = { PENDING: ['SHIPPED', 'EVALUATING', 'CANCELLED'], SHIPPED: ['EVALUATING', 'CANCELLED'] };
    if (!transitions[previous.status]?.includes(status)) throw new Error('Complete the offer, payment, or return workflow to change this status.');
    const now = new Date();
    if (status === 'SHIPPED' || status === 'EVALUATING') {
      const type = status === 'SHIPPED' && previous.type === 'PHYSICAL' ? 'KIT_DELIVERY' : 'INBOUND';
      const label = await tx.shippingLabel.findFirst({ where: { kitId, type, status: { not: 'VOIDED' } }, orderBy: { createdAt: 'desc' } });
      if (!label) throw new Error(type === 'KIT_DELIVERY'
        ? 'Save the empty-kit delivery label from Gold Geek to the customer before confirming carrier pickup.'
        : 'Save the inbound label from the customer to Gold Geek before confirming carrier pickup or delivery.');
      await ShippingTransitionService.applyInTransaction(tx, label.id, status === 'SHIPPED' ? 'IN_TRANSIT' : 'DELIVERED', userId, now);
      return tx.kit.findUniqueOrThrow({ where: { id: kitId } });
    }
    if (status === 'CANCELLED') {
      if (previous.type === 'DIGITAL' && previous.status === 'SHIPPED') throw new Error('Items are already on their way. Complete the appraisal or return workflow.');
      if (await tx.shippingOperation.count({ where: { kitId, status: { in: ['STARTED', 'UNKNOWN'] } } })) throw new Error('Resolve the pending carrier request before cancelling this kit.');
      const labels = await tx.shippingLabel.findMany({ where: { kitId, status: { not: 'VOIDED' } }, select: { id: true, type: true, status: true, carrier: true } });
      if (labels.some(label => label.type === 'INBOUND' && ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'].includes(label.status))) throw new Error('Items are already on their way. Complete the appraisal or return workflow.');
      for (const label of labels.filter(label => label.status === 'CREATED')) {
        await tx.shippingLabel.update({ where: { id: label.id }, data: { status: 'VOIDED', ...(label.carrier !== 'FEDEX' ? { voidedAt: now } : {}) }, select: { id: true } });
        if (label.carrier === 'FEDEX') await NotificationService.enqueue(tx, 'CARRIER:VOID', label.id, `label:${label.id}:void`);
      }
      await tx.offer.updateMany({ where: { kitId, status: { in: ['DRAFT', 'SENT'] } }, data: { status: 'EXPIRED' } });
    }
    const kit = await tx.kit.update({ where: { id: kitId }, data: { status,
      ...(status === 'CANCELLED' ? { completedAt: now } : {}),
    } });
    await tx.timelineEvent.create({ data: { kitId, userId, type: 'STATUS_CHANGED', title: 'Status updated', metadata: { oldStatus: previous.status, newStatus: status } } });
    return kit;
  }

  /**
   * Update kit notes
   */
  static async updateNotes(
    kitId: string,
    notes: string,
    userId?: string
  ): Promise<Kit> {
    const kit = await prisma.kit.update({
      where: { id: kitId },
      data: { notes },
    });

    await ActivityService.logEvent({
      kitId,
      userId,
      type: 'NOTE_ADDED',
      title: 'Note Added',
      description: 'Notes updated for kit',
    });

    return kit;
  }

  /**
   * Get all kits with filters
   */
  static async getAll(filters?: {
    status?: KitStatus;
    customerId?: string;
    search?: string;
  }) {
    const where: Prisma.KitWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.search) {
      where.OR = [
        { kitNumber: { contains: filters.search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const kits = await prisma.kit.findMany({
      where,
      include: {
        customer: true,
        items: true,
        offers: true,
        ...kitSummaryShipping,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return kits.map(withKitIssuance);
  }

  /**
   * Update kit type (PHYSICAL/DIGITAL)
   */
  static async updateType(kitId: string, type: KitType): Promise<Kit> {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${kitId} FOR UPDATE`;
      const current = await tx.kit.findUniqueOrThrow({ where: { id: kitId } });
      if (!['PENDING', 'SHIPPED'].includes(current.status) || await tx.shippingLabel.count({ where: { kitId, status: { not: 'VOIDED' } } }) || await tx.shippingOperation.count({ where: { kitId, status: { in: ['STARTED', 'UNKNOWN'] } } })) throw new Error('Kit type cannot change after shipping preparation has started.');
      const kit = await tx.kit.update({ where: { id: kitId }, data: { type } });
      await tx.timelineEvent.create({ data: { kitId, type: 'NOTE_ADDED', title: 'Kit type changed' } });
      return kit;
    });
  }

  /**
   * Get kits awaiting evaluation (EVALUATING with no offers yet).
   * Used by the Offers funnel page to show "Ready for Eval" items.
   */
  static async getAwaitingEvaluation() {
    return prisma.kit.findMany({
      where: {
        status: 'EVALUATING',
        offers: { none: {} },
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        receivedAt: 'asc', // oldest first = FIFO
      },
    });
  }

  /**
   * Delete kit
   */
  static async delete(kitId: string): Promise<void> {
    await prisma.kit.delete({
      where: { id: kitId },
    });
  }
}
