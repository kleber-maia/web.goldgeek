import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentDetailsService } from '../src/lib/services/payment-details.service';

test('encrypted payment details round trip and reject modified ciphertext', () => {
  const details = { bankRouting: '021000021', bankAccount: '123456789' };
  const envelope = PaymentDetailsService.encrypt(details);
  assert.deepEqual(PaymentDetailsService.decrypt(envelope), details);
  assert.equal(JSON.stringify(envelope).includes('123456789'), false);
  assert.throws(() => PaymentDetailsService.decrypt({ ...envelope, ciphertext: 'AAAA' }));
  assert.deepEqual(PaymentDetailsService.decrypt(details), details);
});

test('invalid routing checksums, unusable Zelle numbers and incomplete check snapshots are rejected', () => {
  assert.throws(() => PaymentDetailsService.validate('ACH', { bankRouting: '000000000', bankAccount: '123456' }));
  assert.throws(() => PaymentDetailsService.validate('ACH', { bankRouting: '021000022', bankAccount: '123456' }));
  assert.throws(() => PaymentDetailsService.validate('ZELLE', { zellePhone: '( )--( )--' }));
  assert.throws(() => PaymentDetailsService.validateSnapshot('CHECK', {}));
  const snapshot = PaymentDetailsService.checkDestination({ firstName: 'Test', lastName: 'Payee' }, { street1: '123 Test Street', city: 'Orlando', state: 'FL', zipCode: '32801' });
  assert.equal(snapshot.name, 'Test Payee');
  assert.doesNotThrow(() => PaymentDetailsService.validateSnapshot('CHECK', snapshot));
});
