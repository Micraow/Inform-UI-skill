import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-pressable/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-pressable/examples/supplied-pressable.json', import.meta.url)));
test('Original pressable uses stable explicit action naming and independent passive state', () => {
  const n = input.body[0]; assert.equal(n.type, 'pressable'); assert.equal(n.actionId, 'review-items');
  assert.deepEqual(n.disabled, { $: 'blocked' }); assert.deepEqual(n.children[0].children[1].value, { $: 'count' });
  assert.equal(n.label, 'Review the supplied items'); assert.equal(input.state.count, 3);
});
test('Pressable drafts separate passive content defects from structural fields', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 10); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'nested interactive text link')[3], '/body/0/children/0/children/0/runs/0/href');
});
