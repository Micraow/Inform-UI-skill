import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyLockedRuntime} from '../../scripts/verify-locked-runtime.mjs';
import {buildCases} from './cases.mjs';
import {mountReadingReceipt} from './consumer.mjs';
import {buildCases as receiptCases} from '../recovered-transaction-detail/cases.mjs';
import {buildCases as cardCases} from '../recovered-card-group/cases.mjs';
import {verifyHistoricalScenes} from '../recovered-card-group/verify-historical-scenes.mjs';
const directory=import.meta.dirname,hash=b=>createHash('sha256').update(b).digest('hex');
export const checkLock=(library,lock)=>verifyLockedRuntime(library,lock,{protocolNodes:118,newCanonicalId:'recommendation-card',requiredFiles:['src/schema/fragments/finance.schema.json','src/renderer/recommendation-card.ts','src/renderer/recommendation-card.css','src/renderer/vocabulary.ts']});
export async function verify(library,lockFile=path.join(directory,'runtime-lock.safe.json')){
 const lock=JSON.parse(await readFile(lockFile)),root=await checkLock(library,lock),require=createRequire(path.join(root,'package.json'));
 const {JSDOM,ResourceLoader}=require('jsdom'),Ajv=require('ajv/dist/2020.js').default;
 const api=await import(pathToFileURL(path.join(root,'cdn/iui.min.js'))),browser=await import(pathToFileURL(path.join(root,'dist/browser.js'))),node=await import(pathToFileURL(path.join(root,'dist/index.js'))),apis=[api,browser,node];
 const document=JSON.parse(await readFile(path.join(directory,'examples/recommendation.json'))),receipt=JSON.parse(await readFile(path.join(directory,'../recovered-transaction-detail/examples/receipt-detail.json'))),cards=JSON.parse(await readFile(path.join(directory,'../recovered-card-group/examples/next-steps.json')));
 const schema=JSON.parse(await readFile(path.join(root,'src/schema/iui.schema.json'))),base=JSON.parse(await readFile(path.join(root,'src/schema/fragments/base.schema.json'))),index=JSON.parse(await readFile(path.join(root,'src/schema/fragments/index.json')));
 const prior=JSON.parse(await readFile(path.join(root,'tests/recommendation-baseline-117.json'))),definitions=Object.keys(prior.definitions);
 const priorReceiptLock=JSON.parse(await readFile(path.join(directory,'../recovered-transaction-detail/runtime-lock.safe.json')));
 for(const name of definitions)assert.equal(hash(JSON.stringify(schema.$defs[name])),prior.definitions[name],name);
 assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>r.$ref!=='#/$defs/RecommendationCardNode'),prior.nodeRefs);
 assert.equal(Object.keys(index.nodeOwners).length,118);assert.equal(index.nodeOwners['recommendation-card'],'base');assert.equal(index.nodeOwners['ledger-transaction-detail'],'finance');
 // Exact domain source is preserved; the CopyWords correction has its own explicit source identity.
 for(const name of ['src/renderer/transaction-detail.ts','src/renderer/transaction-detail.css','src/core/transaction-detail.ts'])assert.equal(hash(await readFile(path.join(root,name))),priorReceiptLock.files.find(f=>f.path===name).sha256,name);
 assert.equal(hash(await readFile(path.join(root,'src/renderer/vocabulary.ts'))),lock.files.find(f=>f.path==='src/renderer/vocabulary.ts').sha256);
 const structure=new Ajv({strict:false,allErrors:true}).compile(schema),baseStructure=new Ajv({strict:false,allErrors:true}).compile(base);
 const cases=buildCases(document),priorCases=[receiptCases(receipt),cardCases(cards)];
 for(const group of [cases,...priorCases]){
  for(const[name,input]of group.positives)for(const runtime of apis)assert.equal(runtime.validateDocument(input).ok,true,name);
  for(const[name,input,code]of group.negatives)for(const runtime of apis){const result=runtime.validateDocument(input);assert.equal(result.ok,false,name);assert.ok(result.issues.some(i=>i.code===code),name+JSON.stringify(result))}
 }
 for(const[name,input]of cases.positives){assert.equal(structure(input),true,name);assert.equal(baseStructure(input),true,name)}
 const combined={version:'iui/1',title:'Supplied reading workspace',body:[...document.body,...receipt.body,...cards.body]};assert.equal(structure(combined),true);assert.equal(baseStructure(combined),false,'Finance closure is required for the receipt');
 const css=await readFile(path.join(root,'dist/style.css'),'utf8'),external=await readFile(path.join(root,'cdn/iui.css'),'utf8');
 assert.equal(hash(api.styles),hash(css));assert.equal(hash(node.styles),hash(css));
 for(const family of ['recommendation-card','transaction-detail']){const text=await readFile(path.join(root,'src/renderer/'+family+'.css'),'utf8');for(const actual of [api.styles,css,external])assert.ok(actual.includes(text),family+' CSS closure')}
 const html=await node.compileHtml(combined,{backend:'portable',assets:'inline'});assert.equal(await node.compileHtml(combined,{backend:'portable',assets:'inline'}),html);assert.match(html,/\.iui-recommendation-action/);assert.match(html,/\.iui-transaction-detail/);
 const manifest=JSON.parse(await readFile(path.join(root,'cdn/integrity.json')));for(const[name,item]of Object.entries(manifest.files)){const bytes=await readFile(path.join(root,'cdn',name));assert.equal(bytes.length,item.bytes,name);assert.equal(hash(bytes),item.sha256,name);assert.equal('sha384-'+createHash('sha384').update(bytes).digest('base64'),item.integrity,name)}
 let requests=0;class RejectLoader extends ResourceLoader{fetch(){requests++;throw Error('Unexpected external resource')}}
 const checks=[],flush=async()=>{await Promise.resolve();await Promise.resolve()};
 const check=async(name,fn,spec=combined)=>{
  const dom=new JSDOM('<!doctype html><html lang="en"><body><form><main></main></form><output></output></body></html>',{url:'https://local.example/',resources:new RejectLoader()}),host=dom.window.document.querySelector('main'),output=dom.window.document.querySelector('output'),controller=api.mount(host,spec,{styles:false});
  try{await fn({dom,host,output,controller});checks.push(name)}catch(e){e.message=name+': '+e.message;throw e}finally{controller.dispose();dom.window.close()}
 };
 await check('Three reading intent families compose with literal IDs and no form navigation',({dom,host})=>{
  let submits=0;const intents=[];dom.window.document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submits++});
  for(const name of ['iui:recommendation-card','iui:transaction-detail','iui:follow-up-card'])host.addEventListener(name,e=>{e.preventDefault();assert.ok(Object.isFrozen(e.detail));assert.equal(e.composed,false);intents.push([name,e.detail])});
  for(const selector of ['.iui-recommendation-action','.iui-transaction-detail-related-item','.iui-follow-up-card'])host.querySelector(selector).click();
  assert.deepEqual(intents.map(([n])=>n),['iui:recommendation-card','iui:transaction-detail','iui:follow-up-card']);assert.equal(intents[1][1].transactionId,'000007');assert.equal(submits,0);assert.equal(dom.window.location.href,'https://local.example/');
  assert.equal(host.querySelector('.iui-transaction-detail-amount').textContent,'USD 0.00');
 });
 await check('Explicit capability false blocks native and forged recommendation activation',({dom,host,controller})=>{
  controller.update(cases.positives[1][1]);let calls=0;host.addEventListener('iui:recommendation-card',()=>calls++);const b=host.querySelector('button');assert.equal(b.disabled,true);b.click();b.dispatchEvent(new dom.window.Event('click',{bubbles:true}));assert.equal(calls,0);
 });
 await check('Pending and failed envelopes have no invented content or action',({host,controller})=>{
  controller.update(cases.positives[2][1]);assert.ok(host.querySelector('[aria-busy=true]'));assert.equal(host.querySelectorAll('button').length,0);
  controller.update(cases.positives[3][1]);assert.equal(host.querySelector('.iui-recommendation-card').hidden,true);
  controller.update(cases.positives[4][1]);assert.equal(host.textContent,'No supplied conversation is available.');
 });
 await check('Event-time replacement retires every retained family control',({host,controller})=>{
  const rec=host.querySelector('.iui-recommendation-action'),receiptButton=host.querySelector('.iui-transaction-detail-related-item'),card=host.querySelector('.iui-follow-up-card');let count=0;
  for(const name of ['iui:recommendation-card','iui:transaction-detail','iui:follow-up-card'])host.addEventListener(name,()=>{count++;controller.update(cases.positives[3][1])});
  rec.click();receiptButton.click();card.click();assert.equal(count,1);
 });
 await check('Invalid replacement is atomic and explicit masking does not invent amounts',({host,controller})=>{
  const before=host.innerHTML;assert.throws(()=>controller.update(cases.negatives[0][1]));assert.equal(host.innerHTML,before);
  const masked=structuredClone(receipt);masked.body[0].sensitiveValuesHidden=true;controller.update(masked);assert.doesNotMatch(host.textContent,/2468|USD/);assert.equal(host.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),'25');
 });
 await check('Original local consumer releases all three receipt listeners',({host,output,controller})=>{
  controller.dispose();const local=mountReadingReceipt(api,host,combined,output),rec=host.querySelector('.iui-recommendation-action');rec.click();assert.equal(output.textContent,'Selected locally: practice-receipt-reading');local.dispose();local.dispose();output.textContent='Preserved';rec.click();assert.equal(output.textContent,'Preserved');
 });
 const vocabulary={version:'iui/1',body:[{type:'copy-words',label:'Practice labels',words:[{id:'zero',text:'USD 0.00'},{id:'unknown',text:'Not supplied'}]}]};
 await check('CopyWords Promise stub remains single-flight and reports accepted settlement',async({dom,host})=>{
  let finish,writes=0,intents=0;Object.defineProperty(dom.window.navigator,'clipboard',{value:{writeText(text){assert.equal(text,'USD 0.00\nNot supplied');writes++;return new Promise(r=>finish=r)}}});
  const button=host.querySelector('.iui-copy-words-action');host.addEventListener('iui:words-copy',()=>{intents++;button.click()});button.click();button.click();assert.equal(writes,1);assert.equal(intents,1);assert.equal(button.getAttribute('aria-busy'),'true');finish();await flush();assert.equal(button.getAttribute('aria-busy'),'false');assert.match(host.querySelector('.iui-vocabulary-status').textContent,/copied/);
 },vocabulary);
 await check('CopyWords host disablement survives edits, and empty selection explains itself',async({dom,host})=>{
  let reads=0;Object.defineProperty(dom.window.navigator,'clipboard',{get(){reads++;throw Error('Must not request clipboard')}});
  const b=host.querySelector('.iui-copy-words-action'),toolbar=host.querySelectorAll('.iui-copy-toolbar button');b.setAttribute('aria-disabled','true');toolbar[1].click();assert.equal(b.getAttribute('aria-disabled'),'true');b.click();assert.equal(reads,0);
  b.removeAttribute('aria-disabled');b.click();assert.match(host.querySelector('.iui-vocabulary-status').textContent,/Select at least/);assert.equal(reads,0);
 },vocabulary);
 const historicalScenes=await verifyHistoricalScenes(api,JSDOM);assert.equal(requests,0);await checkLock(library,lock);
 return{format:'inform-recovered-consumer-result/1',runtimeLockSha256:hash(await readFile(lockFile)),sourceCommit:lock.sourceCommit,implementationSourceCommit:lock.implementationSourceCommit,assetCommit:lock.assetCommit,protocolNodes:118,newCanonicalId:'recommendation-card',positiveCases:cases.positives.length,negativeCases:cases.negatives.length,reusedPriorCases:priorCases.map(c=>({positive:c.positives.length,negative:c.negatives.length})),interactionChecks:checks,historicalDefinitionsConserved:definitions.length,historicalScenes,manifestEntries:Object.keys(manifest.files).length,lockedFiles:lock.files.length,compiledHtmlBytes:Buffer.byteLength(html),externalRequests:requests,sourceCommitVerified:!lock.safeRecovery,nativeScenariosExecuted:0,systemClipboardExecuted:0,pixelAcceptance:false,fullLibraryAcceptance:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1],'Pass --library /absolute/runtime/path');console.log(JSON.stringify(await verify(process.argv[i+1]),null,2))}
