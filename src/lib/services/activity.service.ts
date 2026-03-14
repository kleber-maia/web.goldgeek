import { prisma } from '@/lib/db';
import type { TimelineEvent, EventType } from '@prisma/client';

export interface LogEventInput {
  kitId: string;
  userId?: string;
  type: EventType;
  title: string;
  description?: string;
  metadata?: any;
}

export class ActivityService {
  /**
   * Log a timeline event
   */
  static async logEvent(data: LogEventInput): Promise<TimelineEvent> {
    return prisma.timelineEvent.create({
      data: {
        kitId: data.kitId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Get all timeline events for a kit
   */
  static async getKitTimeline(kitId: string): Promise<TimelineEvent[]> {
    return prisma.timelineEvent.findMany({
      where: { kitId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get recent events across all kits
   */
  static async getRecentEvents(limit: number = 50): Promise<TimelineEvent[]> {
    return prisma.timelineEvent.findMany({
      include: {
        kit: {
          include: {
            customer: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get events by type
   */
  static async getEventsByType(
    type: EventType,
    limit?: number
  ): Promise<TimelineEvent[]> {
    return prisma.timelineEvent.findMany({
      where: { type },
      include: {
        kit: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: limit }),
    });
  }

  /**
   * Get all events with filters and pagination
   */
  static async getAll(filters?: {
    type?: EventType;
    dateFrom?: Date;
    dateTo?: Date;
    kitId?: string;
  }, pagination?: {
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.kitId) {
      where.kitId = filters.kitId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 50;

    const [events, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        include: {
          kit: {
            include: {
              customer: true,
            },
          },
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.timelineEvent.count({ where }),
    ]);

    return { events, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Get all events for a customer's kits
   */
  static async getCustomerEvents(customerId: string, limit: number = 50): Promise<TimelineEvent[]> {
    return prisma.timelineEvent.findMany({
      where: {
        kit: {
          customerId,
        },
      },
      include: {
        kit: {
          select: {
            id: true,
            kitNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
