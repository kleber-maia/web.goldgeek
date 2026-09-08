import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { ShippingService } from '../src/lib/services/shipping.service';
import { KitService } from '../src/lib/services/kit.service';
import { SettingsService } from '../src/lib/services/settings.service';
import { FedExClient } from '../src/lib/fedex/client';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });
const address = { name: 'Shipping Test', phone: '4075550100', street1: '123 Test Street', city: 'Orlando', state: 'FL', zipCode: '32801' };
before(async () => {
  process.env.FEDEX_ACCOUNT_NUMBER = 'TEST-ACCOUNT';
  await SettingsService.upsertCompanySettings({ name: 'Test Company', street1: '48 Test St', city: 'New York', state: 'NY', zipCode: '10036', phone: '2125550100' });
});
async function fixture(name: string) {
  const customer = await prisma.customer.create({ data: { email: `${name}@example.invalid`, firstName: 'Shipping', lastName: 'Test' } });
  return prisma.kit.create({ data: { customerId: customer.id, kitNumber: `GEN-${name}`, type: 'PHYSICAL' } });
}

test('concurrent generation and repeated requests create one carrier shipment', async t => {
  const kit = await fixture('concurrent');
  t.mock.method(FedExClient, 'validateAddress', async () => ({ valid: true }));
  let calls = 0;
  t.mock.method(FedExClient, 'createShipment', async () => { calls++; return { trackingNumber: 'GEN-TRACK', masterTrackingNumber: 'GEN-TRACK', externalId: 'GEN', rawResponse: {} }; });
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address)));
  assert.ok(results.some(result => result.status === 'fulfilled'));
  assert.equal(calls, 1);
  const repeat = await ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address);
  assert.equal(repeat.trackingNumber, 'GEN-TRACK');
  assert.equal(calls, 1);
  assert.equal(await prisma.shippingLabel.count({ where: { kitId: kit.id } }), 1);
});

test('uncertain carrier response cannot be retried without reconciliation', async t => {
  const kit = await fixture('uncertain');
  t.mock.method(FedExClient, 'validateAddress', async () => ({ valid: true }));
  let calls = 0;
  t.mock.method(FedExClient, 'createShipment', async () => { calls++; throw new Error('Response lost'); });
  await assert.rejects(ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address));
  await assert.rejects(ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address));
  await assert.rejects(KitService.updateStatus(kit.id, 'CANCELLED'));
  assert.equal(calls, 1);
  await ShippingService.createLabel({ kitId: kit.id, type: 'KIT_DELIVERY', carrier: 'FEDEX', trackingNumber: 'RECOVERED' });
  assert.equal((await prisma.shippingOperation.findUniqueOrThrow({ where: { id: `${kit.id}:KIT_DELIVERY` } })).status, 'SAVED');
});

test('invalid address never creates a shipment and cancelled kits reject labels', async t => {
  const kit = await fixture('invalid');
  t.mock.method(FedExClient, 'validateAddress', async () => ({ valid: false }));
  let calls = 0;
  t.mock.method(FedExClient, 'createShipment', async () => { calls++; throw new Error('Should not call'); });
  await assert.rejects(ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address));
  assert.equal(calls, 0);
  await KitService.updateStatus(kit.id, 'CANCELLED');
  await assert.rejects(ShippingService.createLabel({ kitId: kit.id, type: 'KIT_DELIVERY', carrier: 'FEDEX', trackingNumber: 'INVALID' }));
});

test('cancellation queues unused label cancellation atomically and cannot cancel inbound items in transit', async () => {
  const kit = await fixture('cancel');
  const label = await ShippingService.createLabel({ kitId: kit.id, type: 'INBOUND', carrier: 'FEDEX', trackingNumber: 'VOID-ME' });
  await KitService.updateStatus(kit.id, 'CANCELLED');
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).status, 'VOIDED');
  assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: label.id, kind: 'CARRIER:VOID' } }), 1);
  const travelling = await fixture('travelling');
  await prisma.shippingLabel.create({ data: { kitId: travelling.id, type: 'INBOUND', carrier: 'FEDEX', trackingNumber: 'TRAVELLING', status: 'IN_TRANSIT' } });
  await assert.rejects(KitService.updateStatus(travelling.id, 'CANCELLED'));
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: travelling.id } })).status, 'PENDING');
});

test('saved carrier result recovers during an outage without validating or buying another label', async t => {
  const kit = await fixture('saved-response');
  await prisma.shippingOperation.create({ data: { id: `${kit.id}:KIT_DELIVERY`, kitId: kit.id, type: 'KIT_DELIVERY', status: 'UNKNOWN', result: { trackingNumber: 'ALREADY-BOUGHT', masterTrackingNumber: 'ALREADY-BOUGHT' } } });
  t.mock.method(FedExClient, 'validateAddress', async () => { throw new Error('Carrier offline'); });
  t.mock.method(FedExClient, 'createShipment', async () => { throw new Error('Must not create'); });
  const label = await ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address);
  assert.equal(label.trackingNumber, 'ALREADY-BOUGHT');
  const operation = await prisma.shippingOperation.findUniqueOrThrow({ where: { id: `${kit.id}:KIT_DELIVERY` } });
  assert.equal(operation.status, 'SAVED');
  assert.equal(operation.result, null);
});

test('concurrent void requests enqueue once and block replacements until carrier confirmation', async t => {
  const kit = await fixture('void-concurrent');
  const label = await ShippingService.createLabel({ kitId: kit.id, type: 'INBOUND', carrier: 'FEDEX', trackingNumber: 'VOID-CONCURRENT' });
  t.mock.method(FedExClient, 'cancelShipment', async () => { throw new Error('Cancellation must be durable and asynchronous'); });
  await Promise.all(Array.from({ length: 8 }, () => ShippingService.voidLabel(label.id)));
  assert.equal(await prisma.notificationOutbox.count({ where: { aggregateId: label.id, kind: 'CARRIER:VOID' } }), 1);
  assert.equal((await prisma.shippingLabel.findUniqueOrThrow({ where: { id: label.id } })).voidedAt, null);
  await assert.rejects(ShippingService.createLabel({ kitId: kit.id, type: 'INBOUND', carrier: 'FEDEX', trackingNumber: 'TOO-SOON' }), /pending/);
  await prisma.shippingLabel.update({ where: { id: label.id }, data: { voidedAt: new Date() } });
  assert.equal((await ShippingService.createLabel({ kitId: kit.id, type: 'INBOUND', carrier: 'FEDEX', trackingNumber: 'CONFIRMED-REPLACEMENT' })).trackingNumber, 'CONFIRMED-REPLACEMENT');
});

test('tracking-only recovery accepts its missing PDF once without duplicating the label', async () => {
  const { PDFDocument } = await import('pdf-lib');
  const kit = await fixture('attach-pdf');
  const input = { kitId: kit.id, type: 'INBOUND' as const, carrier: 'FEDEX' as const, trackingNumber: 'ATTACH-PDF' };
  const label = await ShippingService.createLabel(input);
  const pdf = await PDFDocument.create(); pdf.addPage(); pdf.addPage();
  const labelData = await pdf.saveAsBase64();
  const attached = await ShippingService.createLabel({ ...input, labelData });
  assert.equal(attached.id, label.id); assert.equal(attached.labelData, labelData);
  await ShippingService.createLabel({ ...input, labelData });
  assert.equal(await prisma.shippingLabel.count({ where: { kitId: kit.id } }), 1);
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id } }), 1);
  await assert.rejects(ShippingService.createLabel({ ...input, carrier: 'USPS', labelData }));
  await assert.rejects(ShippingService.createLabel({ ...input, labelData: 'broken' }));
});

test('generation rechecks pending cancellation after asynchronous address validation', async t => {
  const kit = await fixture('reservation-cancellation');
  t.mock.method(FedExClient, 'validateAddress', async () => {
    const label = await ShippingService.createLabel({ kitId: kit.id, type: 'KIT_DELIVERY', carrier: 'FEDEX', trackingNumber: 'PENDING-CANCEL' });
    await ShippingService.voidLabel(label.id);
    return { valid: true };
  });
  let calls = 0;
  t.mock.method(FedExClient, 'createShipment', async () => { calls++; throw new Error('Must not purchase'); });
  await assert.rejects(ShippingService.generateFedExLabel(kit.id, 'KIT_DELIVERY', address), /cancellation is pending/);
  assert.equal(calls, 0);
  assert.equal(await prisma.shippingOperation.count({ where: { kitId: kit.id } }), 0);
});
