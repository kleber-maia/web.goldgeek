import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { OfferService } from '../src/lib/services/offer.service';
import { PaymentDetailsService } from '../src/lib/services/payment-details.service';
import { PaymentService } from '../src/lib/services/payment.service';
import type { OfferStatus, KitStatus } from '@prisma/client';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

async function fixture(name: string, status: OfferStatus = 'SENT', kitStatus: KitStatus = 'OFFER_SENT', expired = false) {
  const customer = await prisma.customer.create({ data: { email: `${name}@example.invalid`, firstName: 'Test', lastName: 'Owner' } });
  const kit = await prisma.kit.create({ data: { customerId: customer.id, kitNumber: `KIT-${name}`, status: kitStatus, shippingAddress: { street1: '123 Test St', city: 'Orlando', state: 'FL', zipCode: '32801' } } });
  const offer = await prisma.offer.create({ data: { kitId: kit.id, offerNumber: `OFFER-${name}`, status, totalValue: 100, itemBreakdown: [{ itemId: 'ring', description: 'Original ring', value: '100.00', quantity: 2 }], expiresAt: new Date(Date.now() + (expired ? -1000 : 60000)) } });
  return { customer, kit, offer };
}

test('opposing and duplicate responses create exactly one financial or return obligation', async () => {
  const { customer, kit, offer } = await fixture('concurrent-decision');
  const outcomes = await Promise.allSettled([OfferService.accept(offer.id, customer.id), OfferService.decline(offer.id, customer.id)]);
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
  const current = await prisma.offer.findUniqueOrThrow({ where: { id: offer.id } });
  if (current.status === 'ACCEPTED') await OfferService.accept(offer.id, customer.id);
  else await OfferService.decline(offer.id, customer.id);
  assert.equal(await prisma.payment.count({ where: { offerId: offer.id } }) + await prisma.return.count({ where: { kitId: kit.id } }), 1);
  assert.equal((await prisma.kit.findUniqueOrThrow({ where: { id: kit.id } })).status, current.status);
  assert.equal(await prisma.timelineEvent.count({ where: { kitId: kit.id, type: { in: ['OFFER_ACCEPTED', 'OFFER_DECLINED'] } } }), 1);
});

test('expired, draft, superseded and cancelled offers cannot be accepted or declined', async () => {
  for (const [name, status, kitStatus, expired] of [
    ['expired', 'SENT', 'OFFER_SENT', true], ['draft', 'DRAFT', 'EVALUATING', false],
    ['superseded', 'EXPIRED', 'OFFER_SENT', false], ['cancelled', 'SENT', 'CANCELLED', false],
  ] as const) {
    const { customer, kit, offer } = await fixture(name, status, kitStatus, expired);
    await assert.rejects(OfferService.accept(offer.id, customer.id));
    await assert.rejects(OfferService.decline(offer.id, customer.id));
    assert.equal(await prisma.payment.count({ where: { offerId: offer.id } }), 0);
    assert.equal(await prisma.return.count({ where: { kitId: kit.id } }), 0);
  }
});

test('missing payout details leave the offer unchanged and accepted destinations are immutable', async () => {
  const { customer, offer } = await fixture('payout-snapshot');
  await assert.rejects(OfferService.accept(offer.id, customer.id, 'PAYPAL'));
  assert.equal((await prisma.offer.findUniqueOrThrow({ where: { id: offer.id } })).status, 'SENT');
  await PaymentDetailsService.save(customer.id, 'PAYPAL', { paypalEmail: 'original@example.invalid' });
  await OfferService.accept(offer.id, customer.id);
  await PaymentDetailsService.save(customer.id, 'PAYPAL', { paypalEmail: 'changed@example.invalid' });
  const payment = await prisma.payment.findUniqueOrThrow({ where: { offerId: offer.id } });
  assert.equal(payment.method, 'PAYPAL');
  assert.equal(PaymentDetailsService.decrypt(payment.accountInfo).paypalEmail, 'original@example.invalid');
  assert.equal(JSON.stringify(payment.accountInfo).includes('original@example.invalid'), false);
});

test('payout methods retain each other details and mask bank numbers', async () => {
  const { customer } = await fixture('payout-methods');
  await PaymentDetailsService.save(customer.id, 'ACH', { bankRouting: '021000021', bankAccount: '000123456789' });
  await PaymentDetailsService.save(customer.id, 'VENMO', { venmoHandle: '@preview-user' });
  const saved = await PaymentDetailsService.save(customer.id, 'ACH', { bankRouting: '****0021', bankAccount: '****6789' });
  assert.equal(saved.accountInfo.bankAccount, '****6789');
  const stored = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
  assert.equal(PaymentDetailsService.preferences(stored.paymentPreferences).accountInfo.venmoHandle, '@preview-user');
  assert.equal(JSON.stringify(stored.paymentPreferences).includes('000123456789'), false);
  await assert.rejects(PaymentDetailsService.save(customer.id, 'ACH', { bankAccount: '123' }));
});

test('failed payment retries reuse the obligation and preserve its accepted instructions', async () => {
  const { customer, offer } = await fixture('payment-retry');
  await OfferService.accept(offer.id, customer.id);
  const payment = await prisma.payment.findUniqueOrThrow({ where: { offerId: offer.id } });
  await PaymentService.updateStatus(payment.id, 'FAILED');
  const retried = await PaymentService.create({ offerId: offer.id, customerId: customer.id, amount: 999, method: 'CHECK' });
  assert.equal(retried.id, payment.id);
  assert.equal(retried.amount.toString(), '100');
  assert.deepEqual(retried.accountInfo, payment.accountInfo);
  assert.equal(retried.status, 'PENDING');
  assert.equal(await prisma.payment.count({ where: { offerId: offer.id } }), 1);
});
