import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {root,readSkillShell} from '../scripts/check-skill.mjs';
import {sha256,readJSON,candidateDirectory,acceptedRevision,candidateRevision,deriveCategories,safeFile} from '../scripts/pending-inputs.mjs';
const read = p => readJSON(path.join(root,p));
test('pending input lock separates accepted assets, exact frozen sources and 20 canonical identities',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json');
 assert.equal(lock.candidateOnly,true);assert.equal(lock.sourceRevision,candidateRevision);assert.equal(lock.acceptedAssetRevision,acceptedRevision);assert.equal(lock.canonicalCount,20);assert.equal(lock.protocolNodeCount,80);assert.equal(lock.items.length,20);assert.equal(new Set(lock.items.map(x=>x.canonicalId)).size,20);
 assert.equal(sha256(await readFile(path.join(root,'library-contract.json'))),lock.formalAcceptedContractSha256);
 assert.deepEqual(lock.verification,{sourceOnly:true,browser:'not-run',cdn:'not-run',ci:'not-run',publicAssetPromotion:false});
});
test('candidate example bytes match their explicitly locked original source inputs',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json');const paths=new Set();
 for(const item of lock.items)for(const example of item.examples){paths.add(example.candidatePath);assert.equal(sha256(await readFile(await safeFile(root,example.candidatePath))),lock.sourceFiles[example.sourcePath]);}
 const manifest=await read(candidateDirectory+'/manifest.source.json');
 assert.deepEqual(lock.items.map(({groups,examples,...item})=>({...item,examples:examples.map(x=>x.sourcePath)})),manifest.items);
 assert.equal(paths.size,23);assert.equal((await readdir(path.join(root,candidateDirectory,'examples'))).length,23);
 const invalid=await read(candidateDirectory+'/invalid.json');assert.deepEqual([...new Set(invalid.map(x=>x.canonicalId))].sort(),lock.items.map(x=>x.canonicalId).sort());
});
test('candidate source index declares every candidate ownership without copying a second schema',async()=>{
 const lock=await read(candidateDirectory+'/library-candidate-lock.json'); const categories=await read(candidateDirectory+'/category-index.json');
 assert.equal(Object.keys(categories.nodeOwners).length,80);
 for(const item of lock.items)assert.deepEqual(item.groups,[...new Set(item.nodeTypes.map(n=>categories.nodeOwners[n]))].sort());
 assert.equal(categories.groups.length,11);assert.equal(categories.$defs,undefined);
 assert.equal(categories.groups.find(g=>g.id==='forms').examples.some(x=>x.repositoryPath==='examples/field-labels.json'),true);
 assert.equal(categories.groups.find(g=>g.id==='base').examples.some(x=>x.repositoryPath==='examples/field-labels.json'),false);
 const reconstructed={semantics:categories.semantics,nodeOwners:categories.nodeOwners,groups:categories.groups.map(({canonicalCandidates,...g})=>g)};
 assert.deepEqual(deriveCategories(reconstructed,lock),categories);
});
test('root common guidance is gated, candidate literals are parseable, accepted shell stays unchanged',async()=>{
 const source=await readFile(path.join(root,'SKILL.md'),'utf8');const guide=await readFile(path.join(root,'WEB-CHAT-GUIDE.md'),'utf8');
 assert.deepEqual(readSkillShell(source),readSkillShell(guide));assert.ok(readSkillShell(source).html.includes('@'+acceptedRevision+'/'));assert.ok(!readSkillShell(source).html.includes(candidateRevision));
 for(const word of ['carousel','code','pie','checkbox','markdown','date','tab-group','checklist','rating','favicon','agenda','button','restaurant-menu','prompt-suggestions','label','person-profile','writing-block'])assert.ok(source.split('## 7. 隔离候选')[1].includes(word));
 let count=0;for(const file of ['SKILL.md','references/pending-learning.md'])for(const m of (await readFile(path.join(root,file),'utf8')).matchAll(/^```json candidate-only\r?\n([\s\S]*?)^```/gm)){assert.equal(JSON.parse(m[1]).version,'iui/1');count++;}assert.equal(count,6);
});
test('candidate path checks reject traversal and absolute paths',async()=>{
 for(const p of ['../SKILL.md','/etc/passwd','candidates/../SKILL.md','candidates\\x','candidates//x'])await assert.rejects(safeFile(root,p));
});
