import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {extractNodeSchema,buildAuthoringPack} from '../scripts/build-authoring-pack.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
test('questionnaire task pack is node-rooted and dependency-closed with adjacent semantic constraints',async()=>{
 const p=await json('authoring/packs/questionnaire.json');assert.equal(p.rootKind,'node');assert.equal(p.runtime.publicCommit,'a97a7c13323a91662f758c5c0034e943776935a3');assert.equal(p.runtime.publishedPackageContainsQuestionnaire,false);
 assert.deepEqual(Object.keys(p.schema.$defs),['QuestionnaireChoice','QuestionnaireField','QuestionnaireNode','QuestionnaireSource','Value']);
 function visit(x){if(!x||typeof x!=='object')return;if(x.$ref)assert.ok(Object.hasOwn(p.schema.$defs,x.$ref.slice(8)));for(const v of Object.values(x))visit(v);}visit(p.schema);
 assert.equal(p.example.body[0].type,'questionnaire');assert.equal(p.contract.requiredSemantics.length,9);assert.equal(p.contract.adjacentBoundaryExamples.length,6);
 assert.match(p.validation,/complete structural and semantic/);assert.match(p.contract.requiredSemantics.join(' '),/False and zero/);assert.match(p.contract.requiredSemantics.join(' '),/raw drafts/);
});
test('closure extraction keeps recursion intact and rejects dangling or network references',()=>{
 const schema={$schema:'https://json-schema.org/draft/2020-12/schema',$defs:{A:{anyOf:[{$ref:'#/$defs/B'},{type:'null'}]},B:{items:{$ref:'#/$defs/A'}},Unused:{type:'string'}}};
 const c=extractNodeSchema(schema,'A');assert.deepEqual(Object.keys(c.$defs),['A','B']);assert.deepEqual(c.$defs.A,schema.$defs.A);
 assert.throws(()=>extractNodeSchema(schema,'Absent'),/Unknown/);
 for(const ref of ['#/$defs/Absent','https://example.test/schema'])assert.throws(()=>extractNodeSchema({$defs:{A:{$ref:ref}}},'A'),/Unresolved|network/);
});
test('builder preserves original example and makes same-version validation requirement explicit',()=>{
 const schema={$schema:'https://json-schema.org/draft/2020-12/schema',$defs:{N:{type:'object'}}},example={version:'iui/1',body:[{type:'text',value:'Original'}]},before=JSON.stringify(example);
 const p=buildAuthoringPack({schema,definition:'N',example,contract:{requiredSemantics:['Missing is not zero.']},runtime:{source:'fixed',publicCommit:null}});
 assert.equal(JSON.stringify(example),before);assert.deepEqual(p.example,example);assert.match(p.identity.fullSchemaSha256,/^[a-f0-9]{64}$/);
});
test('byte audit charges all grammar instructions and does not claim measured model accuracy',async()=>{
 const a=await json('authoring/audit.json');assert.equal(a.examples.length,5);assert.equal(a.optionalSyntax.fiveOutputDocumentsSavedBytes,269);assert.equal(a.optionalSyntax.guideBytes,2575);assert.equal(a.optionalSyntax.netAdditionalBytesIncludingGuide,2306);
 assert.equal(a.evidence.modelGenerationExperimentExecuted,false);assert.equal(a.evidence.tokenizerUsed,null);assert.equal(a.completeQuestionnaireTask.packPrettyBytes,21102);
 assert.equal(a.schema.selectedDefinitions.length,5);assert.match(a.optionalSyntax.decision,/Canonical JSON is the default/);
});
test('actual source checks verify complete canonical expansion and original questionnaire outcomes',async()=>{
 const r=await json('authoring/runtime-equivalence.json');assert.equal(r.source,'29c6905e19d00f60ad4d945d766a6fbf516f2f9c');assert.equal(r.passed,25);assert.equal(r.failed,0);assert.equal(r.questionnaireVectors,20);
 assert.ok(r.representatives.every(x=>x.exactCanonical&&x.semanticValidation&&x.stateEvaluationEquivalent));assert.equal(r.externalServiceCalls,0);assert.equal(r.modelGenerationExperimentExecuted,false);assert.equal(r.nativeExecuted,false);
});
