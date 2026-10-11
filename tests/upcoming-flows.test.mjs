import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/upcoming-flows/cases.mjs';
import { attachUpcomingReceipt } from '../candidates/upcoming-flows/consumer.mjs';
const input=JSON.parse(await readFile(new URL('../candidates/upcoming-flows/examples/original-flows.json',import.meta.url)));
test('Original flow fixture keeps opaque known, unknown and alternative list data',()=>{
  const n=input.body[0];assert.deepEqual(n.activities,[]);assert.equal(n.flows.incoming.items.length,2);assert.equal(n.flows.incoming.expandedItems.length,4);assert.equal(n.flows.outgoing.expandedItems.length,1);assert.equal(n.flows.incoming.items[0].amountLabel,'0 supplied credits');assert.equal(n.flows.incoming.items[1].amountUnknown,true);assert.equal(n.flows.incoming.expandedItems[3].amountLabel,null);assert.equal(n.flows.incoming.top.detailEnabled,true);
});
test('Flow completion contracts remain independent and identify exact semantic paths',()=>{
  const before=JSON.stringify(input),c=buildCases(input);assert.equal(c.positives.length,9);assert.equal(c.negatives.length,16);assert.equal(JSON.stringify(input),before);assert.equal(c.negatives.find(([n])=>n==='top duplicated in initial list')[3],'/body/0/flows/incoming/items/0/id');assert.equal(c.negatives.find(([n])=>n==='unsafe decorative icon')[2],'UPCOMING_SOURCE');
});
test('Detail receipt cancels both flow-aware and legacy local requests',()=>{
  const host=new EventTarget(),output={textContent:''},off=attachUpcomingReceipt(host,output);for(const detail of[{id:'incoming_top',flow:'incoming'},{id:'legacy'}]){const e=new Event('iui:upcoming-activity',{cancelable:true});Object.defineProperty(e,'detail',{value:Object.freeze(detail)});assert.equal(host.dispatchEvent(e),false);assert.ok(output.textContent.includes(detail.id));}off();assert.equal(host.dispatchEvent(new Event('iui:upcoming-activity',{cancelable:true})),true);
});
test('Flow source lock preserves the exact source identity and bounded schema projection',async()=>{
  const lock=JSON.parse(await readFile(new URL('../candidates/upcoming-flows/source-build-lock.safe.json',import.meta.url))),base=JSON.parse(await readFile(new URL('../candidates/upcoming-flows/schema-baseline-grid.json',import.meta.url)));assert.equal(lock.sourceCommit,'8446e162e9ffd405f80c42345173b3a979bb8bd4');assert.equal(lock.files.length,22);assert.equal(lock.cdnExecuted,false);assert.equal(Object.keys(base.definitions).length,297);assert.equal(base.projectedAdditions.UpcomingActivity.length,4);assert.equal(base.projectedAdditions.LedgerUpcomingActivityNode.length,12);assert.deepEqual(base.newDefinitions,['UpcomingFlow','UpcomingFlows']);assert.ok(lock.files.every(f=>!/AGENTS|private-reference/.test(f.path)));
});
