import test from 'node:test';
import assert from 'node:assert/strict';
import { spendSeriesFixtures, comparisonChoices } from '../candidates/spend-series-completion-draft/fixtures.mjs';
test('Three original months keep explicitly supplied headers independent of observations',()=>{
  const s=spendSeriesFixtures();assert.equal(s.months.length,3);assert.equal(s.months.filter(m=>m.current).length,1);assert.equal(s.months.at(-1).totalLabel,'777 supplied credits');assert.equal(s.months.at(-1).points.find(p=>p.day===12).value,42);assert.equal(s.months[0].totalLabel,'900 supplied credits');assert.notEqual(s.months[0].points.reduce((v,p)=>v+(p.value??0),0),900);
});
test('Unequal positions preserve zero, null, negative and explicit future slots',()=>{
  const s=spendSeriesFixtures(),historical=s.months[0],current=s.months[2];assert.deepEqual(historical.points.map(p=>p.day),[1,2,9,18,28]);assert.equal(historical.points[0].value,0);assert.equal(historical.points[2].value,null);assert.equal(historical.points[3].value,-3);assert.ok(current.points.filter(p=>p.day>current.observedThroughDay).every(p=>p.future&&p.value===null));assert.ok(current.points.filter(p=>p.day<=current.observedThroughDay).every(p=>!p.future));
});
test('Supplied references and comparison choices never require self-comparison or shared mutable arrays',()=>{
  const s=spendSeriesFixtures();assert.deepEqual(comparisonChoices(s,'month_august'),['previous','average','month_june','month_july']);assert.equal(s.average.points[1].value,null);assert.deepEqual(s.previous.month_august.points,s.months[1].points);assert.notEqual(s.previous.month_august.points,s.months[1].points);s.previous.month_august.points[0].value=999;assert.equal(s.months[1].points[0].value,0);assert.equal(spendSeriesFixtures().previous.month_august.points[0].value,0);
});
