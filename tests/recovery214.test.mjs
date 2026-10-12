import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('unified214 lock is an exact local package separate from its source publication', async () => {
  const lock = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(lock.localAssetCommit, '0e2ea9105fb362539d135a5344f60ec2cf3e8ec6');
  assert.equal(lock.publicCommit, null); assert.equal(lock.sourcePublicCommit, '29d8813ff4632ba5ca28010246cf57d3e8a96634');
  assert.deepEqual(lock.scope, { implemented: 209, partial: 0, missing: 47, registered: 214 });
  assert.equal(lock.files.length, 58); assert.equal(new Set(lock.files.map(f => f.path)).size, 58);
  assert.equal(lock.files.filter(f => f.path.startsWith('dist/')).length, 4);
  for (const f of lock.files) { assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path)); }
  assert.ok(!lock.files.some(f => f.path === 'cdn/README.md'));
  assert.equal(lock.clinicalValidation, false);
});

test('actual serial entries retain required contracts and standalone execution', async () => {
  const r = await read('candidates/recovery214/consumer-result.json');
  assert.equal(r.assetsVerified, 52); assert.equal(r.lockedFiles, 58); assert.equal(r.preservedDefinitions, 384);
  assert.deepEqual(r.entries, ['esm', 'global']); assert.equal(r.passed, 8); assert.equal(r.failed, 0);
  assert.equal(r.positiveDocumentsPerEntry, 12); assert.equal(r.negativeDocumentsPerEntry, 8);
  assert.equal(r.standalone.executed, true); assert.match(r.standalone.sha256, /^[a-f0-9]{64}$/);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0);
  assert.equal(r.nativeExecutedByConsumer, false); assert.equal(r.fullSuiteExecuted, false); assert.equal(r.clinicalValidation, false);
  assert.equal(r.initialCombinedProcess.exitCode, 137); assert.equal(r.initialCombinedProcess.returnedTestResult, false);
});

test('prior933 asset and date208 candidate locks remain historical', async () => {
  const old = await read('candidates/recovery213-readable-headers/runtime-lock.safe.json');
  const dates = await read('candidates/corrected-age/runtime-lock.safe.json');
  assert.equal(old.publicCommit, 'd1196a06e0561bc384d94eb6ff625ea61309969d'); assert.equal(old.protocolNodes, 213);
  assert.equal(dates.source, '371074e4e5358a0c0e4020240b7c3c4a3e98b8e3'); assert.equal(dates.implemented, 208);
});
