import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async name => JSON.parse(await readFile(new URL('../candidates/host-form-reset/' + name, import.meta.url)));
const lock = await read('runtime-lock.safe.json');

test('host reset locks the corrected sparse source without presenting a new CDN release', () => {
  assert.equal(lock.source, '391e3cbe7914d0f8eeaed88ba62e8eee3df29688');
  assert.equal(lock.failedPredecessor, '1b31634dba3ced3c4f8d5eba287451749c544866');
  assert.equal(lock.publicCommit, null);
  assert.equal(lock.basePublic, 'd1196a06e0561bc384d94eb6ff625ea61309969d');
  assert.deepEqual(lock.coveredControls, ['slider', 'toggle', 'select']);
  assert.equal(lock.files.length, 10);
  assert.equal(new Set(lock.files.map(f => f.path)).size, 10);
  for (const f of lock.files) {
    assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.match(f.gitBlob, /^[a-f0-9]{40}$/);
    assert.ok(Number.isInteger(f.bytes) && f.bytes > 0);
    assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path));
  }
});

test('original preference fixture keeps real native bindings and a nonfirst select default', async () => {
  const d = await read('examples/original-host-preferences.json');
  assert.deepEqual(d.body.map(n => n.type), lock.coveredControls);
  assert.deepEqual(d.body.map(n => n.bind), ['paperSize', 'showBorder', 'paperColor']);
  assert.equal(d.state.paperSize, 3); assert.equal(d.state.showBorder, false);
  assert.equal(d.body[2].options[1].value, d.state.paperColor);
  assert.equal(d.body[0].step, 1);
});

test('bounded actual consumer receipt retains four successful groups and zero services', async () => {
  const r = await read('consumer-result.json');
  assert.equal(r.source, lock.source); assert.equal(r.filesChecked, lock.files.length);
  assert.equal(r.passed, 4); assert.equal(r.failed, 0); assert.equal(r.flows.length, 4);
  assert.equal(r.fixtureDocumentsValidated, 2);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0);
  assert.equal(r.nativeExecuted, false); assert.equal(r.fullSuiteExecuted, false);
});

test('the published933 asset lock remains an independent verified52 package', async () => {
  const r = JSON.parse(await readFile(new URL('../candidates/recovery213-readable-headers/runtime-lock.safe.json', import.meta.url)));
  assert.equal(r.publicCommit, lock.basePublic);
  assert.equal(r.localAssetCommit, lock.baseRuntime);
  assert.equal(r.files.length, 57);
  assert.equal(r.files.find(f => f.path === 'dist/style.css').sha256, lock.files.find(f => f.path === 'dist/style.css').sha256);
  assert.notEqual(r.files.find(f => f.path === 'dist/browser.js').sha256, lock.files.find(f => f.path === 'dist/browser.js').sha256);
});
