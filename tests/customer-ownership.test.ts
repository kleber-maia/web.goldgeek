import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { CustomerService } from '../src/lib/services/customer.service';
import { OfferService } from '../src/lib/services/offer.service';
import { accountKitRequestSchema } from '../src/lib/validators/customer';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

test('concurrent address changes retain one default per type and deletion promotes a replacement', async () => {
  const customer = await prisma.customer.create({ data: { email: 'defaults@example.invalid', firstName: 'Default', lastName: 'Test' } });
  const addresses = await Promise.all(Array.from({ length: 8 }, (_, i) => CustomerService.addAddress(customer.id, {
    type: 'shipping', street1: `${i} Test St`, city: 'Orlando', state: 'FL', zipCode: '32801', country: 'US', isDefault: true,
  })));
  assert.equal(await prisma.address.count({ where: { customerId: customer.id, isDefault: true } }), 1);
  await Promise.all(addresses.map(address => CustomerService.updateAddress(address.id, customer.id, { isDefault: true })));
  const current = await prisma.address.findMany({ where: { customerId: customer.id, isDefault: true } });
  assert.equal(current.length, 1);
  await CustomerService.deleteAddress(current[0].id, customer.id);
  assert.equal(await prisma.address.count({ where: { customerId: customer.id, isDefault: true } }), 1);
});

test('clearing optional profile and address fields persists and invalid input is rejected before mutation', async () => {
  const customer = await prisma.customer.create({ data: { email: 'clear@example.invalid', firstName: 'Test', lastName: 'Person', phone: '4075550100' } });
  await CustomerService.upsertProfile(customer.id, { firstName: 'Test', lastName: 'Person', phone: '' });
  assert.equal((await CustomerService.getById(customer.id))?.phone, '');
  await assert.rejects(CustomerService.upsertProfile(customer.id, { firstName: '   ', lastName: 'Person' }));
  const address = await CustomerService.addAddress(customer.id, { type: 'shipping', street1: '123 Test St', street2: 'Suite 2', city: 'Orlando', state: 'FL', zipCode: '32801', country: 'US', isDefault: true });
  assert.equal((await CustomerService.updateAddress(address.id, customer.id, { street2: '' })).street2, '');
  await assert.rejects(CustomerService.updateAddress(address.id, customer.id, { street1: '   ' }));
  const valid = { kitType: 'DIGITAL', shippingAddress: { type: 'shipping', street1: '123 Test St', city: 'Orlando', state: 'FL', zipCode: '32801' } };
  assert.equal(accountKitRequestSchema.safeParse(valid).success, true);
  for (const invalid of [{ ...valid, kitType: 'INVALID' }, { ...valid, estimatedValue: -1 }, { ...valid, notes: 'a'.repeat(2001) }, { ...valid, shippingAddress: { ...valid.shippingAddress, zipCode: 'abcde' } }]) {
    assert.equal(accountKitRequestSchema.safeParse(invalid).success, false);
  }
});

test('address ownership is enforced and untrusted fields cannot transfer ownership', async () => {
  const owner = await prisma.customer.create({ data: { email: 'address-owner@example.invalid', firstName: 'Owner', lastName: 'Test' } });
  const stranger = await prisma.customer.create({ data: { email: 'address-stranger@example.invalid', firstName: 'Stranger', lastName: 'Test' } });
  const address = await CustomerService.addAddress(owner.id, { type: 'shipping', street1: '123 Test St', city: 'Orlando', state: 'FL', zipCode: '32801', country: 'US', isDefault: true });
  await assert.rejects(CustomerService.updateAddress(address.id, stranger.id, { street1: 'Stolen' }));
  await assert.rejects(CustomerService.deleteAddress(address.id, stranger.id));
  const injected = { street1: '456 Test St', customerId: stranger.id, id: 'replacement' };
  const updated = await CustomerService.updateAddress(address.id, owner.id, injected);
  assert.equal(updated.street1, '456 Test St');
  assert.equal(updated.customerId, owner.id);
  assert.equal(updated.id, address.id);
  await assert.rejects(CustomerService.updateAddress(address.id, owner.id, { state: 'invalid' }));
  await CustomerService.deleteAddress(address.id, owner.id);
  assert.equal(await prisma.address.findUnique({ where: { id: address.id } }), null);
});

test('another customer cannot accept or decline an offer or create timeline side effects', async () => {
  const owner = await prisma.customer.create({ data: { email: 'offer-owner@example.invalid', firstName: 'Owner', lastName: 'Test' } });
  const stranger = await prisma.customer.create({ data: { email: 'offer-stranger@example.invalid', firstName: 'Stranger', lastName: 'Test' } });
  const kit = await prisma.kit.create({ data: { customerId: owner.id, kitNumber: 'OWNERSHIP-KIT', status: 'OFFER_SENT', shippingAddress: { street1: '123 Test St', city: 'Orlando', state: 'FL', zipCode: '32801' } } });
  const offer = await prisma.offer.create({ data: { kitId: kit.id, offerNumber: 'OWNERSHIP-OFFER', status: 'SENT', totalValue: 100, itemBreakdown: [], expiresAt: new Date(Date.now() + 60000) } });
  await assert.rejects(OfferService.accept(offer.id, stranger.id));
  await assert.rejects(OfferService.decline(offer.id, stranger.id));
  assert.equal((await prisma.offer.findUniqueOrThrow({ where: { id: offer.id } })).status, 'SENT');
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } })).status, 'OFFER_SENT');
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id } }), 0);
  assert.equal((await OfferService.accept(offer.id, owner.id)).status, 'ACCEPTED');
});
