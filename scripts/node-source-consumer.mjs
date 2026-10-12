/** Optional, explicit node-root projection of a source-module selection. No full-schema slicing. */
import {readFile,writeFile,mkdir,realpath,lstat,rename,unlink} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createProgressiveTask,assertClosedSchema,safeRead,parseProgressiveOptions} from './progressive-source-consumer.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const encode=x=>JSON.stringify(x,null,2)+'\n';
const clone=x=>JSON.parse(JSON.stringify(x));
function fail(message){throw Error('Explicit node selection: '+message+'. Use the existing module selection when an exact node/example set is unavailable.');}
function references(value,out=[]){if(value&&typeof value==='object')for(const[k,v]of Object.entries(value)){if(k==='$ref'||k==='$dynamicRef'){if(typeof v!=='string'||!/^#\/\$defs\/[^/]+$/.test(v))fail('unsupported local definition reference');out.push(decodeURIComponent(v.slice(8)).replaceAll('~1','/').replaceAll('~0','~'));}else references(v,out);}return out;}
/** Preserve every non-Node definition exactly; require explicit typed as well as generic child types. */
export function projectNodeSchema(source,components){
 if(!Array.isArray(components)||!components.length||components.some(x=>typeof x!=='string'||!x)||new Set(components).size!==components.length)fail('select unique component types');
 if(source?.$schema!=='https://json-schema.org/draft/2020-12/schema'||(source.$ref!=='#/$defs/Node'&&source.properties?.version?.const!=='iui/1'))fail('unsupported source schema version or root');
 assertClosedSchema(source);const schema=clone(source),defs=schema.$defs;if(!defs?.Node?.oneOf)fail('source has no Node union');
 const selected=new Set(components),available=new Map();
 for(const ref of defs.Node.oneOf){const names=references(ref);if(names.length!==1)fail('unsupported Node union member');const name=names[0],type=defs[name]?.properties?.type?.const;if(typeof type!=='string'||available.has(type))fail('invalid source component identity');available.set(type,name);}
 for(const type of selected)if(!available.has(type))fail('unknown or unavailable component '+type);
 defs.Node.oneOf=defs.Node.oneOf.filter(r=>selected.has(defs[references(r)[0]].properties.type.const));
 delete schema.$defs;const needed=new Set(),queue=references(schema);
 while(queue.length){const name=queue.pop();if(needed.has(name))continue;if(!Object.hasOwn(defs,name))fail('unresolved definition '+name);const type=defs[name]?.properties?.type?.const;if(typeof type==='string'&&available.has(type)&&!selected.has(type))fail('typed child dependency must be explicit: '+type);needed.add(name);queue.push(...references(defs[name]));}
 schema.$defs=Object.fromEntries(Object.entries(defs).filter(([name])=>needed.has(name)));
 schema.$id='urn:micraow:inform-ui:explicit-node-selection:'+hash(encode({sourceId:source.$id,components:[...selected].sort()}));assertClosedSchema(schema);
 for(const[name,definition]of Object.entries(schema.$defs))if(name!=='Node'&&encode(definition)!==encode(source.$defs[name]))fail('definition changed: '+name);
 return {schema,components:[...selected].sort(),definitionNames:Object.keys(schema.$defs)};
}
export async function readNodeExamples(root,paths){
 if(!Array.isArray(paths)||paths.length<1||paths.length>8||new Set(paths).size!==paths.length)fail('supply one to eight unique local JSON examples');
 const base=await realpath(root),examples=[];
 for(const name of [...paths].sort()){if(typeof name!=='string'||!name.endsWith('.json')||path.posix.isAbsolute(name)||name.includes('\\')||name.split('/').some(x=>!x||x==='.'||x==='..'))fail('example must be a safe local JSON file');let file=base,stat;for(const part of name.split('/')){file=path.join(file,part);stat=await lstat(file);if(stat.isSymbolicLink())fail('symlink not permitted in example path');}if(!stat.isFile())fail('example must be a regular file');if(stat.size>256000)fail('example exceeds 256000 bytes');const bytes=await safeRead(base,name);if(bytes.length>256000)fail('example exceeds 256000 bytes');let document;try{document=JSON.parse(bytes);}catch{fail('invalid JSON example '+name);}
  if(document?.version!=='iui/1'||!Array.isArray(document.body)||!document.body.length)fail('example must be a complete nonempty iui/1 document: '+name);
  examples.push({path:name,bytes:bytes.length,sha256:hash(bytes),document});
 }return examples;
}
export async function createNodeProgressiveTask({library,revision,components,rootKind='document',exampleRoot,examplePaths}){
 // Fail before source generation when example selection is absent or unsafe.
 const examples=await readNodeExamples(exampleRoot??process.cwd(),examplePaths);
 if(!['document','node'].includes(rootKind))fail('unsupported root kind');
 // Every example is a complete document even when only a node-root schema is emitted.
 const sourceTask=await createProgressiveTask({library,revision,components,rootKind:'document'});
 const documentProjection=projectNodeSchema(sourceTask.schema,components),documentSchema=documentProjection.schema;
 const projected=rootKind==='document'?documentProjection:projectNodeSchema({$schema:sourceTask.schema.$schema,$id:sourceTask.schema.$id+':node',$ref:'#/$defs/Node',$defs:sourceTask.schema.$defs},components),schema=projected.schema;
 const Ajv=createRequire(path.join(await realpath(library),'package.json'))('ajv/dist/2020.js').default;
 const options={strict:true,allErrors:true,ownProperties:true,discriminator:true};
 const nodeValidators=new Map(projected.components.map(type=>{const name=Object.keys(documentSchema.$defs).find(k=>documentSchema.$defs[k]?.properties?.type?.const===type);return [type,new Ajv(options).compile({$schema:documentSchema.$schema,$ref:'#/$defs/'+name,$defs:documentSchema.$defs})];}));
 const covered=new Set(),coverageSchema=clone(documentSchema);
 // Instrument validation-only copies at protocol node definitions. Opaque payload objects
 // are never visited through a Node definition and cannot masquerade as coverage.
 for(const definition of Object.values(coverageSchema.$defs)){const type=definition?.properties?.type?.const;if(nodeValidators.has(type))definition.iuiNodeCoverage=type;}
 const compiler=new Ajv(options);compiler.addKeyword({keyword:'iuiNodeCoverage',schemaType:'string',errors:false,validate:(type,data)=>{if(nodeValidators.get(type)(data))covered.add(type);return true;}});
 const validateDocument=compiler.compile(coverageSchema),validateNode=rootKind==='node'?new Ajv(options).compile(schema):null;
 for(const example of examples){if(!validateDocument(example.document))fail('example outside explicit node schema: '+example.path+' '+JSON.stringify(validateDocument.errors));if(validateNode)for(const value of example.document.body)if(!validateNode(value))fail('node-root example mismatch: '+example.path);}
 const missing=projected.components.filter(t=>!covered.has(t));if(missing.length)fail('matching examples do not cover component types: '+missing.join(', '));
 const bytes=encode(schema),manifest={format:'inform-ui-explicit-node-selection/1',schemaVersion:'iui/1',mode:'explicit-nodes',rootKind,sourceIdentity:clone(sourceTask.selection.sourceIdentity),requestedComponents:projected.components,resolvedSourceModules:sourceTask.selection.resolvedModules,sourceSelection:sourceTask.sourceManifest,definitionHashes:Object.fromEntries(Object.entries(schema.$defs).map(([k,v])=>[k,hash(JSON.stringify(v))])),schemaBytes:Buffer.byteLength(bytes),schemaSha256:hash(bytes),examples:examples.map(({document,...identity})=>identity),excludedModuleExamples:sourceTask.examples.map(e=>e.path),semantics:'All required contracts from the complete source-module selection are retained. Only the explicit Node union and schema identity change.'};
 return {format:'inform-ui-progressive-node-task/1',schemaVersion:'iui/1',runtime:sourceTask.runtime,rootKind,validation:sourceTask.validation,instructions:['This is an opt-in structural subset. Every generic or typed child component must be explicitly selected.','Author only with the listed types, read every retained semantic contract and run same-version validateDocument before rendering.','The adjacent examples cover the selected types; they do not prove all runtime outcomes. No automatic module fallback is performed.'],selection:{mode:'explicit-nodes',requestedComponents:projected.components,includedComponents:projected.components,resolvedSourceModules:sourceTask.selection.resolvedModules,contractSelections:sourceTask.selection.contractSelections??sourceTask.selection.contracts.map(p=>({path:p,followLinks:true})),sourceIdentity:sourceTask.selection.sourceIdentity},schema,contracts:sourceTask.contracts,examples,identity:{schemaBytes:Buffer.byteLength(bytes),schemaSha256:hash(bytes)},projectionManifest:manifest};
}
export function separateNodeEvidence(result,manifestPath){if(typeof manifestPath!=='string'||!manifestPath||path.posix.basename(manifestPath)!==manifestPath||manifestPath==='.'||manifestPath==='..'||manifestPath.includes('\\'))fail('manifest must be an adjacent file name');const task=clone(result),manifest=task.projectionManifest;delete task.projectionManifest;task.manifestPath=manifestPath;return {task,manifest};}
/** Stage both files, preflight targets, and restore old outputs on handled I/O failure.
 * This is a process-level transaction, not a crash-atomic multi-file filesystem commit. */
export async function writeNodeTaskFiles(output,task,manifest,{fsOps={mkdir,lstat,writeFile,rename,unlink}}={}){
 const absolute=path.resolve(output),targets=[absolute,absolute+'.manifest.json'],nonce=randomUUID();
 const entries=targets.map((target,i)=>({target,stage:target+'.stage-'+nonce,backup:target+'.backup-'+nonce,body:encode(i?manifest:task),existed:false,moved:false,replaced:false}));
 await fsOps.mkdir(path.dirname(absolute),{recursive:true});
 for(const entry of entries){try{const st=await fsOps.lstat(entry.target);if(!st.isFile()||st.isSymbolicLink())fail('output target must be a regular file: '+path.basename(entry.target));entry.existed=true;}catch(error){if(error.code!=='ENOENT')throw error;}}
 let committed=false;
 try{
  for(const entry of entries)await fsOps.writeFile(entry.stage,entry.body,{flag:'wx',mode:0o600});
  for(const entry of entries)if(entry.existed){await fsOps.rename(entry.target,entry.backup);entry.moved=true;}
  for(const entry of entries){await fsOps.rename(entry.stage,entry.target);entry.replaced=true;}
  committed=true;
 }catch(error){
  const rollback=[];for(const entry of [...entries].reverse()){try{if(entry.replaced)await fsOps.unlink(entry.target);if(entry.moved)await fsOps.rename(entry.backup,entry.target);}catch(e){rollback.push(e);}}
  if(rollback.length)throw new AggregateError([error,...rollback],'Output rollback failed; preserved backup files require recovery.');throw error;
 }finally{
  for(const entry of entries){try{await fsOps.unlink(entry.stage);}catch{}if(committed&&entry.moved){try{await fsOps.unlink(entry.backup);}catch{ /* Outputs are committed; a retained backup is not a failed transaction. */ }}}
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const options=parseProgressiveOptions(process.argv.slice(2),['--library','--revision','--components','--root','--examples','--example-root','--output']);for(const flag of ['--library','--revision','--components','--examples','--output'])if(!options[flag])fail('missing '+flag);const result=await createNodeProgressiveTask({library:options['--library'],revision:options['--revision'],components:options['--components'].split(','),rootKind:options['--root']??'document',exampleRoot:options['--example-root']??process.cwd(),examplePaths:options['--examples'].split(',')});const out=options['--output'];const {task,manifest}=separateNodeEvidence(result,path.basename(out)+'.manifest.json');await writeNodeTaskFiles(out,task,manifest);console.log(JSON.stringify({components:task.selection.includedComponents,definitions:Object.keys(task.schema.$defs).length,schemaBytes:task.identity.schemaBytes,taskBytes:Buffer.byteLength(encode(task)),examples:task.examples.length}));}
