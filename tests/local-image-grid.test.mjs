import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/local-image-grid/cases.mjs';
import { attachGridReceipt } from '../candidates/local-image-grid/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/local-image-grid/examples/local-grid.json', import.meta.url)));
test('Original grid uses distinct generated inline pixels and independent alternative text', () => {
  const n = input.body[0]; assert.deepEqual(n.images.map(i => i.id), ['blue', 'orange', 'green']); assert.ok(n.images.every(i => i.src.startsWith('data:image/png;base64,'))); assert.equal(new Set(n.images.map(i => i.src)).size, 3); assert.equal(n.columns, 3);
});
test('Image-grid drafts preserve the input and exact finite bounds', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 15); assert.equal(JSON.stringify(input), before); assert.equal(c.positives.at(-1)[1].body[0].images.length, 24); assert.equal(c.negatives.find(([n]) => n === 'unsafe supplied image source')[3], '/body/0/images/0/src');
});
test('Local image receipt cancels intent without creating a viewer', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachGridReceipt(host, output), event = new Event('iui:image-grid-open', { cancelable: true }); Object.defineProperty(event, 'detail', { value: Object.freeze({ id: 'orange', index: 1 }) }); assert.equal(host.dispatchEvent(event), false); assert.equal(output.textContent, 'Selected supplied image 2: orange'); off(); assert.equal(host.dispatchEvent(new Event('iui:image-grid-open', { cancelable: true })), true);
});
