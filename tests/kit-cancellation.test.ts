import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { KitService } from '../src/lib/services/kit.service';
import { CustomerService } from '../src/lib/services/customer.service';
import { ShippingTransitionService } from '../src/lib/services/shipping-transition.service';
import { canCancelCustomerKit, isAwaitingCustomerShipment } from '../src/lib/account/kit-policy';
import { customerActivity } from '../src/lib/account/customer-activity';
import type { KitType, KitStatus } from '@prisma/client';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

async function fixture(name: string, type: KitType = 'DIGITAL', status: KitStatus = 'PENDING') {
  const customer = await prisma.customer.create({ data: { email: `cancel-${name}@example.invalid`, firstName: 'Cancel', lastName: 'Test' } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: `CANCEL-${name}`, type, status, shippingLabels: { create: { type: 'INBOUND', carrier: 'FEDEX', trackingNumber: `CANCEL-${name}` } } }, include: { shippingLabels: true } });
  return { customer, kit, label: kit.shippingLabels[0] };
}

test('customer cancellation is idempotent and agrees across dashboard, admin, activity and labels', async () => {
  for (const type of ['DIGITAL', 'PHYSICAL'] as const) {
    const { customer, kit, label } = await fixture(type, type);
    if (type === 'DIGITAL') await prisma.shippingLabel.update({ where: { id: label.id }, data: { packetAccessedAt: new Date() } });
    const results = await Promise.all(Array.from({ length: 4 }, () => KitService.cancelForCustomer(kit.id, customer.id)));
    assert.ok(results.every(result => result.status === 'CANCELLED' && result.completedAt));
    const admin = (await KitService.getById(kit.id))!;
    assert.equal(admin.status, 'CANCELLED');
    assert.equal(admin.shippingLabels[0].status, 'VOIDED');
    assert.equal(canCancelCustomerKit(admin), false);
    assert.equal(isAwaitingCustomerShipment(admin), false);
    assert.equal(await KitService.getAwaitingShipment(customer.id), null);
    assert.equal(await prisma.notificationOutbox.count({ where: { key: `label:${label.id}:void`, kind: 'CARRIER:VOID' } }), 1);
    assert.equal(admin.timeline.length, 1);
    assert.equal(customerActivity(admin.timeline[0])?.title, 'Kit cancelled');
    const dashboard = await CustomerService.getDashboard(customer.id);
    assert.equal(dashboard.stats.activeKits, 0);
    assert.equal(dashboard.kits[0].status, 'CANCELLED');
    await ShippingTransitionService.apply(label.id, 'IN_TRANSIT', undefined, new Date(), `late-${type}`);
    assert.equal((await KitService.getById(kit.id))!.status, 'CANCELLED');
  }
});

test('another customer cannot cancel even when the kit is already cancelled', async () => {
  const a = await fixture('owner'); const b = await fixture('stranger');
  await assert.rejects(KitService.cancelForCustomer(a.kit.id, b.customer.id), /Kit not found/);
  assert.equal((await KitService.getById(a.kit.id))!.status, 'PENDING');
  await KitService.cancelForCustomer(a.kit.id, a.customer.id);
  await assert.rejects(KitService.cancelForCustomer(a.kit.id, b.customer.id), /Kit not found/);
});

test('inbound carrier movement and later lifecycle stages prevent cancellation', async () => {
  for (const status of ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'] as const) {
    const { customer, kit, label } = await fixture(status);
    await ShippingTransitionService.apply(label.id, status, undefined, new Date(), `moving-${status}`);
    const before = (await KitService.getById(kit.id))!;
    assert.equal(canCancelCustomerKit(before), false);
    await assert.rejects(KitService.cancelForCustomer(kit.id, customer.id));
    assert.equal((await KitService.getById(kit.id))!.status, before.status);
    assert.equal(await prisma.notificationOutbox.count({ where: { kind: 'CARRIER:VOID', aggregateId: label.id } }), 0);
  }
  for (const status of ['EVALUATING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED', 'PAID', 'RETURNED'] as const) {
    const { customer, kit } = await fixture(status, 'DIGITAL', status);
    assert.equal(canCancelCustomerKit(kit), false);
    await assert.rejects(KitService.cancelForCustomer(kit.id, customer.id));
    assert.equal((await KitService.getById(kit.id))!.status, status);
  }
});

test('unresolved carrier operations prevent cancellation until resolved', async () => {
  for (const status of ['STARTED', 'UNKNOWN']) {
    const { customer, kit } = await fixture(status);
    await prisma.shippingOperation.create({ data: { id: `cancel-${status}`, kitId: kit.id, type: 'INBOUND', status } });
    assert.equal(canCancelCustomerKit((await KitService.getById(kit.id))!), false);
    await assert.rejects(KitService.cancelForCustomer(kit.id, customer.id), /pending carrier request/);
    assert.equal((await KitService.getById(kit.id))!.status, 'PENDING');
    await prisma.shippingOperation.update({ where: { id: `cancel-${status}` }, data: { status: 'READY' } });
    assert.equal(canCancelCustomerKit((await KitService.getById(kit.id))!), true);
    await KitService.cancelForCustomer(kit.id, customer.id);
  }
});

test('outbound box delivery still permits cancellation before customer items ship', async () => {
  const { customer, kit } = await fixture('box', 'PHYSICAL');
  const box = await prisma.shippingLabel.create({ data: { kitId: kit.id, type: 'KIT_DELIVERY', carrier: 'USPS', trackingNumber: 'CANCEL-BOX' } });
  await ShippingTransitionService.apply(box.id, 'IN_TRANSIT', undefined, new Date(Date.now() - 1000), 'box-shipped');
  await ShippingTransitionService.apply(box.id, 'DELIVERED', undefined, new Date(), 'box-delivered');
  const before = (await KitService.getById(kit.id))!;
  assert.equal(before.status, 'SHIPPED');
  assert.equal(canCancelCustomerKit(before), true);
  assert.equal((await KitService.getAwaitingShipment(customer.id))?.id, kit.id);
  await KitService.cancelForCustomer(kit.id, customer.id);
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: box.id } })).status, 'DELIVERED');
});
