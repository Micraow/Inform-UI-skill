import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/image-grid-presentations/cases.mjs';
import { attachGridPresentationReceipts } from '../candidates/image-grid-presentations/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/image-grid-presentations/examples/original-grid.json', import.meta.url)));
test('Original grid fixture supplies bounded rows, four recommendations and a passive five-image input', () => {
  assert.deepEqual(input.body.map(n => n.presentation), ['mosaic','live']); assert.deepEqual(input.body[0].rows.map(r => r.tiles.length), [2,3]); assert.equal(input.body[0].recommendations.length, 4); assert.equal(input.body[1].images.length, 5); assert.ok(input.body[0].images.every(i => i.src.startsWith('data:image/png;base64,') && !('width' in i)));
});
test('Completion cases are independent copies and expose exact semantic issue paths', () => {
  const before = JSON.stringify(input), cases = buildCases(input); assert.equal(cases.positives.length, 8); assert.equal(cases.negatives.length, 18); assert.equal(JSON.stringify(input), before); assert.equal(cases.negatives.find(([n]) => n === 'unknown image reference')[3], '/body/0/rows/0/tiles/0/imageId'); assert.equal(cases.negatives.find(([n]) => n === 'unsafe thumbnail source')[2], 'IMAGE_GRID_SOURCE');
});
test('Local receipt defaults to cancellation and can permit only the local viewer', () => {
  const host = new EventTarget(), output = { textContent: '' }; const event = name => { const e = new Event(name, { cancelable: true }); Object.defineProperty(e, 'detail', { value: Object.freeze({ id: 'blue', query: 'supplied blue shapes' }) }); return e; };
  let off = attachGridPresentationReceipts(host, output); assert.equal(host.dispatchEvent(event('iui:image-grid-open')), false); assert.equal(host.dispatchEvent(event('iui:image-grid-recommendation')), false); assert.match(output.textContent, /supplied blue shapes/); off(); off = attachGridPresentationReceipts(host, output, { cancelOpen: false }); assert.equal(host.dispatchEvent(event('iui:image-grid-open')), true); assert.equal(host.dispatchEvent(event('iui:image-grid-recommendation')), false); off(); assert.equal(host.dispatchEvent(event('iui:image-grid-recommendation')), true);
});
test('Safe source lock names the exact completion and limits schema projection', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/image-grid-presentations/source-build-lock.safe.json', import.meta.url))), baseline = JSON.parse(await readFile(new URL('../candidates/image-grid-presentations/schema-baseline-conversation.json', import.meta.url))); assert.equal(lock.sourceCommit, '8ade06a5158a5fc4f47a824e5246744eec31fa82'); assert.equal(lock.files.length, 25); assert.equal(lock.cdnExecuted, false); assert.equal(Object.keys(baseline.definitions).length, 292); assert.equal(baseline.projectedAdditions.ImageGridNode.length, 9); assert.equal(baseline.newDefinitions.length, 5); assert.ok(lock.files.every(f => !/AGENTS|private-reference/.test(f.path)));
});
