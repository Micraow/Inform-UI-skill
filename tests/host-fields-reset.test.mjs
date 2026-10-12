import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async name => JSON.parse(await readFile(new URL('../candidates/host-fields-reset/' + name, import.meta.url)));
const lock = await read('runtime-lock.safe.json');

test('new fields retain a separate exact source lock and do not promote old CDN bytes', () => {
  assert.equal(lock.source, '44c0de48bd76932a0111a3be195d90411b1c7195');
  assert.equal(lock.baseSource, '23dc14fea41f25616130148c8fd7937e14b4bd49');
  assert.equal(lock.publicCommit, '3d99c5511619ac2bef0e2773728f08f5ec7fabfa');
  assert.deepEqual(lock.coveredControls, ['input', 'textarea', 'radio', 'segmented']);
  assert.equal(lock.files.length, 10);
  assert.equal(new Set(lock.files.map(f => f.path)).size, 10);
  for (const f of lock.files) {
    assert.match(f.sha256, /^[a-f0-9]{64}$/); assert.match(f.gitBlob, /^[a-f0-9]{40}$/);
    assert.ok(!/AGENTS|private|\.env|^\/|\.\./i.test(f.path));
  }
});

test('original fixture covers invalid-draft inputs and individually disabled choice options', async () => {
  const d = await read('examples/original-paper-fields.json');
  assert.equal(d.body.length, 6);
  assert.equal(d.body.find(x => x.kind === 'number').max, 10);
  assert.equal(d.state.width, 4); assert.equal(d.state.enabled, false);
  assert.ok(d.state.notes.includes('\n'));
  for (const type of ['radio', 'segmented']) {
    const n = d.body.find(x => x.type === type);
    assert.equal(n.options[0].disabled, true); assert.equal(n.options[1].value, d.state[n.bind]);
  }
});

test('five exact local-global flows pass without services or borrowed native results', async () => {
  const r = await read('consumer-result.json');
  assert.equal(r.source, lock.source); assert.equal(r.filesChecked, 10);
  assert.equal(r.passed, 5); assert.equal(r.failed, 0); assert.equal(r.flows.length, 5);
  for (const key of ['nativeExecuted', 'compileExecuted', 'fullSuiteExecuted']) assert.equal(r[key], false);
  assert.equal(r.resourceRequests, 0); assert.equal(r.serviceCalls, 0);
});

test('the23dc negative control stays frozen and only the declared pointer successor leaves change', async () => {
  const before = await read('predecessor23dc-lock.safe.json');
  const result = await read('predecessor23dc-consumer-result.json');
  const delta = await read('pointer-successor.json');
  assert.equal(before.source, lock.baseSource); assert.equal(result.source, before.source);
  assert.equal(result.passed, 4); assert.equal(delta.addedPointerSequenceBeforeFailed, 1);
  assert.equal(delta.successorConsumerFlowsPassed, 5);
  assert.equal(delta.nativeExecutedByConsumer, false);
  const changed = lock.files.filter(f => f.sha256 !== before.files.find(x => x.path === f.path).sha256).map(f => f.path);
  assert.deepEqual(changed, delta.changedLockedPaths);
  assert.deepEqual(changed, ['src/renderer/forms.ts', 'tests/host-fields-reset.test.mjs', 'docs/forms.md', 'dist/index.js', 'cdn/iui.global.min.js']);
});

test('independent local native12 receipt belongs only to the44c successor', async () => {
  const r = await read('independent-native.json');
  assert.equal(r.source, lock.source); assert.equal(r.baseCandidate, lock.baseSource);
  assert.equal(r.passed, 12); assert.equal(r.failed, 0);
  assert.equal(r.originalBasicControlsPassed, 8); assert.equal(r.fieldFlowsPassed, 4);
  assert.equal(r.remoteCI, false); assert.equal(r.identityMismatches, 0);
  assert.match(r.receiptSha256, /^[a-f0-9]{64}$/);
});

test('public44c source bytes are verified without presenting its older remote assets as the fix', async () => {
  const r = await read('source-public.json');
  assert.equal(r.publicCommit, lock.publicCommit); assert.equal(r.publicTree, lock.publicTree);
  assert.equal(r.source, lock.source); assert.equal(r.sourceFilesCount, 7);
  assert.equal(r.remoteLeaves, 1359); assert.equal(r.treeTruncated, false);
  assert.equal(r.unchangedAssetLeaves, 54); assert.equal(r.actionsCount, 0);
  assert.equal(r.cdnChanged, false); assert.equal(r.distChanged, false);
  assert.equal(r.publishedAssetsRemain, lock.publicAssetsRemain);
  for (const f of r.sourceFilesFetchedAndHashed) assert.deepEqual(f, lock.files.find(x => x.path === f.path));
});
