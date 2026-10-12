import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async p=>readFile(new URL('../'+p,import.meta.url));
const json=async p=>JSON.parse(await read(p));
test('qSOFA and questionnaire source identities supplement rather than overwrite historical locks',async()=>{
 for(const [name,sha]of [['qsofa-scorecard','09733658d6fff687f4255ea6dde2901772ce33c1'],['questionnaire','a97a7c13323a91662f758c5c0034e943776935a3']]){
  const old=await json(`candidates/${name}/runtime-lock.safe.json`),now=await json(`candidates/${name}/source-public.json`);assert.equal(old.publicCommit,null);assert.equal(now.source,old.source);assert.equal(now.publicCommit,sha);assert.equal(now.sourceOnly,true);assert.equal(now.checkedSourceFiles,43);assert.equal(now.sourceDifferences,0);assert.equal(now.actionsCount,0);assert.deepEqual(now.files,old.files.filter(f=>!f.path.startsWith('dist/')&&!f.path.startsWith('test-dist/')));assert.equal(now.packagedCDN.containsThisNode,false);assert.equal(now.packagedCDN.publicCommit,'fed5f86f49e73f908ac9ea98966b1515a3aaa597');
 }
 const old=await json('references/recovery-scope212.json'),pub=await json('references/scope212-public.json');assert.equal(old.publicCommit,null);assert.deepEqual(pub.inventory,old.inventory);assert.equal(pub.publicCommit,'ba96c208c3934e89d861d8e75ec02195eede7941');assert.equal(pub.canonicalImplemented,212);assert.equal(pub.questionnaireChangesCanonicalCount,false);assert.equal(pub.publishedCDNCanonicalCount,209);
});
test('current task pack only adds verified publication metadata and an accurate source-build note',async()=>{
 const old=await json('authoring/packs/questionnaire.238c.json'),now=await json('authoring/packs/questionnaire.json');assert.equal(old.runtime.publicCommit,null);assert.equal(now.runtime.publicCommit,'a97a7c13323a91662f758c5c0034e943776935a3');assert.equal(now.runtime.publishedPackageContainsQuestionnaire,false);assert.deepEqual(now.schema,old.schema);assert.deepEqual(now.example,old.example);assert.deepEqual(now.identity,old.identity);assert.deepEqual(now.contract.requiredSemantics.slice(0,8),old.contract.requiredSemantics.slice(0,8));assert.deepEqual(now.contract.adjacentBoundaryExamples,old.contract.adjacentBoundaryExamples);
 const b=await read('authoring/packs/questionnaire.238c.json');assert.equal(b.length,20991);assert.equal(createHash('sha256').update(b).digest('hex'),'06c8db79af77a089584936608b48daf0320357c36c59ccc9477c4dc9478db644');
 const pilot=await json('authoring/pilot-v1/RESULT.json');assert.equal(pilot.runtimePublicCommit,null);assert.equal(pilot.inputCoverage.A.find(x=>x.path.endsWith('task-pack.json')).sha256,createHash('sha256').update(b).digest('hex'));
});
