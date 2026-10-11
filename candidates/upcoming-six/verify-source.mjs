import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=import.meta.dirname,library=path.resolve(process.argv[2]??'');assert.ok(process.argv[2],'Pass explicit library checkout');
const hash=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const inputs=['dist/index.js','dist/browser.js','dist/standalone.js','dist/style.css','src/schema/iui.schema.json','src/schema/fragments/index.json','src/schema/fragments/base.schema.json','src/schema/fragments/nodes/base.schema.json','docs/create-interactive-poll.md','docs/mail-files.md','docs/decision-cards.md','docs/related-questions.md'];
const snapshot=async()=>Object.fromEntries(await Promise.all(inputs.map(async p=>[p,hash(await readFile(path.join(library,p)))])));
assert.equal(spawnSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),'990d7e4af2a4cde6f01db4be628863c0378b011e');assert.equal(spawnSync('git',['-C',library,'status','--porcelain'],{encoding:'utf8'}).stdout.trim(),'');
const before=await snapshot(),require=createRequire(path.join(library,'package.json')),Ajv=require('ajv/dist/2020.js').default,{JSDOM}=require('jsdom');
const api=await import(pathToFileURL(path.join(library,'dist/index.js')).href),browser=await import(pathToFileURL(path.join(library,'dist/browser.js')).href);
const index=await json(path.join(library,'src/schema/fragments/index.json'));assert.equal(Object.keys(index.nodeOwners).length,103);
const validators={};for(const [key,file]of Object.entries({full:'src/schema/iui.schema.json',base:'src/schema/fragments/base.schema.json',node:'src/schema/fragments/nodes/base.schema.json'}))validators[key]=new Ajv({strict:false,allErrors:true}).compile(await json(path.join(library,file)));
const documents=new Map(),records=[],temporary=await mkdtemp(path.join(tmpdir(),'inform-upcoming-authoring-'));
const cli=args=>{const r=spawnSync(process.execPath,[path.join(library,'bin/iui.mjs'),...args],{encoding:'utf8',timeout:30000});assert.equal(r.status,0,r.stderr||r.stdout);};
try{
 for(const name of ['create-interactive-poll','mail-files','decision-cards','related-questions']){
  const file=path.join(root,'examples',name+'.json'),bytes=await readFile(file),d=JSON.parse(bytes),saved=JSON.stringify(d);documents.set(name,d);
  assert.equal(hash(bytes),hash(await readFile(path.join(library,'examples',name+'.json'))));assert.equal(api.validateDocument(d).ok,true);assert.deepEqual(api.validateDocument(d),browser.validateDocument(d));
  assert.equal(validators.full(d),true);assert.equal(validators.base(d),true);for(const n of d.body){assert.equal(index.nodeOwners[n.type],'base');assert.equal(validators.node(n),true);}assert.equal(validators.node(d),false);
  const html=await api.compileHtml(d,{backend:'portable',assets:'inline',lang:'en'});assert.equal(await api.compileHtml(d,{backend:'portable',assets:'inline',lang:'en'}),html);cli(['validate',file,'--json']);const out=path.join(temporary,name+'.html');cli(['build',file,'--out',out,'--lang','en']);assert.equal(await readFile(out,'utf8'),html);assert.equal(JSON.stringify(d),saved);
  records.push({name,sha256:hash(bytes),htmlSha256:hash(html)});console.log('PASS fixture '+name+': full/Base/node schema, API/browser parity, deterministic compile and CLI bytes');
 }
 let literals=0;for(const m of(await readFile(path.join(root,'guidance-source.md'),'utf8')).matchAll(/^```json upcoming103-only\n([\s\S]*?)^```/gm)){const d=JSON.parse(m[1]);assert.equal(api.validateDocument(d).ok,true);assert.equal(validators.base(d),true);literals++;}
 const negatives=[];const add=(name,fixture,node,change,code,at)=>{const d=structuredClone(documents.get(fixture));d.body=[d.body[node]];change(d.body[0]);negatives.push({name,document:d,code,path:at&&'/body/0'+at});};
 add('duplicate poll ID','create-interactive-poll',0,n=>n.options[1].id=n.options[0].id,'DUPLICATE_ID','/options/1/id');
 add('impossible sent date','mail-files',0,n=>n.sentAt='2027-02-29T09:00Z','READER_TIME','/sentAt');
 add('duplicate attachment','mail-files',0,n=>n.attachments[1].id=n.attachments[0].id,'DUPLICATE_ID','/attachments/1/id');
 add('unsafe attachment','mail-files',0,n=>n.attachments[0].url='javascript:alert(1)','UNSAFE_URL','/attachments/0/url');
 add('credential source','mail-files',0,n=>n.source.url='https://user:password@example.org/','UNSAFE_URL','/source/url');
 add('missing parent','mail-files',1,n=>n.entries[0].parentId='absent','FILE_PARENT','/entries/0/parentId');
 add('file parent','mail-files',1,n=>n.entries[0].parentId='readme','FILE_PARENT','/entries/0/parentId');
 add('cycle','mail-files',1,n=>n.entries[0].parentId=n.entries[0].id,'FILE_CYCLE','/entries/0/parentId');
 add('missing initial folder','mail-files',1,n=>n.initialFolderId='absent','FILE_FOLDER','/initialFolderId');
 add('file initial folder','mail-files',1,n=>n.initialFolderId='readme','FILE_FOLDER','/initialFolderId');
 add('duplicate entry','mail-files',1,n=>n.entries[1].id=n.entries[0].id,'DUPLICATE_ID','/entries/1/id');
 add('impossible file date','mail-files',1,n=>n.entries[2].modifiedAt='2027-02-29T09:00Z','READER_TIME','/entries/2/modifiedAt');
 add('unsafe file link','mail-files',1,n=>n.entries[2].url='data:text/plain,secret','UNSAFE_URL','/entries/2/url');
 add('fifth ancestor','mail-files',1,n=>n.entries=Array.from({length:6},(_,i)=>({id:'folder'+i,name:'Folder '+i,kind:'folder',...(i?{parentId:'folder'+(i-1)}:{})})),'FILE_DEPTH','/entries/5/parentId');
 for(const [name,fixture,node,change]of [
  ['poll provider','create-interactive-poll',0,n=>n.provider='remote'],['poll too few','create-interactive-poll',0,n=>n.options.splice(1)],['poll too many','create-interactive-poll',0,n=>n.options=Array.from({length:9},(_,i)=>({id:'x'+i,label:'x'}))],['poll question overflow','create-interactive-poll',0,n=>n.question='x'.repeat(501)],['poll label overflow','create-interactive-poll',0,n=>n.options[0].label='x'.repeat(201)],['HTML property','mail-files',0,n=>n.html='<b>bad</b>'],['negative bytes','mail-files',0,n=>n.attachments[0].sizeBytes=-1],['folder bytes','mail-files',1,n=>n.entries[0].sizeBytes=0],['too many entries','mail-files',1,n=>n.entries=Array.from({length:121},(_,i)=>({id:'x'+i,name:'x',kind:'file'}))]
 ])add(name,fixture,node,change,'SCHEMA');
 for(const c of negatives){const result=api.validateDocument(c.document);assert.equal(result.ok,false,c.name);assert.ok(result.issues.some(i=>i.code===c.code&&(!c.path||i.path===c.path)),c.name+JSON.stringify(result));assert.deepEqual(result,browser.validateDocument(c.document));if(c.code==='SCHEMA')assert.equal(validators.full(c.document),false);await assert.rejects(()=>api.compileHtml(c.document));}
 for(const file of ['decision-cards-rejections.json','related-questions-rejections.json'])for(const c of await json(path.join(root,file))){const result=api.validateDocument(c.document);assert.equal(result.ok,false,c.name);assert.ok(result.issues.some(i=>i.code===c.code&&(!c.path||i.path===c.path)),c.name+JSON.stringify(result));assert.deepEqual(result,browser.validateDocument(c.document));await assert.rejects(()=>api.compileHtml(c.document));negatives.push(c);}
 await writeFile(path.join(root,'rejection-examples.json'),JSON.stringify(negatives,null,2)+'\n');
 const incomplete={version:'iui/1',body:[{type:'create-interactive-poll',label:'Draft',question:'',options:[{id:'a',label:''},{id:'b',label:''}]}]};assert.equal(api.validateDocument(incomplete).ok,true);
 const dom=new JSDOM('<main></main>',{url:'https://example.org/'}),host=dom.window.document.querySelector('main'),controller=api.mount(host,incomplete,{styles:false});let emitted=[];host.addEventListener('iui:poll-ready',e=>emitted.push(e.detail));
 const input=(el,value)=>{el.value=value;el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 host.querySelector('.iui-poll-prepare').click();assert.equal(emitted.length,0);assert.equal(host.querySelector('.iui-poll').dataset.status,'invalid');
 input(host.querySelector('.iui-poll-question'),'Exact question ');const options=host.querySelectorAll('.iui-poll-option-input');input(options[0],' One ');input(options[1],'One');host.querySelector('.iui-poll-prepare').click();assert.equal(emitted.length,0);input(options[1],'Two');host.querySelector('.iui-poll-prepare').click();assert.equal(emitted.length,1);assert.equal(emitted[0].question,'Exact question ');assert.equal(emitted[0].options[0].label,' One ');assert.equal(emitted[0].componentId,null);assert.ok(Object.isFrozen(emitted[0])&&Object.isFrozen(emitted[0].options)&&emitted[0].options.every(Object.isFrozen));
 const element=host.firstElementChild;assert.throws(()=>controller.update({version:'iui/1',body:[{type:'unknown'}]}));assert.equal(host.firstElementChild,element);controller.dispose();controller.dispose();assert.equal(host.childElementCount,0);dom.window.close();
 assert.deepEqual(await snapshot(),before);const git=spawnSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}),status=spawnSync('git',['-C',library,'status','--porcelain'],{encoding:'utf8'});
 const result={format:'inform-upcoming-three-authoring-source-check/1',draft:true,libraryHead:git.stdout.trim(),libraryDirty:Boolean(status.stdout.trim()),sourceInputs:before,protocolNodes:103,acceptedCanonical:53,currentPendingCanonical:37,upcomingCanonical:6,fixtures:records,guidanceLiterals:literals,negativeCases:negatives.length,pollRuntimeChecks:['blank draft validates but Prepare rejects','trimmed duplicate labels reject Prepare','exact strings preserved in frozen local event','atomic invalid update','idempotent disposal'],browser:'not-run',cdn:'not-run',ci:'not-run'};
 await writeFile(path.join(root,'evidence/source-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(`PASS upcoming draft: 4 fixtures, 6 Base nodes, ${literals} literals, ${negatives.length} negative cases, JSDOM local poll checks. No acceptance promotion.`);
}finally{await rm(temporary,{recursive:true,force:true});}
