import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/local-conversation-suggestions/cases.mjs';
import { attachSuggestionReceipt } from '../candidates/local-conversation-suggestions/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/local-conversation-suggestions/examples/local-suggestions.json', import.meta.url)));
test('Independent suggestion labels and prompts remain distinct finite supplied strings', () => {
  assert.equal(input.body[0].suggestions.length, 3); assert.ok(input.body[0].suggestions.every(s => s.label !== s.prompt)); assert.equal(input.body[0].suggestions[2].disabled, true);
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 17); assert.equal(JSON.stringify(input), before);
});
test('Local suggestion receipt cancels delivery without invoking a service', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachSuggestionReceipt(host, output), suggestion = input.body[0].suggestions[1], event = new Event('iui:conversation-suggestion', { cancelable: true }); Object.defineProperty(event, 'detail', { value: Object.freeze({ id: suggestion.id, prompt: suggestion.prompt }) }); assert.equal(host.dispatchEvent(event), false); assert.equal(output.textContent, 'compare: ' + suggestion.prompt); off(); assert.equal(host.dispatchEvent(new Event('iui:conversation-suggestion', { cancelable: true })), true);
});
test('Conversation151 has an exact local-intent source-build lock', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/local-conversation-suggestions/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, '54278df2233f1a9fef573c2431ee006f7dd08102'); assert.equal(lock.protocolNodes, 151); assert.equal(lock.cdnExecuted, false); assert.equal(lock.files.length, 17);
  assert.ok(lock.files.every(f => !/(AGENTS|private|\.\.\/)/.test(f.path)));
});
