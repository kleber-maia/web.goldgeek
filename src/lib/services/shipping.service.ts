import { shippingLabelSchema } from '@/lib/validators/shipping';
import { validateCarrierPdf } from '@/lib/account/digital-kit-pdf';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { ShippingLabel, ShippingCarrier, ShippingLabelType, ShippingLabelStatus, EventType } from '@prisma/client';
import { NotificationService } from './notification.service';
import { addressSchema } from '@/lib/validators/customer';
import type { FedExLabelResult, NearbyFedExLocation } from '@/lib/fedex/types';
import { SettingsService } from './settings.service';
import { FedExClient } from '@/lib/fedex/client';
import { ShippingTransitionService } from './shipping-transition.service';

export interface CreateShippingLabelInput {
  kitId: string;
  type: ShippingLabelType;
  carrier: ShippingCarrier;
  trackingNumber: string;
  labelUrl?: string;
  labelData?: string;
  cost?: number;
  externalId?: string;
  metadata?: Prisma.InputJsonValue;
}

export class ShippingService {
  static async nearbyDropOffLocations(address: { zipCode: string; state: string; city: string }): Promise<NearbyFedExLocation[]> {
    try {
      return await FedExClient.searchLocations(address.zipCode, address.state, address.city, 3);
    } catch {
      // Location suggestions are optional; keep the packet and carrier finder available.
      return [];
    }
  }

  static async recordPacketAccess(kitId: string, labelId: string, customerId: string) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${kitId} FOR UPDATE`;
      const label = await tx.shippingLabel.findFirst({
        where: { id: labelId, kitId, type: 'INBOUND', status: 'CREATED', labelData: { not: null }, NOT: { labelData: '' }, kit: { customerId, type: 'DIGITAL', status: { in: ['PENDING', 'SHIPPED'] } } },
        select: { id: true, packetAccessedAt: true },
      });
      if (!label) throw new Error('This shipping label is no longer available. Reload your kit to continue.');
      if (label.packetAccessedAt) return label.packetAccessedAt;
      const now = new Date();
      await tx.shippingLabel.update({ where: { id: label.id }, data: { packetAccessedAt: now }, select: { id: true } });
      await tx.timelineEvent.create({ data: { kitId, type: 'STATUS_CHANGED', title: 'Digital kit opened for printing or download', metadata: { labelId, milestone: 'PACKET_ACCESSED' } } });
      return now;
    });
  }

  static async printableInbound(kit: { id: string; type: string; status: string; shippingLabels: ShippingLabel[]; customer: { firstName: string; lastName: string; phone: string | null } }, address: { street1: string; street2?: string | null; city: string; state: string; zipCode: string }) {
    let label = kit.shippingLabels.filter(label => label.type === 'INBOUND' && label.status !== 'VOIDED').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (!label && kit.type === 'DIGITAL' && ['PENDING', 'SHIPPED'].includes(kit.status)) {
      label = await this.generateFedExLabel(kit.id, 'INBOUND', { ...address, street2: address.street2 ?? undefined, name: `${kit.customer.firstName} ${kit.customer.lastName}`.trim() || 'Customer', phone: kit.customer.phone ?? undefined });
    }
    if (!label?.labelData) throw new Error('Your carrier label is not ready. Please retry or contact support.');
    await validateCarrierPdf(label.labelData);
    return label;
  }

  /**
   * Create a shipping label
   */
  static async createLabel(
    data: CreateShippingLabelInput,
    userId?: string
  ): Promise<ShippingLabel> {
    data = { ...shippingLabelSchema.parse(data), metadata: data.metadata };
    if (data.labelData) await validateCarrierPdf(data.labelData);
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${data.kitId} FOR UPDATE`;
      const kit = await tx.kit.findUniqueOrThrow({ where: { id: data.kitId } });
      this.assertEligible(kit, data.type);
      if (await tx.shippingLabel.findFirst({ where: { kitId: data.kitId, type: data.type, status: 'VOIDED', carrier: 'FEDEX', voidedAt: null } })) throw new Error('Carrier cancellation is pending. Wait before creating a replacement label.');
      const existing = await tx.shippingLabel.findFirst({ where: { kitId: data.kitId, type: data.type, status: { not: 'VOIDED' } } });
      if (existing) {
        if (existing.trackingNumber !== data.trackingNumber || existing.carrier !== data.carrier) throw new Error('Void the existing label before adding a replacement.');
        const missingPdf = !existing.labelData && data.labelData;
        const missingUrl = !existing.labelUrl && data.labelUrl;
        if (missingPdf || missingUrl) {
          if (existing.status !== 'CREATED') throw new Error('A shipped label cannot be changed.');
          const updated = await tx.shippingLabel.update({ where: { id: existing.id }, data: { ...(missingPdf ? { labelData: data.labelData } : {}), ...(missingUrl ? { labelUrl: data.labelUrl } : {}) } });
          if (missingPdf && kit.type === 'DIGITAL' && data.type === 'INBOUND') {
            await tx.timelineEvent.create({ data: { kitId: kit.id, userId, type: 'STATUS_CHANGED', title: 'Digital kit issued', metadata: { labelId: existing.id, milestone: 'DIGITAL_KIT_ISSUED' } } });
          }
          return updated;
        }
        return existing;
      }
      const label = await tx.shippingLabel.create({ data: { ...data, status: 'CREATED' } });
      const eventType: EventType = data.type === 'RETURN' ? 'RETURN_LABEL_CREATED' : 'STATUS_CHANGED';
      const issued = kit.type === 'DIGITAL' && data.type === 'INBOUND' && !!data.labelData;
      await tx.timelineEvent.create({ data: { kitId: data.kitId, userId, type: eventType, title: issued ? 'Digital kit issued' : 'Shipping label prepared', metadata: { labelId: label.id, labelType: data.type, milestone: issued ? 'DIGITAL_KIT_ISSUED' : 'LABEL_PREPARED' } } });
      if (data.type === 'RETURN') {
        const record = await tx.return.findFirst({ where: { kitId: data.kitId }, orderBy: { createdAt: 'desc' } });
        if (!record) throw new Error('Create a return request before preparing its label.');
        await tx.return.update({ where: { id: record.id }, data: { status: 'LABEL_CREATED', trackingNumber: data.trackingNumber } });
      }
      await tx.shippingOperation.updateMany({ where: { id: `${data.kitId}:${data.type}` }, data: { status: 'SAVED', result: Prisma.JsonNull } });
      if (data.carrier === 'FEDEX') await NotificationService.enqueue(tx, 'CARRIER:SUBSCRIBE', label.id, `label:${label.id}:subscribe`);
      return label;
    });
  }

  private static assertEligible(kit: { status: string; type: string }, type: ShippingLabelType) {
    if (!['INBOUND', 'RETURN', 'KIT_DELIVERY'].includes(type)) throw new Error('Invalid label type');
    if (type === 'RETURN' ? kit.status !== 'DECLINED' : !['PENDING', 'SHIPPED'].includes(kit.status)) throw new Error('This kit is not eligible for this shipping label.');
    if (type === 'KIT_DELIVERY' && kit.type !== 'PHYSICAL') throw new Error('Kit delivery labels are only for physical kits.');
  }

  static async resetGeneration(kitId: string, type: ShippingLabelType, userId: string) {
    const operation = await prisma.shippingOperation.findUniqueOrThrow({ where: { id: `${kitId}:${type}` } });
    if (operation.status === 'STARTED' && operation.updatedAt.getTime() > Date.now() - 120000) throw new Error('This request is still running. Wait for it to finish.');
    if (operation.result) throw new Error('A carrier result is saved. Retry generation to recover that label.');
    await prisma.$transaction(async tx => {
      await tx.shippingOperation.update({ where: { id: operation.id, updatedAt: operation.updatedAt }, data: { status: 'READY' } });
      await tx.timelineEvent.create({ data: { kitId, userId, type: 'NOTE_ADDED', title: 'Carrier recovery reviewed', description: 'Staff confirmed no shipment exists at FedEx before allowing another creation attempt.' } });
    });
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
    _baseUrl?: string
  ): Promise<ShippingLabel> {
    if (status === 'VOIDED') return this.voidLabel(labelId, userId);
    return ShippingTransitionService.apply(labelId, status, userId);
  }

  /**
   * Void a shipping label
   */
  static async voidLabel(labelId: string, userId?: string): Promise<ShippingLabel> {
    const current = await prisma.shippingLabel.findUniqueOrThrow({ where: { id: labelId } });
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${current.kitId} FOR UPDATE`;
      const latest = await tx.shippingLabel.findUniqueOrThrow({ where: { id: labelId } });
      if (latest.status === 'VOIDED') return latest;
      if (latest.status !== 'CREATED') throw new Error('A shipped label cannot be voided here. Contact the carrier.');
      const label = await tx.shippingLabel.update({ where: { id: labelId }, data: { status: 'VOIDED', voidedAt: latest.carrier === 'FEDEX' ? null : new Date() } });
      if (latest.carrier === 'FEDEX') await NotificationService.enqueue(tx, 'CARRIER:VOID', labelId, `label:${labelId}:void`);
      await tx.timelineEvent.create({ data: { kitId: current.kitId, userId, type: 'STATUS_CHANGED', title: latest.carrier === 'FEDEX' ? 'Shipping label cancellation requested' : 'Shipping label voided', metadata: { labelId, labelType: latest.type, milestone: 'LABEL_VOIDED' } } });
      return label;
    });
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
    const initialKit = await prisma.kit.findUniqueOrThrow({ where: { id: kitId } });
    this.assertEligible(initialKit, type);
    const existing = await prisma.shippingLabel.findFirst({ where: { kitId, type, status: { not: 'VOIDED' } }, orderBy: { createdAt: 'desc' } });
    if (existing) return existing;
    const pendingVoid = await prisma.shippingLabel.findFirst({ where: { kitId, type, status: 'VOIDED', carrier: 'FEDEX', voidedAt: null } });
    if (pendingVoid) throw new Error('Carrier cancellation is pending. Wait before creating a replacement label.');
    const recovery = await prisma.shippingOperation.findUnique({ where: { id: `${kitId}:${type}` } });
    if (recovery?.result && recovery.status !== 'SAVED') {
      const result = recovery.result as unknown as FedExLabelResult;
      return this.createLabel({ kitId, type, carrier: 'FEDEX', trackingNumber: result.trackingNumber, labelData: result.labelData, labelUrl: result.labelUrl, cost: result.cost, externalId: result.externalId, metadata: { masterTrackingNumber: result.masterTrackingNumber } }, userId);
    }
    addressSchema.parse({ ...customerAddress, type: 'shipping' });
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

    // Service type per direction: valuable legs (INBOUND customer→GG, RETURN
    // GG→customer carry gold/jewelry) ship fast by air; the empty KIT_DELIVERY
    // can go Ground. Both are admin-configurable in Settings.
    const serviceType =
      type === 'KIT_DELIVERY'
        ? companySettings.fedexKitDeliveryServiceType || 'FEDEX_GROUND'
        : companySettings.fedexValuableServiceType || 'PRIORITY_OVERNIGHT';

    const shipRequest = {
      labelResponseOptions: 'LABEL' as const,
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipper: shipperParty,
        recipients: [recipientParty],
        serviceType,
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

    const validation = await FedExClient.validateAddress(customerAddress);
    if (!validation.valid) throw new Error('The carrier could not validate this address. Correct it before generating a label.');
    const operationId = `${kitId}:${type}`;
    const saved = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Kit" WHERE id = ${kitId} FOR UPDATE`;
      this.assertEligible(await tx.kit.findUniqueOrThrow({ where: { id: kitId } }), type);
      if (await tx.shippingLabel.findFirst({ where: { kitId, type, status: 'VOIDED', carrier: 'FEDEX', voidedAt: null } })) throw new Error('Carrier cancellation is pending. Wait before creating a replacement label.');
      const activeLabel = await tx.shippingLabel.findFirst({ where: { kitId, type, status: { not: 'VOIDED' } } });
      if (activeLabel) throw new Error('A label is already ready. Reload this kit to view it.');
      const operation = await tx.shippingOperation.findUnique({ where: { id: operationId } });
      if (operation?.result && operation.status !== 'SAVED') return operation.result as unknown as FedExLabelResult;
      if (operation && ['STARTED', 'UNKNOWN'].includes(operation.status)) throw new Error('A previous carrier request needs review. Check FedEx before retrying to avoid duplicate labels.');
      await tx.shippingOperation.upsert({ where: { id: operationId }, create: { id: operationId, kitId, type }, update: { status: 'STARTED', result: Prisma.JsonNull } });
      return null;
    });
    let result = saved;
    if (!result) {
      try {
        result = await FedExClient.createShipment(shipRequest);
        await prisma.shippingOperation.update({ where: { id: operationId }, data: { result: JSON.parse(JSON.stringify(result)) } });
      } catch {
        await prisma.shippingOperation.update({ where: { id: operationId }, data: { status: 'UNKNOWN' } });
        throw new Error('Carrier response was not confirmed. Staff must check FedEx before another label is created.');
      }
    }

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
    const where: Prisma.ShippingLabelWhereInput = {};

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
