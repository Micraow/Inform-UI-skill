import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCases} from '../candidates/restored-motorsport/cases.mjs';
import {mountSessionReceipt} from '../candidates/restored-motorsport/consumer.mjs';
const input=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/examples/supplied-motorsport.json',import.meta.url)));
class Host extends EventTarget {
  live=0;
  contains(){return false;}
  addEventListener(name,...args){if(name==='iui:motorsport-session')this.live++;super.addEventListener(name,...args);}
  removeEventListener(name,...args){if(name==='iui:motorsport-session')this.live--;super.removeEventListener(name,...args);}
}
test('Original motorsport data retains offset instants, unknown times and supplied scoring',()=>{
  const [r,s]=input.body;assert.deepEqual(input.body.map(n=>n.type),['f1-races','f1-standings']);
  assert.equal(r.races[0].sessions[0].startsAt,'2028-02-29T23:30-02:00');assert.equal(r.races[1].sessions[0].startsAt,null);
  assert.equal(r.races[0].sessions[1].id,r.races[1].sessions[0].id);
  assert.equal(s.standings[0].rank,s.standings[2].rank);assert.equal(s.standings[3].points,0);assert.equal(s.standings[4].points,-0.5);assert.equal(s.standings[5].points,null);assert.equal(s.standings[6].points,999);
});
test('Ten positives and twenty-six negatives are independent and have exact semantic paths',()=>{
  const before=JSON.stringify(input),c=buildCases(input);assert.equal(c.positives.length,10);assert.equal(c.negatives.length,26);
  assert.equal(JSON.stringify(input),before);assert.equal(new Set([...c.positives,...c.negatives].map(([n])=>n)).size,36);
  const max=c.positives.find(([n])=>n==='maximum finite lists')[1];assert.equal(max.body[0].races.length,80);assert.equal(max.body[0].races[0].sessions.length,20);assert.equal(max.body[1].standings.length,100);
  assert.equal(c.negatives.find(([n])=>n==='equal normalized end')[3],'/body/0/races/0/sessions/0/endsAt');
});
test('Local host cancels repeated session and clear intents without provider operations',()=>{
  const host=new Host(),output={textContent:''};let updates=0,disposes=0;
  const api={validateDocument:d=>({ok:true,document:d}),mount:()=>({update:()=>updates++,dispose:()=>disposes++})};
  const local=mountSessionReceipt(api,host,input,output);assert.equal(host.live,1);
  for(let i=0;i<3;i++){
    const detail=Object.freeze({componentId:'supplied-weekends',raceId:'estuary',sessionId:'qualifying'}),event=new CustomEvent('iui:motorsport-session',{cancelable:true,detail});
    assert.equal(host.dispatchEvent(event),false);assert.equal(output.textContent,'Session intent kept local: estuary / qualifying');
  }
  assert.equal(host.dispatchEvent(new CustomEvent('iui:motorsport-session',{cancelable:true,detail:Object.freeze({componentId:null,raceId:null,sessionId:null})})),false);
  assert.equal(output.textContent,'Clear intent kept local');local.updateSnapshot(input);assert.equal(updates,1);
  local.dispose();local.dispose();assert.equal(disposes,1);assert.equal(host.live,0);
  output.textContent='Preserved';host.dispatchEvent(new CustomEvent('iui:motorsport-session',{detail:{raceId:'old',sessionId:'old'}}));assert.equal(output.textContent,'Preserved');
});
test('Validation and mount errors leave no host listener',()=>{
  const host=new Host(),output={textContent:''};
  assert.throws(()=>mountSessionReceipt({validateDocument:()=>({ok:false,issues:[{code:'MOTORSPORT_TIME',path:'/body/0/races/0/sessions/0/startsAt'}]})},host,input,output),/MOTORSPORT_TIME/);assert.equal(host.live,0);
  assert.throws(()=>mountSessionReceipt({validateDocument:d=>({ok:true,document:d}),mount:()=>{throw Error('Mount failed');}},host,input,output),/Mount failed/);assert.equal(host.live,0);
});
test('Output must be outside the mounted host',()=>{
  const host=new Host();assert.throws(()=>mountSessionReceipt({},host,input,host),/separate output/);
  host.contains=()=>true;assert.throws(()=>mountSessionReceipt({},host,input,{}),/separate output/);assert.equal(host.live,0);
});
test('Removing the local receipt preserves unrelated host listeners',()=>{
  const host=new Host(),output={textContent:''};let outside=0;
  const unrelated=()=>outside++;host.addEventListener('iui:motorsport-session',unrelated);
  const local=mountSessionReceipt({validateDocument:d=>({ok:true,document:d}),mount:()=>({dispose(){},update(){}})},host,input,output);
  local.dispose();assert.equal(host.live,1);host.dispatchEvent(new CustomEvent('iui:motorsport-session'));assert.equal(outside,1);host.removeEventListener('iui:motorsport-session',unrelated);assert.equal(host.live,0);
});
test('Future runtime consumption anchors all213 historical124 definitions without changing its lock',async()=>{
  const base=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/schema-baseline-124.json',import.meta.url))),lock=JSON.parse(await readFile(new URL('../candidates/restored-player-summaries/runtime-lock.safe.json',import.meta.url)));
  assert.equal(base.sourceCommit,lock.sourceCommit);assert.equal(base.schemaSha256,lock.files.find(f=>f.path==='src/schema/iui.schema.json').sha256);
  assert.equal(Object.keys(base.definitions).length,213);assert.equal(base.nodeRefs.length,124);
});
test('Frozen126 safe closure anchors898 permitted files and two historical restorations',async()=>{
  const {createHash}=await import('node:crypto'),lock=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/runtime-lock.safe.json',import.meta.url)));
  assert.equal(lock.protocolNodes,126);assert.equal(lock.files.length,898);assert.equal(lock.safeRecovery.wholeTreeGitVerification,false);
  assert.deepEqual(lock.restoredHistoricalCanonicalIds,['f1-races','f1-standings']);assert.equal(lock.nativeScenariosExecuted,0);assert.equal(lock.publicCdnVerified,false);
  const records=lock.files.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'),lock.safeRecovery.verifiedContentSha256);
  assert.ok(lock.files.every(f=>!/(^|\/)(AGENTS|CLAUDE)\.md$/.test(f.path)));
});
test('Renderer conservation permits only the three declared changes plus motorsport family files',async()=>{
  const delta=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/runtime-delta-124.json',import.meta.url))),prior=JSON.parse(await readFile(new URL('../candidates/restored-player-summaries/runtime-lock.safe.json',import.meta.url))),lock=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/runtime-lock.safe.json',import.meta.url)));
  assert.deepEqual(delta.changedOldRendererFiles.map(f=>f.path),['src/renderer/index.ts','src/renderer/presentation.ts','src/renderer/reader-controls.ts']);assert.equal(delta.newRendererFiles.length,3);
  for(const f of delta.changedOldRendererFiles){assert.equal(f.beforeSha256,prior.files.find(p=>p.path===f.path).sha256);assert.equal(f.afterSha256,lock.files.find(p=>p.path===f.path).sha256);}
});
