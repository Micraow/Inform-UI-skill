import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../authoring/pilot-v1/',import.meta.url);
const json=async p=>JSON.parse(await readFile(new URL(p,root)));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('paired pilot preserves generated answers and separately records each actual grading stage',async()=>{
 const r=await json('RESULT.json');assert.equal(r.runtimeSource,'29c6905e19d00f60ad4d945d766a6fbf516f2f9c');assert.equal(r.runtimePublicCommit,null);
 for(const arm of ['A','B']){const grade=await json(`${arm}-score.json`);assert.deepEqual(grade.summary,r.scores[arm]);assert.deepEqual(grade.summary,{documents:8,parse:8,schema:8,taskContract:8,semanticVectorsPassed:31,semanticVectorsTotal:31,runtime:8,allStages:8});assert.equal(grade.externalCalls,0);assert.deepEqual(grade.jsdomErrors,[]);
  for(const file of r.outputs[arm]){const bytes=await readFile(new URL(file.path,root));assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
 }
 assert.deepEqual(r.pairwise,{AOnly:0,BOnly:0,bothPass:8,bothFail:0});
});
test('same eight questions, complete materials and pre-frozen evaluator remain inspectable',async()=>{
 const r=await json('RESULT.json'),q=await json('questions.json'),vectors=await json('semantic-vectors.json'),docs=await json('reference-documents.json');
 assert.deepEqual(q.map(x=>x.id),['P01','P02','P03','P04','P05','P06','P07','P08']);assert.equal(docs.length,8);assert.equal(Object.values(vectors).flat().length,31);
 assert.equal(r.design.goldFrozenBeforeGeneration,true);assert.equal(r.design.feedbackOrRepairs,false);assert.equal(r.design.gradingAssertionsChangedAfterGeneration,false);
 for(const arm of ['A','B']){assert.equal(r.inputCoverage[arm].length,4);for(const f of r.inputCoverage[arm]){let end=0;for(const [a,b]of f.ranges){assert.equal(a,end);assert.ok(b>a&&b-a<=12000);end=b;}assert.equal(end,f.characters);}}
 assert.equal(hash(await readFile(new URL('score.mjs',root))),r.evidence.portableGraderSha256);
});
test('pilot cost distinguishes artifacts, formatting, operations and unobserved tokens or internal calls',async()=>{
 const r=await json('RESULT.json');assert.equal(r.cost.A.inputMaterialBytes,157726);assert.equal(r.cost.B.inputMaterialBytes,31015);assert.equal(r.inputMaterialReductionPercent,80.336);
 assert.equal(r.cost.B.answerMinifiedBytes-r.cost.A.answerMinifiedBytes,45);assert.equal(r.generationSessions,2);assert.equal(r.sampling.independentReplicatesPerArm,1);assert.equal(r.sampling.seed,null);assert.equal(r.evidence.tokenizerExecuted,false);assert.equal(r.evidence.nativeExecuted,false);
 assert.ok(r.limitations.some(x=>x.includes('not a complete billable-token')));assert.ok(r.conclusion.includes('does not show superior accuracy'));
});
