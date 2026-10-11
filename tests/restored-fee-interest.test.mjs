import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-fee-interest/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-fee-interest/examples/supplied-fee-interest.json', import.meta.url)));
test('Original fee fixture keeps supplied totals, display labels, zero and missing independent', () => {
  const [many, zero, unknown] = input.body[0].ranges;
  assert.equal(many.totalPaid, 900); assert.equal(many.transactions.length, 5); assert.equal(many.transactions[3].amountLabel, 'USD 0.00');
  assert.equal(many.transactions[4].amountLabel, 'Amount not supplied'); assert.equal(zero.totalPaid, 0); assert.equal(unknown.totalPaid, null);
  assert.match(many.transactions[0].logoUrl, /^data:image\/png;base64,/);
});
test('Fee draft has five positive/twelve negative documents with exact issue paths', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 12); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'duplicate transaction in one range')[3], '/body/0/ranges/0/transactions/1/id');
});
