export const activeKitStatuses: readonly string[] = ['PENDING', 'SHIPPED', 'EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED'];
export const completedKitStatuses: readonly string[] = ['PAID', 'RETURNED', 'CANCELLED'];

export function isActionableOffer(offer: { status: string; expiresAt?: Date | string | null }, now = new Date()): boolean {
  return offer.status === 'SENT' && !!offer.expiresAt && new Date(offer.expiresAt).getTime() > now.getTime();
}

export function canPrepareDigitalKit(kit: { type: string; status: string; shippingLabels?: { type: string; status: string }[] }): boolean {
  return kit.type.toUpperCase() === 'DIGITAL' && ['PENDING', 'SHIPPED'].includes(kit.status) &&
    !kit.shippingLabels?.some(label => label.type === 'INBOUND' && ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'].includes(label.status));
}

/** The most recently sent offer wins; draft creation does not determine precedence. */
export function compareOffers(a: { sentAt?: Date | string | null; createdAt: Date | string; id?: string }, b: { sentAt?: Date | string | null; createdAt: Date | string; id?: string }) {
  return (b.sentAt ? new Date(b.sentAt).getTime() : 0) - (a.sentAt ? new Date(a.sentAt).getTime() : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id || '').localeCompare(a.id || '');
}
