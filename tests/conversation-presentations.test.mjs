import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/conversation-presentations/cases.mjs';
import { attachConversationReceipt } from '../candidates/conversation-presentations/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/conversation-presentations/examples/original-conversation.json', import.meta.url)));
test('Original completion data projects the voice and plain teaching choices onto fixed fields', () => {
  assert.deepEqual(input.body[0].suggestions.map(s => s.intent), ['new-turn', 'start-voice', undefined]); assert.ok(input.body[0].suggestions.every(s => s.prompt && !('query' in s))); assert.equal(input.body[0].suggestions.filter(s => s.iconSrc).length, 2);
});
test('Conversation completion cases keep distinct phase contracts without mutating input', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 8); assert.equal(c.negatives.length, 14); assert.equal(JSON.stringify(input), before); assert.equal(c.negatives.find(([n]) => n === 'unsafe icon')[3], '/body/0/suggestions/0/iconSrc'); assert.equal(c.positives.find(([n]) => n === 'resolved empty retains a group')[1].body[0].suggestions.length, 0);
});
test('Local completion receipt cancels explicit and legacy requests and detaches', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachConversationReceipt(host, output);
  for (const s of input.body[0].suggestions) { const detail = Object.freeze({ id: s.id, prompt: s.prompt, ...(s.intent ? { intent: s.intent } : {}) }), e = new Event('iui:conversation-suggestion', { cancelable: true }); Object.defineProperty(e, 'detail', { value: detail }); assert.equal(host.dispatchEvent(e), false); assert.ok(output.textContent.includes(s.prompt)); }
  off(); assert.equal(host.dispatchEvent(new Event('iui:conversation-suggestion', { cancelable: true })), true);
});
test('Conversation completion lock separates exact source154 from prior CDN and projects only four fields', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/conversation-presentations/source-build-lock.safe.json', import.meta.url))), baseline = JSON.parse(await readFile(new URL('../candidates/conversation-presentations/schema-baseline-follow-up.json', import.meta.url)));
  assert.equal(lock.sourceCommit, '342bc8f2b4a7577c2c89f65826a5921a74c1287a'); assert.equal(lock.files.length, 23); assert.equal(lock.protocolNodes, 154); assert.equal(lock.cdnExecuted, false); assert.equal(Object.keys(baseline.definitions).length, 292); assert.deepEqual(baseline.projectedAdditions, { ConversationSuggestion: ['intent', 'iconSrc'], ConversationSuggestionsNode: ['status', 'fallback'] });
});
