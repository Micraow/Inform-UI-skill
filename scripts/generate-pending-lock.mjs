/** Reproduce final30 source locks from exact existing Git objects; never fetch/build/run browsers. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root} from './check-skill.mjs';
import {candidateDirectory,acceptedRevision,candidateRevision,candidateTree,readJSON,safeFile,sha256,deriveCategories} from './pending-inputs.mjs';
const arg=flag=>{const i=process.argv.indexOf(flag);assert.ok(i>=0&&process.argv[i+1]&&!process.argv[i+1].startsWith('--'),'Required '+flag);return process.argv[i+1];};
const repository=path.resolve(arg('--source-repository')),library=path.resolve(arg('--library'));
assert.equal(arg('--revision'),candidateRevision);
const git=(...args)=>execFileSync('git',['-C',repository,...args],{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
assert.equal(git('rev-parse',candidateRevision+'^{commit}'),candidateRevision);
const tree=git('rev-parse',candidateRevision+'^{tree}');assert.equal(tree,candidateTree);
const entries=git('ls-tree','-r',candidateRevision).split('\n').map(line=>{const m=line.match(/^(\d+) blob ([a-f0-9]{40})\t(.+)$/);assert.ok(m,'Source tree must contain ordinary files only');return{mode:m[1],oid:m[2],path:m[3]};});
const manifest=await readJSON(path.join(root,candidateDirectory,'manifest30.source.json'));
assert.equal(manifest.sourceRevision,candidateRevision);assert.equal(manifest.candidateOnly,true);assert.equal(manifest.acceptedAssetRevision,acceptedRevision);assert.equal(manifest.items.length,30);
const prior24=await readJSON(path.join(root,candidateDirectory,'manifest24.source.json'));
const prior20=await readJSON(path.join(root,candidateDirectory,'manifest.source.json'));
assert.deepEqual(manifest.items.slice(0,24),prior24.items);assert.deepEqual(manifest.items.slice(0,20),prior20.items);
const docs=['docs/date-field.md','docs/local-enhancements-80.md','docs/local-enhancements-80.json','docs/local-enhancements-84.md','docs/local-enhancements-84.json','docs/local-enhancements-88.md','docs/local-enhancements-88.json','docs/local-enhancements-90.md','docs/local-enhancements-90.json'];
const explicit=new Set(['LICENSE','THIRD_PARTY_NOTICES.md','package.json','package-lock.json','tsconfig.json','scripts/build.mjs','scripts/build-cdn.mjs','scripts/schema-subset.mjs','cdn/integrity.json','cdn/schema/index.json','scripts/generate-schema.mjs','scripts/schema-subsets.mjs','scripts/math-assets.mjs',...docs,...manifest.items.flatMap(x=>[x.contract,...x.examples])]);
const selected=entries.filter(x=>x.path.startsWith('src/')||x.path.startsWith('bin/')||explicit.has(x.path));
for(const p of explicit)assert.ok(selected.some(x=>x.path===p),'Missing expected source '+p);
const sourceFiles={};
for(const entry of selected){
 assert.ok(entry.mode==='100644'||entry.mode==='100755','No source symlinks');
 const bytes=await readFile(await safeFile(library,entry.path));
 const oid=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(oid,entry.oid,'Library bytes differ from exact committed source: '+entry.path);sourceFiles[entry.path]=sha256(bytes);
}
const evidence=await readJSON(path.join(library,'docs/local-enhancements-90.json'));
assert.equal(evidence.pendingCanonical,30);assert.equal(evidence.protocolNodes,90);assert.equal(evidence.browser.executed,false);
assert.deepEqual(evidence.previousFullNode,{revision:'d0dac48da25c4fdbd10c931dfda9e2f20550f348',tests:863,passed:863,failed:0,skipped:0,todo:0});
assert.deepEqual(evidence.finalFormsAndSharedImpact,{tests:237,passed:237,failed:0,skipped:0,todo:0});
assert.equal(Object.keys(evidence.finalProductionAndBuildHashes).length,311);
// The original final30 evidence remains historical. A distinct recovery proof
// binds new runtime bytes to the exact new immutable Git asset, not to old tests.
const recoveryPath=candidateDirectory+'/recovery-build-proof.json';
const recovery=await readJSON(path.join(root,recoveryPath));
assert.equal(recovery.format,'inform-acceptance-recovery-build/1');
assert.equal(recovery.sourceRevision,candidateRevision);assert.equal(recovery.sourceTree,tree);
assert.equal(recovery.sourceDirectoryTree,git('rev-parse',candidateRevision+':src'));
assert.equal(recovery.previousAssetRevision,'5c7f334a975b75b0a70f58b5570b2ea567aed9dc');
assert.equal(recovery.historicalEvidenceSha256,sha256(await readFile(path.join(library,'docs/local-enhancements-90.json'))));
assert.equal(recovery.verifiedCanonical,53);assert.equal(recovery.pendingCanonical,30);assert.equal(recovery.protocolNodes,90);
assert.equal(recovery.cdnAcceptance,'not-run');assert.ok(recovery.browser.startsWith('blocked-before-launch:'));
assert.deepEqual(Object.keys(recovery.finalProductionAndBuildHashes).sort(),Object.keys(evidence.finalProductionAndBuildHashes).sort(),'Recovery proof must retain all 311 production/build paths');
const changed=Object.keys(recovery.finalProductionAndBuildHashes).filter(p=>recovery.finalProductionAndBuildHashes[p]!==evidence.finalProductionAndBuildHashes[p]);
assert.deepEqual(recovery.changedPaths,changed,'Exact recovery delta');
const runtimeFiles={};
for(const [p,expected] of Object.entries(recovery.finalProductionAndBuildHashes)){
 assert.match(expected,/^[a-f0-9]{64}$/);const bytes=await readFile(await safeFile(library,p));
 assert.equal(sha256(bytes),expected,'Recovery build bytes changed: '+p);
 if(p.startsWith('dist/'))runtimeFiles[p]=expected;
 else{const entry=entries.find(e=>e.path===p);assert.ok(entry,'Recovery input must be tracked: '+p);
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),entry.oid,'Recovery bytes differ from immutable asset: '+p);}
}
for(const p of ['dist/index.js','dist/browser.js','dist/standalone.js','dist/style.css'])assert.ok(runtimeFiles[p],'Required recovery runtime '+p);
const index=await readJSON(path.join(library,'src/schema/fragments/index.json'));assert.equal(Object.keys(index.nodeOwners).length,90);
const candidatePaths=[recoveryPath,'library-contract.json','README.md','references/support.md','references/library-workflow.md','references/node-support.json','references/schema-discovery.md','scripts/validate-examples.mjs','scripts/verify-schema-index.mjs','tests/skill.test.mjs',candidateDirectory+'/accepted-library-contract.json','SKILL.md','WEB-CHAT-GUIDE.md','references/pending-learning.md','references/example-languages.json','scripts/pending-inputs.mjs','scripts/generate-pending-lock.mjs','scripts/verify-pending-batch.mjs','scripts/check-pending24.mjs','scripts/check-pending30.mjs','scripts/check-pending-browser-source.mjs','scripts/verify-browser.mjs','scripts/verify-consumer-reuse.mjs','scripts/cdn-discovery-contract.mjs','tests/cdn-discovery-contract.test.mjs','tests/pending-batch.test.mjs','tests/pending-browser.test.mjs','tests/consumer-reuse.test.mjs',candidateDirectory+'/verify-browser.mjs',candidateDirectory+'/consumer-plan.json',candidateDirectory+'/README.md',candidateDirectory+'/manifest.source.json',candidateDirectory+'/manifest24.source.json',candidateDirectory+'/manifest30.source.json',candidateDirectory+'/invalid.json',...manifest.items.flatMap(x=>x.examples.map(p=>candidateDirectory+'/'+p))];
const plan=await readJSON(path.join(root,candidateDirectory,'consumer-plan.json'));
const languages=await readJSON(path.join(root,'references/example-languages.json'));
for(const name of Object.keys(languages))candidatePaths.push('examples/'+name+'.json');
for(const entry of [...plan.examples,...plan.existingEnhancementPromotion])assert.equal(sha256(await readFile(await safeFile(root,entry.futureSkillPath))),entry.sha256,'Promoted fixture bytes changed');
const pendingContract=await readJSON(path.join(root,'library-contract.json')),integrity=await readJSON(path.join(library,'cdn/integrity.json'));
assert.equal(pendingContract.revision,candidateRevision);assert.equal(pendingContract.cdn.baseUrl,'https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@'+candidateRevision+'/cdn/');
assert.equal(pendingContract.cdn.globalIntegrity,integrity.files[pendingContract.cdn.global].integrity);assert.equal(pendingContract.cdn.styleIntegrity,integrity.files[pendingContract.cdn.style].integrity);
assert.equal(sha256(await readFile(path.join(root,candidateDirectory,'accepted-library-contract.json'))),'c0596f2135788375d041e044ca3b7ad476e179622bae76d7423b6a0e00b3e460');
const candidateFiles={};for(const p of [...new Set(candidatePaths)].sort())candidateFiles[p]=sha256(await readFile(await safeFile(root,p)));
const lock={
 format:'inform-skill-candidate-inputs/1',candidateOnly:true,stage:'pending-acceptance',libraryRepository:'Micraow/Inform-UI',sourceRevision:candidateRevision,sourceTree:tree,acceptedAssetRevision:acceptedRevision,
 skillBaseRevision:'8f52c9f260d06326da03b962fb344924898c4b4c',priorSkillCandidateRevision:'94b5cd14a7f47fc477ee781cec06e0e6810a7169',priorSourceRevision:'75fd165f20ee6cca9beb2c172c19dbac98136b88',
 manifestSha256:sha256(await readFile(path.join(root,candidateDirectory,'manifest30.source.json'))),canonicalCount:30,protocolNodeCount:90,
 fullSchema:{path:'src/schema/iui.schema.json',sha256:sourceFiles['src/schema/iui.schema.json']},sourceIndex:{path:'src/schema/fragments/index.json',sha256:sourceFiles['src/schema/fragments/index.json']},sourceFiles,runtimeFiles,candidateFiles,
 formalAcceptedContractSha256:sha256(await readFile(path.join(root,candidateDirectory,'accepted-library-contract.json'))),pendingContractSha256:sha256(await readFile(path.join(root,'library-contract.json'))),verification:{sourceOnly:true,browser:'not-run',cdn:'not-run',ci:'not-run',publicAssetPromotion:false},
 browserPreparation:{status:'prepared-not-run',skillBaseRevision:'94b5cd14a7f47fc477ee781cec06e0e6810a7169',executionOwner:'core:scripts/run-batch-consumers.mjs',consumerPlan:candidateDirectory+'/consumer-plan.json',examples:32,plannedLocalCompiledViews:192,existingExamples:15,duplicateInputs:0,exampleLanguages:'references/example-languages.json'},
 provenance:{originalExamples:'Project-owned MIT synthetic fixtures; exact committed bytes, no private captures.',sourceVerification:'Each source blob matched the exact Git revision before hashing; all recovery production/build paths matched the distinct immutable recovery proof. Historical source tests are not new-runtime acceptance.',recoveryBuildProof:recoveryPath,recoveryBuildProofSha256:sha256(await readFile(path.join(root,recoveryPath))),recoveryPreviousAssetRevision:recovery.previousAssetRevision,ownerEvidence:'docs/local-enhancements-90.json',ownerPreviousFullNode:evidence.previousFullNode,ownerFinalTwoImpactBeforeFormsRepair:evidence.finalTwoImpactBeforeFormsRepair,ownerFinalFormsAndSharedImpact:evidence.finalFormsAndSharedImpact,ownerFormsFailureControl:evidence.formsFailureControl,ownerAggregateBoundary:evidence.note,reproduction:'node scripts/generate-pending-lock.mjs --source-repository REPO --library CLEAN_ASSET_CHECKOUT --revision '+candidateRevision+' --check'},
 items:manifest.items.map(i=>({...i,examples:i.examples.map(sourcePath=>({sourcePath,candidatePath:candidateDirectory+'/'+sourcePath})),groups:[...new Set(i.nodeTypes.map(n=>index.nodeOwners[n]))].sort()})),
 historicalGuidancePrefixes:{'SKILL.md':{bytes:55869,sha256:'377dbee612fd436982c7a26cb2d48e2fd253221e2be861764acdbe6086a4ac72'},'WEB-CHAT-GUIDE.md':{bytes:64530,sha256:'86d046a1d7468f16bab263061e319c7d228da38c647298effac210d78402d8ab'}}
};
for(const [name,value]of [['library-candidate-lock.json',lock],['category-index.json',deriveCategories(index,lock)]]){
 const file=path.join(root,candidateDirectory,name),bytes=JSON.stringify(value,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(await readFile(file,'utf8'),bytes,'Generated candidate artifact drift: '+name);else await writeFile(file,bytes);
}
console.log('PASS reproduced exact final30 source/artifact lock and generated category index; no build, fetch, browser, CI, or acceptance promotion');
