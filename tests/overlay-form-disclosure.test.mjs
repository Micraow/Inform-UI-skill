import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('original paper fixture has two passive notes and an owned nested required field', async () => {
  const d = await read('candidates/overlay-form-disclosure/examples/original-paper-disclosures.json');
  assert.deepEqual(d.body.map(n => n.type), ['tooltip', 'popover', 'form']);
  assert.equal(d.body[2].children[0].children[0].children[0].bind, 'paperName');
  assert.equal(d.body[2].children[0].children[0].children[0].required, true);
  assert.equal(d.body[2].children[1].children[0].required, undefined);
  assert.equal(d.state.paperName, ''); assert.ok(!JSON.stringify(d).includes('https:'));
});

test('source-only lock selects the real successor bundle without changing public214 identity', async () => {
  const l = await read('candidates/overlay-form-disclosure/runtime-lock.safe.json');
  assert.equal(l.source, '3bcff1a6cd31337e896cad93562be2dcb05a1869');
  assert.equal(l.overlaySource, '3123488036197f5910b3084706a73f53cfd448f4');
  assert.equal(l.files.length, 12); assert.equal(new Set(l.files.map(f => f.path)).size, 12);
  assert.ok(l.files.some(f => f.path === 'test-dist/iui.global.min.js'));
  assert.ok(!l.files.some(f => f.path.startsWith('cdn/')));
  for (const f of l.files) { assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path)); }
  assert.equal(l.fullNewCDN, false);
  const assets = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(assets.publicCommit, l.publishedAssetsRemain);
});

test('actual four-flow receipt limits host shims to software ownership and focus behavior', async () => {
  const r = await read('candidates/overlay-form-disclosure/consumer-result.json');
  assert.equal(r.passed, 4); assert.equal(r.failed, 0); assert.equal(r.filesChecked, 12);
  assert.equal(r.entry, 'test-dist/iui.global.min.js'); assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0);
  assert.equal(r.nativeExecuted, false); assert.equal(r.fullNewCDN, false); assert.equal(r.buildExecuted, false);
  assert.equal(r.fullSuiteExecuted, false);
});

test('source-only publication retrieves all changed payloads and preserves the actualfed5 CDN', async () => {
  const l = await read('candidates/overlay-form-disclosure/runtime-lock.safe.json');
  const r = await read('candidates/overlay-form-disclosure/source-public.json');
  assert.equal(r.source, l.source); assert.equal(r.publicCommit, '693d0ef543ab1b842b09e223c03f3d1fff539dfb');
  assert.equal(l.publicCommit, r.publicCommit); assert.equal(l.publicTree, r.publicTree);
  assert.equal(r.filesFetchedAndHashed.length, 7); assert.equal(r.changedPathsFromFed5.length, 7);
  for (const f of r.filesFetchedAndHashed) assert.deepEqual(f, l.files.find(x => x.path === f.path));
  assert.equal(r.unchangedCDNLeaves, 54); assert.equal(r.remoteTreeLeaves, 1374);
  assert.deepEqual(r.actionsRuns, { overlay: 0, details: 0 }); assert.equal(r.nativeOrDOMReexecuted, false);
});
