import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { CustomerService } from '../src/lib/services/customer.service';
import { ActivityService } from '../src/lib/services/activity.service';
import { KitService } from '../src/lib/services/kit.service';
import { ReturnService } from '../src/lib/services/return.service';
if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

test('history pages are bounded, ordered, filtered and scoped while dashboard totals cover all records', async () => {
  const customer = await prisma.customer.create({ data: { email: 'history@example.invalid', firstName: 'History', lastName: 'Test' } });
  const outsider = await prisma.customer.create({ data: { email: 'outsider@example.invalid', firstName: 'Other', lastName: 'Test' } });
  await prisma.kit.createMany({ data: Array.from({ length: 23 }, (_, i) => ({ customerId: customer.id, kitNumber: `HISTORY-${i}`, status: i === 0 ? 'CANCELLED' as const : 'PENDING' as const, createdAt: new Date(2026, 0, i + 1) })) });
  await prisma.kit.create({ data: { customerId: outsider.id, kitNumber: 'HISTORY-PRIVATE' } });
  const first = await CustomerService.getKits(customer.id, { page: 1 });
  const second = await CustomerService.getKits(customer.id, { page: 2 });
  assert.equal(first.length, 21); // Includes one sentinel for Next.
  assert.equal(second.length, 3);
  assert.equal(new Set([...first.slice(0, 20), ...second].map(kit => kit.id)).size, 23);
  assert.ok(first.every(kit => kit.customerId === customer.id));
  const filtered = await CustomerService.getKits(customer.id, { status: 'completed', q: 'history-' });
  assert.deepEqual(filtered.map(kit => kit.kitNumber), ['HISTORY-0']);
  const dashboard = await CustomerService.getDashboard(customer.id);
  assert.equal(dashboard.kits.length, 5);
  assert.equal(dashboard.stats.totalKits, 23);
  assert.equal(dashboard.stats.activeKits, 22);
});

test('customer activity pages exclude staff notes and retain access to older events', async () => {
  const customer = await prisma.customer.create({ data: { email: 'activity@example.invalid', firstName: 'Activity', lastName: 'Test' } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: 'ACTIVITY-HISTORY' } });
  await prisma.timelineEvent.createMany({ data: Array.from({ length: 23 }, (_, i) => ({ kitId: kit.id, type: 'KIT_CREATED' as const, title: 'Private arbitrary text', createdAt: new Date(2026, 0, i + 1) })) });
  await prisma.timelineEvent.create({ data: { kitId: kit.id, type: 'NOTE_ADDED', title: 'Secret staff note' } });
  const first = await ActivityService.getCustomerEvents(customer.id, 20, 1);
  const second = await ActivityService.getCustomerEvents(customer.id, 20, 2);
  assert.equal(first.events.length, 20);
  assert.equal(first.hasMore, true);
  assert.equal(second.events.length, 3);
  assert.equal(second.hasMore, false);
  assert.ok([...first.events, ...second.events].every(event => event.title === 'Kit requested'));
});

test('destination correction enforces ownership and stops once a return label or payment locks the kit', async () => {
  const customer = await prisma.customer.create({ data: { email: 'destination@example.invalid', firstName: 'Destination', lastName: 'Test', addresses: { create: { type: 'shipping', street1: '10 New Street', city: 'Orlando', state: 'FL', zipCode: '32801', isDefault: true } } } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: 'DESTINATION', status: 'DECLINED' } });
  await assert.rejects(KitService.applyProfileDestination(kit.id, 'another-customer'));
  assert.equal((await KitService.applyProfileDestination(kit.id, customer.id)).street1, '10 New Street');
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id } }), 1);
  await prisma.shippingLabel.create({ data: { kitId: kit.id, type: 'RETURN', carrier: 'FEDEX', trackingNumber: 'LOCKED' } });
  await assert.rejects(KitService.applyProfileDestination(kit.id, customer.id), /label/);
  await prisma.kit.update({ where: { id: kit.id }, data: { status: 'ACCEPTED' } });
  await assert.rejects(KitService.applyProfileDestination(kit.id, customer.id), /locked/);
});

test('manual returns require tracking, reject backward movement and complete the kit atomically', async () => {
  const customer = await prisma.customer.create({ data: { email: 'manualreturn@example.invalid', firstName: 'Return', lastName: 'Test' } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: 'MANUAL-RETURN', status: 'DECLINED' } });
  const results = await Promise.all(Array.from({ length: 5 }, () => ReturnService.create({ kitId: kit.id })));
  assert.equal(new Set(results.map(record => record.id)).size, 1);
  const record = results[0];
  await assert.rejects(ReturnService.updateStatus(record.id, 'IN_TRANSIT'), /tracking/);
  await ReturnService.updateTracking(record.id, 'MANUAL-TRACK');
  await ReturnService.updateStatus(record.id, 'IN_TRANSIT');
  await assert.rejects(ReturnService.updateStatus(record.id, 'PENDING'), /backwards/);
  await ReturnService.updateStatus(record.id, 'DELIVERED');
  const completed = await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } });
  assert.equal(completed.status, 'RETURNED');
  assert.ok(completed.completedAt);
  assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: record.id } }), 2);
  await assert.rejects(ReturnService.updateStatus(record.id, 'FAILED'), /backwards/);
});
