/** Deterministic whole-reading-path comparison. No model API or browser. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire,Module} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {createProgressiveTask,separateTaskEvidence,parseProgressiveOptions} from './progressive-source-consumer.mjs';
import {createNodeProgressiveTask,separateNodeEvidence} from './node-source-consumer.mjs';
const encode=x=>JSON.stringify(x,null,2)+'\n';
const digest=x=>createHash('sha256').update(x).digest('hex');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=parseProgressiveOptions(process.argv.slice(2),['--library','--revision','--output','--case']);
for(const flag of ['--library','--revision','--output'])assert.ok(args[flag],flag);
const library=path.resolve(args['--library']),revision=args['--revision'];
const read=async p=>readFile(path.join(root,p));
const catalog=JSON.parse(await read('authoring/progressive/source-index.json'));
const publication=JSON.parse(await read('authoring/progressive/source-public.json'));
assert.ok([publication.sourceCommit,publication.publicCommit].includes(revision),'revision matches verified source');
let cases=JSON.parse(await read('authoring/design-workflows/cases.json')).cases;
if(!args['--case']){
 const temporary=await mkdtemp(path.join(tmpdir(),'iui-design-cases-'));const all=[];
 try{
  for(const c of cases){const output=path.join(temporary,c.id+'.json');execFileSync(process.execPath,['--max-old-space-size=256',fileURLToPath(import.meta.url),'--library',library,'--revision',revision,'--case',c.id,'--output',output],{stdio:'inherit'});all.push(JSON.parse(await readFile(output)));}
  const result={...all[0],passed:all.reduce((n,x)=>n+x.passed,0),cases:all.flatMap(x=>x.cases),processIsolation:'One serial process per case; assertions and input accounting are identical.'};await writeFile(args['--output'],encode(result));console.log(JSON.stringify({passed:result.passed,failed:0,output:args['--output']}));
 }finally{await rm(temporary,{recursive:true,force:true});}
 process.exit(0);
}
cases=cases.filter(c=>c.id===args['--case']);assert.equal(cases.length,1,'known unique case');
const require=createRequire(path.join(library,'package.json'));
const Ajv=require('ajv/dist/2020.js').default;
const compile=schema=>new Ajv({allErrors:true,strict:true,ownProperties:true,discriminator:true}).compile(schema);
const {build}=require('esbuild');
const compiled=await build({entryPoints:[path.join(library,'src/core/index.ts')],bundle:true,write:false,format:'cjs',platform:'node',target:'node22'});
const runtime=new Module(path.join(library,'design-workflow-validation.cjs'));
runtime.filename=path.join(library,'design-workflow-validation.cjs');runtime.paths=Module._nodeModulePaths(library);runtime._compile(compiled.outputFiles[0].text,runtime.filename);
const {validateDocument,evaluateState,evaluateQuestionnaire}=runtime.exports;
const fullBytes=await read('authoring/progressive/webchat/iui.schema.json');
assert.equal(digest(fullBytes),'c59d34b171ee7cc54e278a857688d834363bbd6ff064f9ff503abfb74bdd0c92');
assert.deepEqual(fullBytes,await readFile(path.join(library,'src/schema/iui.schema.json')));
const validateFull=require(path.join(library,'src/schema/validator.cjs'));
const results=[];
for(const c of cases){
 const examplePath='authoring/design-workflows/'+c.example,exampleBytes=await read(examplePath),document=JSON.parse(exampleBytes);
 const opts={library,revision,components:c.components};
 const moduleResult=await createProgressiveTask(opts);
 const nodeOpts={...opts,exampleRoot:root,examplePaths:[examplePath]};
 const nodeResult=await createNodeProgressiveTask(nodeOpts);
 assert.deepEqual(moduleResult.contracts,nodeResult.contracts,c.id+' complete semantic contracts');
 const moduleTask=separateTaskEvidence(moduleResult,'task.manifest.json').task;
 const nodeTask=separateNodeEvidence(nodeResult,'task.manifest.json').task;
 assert.deepEqual(nodeTask.selection.includedComponents,[...c.components].sort());
 for(const [name,definition]of Object.entries(nodeTask.schema.$defs))if(name!=='Node')assert.deepEqual(definition,moduleTask.schema.$defs[name]);
 for(const [arm,schema]of [['module',moduleTask.schema],['node',nodeTask.schema],['full',JSON.parse(fullBytes)]]){
  const validate=arm==='full'?validateFull:compile(schema);assert.equal(validate(document),true,c.id+' '+arm+' '+JSON.stringify(validate.errors));
 }
 const validated=validateDocument(document);assert.equal(validated.ok,true,c.id+' runtime '+JSON.stringify(validated.issues));
 const checks=[];
 if(c.id==='workshop-capacity'){
  for(const [attendees,remaining]of [[0,30],[11,19],[30,0]]){const state=evaluateState(validated.document,{attendees});assert.equal(state.ok,true);assert.equal(state.computed.remaining,remaining);checks.push('remaining@'+attendees+'='+remaining);}
 }
 if(c.id==='supplied-status'){assert.equal(document.body[0].children[0].children[0].value,0);assert.equal(document.body[0].children[1].children[0].value,null);checks.push('zero and null retained');}
 if(c.id==='workshop-agenda'){assert.equal(document.body[0].initial,'setup');assert.deepEqual(document.body[0].children.map(x=>x.id),['setup','practice']);checks.push('typed panels and initial id retained');}
 if(c.id==='branching-packing'){
  const node=document.body[0];const initial=evaluateQuestionnaire(node);assert.equal(initial.snapshot.status,'ready');assert.deepEqual(initial.snapshot.computed,{packages:0,routeDistance:null});assert.equal(initial.snapshot.answers.borrowed,false);assert.equal(Object.hasOwn(initial.snapshot.answers,'distance'),false);assert.equal(initial.draft.distance,9);
  const delivery=evaluateQuestionnaire(node,{...initial.draft,mode:'delivery'});assert.equal(delivery.snapshot.answers.distance,9);assert.equal(delivery.snapshot.computed.routeDistance,9);
  const optional=evaluateQuestionnaire(node,{...initial.draft,mode:'delivery',distance:null});assert.equal(optional.snapshot.status,'ready');assert.equal(optional.snapshot.computed.routeDistance,null);
  for(const [units,status]of [[null,'incomplete'],['bad','invalid']]){const bad=evaluateQuestionnaire(node,{...initial.draft,units});assert.equal(bad.snapshot.status,status);assert.deepEqual(bad.snapshot.computed,{});}
  assert.equal(initial.snapshot.version,'1.0.0');assert.ok(Object.isFrozen(initial.snapshot)&&Object.isFrozen(initial.snapshot.computed));checks.push('zero/false preserved','hidden draft retained and excluded','delivery draft restored','optional unknown stays null','required unknown suppresses result','invalid suppresses result','version and frozen result');
 }
 if(c.id==='short-notice'){assert.equal(document.body.length,1);assert.equal(document.state,undefined);checks.push('no implicit state');}
 const repeatedModule=separateTaskEvidence(await createProgressiveTask(opts),'task.manifest.json').task;
 const repeatedNode=separateNodeEvidence(await createNodeProgressiveTask(nodeOpts),'task.manifest.json').task;
 assert.equal(encode(moduleTask),encode(repeatedModule));assert.equal(encode(nodeTask),encode(repeatedNode));
 const categories=[...new Set(c.components.map(type=>{const found=catalog.components.find(x=>x.type===type);assert.ok(found);return found.category;}))].sort();
 const common=[];
 const add=(name,b)=>common.push({path:name,bytes:Buffer.byteLength(b),sha256:digest(b)});
 for(const file of ['SKILL.md','authoring/progressive/README.md','authoring/progressive/index.json',...categories.map(x=>'authoring/progressive/categories/'+x+'.json')])add(file,await read(file));
 add('task-brief:'+c.id,c.brief+'\n');add(examplePath,exampleBytes);
 const arm=async(name,task)=>{const items=[...common];if(name==='node'){const b=await read('authoring/NODE-SELECTION.md');items.push({path:'authoring/NODE-SELECTION.md',bytes:b.length,sha256:digest(b)});}const body=encode(task);items.push({path:name+'-task.json',bytes:Buffer.byteLength(body),sha256:digest(body)});return{components:task.selection.includedComponents.length,definitions:Object.keys(task.schema.$defs).length,taskBytes:Buffer.byteLength(body),schemaBytes:task.identity.schemaBytes,wholeInputBytes:items.reduce((n,x)=>n+x.bytes,0),items};};
 const module=await arm('module',moduleTask),node=await arm('node',nodeTask);
 results.push({id:c.id,requested:c.components,categories,module,node,savedBytes:module.wholeInputBytes-node.wholeInputBytes,contractCount:moduleTask.contracts.length,contractBytes:moduleTask.contracts.reduce((n,x)=>n+x.bytes,0),contractSha256:digest(encode(moduleTask.contracts)),contractsExactlyEqual:true,structural:{module:true,node:true,full:true},runtimeSemanticValidation:true,pureStateChecks:checks,deterministic:true});
 console.log(JSON.stringify({case:c.id,savedBytes:results.at(-1).savedBytes}));
}
const result={format:'inform-ui-design-workflow-comparison/1',sourceCommit:revision,sourcePublic:publication.publicCommit,methodSha256:digest(await read('authoring/design-workflows/METHOD.md')),casesSha256:digest(await read('authoring/design-workflows/cases.json')),passed:results.length,failed:0,cases:results,fullSchema:{bytes:fullBytes.length,sha256:digest(fullBytes)},limits:{unit:'UTF-8 bytes',modelGenerationEvaluated:false,tokenizerUsed:false,browserExecuted:false,networkRequests:0,defaultSelectionChanged:false},notes:['Actual workflow payloads include method-specific instructions and example differences.','All required module semantic contracts are retained.','Pure core source validation and focused state checks are not renderer interaction tests.']};
await writeFile(args['--output'],encode(result));console.log(JSON.stringify({passed:result.passed,failed:0,output:args['--output']}));
