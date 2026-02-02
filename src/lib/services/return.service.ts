import { prisma } from '@/lib/db';
import { generateReturnNumber } from '@/lib/db/utils';
import type { Return, ReturnStatus } from '@prisma/client';
import { ActivityService } from './activity.service';

export interface CreateReturnInput {
  kitId: string;
  reason?: string;
  notes?: string;
}

export class ReturnService {
  /**
   * Create a return for declined offer
   */
  static async create(data: CreateReturnInput, userId?: string): Promise<Return> {
    const returnNumber = generateReturnNumber();

    const returnRecord = await prisma.return.create({
      data: {
        kitId: data.kitId,
        returnNumber,
        reason: data.reason,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: data.kitId,
      userId,
      type: 'RETURN_REQUESTED',
      title: 'Return Requested',
      description: `Return ${returnNumber} created`,
      metadata: { returnId: returnRecord.id },
    });

    return returnRecord;
  }

  /**
   * Get return by ID
   */
  static async getById(returnId: string) {
    return prisma.return.findUnique({
      where: { id: returnId },
      include: {
        kit: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
            items: true,
          },
        },
      },
    });
  }

  /**
   * Get return by return number
   */
  static async getByReturnNumber(returnNumber: string) {
    return prisma.return.findUnique({
      where: { returnNumber },
      include: {
        kit: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update return status
   */
  static async updateStatus(
    returnId: string,
    status: ReturnStatus,
    userId?: string
  ): Promise<Return> {
    const updates: any = { status };

    // Set timestamps based on status
    if (status === 'IN_TRANSIT') {
      updates.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updates.deliveredAt = new Date();
    }

    const returnRecord = await prisma.return.update({
      where: { id: returnId },
      data: updates,
      include: {
        kit: true,
      },
    });

    // Update kit status if delivered
    if (status === 'DELIVERED') {
      await prisma.kit.update({
        where: { id: returnRecord.kitId },
        data: { status: 'RETURNED' },
      });
    }

    // Log activity
    let eventType: any = 'RETURN_REQUESTED';
    let title = 'Return Status Updated';

    if (status === 'LABEL_CREATED') {
      eventType = 'RETURN_LABEL_CREATED';
      title = 'Return Label Created';
    } else if (status === 'IN_TRANSIT') {
      eventType = 'RETURN_SHIPPED';
      title = 'Return Shipped';
    } else if (status === 'DELIVERED') {
      eventType = 'RETURN_DELIVERED';
      title = 'Return Delivered';
    }

    await ActivityService.logEvent({
      kitId: returnRecord.kitId,
      userId,
      type: eventType,
      title,
      description: `Return ${returnRecord.returnNumber} status: ${status}`,
      metadata: { returnId: returnRecord.id, status },
    });

    return returnRecord;
  }

  /**
   * Update tracking number
   */
  static async updateTracking(
    returnId: string,
    trackingNumber: string
  ): Promise<Return> {
    return prisma.return.update({
      where: { id: returnId },
      data: { trackingNumber },
    });
  }

  /**
   * Get all returns with filters
   */
  static async getAll(filters?: {
    status?: ReturnStatus;
    kitId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.kitId) {
      where.kitId = filters.kitId;
    }

    return prisma.return.findMany({
      where,
      include: {
        kit: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
