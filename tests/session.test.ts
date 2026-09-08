import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { prisma } from '../src/lib/db';
import { SessionService, SESSION_DURATION_MS } from '../src/lib/services/session.service';

const url = new URL(process.env.DATABASE_URL || 'file:///missing');
if (url.hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') {
  throw new Error('Session tests require the isolated local test runner');
}
after(async () => { await prisma.$disconnect(); });

test('sessions use opaque tokens and derive customer/admin identity from their owner', async () => {
  const customer = await prisma.customer.create({ data: { email: 'session-customer@example.invalid', firstName: 'Test', lastName: 'Customer' } });
  const admin = await prisma.user.create({ data: { email: customer.email } });
  const issued = await SessionService.create(customer.id, 'customer');
  assert.match(issued.token, /^v1_[a-f0-9]{64}$/);
  assert.equal(issued.token.includes(customer.id), false);
  assert.deepEqual(await SessionService.getIdentity(issued.token), { id: customer.id, email: customer.email, type: 'customer' });
  const stored = await prisma.authSession.findUniqueOrThrow({ where: { tokenHash: createHash('sha256').update(issued.token).digest('hex') } });
  assert.equal(stored.customerId, customer.id);
  assert.equal(stored.userId, null);
  assert.ok(Math.abs(issued.expiresAt.getTime() - stored.createdAt.getTime() - SESSION_DURATION_MS) < 1000);
  const rotated = await SessionService.create(admin.id, 'admin', issued.token);
  assert.deepEqual(await SessionService.getIdentity(rotated.token), { id: admin.id, email: admin.email, type: 'admin' });
  assert.equal(await SessionService.getIdentity(issued.token), null);
  await SessionService.revoke(rotated.token);
  await SessionService.revoke(rotated.token);
  assert.equal(await SessionService.getIdentity(rotated.token), null);
});

test('malformed, legacy, unknown and modified cookies never authenticate', async () => {
  for (const token of [undefined, '', 'customer-id', JSON.stringify({ id: 'admin-id', type: 'admin' }), `v1_${'0'.repeat(64)}`, `v1_${'f'.repeat(63)}`]) {
    assert.equal(await SessionService.getIdentity(token), null);
    await SessionService.revoke(token);
  }
  const customer = await prisma.customer.create({ data: { email: 'session-tamper@example.invalid', firstName: 'Test', lastName: 'Customer' } });
  const issued = await SessionService.create(customer.id, 'customer');
  const changed = `${issued.token.slice(0, -1)}${issued.token.endsWith('0') ? '1' : '0'}`;
  assert.equal(await SessionService.getIdentity(changed), null);
  assert.ok(await SessionService.getIdentity(issued.token));
});

test('server expiry is enforced at the exact deadline', async (t) => {
  const customer = await prisma.customer.create({ data: { email: 'session-expiry@example.invalid', firstName: 'Test', lastName: 'Customer' } });
  const issued = await SessionService.create(customer.id, 'customer');
  t.mock.timers.enable({ apis: ['Date'], now: issued.expiresAt.getTime() - 1 });
  assert.ok(await SessionService.getIdentity(issued.token));
  t.mock.timers.tick(1);
  assert.equal(await SessionService.getIdentity(issued.token), null);
});

test('database rejects missing, ambiguous and nonexistent session owners', async () => {
  const customer = await prisma.customer.create({ data: { email: 'session-constraints@example.invalid', firstName: 'Test', lastName: 'Customer' } });
  const admin = await prisma.user.create({ data: { email: customer.email } });
  const expiresAt = new Date(Date.now() + 60000);
  await assert.rejects(prisma.authSession.create({ data: { tokenHash: 'a'.repeat(64), expiresAt } }));
  await assert.rejects(prisma.authSession.create({ data: { tokenHash: 'b'.repeat(64), expiresAt, customerId: customer.id, userId: admin.id } }));
  await assert.rejects(SessionService.create('nonexistent-owner', 'customer'));
});
