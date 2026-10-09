/** Original next-batch fixtures; consume only the real frozen library and its canonical schema. */
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=async p=>JSON.parse(await readFile(p,'utf8')), hash=v=>createHash('sha256').update(v).digest('hex');
function arg(flag){const at=process.argv.indexOf(flag);if(at<0)return;assert.ok(process.argv[at+1]&&!process.argv[at+1].startsWith('--'));return process.argv[at+1];}
const names=['loading-numeric-progress','loading-placeholder-shapes','supplied-source-reading'];
const docs=await Promise.all(names.map(n=>json(path.join(root,'examples',n+'.json'))));
const negatives=await json(path.join(root,'tests/next66-invalid.json'));
const literals=[];
for(const name of ['SKILL.md','WEB-CHAT-GUIDE.md'])for(const m of (await readFile(path.join(root,name),'utf8')).matchAll(/^```json\r?\n([\s\S]*?)^```/gm)){const d=JSON.parse(m[1]);literals.push({file:name,document:d.version?d:{version:'iui/1',body:[d]}});}
const history=await json(path.join(root,'tests/frozen-history-sha256.json'));
for(const [p,sha]of Object.entries(history))assert.equal(hash(await readFile(path.join(root,p))),sha,p);
console.log(`PASS syntax: ${names.length} new examples, ${negatives.length} negative fixtures, ${literals.length} root/guide literals, ${Object.keys(history).length} immutable history files`);
if(!arg('--library')){console.log('NOT RUN: frozen public API, canonical schema, compile, browser, CDN. Pass --library PATH --revision FROZEN_SHA.');process.exit(0);}
const library=path.resolve(arg('--library')), revision=arg('--revision');assert.match(revision??'',/^[a-f0-9]{40}$/,'Explicit frozen revision required while this batch is a draft');
const git=args=>{const r=spawnSync('git',['-C',library,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;};
assert.equal(git(['rev-parse','HEAD']).trim(),revision);assert.equal(git(['status','--porcelain']).trim(),'','Use a clean frozen checkout, not moving integration');
const pkg=await json(path.join(library,'package.json'));assert.equal(pkg.name,'@micraow/inform-ui');
const api=await import(pathToFileURL(path.resolve(library,pkg.exports['.'].import)).href);
const fullPath=path.resolve(library,pkg.exports['./schema']),bytes=await readFile(fullPath),full=JSON.parse(bytes);
const index=await json(path.join(library,'src/schema/fragments/index.json'));assert.equal(hash(bytes),index.fullSchema.sha256);
for(const n of ['loading','loading-block','citation','web-link-cards'])assert.equal(index.nodeOwners[n],'base');
const {createSchemaSubset,assertClosedReferences}=await import(pathToFileURL(path.join(library,'scripts/schema-subsets.mjs')).href);
const require=createRequire(path.join(library,'package.json')),Ajv=require('ajv/dist/2020.js').default,{JSDOM}=require('jsdom');
const compileSchema=s=>new Ajv({strict:false,allErrors:true}).compile(s),canonical=compileSchema(full);
const groupsFor=input=>{const set=new Set();const walk=v=>{if(!v||typeof v!=='object')return;if(typeof v.type==='string'){assert.ok(index.nodeOwners[v.type]);set.add(index.nodeOwners[v.type]);}Object.values(v).forEach(walk);};walk(input);return [...set].sort();};
const results=[];
for(let i=0;i<docs.length;i++){
 const d=docs[i],before=JSON.stringify(d),checked=api.validateDocument(d);assert.equal(checked.ok,true,JSON.stringify(checked.issues));assert.equal(canonical(d),true,JSON.stringify(canonical.errors?.slice(0,3)));
 const html=await api.compileHtml(d,{assets:'inline',backend:'portable',lang:'zh-CN'});assert.equal(await api.compileHtml(d,{assets:'inline',backend:'portable',lang:'zh-CN'}),html);assert.equal(JSON.stringify(d),before);
 const groups=groupsFor(d),subset=createSchemaSubset(full,index.nodeOwners,groups);assertClosedReferences(subset);const validate=compileSchema(subset);assert.equal(validate(d),true,JSON.stringify(validate.errors));
 const cli=spawnSync(process.execPath,[path.join(library,'bin/iui.mjs'),'validate',path.join(root,'examples',names[i]+'.json'),'--json'],{encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).ok,true);
 results.push({file:names[i]+'.json',groups,sourceSha256:hash(before),compiledSha256:hash(html),publicApi:'passed',cli:'passed',derivedSubset:'passed'});
}
let oldExamples=0;
for(const n of (await readdir(path.join(root,'examples'))).filter(n=>n.endsWith('.json')&&!names.includes(n.slice(0,-5)))){const d=await json(path.join(root,'examples',n));assert.equal(api.validateDocument(d).ok,true,n);oldExamples++;}
for(const x of literals){const checked=api.validateDocument(x.document);assert.equal(checked.ok,true,`${x.file}: ${JSON.stringify(checked.issues)}`);}
for(const x of negatives)assert.equal(api.validateDocument(x.document).ok,false,x.name);
const doc=node=>({version:'iui/1',body:[node]});
const unicode={type:'citation',title:'😀'.repeat(300),url:'https://example.invalid/a',publisher:'字'.repeat(200),description:'字'.repeat(1000),number:999};assert.equal(api.validateDocument(doc(unicode)).ok,true,'Unicode maxima');
const duplicate={type:'web-link-cards',label:'Synthetic duplicates',items:Array.from({length:20},()=>({title:'Duplicate',url:'https://example.invalid/same'}))};assert.equal(api.validateDocument(doc(duplicate)).ok,true,'20 duplicates remain legitimate authored content');
assert.equal(api.validateDocument(doc({type:'citation',title:'HTTP policy boundary only',url:'http://example.invalid/a'})).ok,true,'Absolute HTTP is an allowed protocol, not a claim of transport privacy');
const pathError=api.validateDocument({version:'iui/1',body:[{type:'section',children:[{type:'web-link-cards',label:'Bad second record',items:[{title:'Allowed',url:'https://example.invalid/a'},{title:'Denied',url:'mailto:demo@example.invalid'}]}]}]});
assert.equal(pathError.ok,false);assert.ok(pathError.issues.some(i=>i.code==='UNSAFE_URL'&&i.path==='/body/0/children/0/items/1/url'));
const baseOnly=compileSchema(createSchemaSubset(full,index.nodeOwners,['base']));assert.equal(baseOnly(docs[2]),false,'Sources and loading do not erase nested forms domain');
const previous=compileSchema(JSON.parse(git(['show','01ae9d870b221208b31e9da437ae87fdef265cec:src/schema/iui.schema.json'])));for(const d of docs)assert.equal(previous(d),false,'New examples cannot be mixed with the old62 CDN');
const dom=new JSDOM('<html lang="zh-CN"><body><main></main></body></html>',{pretendToBeVisual:true});const host=dom.window.document.querySelector('main'),controller=api.mount(host,docs[2]);
try{
 const known=host.querySelector('[role=progressbar]'),rail=host.querySelector('.iui-source-rail'),links=[...rail.querySelectorAll('a')],input=host.querySelector('input[type=number]');input.focus();
 assert.equal(known.getAttribute('aria-valuenow'),'25');assert.equal(links.length,4);assert.equal(links[1].href,links[2].href);assert.equal(host.querySelector('.iui-source-number').textContent,'[7]');
 for(const a of host.querySelectorAll('.iui-source-title')){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.ok(a.getAttribute('aria-describedby'));}
 controller.setState({readCount:2});assert.equal(known.getAttribute('aria-valuenow'),'50');assert.equal(host.querySelector('.iui-source-rail'),rail);assert.equal(dom.window.document.activeElement,input);
 input.value='5';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(controller.getState().readCount,2);assert.equal(known.getAttribute('aria-valuenow'),'50');
 const state=controller.getState(),markup=host.innerHTML;assert.throws(()=>controller.setState({readCount:5}));assert.deepEqual(controller.getState(),state);assert.equal(host.innerHTML,markup);assert.equal(dom.window.document.activeElement,input);
 const invalid=structuredClone(docs[2]);invalid.body.find(n=>n.type==='citation').url='javascript:bad()';assert.throws(()=>controller.update(invalid));assert.equal(host.querySelector('.iui-source-rail'),rail);assert.equal(host.innerHTML,markup);
 controller.setState({readCount:0});assert.equal(known.getAttribute('aria-valuenow'),'0');
}finally{controller.dispose();dom.window.close();}
assert.equal(git(['rev-parse','HEAD']).trim(),revision);assert.equal(git(['status','--porcelain']).trim(),'');assert.equal(hash(await readFile(fullPath)),hash(bytes));
await mkdir(path.join(root,'artifacts/next66'),{recursive:true});await writeFile(path.join(root,'artifacts/next66/validation.json'),JSON.stringify({revision,fullSchemaSha256:hash(bytes),newExamples:results,oldExamples,literals:literals.length,negatives:negatives.length,positiveBoundaries:3,exactUnsafeUrlPointer:'passed',missingDomain:'passed',previous62Rejects:'passed',publicMount:'passed in JSDOM, not browser',browser:'not-run',cdn:'not-run'},null,2)+'\n');
console.log(`PASS frozen public API: ${docs.length} new + ${oldExamples} prior examples, ${literals.length} literals, ${negatives.length} negatives,3 positive boundaries,derived schemas,CLI,deterministic compile and JSDOM lifecycle. Browser/CDN are separate.`);
