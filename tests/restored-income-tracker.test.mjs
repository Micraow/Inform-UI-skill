import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-income-tracker/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-income-tracker/examples/supplied-income.json', import.meta.url)));
test('Original income snapshot keeps supplied estimates, zero and missing values distinct', () => {
  const [known, unknown, empty] = input.body; assert.equal(known.estimatedMonthlyIncomeLabel, '900 credits supplied'); assert.equal(known.nextPaycheck.amountLabel, '0 credits supplied');
  assert.equal(unknown.nextPaycheck.amountLabel, null); assert.equal(unknown.nextPaycheck.nextPayment, null); assert.equal(empty.hasIncome, false);
  assert.ok(known.nextPaycheck.logoUrl.startsWith('data:image/png;base64,')); assert.equal(input.body.every(n => n.type === 'ledger-income-tracker'), true);
});
test('Income drafts preserve inputs and exercise supplied-data boundaries', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 13); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'income requires a supplied estimate label')[3], '/body/0/estimatedMonthlyIncomeLabel');
  assert.equal(c.positives.find(([n]) => n === 'masked amounts preserve absent data')[1].body[1].nextPaycheck.amountLabel, null);
});
test('Income148 consumer locks the exact source-built input without changing older acceptance', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-income-tracker/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, '9b66f5a7cef9225d0b6aa8774e54a51d10611482'); assert.equal(lock.protocolNodes, 148); assert.equal(lock.cdnExecuted, false); assert.equal(lock.files.length, 17);
  assert.ok(lock.files.every(f => !/(AGENTS|private|\.\.\/)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
});
