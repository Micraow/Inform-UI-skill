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
test('Pressable source-build lock preserves exact runtime and included NetWorth successor', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-pressable/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'ae77d32314548ddb6e345051c6a9cea1cea3773b'); assert.equal(lock.protocolNodes, 140);
  assert.equal(lock.files.length, 17); assert.equal(lock.cdnExecuted, false); assert.equal(lock.nativeScenariosExecuted, 0);
  assert.ok(lock.files.some(f => f.path === 'src/renderer/net-worth.ts'));
  assert.ok(lock.files.every(f => !/(?:AGENTS|private-reference|node_modules|^\/|\.\.)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
});
test('Pressable preserves all 139 prior definitions and keeps static geometry separate', async () => {
  const baseline = JSON.parse(await readFile(new URL('../candidates/restored-pressable/schema-baseline-139.json', import.meta.url)));
  assert.equal(baseline.nodeRefs.length, 139); assert.equal(Object.keys(baseline.definitions).length, 262);
  const guide = await readFile(new URL('../candidates/restored-pressable/README.md', import.meta.url), 'utf8'); assert.match(guide, /No new CDN, native button activation, geometry or pixel acceptance/);
});
