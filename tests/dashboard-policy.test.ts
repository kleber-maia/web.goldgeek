import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeKitStatuses, completedKitStatuses, isActionableOffer, canPrepareDigitalKit } from '../src/lib/account/kit-policy';
import { customerActivity } from '../src/lib/account/customer-activity';

test('active and completed groups cover every lifecycle status without overlap', () => {
  assert.deepEqual([...activeKitStatuses, ...completedKitStatuses].sort(), ['PENDING', 'SHIPPED', 'EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED', 'PAID', 'RETURNED', 'CANCELLED'].sort());
  assert.equal(new Set([...activeKitStatuses, ...completedKitStatuses]).size, 9);
});

test('offer actions stop at the deadline and never show drafts or expired offers', () => {
  const now = new Date('2026-09-08T12:00:00Z');
  assert.equal(isActionableOffer({ status: 'SENT', expiresAt: new Date(now.getTime() + 1) }, now), true);
  for (const status of ['DRAFT', 'EXPIRED', 'ACCEPTED', 'DECLINED']) assert.equal(isActionableOffer({ status, expiresAt: new Date(now.getTime() + 1) }, now), false);
  for (const expiresAt of [null, now, new Date(0), 'invalid']) assert.equal(isActionableOffer({ status: 'SENT', expiresAt }, now), false);
});

test('digital preparation remains available for unshipped labels only', () => {
  const kit = { type: 'DIGITAL', status: 'PENDING' };
  assert.equal(canPrepareDigitalKit(kit), true);
  assert.equal(canPrepareDigitalKit({ ...kit, shippingLabels: [{ type: 'INBOUND', status: 'CREATED' }] }), true);
  assert.equal(canPrepareDigitalKit({ ...kit, type: 'PHYSICAL' }), false);
  for (const status of ['EVALUATING', 'ACCEPTED', 'CANCELLED', 'RETURNED']) assert.equal(canPrepareDigitalKit({ ...kit, status }), false);
  for (const status of ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION']) assert.equal(canPrepareDigitalKit({ ...kit, shippingLabels: [{ type: 'INBOUND', status }] }), false);
});

test('customer activity excludes internal notes and does not echo arbitrary titles or metadata', () => {
  const base = { id: 'event', createdAt: new Date(), title: 'Secret internal note', description: 'Private payout data', metadata: { account: 'secret' } };
  assert.equal(customerActivity({ ...base, type: 'NOTE_ADDED' }), null);
  assert.equal(customerActivity({ ...base, type: 'OFFER_GENERATED' }), null);
  assert.deepEqual(customerActivity({ ...base, type: 'PAYMENT_SENT' }), { id: 'event', type: 'PAYMENT_SENT', title: 'Payment sent', description: null, createdAt: base.createdAt });
});

test('offer precedence follows sending time rather than draft creation', async () => {
  const { compareOffers } = await import('../src/lib/account/kit-policy');
  const oldDraftSentLast = { id: 'a', createdAt: '2026-01-01', sentAt: '2026-09-08' };
  const newDraftSentFirst = { id: 'b', createdAt: '2026-02-01', sentAt: '2026-09-07' };
  assert.deepEqual([newDraftSentFirst, oldDraftSentLast].sort(compareOffers).map(offer => offer.id), ['a', 'b']);
});

test('digital and physical stages follow shipment evidence, not printing', async () => {
  const { formatCustomerKitStatus } = await import('../src/lib/account/utils');
  const digital = { type: 'DIGITAL', status: 'PENDING', shippingLabels: [] as { type: string; status: string; hasDocument?: boolean; packetAccessedAt?: Date }[] };
  assert.equal(formatCustomerKitStatus(digital), 'Waiting to be issued');
  const label = { type: 'INBOUND', status: 'CREATED', hasDocument: true };
  assert.equal(formatCustomerKitStatus({ ...digital, shippingLabels: [label] }), 'Waiting for Customer to pack and ship');
  const opened = { ...digital, shippingLabels: [{ ...label, packetAccessedAt: new Date() }] };
  assert.equal(formatCustomerKitStatus(opened), 'Waiting for Customer to pack and ship');
  assert.equal(formatCustomerKitStatus({ ...digital, shippingLabels: [{ ...label, status: 'VOIDED' }] }), 'Waiting to be issued');
  assert.equal(formatCustomerKitStatus({ ...digital, status: 'SHIPPED', shippingLabels: [{ ...label, status: 'IN_TRANSIT' }] }), 'In transit to Gold Geek');
  const physical = { ...digital, type: 'PHYSICAL' };
  const box = { type: 'KIT_DELIVERY', status: 'CREATED' };
  assert.equal(formatCustomerKitStatus({ ...physical, shippingLabels: [box, label] }), 'Waiting to be shipped');
  assert.equal(formatCustomerKitStatus({ ...physical, status: 'SHIPPED', shippingLabels: [{ ...box, status: 'IN_TRANSIT' }, label] }), 'In transit to Customer');
  assert.equal(formatCustomerKitStatus({ ...physical, status: 'SHIPPED', shippingLabels: [{ ...box, status: 'DELIVERED' }, label] }), 'Waiting for Customer to pack and ship');
  assert.equal(formatCustomerKitStatus({ ...physical, status: 'SHIPPED', shippingLabels: [{ ...box, status: 'DELIVERED' }, { ...label, status: 'IN_TRANSIT' }] }), 'In transit to Gold Geek');
  const expected = { EVALUATING: 'Waiting for appraisal', OFFER_SENT: 'Offer sent', ACCEPTED: 'Waiting for payment', PAID: 'Paid', DECLINED: 'Waiting for return to customer', RETURNED: 'Returned', CANCELLED: 'Cancelled' };
  for (const [status, text] of Object.entries(expected)) {
    for (const type of ['DIGITAL', 'PHYSICAL']) assert.equal(formatCustomerKitStatus({ type, status }), text);
  }
  assert.equal(formatCustomerKitStatus({ ...digital, status: 'DECLINED', returns: [{ status: 'IN_TRANSIT' }] }), 'In transit back to customer');
  assert.equal(formatCustomerKitStatus({ ...digital, status: 'DECLINED', returns: [{ status: 'FAILED', shippedAt: new Date() }] }), 'In transit back to customer');
});

test('withdrawal and preparation notices identify each shipment without exposing metadata', () => {
  const base = { id: 'notice', type: 'STATUS_CHANGED' as const, createdAt: new Date(), title: 'Private', description: 'Private' };
  const names = { INBOUND: 'Your shipping label to Gold Geek', KIT_DELIVERY: 'Empty-kit delivery label', RETURN: 'Return shipment label to you' };
  for (const [labelType, name] of Object.entries(names)) {
    assert.equal(customerActivity({ ...base, metadata: { labelType, milestone: 'LABEL_PREPARED' } })?.title, `${name} prepared`);
    assert.equal(customerActivity({ ...base, metadata: { labelType, milestone: 'LABEL_VOIDED', secret: 'hidden' } })?.title, `${name} withdrawn${labelType === 'INBOUND' ? ' — do not use this label' : ''}`);
  }
  assert.equal(customerActivity({ ...base, metadata: { milestone: 'LABEL_VOIDED' } })?.title, 'Shipping label withdrawn');
  assert.equal(customerActivity({ ...base, metadata: { newStatus: 'CANCELLED', milestone: 'unknown' } })?.title, 'Kit cancelled');
  assert.equal(customerActivity({ ...base, type: 'PACKAGE_DELIVERED', metadata: { labelType: 'KIT_DELIVERY' } })?.title, 'Empty kit delivered — pack and ship your items');
});
