import test from'node:test';import assert from'node:assert/strict';import{mkdtemp,mkdir,readFile,writeFile,rm,realpath}from'node:fs/promises';import os from'node:os';import path from'node:path';import{createHash}from'node:crypto';import{verifyLockedRuntime}from'../scripts/verify-locked-runtime.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
test('Safe runtime closure verifies a plain directory without Git or repository guidance',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'inform-safe-lock-'));
 try{
  const names=['dist/browser.js','dist/index.js','dist/style.css','cdn/iui.min.js','cdn/iui.css','src/schema/iui.schema.json','src/schema/fragments/base.schema.json','src/schema/fragments/index.json'];
  const files=[];for(const name of names){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),'fixed');files.push({path:name,bytes:5,sha256:hash('fixed')})}
  const records=files.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
  const lock={format:'inform-recovered-consumer-lock/1',protocolNodes:118,newCanonicalId:'recommendation-card',nativeScenariosExecuted:0,publicCdnVerified:false,sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),files,safeRecovery:{format:'inform-safe-file-closure/1',wholeTreeGitVerification:false,verifiedFiles:files.length,verifiedContentSha256:hash(JSON.stringify(records))}};
  const options={protocolNodes:118,newCanonicalId:'recommendation-card'};assert.equal(await verifyLockedRuntime(root,lock,options),await realpath(root));
  lock.safeRecovery.verifiedContentSha256='0'.repeat(64);await assert.rejects(verifyLockedRuntime(root,lock,options),/Safe file-closure identity/);
 }finally{await rm(root,{recursive:true,force:true})}
});
test('Every safe candidate keeps original provenance and its own explicit content identity',async()=>{
 for(const [candidate,expected]of [['recovered-card-group',813],['recovered-transaction-detail',824],['recovered-recommendation',837]]){
  const lock=JSON.parse(await readFile(new URL('../candidates/'+candidate+'/runtime-lock.safe.json',import.meta.url)));
  assert.equal(lock.files.length,expected);assert.equal(lock.safeRecovery.omittedInstructionFiles,1);assert.equal(lock.safeRecovery.wholeTreeGitVerification,false);
  assert.match(lock.sourceCommit,/^[a-f0-9]{40}$/);assert.match(lock.safeRecovery.originalLockSha256,/^[a-f0-9]{64}$/);
  assert.equal(lock.files.some(f=>/guidance/i.test(f.path)),false);
 }
});
