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
} from '@prisma/client';

export {
  UserRole,
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
    customer: {
      include: {
        user: true;
      };
    };
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
    user: true;
    addresses: true;
    kits: true;
  };
}>;

export type OfferWithRelations = Prisma.OfferGetPayload<{
  include: {
    kit: {
      include: {
        items: true;
        customer: {
          include: {
            user: true;
          };
        };
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
    customer: {
      include: {
        user: true;
      };
    };
  };
}>;
