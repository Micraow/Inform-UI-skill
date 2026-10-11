import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/spend-trends/cases.mjs';
const input=JSON.parse(await readFile(new URL('../candidates/spend-trends/examples/original-months.json',import.meta.url)));
test('Original monthly mapping keeps ordered explicit totals and current-day boundaries',()=>{
  const n=input.body[0];assert.deepEqual(n.months.map(m=>m.id),['month_august','month_july','month_june']);assert.deepEqual(n.categories,[]);assert.equal(n.months[0].totalValue,777);assert.equal(n.months[0].totalLabel,'777 supplied credits');assert.equal(n.months[0].points.find(p=>p.day===12).value,42);assert.equal(n.months[0].daysElapsed,12);assert.equal(n.months[2].dayCount,30);assert.ok(n.months[0].points.every(p=>!('future'in p)));assert.equal(n.averageSeries.points.find(p=>p.day===12).value,15);
});
test('Monthly positive and negative documents remain independent with precise issue locations',()=>{
  const before=JSON.stringify(input),c=buildCases(input);assert.equal(c.positives.length,10);assert.equal(c.negatives.length,20);assert.equal(JSON.stringify(input),before);assert.equal(c.negatives.find(([n])=>n==='self comparison')[3],'/body/0/comparison');assert.equal(c.negatives.find(([n])=>n==='current needs explicit elapsed days')[3],'/body/0/months/0/daysElapsed');assert.equal(c.positives.find(([n])=>n==='unknown totals and empty points')[1].body[0].months[0].totalLabel,null);
});
test('Monthly lock limits the exact source closure and historical definition projection',async()=>{
  const lock=JSON.parse(await readFile(new URL('../candidates/spend-trends/source-build-lock.safe.json',import.meta.url))),base=JSON.parse(await readFile(new URL('../candidates/spend-trends/schema-baseline-upcoming.json',import.meta.url)));assert.equal(lock.sourceCommit,'7094076e383c1cd062eaefaa87601801bec4ed2c');assert.equal(lock.files.length,21);assert.equal(lock.cdnExecuted,false);assert.equal(Object.keys(base.definitions).length,299);assert.equal(base.projectedAdditions.LedgerSpendSoFarThisMonthNode.length,11);assert.deepEqual(base.newDefinitions,['SpendTrendPoint','SpendTrendSeries']);assert.ok(lock.files.every(f=>!/AGENTS|private-reference/.test(f.path)));
});
