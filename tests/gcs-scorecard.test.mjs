import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cases } from '../candidates/gcs-scorecard/cases.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('original numeric vectors cover all120 distinct triplets with unitless integer sums', async () => {
  const v = await read('candidates/gcs-scorecard/numeric-vectors.json');
  assert.equal(v.version, 'gcs-six-motor-levels'); assert.equal(v.population, 'adult');
  assert.equal(v.cases.length, 120); assert.equal(new Set(v.cases.map(x => [x.eye, x.verbal, x.motor].join('/'))).size, 120);
  assert.deepEqual([...new Set(v.cases.map(x => x.expectedSum))].sort((a, b) => a - b), Array.from({ length: 13 }, (_, i) => i + 3));
  for (const x of v.cases) assert.equal(x.expectedSum, x.eye + x.verbal + x.motor);
});

test('original scorecard distinguishes a supplied initial record from independent defaults', async () => {
  const fixture = await read('candidates/gcs-scorecard/examples/original-numeric-scorecard.json');
  const n = fixture.body[0], before = JSON.stringify(fixture), c = cases(fixture);
  assert.equal(n.initial.eye + n.initial.verbal + n.initial.motor, 9);
  assert.equal(n.defaults.eye + n.defaults.verbal + n.defaults.motor, 6);
  assert.equal(n.fields.eye.variant, 'segmented'); assert.equal(n.fields.verbal.variant, 'select');
  assert.equal(n.infoSections.length, 3); assert.equal(n.notes.length, 2);
  assert.equal(c.positives.length, 10); assert.equal(c.negatives.length, 14);
  assert.equal(JSON.stringify(fixture), before);
  assert.ok(c.positives.some(([name]) => name === 'numeric string displayed invalid'));
  assert.ok(c.negatives.some(([name]) => name === 'boolean rating'));
});

test('source-built candidate lock preserves existing public214 assets and has no clinical claim', async () => {
  const l = await read('candidates/gcs-scorecard/runtime-lock.safe.json');
  assert.equal(l.source, '901406db5d3a02c2dffa069c670e983076502096');
  assert.equal(l.files.length, 45); assert.equal(l.protocolNodes, 215); assert.equal(l.implemented, 209);
  assert.equal(l.fullNewCDN, false); assert.equal(l.clinicalValidation, false);
  for (const f of l.files) { assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path)); }
  const old = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(old.publicCommit, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597'); assert.equal(old.protocolNodes, 214);
});

test('actual software consumer receipt preserves structure, arithmetic and execution boundaries', async () => {
  const r = await read('candidates/gcs-scorecard/consumer-result.json');
  assert.equal(r.arithmeticChecks, 143); assert.equal(r.numericCombinations, 120);
  assert.equal(r.positiveDocuments, 10); assert.equal(r.negativeDocuments, 14); assert.equal(r.passed, 7); assert.equal(r.failed, 0);
  assert.equal(r.filesChecked, 45); assert.equal(r.preservedDefinitions, 386); assert.equal(r.standalone.executed, true);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0); assert.equal(r.nativeExecutedByConsumer, false);
  assert.equal(r.clinicalValidation, false); assert.equal(r.fullNewCDN, false);
});
