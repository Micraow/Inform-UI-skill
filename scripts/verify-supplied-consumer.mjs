import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {verifyLockedRuntime} from './verify-locked-runtime.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
/** Common exact-file/schema/asset boundary; domain assertions stay with each consumer. */
export async function prepareSuppliedConsumer(library,directory,options) {
  const local=name=>readFile(path.join(directory,name));
  const lockBytes=await local('runtime-lock.safe.json'),lock=JSON.parse(lockBytes);
  const root=await verifyLockedRuntime(library,lock,{protocolNodes:options.protocolNodes,newCanonicalId:options.canonicalId,requiredFiles:options.requiredFiles});
  const require=createRequire(path.join(root,'package.json')),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),Ajv=require('ajv/dist/2020.js').default;
  const apis=await Promise.all(['cdn/iui.min.js','dist/browser.js','dist/index.js'].map(file=>import(pathToFileURL(path.join(root,file)))));
  const [api,,node]=apis;
  for(const group of options.cases) {
    for(const [name,spec]of group.positives)for(const runtime of apis)assert.equal(runtime.validateDocument(spec).ok,true,name);
    for(const [name,spec,code,issuePath]of group.negatives)for(const runtime of apis){const r=runtime.validateDocument(spec);assert.equal(r.ok,false,name);assert.ok(r.issues.some(i=>i.code===code&&(!issuePath||i.path===issuePath)),name+': '+JSON.stringify(r));}
  }
  const schema=JSON.parse(await readFile(path.join(root,'src/schema/iui.schema.json'))),baseline=JSON.parse(await local(options.baselineFile)),previous=JSON.parse(await local(options.previousLock));
  assert.equal(baseline.sourceCommit,previous.sourceCommit);assert.equal(baseline.schemaSha256,previous.files.find(f=>f.path==='src/schema/iui.schema.json').sha256);
  for(const [name,digest]of Object.entries(baseline.definitions))assert.equal(hash(JSON.stringify(schema.$defs[name])),digest,name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>!options.addedDefinitions.map(name=>'#/$defs/'+name).includes(r.$ref)),baseline.nodeRefs);
  const index=JSON.parse(await readFile(path.join(root,'src/schema/fragments/index.json')));
  for(const type of options.types)assert.equal(index.nodeOwners[type],options.owner);
  const delta=JSON.parse(await local(options.deltaFile));assert.equal(delta.baseAsset,previous.assetCommit);assert.equal(delta.asset,lock.assetCommit);
  const oldRenderer=previous.files.filter(f=>f.path.startsWith('src/renderer/'));
  const oldNames=new Set(oldRenderer.map(f=>f.path)),changedNames=delta.changedOldRendererFiles.map(f=>f.path),newNames=delta.newRendererFiles.map(f=>f.path);
  assert.equal(new Set(changedNames).size,changedNames.length,'Unique changed renderer paths');assert.equal(new Set(newNames).size,newNames.length,'Unique new renderer paths');
  for(const name of changedNames)assert.ok(oldNames.has(name),'Changed renderer path was part of the frozen predecessor: '+name);
  for(const name of newNames)assert.ok(name.startsWith('src/renderer/')&&!oldNames.has(name),'New renderer path was not previously present: '+name);
  assert.deepEqual(lock.files.filter(f=>f.path.startsWith('src/renderer/')&&!oldNames.has(f.path)).map(f=>f.path).sort(),newNames.slice().sort(),'Every newly locked renderer file is declared');
  for(const file of oldRenderer){const changed=delta.changedOldRendererFiles.find(f=>f.path===file.path);if(changed){assert.equal(changed.beforeSha256,file.sha256);assert.ok(changed.reason);}assert.equal(hash(await readFile(path.join(root,file.path))),changed?.afterSha256??file.sha256,file.path);}
  for(const file of delta.newRendererFiles)assert.equal(hash(await readFile(path.join(root,file.path))),file.sha256,file.path);
  const validators=['src/schema/iui.schema.json','src/schema/fragments/'+options.owner+'.schema.json'];
  for(const file of validators){const validate=new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(path.join(root,file))));for(const [name,spec]of options.cases[0].positives)assert.equal(validate(spec),true,name);}
  const baseValidate=new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(path.join(root,'src/schema/fragments/base.schema.json'))));assert.equal(baseValidate(options.cases[0].positives[0][1]),false);
  const css=await readFile(path.join(root,'dist/style.css'),'utf8'),external=await readFile(path.join(root,'cdn/iui.css'),'utf8'),family=await readFile(path.join(root,options.styleFile),'utf8');
  for(const runtime of apis){assert.equal(hash(runtime.styles),hash(css));assert.ok(runtime.styles.includes(family));}assert.ok(external.includes(family));
  const compiled=await node.compileHtml(options.document,{backend:'portable',assets:'inline'});assert.equal(await node.compileHtml(options.document,{backend:'portable',assets:'inline'}),compiled);assert.ok(compiled.includes(family));
  const manifest=JSON.parse(await readFile(path.join(root,'cdn/integrity.json')));
  for(const [name,item]of Object.entries(manifest.files)){const bytes=await readFile(path.join(root,'cdn',name));assert.equal(bytes.length,item.bytes,name);assert.equal(hash(bytes),item.sha256,name);assert.equal('sha384-'+createHash('sha384').update(bytes).digest('base64'),item.integrity,name);}
  let requests=0;class RejectLoader extends ResourceLoader{fetch(){requests++;throw Error('Unexpected external request');}}
  const checks=[];
  const check=async(name,fn,spec=options.document,topology='normal')=>{
    assert.ok(['normal','nested-shadow'].includes(topology));
    const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>errors.push(error));
    const dom=new JSDOM('<!doctype html><html lang="en"><body><div id="outer"><form><main></main></form></div></body></html>',{url:'https://local.example/',resources:new RejectLoader(),virtualConsole}),doc=dom.window.document,outer=doc.querySelector('#outer');
    let form=doc.querySelector('form'),movedAncestor=outer;
    if(topology==='nested-shadow'){
      outer.replaceChildren();const first=outer.attachShadow({mode:'open'}),inner=doc.createElement('div');first.append(inner);const second=inner.attachShadow({mode:'open'});form=doc.createElement('form');form.append(doc.createElement('main'));second.append(form);movedAncestor=inner;
    }
    const host=form.querySelector('main'),controller=api.mount(host,spec,{styles:false});
    try{await fn({dom,host,controller,form,movedAncestor});assert.deepEqual(errors,[],'No swallowed DOM callback errors');checks.push(name);}catch(error){error.message=name+': '+error.message;throw error;}finally{controller.dispose();dom.window.close();}
  };
  const finish=async()=>{
    assert.equal(requests,0);await verifyLockedRuntime(library,lock,{protocolNodes:options.protocolNodes,newCanonicalId:options.canonicalId,requiredFiles:options.requiredFiles});
    return {format:'inform-recovered-consumer-result/1',assetCommit:lock.assetCommit,implementationSourceCommit:lock.implementationSourceCommit,runtimeLockSha256:hash(lockBytes),protocolNodes:options.protocolNodes,restoredHistoricalCanonicalIds:lock.restoredHistoricalCanonicalIds,newHistoricalCanonicalIds:[],caseGroups:options.cases.map(g=>({name:g.name,positive:g.positives.length,negative:g.negatives.length})),interactionChecks:checks,historicalDefinitionsConserved:Object.keys(baseline.definitions).length,oldRendererFilesChecked:oldRenderer.length,explicitChangedOldRendererFiles:delta.changedOldRendererFiles.map(f=>f.path),manifestEntries:Object.keys(manifest.files).length,lockedFiles:lock.files.length,compiledHtmlBytes:Buffer.byteLength(compiled),externalRequests:requests,sourceCommitVerified:false,nativeScenariosExecuted:0,pixelAcceptance:false,fullLibraryAcceptance:false};
  };
  return {api,check,finish};
}
