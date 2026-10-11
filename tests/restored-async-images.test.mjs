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
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 11); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'unsafe supplied source')[3], '/body/0/images/0/content_url');
  assert.equal(c.positives.find(([n]) => n === 'finite carousel collection')[1].body[1].images.length, 20);
});
