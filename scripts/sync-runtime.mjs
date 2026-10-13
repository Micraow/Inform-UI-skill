#!/usr/bin/env node
import {readFile,copyFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {skillRoot,parseArgs,loadRuntime,json,save,saveJSON} from './lib.mjs';

// Explicit input paths; no network lookup, mutable CDN alias, install, or publication.
const {opts}=parseArgs(process.argv.slice(2));
if(!opts['runtime-dir']||!opts.icons)throw Error('Usage: sync-runtime.mjs --runtime-dir verified/dist/v2 --icons verified/src/icons/catalog.json [--chart-coverage verified/upstream-prop-coverage.json] [--expect-components count] [--source-ref commit]');
const sourceDir=resolve(opts['runtime-dir']),targetDir=join(skillRoot,'assets/runtime');
const snapshotDir=await mkdtemp(join(tmpdir(),'inform-skill-sync-'));
try {
for(const name of ['inform-ui.global.js','node.mjs','THIRD_PARTY_NOTICES.txt'])await copyFile(join(sourceDir,name),join(snapshotDir,name));
const api=await loadRuntime(snapshotDir);
let profile=api.createProfile();
const manifest=profile.manifest(),moduleIds=[...profile.modules];
const count=manifest.components.length;
const chartCoverage=opts['chart-coverage']?await json(resolve(opts['chart-coverage'])):null;
let charts=null;
if(chartCoverage){
 const names=manifest.components.filter(c=>c.layer==='chart').map(c=>c.name).sort();
 if(JSON.stringify(names)!==JSON.stringify(chartCoverage.map(c=>c.name).sort()))throw Error('Chart coverage does not match this runtime');
 const families=[...new Set(chartCoverage.map(c=>c.family))].sort().map(family=>({family,names:chartCoverage.filter(c=>c.family===family).map(c=>c.name)}));
 charts={constructorCount:names.length,familyCount:families.length,families};
 await saveJSON(join(skillRoot,'generated/chart-coverage.json'),chartCoverage);
}
if(opts['expect-components']&&count!==Number(opts['expect-components']))throw Error(`Expected ${opts['expect-components']} components; actual ${count}`);
const prompt=profile.prompt({bindings:true,builtinFunctions:true});
// This guard protects the compact Skill from accidental full-glyph prompt expansion.
const iconLine=prompt.split('\n').find(line=>line.startsWith('Icon('));
if(iconLine&&iconLine.length>2500)throw Error('Generated Icon signature expands the whole glyph catalog; fix profile.prompt at source before sync');
if(/available steps \([^)]*@(?:OpenUrl|ToAssistant|Run)/.test(prompt))throw Error('Generated prompt recommends actions the local runtime does not provide');
await saveJSON(join(skillRoot,'generated/manifest.json'),manifest);
await saveJSON(join(skillRoot,'generated/schema.json'),profile.schema);
await save(join(skillRoot,'generated/full-profile.txt'),prompt+'\n');
// Keep only serializable metadata before compiling many selected profiles.
profile=null;
const sections=[...prompt.matchAll(/^### ([a-z][a-z0-9/-]*)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)];
const componentModule=new Map();
for(const [,id,body]of sections)for(const [,name]of body.matchAll(/^([A-Z][A-Za-z0-9_]*)\(/gm))componentModule.set(name,id);
const modules=[];
for(const id of moduleIds){
 const requested=[...new Set(['base/layout',id])];
 const components=manifest.components.filter(c=>(c.moduleId??componentModule.get(c.name))===id);
 const viewNames=id.startsWith('views/')?components.map(c=>c.name):[];
 const selected=api.createProfile({select:requested,viewNames});
 const file=id.replaceAll('/','--');
 await save(join(skillRoot,'generated/modules',file+'.txt'),selected.prompt({bindings:true,builtinFunctions:true})+'\n');
 const signatures=components.map(c=>({name:c.name,orderedProps:c.orderedProps,slots:c.slots,bindingProps:c.bindingProps,actionProps:c.actionProps,limitations:c.limitations}));
 modules.push({id,kind:id.startsWith('views/')?'composed-view':id.startsWith('domain/')?'domain-view':id==='base/charts'?'chart':id==='base/chart-data'?'data':'foundation',components:signatures,selectedClosure:selected.modules,prompt:'generated/modules/'+file+'.txt'});
}
const unclassified=manifest.components.filter(c=>!(c.moduleId??componentModule.get(c.name)));
if(unclassified.length)throw Error('Manifest/prompt is missing module IDs for '+unclassified.map(c=>c.name).join(','));
const byName=new Map(manifest.components.map(c=>[c.name,c]));
function viewClosure(names){
 const found=new Set();
 const visit=name=>{
  if(found.has(name))return;
  const component=byName.get(name);
  if(!component)throw Error('Unknown View dependency '+name);
  if(!(component.moduleId??componentModule.get(name)).startsWith('views/'))return;
  found.add(name);
  for(const slot of Object.values(component.slots))if(Array.isArray(slot.accepts))slot.accepts.forEach(visit);
 };
 names.forEach(visit);return [...found].sort();
}
for(const component of manifest.components.filter(c=>(c.moduleId??componentModule.get(c.name)).startsWith('views/'))){
 const moduleId=component.moduleId??componentModule.get(component.name);
 const viewNames=viewClosure([component.name]);
 const select=[...new Set(['base/layout',...viewNames.map(name=>byName.get(name).moduleId??componentModule.get(name))])];
 const selected=api.createProfile({select,viewNames});
 const actualViews=selected.manifest().components.filter(c=>c.moduleId?.startsWith('views/'));
 if(JSON.stringify(actualViews.map(c=>c.name).sort())!==JSON.stringify(viewNames))throw Error('viewNames dependency closure disagrees for '+component.name);
 await save(join(skillRoot,'generated/views',component.name+'.txt'),selected.prompt({bindings:true,builtinFunctions:true})+'\n');
 const catalogComponent=modules.find(module=>module.id===moduleId).components.find(item=>item.name===component.name);
 catalogComponent.prompt='generated/views/'+component.name+'.txt';
 catalogComponent.select=select;catalogComponent.viewNames=viewNames;
}
await saveJSON(join(skillRoot,'generated/catalog.json'),{format:'inform-skill-catalog/2',componentCount:count,root:manifest.root,modules,charts,dataConstructors:manifest.dataShapes,externalServices:manifest.externalServices});
const icons=await json(resolve(opts.icons));
if(icons.iconCount!==icons.icons.length)throw Error('Icon catalog count mismatch');
await saveJSON(join(skillRoot,'generated/icons.json'),icons);
const signatures=Object.fromEntries(manifest.components.map(c=>[c.name,{moduleId:c.moduleId??componentModule.get(c.name),orderedProps:c.orderedProps,slots:c.slots,bindingProps:c.bindingProps,actionProps:c.actionProps}]));
await saveJSON(join(skillRoot,'generated/signatures.json'),signatures);
const hashes={};
for(const name of ['inform-ui.global.js','node.mjs','THIRD_PARTY_NOTICES.txt']){
 const bytes=await readFile(join(snapshotDir,name));hashes[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 await copyFile(join(snapshotDir,name),join(targetDir,name));
}
await saveJSON(join(skillRoot,'generated/runtime-lock.json'),{format:'inform-runtime-lock/2',version:api.version,sourceRef:opts['source-ref']??null,publication:'No public URL is implied by this local snapshot.',root:manifest.root,componentCount:count,dataConstructorCount:manifest.dataShapes.length,iconCount:icons.iconCount,bundles:hashes});
const groups=modules.filter(m=>m.components.length).map(m=>`- ${m.id}: ${m.components.length} ${m.kind} components; ${m.components.map(c=>c.name).join(', ')}. Prompt: ${m.prompt}${m.kind==='composed-view'?'; exact-name prompts: generated/views/<ViewName>.txt':''}`).join('\n');
const chartText=charts?`## Chart source families\n\n${charts.familyCount} source families provide ${charts.constructorCount} DSL names. Names sharing a family are variants or aliases, not additional source engines.\n\n${charts.families.map(f=>`- ${f.family}: ${f.names.join(', ')}`).join('\n')}\n\n`:'';
await save(join(skillRoot,'references/catalog.md'),`# Generated component directory\n\nGenerated from the actual createProfile() manifest and prompt. Do not hand-edit.\n\n${count} renderable component names; ${manifest.dataShapes.length} data constructors. Data constructors are not UI children. Component count alone does not establish browser, accessibility, or host-service coverage.\n\n${groups}\n\n${chartText}## Data constructors\n\n${manifest.dataShapes.map(d=>`- ${d.name}(${d.orderedProps.join(', ')}): ${d.description}`).join('\n')}\n\n## Glyph discovery\n\n${icons.iconCount} official glyphs are separately indexed in generated/icons.json. Use the icons CLI command; do not load the whole catalog into a prompt.\n`);
const contractFiles=['generated/manifest.json','generated/schema.json','generated/full-profile.txt','generated/catalog.json','generated/signatures.json',...modules.map(m=>m.prompt),...(await readdir(join(skillRoot,'generated/views'))).filter(name=>name.endsWith('.txt')).map(name=>'generated/views/'+name)];
const contractHashes={};
for(const path of contractFiles){const bytes=await readFile(join(skillRoot,path));contractHashes[path]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
await saveJSON(join(skillRoot,'generated/snapshot-status.json'),{format:'inform-generated-snapshot-status/2',status:'current-bundled-runtime',sourceRef:opts['source-ref']??null,nodeRuntimeSha256:hashes['node.mjs'].sha256,componentCount:count,viewPromptCount:manifest.components.filter(c=>c.moduleId?.startsWith('views/')).length,generator:'scripts/sync-runtime.mjs',contracts:contractHashes,limitations:'Projection preserves schema constraints and annotated runtime rules; incomplete domain semantic descriptions are explicitly marked. Native UTF-16 string-length behavior is not equivalent to Unicode code-point counting in standard JSON Schema.'});
console.log(JSON.stringify({ok:true,componentCount:count,modules:modules.length,iconCount:icons.iconCount}));
} finally {await rm(snapshotDir,{recursive:true,force:true});}
