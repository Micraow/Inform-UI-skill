import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-net-worth/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-net-worth/examples/supplied-net-worth.json', import.meta.url)));
test('Original net worth fixture keeps supplied summaries, null gaps and true zero distinct', () => {
  const n = input.body[0]; assert.equal(n.type, 'ledger-net-worth');
  assert.equal(n.intervals[0].currentValue, 900); assert.equal(n.intervals[0].points.at(-1).value, 120);
  assert.deepEqual(n.intervals[0].points.map(p => p.value), [0, null, -40, 120]);
  assert.equal(n.intervals[1].currentValue, null); assert.equal(n.intervals[2].currentValue, 0);
});
test('Net worth draft cases are deterministic and preserve semantic paths', () => {
  const before = JSON.stringify(input), c = buildCases(input);
  assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 12); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'duplicate observation date')[3], '/body/0/intervals/0/points/1/date');
});
