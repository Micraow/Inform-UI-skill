import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cases } from '../candidates/corrected-age/cases.mjs';
const read = async name => JSON.parse(await readFile(new URL('../candidates/corrected-age/' + name, import.meta.url)));
const lock = await read('runtime-lock.safe.json'), fixture = await read('examples/original-date-arithmetic.json');

test('corrected-date consumer fixes final source without a medical or newCDN claim', () => {
  assert.equal(lock.source, '371074e4e5358a0c0e4020240b7c3c4a3e98b8e3');
  assert.equal(lock.publicCommit, null); assert.equal(lock.clinicalValidation, false);
  assert.equal(lock.fullNewCDN, false); assert.equal(lock.protocolNodes, 214);
  assert.equal(lock.files.length, 51); assert.equal(new Set(lock.files.map(f => f.path)).size, 51);
  assert.ok(lock.files.some(f => f.path === 'dist/standalone.js'));
  for (const f of lock.files) {
    assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.match(f.gitBlob, /^[a-f0-9]{40}$/);
    assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path));
  }
});

test('two fictional original records have independently checked civil-day intervals', () => {
  const [a, b] = fixture.body.map(n => n.initial), day = s => Date.parse(s + 'T00:00:00Z') / 86400000;
  assert.equal(a.basis, 'gestation'); assert.equal(b.basis, 'due-date');
  assert.equal(a.birthDate, b.birthDate); assert.equal(a.observationDate, b.observationDate);
  assert.equal(day(b.dueDate) - day(b.birthDate), 40);
  assert.equal(day(a.observationDate) - day(a.birthDate), 96);
  assert.equal(day(b.observationDate) - day(b.dueDate), 56);
  assert.equal(a.gestationalWeeks * 7 + a.gestationalDays, 240);
  assert.equal(b.confirmedPreterm, true);
});

test('accepted structures and rejected schema values remain explicitly separated', () => {
  const c = cases(fixture); assert.equal(c.positives.length, 8); assert.equal(c.negatives.length, 8);
  assert.equal(new Set([...c.positives, ...c.negatives].map(x => x[0])).size, 16);
  assert.ok(c.positives.some(([, d]) => d.body[0].initial.birthDate === 'bad-date'));
  assert.ok(c.negatives.some(([, d]) => d.body[0].initial?.basis === 'automatic'));
});

test('actual seven-flow receipt includes offline execution but no service or clinical validation', async () => {
  const r = await read('consumer-result.json');
  assert.equal(r.source, lock.source); assert.equal(r.passed, 7); assert.equal(r.failed, 0);
  assert.equal(r.positiveDocuments, 8); assert.equal(r.negativeDocuments, 8);
  assert.equal(r.lockedFiles, 51); assert.equal(r.preservedDefinitions, 384);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0);
  assert.equal(r.standalone.executed, true); assert.match(r.standalone.sha256, /^[a-f0-9]{64}$/);
  assert.equal(r.nativeExecutedByConsumer, false); assert.equal(r.clinicalValidation, false);
});

test('thea6 ordinary success and new-input failure remain bounded historical evidence', async () => {
  const before = await read('predecessor-a6-lock.safe.json'), result = await read('predecessor-a6-consumer-result.json');
  const delta = await read('successor.json');
  assert.equal(before.source, 'a6bf9459bbd06267198f350bb45857cf602771ae');
  assert.equal(result.source, before.source); assert.equal(result.passed, 6);
  assert.equal(delta.newInputNegativeBeforeFailed, 1); assert.equal(delta.successorFlowsPassed, 7);
  const changed = lock.files.filter(f => f.sha256 !== before.files.find(x => x.path === f.path).sha256).map(f => f.path);
  assert.deepEqual(changed, delta.changedLockedPaths);
  for (const name of ['src/schema/iui.schema.json', 'dist/style.css'])
    assert.equal(lock.files.find(f => f.path === name).sha256, before.files.find(f => f.path === name).sha256);
});
