import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {root,readSkillShell} from '../scripts/check-skill.mjs';
import {sha256,readJSON,candidateDirectory,acceptedRevision,candidateRevision,deriveCategories,safeFile} from '../scripts/pending-inputs.mjs';
const read = p => readJSON(path.join(root,p));
test('pending input lock separates accepted assets, exact frozen sources and 37 canonical identities',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock37.json');
 assert.equal(lock.candidateOnly,true);assert.equal(lock.sourceRevision,candidateRevision);assert.equal(lock.acceptedAssetRevision,acceptedRevision);assert.equal(lock.canonicalCount,37);assert.equal(lock.protocolNodeCount,97);assert.equal(lock.items.length,37);assert.equal(new Set(lock.items.map(x=>x.canonicalId)).size,37);
 assert.equal(sha256(await readFile(path.join(root,candidateDirectory,'accepted-library-contract.json'))),lock.formalAcceptedContractSha256);
 assert.deepEqual(lock.verification,{sourceOnly:true,browser:'not-run',cdn:'not-run',ci:'not-run',publicAssetPromotion:false});
});
test('candidate example bytes match their explicitly locked original source inputs',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock37.json');const paths=new Set();
 for(const item of lock.items)for(const example of item.examples){paths.add(example.candidatePath);assert.equal(sha256(await readFile(await safeFile(root,example.candidatePath))),lock.sourceFiles[example.sourcePath]);}
 const manifest=await read(candidateDirectory+'/manifest37.source.json');
 assert.deepEqual(lock.items.map(({groups,examples,...item})=>({...item,examples:examples.map(x=>x.sourcePath)})),manifest.items);
 assert.equal(paths.size,37);assert.equal((await readdir(path.join(root,candidateDirectory,'examples') )).length,37);
 const invalid=await read(candidateDirectory+'/invalid.json');assert.deepEqual([...new Set(invalid.map(x=>x.canonicalId))].sort(),lock.items.map(x=>x.canonicalId).sort());
});
test('candidate source index declares every candidate ownership without copying a second schema',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock37.json'); const categories=await read(candidateDirectory+'/category-index.json');
 assert.equal(Object.keys(categories.nodeOwners).length,97);
 for(const item of lock.items)assert.deepEqual(item.groups,[...new Set(item.nodeTypes.map(n=>categories.nodeOwners[n]))].sort());
 assert.equal(categories.groups.length,11);assert.equal(categories.$defs,undefined);
 assert.equal(categories.groups.find(g=>g.id==='forms').examples.some(x=>x.repositoryPath==='examples/field-labels.json'),true);
 assert.equal(categories.groups.find(g=>g.id==='base').examples.some(x=>x.repositoryPath==='examples/field-labels.json'),false);
 const reconstructed={semantics:categories.semantics,nodeOwners:categories.nodeOwners,groups:categories.groups.map(({canonicalCandidates,...g})=>g)};
 assert.deepEqual(deriveCategories(reconstructed,lock),categories);
});
test('root common guidance is gated, candidate literals are parseable, pending shell matches exact candidate and accepted contract snapshot remains separate',async()=>{
 const source=await readFile(path.join(root,'SKILL.md'),'utf8');const guide=await readFile(path.join(root,'WEB-CHAT-GUIDE.md'),'utf8');
 assert.deepEqual(readSkillShell(source),readSkillShell(guide));assert.ok(readSkillShell(source).html.includes('@'+candidateRevision+'/'));assert.ok(!readSkillShell(source).html.includes(acceptedRevision));
 for(const word of ['carousel','code','pie','checkbox','markdown','date','tab-group','checklist','rating','favicon','agenda','button','restaurant-menu','prompt-suggestions','label','person-profile','writing-block','news-article','entity-reviews','restaurant-availability','reddit-thread-card'])assert.ok(source.split('## 7. 隔离候选')[1].includes(word));
 let count=0;for(const file of ['SKILL.md','references/pending-learning.md'])for(const m of (await readFile(path.join(root,file),'utf8')).matchAll(/^```json candidate-only\r?\n([\s\S]*?)^```/gm)){assert.equal(JSON.parse(m[1]).version,'iui/1');count++;}assert.equal(count,19);
});
test('candidate path checks reject traversal and absolute paths',async()=>{
 for(const p of ['../SKILL.md','/etc/passwd','candidates/../SKILL.md','candidates\\x','candidates//x'])await assert.rejects(safeFile(root,p));
});

test('core30 provenance preserves earlier manifests and exact staged verification boundary',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock37.json');
 const before=await read(candidateDirectory+'/manifest.source.json'),after=await read(candidateDirectory+'/manifest37.source.json');
 assert.deepEqual(after.items.slice(0,20),before.items);
 assert.deepEqual(lock.provenance.historical90PreviousFullNode,{revision:'d0dac48da25c4fdbd10c931dfda9e2f20550f348',tests:863,passed:863,failed:0,skipped:0,todo:0});
 assert.deepEqual(lock.provenance.historical90FinalFormsAndSharedImpact,{tests:237,passed:237,failed:0,skipped:0,todo:0});
 assert.equal(lock.priorSkillCandidateRevision,'1ac13720d8dfb5fc9c516e2221e7d87f4ed7b433');
 const categories=await read(candidateDirectory+'/category-index.json');
 for(const item of after.items.slice(20,30)){assert.equal(categories.nodeOwners[item.nodeTypes[0]],'base');assert.ok(categories.groups.find(g=>g.id==='base').examples.some(x=>x.repositoryPath===item.examples[0]));}
 // Later guidance and the115 README entry preserve the exact earlier locked bytes in explicit snapshots.
 const archived = new Set(['SKILL.md','tests/pending-batch.test.mjs']);
 for(const [file,digest]of Object.entries(lock.candidateFiles))assert.equal(sha256(await readFile(await safeFile(root,file==='README.md'?'candidates/upcoming-eighteen/baseline107/README.md.source.txt':archived.has(file)?'candidates/upcoming-three/baseline37/'+file+(file==='SKILL.md'?'.source.txt':''):file))),digest,'Frozen37 input drift: '+file);
});


test('current37 lock preserves distinct historical30 bytes and exact current97 evidence',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock37.json'),old=await read(candidateDirectory+'/library-candidate-lock.json'),prior=await read(candidateDirectory+'/manifest30.source.json'),current=await read(candidateDirectory+'/manifest37.source.json');
 assert.equal(old.canonicalCount,30);assert.equal(old.protocolNodeCount,90);assert.equal(old.sourceRevision,'7978f23da0222ad9122bb0b40daa4f1844b5b9cd');
 assert.deepEqual(current.items.slice(0,30),prior.items);assert.equal(current.items.length,37);
 const preserved=await read(candidateDirectory+'/historical30-sha256.json');for(const [file,hash]of Object.entries(preserved))assert.equal(sha256(await readFile(path.join(root,file))),hash);
 assert.deepEqual(lock.provenance.historical30Preparation,preserved);assert.equal(lock.provenance.ownerEvidence,'docs/local-enhancements-97.json');
 assert.equal(lock.provenance.ownerPreviousFullNode.assetRevision,old.sourceRevision);assert.equal(lock.provenance.ownerPreviousFullNode.tests,936);
 assert.equal(lock.provenance.ownerCombinedAffectedNode.tests,222);assert.equal(lock.provenance.ownerCombinedAffectedNode.failed,0);assert.equal(lock.provenance.ownerBrowser.executed,false);assert.equal(lock.provenance.ownerFullAggregate.executed,false);assert.equal(Object.keys(lock.runtimeFiles).length,125);
});
