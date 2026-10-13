import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const base=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,base));
const json=async p=>JSON.parse(await read(p));
const result=await json('authoring/design-workflows/results.json');
const cases=(await json('authoring/design-workflows/cases.json')).cases;
test('five original cases retain a frozen method and explicit source',async()=>{
 assert.equal(result.passed,5);assert.equal(result.failed,0);assert.equal(result.cases.length,5);
 assert.equal(result.methodSha256,hash(await read('authoring/design-workflows/METHOD.md')));
 assert.equal(result.casesSha256,hash(await read('authoring/design-workflows/cases.json')));
 assert.equal(result.sourcePublic,'50054d2e436e8a0e215043ad3839f78623ecf4f8');
 assert.equal(result.sourceCommit,'50054d2e436e8a0e215043ad3839f78623ecf4f8');
});
test('whole input sums include matching entry, navigation, brief, example and extra node guide',async()=>{
 for(const c of result.cases){
  const original=cases.find(x=>x.id===c.id);assert.ok(original);
  for(const arm of [c.module,c.node]){
   assert.equal(arm.wholeInputBytes,arm.items.reduce((n,x)=>n+x.bytes,0));
   assert.equal(new Set(arm.items.map(x=>x.path)).size,arm.items.length);
   for(const f of arm.items){
    const b=f.path.startsWith('task-brief:')?Buffer.from(original.brief+'\n'):f.path.endsWith('-task.json')?null:await read(f.path==='SKILL.md'?'SKILL.cd1c545.md':f.path);
    if(b){assert.equal(f.bytes,b.length);assert.equal(f.sha256,hash(b));}
   }
   for(const p of ['SKILL.md','authoring/progressive/README.md','authoring/progressive/index.json','authoring/design-workflows/'+original.example])assert.ok(arm.items.some(x=>x.path===p));
  }
  assert.ok(!c.module.items.some(x=>x.path==='authoring/NODE-SELECTION.md'));
  assert.ok(c.node.items.some(x=>x.path==='authoring/NODE-SELECTION.md'));
  assert.equal(c.savedBytes,c.module.wholeInputBytes-c.node.wholeInputBytes);
 }
});
test('structural acceptance is separated from pure state and model/browser claims',()=>{
 for(const c of result.cases){assert.deepEqual(c.structural,{module:true,node:true,full:true});assert.equal(c.runtimeSemanticValidation,true);assert.equal(c.contractsExactlyEqual,true);assert.equal(c.deterministic,true);assert.ok(c.pureStateChecks.length);assert.deepEqual(c.node.components,c.requested.length);}
 for(const key of ['modelGenerationEvaluated','tokenizerUsed','browserExecuted','defaultSelectionChanged'])assert.equal(result.limits[key],false);
 assert.equal(result.limits.networkRequests,0);
});
test('one-node questionnaire and small text preserve measured negative savings',()=>{
 for(const id of ['branching-packing','short-notice'])assert.ok(result.cases.find(x=>x.id===id).savedBytes<0);
 for(const id of ['workshop-capacity','supplied-status','workshop-agenda'])assert.ok(result.cases.find(x=>x.id===id).savedBytes>0);
});
test('complete examples preserve zero, false, null, explicit tabs and versioned conditional policy',async()=>{
 const packing=(await json('authoring/design-workflows/examples/branching-packing.json')).body[0];
 assert.equal(packing.version,'1.0.0');assert.equal(packing.hiddenValuePolicy,'retain');assert.equal(packing.initialAnswers.units,0);assert.equal(packing.initialAnswers.borrowed,false);assert.equal(packing.initialAnswers.distance,9);assert.equal(packing.defaults.distance,null);assert.ok(packing.fields.find(x=>x.id==='distance').visibleWhen);
 const status=await json('authoring/design-workflows/examples/supplied-status.json');assert.equal(status.body[0].children[0].children[0].value,0);assert.equal(status.body[0].children[1].children[0].value,null);
 const agenda=await json('authoring/design-workflows/examples/workshop-agenda.json');assert.equal(agenda.body[0].initial,'setup');assert.deepEqual(agenda.body[0].children.map(x=>x.type),['tab-panel','tab-panel']);
});
test('full WebChat schema and optional implementation remain outside design changes',async()=>{
 const b=await read('authoring/progressive/webchat/iui.schema.json');assert.equal(b.length,751247);assert.equal(hash(b),result.fullSchema.sha256);
 const s=(await read('scripts/compare-design-workflows.mjs')).toString();assert.ok(s.includes('contracts,nodeResult.contracts'));assert.ok(s.includes('validateDocument(document)'));assert.ok(s.includes('repeatedModule'));assert.ok(s.includes('repeatedNode'));
});
