import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cases } from '../candidates/rox-scorecard/cases.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('original ROX vectors distinguish explicit units and unrounded study comparison', async () => {
  const v = await read('candidates/rox-scorecard/arithmetic-vectors.json');
  assert.equal(v.cases.length, 30); assert.equal(new Set(v.cases.map(x => x.id)).size, 30);
  const find = id => v.cases.find(x => x.id === id);
  assert.equal(find('fraction-baseline').expected.value, find('percent-equivalent').expected.value);
  assert.equal(find('small-percent-not-inferred').expected.fio2Fraction, 0.005);
  assert.equal(find('same-rounded-below-upper').expected.display, '4.9');
  assert.equal(find('same-rounded-above-upper').expected.display, '4.9');
  assert.notEqual(find('same-rounded-below-upper').expected.band, find('same-rounded-above-upper').expected.band);
  assert.equal(v.clinicalValidation, false);
});

test('synthetic fixture retains independent defaults and ten accepted/twelve rejected documents', async () => {
  const f = await read('candidates/rox-scorecard/examples/original-unit-scorecard.json'), before = JSON.stringify(f), c = cases(f), n = f.body[0];
  assert.equal(n.initial.spo2Percent / (n.initial.fio2 / 100) / n.initial.respiratoryRate, 9);
  assert.equal(n.defaults.spo2Percent / n.defaults.fio2 / n.defaults.respiratoryRate, 2.375);
  assert.equal(n.initial.studyContextConfirmed, false); assert.equal(n.initial.measuredHours, 6);
  assert.equal(c.positives.length, 10); assert.equal(c.negatives.length, 12); assert.equal(JSON.stringify(f), before);
});

test('source candidate does not alter the fixed public214 asset lock', async () => {
  const l = await read('candidates/rox-scorecard/runtime-lock.safe.json');
  assert.equal(l.source, '8834c693d1d54772fad62883f8781f064fa4107c'); assert.equal(l.files.length, 45);
  assert.equal(l.protocolNodes, 216); assert.equal(l.implemented, 210); assert.equal(l.publicCommit, 'd9b0ed410d9aa2dd7f8fa888ff44b22595239853');
  assert.equal(l.fullNewCDN, false); assert.equal(l.clinicalValidation, false);
  for (const f of l.files) { assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path)); }
  const prior = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(prior.publicCommit, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597'); assert.equal(prior.protocolNodes, 214);
});

test('actual source/standalone result records only executed software coverage', async () => {
  const r = await read('candidates/rox-scorecard/consumer-result.json');
  assert.equal(r.arithmeticChecks, 40); assert.equal(r.originalJsonVectors, 30);
  assert.equal(r.positiveDocuments, 10); assert.equal(r.negativeDocuments, 12); assert.equal(r.passed, 5); assert.equal(r.failed, 0);
  assert.equal(r.filesChecked, 45); assert.equal(r.preservedDefinitions, 388); assert.equal(r.standalone.executed, true);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0); assert.equal(r.nativeExecutedByConsumer, false); assert.equal(r.clinicalValidation, false);
});
