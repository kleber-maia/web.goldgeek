import type { Prisma } from '@prisma/client';

// Lists need shipment progress and PDF existence, never the PDF bytes themselves.
export const kitSummaryShipping = {
  shippingLabels: { select: { type: true, status: true, packetAccessedAt: true, shippedAt: true } },
  returns: { select: { status: true, shippedAt: true } },
  _count: {
    select: {
      shippingLabels: {
        where: { type: 'INBOUND', status: { not: 'VOIDED' }, labelData: { not: null }, NOT: { labelData: '' } },
      },
    },
  },
} satisfies Prisma.KitInclude;

export function withKitIssuance<T extends { _count: { shippingLabels: number } }>(kit: T) {
  const { _count, ...summary } = kit;
  return { ...summary, digitalKitIssued: _count.shippingLabels > 0 };
}
