import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-async-images/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-async-images/examples/supplied-async-images.json', import.meta.url)));
test('Original async-image fixture has finite inline collections and caller-owned phase state', () => {
  assert.deepEqual(input.body.map(n => n.images.length), [2, 3]); assert.equal(input.state.mediaStatus, 'resolved');
  assert.ok(input.body.every(n => n.images.every(i => i.content_url.startsWith('data:image/png;base64,'))));
  assert.deepEqual(input.body[0].status, { $: 'mediaStatus' }); assert.equal(input.body[1].layout, 'bento');
});
test('Async-image drafts separate phase/URL semantics from structural bounds', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 12); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'unsafe supplied source')[3], '/body/0/images/0/content_url');
  assert.equal(c.positives.find(([n]) => n === 'finite carousel collection')[1].body[1].images.length, 20);
});
test('Async147 locks exact successor builds without a new CDN claim', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-async-images/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'c1320b35d90ba004855109f7a0aaeffb08e37a8a'); assert.equal(lock.protocolNodes, 147); assert.equal(lock.cdnExecuted, false);
  assert.equal(lock.files.length, 19); assert.ok(lock.files.every(f => !/(AGENTS|private|\.\.\/)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
});
