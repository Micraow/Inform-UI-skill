import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import {compactAuthorDocument,compileAuthorDocument,stringifyAuthoring} from './compact-authoring.mjs';
import {representativeExamples} from './audit-authoring.mjs';
import {extractNodeSchema} from './build-authoring-pack.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=async p=>JSON.parse(await readFile(p));
export async function verifyAuthoringRuntime(library){
  const lock=await json(path.join(root,'candidates/questionnaire/runtime-lock.safe.json'));
  const expected=lock.files.find(f=>f.path==='dist/index.js'),bundle=await readFile(path.join(library,expected.path));
  assert.equal(bundle.length,expected.bytes);assert.equal(createHash('sha256').update(bundle).digest('hex'),expected.sha256);
  const api=await import(pathToFileURL(path.join(library,'dist/index.js')));
  const results=[];
  for(const p of representativeExamples){const original=await json(path.join(root,p)),expanded=compileAuthorDocument(JSON.parse(stringifyAuthoring(compactAuthorDocument(original))));assert.deepEqual(expanded,original);assert.equal(api.validateDocument(original).ok,true,p);assert.equal(api.validateDocument(expanded).ok,true,p);assert.deepEqual(api.evaluateState(expanded),api.evaluateState(original));results.push({path:p,exactCanonical:true,semanticValidation:true,stateEvaluationEquivalent:true});}
  const pack=await json(path.join(root,'authoring/packs/questionnaire.json')),schema=await json(path.join(library,'src/schema/iui.schema.json'));
  assert.deepEqual(pack.schema,extractNodeSchema(schema,pack.definition));assert.equal(api.validateDocument(pack.example).ok,true);
  const source=pack.example.body[0],expanded=compileAuthorDocument(compactAuthorDocument(pack.example)).body[0],vectors=await json(path.join(root,'candidates/questionnaire/answer-vectors.json'));
  for(const v of vectors.cases){const a=api.evaluateQuestionnaire(source,v.answers).snapshot,b=api.evaluateQuestionnaire(expanded,v.answers).snapshot;assert.deepEqual(a,b);assert.equal(b.status,v.expected.status);assert.deepEqual(b.computed,v.expected.computed);}
  return {source:lock.source,publicCommit:null,representatives:results,questionnaireVectors:vectors.cases.length,packDefinitions:Object.keys(pack.schema.$defs).length,passed:results.length+vectors.cases.length,failed:0,externalServiceCalls:0,modelGenerationExperimentExecuted:false,nativeExecuted:false,boundary:'Deterministic transformation and actual runtime equivalence only; no claim about model accuracy or token savings.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const library=process.argv[2];if(!library)throw Error('Pass exact runtime path');console.log(JSON.stringify(await verifyAuthoringRuntime(library),null,2));}
