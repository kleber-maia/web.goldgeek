import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/lib/db';
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
