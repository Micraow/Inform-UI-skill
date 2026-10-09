/** Verify only the isolated source candidate; never change formal pins or run a browser. */
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {candidateDirectory,readJSON,sha256,deriveCategories,verifyPinnedInputs} from './pending-inputs.mjs';
import {verifyPending24} from './check-pending24.mjs';
import {verifyPending30} from './check-pending30.mjs';
import {readSkillShell} from './check-skill.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function arg(flag){const i=process.argv.indexOf(flag);if(i<0)return;assert.ok(process.argv[i+1]&&!process.argv[i+1].startsWith('--'),'Missing '+flag);return process.argv[i+1];}
const lock=await readJSON(path.join(root,candidateDirectory,'library-candidate-lock.json'));
const libraryArg=arg('--library');
if(!libraryArg){console.log('NOT RUN: source-only checks require --library PATH --revision '+lock.sourceRevision+'. Use the exact pending-acceptance asset checkout.');process.exit(0);}
assert.equal(arg('--revision'),lock.sourceRevision,'Explicit matching frozen revision required');
const library=path.resolve(libraryArg);
await verifyPinnedInputs(root,library,lock);
const pkg=await readJSON(path.join(library,'package.json'));
assert.equal(pkg.name,'@micraow/inform-ui');
const api=await import(pathToFileURL(path.resolve(library,pkg.exports['.'].import)).href);
const require=createRequire(path.join(library,'package.json'));
const Ajv=require('ajv/dist/2020.js').default,{JSDOM}=require('jsdom');
const schema=await readJSON(path.join(library,lock.fullSchema.path));
const index=await readJSON(path.join(library,lock.sourceIndex.path));
assert.equal(sha256(await readFile(path.join(library,lock.fullSchema.path))),index.fullSchema.sha256);
assert.equal(Object.keys(index.nodeOwners).length,90);
assert.deepEqual(await readJSON(path.join(root,candidateDirectory,'category-index.json')),deriveCategories(index,lock));
const {createSchemaSubset,assertClosedReferences,encodeSchema}=await import(pathToFileURL(path.join(library,'scripts/schema-subsets.mjs')).href);
const compile=s=>new Ajv({strict:false,allErrors:true}).compile(s);
const full=compile(schema),subsets=new Map();
const groupsFor=d=>{const found=new Set();const walk=x=>{if(!x||typeof x!=='object')return;if(typeof x.type==='string'){assert.ok(index.nodeOwners[x.type],'Unknown type '+x.type);found.add(index.nodeOwners[x.type]);}Object.values(x).forEach(walk);};walk(d);return [...found].sort();};
const subsetFor=groups=>{const key=groups.join(',');if(!subsets.has(key)){const s=createSchemaSubset(schema,index.nodeOwners,groups);assertClosedReferences(s);subsets.set(key,compile(s));}return subsets.get(key);};
let fragments=0;
for(const group of index.groups){
 for(const [entry,groups,rootKind]of [[group.documentSchema,group.includedGroups,'document'],[group.nodeSchema,[group.id],'node']]){
  const generated=createSchemaSubset(schema,index.nodeOwners,groups,{rootKind});assertClosedReferences(generated);
  const bytes=await readFile(path.resolve(library,'src/schema/fragments',entry.path));
  assert.equal(sha256(bytes),entry.sha256);assert.equal(encodeSchema(generated),bytes.toString('utf8'),'Fragment must derive unchanged from full schema');fragments++;
 }
}
const invalid=await readJSON(path.join(root,candidateDirectory,'invalid.json'));
const negatives=[];
for(const fixture of invalid){
 const result=api.validateDocument(fixture.document);assert.equal(result.ok,false,fixture.name);
 assert.ok(result.issues.some(x=>x.code===fixture.expectedCode&&(fixture.expectedPath===undefined||x.path===fixture.expectedPath)),fixture.name+': '+JSON.stringify(result.issues));
 if(fixture.expectedCode==='SCHEMA')assert.equal(full(fixture.document),false,fixture.name+' structurally rejected');
 else assert.equal(full(fixture.document),true,fixture.name+' must demonstrate semantic-only rejection');
 negatives.push({name:fixture.name,canonicalId:fixture.canonicalId,code:fixture.expectedCode,...(fixture.expectedPath?{path:fixture.expectedPath}:{})});
}
console.log('PASS pinned source/build, 22 regenerated fragments, '+negatives.length+' exact negative cases');
const exampleLanguages=await readJSON(path.join(root,'references/example-languages.json'));
const inputPaths=[...new Map(lock.items.flatMap(i=>i.examples).map(x=>[x.candidatePath,x])).values()];
const records=[];
for(const item of inputPaths){
 const file=path.join(root,item.candidatePath),bytes=await readFile(file),document=JSON.parse(bytes);
 assert.equal(sha256(bytes),lock.sourceFiles[item.sourcePath]);
 const before=JSON.stringify(document),checked=api.validateDocument(document);assert.equal(checked.ok,true,item.sourcePath+': '+JSON.stringify(checked.issues));
 assert.equal(full(document),true,item.sourcePath+': '+JSON.stringify(full.errors?.slice(0,2)));
 const groups=groupsFor(document),sub=subsetFor(groups);assert.equal(sub(document),true,item.sourcePath+' missing subset '+JSON.stringify(sub.errors?.slice(0,2)));
 const lang=exampleLanguages[path.basename(file,'.json')];assert.ok(['en','zh-CN'].includes(lang));
 const html=await api.compileHtml(document,{assets:'inline',backend:'portable',lang});assert.equal(await api.compileHtml(document,{assets:'inline',backend:'portable',lang}),html,'Compiler determinism');
 assert.equal(JSON.stringify(document),before,'Source mutation');
 const cli=spawnSync(process.execPath,[path.join(library,'bin/iui.mjs'),'validate',file,'--json'],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).ok,true);
 const dom=new JSDOM('<html lang="zh-CN"><body><main></main></body></html>',{pretendToBeVisual:true});
 const host=dom.window.document.querySelector('main');let controller;
 try{controller=api.mount(host,document);assert.ok(host.textContent.length>0);controller.setState({});}finally{controller?.dispose();dom.window.close();}
 records.push({file:item.candidatePath,sourcePath:item.sourcePath,sha256:sha256(bytes),groups,compiledSha256:sha256(html),semantic:'passed',canonicalStructure:'passed',closedSubset:'passed',cli:'passed',mount:'passed in JSDOM, not browser'});
}
console.log('PASS '+records.length+' frozen candidate examples: public API, canonical/subset schemas, CLI, compile and JSDOM');
let priorExamples=0;for(const file of (await readdir(path.join(root,'examples'))).filter(x=>x.endsWith('.json'))){const d=await readJSON(path.join(root,'examples',file));assert.equal(api.validateDocument(d).ok,true,file);assert.equal(full(d),true,file);priorExamples++;}
const literalResults=[];
for(const file of ['SKILL.md','WEB-CHAT-GUIDE.md','references/pending-learning.md']){
 const text=await readFile(path.join(root,file),'utf8');
 for(const match of text.matchAll(/^```json( candidate-only)?\r?\n([\s\S]*?)^```/gm)){
  const input=JSON.parse(match[2]),d=input.version?input:{version:'iui/1',body:[input]},r=api.validateDocument(d);
  assert.equal(r.ok,true,file+': '+JSON.stringify(r.issues));assert.equal(full(d),true,file+' literal');
  const sub=subsetFor(groupsFor(d));assert.equal(sub(d),true,file+' literal domain');literalResults.push({file,candidateOnly:!!match[1],sha256:sha256(match[2])});
 }
 if(file!=='references/pending-learning.md')assert.equal(api.validateDocument(readSkillShell(text).document).ok,true,'Shell JSON');
}
const doc=(node,state)=>({version:'iui/1',...(state?{state}:{}),body:[node]});
const positives=[
 doc({type:'input',kind:'date',label:'Empty optional date',bind:'day'},{day:''}),
 doc({type:'input',kind:'date',label:'Host supplied outside constraint',bind:'day',minDate:'2025-01-01'},{day:'2024-02-29'}),
 doc({type:'input',kind:'checkbox',label:'Required but unconfirmed',bind:'consent',required:true},{consent:false}),
 doc({type:'rating',label:'Unrated',bind:'r'},{r:0}),
 doc({type:'code',value:'😀'.repeat(12000),copy:true,highlight:true,language:'unrecognized-language'}),
 doc({type:'markdown',value:'😀'.repeat(12000)}),
 doc({type:'person-profile',name:'😀'.repeat(200),facts:[],links:[]}),
 doc({type:'prompt-suggestions',label:'Supplied duplicate text',items:[{id:'a',text:'Same'},{id:'b',text:'Same'}]}),
 doc({type:'restaurant-menu',title:'Zero and missing',currency:'USD',sections:[{id:'s',title:'Section',items:[{id:'a',name:'Zero',price:0},{id:'b',name:'Missing',price:null}]}]}),
 doc({type:'agenda',label:'Boundaries',events:[{id:'a',date:'0001-01-01',title:'First'},{id:'b',date:'9999-12-31',title:'Last'}]}),
 doc({type:'sentence-builder',title:'Same visible text, different identity',tokens:[{id:'a',text:'same'},{id:'b',text:'same'}],answer:['b','a']}),
 doc({type:'writing-block',label:'Empty read-only draft',value:'',editable:false})
];
for(const d of positives){const r=api.validateDocument(d);assert.equal(r.ok,true,JSON.stringify(r.issues));assert.equal(full(d),true);}
// Base ownership of a container does not grant domains of nested content.
const missingDomain=[['carousel.json',['base']],['tabs-local-state.json',['base']],['field-labels.json',['base']],['fill-blank-practice.json',['base']],['pie.json',['base']]];
for(const [file,groups]of missingDomain){const d=await readJSON(path.join(root,candidateDirectory,'examples',file));assert.equal(subsetFor(groups)(d),false,'Must reject incomplete domains '+file);}
const nodeOnly=compile(createSchemaSubset(schema,index.nodeOwners,['learning'],{rootKind:'node'}));assert.equal(nodeOnly(positives[10]),false,'Node lookup is not Document root');assert.equal(nodeOnly(positives[10].body[0]),true);
const dangerous='<img src=x onerror="globalThis.injected=true">😀 & <script>bad()</script>';
const probes=[
 {type:'carousel',label:dangerous,children:[{type:'text',value:'Child'}]},
 {type:'code',value:dangerous,copy:true,highlight:true,language:'javascript'},
 {type:'markdown',value:dangerous},
 {type:'input',id:'check',kind:'checkbox',label:dangerous,bind:'done'},
 {type:'input',kind:'date',label:dangerous,bind:'day'},
 {type:'label',text:dangerous,target:'check'},
 {type:'tab-group',label:dangerous,children:[{type:'tab-panel',id:'panel',label:dangerous,children:[]}]},
 {type:'checklist',label:dangerous,items:[{id:'check',label:dangerous,bind:'done'}]},
 {type:'rating',label:dangerous,bind:'rate'},
 {type:'favicon',label:dangerous,fallback:'😀'},
 {type:'agenda',label:dangerous,events:[{id:'a',date:'2024-02-29',title:dangerous}]},
 {type:'button',label:dangerous,action:{kind:'reset'}},
 {type:'restaurant-menu',title:dangerous,currency:'USD',sections:[]},
 {type:'prompt-suggestions',label:dangerous,items:[{id:'a',text:dangerous}]},
 {type:'person-profile',name:dangerous,biography:dangerous},
 {type:'writing-block',label:dangerous,value:dangerous},
 {type:'fill-blank',title:dangerous,parts:[dangerous,{blank:'a'}],blanks:[{id:'a',label:dangerous,answers:[dangerous]}]},
 {type:'sentence-builder',title:dangerous,tokens:[{id:'a',text:dangerous}],answer:['a']},
 {type:'vocab-card',term:dangerous,senses:[{id:'a',meaning:dangerous}]},
 {type:'chart',kind:'pie',title:dangerous,xKey:'x',series:[{key:'n',label:dangerous}],data:[{x:dangerous,n:0},{x:'Missing',n:null}]}
];
const literalDoc={version:'iui/1',state:{done:false,day:'2024-02-29',rate:0},body:probes};
const literalResult=api.validateDocument(literalDoc);assert.equal(literalResult.ok,true,JSON.stringify(literalResult.issues));
const dom=new JSDOM('<html lang="en"><body><main></main></body></html>',{pretendToBeVisual:true});const host=dom.window.document.querySelector('main');let controller;
try{
 controller=api.mount(host,literalDoc);assert.equal(host.querySelectorAll('script,img,iframe,object,embed,[onerror],[onclick]').length,0);
 assert.ok(host.textContent.includes(dangerous));assert.ok([...host.querySelectorAll('textarea')].some(x=>x.value===dangerous));assert.equal(dom.window.injected,undefined);
 const markup=host.innerHTML;const state=controller.getState();assert.throws(()=>controller.setState({rate:2.5}));assert.deepEqual(controller.getState(),state);assert.equal(host.innerHTML,markup);
}finally{controller?.dispose();dom.window.close();}
const extension24=verifyPending24({api,full,subsetFor,JSDOM});
const extension30=verifyPending30({api,full,subsetFor,JSDOM});
await verifyPinnedInputs(root,library,lock);
const report={extension24,extension30,format:'inform-skill-source-validation/1',candidateOnly:true,sourceRevision:lock.sourceRevision,sourceTree:lock.sourceTree,acceptedAssetRevision:lock.acceptedAssetRevision,fullSchemaSha256:lock.fullSchema.sha256,sourceFilesChecked:Object.keys(lock.sourceFiles).length,builtFilesChecked:Object.keys(lock.runtimeFiles).length,canonicalCandidates:30,protocolNodes:90,examples:records,priorExamples,literals:literalResults,negativeCases:negatives,positiveBoundaries:positives.length+extension24.positiveBoundaries+extension30.positiveBoundaries,generatedFragments:fragments,missingDomainNegatives:missingDomain.length+extension24.missingDomainNegatives+extension30.missingDomainNegatives,nodeRootBoundary:'passed',literalInjectionTypes:probes.length+extension24.literalInjectionTypes+extension30.literalInjectionTypes,atomicInvalidState:'passed in JSDOM',publicMount:'JSDOM only, not real browser',browser:'not-run',cdn:'not-run',ci:'not-run',publicAssetPromotion:false};
await mkdir(path.join(root,'artifacts/pending-batch'),{recursive:true});await writeFile(path.join(root,'artifacts/pending-batch/validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(`PASS source candidate: ${records.length} frozen examples + ${priorExamples} prior examples; ${literalResults.length} literals; ${negatives.length} negatives; ${positives.length+extension24.positiveBoundaries+extension30.positiveBoundaries} positive boundaries; ${fragments} regenerated fragments; ${missingDomain.length+extension24.missingDomainNegatives+extension30.missingDomainNegatives} missing-domain negatives; ${probes.length+extension24.literalInjectionTypes+extension30.literalInjectionTypes} inert-render probes. Public CLI, deterministic compile and JSDOM pass. Browser/CDN/CI not run.`);
