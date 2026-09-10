import type { EventType } from '@prisma/client';

// Operator notes, appraisal drafts, and arbitrary event metadata are never customer content.
export const customerEventTitles: Partial<Record<EventType, string>> = {
  KIT_CREATED: 'Kit requested', KIT_SENT: 'Kit shipped', PACKAGE_IN_TRANSIT: 'Package in transit',
  PACKAGE_DELIVERED: 'Items delivered to Gold Geek — waiting for appraisal', EVALUATION_STARTED: 'Appraisal started',
  OFFER_SENT: 'Offer sent', OFFER_ACCEPTED: 'Offer accepted', OFFER_DECLINED: 'Offer declined',
  PAYMENT_INITIATED: 'Payment requested', PAYMENT_SENT: 'Payment sent', PAYMENT_COMPLETED: 'Payment completed',
  RETURN_REQUESTED: 'Return requested', RETURN_LABEL_CREATED: 'Return being prepared',
  RETURN_SHIPPED: 'Return shipped', RETURN_DELIVERED: 'Items returned',
  STATUS_CHANGED: 'Kit status updated',
};

export function customerActivity<T extends { id: string; type: EventType; createdAt: Date | string; metadata?: unknown }>(event: T) {
  let title = customerEventTitles[event.type];
  const metadata = event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
  if (event.type === 'PACKAGE_DELIVERED' && 'labelType' in metadata && metadata.labelType === 'KIT_DELIVERY') {
    title = 'Empty kit delivered — pack and ship your items';
  }
  if (event.type === 'PAYMENT_INITIATED' && event.metadata && typeof event.metadata === 'object' && 'newStatus' in event.metadata) {
    const labels: Record<string, string> = { PROCESSING: 'Payment processing', FAILED: 'Payment needs attention', PENDING: 'Payment queued' };
    const status = event.metadata.newStatus;
    title = typeof status === 'string' ? labels[status] || title : title;
  }
  if (event.type === 'STATUS_CHANGED') {
    const status = event.metadata && typeof event.metadata === 'object' && 'newStatus' in event.metadata ? event.metadata.newStatus : null;
    const labels: Record<string, string> = { CANCELLED: 'Kit cancelled', EVALUATING: 'Waiting for appraisal', SHIPPED: 'Kit shipped', RETURNED: 'Items returned' };
    title = typeof status === 'string' ? labels[status] : undefined;
    if ('milestone' in metadata) {
      const milestones: Record<string, string> = {
        DIGITAL_KIT_ISSUED: 'Digital kit issued — pack and ship your items',
        PACKET_ACCESSED: 'Digital kit opened for printing or download',
        LABEL_PREPARED: 'Shipping label prepared',
        LABEL_VOIDED: 'Shipping label withdrawn',
        RETURN_FAILED: 'Return shipment needs attention',
      };
      title = typeof metadata.milestone === 'string' ? milestones[metadata.milestone] || title : title;
      if ('labelType' in metadata && typeof metadata.labelType === 'string') {
        const directions: Record<string, string> = {
          KIT_DELIVERY: 'Empty-kit delivery label', INBOUND: 'Your shipping label to Gold Geek', RETURN: 'Return shipment label to you',
        };
        const direction = directions[metadata.labelType];
        if (direction && metadata.milestone === 'LABEL_PREPARED') title = `${direction} prepared`;
        if (direction && metadata.milestone === 'LABEL_VOIDED') {
          title = `${direction} withdrawn${metadata.labelType === 'INBOUND' ? ' — do not use this label' : ''}`;
        }
      }
    }
    if ('labelType' in metadata && typeof status === 'string' && status === 'EXCEPTION') {
      title = metadata.labelType === 'RETURN' ? 'Return shipment needs attention' : 'Shipment needs attention';
    }
  }
  return title ? { id: event.id, type: event.type, title, description: null, createdAt: event.createdAt } : null;
}
