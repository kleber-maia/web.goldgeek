import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/lib/db';
import { KitService, AwaitingShipmentKitError } from '../src/lib/services/kit.service';
import { ShippingTransitionService } from '../src/lib/services/shipping-transition.service';
import { AppraisalRequestService } from '../src/lib/services/appraisal-request.service';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });
const address = { type: 'shipping' as const, street1: '123 Test Street', city: 'Orlando', state: 'FL', zipCode: '32801', country: 'US', isDefault: true };

test('simultaneous account retries create one kit, event, and notification', async () => {
  const customer = await prisma.customer.create({ data: { email: 'request@example.invalid', firstName: 'Request', lastName: 'Test' } });
  const input = { requestId: randomUUID(), kitType: 'DIGITAL', shippingAddress: address };
  const kits = await Promise.all(Array.from({ length: 8 }, () => AppraisalRequestService.createFromAccount(customer.id, input)));
  assert.equal(new Set(kits.map(kit => kit.id)).size, 1);
  assert.equal(await prisma.kit.count({ where: { customerId: customer.id } }), 1);
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kits[0].id } }), 1);
  assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: kits[0].id } }), 1);
  assert.equal(await prisma.address.count({ where: { customerId: customer.id } }), 1);
});

test('public creation is atomic and an existing email never authorizes profile changes', async () => {
  const input = { requestId: randomUUID(), kitType: 'DIGITAL' as const, shippingAddress: address, customer: { email: 'public@example.invalid', firstName: 'Public', lastName: 'Test' } };
  const attempts = await Promise.allSettled(Array.from({ length: 4 }, () => AppraisalRequestService.create(input)));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  const customer = await prisma.customer.findUniqueOrThrow({ where: { email: input.customer.email } });
  await assert.rejects(AppraisalRequestService.create({ ...input, customer: { ...input.customer, firstName: 'Stolen' } }));
  assert.equal((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).firstName, 'Public');
  assert.equal(await prisma.kit.count({ where: { customerId: customer.id } }), 1);
  const retry = await AppraisalRequestService.create(input, customer.id);
  assert.equal(await prisma.kit.count({ where: { customerId: customer.id } }), 1);
  assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: retry.kit.id } }), 1);
});

test('invalid identity and address requests leave no partial kit or address', async () => {
  const customer = await prisma.customer.create({ data: { email: 'blank@example.invalid', firstName: '', lastName: '' } });
  await assert.rejects(AppraisalRequestService.createFromAccount(customer.id, { kitType: 'DIGITAL', shippingAddress: address }));
  assert.equal(await prisma.kit.count({ where: { customerId: customer.id } }), 0);
  assert.equal(await prisma.address.count({ where: { customerId: customer.id } }), 0);
  await assert.rejects(AppraisalRequestService.create({ kitType: 'DIGITAL', shippingAddress: { ...address, street1: ' ' }, customer: { email: 'invalid@example.invalid', firstName: 'Invalid', lastName: 'Test' } }));
  assert.equal(await prisma.customer.count({ where: { email: 'invalid@example.invalid' } }), 0);
});

test('different request IDs across account and public submissions create only one awaiting kit', async () => {
  const customer = await prisma.customer.create({ data: { email: 'cross-request@example.invalid', firstName: 'Cross', lastName: 'Request' } });
  const attempts = await Promise.allSettled(Array.from({ length: 8 }, (_, index) => index % 2
    ? AppraisalRequestService.createFromAccount(customer.id, { requestId: randomUUID(), kitType: 'DIGITAL', shippingAddress: address })
    : AppraisalRequestService.create({ requestId: randomUUID(), kitType: 'PHYSICAL', shippingAddress: address, customer: { email: customer.email, firstName: 'Cross', lastName: 'Request' } }, customer.id)));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(attempts.filter(result => result.status === 'rejected').every(result => result.reason instanceof AwaitingShipmentKitError));
  assert.equal(await prisma.kit.count({ where: { customerId: customer.id } }), 1);
  assert.equal(await prisma.address.count({ where: { customerId: customer.id } }), 1);
  const kit = (await KitService.getAwaitingShipment(customer.id))!;
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id } }), 1);
  assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: kit.id } }), 1);
  await assert.rejects(AppraisalRequestService.create({ requestId: randomUUID(), kitType: 'DIGITAL', shippingAddress: address, customer: { email: customer.email, firstName: 'Changed', lastName: 'Request' } }, customer.id), AwaitingShipmentKitError);
  assert.equal((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).firstName, 'Cross');
});

test('cancellation or inbound shipment permits another request while outbound box shipping does not', async () => {
  for (const mode of ['cancel', 'inbound', 'outbound'] as const) {
    const customer = await prisma.customer.create({ data: { email: `unlock-${mode}@example.invalid`, firstName: 'Unlock', lastName: 'Test' } });
    const input = { requestId: randomUUID(), kitType: 'PHYSICAL', shippingAddress: address };
    const first = await AppraisalRequestService.createFromAccount(customer.id, input);
    const next = { ...input, requestId: randomUUID() };
    await assert.rejects(AppraisalRequestService.createFromAccount(customer.id, next), AwaitingShipmentKitError);
    if (mode === 'cancel') await KitService.cancelForCustomer(first.id, customer.id);
    else {
      const label = await prisma.shippingLabel.create({ data: { kitId: first.id, type: mode === 'inbound' ? 'INBOUND' : 'KIT_DELIVERY', carrier: 'USPS', trackingNumber: `UNLOCK-${mode}` } });
      await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date(), `unlock-${mode}`);
    }
    if (mode === 'outbound') {
      await assert.rejects(AppraisalRequestService.createFromAccount(customer.id, next), AwaitingShipmentKitError);
      assert.equal(await prisma.kit.count({ where: { customerId: customer.id } }), 1);
    } else {
      const second = await AppraisalRequestService.createFromAccount(customer.id, next);
      assert.notEqual(second.id, first.id);
      assert.equal((await KitService.getAwaitingShipment(customer.id))?.id, second.id);
      assert.equal((await AppraisalRequestService.createFromAccount(customer.id, next)).id, second.id);
    }
  }
});

test('cancelling one legacy duplicate does not unlock requests while another still awaits shipment', async () => {
  const customer = await prisma.customer.create({ data: { email: 'legacy-requests@example.invalid', firstName: 'Legacy', lastName: 'Test' } });
  const legacy = await Promise.all(['A', 'B'].map(suffix => prisma.kit.create({ data: { customerId: customer.id, kitNumber: `LEGACY-${suffix}`, type: 'DIGITAL' } })));
  await KitService.cancelForCustomer(legacy[0].id, customer.id);
  await assert.rejects(AppraisalRequestService.createFromAccount(customer.id, { requestId: randomUUID(), kitType: 'DIGITAL', shippingAddress: address }), AwaitingShipmentKitError);
  assert.equal((await KitService.getAwaitingShipment(customer.id))?.id, legacy[1].id);
  assert.equal(await prisma.address.count({ where: { customerId: customer.id } }), 0, 'Blocked creation rolls back its address changes');
  await KitService.cancelForCustomer(legacy[1].id, customer.id);
  assert.ok(await AppraisalRequestService.createFromAccount(customer.id, { requestId: randomUUID(), kitType: 'DIGITAL', shippingAddress: address }));
});
