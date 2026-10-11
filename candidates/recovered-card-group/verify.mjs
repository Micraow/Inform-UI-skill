import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyLockedRuntime} from '../../scripts/verify-locked-runtime.mjs';
import {buildCases} from './cases.mjs';
import {mountIntentReceipt} from './consumer.mjs';
import {verifyHistoricalScenes} from './verify-historical-scenes.mjs';
const directory = import.meta.dirname;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const checkLock=(library,lock)=>verifyLockedRuntime(library,lock,{protocolNodes:116,newCanonicalId:'follow-up-card-group'});
export async function verify(library, lockFile = path.join(directory,'runtime-lock.safe.json')) {
  const lock = JSON.parse(await readFile(lockFile, 'utf8'));
  const root = await checkLock(library, lock);
  const require = createRequire(path.join(root,'package.json'));
  const {JSDOM, ResourceLoader} = require('jsdom');
  const Ajv = require('ajv/dist/2020.js').default;
  const api = await import(pathToFileURL(path.join(root,'dist/browser.js')));
  const nodeApi = await import(pathToFileURL(path.join(root,'dist/index.js')));
  const cdnApi = await import(pathToFileURL(path.join(root,'cdn/iui.min.js')));
  const document = JSON.parse(await readFile(path.join(directory,'examples/next-steps.json'),'utf8'));
  const {positives, negatives} = buildCases(document);
  const schema = JSON.parse(await readFile(path.join(root,'src/schema/iui.schema.json'),'utf8'));
  const base = JSON.parse(await readFile(path.join(root,'src/schema/fragments/base.schema.json'),'utf8'));
  const index = JSON.parse(await readFile(path.join(root,'src/schema/fragments/index.json'),'utf8'));
  assert.equal(Object.keys(index.nodeOwners).length, 116);
  assert.equal(index.nodeOwners['follow-up-card-group'], 'base');
  const historicSchema = JSON.parse(await readFile(path.join(directory,'../upcoming-eighteen/schema/iui.schema.json'),'utf8'));
  const historicalDefinitions = Object.keys(historicSchema.$defs).filter(key => key !== 'Node');
  for (const name of historicalDefinitions) assert.deepEqual(schema.$defs[name],historicSchema.$defs[name],name);
  const oldNodes = historicSchema.$defs.Node.oneOf.map(entry => entry.$ref);
  assert.deepEqual(schema.$defs.Node.oneOf.map(entry => entry.$ref).filter(ref => ref !== '#/$defs/FollowUpCardGroupNode'),oldNodes);
  const structure = new Ajv({strict:false,allErrors:true}).compile(schema);
  const baseStructure = new Ajv({strict:false,allErrors:true}).compile(base);
  for (const [name, input] of positives) {
    assert.equal(structure(input), true, name + JSON.stringify(structure.errors));
    assert.equal(baseStructure(input), true, name + JSON.stringify(baseStructure.errors));
    for (const runtime of [api,nodeApi,cdnApi]) assert.equal(runtime.validateDocument(input).ok, true, name);
  }
  for (const [name, input, code] of negatives) for (const runtime of [api,nodeApi,cdnApi]) {
    const result = runtime.validateDocument(input);
    assert.equal(result.ok, false, name);
    assert.ok(result.issues.some(issue => issue.code === code), name + JSON.stringify(result));
  }
  const css = await readFile(path.join(root,'dist/style.css'),'utf8');
  const cdnCss = await readFile(path.join(root,'cdn/iui.css'),'utf8');
  assert.ok(css.includes('.iui-follow-up-card-group'));
  assert.ok(cdnCss.includes('.iui-follow-up-card-group'));
  const html = await nodeApi.compileHtml(document,{backend:'portable',assets:'inline'});
  assert.equal(await nodeApi.compileHtml(document,{backend:'portable',assets:'inline'}),html);
  assert.match(html, /\.iui-follow-up-card-group/);
  assert.match(html, /queueing-next-steps/);
  let requests = 0;
  class RejectLoader extends ResourceLoader { fetch() { requests++; throw new Error('Unexpected external resource'); } }
  const run = (name, check) => {
    const dom = new JSDOM('<!doctype html><html lang="en"><body><form><main></main></form><output></output></body></html>',{url:'https://local.example/',resources:new RejectLoader()});
    const host = dom.window.document.querySelector('main'), output = dom.window.document.querySelector('output');
    const controller = cdnApi.mount(host,document,{styles:false});
    try {check({dom,host,output,controller,buttons:[...host.querySelectorAll('.iui-follow-up-card')]});}
    catch (error) {error.message = name + ': ' + error.message;throw error;}
    finally {controller.dispose();dom.window.close();}
  };
  const checks = [];
  const check = (name, fn) => {run(name,fn);checks.push(name);};
  check('Three original intents are frozen, cancelable and local', ({dom,host,buttons}) => {
    const events=[];host.addEventListener('iui:follow-up-card',e=>{e.preventDefault();events.push(e)});
    buttons.forEach(b=>b.click());assert.equal(events.length,3);
    assert.deepEqual(events.map(e=>e.detail.intent.kind),['query','url','prefill']);
    events.forEach(e=>{assert.equal(e.defaultPrevented,true);assert.equal(e.composed,false);assert.ok(Object.isFrozen(e.detail));assert.ok(Object.isFrozen(e.detail.intent))});
    assert.equal(dom.window.location.href,'https://local.example/');
  });
  check('No accidental parent form submit', ({dom,buttons}) => {
    let submits=0;dom.window.document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submits++});
    buttons.forEach(b=>b.click());assert.equal(submits,0);
  });
  check('Repeated activation works; nested synchronous activation is ignored', ({host,buttons}) => {
    let n=0;host.addEventListener('iui:follow-up-card',e=>{n++;e.preventDefault();buttons[1].click()});
    buttons[0].click();buttons[0].click();assert.equal(n,2);
  });
  check('Event-time update retires retained controls', ({host,buttons,controller}) => {
    let n=0;host.addEventListener('iui:follow-up-card',()=>{n++;controller.update(positives[1][1])});
    buttons[0].click();buttons[1].click();assert.equal(n,1);assert.equal(host.querySelectorAll('.iui-follow-up-card').length,0);
  });
  check('Event-time disposal leaves the host empty', ({host,buttons,controller}) => {
    let n=0;host.addEventListener('iui:follow-up-card',()=>{n++;controller.dispose()});
    buttons[0].click();buttons[1].click();assert.equal(n,1);assert.equal(host.childNodes.length,0);
  });
  check('Invalid replacement is atomic', ({host,controller}) => {
    const before=host.innerHTML;assert.throws(()=>controller.update(negatives[0][1]));assert.equal(host.innerHTML,before);
  });
  check('Local consumer receipt is literal and listeners are disposable', ({host,output,controller}) => {
    controller.dispose();const consumer=mountIntentReceipt(cdnApi,host,document,output);
    const retained=host.querySelector('button');retained.click();assert.equal(output.textContent,'Recorded locally: assumptions (query)');
    consumer.dispose();output.textContent='Unchanged';retained.click();assert.equal(output.textContent,'Unchanged');consumer.dispose();
  });
  check('Hidden parent blocks forged activation until restored', ({dom,host,buttons}) => {
    let n=0;host.addEventListener('iui:follow-up-card',()=>n++);host.hidden=true;
    buttons[0].dispatchEvent(new dom.window.Event('click',{bubbles:true}));assert.equal(n,0);
    host.hidden=false;buttons[0].click();assert.equal(n,1);
  });
  assert.equal(requests,0);
  const historicalScenes = await verifyHistoricalScenes(cdnApi,JSDOM);
  await checkLock(library,lock);
  return {format:'inform-recovered-consumer-result/1',runtimeLockSha256:hash(await readFile(lockFile)),sourceCommit:lock.sourceCommit??null,protocolNodes:116,newCanonicalId:'follow-up-card-group',positiveCases:positives.length,negativeCases:negatives.length,interactionChecks:checks,historicalDefinitionsConserved:historicalDefinitions.length,historicalScenes,compiledHtmlBytes:Buffer.byteLength(html),externalRequests:requests,sourceCommitVerified:!!lock.sourceCommit&&!lock.safeRecovery,verifiedContentFiles:lock.files.length,nativeScenariosExecuted:0,pixelAcceptance:false,fullLibraryAcceptance:false};
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1],'Pass --library /absolute/runtime/path');
  console.log(JSON.stringify(await verify(process.argv[i+1]),null,2));
}
