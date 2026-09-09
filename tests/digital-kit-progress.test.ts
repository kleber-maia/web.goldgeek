import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '../src/lib/db';
import { ShippingService } from '../src/lib/services/shipping.service';
import { CustomerService } from '../src/lib/services/customer.service';
import { canPrepareDigitalKit, hasAccessedDigitalKit } from '../src/lib/account/kit-policy';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

async function fixture(name: string) {
  const customer = await prisma.customer.create({ data: { email: `packet-${name}@example.invalid`, firstName: 'Packet', lastName: 'Test' } });
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const labelData = Buffer.from(await pdf.save()).toString('base64');
  const kit = await prisma.kit.create({ data: { kitNumber: `PACKET-${name}`, customerId: customer.id, type: 'DIGITAL', shippingLabels: { create: { type: 'INBOUND', carrier: 'FEDEX', trackingNumber: `PACKET-${name}`, labelData } } }, include: { shippingLabels: true } });
  return { customer, kit, label: kit.shippingLabels[0] };
}

test('packet access persists in dashboard and kit data without advancing shipping status', async () => {
  const { customer, kit, label } = await fixture('persistence');
  assert.equal(hasAccessedDigitalKit(kit), false);
  const stamps = await Promise.all(Array.from({ length: 5 }, () => ShippingService.recordPacketAccess(kit.id, label.id, customer.id)));
  assert.equal(new Set(stamps.map(stamp => stamp.toISOString())).size, 1);
  const dashboard = await CustomerService.getDashboard(customer.id);
  const next = dashboard.actionKits.find(candidate => candidate.id === kit.id)!;
  assert.equal(next.status, 'PENDING');
  assert.equal(next.shippingLabels[0].status, 'CREATED');
  assert.equal(hasAccessedDigitalKit(next), true);
  assert.equal(canPrepareDigitalKit(next), true, 'Reprinting remains available');
  assert.equal(dashboard.actionKits.filter(candidate => canPrepareDigitalKit(candidate) && !hasAccessedDigitalKit(candidate)).length, 0);
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id } }), 0, 'No fabricated shipping events');
});

test('packet progress rejects another customer, mismatched kit, missing PDF, and voided label', async () => {
  const a = await fixture('ownership-a');
  const b = await fixture('ownership-b');
  await assert.rejects(ShippingService.recordPacketAccess(a.kit.id, a.label.id, b.customer.id));
  await assert.rejects(ShippingService.recordPacketAccess(b.kit.id, a.label.id, a.customer.id));
  await prisma.shippingLabel.update({ where: { id: a.label.id }, data: { labelData: null } });
  await assert.rejects(ShippingService.recordPacketAccess(a.kit.id, a.label.id, a.customer.id));
  await prisma.shippingLabel.update({ where: { id: b.label.id }, data: { status: 'VOIDED' } });
  await assert.rejects(ShippingService.recordPacketAccess(b.kit.id, b.label.id, b.customer.id));
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: a.label.id } })).packetAccessedAt, null);
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: b.label.id } })).packetAccessedAt, null);
});

test('replacement label requires preparation again and cannot inherit old access', async () => {
  const { customer, kit, label } = await fixture('replacement');
  await ShippingService.recordPacketAccess(kit.id, label.id, customer.id);
  await prisma.shippingLabel.update({ where: { id: label.id }, data: { status: 'VOIDED', voidedAt: new Date() } });
  const replacement = await ShippingService.createLabel({ kitId: kit.id, type: 'INBOUND', carrier: 'FEDEX', trackingNumber: 'PACKET-REPLACEMENT-NEW', labelData: label.labelData! });
  const dashboard = await CustomerService.getDashboard(customer.id);
  const next = dashboard.actionKits.find(candidate => candidate.id === kit.id)!;
  assert.equal(hasAccessedDigitalKit(next), false);
  assert.equal(replacement.packetAccessedAt, null);
  await assert.rejects(ShippingService.recordPacketAccess(kit.id, label.id, customer.id));
  await ShippingService.recordPacketAccess(kit.id, replacement.id, customer.id);
});

test('physical, terminal, and travelling kits cannot record packet progress', async () => {
  for (const state of ['PHYSICAL', 'CANCELLED', 'EVALUATING', 'IN_TRANSIT'] as const) {
    const { customer, kit, label } = await fixture(state);
    if (state === 'PHYSICAL') await prisma.kit.update({ where: { id: kit.id }, data: { type: 'PHYSICAL' } });
    else if (state === 'IN_TRANSIT') await prisma.shippingLabel.update({ where: { id: label.id }, data: { status: 'IN_TRANSIT' } });
    else await prisma.kit.update({ where: { id: kit.id }, data: { status: state } });
    await assert.rejects(ShippingService.recordPacketAccess(kit.id, label.id, customer.id));
  }
});
