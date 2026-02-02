import { prisma } from '@/lib/db';
import type { ShippingLabel, ShippingCarrier, ShippingLabelType, ShippingLabelStatus } from '@prisma/client';
import { ActivityService } from './activity.service';

export interface CreateShippingLabelInput {
  kitId: string;
  type: ShippingLabelType;
  carrier: ShippingCarrier;
  trackingNumber: string;
  labelUrl?: string;
  labelData?: string;
  cost?: number;
  externalId?: string;
  metadata?: any;
}

export class ShippingService {
  /**
   * Create a shipping label
   */
  static async createLabel(
    data: CreateShippingLabelInput,
    userId?: string
  ): Promise<ShippingLabel> {
    const label = await prisma.shippingLabel.create({
      data: {
        kitId: data.kitId,
        type: data.type,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        labelUrl: data.labelUrl,
        labelData: data.labelData,
        cost: data.cost,
        externalId: data.externalId,
        metadata: data.metadata,
        status: 'CREATED',
      },
    });

    // Log activity
    await ActivityService.logEvent({
      kitId: data.kitId,
      userId,
      type: data.type === 'INBOUND' ? 'KIT_SENT' : 'RETURN_LABEL_CREATED',
      title: `${data.type === 'INBOUND' ? 'Kit' : 'Return'} Label Created`,
      description: `${data.carrier} label created: ${data.trackingNumber}`,
      metadata: { labelId: label.id },
    });

    return label;
  }

  /**
   * Get label by ID
   */
  static async getById(labelId: string): Promise<ShippingLabel | null> {
    return prisma.shippingLabel.findUnique({
      where: { id: labelId },
      include: {
        kit: {
          include: {
            customer: true,
          },
        },
      },
    });
  }

  /**
   * Get labels for a kit
   */
  static async getByKitId(kitId: string): Promise<ShippingLabel[]> {
    return prisma.shippingLabel.findMany({
      where: { kitId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get label by tracking number
   */
  static async getByTrackingNumber(trackingNumber: string): Promise<ShippingLabel | null> {
    return prisma.shippingLabel.findFirst({
      where: { trackingNumber },
      include: {
        kit: true,
      },
    });
  }

  /**
   * Update label status
   */
  static async updateStatus(
    labelId: string,
    status: ShippingLabelStatus,
    userId?: string
  ): Promise<ShippingLabel> {
    const updates: any = { status };

    // Set timestamps based on status
    switch (status) {
      case 'IN_TRANSIT':
        updates.shippedAt = new Date();
        break;
      case 'DELIVERED':
        updates.deliveredAt = new Date();
        break;
      case 'VOIDED':
        updates.voidedAt = new Date();
        break;
    }

    const label = await prisma.shippingLabel.update({
      where: { id: labelId },
      data: updates,
      include: {
        kit: true,
      },
    });

    // Update kit/return status based on label type and status
    if (label.type === 'INBOUND') {
      if (status === 'IN_TRANSIT') {
        await prisma.kit.update({
          where: { id: label.kitId },
          data: { status: 'IN_TRANSIT' },
        });

        await ActivityService.logEvent({
          kitId: label.kitId,
          userId,
          type: 'PACKAGE_IN_TRANSIT',
          title: 'Package In Transit',
          description: `Package is in transit: ${label.trackingNumber}`,
          metadata: { labelId: label.id },
        });
      } else if (status === 'DELIVERED') {
        await prisma.kit.update({
          where: { id: label.kitId },
          data: {
            status: 'RECEIVED',
            receivedAt: new Date(),
          },
        });

        await ActivityService.logEvent({
          kitId: label.kitId,
          userId,
          type: 'PACKAGE_DELIVERED',
          title: 'Package Delivered',
          description: `Package delivered: ${label.trackingNumber}`,
          metadata: { labelId: label.id },
        });
      }
    } else if (label.type === 'RETURN') {
      // Update return status if exists
      const returnRecord = await prisma.return.findFirst({
        where: { kitId: label.kitId },
        orderBy: { createdAt: 'desc' },
      });

      if (returnRecord) {
        if (status === 'IN_TRANSIT') {
          await prisma.return.update({
            where: { id: returnRecord.id },
            data: {
              status: 'IN_TRANSIT',
              trackingNumber: label.trackingNumber,
              shippedAt: new Date(),
            },
          });
        } else if (status === 'DELIVERED') {
          await prisma.return.update({
            where: { id: returnRecord.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date(),
            },
          });
        }
      }
    }

    return label;
  }

  /**
   * Void a shipping label
   */
  static async voidLabel(labelId: string, userId?: string): Promise<ShippingLabel> {
    return this.updateStatus(labelId, 'VOIDED', userId);
  }

  /**
   * Generate label via FedEx API (stub - implement with actual FedEx API)
   */
  static async generateFedExLabel(
    kitId: string,
    type: ShippingLabelType,
    shippingAddress: any
  ): Promise<ShippingLabel> {
    // TODO: Implement FedEx API integration
    // This is a stub that shows the structure

    throw new Error('FedEx API integration not yet implemented');

    // Example implementation:
    // const response = await fetch('https://apis.fedex.com/ship/v1/shipments', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.FEDEX_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     // FedEx shipment request data
    //   }),
    // });
    // const data = await response.json();
    // return this.createLabel({
    //   kitId,
    //   type,
    //   carrier: 'FEDEX',
    //   trackingNumber: data.trackingNumber,
    //   labelUrl: data.labelUrl,
    //   cost: data.cost,
    //   externalId: data.shipmentId,
    //   metadata: data,
    // });
  }

  /**
   * Generate label via USPS API (stub - implement with actual USPS API)
   */
  static async generateUSPSLabel(
    kitId: string,
    type: ShippingLabelType,
    shippingAddress: any
  ): Promise<ShippingLabel> {
    // TODO: Implement USPS API integration
    // This is a stub that shows the structure

    throw new Error('USPS API integration not yet implemented');

    // Example implementation:
    // const response = await fetch('https://secure.shippingapis.com/ShippingAPI.dll', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/xml',
    //   },
    //   body: `<xml>...</xml>`, // USPS request XML
    // });
    // const data = await parseXML(await response.text());
    // return this.createLabel({
    //   kitId,
    //   type,
    //   carrier: 'USPS',
    //   trackingNumber: data.trackingNumber,
    //   labelUrl: data.labelUrl,
    //   cost: data.cost,
    //   metadata: data,
    // });
  }

  /**
   * Get all labels with filters
   */
  static async getAll(filters?: {
    type?: ShippingLabelType;
    carrier?: ShippingCarrier;
    status?: ShippingLabelStatus;
    kitId?: string;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.carrier) {
      where.carrier = filters.carrier;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.kitId) {
      where.kitId = filters.kitId;
    }

    return prisma.shippingLabel.findMany({
      where,
      include: {
        kit: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
