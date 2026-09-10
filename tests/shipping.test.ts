import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { ShippingTransitionService } from '../src/lib/services/shipping-transition.service';
import { ReturnService } from '../src/lib/services/return.service';
import { NotificationService } from '../src/lib/services/notification.service';
import { ShippingService } from '../src/lib/services/shipping.service';
import { customerActivity } from '../src/lib/account/customer-activity';
import type { KitStatus, ShippingLabelType } from '@prisma/client';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

async function fixture(name: string, type: ShippingLabelType = 'INBOUND', status: KitStatus = 'PENDING') {
  const customer = await prisma.customer.create({ data: { email: `${name}@example.invalid`, firstName: 'Test', lastName: 'Carrier' } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: `SHIP-${name}`, status } });
  const label = await prisma.shippingLabel.create({ data: { kitId: kit.id, type, carrier: 'FEDEX', trackingNumber: `TRACK-${name}` } });
  return { kit, label };
}

test('digital inbound transit, exception recovery and delivery agree across label, kit and timeline', async () => {
  const { kit, label } = await fixture('inbound-recovery');
  const time = Date.now();
  await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date(time), 'inbound-transit');
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } })).status, 'SHIPPED');
  await ShippingTransitionService.apply(label.id, 'EXCEPTION', undefined, new Date(time + 1000), 'inbound-exception');
  await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, new Date(time + 2000), 'inbound-delivered');
  await ShippingTransitionService.apply(label.id, 'EXCEPTION', undefined, new Date(time + 1000), 'inbound-late-exception');
  await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, new Date(time + 2000), 'inbound-delivered');
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } })).status, 'EVALUATING');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).status, 'DELIVERED');
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id, type: 'PACKAGE_DELIVERED' } }), 1);
});

test('manual and carrier return delivery use the same completion transition', async () => {
  for (const mode of ['manual', 'carrier']) {
    const { kit, label } = await fixture(`return-${mode}`, 'RETURN', 'DECLINED');
    const returned = await prisma.return.create({ data: { kitId: kit.id, returnNumber: `RETURN-${mode}` } });
    if (mode === 'manual') await ReturnService.updateStatus(returned.id, 'DELIVERED');
    else await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, new Date(), `return-${mode}`);
    assert.equal((await prisma.return.findUniqueOrThrow({ where: { id: returned.id } })).status, 'DELIVERED');
    const updated = await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } });
    assert.equal(updated.status, 'RETURNED');
    assert.ok(updated.completedAt);
    assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).status, 'DELIVERED');
  }
});

test('callbacks never revive cancelled kits or voided labels', async () => {
  const cancelled = await fixture('cancelled', 'INBOUND', 'CANCELLED');
  await ShippingTransitionService.apply(cancelled.label.id, 'DELIVERED', undefined, new Date(), 'cancelled-event');
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: cancelled.kit.id } })).status, 'CANCELLED');
  const voided = await fixture('voided');
  await ShippingTransitionService.apply(voided.label.id, 'VOIDED');
  await ShippingTransitionService.apply(voided.label.id, 'DELIVERED', undefined, new Date(), 'voided-event');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: voided.label.id } })).status, 'VOIDED');
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: voided.kit.id } })).status, 'PENDING');
});

test('failed carrier processing rolls back its receipt so a retry can succeed', async () => {
  const { kit, label } = await fixture('rollback', 'RETURN', 'DECLINED');
  await assert.rejects(ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, new Date(), 'rollback-receipt'));
  assert.equal(await prisma.carrierReceipt.findUnique({ where: { id: 'rollback-receipt' } }), null);
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).status, 'CREATED');
  await prisma.return.create({ data: { kitId: kit.id, returnNumber: 'ROLLBACK-RETURN' } });
  await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, new Date(), 'rollback-receipt');
  assert.ok(await prisma.carrierReceipt.findUnique({ where: { id: 'rollback-receipt' } }));
});

test('notification failures remain retryable and concurrent workers do not claim the same message', async () => {
  await prisma.$transaction(tx => NotificationService.enqueue(tx, 'TEST', 'fixture', 'delivery-retry'));
  const delivered = new Set<string>();
  const attempts = new Map<string, number>();
  const sender = async (row: { id: string; key: string }) => {
    attempts.set(row.id, (attempts.get(row.id) || 0) + 1);
    if (row.key === 'delivery-retry' && attempts.get(row.id) === 1) return false;
    assert.equal(delivered.has(row.id), false);
    delivered.add(row.id);
    return true;
  };
  await Promise.all([NotificationService.drain(100, sender), NotificationService.drain(100, sender)]);
  const failed = await prisma.notificationOutbox.findUniqueOrThrow({ where: { key: 'delivery-retry' } });
  assert.equal(failed.sentAt, null);
  assert.equal(failed.attempts, 1);
  await prisma.notificationOutbox.update({ where: { id: failed.id }, data: { nextAttemptAt: new Date(0) } });
  await NotificationService.drain(100, sender);
  assert.ok((await prisma.notificationOutbox.findUniqueOrThrow({ where: { id: failed.id } })).sentAt);
});

test('expired delivery worker cannot clear a newer worker lease or mark its job sent', async () => {
  await prisma.notificationOutbox.updateMany({ data: { sentAt: new Date() } });
  const row = await prisma.notificationOutbox.create({ data: { kind: 'TEST', aggregateId: 'lease', key: 'lease-fence' } });
  const newerLease = new Date(Date.now() + 600000);
  const outcome = await NotificationService.drain(1, async claimed => {
    assert.equal(claimed.id, row.id);
    await prisma.notificationOutbox.update({ where: { id: row.id }, data: { lockedUntil: newerLease, attempts: { increment: 1 } } });
    return true;
  });
  assert.equal(outcome.delivered, 0);
  const current = await prisma.notificationOutbox.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(current.sentAt, null);
  assert.equal(current.lockedUntil?.getTime(), newerLease.getTime());
});

test('a failed return can resume transit without disagreeing with its label', async () => {
  const { kit, label } = await fixture('failed-retry', 'RETURN', 'DECLINED');
  const record = await prisma.return.create({ data: { kitId: kit.id, returnNumber: 'FAILED-RETRY' } });
  await ReturnService.updateStatus(record.id, 'IN_TRANSIT');
  await ReturnService.updateStatus(record.id, 'FAILED');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).status, 'EXCEPTION');
  await ReturnService.updateStatus(record.id, 'IN_TRANSIT');
  assert.equal((await prisma.return.findUniqueOrThrow({ where: { id: record.id } })).status, 'IN_TRANSIT');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).status, 'IN_TRANSIT');
  await assert.rejects(ReturnService.updateTracking(record.id, 'CHANGED'), /cannot change/);
});

test('late pickup scans fill missing dates once without reopening shipments or sending stale mail', async () => {
  for (const type of ['KIT_DELIVERY', 'INBOUND', 'RETURN'] as const) {
    const { kit, label } = await fixture(`late-${type}`, type, type === 'RETURN' ? 'DECLINED' : 'PENDING');
    await prisma.kit.update({ where: { id: kit.id }, data: { type: type === 'KIT_DELIVERY' ? 'PHYSICAL' : 'DIGITAL' } });
    if (type === 'RETURN') await prisma.return.create({ data: { kitId: kit.id, returnNumber: 'LATE-RETURN' } });
    const pickup = new Date(label.createdAt.getTime() + 1000);
    const delivered = new Date(pickup.getTime() + 1000);
    await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, delivered, `delivery-${type}`);
    const before = await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } });
    assert.equal(before.kitSentAt, null, 'Delivery must not invent a pickup date');
    const messages = await prisma.notificationOutbox.count({ where: { aggregateId: label.id } });
    await Promise.all(Array.from({ length: 3 }, () => ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, pickup, `pickup-${type}`)));
    const updated = await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } });
    assert.equal(updated.status, 'DELIVERED');
    assert.equal(updated.shippedAt?.getTime(), pickup.getTime());
    assert.equal(updated.deliveredAt?.getTime(), delivered.getTime());
    assert.equal(updated.lastCarrierEventAt?.getTime(), delivered.getTime());
    const current = await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } });
    assert.equal(current.status, before.status);
    if (type !== 'RETURN') assert.equal(current.kitSentAt?.getTime(), pickup.getTime());
    else assert.equal((await prisma.return.findFirstOrThrow({ where: { kitId: kit.id } })).shippedAt?.getTime(), pickup.getTime());
    assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: label.id } }), messages);
    const history = await prisma.timelineEvent.findMany({ where: { kitId: kit.id, createdAt: pickup } });
    assert.equal(history.length, 1);
    assert.ok(customerActivity(history[0]));
    await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date(pickup.getTime() + 100), `another-${type}`);
    assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).shippedAt?.getTime(), pickup.getTime());
  }
});

test('late-date recovery rejects impossible chronology and scans without a carrier receipt', async () => {
  const { label } = await fixture('late-invalid', 'KIT_DELIVERY');
  const delivered = new Date(label.createdAt.getTime() + 2000);
  await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, delivered, 'late-invalid-delivery');
  await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date('invalid'), 'invalid-date');
  await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date(delivered.getTime() + 1), 'after-delivery');
  await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date(label.createdAt.getTime() + 1000));
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).shippedAt, null);
});

test('label withdrawal persists its direction and leaves other kit labels usable', async () => {
  const { kit, label } = await fixture('withdraw-box', 'KIT_DELIVERY');
  const inbound = await prisma.shippingLabel.create({ data: { kitId: kit.id, type: 'INBOUND', carrier: 'USPS', trackingNumber: 'RETAIN-INBOUND' } });
  await ShippingService.voidLabel(label.id);
  const event = await prisma.timelineEvent.findFirstOrThrow({ where: { kitId: kit.id, type: 'STATUS_CHANGED' } });
  assert.equal(customerActivity(event)?.title, 'Empty-kit delivery label withdrawn');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: inbound.id } })).status, 'CREATED');
});

test('late pickup history may predate a manually imported label record', async () => {
  const { kit, label } = await fixture('imported-box', 'KIT_DELIVERY');
  const pickup = new Date(label.createdAt.getTime() - 86400000);
  const delivered = new Date(label.createdAt.getTime() + 1000);
  await ShippingTransitionService.apply(label.id, 'DELIVERED', undefined, delivered, 'imported-delivered');
  await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, pickup, 'imported-pickup');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).shippedAt?.getTime(), pickup.getTime());
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } })).kitSentAt?.getTime(), pickup.getTime());
});
