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
test('Fee draft has six positive/twelve negative documents with exact issue paths', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 12); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'duplicate transaction in one range')[3], '/body/0/ranges/0/transactions/1/id');
});
test('Fee source-build lock and 140 baseline are exact selected-file contracts', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-fee-interest/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'aed78e46df9f2d054046523e83c3bfd9e860715a'); assert.equal(lock.protocolNodes, 141); assert.equal(lock.files.length, 15);
  assert.equal(lock.cdnExecuted, false); assert.equal(lock.nativeScenariosExecuted, 0);
  assert.ok(lock.files.every(f => !/(?:AGENTS|private-reference|node_modules|^\/|\.\.)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
  const baseline = JSON.parse(await readFile(new URL('../candidates/restored-fee-interest/schema-baseline-140.json', import.meta.url)));
  assert.equal(baseline.nodeRefs.length, 140); assert.equal(Object.keys(baseline.definitions).length, 263);
});
test('Six-row positive actually exceeds the renderer collapsed threshold of five', () => {
  const six = buildCases(input).positives.find(([n]) => n === 'six-row disclosure')[1];
  assert.equal(input.body[0].ranges[0].transactions.length, 5); assert.equal(six.body[0].ranges[0].transactions.length, 6);
  assert.equal(new Set(six.body[0].ranges[0].transactions.map(r => r.id)).size, 6);
});
