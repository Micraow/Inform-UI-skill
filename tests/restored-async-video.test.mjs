import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-async-video/cases.mjs';
import { attachVideoReceipt } from '../candidates/restored-async-video/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-async-video/examples/supplied-videos.json', import.meta.url)));
test('Synthetic provider records have matching finite syntax without playback assertions', () => {
  const n = input.body[0]; assert.equal(n.hoverPreview, false); assert.equal(n.items.length, 2); assert.equal(new URL(n.items[0].url).searchParams.get('v'), n.items[0].videoId); assert.ok(n.items[1].url.endsWith('/' + n.items[1].videoId)); assert.ok(n.items[1].thumbnailUrl.startsWith('data:image/png;base64,'));
});
test('Video draft cases preserve the original data and distinguish missing from explicit empty phase', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 7); assert.equal(c.negatives.length, 14); assert.equal(JSON.stringify(input), before); assert.equal('items' in c.positives[1][1].body[0], false); assert.deepEqual(c.positives[2][1].body[0].items, []);
});
test('Original receipt cancels the intent and detaches without provider navigation', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachVideoReceipt(host, output), videos = input.body[0].items;
  const e = new Event('iui:video-open', { cancelable: true }); Object.defineProperty(e, 'detail', { value: { video: videos[1], videos, index: 1 } }); assert.equal(host.dispatchEvent(e), false); assert.match(output.textContent, /Supplied record 2 of 2/); off();
  const next = new Event('iui:video-open', { cancelable: true }); assert.equal(host.dispatchEvent(next), true);
});
