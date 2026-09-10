export const activeKitStatuses: readonly string[] = ['PENDING', 'SHIPPED', 'EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED'];
export const completedKitStatuses: readonly string[] = ['PAID', 'RETURNED', 'CANCELLED'];

export function isActionableOffer(offer: { status: string; expiresAt?: Date | string | null } | null | undefined, now = new Date()): boolean {
  return offer?.status === 'SENT' && !!offer.expiresAt && new Date(offer.expiresAt).getTime() > now.getTime();
}

export function isPublishedOffer(offer: { status: string; sentAt?: Date | string | null }): boolean {
  return offer.status !== 'DRAFT' && !!offer.sentAt;
}

export function canPrepareDigitalKit(kit: { type: string; status: string; shippingLabels?: { type: string; status: string }[] }): boolean {
  return kit.type.toUpperCase() === 'DIGITAL' && isAwaitingCustomerShipment(kit);
}

export function isAwaitingCustomerShipment(kit: { type?: string; status: string; shippingLabels?: { type: string; status: string }[] }): boolean {
  return ['PENDING', 'SHIPPED'].includes(kit.status) &&
    !(kit.type === 'DIGITAL' && kit.status === 'SHIPPED') &&
    !kit.shippingLabels?.some(label => label.type === 'INBOUND' && ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'].includes(label.status));
}

export function canCancelCustomerKit(kit: { type?: string; status: string; shippingLabels?: { type: string; status: string }[]; shippingOperations?: { status: string }[] }): boolean {
  return isAwaitingCustomerShipment(kit) && !kit.shippingOperations?.some(operation => ['STARTED', 'UNKNOWN'].includes(operation.status));
}

export interface LifecycleKit {
  type: string;
  status: string;
  digitalKitIssued?: boolean;
  shippingLabels?: { type: string; status: string; hasDocument?: boolean; labelData?: string | null; shippedAt?: Date | string | null }[];
  returns?: { status: string; shippedAt?: Date | string | null }[];
}

export function hasIssuedDigitalKit(kit: LifecycleKit): boolean {
  return kit.type === 'DIGITAL' && (kit.digitalKitIssued ?? !!kit.shippingLabels?.some(label =>
    label.type === 'INBOUND' && label.status !== 'VOIDED' && (label.hasDocument || !!label.labelData)));
}

export function kitLifecycleLabel(kit: LifecycleKit): string {
  const labels = kit.shippingLabels?.filter(label => label.status !== 'VOIDED') || [];
  if (kit.status === 'DECLINED') {
    return labels.some(label => label.type === 'RETURN' && (label.status === 'IN_TRANSIT' || !!label.shippedAt)) ||
      kit.returns?.some(record => record.status === 'IN_TRANSIT' || !!record.shippedAt)
      ? 'In transit back to customer' : 'Waiting for return to customer';
  }
  if (['PENDING', 'SHIPPED'].includes(kit.status)) {
    if (labels.some(label => label.type === 'INBOUND' && label.status === 'DELIVERED')) return 'Waiting for appraisal';
    if (labels.some(label => label.type === 'INBOUND' && (['IN_TRANSIT', 'EXCEPTION'].includes(label.status) || !!label.shippedAt)) ||
      (kit.type === 'DIGITAL' && kit.status === 'SHIPPED')) return 'In transit to Gold Geek';
    if (kit.type === 'DIGITAL') return hasIssuedDigitalKit(kit) ? 'Waiting for Customer to pack and ship' : 'Waiting to be issued';
    if (labels.some(label => label.type === 'KIT_DELIVERY' && label.status === 'DELIVERED')) return 'Waiting for Customer to pack and ship';
    if (labels.some(label => label.type === 'KIT_DELIVERY' && (label.status === 'IN_TRANSIT' || !!label.shippedAt))) return 'In transit to Customer';
    return 'Waiting to be shipped';
  }
  const stages: Record<string, string> = {
    EVALUATING: 'Waiting for appraisal', OFFER_SENT: 'Offer sent', ACCEPTED: 'Waiting for payment',
    PAID: 'Paid', RETURNED: 'Returned', CANCELLED: 'Cancelled',
  };
  return stages[kit.status] || kit.status;
}

export function hasAccessedDigitalKit(kit: { shippingLabels?: { type: string; status: string; packetAccessedAt?: Date | string | null }[] }): boolean {
  return !!kit.shippingLabels?.some(label => label.type === 'INBOUND' && label.status === 'CREATED' && !!label.packetAccessedAt);
}

/** The most recently sent offer wins; draft creation does not determine precedence. */
export function compareOffers(a: { sentAt?: Date | string | null; createdAt: Date | string; id?: string }, b: { sentAt?: Date | string | null; createdAt: Date | string; id?: string }) {
  return (b.sentAt ? new Date(b.sentAt).getTime() : 0) - (a.sentAt ? new Date(a.sentAt).getTime() : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id || '').localeCompare(a.id || '');
}
