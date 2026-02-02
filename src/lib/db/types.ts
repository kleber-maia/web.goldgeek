// Re-export Prisma types for convenience
export type {
  User,
  Customer,
  Address,
  Kit,
  Item,
  Offer,
  Payment,
  Return,
  ShippingLabel,
  TimelineEvent,
  MagicLink,
  CustomerMagicLink,
} from '@prisma/client';

export {
  KitType,
  KitStatus,
  ItemType,
  MetalType,
  OfferStatus,
  PaymentMethod,
  PaymentStatus,
  ReturnStatus,
  ShippingCarrier,
  ShippingLabelType,
  ShippingLabelStatus,
  EventType,
} from '@prisma/client';

// Extended types with relations
import type { Prisma } from '@prisma/client';

export type KitWithRelations = Prisma.KitGetPayload<{
  include: {
    customer: true;
    items: true;
    offers: true;
    shippingLabels: true;
    timeline: {
      include: {
        user: true;
      };
    };
  };
}>;

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: {
    addresses: true;
    kits: true;
  };
}>;

export type OfferWithRelations = Prisma.OfferGetPayload<{
  include: {
    kit: {
      include: {
        items: true;
        customer: true;
      };
    };
    payment: true;
  };
}>;

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    offer: {
      include: {
        kit: true;
      };
    };
    customer: true;
  };
}>;
