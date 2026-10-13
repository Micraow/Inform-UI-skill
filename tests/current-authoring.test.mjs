import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {assertClosedSchema,inspectSourceIndex,planComponentSelection} from '../scripts/progressive-source-consumer.mjs';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root));
const json=async p=>JSON.parse(await read(p));
const digest=b=>createHash('sha256').update(b).digest('hex');
const current='authoring/current219/';

test('current entry selects versioned 219 while the historical 218 source remains explicit',async()=>{
 const versions=await json('authoring/catalog-versions.json'),entry=(await read('SKILL.md')).toString(),index=await json(current+'index.json');
 assert.equal(versions.current,'current219');assert.equal(index.catalogVersion,versions.current);
 const selected=versions.catalogs.find(c=>c.id===versions.current),old=versions.catalogs.find(c=>c.id==='progressive218');
 assert.equal(selected.index,current+'index.json');assert.equal(selected.protocolNodes,219);assert.equal(selected.sourceCommit,index.source.sourceCommit);
 assert.equal(old.index,'authoring/progressive/index.json');assert.equal(old.protocolNodes,218);assert.equal(old.sourceCommit,'50054d2e436e8a0e215043ad3839f78623ecf4f8');assert.equal(old.status,'historical');
 for(const token of [selected.index,current+'README.md','SKILL.cd1c545.md','rating-summary','rating','toggle','219是协议覆盖数'])assert.ok(entry.includes(token),token);
 assert.ok(Buffer.byteLength(entry)<5000);
 assert.match(entry,/不能当全部组件视觉验收/);
});

test('every current artifact has exact bytes, source identity and a complete reachable contract',async()=>{
 const generation=await json(current+'generation.json'),index=await json(current+'index.json'),source=await json(current+'source-index.json');
 inspectSourceIndex(source);assert.equal(source.modules.length,91);assert.equal(source.components.length,219);assert.deepEqual(source.migrationCoverage.legacyNodeTypes,[]);
 assert.deepEqual(index.migrationCoverage,{migratedNodeCount:219,totalNodeCount:219,legacyIndexPath:'legacy-components.json'});
 assert.deepEqual(generation.source,index.source);assert.equal(index.source.sourceCommit,index.source.publicCommit);assert.match(index.source.publicCommit,/^[a-f0-9]{40}$/);
 for(const artifact of generation.artifacts){const bytes=await read(current+artifact.path);assert.equal(bytes.length,artifact.bytes,artifact.path);assert.equal(digest(bytes),artifact.sha256,artifact.path);}
 const full=await json(current+index.fullSchemaPath);assertClosedSchema(full);assert.equal(full.$defs.Node.oneOf.length,219);
 const seen=new Set();
 for(const category of index.categories){const categoryDoc=await json(current+category.path);assert.deepEqual(categoryDoc.source,index.source);
  for(const module of categoryDoc.modules){if(!module.taskPath){assert.equal(module.components.length,0);continue;}
   const taskPath=path.posix.normalize(path.posix.join(path.posix.dirname(category.path),module.taskPath));
   const task=await json(current+taskPath),manifest=await json(current+path.posix.join(path.posix.dirname(taskPath),task.manifestPath));
   assertClosedSchema(task.schema);assert.equal(task.runtime.sourceCommit,index.source.sourceCommit);assert.equal(task.runtime.publicCommit,index.source.publicCommit);assert.ok(task.contracts.length&&task.examples.length);assert.equal(task.identity.schemaSha256,manifest.sha256);
   for(const component of module.components){assert.equal(seen.has(component.type),false,component.type);seen.add(component.type);assert.deepEqual(task.schema.$defs[component.definition],full.$defs[component.definition]);}
  }
 }
 assert.equal(seen.size,219);assert.ok(seen.has('rating-summary'));
});

test('new display is an additive isolated schema; the old 218 node contracts stay identical',async()=>{
 const old=await json('authoring/progressive/webchat/iui.schema.json'),full=await json(current+'webchat/iui.schema.json');
 const prior=old.$defs.Node.oneOf.map(r=>r.$ref),added=full.$defs.Node.oneOf.map(r=>r.$ref);
 assert.deepEqual(added.filter(ref=>!prior.includes(ref)),['#/$defs/RatingSummaryNode']);assert.deepEqual(added.filter(ref=>prior.includes(ref)),prior);
 for(const [name,definition]of Object.entries(old.$defs))if(name!=='Node')assert.deepEqual(full.$defs[name],definition,name);
 const index=await json(current+'source-index.json'),plan=planComponentSelection(index,['rating-summary']);
 assert.deepEqual(plan.resolvedModules,['content/rating-summary','shared/value']);assert.deepEqual(plan.includedComponents,['rating-summary']);
 const task=await json(current+'modules/content/rating-summary.json'),node=task.schema.$defs.RatingSummaryNode;
 assert.equal(task.schema.$defs.RatingNode,undefined);assert.equal(node.additionalProperties,false);assert.deepEqual(node.required,['type','ratingLabel']);
 for(const key of ['ratingLabel','reviewCountLabel'])assert.deepEqual(node.properties[key],{type:'string',minLength:1,maxLength:200});
 const provider=node.properties.provider;assert.equal(provider.additionalProperties,false);assert.deepEqual(provider.required,['label','url']);assert.deepEqual(provider.properties.url,{type:'string',minLength:1,maxLength:2048});
 for(const key of ['bind','value','logo','onClick','children'])assert.equal(node.properties[key],undefined,key);
 const semantics=task.contracts.map(c=>c.text).join('\n');for(const text of ['absolute HTTP(S)','validateDocument','unknown','same-tab','literal','provider','project-local'])assert.ok(semantics.includes(text),text);
 assert.ok(task.examples.some(e=>e.document.body.some(n=>n.type==='rating-summary'&&!Object.hasOwn(n,'reviewCountLabel'))));
});

test('new public receipt binds source modules, full schema, contracts and examples to the same commit',async()=>{
 const receipt=await json(current+'source-public.json'),index=await json(current+'source-index.json'),catalog=await json(current+'index.json');
 assert.equal(receipt.format,'inform-ui-progressive-public-source/1');assert.equal(receipt.sourceCommit,receipt.publicCommit);assert.equal(receipt.publicCommit,catalog.source.publicCommit);
 assert.equal(receipt.url,'https://github.com/Micraow/Inform-UI/commit/'+receipt.publicCommit);
 const verified=new Map(receipt.verifiedFiles.map(f=>[f.path,f]));assert.equal(verified.size,receipt.verifiedFiles.length);
 for(const [name,hash]of Object.entries(index.sourceFiles)){assert.equal(verified.get(name)?.sha256,hash,name);}
 for(const module of index.modules)for(const name of [module.sourcePath,module.contractPath,...module.semanticContractPaths,...module.examplePaths])assert.ok(verified.has(name.split('#')[0]),name);
 assert.ok(verified.has('docs/control-alignment.md'));assert.ok(verified.has('src/schema/iui.schema.json'));
 for(const entry of verified.values()){assert.match(entry.gitBlob,/^[a-f0-9]{40}$/);assert.match(entry.sha256,/^[a-f0-9]{64}$/);assert.ok(entry.bytes>0);}
 assert.equal(receipt.cdnPublicationClaimed,false);
});

test('migration preserves all old catalog and evidence bytes, not merely the old node count',async()=>{
 const migration=await json(current+'entry-migration.json');
 assert.equal(migration.previousSkillCommit,'cd1c5458c68a5261c808fa297c0bc1d8d916b8eb');
 assert.equal(migration.preservedEntry.path,'SKILL.cd1c545.md');assert.equal(migration.preservedEntry.sha256,'152b7feea7c6b177f413bb7ffebd2ac5ed259c043c214abd1b0ce53c4cf7ccfb');
 for(const entry of [migration.preservedEntry,...migration.preservedFiles]){const bytes=await read(entry.path);assert.equal(bytes.length,entry.bytes,entry.path);assert.equal(digest(bytes),entry.sha256,entry.path);}
 for(const file of ['authoring/progressive/index.json','authoring/progressive/README.md','authoring/progressive/generation.json','authoring/progressive/source-public.json','authoring/progressive/webchat/iui.schema.json','authoring/audit.json','authoring/design-workflows/results.json','library-contract.json'])assert.ok(migration.preservedFiles.some(f=>f.path===file),file);
 const currentBytes=await read('SKILL.md');assert.equal(currentBytes.length,migration.currentEntry.bytes);assert.equal(digest(currentBytes),migration.currentEntry.sha256);
});

test('current guide distinguishes reviewed presentation scope, same-version runtime and plain source attribution',async()=>{
 const guide=(await read(current+'README.md')).toString(),example=await json(current+'examples/rating-summary.json');
 for(const text of ['not 219 completed','project-local','no established canonical source mapping','absolute HTTP(S)','structural schema success alone','1–200 Unicode code points','same-tab','rating-summary','rating','toggle']){
  assert.ok(guide.includes(text),text);
 }
 assert.equal(guide.includes('UI_REVISION_PENDING'),false);assert.ok(guide.includes((await json(current+'index.json')).source.publicCommit));
 assert.equal(example.state,undefined);assert.equal(example.body.length,4);assert.ok(example.body.every(n=>n.type==='rating-summary'&&typeof n.ratingLabel==='string'));
 assert.ok(example.body.some(n=>!Object.hasOwn(n,'reviewCountLabel')));assert.ok(example.body.some(n=>n.reviewCountLabel==='评价数量未知'));
 assert.ok(example.body.some(n=>n.ratingLabel.includes('<b>')));
});

test('current verification records actual discovery and CLI checks without claiming browser or model outcomes',async()=>{
 const result=await json(current+'cli-result.json'),consumer=await json(current+'consumer-result.json'),index=await json(current+'index.json');
 assert.equal(result.sourceCommit,index.source.sourceCommit);assert.equal(result.protocolNodes,219);assert.equal(result.failed,0);assert.equal(result.passed,result.checks.length);assert.equal(result.passed,6);assert.equal(result.rejectedDocuments,9);
 assert.equal(consumer.sourceCommit,index.source.sourceCommit);assert.equal(consumer.failed,0);assert.equal(consumer.passed,8);assert.equal(consumer.deterministicArtifacts,(await json(current+'generation.json')).artifacts.length);
 for(const key of ['browserExecuted','humanScreenReaderAudit','allComponentVisualAcceptance','modelGenerationEvaluated'])assert.equal(result.limits[key],false);
 const workflow=(await read('.github/workflows/current-authoring.yml')).toString();assert.ok(workflow.includes('scripts/verify-current-authoring.mjs'));assert.ok(workflow.includes('--catalog-version current219'));assert.ok(workflow.includes('steps.catalog.outputs.revision'));
});
