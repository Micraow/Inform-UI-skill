import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/local-finance-readers/cases.mjs';
import { attachFinanceReceipts } from '../candidates/local-finance-readers/consumer.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/local-finance-readers/examples/local-finance.json', import.meta.url)));
test('Synthetic finance labels keep supplied total, independent fractions, zero and unknown distinct', () => {
  const [u, s] = input.body; assert.equal(s.totalLabel, '900 supplied credits'); assert.deepEqual(s.categories.map(c => c.fraction), [0.7, 0, null]); assert.deepEqual(s.categories.map(c => c.amountLabel), ['12 supplied credits', '0 supplied credits', null]); assert.equal(u.activities[2].dateLabel, null); assert.equal(u.activities[2].amountLabel, null);
});
test('Finite finance cases retain source data and exact semantic issue paths', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 20); assert.equal(JSON.stringify(input), before); assert.equal(c.negatives.find(([n]) => n === 'duplicate category ID')[3], '/body/1/categories/1/id');
});
test('Local finance receipts cancel both kinds of intent and cleanly detach', () => {
  const host = new EventTarget(), output = { textContent: '' }, off = attachFinanceReceipts(host, output);
  for (const [type, id, text] of [['iui:upcoming-activity', 'zero_expense', 'Supplied activity: zero_expense'], ['iui:spend-category', 'books', 'Supplied category: books']]) { const event = new Event(type, { cancelable: true }); Object.defineProperty(event, 'detail', { value: Object.freeze({ id }) }); assert.equal(host.dispatchEvent(event), false); assert.equal(output.textContent, text); }
  off(); assert.equal(host.dispatchEvent(new Event('iui:upcoming-activity', { cancelable: true })), true); assert.equal(host.dispatchEvent(new Event('iui:spend-category', { cancelable: true })), true);
});
test('Finance154 locks one exact input for both newly authored local readers', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/local-finance-readers/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'b1f736daee2bb321a4eedf3fb6901713e654a3bb'); assert.equal(lock.protocolNodes, 154); assert.equal(lock.cdnExecuted, false); assert.equal(lock.files.length, 20); assert.ok(lock.files.every(f => !/(AGENTS|private|\.\.\/)/.test(f.path)));
});
