/** Verify current discovery and real CLI contracts against one clean, already-built source pin. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseProgressiveOptions,createProgressiveTask,separateTaskEvidence} from './progressive-source-consumer.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const options=parseProgressiveOptions(process.argv.slice(2),['--library','--output']);
assert.ok(options['--library'],'--library is required');
const library=path.resolve(options['--library']);
const read=p=>readFile(path.join(root,p));
const json=async p=>JSON.parse(await read(p));
const index=await json('authoring/current219/index.json'),revision=index.source.sourceCommit;
assert.equal(index.catalogVersion,'current219');
assert.equal(index.source.publicCommit,revision);
assert.equal(execFileSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),revision);
assert.equal(execFileSync('git',['-C',library,'status','--porcelain'],{encoding:'utf8'}).trim(),'');
assert.deepEqual(await readFile(path.join(library,'src/schema/iui.schema.json')),await read('authoring/current219/webchat/iui.schema.json'));
const temporary=await mkdtemp(path.join(tmpdir(),'iui-current-authoring-'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const checks=[];
try {
 const cli=path.join(library,'bin/iui.mjs');
 const run=(...args)=>execFileSync(process.execPath,[cli,...args],{cwd:library,encoding:'utf8',maxBuffer:2_000_000});
 const discovery=path.join(temporary,'index.json');
 execFileSync(process.execPath,[path.join(library,'scripts/build-schema-selection.mjs'),'--index','--output',discovery],{cwd:library,stdio:'pipe'});
 assert.deepEqual(JSON.parse(await readFile(discovery)),await json('authoring/current219/source-index.json'));
 checks.push('runtime discovery matches all 219 catalog nodes');
 const task=await createProgressiveTask({library,revision,components:['rating-summary']});
 task.runtime.publicCommit=revision;
 const separated=separateTaskEvidence(task,'rating-summary.json.manifest.json');
 assert.deepEqual(separated.task,await json('authoring/current219/modules/content/rating-summary.json'));
 assert.deepEqual(separated.manifest,await json('authoring/current219/modules/content/rating-summary.json.manifest.json'));
 checks.push('isolated rating-summary selection matches exact task and manifest');
 const examplePath=path.join(root,'authoring/current219/examples/rating-summary.json'),example=JSON.parse(await readFile(examplePath));
 const Ajv=createRequire(path.join(library,'package.json'))('ajv/dist/2020.js').default;
 const structural=new Ajv({strict:true,allErrors:true,ownProperties:true,discriminator:true}).compile(task.schema);
 assert.equal(structural(example),true,JSON.stringify(structural.errors));
 assert.deepEqual(JSON.parse(run('validate',examplePath,'--json')),{ok:true,version:'iui/1'});
 assert.deepEqual(JSON.parse(run('inspect',examplePath)).nodes,{'rating-summary':4});
 checks.push('original supplied/unknown/missing/literal examples validate and inspect through CLI');
 const good={version:'iui/1',body:[{type:'rating-summary',ratingLabel:'4.7'}]};
 let rejected=0;
 for (const [name,node,code] of [
  ['numeric rating',{type:'rating-summary',ratingLabel:4.7},'SCHEMA'],
  ['empty label',{type:'rating-summary',ratingLabel:''},'SCHEMA'],
  ['oversized Unicode label',{type:'rating-summary',ratingLabel:'😀'.repeat(201)},'SCHEMA'],
  ['input field',{...good.body[0],bind:'score'},'SCHEMA'],
  ['missing provider URL',{...good.body[0],provider:{label:'Example'}},'SCHEMA'],
  ['provider artwork',{...good.body[0],provider:{label:'Example',url:'https://example.com',logo:'x'}},'SCHEMA'],
  ['relative URL',{...good.body[0],provider:{label:'Example',url:'/reviews'}},'UNSAFE_URL'],
  ['script URL',{...good.body[0],provider:{label:'Example',url:'javascript:alert(1)'}},'UNSAFE_URL'],
  ['credential-bearing URL',{...good.body[0],provider:{label:'Example',url:'https://user:secret@example.com'}},'UNSAFE_URL'],
 ]) {
  const file=path.join(temporary,'invalid.json');await writeFile(file,JSON.stringify({...good,body:[node]}));
  const result=spawnSync(process.execPath,[cli,'validate',file,'--json'],{cwd:library,encoding:'utf8'});
  assert.equal(result.status,1,name);const parsed=JSON.parse(result.stdout);assert.equal(parsed.ok,false,name);assert.ok(parsed.issues.some(i=>i.code===code),name);rejected++;
 }
 // URL safety belongs to semantic validation, not the generic JSON string schema.
 assert.equal(structural({...good,body:[{...good.body[0],provider:{label:'Example',url:'/reviews'}}]}),true);
 checks.push('nine invalid documents rejected, including structurally valid unsafe URLs');
 const combined={version:'iui/1',state:{score:0},body:[good.body[0],{type:'rating',label:'Your rating',bind:'score'}]};
 const combinedPath=path.join(temporary,'combined.json');await writeFile(combinedPath,JSON.stringify(combined));
 assert.equal(JSON.parse(run('validate',combinedPath,'--json')).ok,true);
 assert.equal(structural(combined),false);
 checks.push('legacy rating input remains valid separately and cannot enter display-only closure');
 const output=path.join(temporary,'rating-summary.html');run('build',examplePath,'--out',output,'--lang','zh-CN');
 const html=await readFile(output);run('build',examplePath,'--out',output,'--lang','zh-CN');assert.deepEqual(await readFile(output),html);
 const embedded=html.toString().match(/<script id="iui-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(embedded);assert.equal(embedded.includes('<'),false);assert.deepEqual(JSON.parse(embedded),{...example,theme:'auto',state:{},computed:{}});
 assert.ok(html.toString().includes('iui-rating-summary'));assert.doesNotMatch(html.toString(),/<script\b[^>]*\bsrc=/i);
 checks.push('CLI builds deterministic inline HTML with literal escaped data and matching renderer');
 const result={format:'inform-ui-current-authoring-result/1',catalogVersion:index.catalogVersion,sourceCommit:revision,passed:checks.length,failed:0,checks,rejectedDocuments:rejected,protocolNodes:219,compiledHtml:{bytes:html.length,sha256:hash(html)},limits:{browserExecuted:false,humanScreenReaderAudit:false,allComponentVisualAcceptance:false,modelGenerationEvaluated:false}};
 if(options['--output'])await writeFile(options['--output'],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
} finally {await rm(temporary,{recursive:true,force:true});}
