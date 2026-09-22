import test from 'node:test';
import assert from 'node:assert/strict';
import { readCardUid } from '../src/services/nfcReaderService.js';

test('reads a card UID after transient PC/SC failures on the same tap', async () => {
  let attempts = 0;
  const card = { transmit: async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('Card not ready');
    return Buffer.from([0x23, 0xa8, 0x70, 0x0e, 0x90, 0x00]);
  } };
  assert.equal(await readCardUid(card), '23A8700E');
  assert.equal(attempts, 3);
});
