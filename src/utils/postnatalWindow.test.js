import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findActivePostnatalRecord,
  isPostnatalWindowActive,
  POSTNATAL_VALIDITY_MS,
} from './postnatalWindow.js';

const deliveryAt = Date.parse('2026-01-01T10:00:00.000Z');

test('postnatal window is active from delivery until just before 41 days', () => {
  assert.equal(isPostnatalWindowActive(deliveryAt, deliveryAt), true);
  assert.equal(
    isPostnatalWindowActive(deliveryAt, deliveryAt + POSTNATAL_VALIDITY_MS - 1),
    true,
  );
  assert.equal(
    isPostnatalWindowActive(deliveryAt, deliveryAt + POSTNATAL_VALIDITY_MS),
    false,
  );
});

test('postnatal window rejects future and invalid delivery dates', () => {
  assert.equal(isPostnatalWindowActive(deliveryAt, deliveryAt - 1), false);
  assert.equal(isPostnatalWindowActive('not a date', deliveryAt), false);
});

test('latest active delivery record is selected for the postnatal action', () => {
  const olderRecord = { _id: 'older', delivery: { deliveryAt } };
  const newerRecord = {
    _id: 'newer',
    delivery: { deliveryAt: new Date(deliveryAt + 2 * 24 * 60 * 60 * 1000) },
  };

  assert.equal(
    findActivePostnatalRecord([olderRecord, newerRecord], deliveryAt + 3 * 24 * 60 * 60 * 1000),
    newerRecord,
  );
  assert.equal(findActivePostnatalRecord([olderRecord], deliveryAt + POSTNATAL_VALIDITY_MS), null);
});
