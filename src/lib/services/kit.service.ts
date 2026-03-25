import { prisma } from '@/lib/db';
import { generateKitNumber } from '@/lib/db/utils';
import type { Kit, KitStatus, KitType } from '@prisma/client';
import { ActivityService } from './activity.service';

export interface CreateKitInput {
  customerId: string;
  type: KitType;
  estimatedValue?: number;
  notes?: string;
  shippingAddress: any; // JSON snapshot of address
}

export class KitService {
  /**
   * Create a new kit
   */
  static async create(data: CreateKitInput): Promise<Kit> {
    const kitNumber = generateKitNumber();

    const kit = await prisma.kit.create({
      data: {
        customerId: data.customerId,
        kitNumber,
        type: data.type,
        estimatedValue: data.estimatedValue,
        notes: data.notes,
        shippingAddress: data.shippingAddress,
      },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: kit.id,
      type: 'KIT_CREATED',
      title: 'Kit Created',
      description: `${data.type} kit ${kitNumber} created`,
    });

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
          include: {
            payment: true,
          },
        },
        shippingLabels: true,
        returns: true,
        timeline: {
          include: {
            user: true,
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
            user: true,
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
    const updates: any = { status };

    // Set timestamps based on status
    switch (status) {
      case 'SHIPPED':
        updates.kitSentAt = new Date();
        break;
      case 'EVALUATING':
        updates.receivedAt = new Date();
        updates.evaluationStartAt = new Date();
        break;
      case 'PAID':
      case 'RETURNED':
      case 'CANCELLED':
        updates.completedAt = new Date();
        break;
    }

    const kit = await prisma.kit.update({
      where: { id: kitId },
      data: updates,
    });

    // Log activity
    await ActivityService.logEvent({
      kitId,
      userId,
      type: 'STATUS_CHANGED',
      title: 'Status Updated',
      description: `Kit status changed to ${status}`,
      metadata: { oldStatus: kit.status, newStatus: status },
    });

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
    const where: any = {};

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

    return prisma.kit.findMany({
      where,
      include: {
        customer: true,
        items: true,
        offers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update kit type (PHYSICAL/DIGITAL)
   */
  static async updateType(kitId: string, type: KitType): Promise<Kit> {
    const kit = await prisma.kit.update({
      where: { id: kitId },
      data: { type },
    });

    await ActivityService.logEvent({
      kitId,
      type: 'NOTE_ADDED',
      title: 'Kit Type Changed',
      description: `Kit type changed to ${type}`,
    });

    return kit;
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
