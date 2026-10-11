import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {verifyLockedRuntime} from '../../scripts/verify-locked-runtime.mjs';
import {buildCases} from './cases.mjs';
import {buildCases as ledgerCases} from '../restored-ledger-records/cases.mjs';
const directory = import.meta.dirname;
const hash = b => createHash('sha256').update(b).digest('hex');
const local = name => readFile(path.join(directory,name));
export const checkLock = (library, lock) => verifyLockedRuntime(library,lock,{
  protocolNodes:124,newCanonicalId:'nba-player-summary',requiredFiles:[
    'src/core/player-summaries.ts','src/renderer/player-summaries.ts','src/renderer/player-summaries.css',
    'src/renderer/supplied-reader-lifecycle.ts','src/schema/fragments/sports.schema.json'
  ]
});
export async function verify(library, lockFile=path.join(directory,'runtime-lock.safe.json')) {
  const lock = JSON.parse(await readFile(lockFile)), root = await checkLock(library,lock);
  const require = createRequire(path.join(root,'package.json'));
  const {JSDOM,ResourceLoader} = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const api = await import(pathToFileURL(path.join(root,'cdn/iui.min.js')));
  const browser = await import(pathToFileURL(path.join(root,'dist/browser.js')));
  const node = await import(pathToFileURL(path.join(root,'dist/index.js'))), apis = [api,browser,node];
  const input = JSON.parse(await local('examples/supplied-players.json'));
  const ledger = JSON.parse(await local('../restored-ledger-records/examples/supplied-ledger.json'));
  const cases = buildCases(input), priorCases = ledgerCases(ledger);
  for (const group of [cases,priorCases]) {
    for (const [name,spec] of group.positives) for (const runtime of apis) assert.equal(runtime.validateDocument(spec).ok,true,name);
    for (const [name,spec,code,issuePath] of group.negatives) for (const runtime of apis) {
      const r = runtime.validateDocument(spec); assert.equal(r.ok,false,name);
      assert.ok(r.issues.some(i=>i.code===code&&(!issuePath||i.path===issuePath)),name+': '+JSON.stringify(r));
    }
  }
  const schema = JSON.parse(await readFile(path.join(root,'src/schema/iui.schema.json')));
  const index = JSON.parse(await readFile(path.join(root,'src/schema/fragments/index.json')));
  const baseline = JSON.parse(await local('schema-baseline-122.json'));
  const previous = JSON.parse(await local('../restored-ledger-records/runtime-lock.safe.json'));
  assert.equal(baseline.sourceCommit,previous.sourceCommit);
  assert.equal(baseline.schemaSha256,previous.files.find(f=>f.path==='src/schema/iui.schema.json').sha256);
  for (const [name,digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])),digest,name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>!['#/$defs/NbaPlayerSummaryNode','#/$defs/TennisPlayerSummaryNode'].includes(r.$ref)),baseline.nodeRefs);
  assert.equal(schema.$defs.Node.oneOf.length,124);
  for (const type of ['nba-player-summary','tennis-player-summary']) assert.equal(index.nodeOwners[type],'sports');
  const delta = JSON.parse(await local('runtime-delta-122.json'));
  assert.equal(delta.asset,lock.assetCommit);assert.equal(delta.baseAsset,previous.assetCommit);
  assert.deepEqual(delta.changedOldRendererFiles.map(x=>x.path),['src/renderer/index.ts','src/renderer/ledger-records.ts','src/renderer/presentation.ts','src/renderer/reader-controls.ts']);
  const rendererFiles = previous.files.filter(f=>f.path.startsWith('src/renderer/'));
  for (const file of rendererFiles) {
    const change = delta.changedOldRendererFiles.find(c=>c.path===file.path);
    if (change) assert.equal(change.beforeSha256,file.sha256);
    assert.equal(hash(await readFile(path.join(root,file.path))),change?.afterSha256??file.sha256,file.path);
  }
  for (const file of delta.newRendererFiles) assert.equal(hash(await readFile(path.join(root,file.path))),file.sha256,file.path);
  const structural = new Ajv({strict:false,allErrors:true}).compile(schema);
  const sports = new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(path.join(root,'src/schema/fragments/sports.schema.json'))));
  const base = new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(path.join(root,'src/schema/fragments/base.schema.json'))));
  for (const [name,spec] of cases.positives) { assert.equal(structural(spec),true,name);assert.equal(sports(spec),true,name); }
  assert.equal(base(input),false);
  const css = await readFile(path.join(root,'dist/style.css'),'utf8');
  const external = await readFile(path.join(root,'cdn/iui.css'),'utf8');
  const familyCss = await readFile(path.join(root,'src/renderer/player-summaries.css'),'utf8');
  for (const runtime of apis) { assert.equal(hash(runtime.styles),hash(css));assert.ok(runtime.styles.includes(familyCss)); }
  assert.ok(external.includes(familyCss));
  const combined = {version:'iui/1',title:'Supplied snapshots without providers',body:[...input.body,...ledger.body]};
  const compiled = await node.compileHtml(combined,{backend:'portable',assets:'inline'});
  assert.equal(await node.compileHtml(combined,{backend:'portable',assets:'inline'}),compiled);
  assert.ok(compiled.includes(familyCss));
  const manifest = JSON.parse(await readFile(path.join(root,'cdn/integrity.json')));
  for (const [name,item] of Object.entries(manifest.files)) {
    const bytes = await readFile(path.join(root,'cdn',name));
    assert.equal(bytes.length,item.bytes,name);assert.equal(hash(bytes),item.sha256,name);
    assert.equal('sha384-'+createHash('sha384').update(bytes).digest('base64'),item.integrity,name);
  }
  let requests = 0;
  class RejectLoader extends ResourceLoader { fetch(){requests++;throw Error('Unexpected external request');} }
  const checks = [], flush = async()=>{await Promise.resolve();await Promise.resolve();};
  const check = async(name,fn,spec=combined,lang='en')=>{
    const dom = new JSDOM('<!doctype html><html lang="'+lang+'"><body><form><main></main></form></body></html>',{url:'https://local.example/',resources:new RejectLoader()});
    const host = dom.window.document.querySelector('main'),controller = api.mount(host,spec,{styles:false});
    try {await fn({dom,host,controller});checks.push(name);} catch(e) {e.message=name+': '+e.message;throw e;}
    finally {controller.dispose();dom.window.close();}
  };
  const change=(dom,el,value)=>{el.value=value;el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT'?'change':'input'));};
  const rows=root=>[...root.querySelectorAll('tbody tr:not([hidden])')].map(r=>r.dataset.recordId);
  await check('Zero, unknown and supplied averages remain distinct',({host})=>{
    const n=host.querySelector('.iui-nba-player');
    assert.equal(n.querySelector('[data-record-id=zero] td:nth-child(6)').textContent,'0');
    assert.equal(n.querySelector('[data-record-id=unknown] td:nth-child(6)').textContent,'Not supplied');
    assert.equal(n.querySelector('[data-record-id=alpha] td:nth-child(6)').textContent,'7.25');
    const t=host.querySelector('.iui-tennis-player [data-record-id=clay]');
    assert.equal(t.children[2].textContent,'1');assert.equal(t.children[3].textContent,'9');assert.equal(t.children[4].textContent,'7');
  });
  await check('All-labelled supplied periods do not collide with the unfiltered option',({dom,host})=>{
    const n=host.querySelector('.iui-nba-player'),[period,scope]=n.querySelectorAll('select');
    change(dom,period,'s0');assert.deepEqual(rows(n),['alpha','beta']);
    change(dom,scope,'playoffs');assert.deepEqual(rows(n),['beta']);
    change(dom,n.querySelector('input'),'HARBOR');assert.deepEqual(rows(n),[]);
    n.querySelector('.iui-player-reset').click();assert.deepEqual(rows(n),['alpha','beta','zero','unknown']);
  });
  await check('Numeric sorting is stable, preserves disclosures and places unknown last',({dom,host})=>{
    const n=host.querySelector('.iui-nba-player'),detail=n.querySelector('details');detail.open=true;
    change(dom,n.querySelectorAll('select')[2],'pointsPerGame');assert.deepEqual(rows(n),['alpha','beta','zero','unknown']);
    assert.equal(n.querySelector('details'),detail);assert.equal(detail.open,true);
    assert.equal(n.querySelector('th[aria-sort]').textContent,'Points per game');
    const t=host.querySelector('.iui-tennis-player');change(dom,t.querySelectorAll('select')[2],'rank');
    assert.deepEqual(rows(t),['hard','grass','clay','unknown']);assert.equal(t.querySelector('th[aria-sort]').getAttribute('aria-sort'),'ascending');
  });
  await check('Native reset cancellation and newer edits apply across Player and Ledger readers',async({dom,host})=>{
    const form=dom.window.document.querySelector('form'),queries=[...host.querySelectorAll('input[type=search]')];
    assert.equal(queries.length,4);for(const query of queries)change(dom,query,'draft');
    form.addEventListener('reset',e=>e.preventDefault(),{once:true});form.reset();await flush();assert.ok(queries.every(q=>q.value==='draft'));
    form.reset();change(dom,queries[0],'Sample Ridge');await flush();assert.equal(queries[0].value,'Sample Ridge');assert.ok(queries.slice(1).every(q=>q.value===''));
    form.reset();await flush();assert.ok(queries.every(q=>q.value===''));assert.deepEqual([...new dom.window.FormData(form)],[]);
  });
  for (const [selector,latest] of [['.iui-nba-player','Sample Ridge'],['.iui-tennis-player','Different supplied'],['.iui-ledger-accounts','cash'],['.iui-ledger-recurring','periodic']]) {
    await check('Newer input wins through a reentrant value getter: '+selector,({dom,host})=>{
      const root=host.querySelector(selector),query=root.querySelector('input'),descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value');let first=true;
      Object.defineProperty(query,'value',{configurable:true,get(){if(first){first=false;descriptor.set.call(this,latest);this.dispatchEvent(new dom.window.Event('input'));return 'obsolete unmatched query';}return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);}});
      query.dispatchEvent(new dom.window.Event('input'));assert.equal(query.value,latest);
      if(selector==='.iui-nba-player')assert.deepEqual(rows(root),['beta']);
      if(selector==='.iui-tennis-player')assert.deepEqual(rows(root),['clay']);
    });
  }
  await check('Invalid updates are atomic and later valid replacement retires old controls',({dom,host,controller})=>{
    const before=host.innerHTML;assert.throws(()=>controller.update(cases.negatives.find(([name])=>name==='impossible Gregorian date')[1]));assert.equal(host.innerHTML,before);
    const query=host.querySelector('.iui-nba-player input');controller.update(ledger);const replacement=host.innerHTML;
    change(dom,query,'obsolete');assert.equal(host.innerHTML,replacement);assert.equal(host.querySelector('.iui-player-summary'),null);
  });
  await check('Rows transferred outside their table are never reclaimed',({dom,host})=>{
    const root=host.querySelector('.iui-tennis-player'),row=root.querySelector('[data-record-id=clay]'),aside=dom.window.document.createElement('aside');host.append(aside);aside.append(row);const before=row.outerHTML;
    change(dom,root.querySelectorAll('select')[2],'rank');assert.equal(row.parentElement,aside);assert.equal(row.outerHTML,before);
  });
  await check('Chinese presentation does not alter supplied numeric values',({host})=>{
    assert.match(host.querySelector('.iui-player-note').textContent,/不推算均值/);
    assert.equal(host.querySelector('.iui-nba-player [data-record-id=alpha] td:nth-child(6)').textContent,'7.25');
  },input,'zh-CN');
  await check('All three validators agree on literal strings without creating HTML or media',({host})=>{
    assert.equal(host.querySelector('img,iframe,script,b'),null);assert.match(host.textContent,/<img src=untrusted>/);
  },cases.positives.find(([name])=>name==='literal context text')[1]);
  assert.equal(requests,0);await checkLock(library,lock);
  return {format:'inform-recovered-consumer-result/1',assetCommit:lock.assetCommit,implementationSourceCommit:lock.implementationSourceCommit,runtimeLockSha256:hash(await readFile(lockFile)),protocolNodes:124,restoredHistoricalCanonicalIds:lock.restoredHistoricalCanonicalIds,newHistoricalCanonicalIds:[],positiveCases:cases.positives.length,negativeCases:cases.negatives.length,reusedLedgerCases:{positive:priorCases.positives.length,negative:priorCases.negatives.length},interactionChecks:checks,historicalDefinitionsConserved:Object.keys(baseline.definitions).length,oldRendererFilesChecked:rendererFiles.length,explicitChangedOldRendererFiles:delta.changedOldRendererFiles.map(x=>x.path),manifestEntries:Object.keys(manifest.files).length,lockedFiles:lock.files.length,compiledHtmlBytes:Buffer.byteLength(compiled),externalRequests:requests,sourceCommitVerified:false,nativeScenariosExecuted:0,pixelAcceptance:false,fullLibraryAcceptance:false,upstreamEvidence:lock.upstreamEvidence};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)) {
  const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1],'Pass --library /absolute/runtime/path');
  console.log(JSON.stringify(await verify(process.argv[i+1]),null,2));
}
