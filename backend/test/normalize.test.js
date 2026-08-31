import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, normalizeCode, normalizeHeader, escapeRegex } from '../src/utils/normalize.js';

test('normalizes scanner identifiers consistently', () => {
  assert.equal(normalizeCode(' a4: 7b 22 '), 'A4:7B22');
  assert.equal(normalizeCode(null), '');
});

test('normalizes spreadsheet headers', () => {
  assert.equal(normalizeHeader('Student ID'), 'studentid');
  assert.equal(clean('  Rahul  '), 'Rahul');
});

test('escapes regex input used by student search', () => {
  assert.equal(escapeRegex('A+B(1)'), 'A\\+B\\(1\\)');
});
