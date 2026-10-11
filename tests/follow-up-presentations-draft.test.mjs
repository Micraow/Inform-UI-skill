import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/follow-up-presentations/cases.mjs';
import { attachPresentationReceipt } from '../candidates/follow-up-presentations/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/follow-up-presentations/examples/original-presentations.json', import.meta.url)));
test('Original presentations distinguish plain continuation from three local request branches', () => {
  assert.deepEqual(input.body.map(n => n.presentation), ['footer', 'wrapped_pills']); assert.equal(input.body[0].actions.length, 4); assert.deepEqual(input.body[1].actions.map(a => a.intent), ['new-turn', 'start-voice', 'open-image-composer']); assert.ok(input.body[1].actions.slice(0, 2).every(a => a.iconSrc.startsWith('data:image/png;base64,')));
});
test('Draft contracts preserve original input and explicit legacy compatibility', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 8); assert.equal(c.negatives.length, 16); assert.equal(JSON.stringify(input), before); assert.ok(c.positives.find(([n]) => n === 'legacy flat ID-only compatibility')[1].body.every(n => n.actions.every(a => Object.keys(a).sort().join() === 'id,label'))); assert.equal(c.negatives.find(([n]) => n === 'wrapped missing query')[3], '/body/1/actions/0/query');
});
test('Local presentation host cancels new and legacy events without performing services', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachPresentationReceipt(host, output);
  for (const detail of [{ id: 'legacy' }, ...input.body[1].actions.map(({ id, query, intent }) => ({ id, query, intent }))]) { const e = new Event('iui:follow-up-action', { cancelable: true }); Object.defineProperty(e, 'detail', { value: Object.freeze(detail) }); assert.equal(host.dispatchEvent(e), false); assert.ok(output.textContent.includes(detail.id)); }
  off(); assert.equal(host.dispatchEvent(new Event('iui:follow-up-action', { cancelable: true })), true);
});
test('Source-ready presentation consumer locks one input and only declared schema extensions', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/follow-up-presentations/source-build-lock.safe.json', import.meta.url))), baseline = JSON.parse(await readFile(new URL('../candidates/follow-up-presentations/schema-baseline-154.json', import.meta.url)));
  assert.equal(lock.sourceCommit, '7b5e55be730ef10decf750e443c528259a04b82b'); assert.equal(lock.files.length, 21); assert.equal(lock.protocolNodes, 154); assert.equal(lock.cdnExecuted, false); assert.equal(Object.keys(baseline.definitions).length, 292); assert.deepEqual(baseline.projectedAdditions, { FollowUpAction: ['query', 'intent', 'iconSrc'], FollowUpActionBarNode: ['presentation', 'status', 'fallback'] });
});
