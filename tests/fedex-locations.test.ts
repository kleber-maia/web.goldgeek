import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { FedExClient } from '../src/lib/fedex/client';
import { ShippingService } from '../src/lib/services/shipping.service';
import { prisma } from '../src/lib/db';

after(async () => { await prisma.$disconnect(); });

test('digital kit location lookup sends its address and preserves nearby results', async t => {
  const locations = [{ street: '123 Carrier Street', city: 'Orlando', state: 'FL', zip: '32801', distance: '1 mi', description: 'FedEx Office' }];
  const search = t.mock.method(FedExClient, 'searchLocations', async () => locations);
  assert.deepEqual(await ShippingService.nearbyDropOffLocations({ zipCode: '32801', state: 'FL', city: 'Orlando' }), locations);
  assert.deepEqual(search.mock.calls[0].arguments, ['32801', 'FL', 'Orlando', 3]);
});

test('carrier failure and empty location results preserve the finder fallback', async t => {
  const search = t.mock.method(FedExClient, 'searchLocations', async () => { throw new Error('Carrier unavailable'); });
  const address = { zipCode: '32801', state: 'FL', city: 'Orlando' };
  assert.deepEqual(await ShippingService.nearbyDropOffLocations(address), []);
  search.mock.mockImplementation(async () => []);
  assert.deepEqual(await ShippingService.nearbyDropOffLocations(address), []);
});

test('optional lookup deadline includes OAuth and falls back when it stalls', async t => {
  const controller = new AbortController();
  const timeout = t.mock.method(AbortSignal, 'timeout', () => controller.signal);
  const token = t.mock.method(FedExClient, 'getToken', async (signal?: AbortSignal) => new Promise<string>((_, reject) => {
    signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const pending = ShippingService.nearbyDropOffLocations({ zipCode: '32801', state: 'FL', city: 'Orlando' });
  assert.equal(token.mock.calls[0].arguments[0], controller.signal);
  assert.equal(timeout.mock.calls[0].arguments[0], 5000);
  controller.abort(new DOMException('Timed out', 'TimeoutError'));
  assert.deepEqual(await pending, []);
});

test('carrier lookup requests staffed stores, excludes unstaffed results, and maps address and distance', async t => {
  t.mock.method(FedExClient, 'getToken', async () => 'test-token');
  const fetched = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ output: { locationDetailList: [
    { locationType: 'FEDEX_SELF_SERVICE_LOCATION' },
    { locationType: 'FEDEX_SHIP_AND_GET' },
    { locationType: 'UNKNOWN' },
    ...Array.from({ length: 6 }, (_, i) => ({ locationType: 'FEDEX_OFFICE', contactAndAddress: { address: { streetLines: [`${i} Store Street`], city: 'Orlando', stateOrProvinceCode: 'FL', postalCode: '32801' }, addressAncillaryDetail: { displayName: 'FedEx Office' } }, distance: { value: i + 1, units: 'MI' } })),
  ] } }), { status: 200 }));
  const locations = await ShippingService.nearbyDropOffLocations({ zipCode: '32801', state: 'FL', city: 'Orlando' });
  assert.equal(locations.length, 3);
  assert.deepEqual(locations[0], { street: '0 Store Street', city: 'Orlando', state: 'FL', zip: '32801', distance: '1 mi', description: 'FedEx Office' });
  const init = fetched.mock.calls[0].arguments[1] as RequestInit;
  const body = JSON.parse(init.body as string);
  assert.deepEqual(body.location.address, { postalCode: '32801', stateOrProvinceCode: 'FL', city: 'Orlando', countryCode: 'US' });
  assert.ok(body.locationTypes.includes('FEDEX_OFFICE'));
  assert.ok(!body.locationTypes.includes('FEDEX_SELF_SERVICE_LOCATION'));
  assert.equal(body.resultsRequested, 3);
  assert.ok(init.signal instanceof AbortSignal);
});
