/** Integration checks against one explicitly pinned source checkout; no runtime bundle or network. */
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {generateProgressiveCatalog} from './generate-progressive-catalog.mjs';
import {createProgressiveTask,parseProgressiveOptions} from './progressive-source-consumer.mjs';
const args=parseProgressiveOptions(process.argv.slice(2),['--library','--revision','--generated','--publication']);for(const flag of ['--library','--revision','--generated'])assert.ok(args[flag],flag);
const options={library:args['--library'],revision:args['--revision']},temporary=await mkdtemp(path.join(tmpdir(),'iui-progressive-verify-'));let checks=0;
try{
 const rebuilt=await generateProgressiveCatalog({...options,output:temporary,publication:args['--publication']}),expected=JSON.parse(await readFile(path.join(args['--generated'],'generation.json'),'utf8'));
 assert.deepEqual(rebuilt,expected);checks++;
 for(const entry of rebuilt.artifacts){assert.deepEqual(await readFile(path.join(temporary,entry.path)),await readFile(path.join(args['--generated'],entry.path)),entry.path);}checks++;
 const document=await createProgressiveTask({...options,components:['text','input','questionnaire']}),reordered=await createProgressiveTask({...options,components:['questionnaire','input','text']});assert.deepEqual(document,reordered);checks++;
 assert.deepEqual(document.selection.resolvedModules,['shared/value','foundations/text','forms/fields','forms/questionnaire']);assert.equal(document.selection.includedComponents.length,10);assert.equal(document.examples.length,3);assert.ok(document.contracts.some(c=>c.path==='docs/forms.md'));assert.ok(document.contracts.some(c=>c.path==='docs/date-field.md'));assert.ok(document.contracts.some(c=>c.path==='docs/questionnaire-contract.md'));checks++;
 const node=await createProgressiveTask({...options,components:['text','input','questionnaire'],rootKind:'node'});assert.equal(node.schema.$ref,'#/$defs/Node');assert.equal(node.schema.properties,undefined);assert.deepEqual(node.schema.$defs,document.schema.$defs);assert.notEqual(node.schema.$id,document.schema.$id);checks++;
 await assert.rejects(()=>createProgressiveTask({...options,components:['invented-component']}),/unknown component/);checks++;
 if(rebuilt.coverage.legacyNodeTypes.length)await assert.rejects(()=>createProgressiveTask({...options,components:[rebuilt.coverage.legacyNodeTypes[0]]}),/not migrated/);else {assert.equal(rebuilt.coverage.migratedNodeCount,rebuilt.coverage.totalNodeCount);const formerlyLegacy=await createProgressiveTask({...options,components:['flight-option','unit-converter','native','image-grid']});for(const type of ['flight-option','unit-converter','native','image-grid'])assert.ok(formerlyLegacy.selection.includedComponents.includes(type));}checks++;
 await assert.rejects(()=>createProgressiveTask({...options,components:['text'],revision:'0'.repeat(40)}),/revision mismatch/);checks++;
 console.log(JSON.stringify({format:'inform-ui-progressive-consumer-result/1',sourceCommit:options.revision,passed:checks,failed:0,deterministicArtifacts:rebuilt.artifacts.length,combinedComponents:10,combinedExamples:3,rootKinds:['document','node'],networkRequests:0,runtimeBundleImported:false,fullSchema:rebuilt.fullSchema}));
}finally{await rm(temporary,{recursive:true,force:true});}
