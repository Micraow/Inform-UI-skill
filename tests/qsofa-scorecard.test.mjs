import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cases } from '../candidates/qsofa-scorecard/cases.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('original qSOFA vectors preserve consensus GCS14, independent criteria and incomplete totals', async () => {
  const v = await read('candidates/qsofa-scorecard/arithmetic-vectors.json');
  assert.equal(v.cases.length, 23); assert.equal(new Set(v.cases.map(x => x.id)).size, 23);
  const gcs = v.cases.filter(x => x.input.mentation?.mode === 'gcs' && [13,14,15].includes(x.input.mentation.score));
  assert.deepEqual(gcs.map(x => [x.input.mentation.score, x.expected.total]), [[13,2],[14,2],[15,1]]);
  const nt = v.cases.find(x => x.input.mentation?.score === 'NT'); assert.equal(nt.expected.status, 'incomplete'); assert.equal('total' in nt.expected, false);
  assert.equal(v.clinicalValidation, false);
});

test('synthetic documents keep independent defaults and ten accepted/fourteen rejected structural cases', async () => {
  const f = await read('candidates/qsofa-scorecard/examples/original-criteria.json'), before = JSON.stringify(f), c = cases(f), n = f.body[0];
  assert.equal(n.initial.mentation.altered, false); assert.equal(n.defaults.mentation.altered, true);
  assert.equal(n.initial.respiratoryRate, 22); assert.equal(n.defaults.respiratoryRate, 21.5);
  assert.equal(c.positives.length, 10); assert.equal(c.negatives.length, 14); assert.equal(JSON.stringify(f), before);
});

test('candidate identity keeps published214 package and clinical boundary separate', async () => {
  const l = await read('candidates/qsofa-scorecard/runtime-lock.safe.json');
  assert.equal(l.source, '09475c7b899dc1eb2e46c8f59f8ed45d2afd99b6'); assert.equal(l.files.length, 47);
  assert.equal(l.protocolNodes, 217); assert.equal(l.implemented, 211); assert.equal(l.publicCommit, null);
  assert.equal(l.fullNewCDN, false); assert.equal(l.clinicalValidation, false);
  for (const f of l.files) { assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path)); }
  const old = await read('candidates/recovery214/runtime-lock.safe.json'); assert.equal(old.protocolNodes, 214); assert.equal(old.publicCommit, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597');
});

test('actual source and standalone receipt states only executed software checks', async () => {
  const r = await read('candidates/qsofa-scorecard/consumer-result.json');
  assert.equal(r.arithmeticChecks, 49); assert.equal(r.originalJsonVectors, 23);
  assert.equal(r.positiveDocuments, 10); assert.equal(r.negativeDocuments, 14); assert.equal(r.passed, 5); assert.equal(r.failed, 0);
  assert.equal(r.filesChecked, 47); assert.equal(r.preservedDefinitions, 390); assert.equal(r.standalone.executed, true);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0); assert.equal(r.clinicalValidation, false); assert.equal(r.nativeExecutedByConsumer, false);
});
