import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSourceIndex,planComponentSelection,assertClosedSchema,selectContractSection} from '../scripts/progressive-source-consumer.mjs';
const identity={algorithm:'sha256',value:'a'.repeat(64)};
const example=id=>({id,category:id.startsWith('shared/')?'shared':id.startsWith('forms/')?'forms':'foundations',title:id,provides:[],dependsOn:[],sourcePath:'scripts/'+id+'.mjs',contractPath:'docs/contracts.md#'+id.split('/')[1],examplePaths:[]});
function catalog(){const value={...example('shared/value'),provides:['Value']},text={...example('foundations/text'),provides:['TextNode'],dependsOn:['shared/value'],examplePaths:['examples/text.json']},questionnaire={...example('forms/questionnaire'),provides:['QuestionnaireNode'],dependsOn:['shared/value'],examplePaths:['examples/questionnaire.json']};return {format:'inform-ui-source-index/1',schemaVersion:'iui/1',sourceIdentity:{...identity},modules:[value,text,questionnaire],components:[{type:'text',definition:'TextNode',moduleId:text.id,category:text.category,contractPath:text.contractPath,examplePaths:text.examplePaths},{type:'questionnaire',definition:'QuestionnaireNode',moduleId:questionnaire.id,category:questionnaire.category,contractPath:questionnaire.contractPath,examplePaths:questionnaire.examplePaths}],migrationCoverage:{migratedNodeCount:2,totalNodeCount:3,legacyNodeTypes:['legacy-reader']}};}
test('source selection follows actual module ownership, shared dependencies and deterministic category order',()=>{
 const index=catalog(),before=JSON.stringify(index),p=planComponentSelection(index,['questionnaire','text']);assert.equal(JSON.stringify(index),before);
 assert.deepEqual(p.resolvedModules,['shared/value','foundations/text','forms/questionnaire']);assert.deepEqual(p.requestedModules,['foundations/text','forms/questionnaire']);assert.deepEqual(p.includedComponents,['text','questionnaire']);assert.deepEqual(p,planComponentSelection(index,['text','questionnaire']));assert.deepEqual(p.sourceIdentity,identity);
 assert.deepEqual(planComponentSelection(index,['questionnaire']).resolvedModules,['shared/value','forms/questionnaire']);assert.equal(p.migrationCoverage.legacyNodeTypes.length,1);
});
test('unknown and unmigrated components, duplicate selections and malformed source versions fail visibly',()=>{
 for(const [names,message]of [[[],/at least/],[['ghost'],/unknown component/],[['legacy-reader'],/not migrated/],[['text','text'],/duplicates/]])assert.throws(()=>planComponentSelection(catalog(),names),message);
 for(const mutate of [x=>x.schemaVersion='iui/2',x=>x.format='other',x=>x.sourceIdentity.value='floating',x=>x.migrationCoverage.totalNodeCount=4]){const x=catalog();mutate(x);assert.throws(()=>inspectSourceIndex(x));}
});
test('catalog conflicts and dependency errors cannot silently produce a partial schema',()=>{
 for(const mutate of [x=>x.modules.push({...x.modules[0]}),x=>x.modules[2].provides.push('TextNode'),x=>x.modules[2].dependsOn.push('absent'),x=>x.modules[0].dependsOn.push('forms/questionnaire'),x=>x.components[1].moduleId='foundations/text',x=>x.components[1].type='text',x=>x.modules[0].contractPath='../secret.md',x=>x.components[0].examplePaths=['https://example.test/a.json'],x=>x.migrationCoverage.legacyNodeTypes=['text']]){const x=catalog();mutate(x);assert.throws(()=>inspectSourceIndex(x));}
});
test('structural closure resolves escaped local references and rejects dangling or network refs',()=>{
 assertClosedSchema({$ref:'#/$defs/A~1B',$defs:{'A/B':{items:{$ref:'#/$defs/A~1B'}}}});
 assert.throws(()=>assertClosedSchema({$ref:'#/$defs/Absent',$defs:{}}),/unresolved/);
 assert.throws(()=>assertClosedSchema({$ref:'https://example.test/schema'}),/external/);
});
test('adjacent contract sections preserve the selected heading and child subsections without loading other families',()=>{
 const doc='# Shared contracts\n\n## Value\nMissing is null.\n### Operators\nUse bounded arithmetic.\n## Forms\nInput draft rules.\n';
 assert.equal(selectContractSection(doc,'value'),'## Value\nMissing is null.\n### Operators\nUse bounded arithmetic.\n');assert.equal(selectContractSection(doc,null),doc);assert.throws(()=>selectContractSection(doc,'ghost'),/does not exist/);
});

test('semantic links include the full local questionnaire contract once and never fetch citations',async()=>{
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),path=await import('node:path');
 const {readContractClosure}=await import('../scripts/progressive-source-consumer.mjs');const root=await mkdtemp(path.join(tmpdir(),'contract-closure-'));
 try{await mkdir(path.join(root,'docs'));await writeFile(path.join(root,'docs/index.md'),'## Questionnaire\n[full](questionnaire.md) [citation](https://example.test/private.md)\n## Other\nOther data\n');await writeFile(path.join(root,'docs/questionnaire.md'),'# Questionnaire\nHidden values excluded. [back](index.md#questionnaire)\n');
 const result=await readContractClosure(root,['docs/index.md#questionnaire']);assert.deepEqual(result.map(x=>x.path),['docs/index.md#questionnaire','docs/questionnaire.md']);assert.match(result[1].text,/Hidden values excluded/);assert.doesNotMatch(result[0].text,/Other data/);
 await writeFile(path.join(root,'docs/questionnaire.md'),'[bad](../../outside.md)');await assert.rejects(()=>readContractClosure(root,['docs/questionnaire.md']),/unsafe/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('consumer CLI rejects unknown, repeated and valueless flags rather than silently falling back',async()=>{
 const {parseProgressiveOptions}=await import('../scripts/progressive-source-consumer.mjs');const allowed=['--root','--output'];assert.deepEqual(parseProgressiveOptions(['--root','node','--output','result.json'],allowed),{'--root':'node','--output':'result.json'});
 for(const args of [['--roots','node'],['--root'],['--root','node','--root','document'],['--root','--output','file.json']])assert.throws(()=>parseProgressiveOptions(args,allowed),/invalid or duplicate/);
 const bad=catalog();bad.modules[1].category='../outside';assert.throws(()=>inspectSourceIndex(bad),/unsafe category/);
});

test('model task keeps version and safety closure but moves bulky file hashes into separate audit evidence',async()=>{
 const {separateTaskEvidence}=await import('../scripts/progressive-source-consumer.mjs');const original={runtime:{sourceCommit:'a'.repeat(40)},sourceManifest:{sourceFiles:{'a.mjs':'b'.repeat(64)}},selection:{migrationCoverage:{migratedNodeCount:2,totalNodeCount:3,legacyNodeTypes:['old']}},schema:{},contracts:[{text:'unknown is null'}],examples:[{document:{}}]};const before=JSON.stringify(original),{task,manifest}=separateTaskEvidence(original,'task.json.manifest.json');assert.equal(JSON.stringify(original),before);assert.deepEqual(manifest,original.sourceManifest);assert.equal(Object.hasOwn(task,'sourceManifest'),false);assert.equal(task.runtime.sourceCommit,original.runtime.sourceCommit);assert.deepEqual(task.contracts,original.contracts);assert.equal(task.selection.migrationCoverage.totalNodeCount,3);assert.equal(task.manifestPath,'task.json.manifest.json');assert.throws(()=>separateTaskEvidence(original,'../outside'),/unsafe/);
});

test('localized contract anchors match real headings while path and anchor escape attempts stay rejected',async()=>{
 const {mkdtemp,mkdir,writeFile,rm,symlink}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),path=await import('node:path');const {readContractClosure}=await import('../scripts/progressive-source-consumer.mjs');const root=await mkdtemp(path.join(tmpdir(),'localized-contract-'));
 try{
  await mkdir(path.join(root,'docs'));await writeFile(path.join(root,'docs/learning.md'),'# Learning\n[Setup](../README.md#源码与本地-agent)\n');await writeFile(path.join(root,'README.md'),'# Overview\n## 源码与本地 agent\nLocal source build only.\n## Other\nUnrelated content.\n');
  const docs=await readContractClosure(root,['docs/learning.md']);assert.deepEqual(docs.map(x=>x.path),['docs/learning.md','README.md#源码与本地-agent']);assert.match(docs[1].text,/Local source build only/);assert.doesNotMatch(docs[1].text,/Unrelated content/);
  await assert.rejects(()=>readContractClosure(root,['README.md#不存在']),/does not exist/);
  for(const anchor of ['../secret','标题?x=1','标题%2fsecret','标题#again','标题\u200b','标题<script>'])await assert.rejects(()=>readContractClosure(root,['README.md#'+anchor]),/unsupported contract anchor/);
  await writeFile(path.join(root,'docs/learning.md'),'[escape](../../outside.md#源码)');await assert.rejects(()=>readContractClosure(root,['docs/learning.md']),/unsafe local path/);
  await symlink(path.join(root,'README.md'),path.join(root,'docs/linked.md'));await assert.rejects(()=>readContractClosure(root,['docs/linked.md#源码与本地-agent']),/symlink/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('explicit semantic contracts control required loading while old contractPath catalogs retain compatibility',async()=>{
 const old=catalog(),legacy=planComponentSelection(old,['questionnaire']);assert.equal(Object.hasOwn(legacy,'contractSelections'),false);
 const current=catalog();current.modules[0].semanticContractPaths=['docs/contracts.md#value'];current.modules[2].semanticContractPaths=['docs/questionnaire-rules.md','docs/snapshot-rules.md#冻结快照'];
 const plan=planComponentSelection(current,['questionnaire']);assert.deepEqual(plan.contracts,['docs/contracts.md#value','docs/questionnaire-rules.md','docs/snapshot-rules.md#冻结快照']);assert.ok(plan.contractSelections.every(x=>x.followLinks===false));
 current.modules[2].semanticContractPaths=['docs/other-required.md'];assert.notDeepEqual(planComponentSelection(current,['questionnaire']).contracts,plan.contracts);
 for(const value of [[],['../private.md'],['docs/a.md','docs/a.md'],['https://example.test/a.md']]){const bad=catalog();bad.modules[2].semanticContractPaths=value;assert.throws(()=>inspectSourceIndex(bad));}
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),path=await import('node:path'),{readContractClosure}=await import('../scripts/progressive-source-consumer.mjs');const root=await mkdtemp(path.join(tmpdir(),'explicit-contract-'));
 try{await mkdir(path.join(root,'docs'));await writeFile(path.join(root,'docs/rules.md'),'# Rules\nUnknown stays null. [Archive](archive.md)\n');await writeFile(path.join(root,'docs/archive.md'),'# Historical deployment\nOld release paths.\n');const required=await readContractClosure(root,['docs/rules.md'],{followLinks:false});assert.equal(required.length,1);assert.match(required[0].text,/Archive/);assert.equal((await readContractClosure(root,['docs/rules.md'])).length,2);}finally{await rm(root,{recursive:true,force:true});}
});
