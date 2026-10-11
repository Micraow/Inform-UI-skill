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
test('Net worth source lock preserves build identity without claiming fresh CDN or native geometry', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-net-worth/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'b7adf9469994524366913e68e9d42ea063284885'); assert.equal(lock.protocolNodes, 139);
  assert.equal(lock.files.length, 15); assert.equal(lock.cdnExecuted, false); assert.equal(lock.nativeScenariosExecuted, 0);
  assert.ok(lock.files.every(f => !/(?:AGENTS|private-reference|node_modules|^\/|\.\.)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
});
test('Net worth extends the exact prior 138 schema while its known keyboard gap stays documented', async () => {
  const baseline = JSON.parse(await readFile(new URL('../candidates/restored-net-worth/schema-baseline-138.json', import.meta.url)));
  assert.equal(baseline.nodeRefs.length, 138); assert.equal(Object.keys(baseline.definitions).length, 259);
  const guide = await readFile(new URL('../candidates/restored-net-worth/README.md', import.meta.url), 'utf8'); assert.match(guide, /Ctrl\+Home/); assert.match(guide, /awaiting a small runtime successor/);
});
