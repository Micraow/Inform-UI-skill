import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/local-follow-up-actions/cases.mjs';
import { attachActionReceipt } from '../candidates/local-follow-up-actions/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/local-follow-up-actions/examples/local-actions.json', import.meta.url)));
test('Original action fixture uses finite independent IDs and explicit disabled state', () => {
  assert.deepEqual(input.body[0].actions.map(a => a.id), ['explain', 'compare', 'checklist']); assert.equal(input.body[0].actions[2].disabled, true);
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 13); assert.equal(JSON.stringify(input), before);
});
test('Local action receipt cancels the host intent and releases its subscription', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachActionReceipt(host, output), event = new Event('iui:follow-up-action', { cancelable: true }); Object.defineProperty(event, 'detail', { value: Object.freeze({ id: 'compare' }) }); assert.equal(host.dispatchEvent(event), false); assert.equal(output.textContent, 'Selected local action: compare'); off(); assert.equal(host.dispatchEvent(new Event('iui:follow-up-action', { cancelable: true })), true);
});
test('ActionBar150 has an exact original-API source-build lock', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/local-follow-up-actions/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'e2d4a0261ac0b40d1abc69e6c811b9208100efb1'); assert.equal(lock.protocolNodes, 150); assert.equal(lock.cdnExecuted, false); assert.equal(lock.files.length, 17);
  assert.ok(lock.files.every(f => !/(AGENTS|private|\.\.\/)/.test(f.path)));
});
