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
}
