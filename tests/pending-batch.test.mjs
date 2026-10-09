import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {root,readSkillShell} from '../scripts/check-skill.mjs';
import {sha256,readJSON,candidateDirectory,acceptedRevision,candidateRevision,deriveCategories,safeFile} from '../scripts/pending-inputs.mjs';
const read = p => readJSON(path.join(root,p));
test('pending input lock separates accepted assets, exact frozen sources and 30 canonical identities',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json');
 assert.equal(lock.candidateOnly,true);assert.equal(lock.sourceRevision,candidateRevision);assert.equal(lock.acceptedAssetRevision,acceptedRevision);assert.equal(lock.canonicalCount,30);assert.equal(lock.protocolNodeCount,90);assert.equal(lock.items.length,30);assert.equal(new Set(lock.items.map(x=>x.canonicalId)).size,30);
 assert.equal(sha256(await readFile(path.join(root,candidateDirectory,'accepted-library-contract.json'))),lock.formalAcceptedContractSha256);
 assert.deepEqual(lock.verification,{sourceOnly:true,browser:'not-run',cdn:'not-run',ci:'not-run',publicAssetPromotion:false});
});
test('candidate example bytes match their explicitly locked original source inputs',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json');const paths=new Set();
 for(const item of lock.items)for(const example of item.examples){paths.add(example.candidatePath);assert.equal(sha256(await readFile(await safeFile(root,example.candidatePath))),lock.sourceFiles[example.sourcePath]);}
 const manifest=await read(candidateDirectory+'/manifest30.source.json');
 assert.deepEqual(lock.items.map(({groups,examples,...item})=>({...item,examples:examples.map(x=>x.sourcePath)})),manifest.items);
 assert.equal(paths.size,32);assert.equal((await readdir(path.join(root,candidateDirectory,'examples') )).length,32);
 const invalid=await read(candidateDirectory+'/invalid.json');assert.deepEqual([...new Set(invalid.map(x=>x.canonicalId))].sort(),lock.items.map(x=>x.canonicalId).sort());
});
test('candidate source index declares every candidate ownership without copying a second schema',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json'); const categories=await read(candidateDirectory+'/category-index.json');
 assert.equal(Object.keys(categories.nodeOwners).length,90);
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
 let count=0;for(const file of ['SKILL.md','references/pending-learning.md'])for(const m of (await readFile(path.join(root,file),'utf8')).matchAll(/^```json candidate-only\r?\n([\s\S]*?)^```/gm)){assert.equal(JSON.parse(m[1]).version,'iui/1');count++;}assert.equal(count,15);
});
test('candidate path checks reject traversal and absolute paths',async()=>{
 for(const p of ['../SKILL.md','/etc/passwd','candidates/../SKILL.md','candidates\\x','candidates//x'])await assert.rejects(safeFile(root,p));
});

test('core30 provenance preserves earlier manifests and exact staged verification boundary',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json');
 const before=await read(candidateDirectory+'/manifest.source.json'),after=await read(candidateDirectory+'/manifest30.source.json');
 assert.deepEqual(after.items.slice(0,20),before.items);
 assert.deepEqual(lock.provenance.ownerPreviousFullNode,{revision:'d0dac48da25c4fdbd10c931dfda9e2f20550f348',tests:863,passed:863,failed:0,skipped:0,todo:0});
 assert.deepEqual(lock.provenance.ownerFinalFormsAndSharedImpact,{tests:237,passed:237,failed:0,skipped:0,todo:0});
 assert.equal(lock.priorSkillCandidateRevision,'94b5cd14a7f47fc477ee781cec06e0e6810a7169');
 const categories=await read(candidateDirectory+'/category-index.json');
 for(const item of after.items.slice(20)){assert.equal(categories.nodeOwners[item.nodeTypes[0]],'base');assert.ok(categories.groups.find(g=>g.id==='base').examples.some(x=>x.repositoryPath===item.examples[0]));}
 for(const [file,digest]of Object.entries(lock.candidateFiles))assert.equal(sha256(await readFile(await safeFile(root,file))),digest,'Candidate input drift: '+file);
});


test('recovery pin has distinct byte proof and preserves the original final30 evidence boundary',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json');
 const proof=await read(candidateDirectory+'/recovery-build-proof.json');
 assert.equal(proof.sourceRevision,candidateRevision);assert.equal(proof.sourceTree,lock.sourceTree);
 assert.equal(proof.previousAssetRevision,'5c7f334a975b75b0a70f58b5570b2ea567aed9dc');
 assert.equal(proof.verifiedCanonical,53);assert.equal(proof.pendingCanonical,30);
 assert.equal(proof.cdnAcceptance,'not-run');assert.match(proof.browser,/^blocked-before-launch:/);
 assert.equal(Object.keys(proof.finalProductionAndBuildHashes).length,311);
 for(const [file,hash]of Object.entries(lock.runtimeFiles))assert.equal(proof.finalProductionAndBuildHashes[file],hash);
 assert.equal(lock.provenance.recoveryBuildProofSha256,sha256(await readFile(path.join(root,candidateDirectory,'recovery-build-proof.json'))));
 assert.equal(lock.provenance.ownerEvidence,'docs/local-enhancements-90.json');
 assert.notEqual(lock.provenance.recoveryBuildProof,lock.provenance.ownerEvidence);
});
