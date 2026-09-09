import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { prisma } from '../src/lib/db';
import { createMagicLink, verifyMagicLink } from '../src/lib/auth/magic-link';
import { safeLoginDestination } from '../src/lib/auth/redirect';
import { AuthRateLimitService } from '../src/lib/services/auth-rate-limit.service';
import { POST as webhook } from '../src/app/api/webhooks/fedex/route';

if (new URL(process.env.DATABASE_URL || 'file:///missing').hostname !== '127.0.0.1' || process.env.NODE_ENV !== 'test') throw new Error('Use the isolated test runner');
after(async () => { await prisma.$disconnect(); });

test('customer login never selects an administrator sharing the same email', async () => {
  const email = 'dual-identity@example.invalid';
  const admin = await prisma.user.create({ data: { email } });
  const customerLink = await createMagicLink(email);
  assert.equal(customerLink.type, 'customer');
  const customer = await verifyMagicLink(customerLink.token);
  assert.equal(customer?.type, 'customer');
  assert.notEqual(customer?.id, admin.id);
  const adminLink = await createMagicLink(email, 'admin');
  assert.deepEqual(await verifyMagicLink(adminLink.token), { id: admin.id, type: 'admin' });
  await assert.rejects(createMagicLink('unknown-admin@example.invalid', 'admin'));
});

test('simultaneous magic-link consumption succeeds exactly once', async () => {
  const link = await createMagicLink('single-use@example.invalid');
  const results = await Promise.all(Array.from({ length: 8 }, () => verifyMagicLink(link.token)));
  assert.equal(results.filter(Boolean).length, 1);
  const expired = await createMagicLink('expired-link@example.invalid');
  await prisma.customerMagicLink.update({ where: { token: expired.token }, data: { expiresAt: new Date(0) } });
  assert.equal(await verifyMagicLink(expired.token), null);
});

test('redirect destinations remain inside the correct dashboard', () => {
  for (const value of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/account/../../admin', '/admin', '/account/login', '/account\n/evil']) {
    assert.equal(safeLoginDestination(value), '/account');
  }
  assert.equal(safeLoginDestination('/account/kits?page=2#recent'), '/account/kits?page=2#recent');
  assert.equal(safeLoginDestination('/admin/payments?status=pending', 'admin'), '/admin/payments?status=pending');
  assert.equal(safeLoginDestination('/account', 'admin'), '/admin');
});

test('shared database rate limits hold under concurrent requests and reset after the window', async () => {
  const results = await Promise.all(Array.from({ length: 10 }, () => AuthRateLimitService.allow('test-concurrent-limit', 5)));
  assert.equal(results.filter(Boolean).length, 5);
  await prisma.authRequestLimit.updateMany({ data: { expiresAt: new Date(0) } });
  assert.equal(await AuthRateLimitService.allow('test-concurrent-limit', 5), true);
});

test('webhooks fail closed for missing secrets and malformed signatures', async () => {
  const previous = process.env.FEDEX_WEBHOOK_SECRET;
  delete process.env.FEDEX_WEBHOOK_SECRET;
  assert.equal((await webhook(new Request('http://localhost/api/webhooks/fedex', { method: 'POST', body: '{}' }))).status, 401);
  process.env.FEDEX_WEBHOOK_SECRET = 'isolated-test-secret';
  try {
    for (const signature of ['', 'short', 'x'.repeat(64), '0'.repeat(64)]) {
      assert.equal((await webhook(new Request('http://localhost/api/webhooks/fedex', { method: 'POST', body: '{}', headers: { 'x-fedex-signature': signature } }))).status, 401);
    }
    const signature = createHmac('sha256', process.env.FEDEX_WEBHOOK_SECRET).update('{}').digest('hex');
    assert.equal((await webhook(new Request('http://localhost/api/webhooks/fedex', { method: 'POST', body: '{}', headers: { 'x-fedex-signature': signature } }))).status, 200);
  } finally {
    if (previous === undefined) delete process.env.FEDEX_WEBHOOK_SECRET;
    else process.env.FEDEX_WEBHOOK_SECRET = previous;
  }
});

test('documented FedEx base64 signatures authenticate the exact body without fallback', async () => {
  const previous = process.env.FEDEX_WEBHOOK_SECRET;
  process.env.FEDEX_WEBHOOK_SECRET = 'isolated-base64-secret';
  const body = '{}';
  const signature = createHmac('sha256', process.env.FEDEX_WEBHOOK_SECRET).update(body).digest('base64');
  const legacy = createHmac('sha256', process.env.FEDEX_WEBHOOK_SECRET).update(body).digest('hex');
  const send = (value: string, payload = body) => webhook(new Request('http://localhost/api/webhooks/fedex', { method: 'POST', body: payload, headers: { 'fdx-signature': value, 'x-fedex-signature': legacy } }));
  try {
    assert.equal((await send(signature)).status, 200);
    assert.equal((await send(signature, '{"changed":true}')).status, 401);
    for (const invalid of ['', 'short', signature.slice(0, -1), 'A'.repeat(43) + '=']) assert.equal((await send(invalid)).status, 401);
  } finally { if (previous === undefined) delete process.env.FEDEX_WEBHOOK_SECRET; else process.env.FEDEX_WEBHOOK_SECRET = previous; }
});
