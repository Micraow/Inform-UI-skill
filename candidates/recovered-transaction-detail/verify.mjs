import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyLockedRuntime} from '../../scripts/verify-locked-runtime.mjs';
import {buildCases} from './cases.mjs';
import {mountTransactionReceipt} from './consumer.mjs';
import {buildCases as buildCardCases} from '../recovered-card-group/cases.mjs';
import {verifyHistoricalScenes} from '../recovered-card-group/verify-historical-scenes.mjs';
const directory=import.meta.dirname;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const checkLock=(library,lock)=>verifyLockedRuntime(library,lock,{protocolNodes:117,newCanonicalId:'ledger-transaction-detail',requiredFiles:['src/schema/fragments/finance.schema.json','src/renderer/transaction-detail.ts','src/renderer/transaction-detail.css']});
export async function verify(library,lockFile=path.join(directory,'runtime-lock.safe.json')){
  const lock=JSON.parse(await readFile(lockFile,'utf8')),root=await checkLock(library,lock);
  const require=createRequire(path.join(root,'package.json'));
  const {JSDOM,ResourceLoader}=require('jsdom'),Ajv=require('ajv/dist/2020.js').default;
  const browser=await import(pathToFileURL(path.join(root,'dist/browser.js'))),node=await import(pathToFileURL(path.join(root,'dist/index.js'))),cdn=await import(pathToFileURL(path.join(root,'cdn/iui.min.js')));
  const runtimes=[browser,node,cdn];
  const document=JSON.parse(await readFile(path.join(directory,'examples/receipt-detail.json'),'utf8'));
  const {positives,negatives}=buildCases(document);
  const schema=JSON.parse(await readFile(path.join(root,'src/schema/iui.schema.json'),'utf8'));
  const finance=JSON.parse(await readFile(path.join(root,'src/schema/fragments/finance.schema.json'),'utf8'));
  const base=JSON.parse(await readFile(path.join(root,'src/schema/fragments/base.schema.json'),'utf8'));
  const index=JSON.parse(await readFile(path.join(root,'src/schema/fragments/index.json'),'utf8'));
  const before=JSON.parse(await readFile(path.join(root,'tests/transaction-detail-baseline-116.json')));
  const priorDefinitions=Object.keys(before.definitions);
  assert.equal(priorDefinitions.length,197);
  for(const key of priorDefinitions)assert.equal(hash(JSON.stringify(schema.$defs[key])),before.definitions[key],key);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>r.$ref!=='#/$defs/LedgerTransactionDetailNode'),before.nodeRefs);
  assert.equal(Object.keys(index.nodeOwners).length,117);assert.equal(index.nodeOwners['ledger-transaction-detail'],'finance');
  const structure=new Ajv({strict:false,allErrors:true}).compile(schema),financeStructure=new Ajv({strict:false,allErrors:true}).compile(finance),baseStructure=new Ajv({strict:false,allErrors:true}).compile(base);
  for(const [name,input]of positives){
    assert.equal(structure(input),true,name+JSON.stringify(structure.errors));
    assert.equal(financeStructure(input),true,name+JSON.stringify(financeStructure.errors));
    for(const api of runtimes)assert.equal(api.validateDocument(input).ok,true,name);
  }
  assert.equal(baseStructure(document),false,'Finance node must not silently become Base owned');
  for(const [name,input,code]of negatives)for(const api of runtimes){
    const result=api.validateDocument(input);assert.equal(result.ok,false,name);assert.ok(result.issues.some(i=>i.code===code),name+JSON.stringify(result));
  }
  // These structural-valid negatives show why the full semantic check is mandatory.
  for(const name of ['duplicate related IDs','executable logo','blank accessible label'])assert.equal(structure(negatives.find(c=>c[0]===name)[1]),true,name);
  const cardDocument=JSON.parse(await readFile(path.join(directory,'../recovered-card-group/examples/next-steps.json'),'utf8'));
  const cardCases=buildCardCases(cardDocument);
  for(const [name,input]of cardCases.positives)assert.equal(cdn.validateDocument(input).ok,true,name);
  for(const [name,input,code]of cardCases.negatives){const result=cdn.validateDocument(input);assert.equal(result.ok,false,name);assert.ok(result.issues.some(i=>i.code===code),name)}
  const css=await readFile(path.join(root,'dist/style.css'),'utf8'),cdnCss=await readFile(path.join(root,'cdn/iui.css'),'utf8');
  assert.equal(hash(node.styles),hash(css),'Node injected and standalone CSS');assert.equal(hash(cdn.styles),hash(css),'CDN injected CSS embeds the same fonts');
  const familyCss=await readFile(path.join(root,'src/renderer/transaction-detail.css'),'utf8');
  for(const actual of [css,cdnCss,cdn.styles])assert.ok(actual.includes(familyCss),'Exact family CSS must be present in every artifact');
  assert.ok(css.includes('.iui-transaction-detail'));assert.ok(cdnCss.includes('.iui-transaction-detail'));
  const html=await node.compileHtml(document,{backend:'portable',assets:'inline'});
  assert.equal(await node.compileHtml(document,{backend:'portable',assets:'inline'}),html);
  assert.match(html,/\.iui-transaction-detail/);assert.match(html,/reading-receipt/);
  const manifest=JSON.parse(await readFile(path.join(root,'cdn/integrity.json'),'utf8'));
  for(const [name,record]of Object.entries(manifest.files)){
    const bytes=await readFile(path.join(root,'cdn',name));assert.equal(bytes.length,record.bytes,name);
    assert.equal(hash(bytes),record.sha256,name);assert.equal('sha384-'+createHash('sha384').update(bytes).digest('base64'),record.integrity,name);
  }
  let requests=0;
  class RejectLoader extends ResourceLoader{fetch(){requests++;throw Error('Unexpected network request')}}
  const checks=[];
  const check=(name,fn)=>{
    const dom=new JSDOM('<!doctype html><html lang="en"><body><form><main></main></form><output></output></body></html>',{url:'https://local.example/',resources:new RejectLoader()});
    const host=dom.window.document.querySelector('main'),output=dom.window.document.querySelector('output');
    const controller=cdn.mount(host,document,{styles:false});
    try{fn({dom,host,output,controller,buttons:[...host.querySelectorAll('.iui-transaction-detail-related-item')]});checks.push(name)}
    catch(error){error.message=name+': '+error.message;throw error}
    finally{controller.dispose();dom.window.close()}
  };
  check('Preserve true zero, refund, unknown and supplied budget',({host})=>{
    assert.equal(host.querySelector('.iui-transaction-detail-amount').textContent,'USD 0.00');
    assert.deepEqual([...host.querySelectorAll('.iui-transaction-detail-related-value')].map(e=>e.textContent),['−USD 6.00','Not supplied']);
    assert.equal(host.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),'25');
    assert.equal(host.querySelectorAll('img,iframe').length,0);
  });
  check('Local ID-only cancellation and parent-form safety',({dom,host,buttons})=>{
    let submits=0;const events=[];
    dom.window.document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submits++});
    host.addEventListener('iui:transaction-detail',e=>{e.preventDefault();events.push(e)});
    buttons.forEach(b=>b.click());assert.equal(submits,0);assert.equal(events.length,2);
    assert.deepEqual(events[0].detail,{componentId:'reading-receipt',transactionId:'000007'});
    events.forEach(e=>{assert.ok(Object.isFrozen(e.detail));assert.equal(e.composed,false);assert.equal(e.defaultPrevented,true);assert.deepEqual(Object.keys(e.detail).sort(),['componentId','transactionId'])});
    assert.equal(dom.window.location.href,'https://local.example/');
  });
  check('Masking preserves progress while hiding supplied amount/account text',({host,controller})=>{
    controller.update(positives.find(c=>c[0]==='explicit mobile and presentation mask')[1]);
    assert.equal(host.querySelector('.iui-transaction-detail').dataset.mobile,'true');
    assert.equal(host.querySelector('.iui-transaction-detail-amount').textContent,'Amount hidden');
    assert.doesNotMatch(host.textContent,/2468|USD|−USD/);assert.equal(host.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),'25');
  });
  check('Pending, failed, absent and empty states remain distinct',({host,controller})=>{
    controller.update(positives[1][1]);assert.ok(host.querySelector('[aria-busy=true]'));assert.equal(host.querySelectorAll('button').length,0);
    controller.update(positives[2][1]);assert.equal(host.querySelector('.iui-transaction-detail').hidden,true);
    controller.update(positives[3][1]);assert.equal(host.textContent,'The supplied receipt is unavailable.');
    controller.update(positives[4][1]);assert.equal(host.querySelector('.iui-transaction-detail').hidden,true);
    controller.update(positives[6][1]);assert.equal(host.querySelector('.iui-transaction-detail-empty').textContent,'No related receipts were supplied.');assert.equal(host.querySelectorAll('[role=progressbar]').length,0);
  });
  check('Event-time replacement retires retained rows; invalid updates are atomic',({host,controller,buttons})=>{
    let calls=0;host.addEventListener('iui:transaction-detail',()=>{calls++;controller.update(positives[6][1])});
    buttons[0].click();buttons[1].click();assert.equal(calls,1);
    const before=host.innerHTML;assert.throws(()=>controller.update(negatives[0][1]));assert.equal(host.innerHTML,before);
  });
  check('Event-time disposal and nested activation do not leak new intent',({host,controller,buttons})=>{
    let calls=0;host.addEventListener('iui:transaction-detail',()=>{calls++;buttons[1].click();controller.dispose()});
    buttons[0].click();buttons[1].click();assert.equal(calls,1);assert.equal(host.childNodes.length,0);
  });
  check('Disabled and hidden contexts block forged activation',({dom,host,controller,buttons})=>{
    let n=0;host.addEventListener('iui:transaction-detail',()=>n++);
    host.hidden=true;buttons[0].dispatchEvent(new dom.window.Event('click',{bubbles:true}));assert.equal(n,0);host.hidden=false;
    controller.update(positives.find(c=>c[0]==='disabled component')[1]);host.querySelector('button').dispatchEvent(new dom.window.Event('click',{bubbles:true}));assert.equal(n,0);
  });
  check('Executable consumer cancels locally and disposes its receipt listener',({host,output,controller})=>{
    controller.dispose();const local=mountTransactionReceipt(cdn,host,document,output),button=host.querySelector('button');
    button.click();assert.equal(output.textContent,'Selected supplied receipt: 000007');local.dispose();local.dispose();
    output.textContent='Preserved';button.click();assert.equal(output.textContent,'Preserved');
  });
  check('CardGroup and transaction intents remain separate in one composition',({host,controller})=>{
    const combined={version:'iui/1',body:[...cardDocument.body,...document.body]};assert.equal(cdn.validateDocument(combined).ok,true);controller.update(combined);
    const names=[];for(const eventName of ['iui:follow-up-card','iui:transaction-detail'])host.addEventListener(eventName,e=>{e.preventDefault();names.push(eventName)});
    host.querySelector('.iui-follow-up-card').click();host.querySelector('.iui-transaction-detail-related-item').click();
    assert.deepEqual(names,['iui:follow-up-card','iui:transaction-detail']);
  });
  const historicalScenes=await verifyHistoricalScenes(cdn,JSDOM);
  assert.equal(requests,0);await checkLock(library,lock);
  return {format:'inform-recovered-consumer-result/1',runtimeLockSha256:hash(await readFile(lockFile)),sourceCommit:lock.sourceCommit,implementationSourceCommit:lock.implementationSourceCommit,protocolNodes:117,newCanonicalId:'ledger-transaction-detail',positiveCases:positives.length,negativeCases:negatives.length,priorCardCases:{positive:cardCases.positives.length,negative:cardCases.negatives.length},interactionChecks:checks,historicalDefinitionsConserved:priorDefinitions.length,historicalScenes,manifestEntries:Object.keys(manifest.files).length,lockedFiles:lock.files.length,compiledHtmlBytes:Buffer.byteLength(html),externalRequests:requests,sourceCommitVerified:!lock.safeRecovery,nativeScenariosExecuted:0,pixelAcceptance:false,fullLibraryAcceptance:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
  const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1],'Pass --library /absolute/runtime/path');
  console.log(JSON.stringify(await verify(process.argv[i+1]),null,2));
}
