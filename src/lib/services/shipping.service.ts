import { prisma } from '@/lib/db';
import type { ShippingLabel, ShippingCarrier, ShippingLabelType, ShippingLabelStatus } from '@prisma/client';
import { ActivityService } from './activity.service';
import { SettingsService } from './settings.service';
import { FedExClient } from '@/lib/fedex/client';
import {
  sendKitShippedToCustomerEmail,
  sendPackageInTransitEmail,
  sendKitReceivedEmail,
  sendReturnShippedEmail,
  sendReturnDeliveredEmail,
} from '@/lib/email';

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
    const activityTypeMap: Record<string, { type: string; title: string }> = {
      INBOUND: { type: 'KIT_SENT', title: 'Inbound Label Created' },
      RETURN: { type: 'RETURN_LABEL_CREATED', title: 'Return Label Created' },
      KIT_DELIVERY: { type: 'KIT_SENT', title: 'Kit Delivery Label Created' },
    };
    const activityInfo = activityTypeMap[data.type] ?? {
      type: 'STATUS_CHANGED',
      title: 'Label Created',
    };
    await ActivityService.logEvent({
      kitId: data.kitId,
      userId,
      type: activityInfo.type as any,
      title: activityInfo.title,
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
    userId?: string,
    baseUrl?: string
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
        kit: { include: { customer: true } },
      },
    });

    const customerEmail = label.kit.customer?.email;

    // Update kit/return status based on label type and status
    if (label.type === 'KIT_DELIVERY') {
      // The kit box itself is on its way to the customer
      if (status === 'IN_TRANSIT') {
        await prisma.kit.update({
          where: { id: label.kitId },
          data: { status: 'SHIPPED', kitSentAt: new Date() },
        });
        await ActivityService.logEvent({
          kitId: label.kitId,
          userId,
          type: 'KIT_SENT',
          title: 'Kit Shipped to Customer',
          description: `Kit box shipped via FedEx: ${label.trackingNumber}`,
          metadata: { labelId: label.id },
        });

        if (customerEmail) {
          sendKitShippedToCustomerEmail(
            customerEmail,
            label.kit.kitNumber,
            label.trackingNumber,
            baseUrl
          ).catch(err => console.error('Failed to send kit shipped email:', err));
        }
      } else if (status === 'DELIVERED') {
        // Kit box arrived at customer — no separate kit status change needed
        await ActivityService.logEvent({
          kitId: label.kitId,
          userId,
          type: 'STATUS_CHANGED',
          title: 'Kit Box Delivered to Customer',
          description: `Kit box delivered: ${label.trackingNumber}`,
          metadata: { labelId: label.id },
        });
      }
    } else if (label.type === 'INBOUND') {
      if (status === 'IN_TRANSIT') {
        // Package in transit — kit stays at SHIPPED (already there from kit delivery)
        await ActivityService.logEvent({
          kitId: label.kitId,
          userId,
          type: 'PACKAGE_IN_TRANSIT',
          title: 'Package In Transit',
          description: `Package is in transit: ${label.trackingNumber}`,
          metadata: { labelId: label.id },
        });

        if (customerEmail) {
          sendPackageInTransitEmail(
            customerEmail,
            label.kit.kitNumber,
            label.trackingNumber,
            baseUrl
          ).catch(err => console.error('Failed to send package in transit email:', err));
        }
      } else if (status === 'DELIVERED') {
        // Package arrived — auto-start evaluation
        await prisma.kit.update({
          where: { id: label.kitId },
          data: {
            status: 'EVALUATING',
            receivedAt: new Date(),
            evaluationStartAt: new Date(),
          },
        });

        await ActivityService.logEvent({
          kitId: label.kitId,
          userId,
          type: 'PACKAGE_DELIVERED',
          title: 'Package Received — Evaluation Started',
          description: `Package delivered: ${label.trackingNumber}`,
          metadata: { labelId: label.id },
        });

        if (customerEmail) {
          sendKitReceivedEmail(
            customerEmail,
            label.kit.kitNumber,
            baseUrl
          ).catch(err => console.error('Failed to send kit received email:', err));
        }
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

          if (customerEmail) {
            sendReturnShippedEmail(
              customerEmail,
              label.kit.kitNumber,
              returnRecord.returnNumber,
              label.trackingNumber,
              baseUrl
            ).catch(err => console.error('Failed to send return shipped email:', err));
          }
        } else if (status === 'DELIVERED') {
          await prisma.return.update({
            where: { id: returnRecord.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date(),
            },
          });

          if (customerEmail) {
            sendReturnDeliveredEmail(
              customerEmail,
              label.kit.kitNumber,
              returnRecord.returnNumber,
              baseUrl
            ).catch(err => console.error('Failed to send return delivered email:', err));
          }
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
   * Generate a single FedEx label (INBOUND, RETURN, or KIT_DELIVERY).
   *
   * Direction matrix:
   *  INBOUND      → shipper = customer,   recipient = Gold Geek
   *  RETURN       → shipper = Gold Geek,  recipient = customer
   *  KIT_DELIVERY → shipper = Gold Geek,  recipient = customer
   */
  static async generateFedExLabel(
    kitId: string,
    type: ShippingLabelType,
    customerAddress: {
      name: string;
      phone?: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
    },
    userId?: string
  ): Promise<ShippingLabel> {
    // Load Gold Geek shipper address from DB settings
    const companySettings = await SettingsService.getCompanySettings();
    if (
      !companySettings ||
      !companySettings.street1 ||
      !companySettings.city ||
      !companySettings.state ||
      !companySettings.zipCode
    ) {
      throw new Error(
        'Company shipper address is not configured. Go to Admin → Settings to set it up.'
      );
    }

    const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
    if (!accountNumber) {
      throw new Error('FEDEX_ACCOUNT_NUMBER is not set');
    }

    const goldGeekContact = {
      name: companySettings.name,
      phone: companySettings.phone,
      company: companySettings.name,
    };
    const goldGeekAddress = {
      street1: companySettings.street1,
      street2: companySettings.street2 ?? undefined,
      city: companySettings.city,
      state: companySettings.state,
      zipCode: companySettings.zipCode,
    };

    const customerContact = {
      name: customerAddress.name,
      phone: customerAddress.phone ?? '0000000000',
    };

    // Determine shipper / recipient by label type
    const isGoldGeekSender = type === 'RETURN' || type === 'KIT_DELIVERY';

    const shipperParty = isGoldGeekSender
      ? FedExClient.buildParty(goldGeekContact, goldGeekAddress, accountNumber)
      : FedExClient.buildParty(customerContact, customerAddress);

    const recipientParty = isGoldGeekSender
      ? FedExClient.buildParty(customerContact, customerAddress)
      : FedExClient.buildParty(goldGeekContact, goldGeekAddress);

    // Kit number for reference (fetched separately to avoid circular deps)
    const kit = await prisma.kit.findUnique({
      where: { id: kitId },
      select: { kitNumber: true },
    });

    const shipRequest = {
      labelResponseOptions: 'LABEL' as const,
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipper: shipperParty,
        recipients: [recipientParty],
        serviceType: 'FEDEX_GROUND',
        packagingType: 'YOUR_PACKAGING',
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        requestedPackageLineItems: [
          {
            weight: { units: 'LB' as const, value: 1 },
            customerReferences: kit
              ? [
                  {
                    customerReferenceType: 'CUSTOMER_REFERENCE' as const,
                    value: kit.kitNumber,
                  },
                ]
              : [],
          },
        ],
        labelSpecification: {
          labelFormatType: 'COMMON2D' as const,
          imageType: 'PDF' as const,
          labelStockType: 'PAPER_85X11_TOP_HALF_LABEL',
        },
        shippingChargesPayment: {
          paymentType: 'SENDER' as const,
          payor: {
            responsibleParty: {
              accountNumber: { value: accountNumber },
            },
          },
        },
      },
    };

    // Validate the customer address before creating the shipment
    await FedExClient.validateAddress(customerAddress);

    const result = await FedExClient.createShipment(shipRequest);

    const label = await this.createLabel(
      {
        kitId,
        type,
        carrier: 'FEDEX',
        trackingNumber: result.trackingNumber,
        labelData: result.labelData,
        labelUrl: result.labelUrl,
        cost: result.cost,
        externalId: result.externalId,
        metadata: { masterTrackingNumber: result.masterTrackingNumber },
      },
      userId
    );

    // Subscribe to tracking webhook (non-fatal if it fails)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      await FedExClient.subscribeTracking(
        result.trackingNumber,
        `${appUrl}/api/webhooks/fedex`
      );
    }

    return label;
  }

  /**
   * Generate both FedEx labels for a PHYSICAL kit in one call:
   *  1. KIT_DELIVERY — Gold Geek → customer (ships the kit box)
   *  2. INBOUND      — customer → Gold Geek  (prepaid label inside the box)
   *
   * Returns [kitDeliveryLabel, inboundLabel].
   */
  static async generatePhysicalKitLabels(
    kitId: string,
    customerAddress: {
      name: string;
      phone?: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
    },
    userId?: string
  ): Promise<[ShippingLabel, ShippingLabel]> {
    const kitDeliveryLabel = await this.generateFedExLabel(
      kitId,
      'KIT_DELIVERY',
      customerAddress,
      userId
    );

    const inboundLabel = await this.generateFedExLabel(
      kitId,
      'INBOUND',
      customerAddress,
      userId
    );

    return [kitDeliveryLabel, inboundLabel];
  }

  /**
   * Generate a FedEx RETURN label (Gold Geek → customer, for declined offers).
   */
  static async generateReturnLabel(
    kitId: string,
    customerAddress: {
      name: string;
      phone?: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
    },
    userId?: string
  ): Promise<ShippingLabel> {
    return this.generateFedExLabel(kitId, 'RETURN', customerAddress, userId);
  }

  /**
   * Generate label via USPS API (not yet implemented).
   */
  static async generateUSPSLabel(
    _kitId: string,
    _type: ShippingLabelType,
    _shippingAddress: unknown
  ): Promise<ShippingLabel> {
    throw new Error('USPS API integration not yet implemented');
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
