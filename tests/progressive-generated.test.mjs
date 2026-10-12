import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertClosedSchema,inspectSourceIndex,planComponentSelection} from '../scripts/progressive-source-consumer.mjs';
const root=fileURLToPath(new URL('../authoring/progressive/',import.meta.url)),read=p=>readFile(path.join(root,p)),json=async p=>JSON.parse(await read(p)),hash=b=>createHash('sha256').update(b).digest('hex');

test('all generated artifacts have exact recorded identities and a single source version',async()=>{
 const g=await json('generation.json'),index=await json('index.json');assert.equal(index.source.sourceCommit,g.source.sourceCommit);assert.deepEqual(index.source.sourceIdentity,g.source.sourceIdentity);
 for(const entry of g.artifacts){const b=await read(entry.path);assert.equal(b.length,entry.bytes,entry.path);assert.equal(hash(b),entry.sha256,entry.path);}
 assert.equal(g.fullSchema.canonicalByteEqual,true);assert.equal(index.migrationCoverage.migratedNodeCount,128);assert.equal(index.migrationCoverage.totalNodeCount,218);
 const legacy=await json(index.migrationCoverage.legacyIndexPath);assert.equal(legacy.componentTypes.length,90);assert.deepEqual(legacy.source,g.source);
});

test('category -> module -> complete schema/semantics/example paths are reachable and signatures remain exact',async()=>{
 const i=await json('index.json'),full=await json(i.fullSchemaPath);let count=0;
 for(const category of i.categories){const c=await json(category.path);assert.equal(c.category,category.id);assert.deepEqual(c.source,i.source);
  for(const m of c.modules){if(!m.taskPath){assert.equal(m.components.length,0);assert.ok(m.contracts.length);continue;}
   const taskPath=path.posix.normalize(path.posix.join(path.posix.dirname(category.path),m.taskPath)),task=await json(taskPath);assertClosedSchema(task.schema);assert.ok(task.contracts.length&&task.examples.length);assert.equal(task.runtime.sourceCommit,i.source.sourceCommit);assert.equal(Object.hasOwn(task,'sourceManifest'),false);const manifest=await json(path.posix.join(path.posix.dirname(taskPath),task.manifestPath));assert.deepEqual(manifest.sourceIdentity,task.selection.sourceIdentity);assert.equal(manifest.sha256,task.identity.schemaSha256);
   assert.equal(task.rootKind,'document');assert.ok(task.schema.properties.body);assert.ok(task.schema.properties.state);
   for(const component of m.components){count++;const d=task.schema.$defs[component.definition];assert.equal(component.schemaPointer,'#/schema/$defs/'+component.definition);assert.deepEqual(d,full.$defs[component.definition]);}
   for(const [name,d]of Object.entries(task.schema.$defs))if(name!=='Node')assert.deepEqual(d,full.$defs[name],m.id+' '+name);
  }
 }
 assert.equal(count,128);
});

test('questionnaire task includes transitive semantic rules and original self-contained example',async()=>{
 const task=await json('modules/forms/questionnaire.json');assert.deepEqual(task.selection.includedComponents,['questionnaire']);assert.deepEqual(task.selection.resolvedModules,['shared/value','forms/questionnaire']);
 assert.ok(task.contracts.some(c=>c.path==='docs/questionnaire-contract.md'));const text=task.contracts.map(c=>c.text).join('\n');for(const phrase of ['unknown','invalid','retain','clear','null','pending','AbortSignal','cancel','snapshot','same revision','Optional unknown'])assert.ok(text.includes(phrase),phrase);
 const q=task.examples[0].document.body[0];assert.equal(q.type,'questionnaire');assert.ok(q.version);assert.ok(q.hiddenValuePolicy);assert.ok(q.computed);assert.ok(q.fields.some(f=>f.visibleWhen));
});

test('full WebChat schema is generated and manifests preserve complete Node order/version/definitions',async()=>{
 const index=await json('index.json'),bytes=await read(index.fullSchemaPath),full=JSON.parse(bytes),m=await json('webchat/iui.schema.manifest.json');assertClosedSchema(full);
 assert.equal(full.properties.version.const,'iui/1');assert.equal(m.mode,'full');assert.equal(m.sha256,hash(bytes));assert.equal(m.utf8Bytes,bytes.length);assert.equal(full.$defs.Node.oneOf.length,218);
 const types=full.$defs.Node.oneOf.map(r=>full.$defs[r.$ref.slice(8)].properties.type.const);assert.deepEqual(types,m.components);assert.equal(new Set(types).size,218);
 for(const [name,definition]of Object.entries(full.$defs))assert.equal(m.definitionHashes[name],hash(JSON.stringify(definition)),name);
});

test('actual source inventory selects modules deterministically and rejects unknown/unmigrated components',async()=>{
 const index=await json('source-index.json');inspectSourceIndex(index);assert.deepEqual(planComponentSelection(index,['questionnaire','text']),planComponentSelection(index,['text','questionnaire']));
 assert.throws(()=>planComponentSelection(index,['invented-component']),/unknown component/);assert.throws(()=>planComponentSelection(index,[index.migrationCoverage.legacyNodeTypes[0]]),/not migrated/);
 const plan=planComponentSelection(index,['slider']);assert.ok(plan.includedComponents.length===41);assert.ok(plan.includedComponents.includes('link'));assert.ok(!plan.includedComponents.includes('questionnaire'));
});

test('published source supplement covers every authoritative source file without changing the CDN identity',async()=>{
 const publication=await json('source-public.json'),index=await json('index.json'),sourceIndex=await json('source-index.json');assert.equal(publication.publicCommit,index.source.publicCommit);assert.equal(publication.sourceCommit,index.source.sourceCommit);assert.equal(publication.publicCommit,'c060802fe8d8f4ec2df58c9be88f2a11d409f0e9');assert.equal(publication.cdnIncludesQuestionnaire,false);
 for(const [p,digest]of Object.entries(sourceIndex.sourceFiles)){const f=publication.verifiedFiles.find(x=>x.path===p);assert.ok(f,p);assert.equal(f.sha256,digest,p);}
 assert.ok(publication.verifiedFiles.some(f=>f.path==='src/schema/iui.schema.json'));assert.equal(publication.cdnCommit,'fed5f86f49e73f908ac9ea98966b1515a3aaa597');
});

// Category metadata is authoritative; module prefixes are not category IDs.
test('whole-task byte measurements follow the declared category and explicit semantic lists',async()=>{
 const generation=await json('generation.json'),index=await json('index.json'),source=await json('source-index.json');let differentPrefix=false;
 for(const module of source.modules){assert.ok(module.semanticContractPaths.length);if(!source.components.some(c=>c.moduleId===module.id))continue;
  const category=index.categories.find(c=>c.id===module.category),measured=generation.taskPaths.find(m=>m.moduleId===module.id);assert.ok(category&&measured,module.id);
  assert.equal(measured.categoryBytes,(await read(category.path)).length);assert.equal(measured.routeAndTaskBytes,(await read('index.json')).length+measured.categoryBytes+measured.taskBytes);
  if(module.id.split('/')[0]!==module.category)differentPrefix=true;
  const task=await json('modules/'+module.id+'.json');assert.ok(task.selection.contractSelections.every(c=>c.followLinks===false));
  assert.ok(!task.contracts.some(c=>/^(README\.md|docs\/(cdn|verification[^/]*|schema-subsets)\.md)$/.test(c.path)));
 }
 assert.ok(differentPrefix,'fixture covers a category unlike its module prefix');
});


test('media module packs preserve actual reader and Lottie dependencies',async()=>{
 const viz=await json('modules/learning/visualization.json'),inline=await json('modules/media/inline-host.json');
 assert.deepEqual(viz.selection.resolvedModules,['shared/value','media/lottie','learning/visualization']);
 assert.deepEqual(viz.selection.includedComponents,['lottie','learning-viz-dil']);
 assert.deepEqual(inline.selection.resolvedModules,['shared/value','media/readers','media/inline-host']);
 for(const type of ['search-image','youtube','entity','gen-image','speech-synthesizer'])assert.ok(inline.selection.includedComponents.includes(type));
 for(const task of [viz,inline]){assert.ok(task.selection.contractSelections.every(c=>c.followLinks===false));assert.ok(task.examples.length>=2);}
 const ledger=await json('modules/finance/category-views.json');assert.equal(ledger.selection.includedComponents.length,3);assert.ok(ledger.contracts.some(c=>c.path==='docs/ledger-category-contract.md'));
});

test('published Lottie guard evidence remains distinct from unchanged CDN assets',async()=>{
 const publication=await json('source-public.json');assert.equal(publication.cdnIncludesLottieLayerTypeFix,false);
 assert.ok(publication.verifiedFiles.some(f=>f.path==='src/core/lottie.ts'&&/^[a-f0-9]{40}$/.test(f.gitBlob)));
 const task=await json('modules/media/lottie.json'),text=task.contracts.map(c=>c.text).join('\n');
 assert.ok(text.includes('ty'));assert.ok(task.contracts.some(c=>c.path==='docs/lottie-recovery.md'));
});


test('composed study and search packs retain declared child schemas and semantic contracts',async()=>{
 const study=await json('modules/learning/study-demo.json');assert.ok(study.selection.resolvedModules.includes('learning/basic'));assert.ok(study.selection.includedComponents.includes('quiz'));assert.ok(study.contracts.some(c=>c.path==='docs/charts.md'));
 const search=await json('modules/onboarding/search-capability.json');for(const id of ['reservations/pills','requests/location','media/readers'])assert.ok(search.selection.resolvedModules.includes(id));
 for(const type of ['reservation-time-pills-ref-carousel','ask-user-location','search-image','whats-new-capability-search'])assert.ok(search.selection.includedComponents.includes(type));
 for(const p of ['docs/capability-search.md','docs/reservation-pills.md','docs/ask-location.md','docs/media-readers.md'])assert.ok(search.contracts.some(c=>c.path===p));
 assert.ok(search.examples.length>=4);
});

test('automation and entity packs expose complete original examples and validation contracts',async()=>{
 const automation=await json('modules/automation/views.json'),entity=await json('modules/entities/cards.json');
 assert.equal(automation.selection.includedComponents.length,3);assert.equal(entity.selection.includedComponents.length,2);
 for(const [task,p,phrase]of [[automation,'docs/automation-contract.md','AUTOMATION_DATA'],[entity,'docs/entity-contract.md','validateDocument']]){assert.ok(task.contracts.some(c=>c.path===p&&c.text.includes(phrase)));assert.ok(task.examples.length);assert.ok(task.selection.contractSelections.every(c=>c.followLinks===false));}
});
