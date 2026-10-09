/** Reproduce source-only locks from the exact existing Git object; never fetch or build. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root} from './check-skill.mjs';
import {candidateDirectory,acceptedRevision,candidateRevision,readJSON,safeFile,sha256,deriveCategories} from './pending-inputs.mjs';
const arg=flag=>{const i=process.argv.indexOf(flag);assert.ok(i>=0&&process.argv[i+1]&&!process.argv[i+1].startsWith('--'),'Required '+flag);return process.argv[i+1];};
const repository=path.resolve(arg('--source-repository')),library=path.resolve(arg('--library'));
assert.equal(arg('--revision'),candidateRevision);
const git=(...args)=>execFileSync('git',['-C',repository,...args],{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
assert.equal(git('rev-parse',candidateRevision+'^{commit}'),candidateRevision);
const tree=git('rev-parse',candidateRevision+'^{tree}');
assert.equal(tree,'1903e14fc97ee4dc50ed62e1fe0414706094a38e');
const entries=git('ls-tree','-r',candidateRevision).split('\n').map(line=>{const m=line.match(/^(\d+) blob ([a-f0-9]{40})\t(.+)$/);assert.ok(m,'Source tree must contain ordinary files only');return{mode:m[1],oid:m[2],path:m[3]};});
const manifest=await readJSON(path.join(root,candidateDirectory,'manifest24.source.json'));
assert.equal(manifest.sourceRevision,candidateRevision);assert.equal(manifest.candidateOnly,true);assert.equal(manifest.acceptedAssetRevision,acceptedRevision);assert.equal(manifest.items.length,24);
const previousManifest=await readJSON(path.join(root,candidateDirectory,'manifest.source.json'));
assert.deepEqual(manifest.items.slice(0,20),previousManifest.items);
const docs=['docs/date-field.md','docs/local-enhancements-80.md','docs/local-enhancements-80.json','docs/local-enhancements-84.md','docs/local-enhancements-84.json'];
const explicit=new Set(['LICENSE','THIRD_PARTY_NOTICES.md','package.json','package-lock.json','tsconfig.json','scripts/build.mjs','scripts/generate-schema.mjs','scripts/schema-subsets.mjs','scripts/math-assets.mjs',...docs,...manifest.items.flatMap(x=>[x.contract,...x.examples])]);
const selected=entries.filter(x=>x.path.startsWith('src/')||x.path.startsWith('bin/')||explicit.has(x.path));
for(const p of explicit)assert.ok(selected.some(x=>x.path===p),'Missing expected source '+p);
const sourceFiles={};
for(const entry of selected){
 assert.ok(entry.mode==='100644'||entry.mode==='100755','No source symlinks');
 const bytes=await readFile(await safeFile(library,entry.path));
 const oid=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(oid,entry.oid,'Library bytes differ from exact committed source: '+entry.path);
 sourceFiles[entry.path]=sha256(bytes);
}
const ownerEvidence=await readJSON(path.join(library,'docs/local-enhancements-84.json'));
assert.deepEqual(ownerEvidence.fullNodeAttempt,{tests:808,passed:807,failed:1,skipped:0,todo:0});
assert.deepEqual(ownerEvidence.correction.retest,{tests:16,passed:16});
const runtimeFiles={};for(const p of ['dist/index.js','dist/browser.js','dist/standalone.js','dist/style.css']){
 runtimeFiles[p]=sha256(await readFile(await safeFile(library,p)));
 assert.equal(runtimeFiles[p],ownerEvidence.finalSourceAndBuildSha256[p],'Rebuilt artifact must match exact core24 evidence: '+p);
}
const index=await readJSON(path.join(library,'src/schema/fragments/index.json'));
assert.equal(Object.keys(index.nodeOwners).length,84);
const candidatePaths=['SKILL.md','WEB-CHAT-GUIDE.md','references/pending-learning.md','scripts/pending-inputs.mjs','scripts/generate-pending-lock.mjs','scripts/verify-pending-batch.mjs','scripts/check-pending24.mjs','tests/pending-batch.test.mjs',candidateDirectory+'/README.md',candidateDirectory+'/manifest.source.json',candidateDirectory+'/manifest24.source.json',candidateDirectory+'/invalid.json',...manifest.items.flatMap(x=>x.examples.map(p=>candidateDirectory+'/'+p))];
const candidateFiles={};for(const p of [...new Set(candidatePaths)].sort())candidateFiles[p]=sha256(await readFile(await safeFile(root,p)));
const lock={format:'inform-skill-candidate-inputs/1',candidateOnly:true,libraryRepository:'Micraow/Inform-UI',sourceRevision:candidateRevision,sourceTree:tree,acceptedAssetRevision:acceptedRevision,skillBaseRevision:'8f52c9f260d06326da03b962fb344924898c4b4c',priorSkillCandidateRevision:'ae3dad015e0b361c7b4abdf738060acb26e8a04d',priorSourceRevision:'c58eeb56961f921b063c8423b799b9bcab9658c0',manifestSha256:sha256(await readFile(path.join(root,candidateDirectory,'manifest24.source.json'))),canonicalCount:24,protocolNodeCount:84,fullSchema:{path:'src/schema/iui.schema.json',sha256:sourceFiles['src/schema/iui.schema.json']},sourceIndex:{path:'src/schema/fragments/index.json',sha256:sourceFiles['src/schema/fragments/index.json']},sourceFiles,runtimeFiles,candidateFiles,formalAcceptedContractSha256:sha256(await readFile(path.join(root,'library-contract.json'))),verification:{sourceOnly:true,browser:'not-run',cdn:'not-run',ci:'not-run',publicAssetPromotion:false},provenance:{originalExamples:'Project-owned MIT-licensed synthetic fixtures; exact committed bytes, no private captures.',sourceVerification:'Each source blob matched the exact Git revision before hashing; runtime bytes match the frozen owner evidence.',ownerEvidence:'docs/local-enhancements-84.json',ownerFullNodeAttempt:ownerEvidence.fullNodeAttempt,ownerFocusedCorrection:ownerEvidence.correction.retest,reproduction:'node scripts/generate-pending-lock.mjs --source-repository REPO --library BUILT_ARCHIVE --revision '+candidateRevision+' --check'},items:manifest.items.map(i=>({...i,examples:i.examples.map(sourcePath=>({sourcePath,candidatePath:candidateDirectory+'/'+sourcePath})),groups:[...new Set(i.nodeTypes.map(n=>index.nodeOwners[n]))].sort()})),acceptedGuidancePrefixes:{'SKILL.md':{bytes:55869,sha256:'377dbee612fd436982c7a26cb2d48e2fd253221e2be861764acdbe6086a4ac72'},'WEB-CHAT-GUIDE.md':{bytes:64530,sha256:'86d046a1d7468f16bab263061e319c7d228da38c647298effac210d78402d8ab'}}};
for(const [p,x]of Object.entries(lock.acceptedGuidancePrefixes))assert.equal(sha256((await readFile(path.join(root,p))).subarray(0,x.bytes)),x.sha256);
for(const [name,value]of [['library-candidate-lock.json',lock],['category-index.json',deriveCategories(index,lock)]]){
 const file=path.join(root,candidateDirectory,name),bytes=JSON.stringify(value,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(await readFile(file,'utf8'),bytes,'Generated candidate artifact drift: '+name);else await writeFile(file,bytes);
}
console.log('PASS reproduced exact core24 source/artifact lock and generated category index; no build, fetch, browser, CI, or promotion');
