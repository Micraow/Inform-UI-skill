/** Read source-catalog metadata; never infer schema facts from the legacy full bundle. */
import {readFile,writeFile,mkdir,mkdtemp,rm,realpath,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const hash=x=>createHash('sha256').update(x).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x));
function fail(message){throw Error('Progressive source contract: '+message);}
function list(x,name){if(!Array.isArray(x)||x.some(v=>typeof v!=='string'||!v))fail(name+' must be a string array');if(new Set(x).size!==x.length)fail(name+' contains duplicates');return x;}
function relative(p){if(typeof p!=='string'||!p||path.posix.isAbsolute(p)||p.includes('\\')||p.split('/').some(x=>!x||x==='.'||x==='..'))fail('unsafe local path');return p;}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function contractReference(ref){if(typeof ref!=='string')fail('invalid semantic contract path');const parts=ref.split('#');if(parts.length>2||(parts.length===2&&!/^[\p{L}\p{N}_-]+$/u.test(parts[1])))fail('unsupported contract anchor');return {path:relative(parts[0]),anchor:parts[1]??null};}
export function selectContractSection(text,anchor){if(!anchor)return text;const lines=text.split('\n');const slug=s=>s.toLowerCase().replace(/[\`*_]/g,'').replace(/[^\p{L}\p{N}_ -]/gu,'').replace(/ /g,'-');let start=-1,level=0,end=lines.length;for(let i=0;i<lines.length;i++){const m=/^(#{1,6}) +(.+?) *#*$/.exec(lines[i]);if(!m)continue;if(start<0&&slug(m[2])===anchor){start=i;level=m[1].length;}else if(start>=0&&m[1].length<=level){end=i;break;}}if(start<0)fail('semantic contract anchor does not exist: '+anchor);return lines.slice(start,end).join('\n').trim()+'\n';}

export function inspectSourceIndex(input){
 const index=copy(input);if(index.format!=='inform-ui-source-index/1')fail('unsupported index format');if(index.schemaVersion!=='iui/1')fail('unsupported schema version');
 if(index.sourceIdentity?.algorithm!=='sha256'||!/^[a-f0-9]{64}$/.test(index.sourceIdentity?.value??''))fail('missing source identity');
 if(!Array.isArray(index.modules)||!index.modules.length||!Array.isArray(index.components))fail('missing modules/components');
 const byModule=new Map(),byType=new Map(),byDefinition=new Map();
 for(const m of index.modules){if(typeof m.id!=='string'||!/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/.test(m.id)||byModule.has(m.id))fail('duplicate or invalid module id');for(const k of ['category','title'])if(typeof m[k]!=='string'||!m[k])fail('module '+k+' missing');
  if(!/^[a-z][a-z0-9-]*$/.test(m.category))fail('unsafe category id');list(m.provides,'provides');list(m.dependsOn,'dependsOn');relative(m.sourcePath);contractReference(m.contractPath);if(Object.hasOwn(m,'semanticContractPaths')){list(m.semanticContractPaths,'semanticContractPaths');if(!m.semanticContractPaths.length)fail('semanticContractPaths must not be empty');m.semanticContractPaths.forEach(contractReference);}list(m.examplePaths,'examplePaths').forEach(relative);byModule.set(m.id,m);
  for(const name of m.provides){if(byDefinition.has(name))fail('definition ownership conflict: '+name);byDefinition.set(name,m.id);}
 }
 for(const m of index.modules)for(const d of m.dependsOn)if(!byModule.has(d))fail('unknown module dependency: '+d);
 const active=new Set(),done=new Set();function visit(id){if(active.has(id))fail('module dependency cycle');if(done.has(id))return;active.add(id);for(const d of byModule.get(id).dependsOn)visit(d);active.delete(id);done.add(id);}for(const id of byModule.keys())visit(id);
 for(const c of index.components){if(typeof c.type!=='string'||!c.type||byType.has(c.type))fail('duplicate or invalid component type');const m=byModule.get(c.moduleId);if(!m)fail('unknown component module');if(!m.provides.includes(c.definition))fail('component definition has wrong owner');if(c.category!==m.category)fail('component category mismatch');contractReference(c.contractPath);if(Object.hasOwn(c,'semanticContractPaths')){list(c.semanticContractPaths,'semanticContractPaths');if(!c.semanticContractPaths.length)fail('semanticContractPaths must not be empty');c.semanticContractPaths.forEach(contractReference);}list(c.examplePaths,'component examplePaths').forEach(relative);byType.set(c.type,c);}
 const coverage=index.migrationCoverage;if(!coverage||!Number.isInteger(coverage.migratedNodeCount)||!Number.isInteger(coverage.totalNodeCount))fail('missing migration coverage');list(coverage.legacyNodeTypes,'legacyNodeTypes');
 if(coverage.migratedNodeCount!==index.components.length||coverage.totalNodeCount!==coverage.migratedNodeCount+coverage.legacyNodeTypes.length)fail('inconsistent migration coverage');for(const type of coverage.legacyNodeTypes)if(byType.has(type))fail('component simultaneously migrated and legacy');
 return {index,byModule,byType};
}
export function planComponentSelection(input,types){
 const {index,byModule,byType}=inspectSourceIndex(input);list(types,'requested components');if(!types.length)fail('select at least one component');
 for(const t of types)if(!byType.has(t)){if(index.migrationCoverage.legacyNodeTypes.includes(t))fail('component '+t+' is not migrated; use its explicitly versioned legacy contract');fail('unknown component: '+t);}
 const requested=new Set(types.map(t=>byType.get(t).moduleId)),resolved=new Set();function add(id){if(resolved.has(id))return;for(const d of byModule.get(id).dependsOn)add(d);resolved.add(id);}for(const m of index.modules)if(requested.has(m.id))add(m.id);
 const modules=index.modules.filter(m=>resolved.has(m.id)),components=index.components.filter(c=>resolved.has(c.moduleId));
 const explicit=modules.some(m=>Object.hasOwn(m,'semanticContractPaths'))||components.some(c=>Object.hasOwn(c,'semanticContractPaths'));
 const selections=new Map();const addContract=(p,followLinks)=>{const old=selections.get(p);selections.set(p,{path:p,followLinks:followLinks||old?.followLinks||false});};
 for(const m of modules){if(Object.hasOwn(m,'semanticContractPaths'))for(const p of m.semanticContractPaths)addContract(p,false);else addContract(m.contractPath,true);}
 for(const c of components){if(Object.hasOwn(c,'semanticContractPaths'))for(const p of c.semanticContractPaths)addContract(p,false);else if(c.contractPath!==byModule.get(c.moduleId).contractPath)addContract(c.contractPath,true);}
 return {schemaVersion:index.schemaVersion,sourceIdentity:copy(index.sourceIdentity),requestedComponents:[...types].sort(),requestedModules:index.modules.filter(m=>requested.has(m.id)).map(m=>m.id),resolvedModules:modules.map(m=>m.id),includedComponents:components.map(c=>c.type),contracts:[...selections.keys()],...(explicit?{contractSelections:[...selections.values()]}:{}),examples:[...new Set([...modules.flatMap(m=>m.examplePaths),...components.flatMap(c=>c.examplePaths)])],migrationCoverage:copy(index.migrationCoverage)};
}
export function assertClosedSchema(schema){
 function resolve(ref){if(typeof ref!=='string'||!ref.startsWith('#/'))fail('external or unsupported schema reference');let x=schema;for(const part of decodeURIComponent(ref.slice(2)).split('/').map(p=>p.replaceAll('~1','/').replaceAll('~0','~'))){if(!x||typeof x!=='object'||!Object.hasOwn(x,part))fail('unresolved schema reference: '+ref);x=x[part];}}
 function walk(x){if(!x||typeof x!=='object')return;for(const [k,v]of Object.entries(x)){if(k==='$ref'||k==='$dynamicRef')resolve(v);else walk(v);}}walk(schema);
}
export async function safeRead(root,name){relative(name);let file=root;for(const part of name.split('/')){file=path.join(file,part);if((await lstat(file)).isSymbolicLink())fail('symlink not permitted in source contract path');}return readFile(file);}
/** Follow only local Markdown semantic links; external sources are citations, never fetches. */
export async function readContractClosure(root,references,{followLinks=true}={}){
 const queue=[...references],seen=new Set(),contracts=[];
 while(queue.length){
  const ref=queue.shift();if(seen.has(ref))continue;seen.add(ref);if(seen.size>64)fail('semantic contract closure exceeds 64 sections');
  const loc=contractReference(ref),b=await safeRead(root,loc.path),text=selectContractSection(b.toString('utf8'),loc.anchor);
  contracts.push({path:ref,sourceBytes:b.length,sourceSha256:hash(b),bytes:Buffer.byteLength(text),sha256:hash(text),text});
  if(!followLinks)continue;
  for(const match of text.matchAll(/(?<!!)\[[^\]]*\]\(([^\s)]+)(?: +"[^"]*")?\)/g)){
   const link=match[1];if(/^[a-z][a-z0-9+.-]*:/i.test(link)||link.startsWith('//'))continue;
   const [file,anchor]=link.split('#');if(!file.endsWith('.md')&&!link.startsWith('#'))continue;
   if(path.posix.isAbsolute(file)||link.includes('\\')||link.split('#').length>2)fail('unsupported semantic link');
   const resolved=file?path.posix.normalize(path.posix.join(path.posix.dirname(loc.path),file)):loc.path;
   relative(resolved);queue.push(resolved+(anchor?'#'+anchor:''));
  }
 }
 return contracts;
}
export async function createProgressiveTask({library,revision,components,rootKind='document'}){
 if(!/^[a-f0-9]{40}$/.test(revision??''))fail('explicit full source commit required');if(!['document','node'].includes(rootKind))fail('root kind must be document or node');
 const root=await realpath(library);const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();if(git('rev-parse','HEAD')!==revision)fail('source revision mismatch');if(git('status','--porcelain'))fail('source checkout is not clean');
 const cli=path.join(root,'scripts/build-schema-selection.mjs');await safeRead(root,'scripts/build-schema-selection.mjs');const temporary=await mkdtemp(path.join(tmpdir(),'iui-progressive-task-'));
 const run=(...args)=>execFileSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
 try{
  const indexPath=path.join(temporary,'index.json');run('--index','--output',indexPath);const indexBytes=await readFile(indexPath),index=JSON.parse(indexBytes),plan=planComponentSelection(index,components);
  const output=path.join(temporary,'selection.json');run('--modules',plan.requestedModules.join(','),'--output',output,'--root',rootKind);
  const schemaBytes=await readFile(output),schema=JSON.parse(schemaBytes),manifest=JSON.parse(await readFile(output+'.manifest.json','utf8'));
  if(manifest.format!=='inform-ui-source-selection/1'||manifest.mode!=='selection')fail('unexpected selection manifest');if(!equal(manifest.sourceIdentity,index.sourceIdentity))fail('index/selection source version mismatch');
  if(manifest.schemaVersion!==index.schemaVersion||manifest.rootKind!==rootKind)fail('selection version/root mismatch');
  if(!equal(manifest.requestedModules,plan.requestedModules))fail('requested module mismatch');
  if(!equal([...manifest.resolvedModules].sort(),[...plan.resolvedModules].sort()))fail('dependency closure mismatch');
  if(!equal([...manifest.components].sort(),[...plan.includedComponents].sort()))fail('component inventory mismatch');
  if(manifest.sha256!==hash(schemaBytes)||manifest.utf8Bytes!==schemaBytes.length)fail('schema payload identity mismatch');
  const definitionHashes=Object.fromEntries(Object.entries(schema.$defs??{}).map(([k,v])=>[k,hash(JSON.stringify(v))]));if(!equal(manifest.definitionHashes,definitionHashes))fail('definition digest mismatch');
  const refs=(schema.$defs?.Node?.oneOf??[]).map(r=>r.$ref),types=refs.map(ref=>schema.$defs[ref.slice(8)]?.properties?.type?.const);if(!equal([...types].sort(),[...plan.includedComponents].sort()))fail('Node union differs from selected components');
  assertClosedSchema(schema);
  // The runtime manifest is retained verbatim; direct payload digest is also independently recorded.
  let contracts;if(plan.contractSelections){const seen=new Map();for(const selection of plan.contractSelections)for(const contract of await readContractClosure(root,[selection.path],{followLinks:selection.followLinks}))if(!seen.has(contract.path))seen.set(contract.path,contract);contracts=[...seen.values()];}else contracts=await readContractClosure(root,plan.contracts);
  const Ajv2020=createRequire(path.join(root,'package.json'))('ajv/dist/2020.js').default;const validate=new Ajv2020({allErrors:true,strict:true,ownProperties:true,discriminator:true}).compile(schema);
  const examples=[];for(const p of plan.examples){const b=await safeRead(root,p),document=JSON.parse(b);const values=rootKind==='document'?[document]:document.body;if(!Array.isArray(values)||!values.length)fail('example must be a complete nonempty document');for(const value of values)if(!validate(value))fail('adjacent example is outside the selected schema: '+p+' '+JSON.stringify(validate.errors));examples.push({path:p,bytes:b.length,sha256:hash(b),document});}
  if(!contracts.length||!examples.length)fail('selection lacks adjacent semantic contract or complete example');
  return {format:'inform-ui-progressive-task/1',schemaVersion:index.schemaVersion,runtime:{sourceCommit:revision,publicCommit:null},rootKind,validation:'The selected schema is structural. Validate the complete document with the same runtime and test task-specific outcomes.',selection:plan,schema,contracts,examples,identity:{indexSha256:hash(indexBytes),schemaSha256:hash(schemaBytes),schemaBytes:schemaBytes.length},sourceManifest:manifest};
 }finally{await rm(temporary,{recursive:true,force:true});}
}
/** Keep audit hashes/source-file inventory out of the model-facing task body. */
export function separateTaskEvidence(result,manifestPath){
 relative(manifestPath);const task=copy(result),manifest=task.sourceManifest;delete task.sourceManifest;
 task.selection.migrationCoverage={migratedNodeCount:task.selection.migrationCoverage.migratedNodeCount,totalNodeCount:task.selection.migrationCoverage.totalNodeCount};task.manifestPath=manifestPath;
 return {task,manifest};
}
export function parseProgressiveOptions(args,allowed){
 const result={};for(let i=0;i<args.length;i++){const key=args[i];if(!allowed.includes(key)||Object.hasOwn(result,key)||!args[i+1]||args[i+1].startsWith('--'))fail('invalid or duplicate option: '+key);result[key]=args[++i];}return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const options=parseProgressiveOptions(process.argv.slice(2),['--library','--revision','--components','--root','--output']);for(const key of ['--library','--revision','--components','--output'])if(!options[key])fail('missing '+key);const result=await createProgressiveTask({library:options['--library'],revision:options['--revision'],components:options['--components'].split(','),rootKind:options['--root']??'document'});const out=options['--output'];await mkdir(path.dirname(path.resolve(out)),{recursive:true});const {task,manifest}=separateTaskEvidence(result,path.basename(out)+'.manifest.json');await writeFile(out,JSON.stringify(task,null,2)+'\n');await writeFile(out+'.manifest.json',JSON.stringify(manifest,null,2)+'\n');}
