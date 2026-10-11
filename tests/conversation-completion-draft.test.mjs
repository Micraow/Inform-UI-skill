import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationFixtures, describeLocalChoice, BLUE_ICON, ORANGE_ICON } from '../candidates/conversation-completion-draft/fixtures.mjs';
test('Draft conversation data distinguishes pending, explicit empty and two failure presentations', () => {
  const f = conversationFixtures(); assert.equal(f.length, 6); assert.deepEqual(f.slice(0, 5).map(x => [x.phase, x.expected]), [['pending', 'loading'], ['resolved', 'choices'], ['resolved', 'empty-group'], ['failed', 'fallback'], ['failed', 'hidden']]); assert.equal(f[2].items.length, 0); assert.equal(f[4].fallbackText, undefined);
});
test('Original icons are finite16x16 PNGs and one choice remains text only', () => {
  for (const url of [BLUE_ICON, ORANGE_ICON]) { const b = Buffer.from(url.split(',')[1], 'base64'); assert.equal(b.subarray(1, 4).toString(), 'PNG'); assert.equal(b.readUInt32BE(16), 16); assert.equal(b.readUInt32BE(20), 16); }
  const items = conversationFixtures()[1].items; assert.equal(new Set(items.map(i => i.id)).size, 3); assert.equal(items[2].iconSrc, undefined);
});
test('Draft local receipts distinguish voice from new-turn without performing either', () => {
  const items = conversationFixtures()[1].items, before = JSON.stringify(items);
  assert.deepEqual(items.map(i => describeLocalChoice(i).requestedIntent), ['new-turn', 'start-voice', 'new-turn']); assert.ok(items.every(i => Object.isFrozen(describeLocalChoice(i)) && describeLocalChoice(i).performed === false)); assert.equal(JSON.stringify(items), before);
  assert.throws(() => describeLocalChoice({ ...items[0], requestedIntent: 'open-account' }), /Unknown teaching intent/); assert.throws(() => describeLocalChoice({ id: 'missing-query' }), /required/);
});
test('Draft fixtures remain independent values and literal copy is never evaluated', () => {
  const a = conversationFixtures(), b = conversationFixtures(); a[1].items[0].label = 'Changed locally'; assert.notEqual(a[1].items[0].label, b[1].items[0].label); assert.match(b[5].items[0].query, /^<script>/); assert.equal(describeLocalChoice(b[5].items[0]).query, b[5].items[0].query);
});
