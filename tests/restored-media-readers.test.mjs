import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-media-readers/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-media-readers/examples/supplied-media-readers.json', import.meta.url)));
test('Original media draft starts with supplied inline pixels and explicit gated synthetic identifier', () => {
  const [i, v] = input.body; assert.equal(i.type, 'search-image'); assert.match(i.searchImage.content_url, /^data:image\/png;base64,/);
  assert.equal(v.type, 'youtube'); assert.equal(v.videoId.length, 11); assert.equal(v.loadMode, 'on-demand'); assert.equal(v.fullscreen, false);
});
test('Media drafts preserve original direct defaults and exact semantic paths', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 12); assert.equal(JSON.stringify(input), before);
  const defaults = c.positives.find(([n]) => n === 'reference video defaults are explicit')[1].body[1]; assert.equal(defaults.loadMode, undefined); assert.equal(defaults.fullscreen, undefined);
  assert.equal(c.negatives.find(([n]) => n === 'nonboolean video disabled')[3], '/body/1/disabled');
});
test('Combined144 source lock keeps HTML dependencies and three families together', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-media-readers/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, '3b88d369cd0cc918d63354b2d6e9086aad41dd71'); assert.equal(lock.protocolNodes, 144); assert.equal(lock.files.length, 27);
  assert.equal(lock.cdnExecuted, false); assert.equal(lock.nativeScenariosExecuted, 0);
  for (const p of ['src/html-view-policy.ts', 'src/compiler.ts', 'src/renderer/owned-tree.ts', 'THIRD_PARTY_NOTICES.md']) assert.ok(lock.files.some(f => f.path === p));
  assert.ok(lock.files.every(f => !/(?:AGENTS|private-reference|node_modules|^\/|\.\.)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
});
test('Combined144 preserves the prior141 schema and documents denied requests separately', async () => {
  const baseline = JSON.parse(await readFile(new URL('../candidates/restored-media-readers/schema-baseline-141.json', import.meta.url)));
  assert.equal(baseline.nodeRefs.length, 141); assert.equal(Object.keys(baseline.definitions).length, 266);
  const guide = await readFile(new URL('../candidates/restored-media-readers/README.md', import.meta.url), 'utf8'); assert.match(guide, /two attempted fixed-origin video-frame loads/); assert.match(guide, /No authored iframe script/);
});
