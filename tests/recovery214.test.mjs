import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('unified214 lock distinguishes verified asset publication from earlier source publication', async () => {
  const lock = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(lock.localAssetCommit, '0e2ea9105fb362539d135a5344f60ec2cf3e8ec6');
  assert.equal(lock.publicCommit, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597'); assert.equal(lock.sourcePublicCommit, '29d8813ff4632ba5ca28010246cf57d3e8a96634');
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
  assert.equal(r.publicCommit, null, 'The original pre-publication execution receipt remains historical');
});

test('all52 actual remote payload hashes and SRI match the immutable local asset files', async () => {
  const r = await read('candidates/recovery214/public-assets.json');
  const lock = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(r.publicCommit, lock.publicCommit); assert.equal(r.publicTree, lock.publicTree);
  assert.equal(r.files.length, 52); assert.equal(new Set(r.files.map(f => f.path)).size, 52);
  assert.equal(r.files.reduce((n, f) => n + f.bytes, 0), 33595227);
  for (const f of [...r.files, r.manifest]) {
    const old = lock.files.find(x => x.path === f.path);
    assert.equal(f.bytes, old.bytes); assert.equal(f.sha256, old.sha256); assert.equal(f.gitBlob, old.gitBlob);
    assert.match(f.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
  }
  assert.equal(r.remoteTreeLeaves, 1371); assert.equal(r.treeTruncated, false);
  assert.deepEqual(r.sourceDeltaFromVerified209, []); assert.equal(r.changedPathsFromSourcePublication.length, 32);
  assert.equal(r.actionsRuns, 0); assert.equal(r.nativeOrDOMReexecuted, false); assert.equal(r.clinicalValidation, false);
  assert.deepEqual(r.excludedLaterSourceFixes, ['overlay-lifecycle312348', 'form-disclosure3bcff1a']);
});

test('prior933 asset and date208 candidate locks remain historical', async () => {
  const old = await read('candidates/recovery213-readable-headers/runtime-lock.safe.json');
  const dates = await read('candidates/corrected-age/runtime-lock.safe.json');
  assert.equal(old.publicCommit, 'd1196a06e0561bc384d94eb6ff625ea61309969d'); assert.equal(old.protocolNodes, 213);
  assert.equal(dates.source, '371074e4e5358a0c0e4020240b7c3c4a3e98b8e3'); assert.equal(dates.implemented, 208);
});
