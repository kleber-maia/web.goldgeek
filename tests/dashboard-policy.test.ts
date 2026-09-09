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

test('digital customer status follows preparation while physical and later statuses retain their meanings', async () => {
  const { formatCustomerKitStatus, formatStatusForUser } = await import('../src/lib/account/utils');
  const kit = { type: 'DIGITAL', status: 'PENDING', shippingLabels: [{ type: 'INBOUND', status: 'CREATED', packetAccessedAt: null as Date | null }] };
  assert.equal(formatCustomerKitStatus(kit), 'Prepare kit');
  const prepared = { ...kit, shippingLabels: [{ ...kit.shippingLabels[0], packetAccessedAt: new Date() }] };
  assert.equal(formatCustomerKitStatus(prepared), 'Ready to ship');
  assert.equal(formatCustomerKitStatus({ ...prepared, type: 'PHYSICAL' }), 'Requested');
  assert.equal(formatCustomerKitStatus({ ...prepared, shippingLabels: [{ ...prepared.shippingLabels[0], status: 'VOIDED' }, ...kit.shippingLabels] }), 'Prepare kit');
  for (const status of ['EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'PAID', 'DECLINED', 'RETURNED', 'CANCELLED']) {
    assert.equal(formatCustomerKitStatus({ ...prepared, status }), formatStatusForUser(status));
  }
  assert.equal(formatCustomerKitStatus({ ...prepared, status: 'SHIPPED', shippingLabels: [{ ...prepared.shippingLabels[0], status: 'IN_TRANSIT' }] }), 'Shipping');
});
