/** Deterministic Skill artifacts from the runtime's authoritative source-module CLI. */
import {readFile,writeFile,mkdir,mkdtemp,rm,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {inspectSourceIndex,createProgressiveTask,assertClosedSchema,safeRead,readContractClosure,parseProgressiveOptions,separateTaskEvidence} from './progressive-source-consumer.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const encode=x=>JSON.stringify(x,null,2)+'\n';
function assert(ok,message){if(!ok)throw Error('Progressive catalog: '+message);}
export async function generateProgressiveCatalog({library,revision,output,publication}){
 const root=await realpath(library),destination=path.resolve(output),temporary=await mkdtemp(path.join(tmpdir(),'iui-catalog-'));
 assert(/^[a-f0-9]{40}$/.test(revision),'full frozen commit required');
 assert(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===revision,'source commit mismatch');
 assert(!execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'}).trim(),'source checkout must be clean');
 const cli=path.join(root,'scripts/build-schema-selection.mjs'),files=new Map();
 const run=(...args)=>execFileSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8'});
 try{
  run('--index','--output',path.join(temporary,'index.json'));
  const index=JSON.parse(await readFile(path.join(temporary,'index.json'),'utf8'));inspectSourceIndex(index);
  run('--full','--output',path.join(temporary,'full.json'));
  const fullBytes=await readFile(path.join(temporary,'full.json')),full=JSON.parse(fullBytes),fullManifest=JSON.parse(await readFile(path.join(temporary,'full.json.manifest.json'),'utf8'));
  assertClosedSchema(full);assert(fullManifest.mode==='full'&&fullManifest.format==='inform-ui-source-selection/1','full manifest format');
  assert(fullManifest.sha256===hash(fullBytes)&&fullManifest.utf8Bytes===fullBytes.length,'full payload identity');
  assert(JSON.stringify(fullManifest.sourceIdentity)===JSON.stringify(index.sourceIdentity),'full/index source identity');
  assert(hash(JSON.stringify(index.sourceFiles))===index.sourceIdentity.value,'source-set digest mismatch');
  assert(JSON.stringify(fullManifest.definitionHashes)===JSON.stringify(Object.fromEntries(Object.entries(full.$defs).map(([k,v])=>[k,hash(JSON.stringify(v))]))),'full definition digests');
  const canonical=await safeRead(root,'src/schema/iui.schema.json');assert(fullBytes.equals(canonical),'merged full schema differs from canonical WebChat schema');
  for(const [name,digest]of Object.entries(index.sourceFiles)){const b=await safeRead(root,name);assert(hash(b)===digest,'source file changed: '+name);}
  let publicCommit=null;
  if(publication){const receipt=JSON.parse(await readFile(publication,'utf8'));assert(receipt.format==='inform-ui-progressive-public-source/1'&&receipt.sourceCommit===revision&&/^[a-f0-9]{40}$/.test(receipt.publicCommit),'publication receipt source mismatch');assert(Array.isArray(receipt.verifiedFiles)&&receipt.verifiedFiles.length,'publication receipt has no file identity');for(const entry of receipt.verifiedFiles){const b=await safeRead(root,entry.path);assert(b.length===entry.bytes&&hash(b)===entry.sha256,'publication source bytes mismatch: '+entry.path);}const verified=new Set(receipt.verifiedFiles.map(f=>f.path));for(const name of [...Object.keys(index.sourceFiles),'src/schema/iui.schema.json'])assert(verified.has(name),'publication receipt omits authoritative source: '+name);publicCommit=receipt.publicCommit;}
  const source={sourceCommit:revision,publicCommit,sourceIdentity:index.sourceIdentity};
  const Ajv2020=createRequire(path.join(root,'package.json'))('ajv/dist/2020.js').default,validateFull=new Ajv2020({strict:true,allErrors:true,ownProperties:true,discriminator:true}).compile(full);
  const byCategory=new Map(),measurements=[];
  for(const module of index.modules){
   const members=index.components.filter(c=>c.moduleId===module.id),taskPath='modules/'+module.id+'.json';let task=null;
   if(members.length){
    task=await createProgressiveTask({library:root,revision,components:[members[0].type]});task.runtime.publicCommit=publicCommit;
    const envelope=x=>Object.fromEntries(Object.entries(x).filter(([k])=>!['$id','$defs'].includes(k)));assert(JSON.stringify(envelope(task.schema))===JSON.stringify(envelope(full)),'selected/full Document envelope drift');
    for(const example of task.examples)assert(validateFull(example.document),'example rejected by full structural schema: '+example.path);
    for(const [name,definition]of Object.entries(task.schema.$defs)){if(name==='Node')continue;assert(JSON.stringify(definition)===JSON.stringify(full.$defs[name]),'selected/full definition drift: '+module.id+' -> '+name);}
    const separated=separateTaskEvidence(task,path.posix.basename(taskPath)+'.manifest.json');files.set(taskPath,encode(separated.task));files.set(taskPath+'.manifest.json',encode(separated.manifest));measurements.push({moduleId:module.id,components:task.selection.includedComponents.length,schemaBytes:task.identity.schemaBytes,taskBytes:Buffer.byteLength(files.get(taskPath)),contractBytes:task.contracts.reduce((n,c)=>n+c.bytes,0),examples:task.examples.length});
   }
   if(!byCategory.has(module.category))byCategory.set(module.category,[]);
   const sharedContracts=task?undefined:await readContractClosure(root,module.semanticContractPaths??[module.contractPath],{followLinks:!Object.hasOwn(module,'semanticContractPaths')});
   byCategory.get(module.category).push({id:module.id,title:module.title,dependsOn:module.dependsOn,...(module.semanticContractPaths?{semanticContractPaths:module.semanticContractPaths}:{}),taskPath:task?'../'+taskPath:null,...(sharedContracts?{contracts:sharedContracts}:{}),components:members.map(c=>({type:c.type,definition:c.definition,schemaPointer:'#/schema/$defs/'+c.definition}))});
  }
  const categories=[...byCategory].map(([category,modules])=>({id:category,path:'categories/'+category+'.json',moduleCount:modules.length,componentCount:modules.reduce((n,m)=>n+m.components.length,0)}));
  for(const [category,modules]of byCategory)files.set('categories/'+category+'.json',encode({format:'inform-ui-progressive-category/1',generated:true,schemaVersion:index.schemaVersion,source,category,modules}));
  files.set('index.json',encode({format:'inform-ui-progressive-catalog/1',generated:true,schemaVersion:index.schemaVersion,source,categories,migrationCoverage:{migratedNodeCount:index.migrationCoverage.migratedNodeCount,totalNodeCount:index.migrationCoverage.totalNodeCount,legacyIndexPath:'legacy-components.json'},fullSchemaPath:'webchat/iui.schema.json',instructions:['Read the category, then its complete module task pack before authoring. Property-name signatures are navigation aids, not complete constraints.','Each task pack includes all nodes in its selected module family and explicit dependencies; this pilot does not select arbitrary individual definitions.','Use the same source revision for schema and runtime. The frozen source is required until a verified public source identity is added; the published214 CDN does not contain this schema-source tooling.','For cross-module documents, use the selection CLI or the generated full schema. Never concatenate $defs manually.','Run same-version validateDocument and task-specific interaction checks; structural schema success alone is insufficient.']}));
  files.set('legacy-components.json',encode({format:'inform-ui-unmigrated-components/1',generated:true,source,componentTypes:index.migrationCoverage.legacyNodeTypes,usage:'These components remain in the merged full source. Select their exact-version full contract; no automatic fallback is performed by the selected-module tool.'}));
  files.set('webchat/iui.schema.json',fullBytes);files.set('webchat/iui.schema.manifest.json',encode(fullManifest));
  files.set('source-index.json',encode(index));
  const artifacts=[...files].map(([file,b])=>({path:file,bytes:Buffer.byteLength(b),sha256:hash(b)}));
  const result={format:'inform-ui-progressive-generation/1',generated:true,source,coverage:index.migrationCoverage,fullSchema:{bytes:fullBytes.length,sha256:hash(fullBytes),canonicalByteEqual:true},measurements,taskPaths:measurements.map(m=>{const category=index.modules.find(module=>module.id===m.moduleId).category,categoryPath='categories/'+category+'.json';return{moduleId:m.moduleId,indexBytes:Buffer.byteLength(files.get('index.json')),categoryBytes:Buffer.byteLength(files.get(categoryPath)),taskBytes:m.taskBytes,routeAndTaskBytes:Buffer.byteLength(files.get('index.json'))+Buffer.byteLength(files.get(categoryPath))+m.taskBytes,note:'Add the current SKILL.md bytes to obtain the complete default-entry loading path.'};}),artifacts,limitations:[`${index.migrationCoverage.migratedNodeCount}-node pilot only; unmigrated source remains explicit.`,'Selected structural schemas need full semantic validation.','No model-quality, runtime, native-browser, or clinical evaluation was performed by this generator.']};
  files.set('generation.json',encode(result));
  // No partial output is written before every schema, contract, example and source check succeeds.
  for(const [file,b]of files){const target=path.join(destination,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,b);}
  return result;
 }finally{await rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const options=parseProgressiveOptions(process.argv.slice(2),['--library','--revision','--output','--publication']);for(const key of ['--library','--revision','--output'])if(!options[key])throw Error('Missing '+key);const result=await generateProgressiveCatalog({library:options['--library'],revision:options['--revision'],output:options['--output'],publication:options['--publication']});console.log(JSON.stringify({source:result.source,fullSchema:result.fullSchema,measurements:result.measurements,artifacts:result.artifacts.length}));}
