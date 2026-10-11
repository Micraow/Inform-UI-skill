import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {verifyLockedRuntime} from '../../scripts/verify-locked-runtime.mjs';
import {buildCases} from './cases.mjs';
import {mountSessionReceipt} from './consumer.mjs';
import {buildCases as playerCases} from '../restored-player-summaries/cases.mjs';
const directory=import.meta.dirname,hash=b=>createHash('sha256').update(b).digest('hex');
const local=name=>readFile(path.join(directory,name));
export const checkLock=(library,lock)=>verifyLockedRuntime(library,lock,{
  protocolNodes:126,newCanonicalId:'f1-races',requiredFiles:[
    'src/core/motorsport.ts','src/renderer/motorsport.ts','src/renderer/motorsport.css','src/schema/fragments/sports.schema.json'
  ]
});
export async function verify(library,lockFile=path.join(directory,'runtime-lock.safe.json')) {
  const lock=JSON.parse(await readFile(lockFile)),root=await checkLock(library,lock);
  const require=createRequire(path.join(root,'package.json')),{JSDOM,ResourceLoader}=require('jsdom'),Ajv=require('ajv/dist/2020.js').default;
  const api=await import(pathToFileURL(path.join(root,'cdn/iui.min.js'))),browser=await import(pathToFileURL(path.join(root,'dist/browser.js'))),node=await import(pathToFileURL(path.join(root,'dist/index.js'))),apis=[api,browser,node];
  const input=JSON.parse(await local('examples/supplied-motorsport.json')),players=JSON.parse(await local('../restored-player-summaries/examples/supplied-players.json')),ledger=JSON.parse(await local('../restored-ledger-records/examples/supplied-ledger.json'));
  const cases=buildCases(input),priorCases=playerCases(players);
  for(const group of [cases,priorCases]) {
    for(const [name,spec] of group.positives)for(const runtime of apis)assert.equal(runtime.validateDocument(spec).ok,true,name);
    for(const [name,spec,code,issuePath] of group.negatives)for(const runtime of apis){const result=runtime.validateDocument(spec);assert.equal(result.ok,false,name);assert.ok(result.issues.some(i=>i.code===code&&(!issuePath||i.path===issuePath)),name+': '+JSON.stringify(result));}
  }
  const schema=JSON.parse(await readFile(path.join(root,'src/schema/iui.schema.json'))),index=JSON.parse(await readFile(path.join(root,'src/schema/fragments/index.json'))),baseline=JSON.parse(await local('schema-baseline-124.json')),previous=JSON.parse(await local('../restored-player-summaries/runtime-lock.safe.json'));
  assert.equal(baseline.sourceCommit,previous.sourceCommit);assert.equal(baseline.schemaSha256,previous.files.find(f=>f.path==='src/schema/iui.schema.json').sha256);
  for(const [name,digest]of Object.entries(baseline.definitions))assert.equal(hash(JSON.stringify(schema.$defs[name])),digest,name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>!['#/$defs/F1RacesNode','#/$defs/F1StandingsNode'].includes(r.$ref)),baseline.nodeRefs);
  for(const type of ['f1-races','f1-standings'])assert.equal(index.nodeOwners[type],'sports');
  const delta=JSON.parse(await local('runtime-delta-124.json'));
  assert.equal(delta.baseAsset,previous.assetCommit);assert.equal(delta.asset,lock.assetCommit);
  const oldRenderer=previous.files.filter(f=>f.path.startsWith('src/renderer/'));
  for(const file of oldRenderer){const changed=delta.changedOldRendererFiles.find(f=>f.path===file.path);if(changed){assert.equal(changed.beforeSha256,file.sha256);assert.ok(changed.reason);}assert.equal(hash(await readFile(path.join(root,file.path))),changed?.afterSha256??file.sha256,file.path);}
  for(const file of delta.newRendererFiles)assert.equal(hash(await readFile(path.join(root,file.path))),file.sha256,file.path);
  const structural=new Ajv({strict:false,allErrors:true}).compile(schema),sports=new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(path.join(root,'src/schema/fragments/sports.schema.json')))),base=new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(path.join(root,'src/schema/fragments/base.schema.json'))));
  for(const [name,spec]of cases.positives){assert.equal(structural(spec),true,name);assert.equal(sports(spec),true,name);}assert.equal(base(input),false);
  const combined={version:'iui/1',title:'Fictional supplied readers',body:[...input.body,...players.body,...ledger.body]},css=await readFile(path.join(root,'dist/style.css'),'utf8'),external=await readFile(path.join(root,'cdn/iui.css'),'utf8'),family=await readFile(path.join(root,'src/renderer/motorsport.css'),'utf8');
  for(const runtime of apis){assert.equal(hash(runtime.styles),hash(css));assert.ok(runtime.styles.includes(family));}assert.ok(external.includes(family));
  const compiled=await node.compileHtml(combined,{backend:'portable',assets:'inline'});assert.equal(await node.compileHtml(combined,{backend:'portable',assets:'inline'}),compiled);assert.ok(compiled.includes(family));
  const manifest=JSON.parse(await readFile(path.join(root,'cdn/integrity.json')));
  for(const [name,item]of Object.entries(manifest.files)){const bytes=await readFile(path.join(root,'cdn',name));assert.equal(bytes.length,item.bytes,name);assert.equal(hash(bytes),item.sha256,name);assert.equal('sha384-'+createHash('sha384').update(bytes).digest('base64'),item.integrity,name);}
  let requests=0;class RejectLoader extends ResourceLoader{fetch(){requests++;throw Error('Unexpected external request');}}
  const checks=[],flush=async()=>{await Promise.resolve();await Promise.resolve();};
  const check=async(name,fn,spec=combined)=>{
    const dom=new JSDOM('<!doctype html><html lang="en"><body><form><main></main></form><output></output></body></html>',{url:'https://local.example/',resources:new RejectLoader()}),host=dom.window.document.querySelector('main'),output=dom.window.document.querySelector('output'),controller=api.mount(host,spec,{styles:false});
    try{await fn({dom,host,output,controller});checks.push(name);}catch(error){error.message=name+': '+error.message;throw error;}finally{controller.dispose();dom.window.close();}
  };
  const change=(dom,el,value)=>{el.value=value;el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT'?'change':'input'));};
  const shownRaces=r=>[...r.querySelectorAll('.iui-motorsport-race:not([hidden])')].map(e=>e.dataset.raceId);
  const shownStanding=r=>[...r.querySelectorAll('tbody tr:not([hidden])')].map(e=>e.dataset.standingId);
  await check('Supplied offsets and postponed unknown dates survive combined filters',({dom,host})=>{
    const r=host.querySelector('.iui-f1-races'),[season,kind,status]=r.querySelectorAll('select');
    assert.equal(r.querySelector('time').dateTime,'2028-02-29T23:30-02:00');
    change(dom,season,'2028');change(dom,kind,'race');change(dom,status,'postponed');assert.deepEqual(shownRaces(r),['plateau']);
    assert.match(r.querySelector('[data-race-id=plateau]').textContent,/Not supplied/);
    change(dom,r.querySelector('input'),'Coast');assert.deepEqual(shownRaces(r),[]);
    r.querySelector('.iui-motorsport-reset').click();assert.deepEqual(shownRaces(r),['estuary','plateau','archive']);
  });
  await check('Frozen canceled and accepted session intents are repeatable without recursive sends',({host})=>{
    const r=host.querySelector('.iui-f1-races'),button=r.querySelector('li button');let calls=0,cancel=true;
    r.addEventListener('iui:motorsport-session',event=>{calls++;assert.ok(Object.isFrozen(event.detail));assert.equal(event.composed,false);assert.deepEqual(event.detail,{componentId:'supplied-weekends',raceId:'estuary',sessionId:'qualifying'});button.click();if(cancel)event.preventDefault();});
    button.click();assert.equal(button.getAttribute('aria-pressed'),'false');cancel=false;button.click();button.click();assert.equal(calls,3);assert.equal(button.getAttribute('aria-pressed'),'true');
  });
  await check('Selection persists through filters and clear emits null IDs only',({dom,host})=>{
    const r=host.querySelector('.iui-f1-races'),button=r.querySelector('li button');button.click();change(dom,r.querySelector('input'),'Plateau');assert.match(r.querySelector('.iui-motorsport-selection').textContent,/outside the current filters/);
    r.querySelector('.iui-motorsport-reset').click();assert.equal(button.getAttribute('aria-pressed'),'true');let detail;
    r.addEventListener('iui:motorsport-session',event=>{detail=event.detail;});r.querySelector('.iui-motorsport-clear').click();assert.deepEqual(detail,{componentId:'supplied-weekends',raceId:null,sessionId:null});assert.equal(button.getAttribute('aria-pressed'),'false');
  });
  await check('Standings retain ties, penalties, zero and unknown without recalculating constructors',({dom,host})=>{
    const r=host.querySelector('.iui-f1-standings'),[kind,order]=r.querySelectorAll('select'),detail=r.querySelector('details');detail.open=true;
    change(dom,order,'points');assert.deepEqual(shownStanding(r),['morgan','river','avery','zero','penalty','unknown']);assert.equal(r.querySelector('details'),detail);assert.equal(detail.open,true);
    assert.equal(r.querySelector('[data-standing-id=avery] td').textContent,'2');assert.match(r.querySelector('[data-standing-id=penalty]').textContent,/-0.5/);
    change(dom,kind,'constructor');assert.deepEqual(shownStanding(r),['coast','hills']);assert.match(r.querySelector('[data-standing-id=coast]').textContent,/999/);
  });
  await check('Native reset is cancelable across all six readers and keeps session selection',async({dom,host})=>{
    const queries=[...host.querySelectorAll('input[type=search]')],form=dom.window.document.querySelector('form'),button=host.querySelector('.iui-f1-races li button');assert.equal(queries.length,6);button.click();for(const q of queries)change(dom,q,'draft');
    form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();await flush();assert.ok(queries.every(q=>q.value==='draft'));
    form.reset();change(dom,queries[0],'Plateau');await flush();assert.equal(queries[0].value,'Plateau');assert.ok(queries.slice(1).every(q=>q.value===''));assert.equal(button.getAttribute('aria-pressed'),'true');assert.deepEqual([...new dom.window.FormData(form)],[]);
  });
  for(const [selector,latest]of [['.iui-f1-races','Plateau'],['.iui-f1-standings','Avery']])await check('Reentrant value getter preserves newer input '+selector,({dom,host})=>{
    const r=host.querySelector(selector),query=r.querySelector('input'),descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value');let first=true;
    Object.defineProperty(query,'value',{configurable:true,get(){if(first){first=false;descriptor.set.call(this,latest);this.dispatchEvent(new dom.window.Event('input'));return 'obsolete unmatched';}return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);}});
    query.dispatchEvent(new dom.window.Event('input'));assert.equal(query.value,latest);assert.deepEqual(selector==='.iui-f1-races'?shownRaces(r):shownStanding(r),selector==='.iui-f1-races'?['plateau']:['avery']);
  });
  await check('CustomEvent construction cannot recursively submit a second session',({dom,host})=>{
    const r=host.querySelector('.iui-f1-races'),buttons=r.querySelectorAll('li button'),Native=dom.window.CustomEvent;let calls=0;
    r.addEventListener('iui:motorsport-session',()=>calls++);dom.window.CustomEvent=class extends Native{constructor(...args){super(...args);buttons[1].click();}};
    buttons[0].click();assert.equal(calls,1);assert.equal(buttons[0].getAttribute('aria-pressed'),'true');assert.equal(buttons[1].getAttribute('aria-pressed'),'false');
  });
  await check('Event-time replacement retires session and clear controls without touching the replacement',({host,controller})=>{
    const r=host.querySelector('.iui-f1-races'),button=r.querySelector('li button'),clear=r.querySelector('.iui-motorsport-clear');let calls=0;
    r.addEventListener('iui:motorsport-session',()=>{calls++;controller.update(players);});button.click();const after=host.innerHTML;button.click();clear.click();assert.equal(calls,1);assert.equal(host.innerHTML,after);assert.equal(host.querySelectorAll('.iui-player-summary').length,2);
  });
  await check('Invalid interval updates preserve the combined mounted document',({host,controller})=>{
    const before=host.innerHTML;assert.throws(()=>controller.update(cases.negatives.find(([name])=>name==='equal normalized end')[1]));assert.equal(host.innerHTML,before);
  });
  await check('Local session receipt cancels only its own intent and releases on dispose',({host,output,controller})=>{
    controller.dispose();const local=mountSessionReceipt(api,host,input,output),button=host.querySelector('.iui-f1-races li button');button.click();assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(output.textContent,'Session intent kept local: estuary / qualifying');local.dispose();local.dispose();output.textContent='Preserved';button.click();assert.equal(output.textContent,'Preserved');
  });
  await check('Moved standings rows are not reclaimed by later sorting',({dom,host})=>{
    const r=host.querySelector('.iui-f1-standings'),row=r.querySelector('[data-standing-id=river]'),aside=dom.window.document.createElement('aside');host.append(aside);aside.append(row);const before=row.outerHTML;
    change(dom,r.querySelectorAll('select')[1],'points');assert.equal(row.parentElement,aside);assert.equal(row.outerHTML,before);
  });
  assert.equal(requests,0);await checkLock(library,lock);
  return {format:'inform-recovered-consumer-result/1',assetCommit:lock.assetCommit,implementationSourceCommit:lock.implementationSourceCommit,runtimeLockSha256:hash(await readFile(lockFile)),protocolNodes:126,restoredHistoricalCanonicalIds:lock.restoredHistoricalCanonicalIds,newHistoricalCanonicalIds:[],positiveCases:cases.positives.length,negativeCases:cases.negatives.length,reusedPlayerCases:{positive:priorCases.positives.length,negative:priorCases.negatives.length},interactionChecks:checks,historicalDefinitionsConserved:Object.keys(baseline.definitions).length,oldRendererFilesChecked:oldRenderer.length,explicitChangedOldRendererFiles:delta.changedOldRendererFiles.map(f=>f.path),manifestEntries:Object.keys(manifest.files).length,lockedFiles:lock.files.length,compiledHtmlBytes:Buffer.byteLength(compiled),externalRequests:requests,sourceCommitVerified:false,nativeScenariosExecuted:0,pixelAcceptance:false,fullLibraryAcceptance:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
  const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1],'Pass --library /absolute/runtime/path');console.log(JSON.stringify(await verify(process.argv[i+1]),null,2));
}
