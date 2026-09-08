import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { POST as expire } from '../src/app/api/cron/expire-offers/route';
import { POST as notify } from '../src/app/api/cron/notifications/route';
import { buildBaseUrlFromHeaders, buildBaseUrlFromRequest } from '../src/lib/url';
import { prisma } from '../src/lib/db';
after(async () => { await prisma.$disconnect(); });

test('background routes reject missing secrets and incorrect credentials before doing work', async () => {
  const original = process.env.CRON_SECRET;
  try {
    for (const handler of [expire, notify]) {
      delete process.env.CRON_SECRET;
      assert.equal((await handler(new Request('http://localhost/api/cron/test', { method: 'POST', headers: { authorization: 'Bearer undefined' } }))).status, 401);
      process.env.CRON_SECRET = 'test-only-secret';
      assert.equal((await handler(new Request('http://localhost/api/cron/test', { method: 'POST', headers: { authorization: 'Bearer wrong' } }))).status, 401);
    }
  } finally { if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original; }
});

test('magic-link origins ignore attacker-controlled host and forwarding headers', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'https://goldgeek.example';
  try {
    const headers = new Headers({ host: 'evil.example', origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'http' });
    assert.equal(buildBaseUrlFromHeaders(headers), 'https://goldgeek.example');
    assert.equal(buildBaseUrlFromRequest(new Request('https://evil.example', { headers })), 'https://goldgeek.example');
  } finally { if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = original; }
});
