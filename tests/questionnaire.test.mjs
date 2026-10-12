import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cases } from '../candidates/questionnaire/cases.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('original packing example makes unknown, zero, false and the hidden branch explicit', async () => {
  const doc = await read('candidates/questionnaire/examples/event-packing.json'), n = doc.body[0];
  assert.equal(n.type, 'questionnaire'); assert.equal(n.questionnaireId, 'toy_event_packing'); assert.equal(n.version, '1.0.0');
  assert.equal(n.initialAnswers.participants, null); assert.equal(n.initialAnswers.borrowed, false); assert.equal(n.hiddenValuePolicy, 'retain');
  assert.equal(n.fields.find(x => x.id === 'packsEach').min, 0); assert.equal(n.fields.find(x => x.id === 'seats').visibleWhen.op, 'eq');
  assert.deepEqual(n.sources, [{ title: '本示例原创活动打包规则，无外部评分标准', version: '1.0.0' }]);
  const before = JSON.stringify(doc), c = cases(doc); assert.equal(c.positives.length, 10); assert.equal(c.negatives.length, 20); assert.equal(JSON.stringify(doc), before);
});

test('twenty original vectors suppress stale results and never submit hidden values', async () => {
  const v = await read('candidates/questionnaire/answer-vectors.json'); assert.equal(v.cases.length, 20); assert.equal(new Set(v.cases.map(x => x.id)).size, 20);
  for (const x of v.cases) if (x.expected.status !== 'ready') assert.deepEqual(x.expected.computed, {});
  assert.equal(v.cases.find(x => x.id === 'zero-is-real').expected.computed.totalPackets, 0);
  assert.equal(v.cases.find(x => x.id === 'false-is-real').answers.borrowed, false);
  assert.equal(v.cases.find(x => x.id === 'dependent-pending').expected.validity.seats, 'pending');
  assert.equal(v.cases.find(x => x.id === 'hidden-invalid-draft').expected.status, 'ready');
});

test('questionnaire lock is separate from historical component counts and the packaged CDN', async () => {
  const l = await read('candidates/questionnaire/runtime-lock.safe.json');
  assert.equal(l.source, '29c6905e19d00f60ad4d945d766a6fbf516f2f9c'); assert.equal(l.files.length, 47); assert.equal(l.protocolNodes, 218);
  assert.equal(l.canonicalScopeAtFreeze, 212); assert.equal(l.genericQuestionnaireOutsideCanonical256, true); assert.equal(l.fullNewCDN, false); assert.equal(l.publicCommit, null);
  for (const f of l.files) { assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path)); }
  const old = await read('candidates/recovery214/runtime-lock.safe.json'); assert.equal(old.protocolNodes, 214); assert.equal(old.publicCommit, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597');
});

test('receipt covers original expressions, actual local flows and standalone without external services', async () => {
  const r = await read('candidates/questionnaire/consumer-result.json');
  assert.equal(r.arithmeticChecks, 26); assert.equal(r.originalJsonVectors, 20); assert.equal(r.positiveDocuments, 10); assert.equal(r.negativeDocuments, 20);
  assert.equal(r.passed, 7); assert.equal(r.failed, 0); assert.equal(r.filesChecked, 47); assert.equal(r.standalone.executed, true);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0); assert.equal(r.nativeExecutedByConsumer, false);
});
