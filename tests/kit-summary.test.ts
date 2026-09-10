import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '../src/lib/db';
import { CustomerService } from '../src/lib/services/customer.service';
import { KitService } from '../src/lib/services/kit.service';
import { getCustomerById } from '../src/lib/services/admin-customer.service';
import { ShippingService } from '../src/lib/services/shipping.service';
import { OfferService } from '../src/lib/services/offer.service';
import { kitLifecycleLabel, isPublishedOffer } from '../src/lib/account/kit-policy';
import { customerActivity } from '../src/lib/account/customer-activity';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

test('customer and admin summaries preserve issuance without loading PDF contents', async () => {
  const customer = await prisma.customer.create({ data: { email: 'summary@example.invalid', firstName: 'Summary', lastName: 'Test' } });
  const pdf = await PDFDocument.create(); pdf.addPage();
  const data = Buffer.from(await pdf.save()).toString('base64');
  const statuses = ['missing', 'empty', 'issued', 'voided', 'outbound'] as const;
  for (const name of statuses) {
    await prisma.kit.create({ data: {
      customerId: customer.id, kitNumber: `SUMMARY-${name}`, type: 'DIGITAL',
      shippingLabels: { create: {
        type: name === 'outbound' ? 'KIT_DELIVERY' : 'INBOUND', carrier: 'FEDEX', trackingNumber: `SUMMARY-${name}`,
        labelData: name === 'missing' ? null : name === 'empty' ? '' : data,
        status: name === 'voided' ? 'VOIDED' : 'CREATED',
      } },
    } });
  }
  const lists = [await CustomerService.getKits(customer.id), (await CustomerService.getDashboard(customer.id)).actionKits, await KitService.getAll({ customerId: customer.id })];
  const admin = await getCustomerById(customer.id);
  assert.equal(admin.success, true);
  assert.ok(admin.data);
  for (const kits of [...lists, admin.data.kits]) {
    assert.equal(kits.length, statuses.length);
    for (const kit of kits) {
      assert.equal(kit.digitalKitIssued, kit.kitNumber === 'SUMMARY-issued');
      assert.equal(kitLifecycleLabel(kit), kit.digitalKitIssued ? 'Waiting for Customer to pack and ship' : 'Waiting to be issued');
      assert.ok(kit.shippingLabels.every(label => !('labelData' in label)));
      assert.equal(JSON.stringify(kit).includes(data), false);
      assert.equal('_count' in kit, false);
    }
  }
});

test('new and enriched carrier PDFs create one issuance milestone before any packet access', async () => {
  const customer = await prisma.customer.create({ data: { email: 'issuance@example.invalid', firstName: 'Issuance', lastName: 'Test' } });
  const pdf = await PDFDocument.create(); pdf.addPage();
  const labelData = Buffer.from(await pdf.save()).toString('base64');
  for (const mode of ['new', 'enriched']) {
    const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: `ISSUE-${mode}`, type: 'DIGITAL' } });
    const input = { kitId: kit.id, type: 'INBOUND' as const, carrier: 'FEDEX' as const, trackingNumber: `ISSUE-${mode}` };
    if (mode === 'enriched') await ShippingService.createLabel(input);
    await ShippingService.createLabel({ ...input, labelData });
    await ShippingService.createLabel({ ...input, labelData });
    const details = await KitService.getById(kit.id);
    assert.ok(details);
    assert.equal(kitLifecycleLabel(details), 'Waiting for Customer to pack and ship');
    assert.equal(details.shippingLabels[0].packetAccessedAt, null);
    assert.equal(details.timeline.map(customerActivity).filter(event => event?.title === 'Digital kit issued — pack and ship your items').length, 1);
  }
});

test('discarded drafts stay private and a sent replacement gets seven days from sending', async () => {
  const customer = await prisma.customer.create({ data: { email: 'draft-summary@example.invalid', firstName: 'Draft', lastName: 'Test' } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: 'DRAFT-SUMMARY', status: 'EVALUATING' } });
  const input = { totalValue: 100, itemBreakdown: [{ itemId: 'ring', description: 'Ring', value: '100.00' }] };
  const discarded = await OfferService.create(kit.id, input);
  const replacement = await OfferService.create(kit.id, input);
  assert.equal((await prisma.offer.findUniqueOrThrow({ where: { id: discarded.id } })).status, 'EXPIRED');
  assert.equal((await CustomerService.getKits(customer.id))[0].offers.length, 0);
  const detail = await KitService.getById(kit.id);
  assert.ok(detail);
  assert.equal(detail.offers.filter(isPublishedOffer).length, 0);
  const sent = await OfferService.send(replacement.id);
  assert.ok(sent.sentAt);
  assert.ok(Math.abs(sent.expiresAt.getTime() - sent.sentAt.getTime() - 7 * 86400000) < 1000);
  assert.deepEqual((await CustomerService.getKits(customer.id))[0].offers.map(offer => offer.id), [replacement.id]);
});
