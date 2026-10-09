import test from 'node:test';import assert from 'node:assert/strict';
import{mkdtemp,mkdir,writeFile,readFile,rm,symlink}from'node:fs/promises';import path from'node:path';import{tmpdir}from'node:os';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';
import{verifyConsumerReuse,reusableInlineRecord}from'../scripts/verify-consumer-reuse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(root,args)=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'Synthetic CI Test',GIT_AUTHOR_EMAIL:'test@example.invalid',GIT_COMMITTER_NAME:'Synthetic CI Test',GIT_COMMITTER_EMAIL:'test@example.invalid'}});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
async function write(root,name,value){const file=path.join(root,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,value);}
async function repository(root){await mkdir(root);git(root,['init','-q']);}
function commit(root){git(root,['add','.']);git(root,['commit','-qm','Original synthetic receipt fixture']);return {revision:git(root,['rev-parse','HEAD']),tree:git(root,['rev-parse','HEAD^{tree}'])};}
async function fixture(language='zh-CN'){
 const root=await mkdtemp(path.join(tmpdir(),'inform-reuse-test-')),core=path.join(root,'core'),library=path.join(root,'library'),skill=path.join(root,'skill'),evidence=path.join(root,'evidence');
 for(const p of[core,library,skill])await repository(p);
 const cdn='original synthetic CDN bytes',integrity=JSON.stringify({files:{'synthetic.js':{bytes:Buffer.byteLength(cdn),sha256:sha(cdn),integrity:'sha384-'+createHash('sha384').update(cdn).digest('base64')}}}),schema='{"original":"synthetic schema"}\n',input='{"version":"iui/1","body":[{"type":"text","value":"Original synthetic"}]}\n',script='// Original synthetic consumer identity only; not a browser test result.\n';
 for(const p of[core,library]){await write(p,'.gitignore','dist/\n');for(const name of ['index.js','browser.js','standalone.js','style.css'])await write(p,'dist/'+name,'synthetic runtime '+name);await write(p,'cdn/synthetic.js',cdn);await write(p,'cdn/integrity.json',integrity);await write(p,'src/schema/iui.schema.json',schema);}
 await write(skill,'examples/synthetic.json',input);await write(skill,'references/example-languages.json',JSON.stringify({synthetic:language}));const asset=commit(library),s=commit(skill);await write(core,'tests/consumer/scripts/synthetic.mjs',script);await write(core,'tests/consumer/examples/synthetic.json',input);
 const lock={format:'inform-ui-batch-lock/1',assetRevision:asset.revision,assetTree:asset.tree,skillRevision:s.revision,skillTree:s.tree,integritySha256:sha(integrity),schemaSha256:sha(schema),consumers:[{id:'synthetic',script:'tests/consumer/scripts/synthetic.mjs',scriptSha256:sha(script),exampleLanguages:{synthetic:language},widths:[390,768,1100],themes:['light','dark'],examples:[{name:'synthetic',corePath:'tests/consumer/examples/synthetic.json',sha256:sha(input)}]}]};
 const lockPath=path.join(core,'tests/consumer/batch-lock.json');await writeFile(lockPath,JSON.stringify(lock));const c=commit(core);
 const report={revision:c.revision,browser:'chromium',exampleLanguages:{synthetic:language},localCompiledViews:6,widths:[390,768,1100],themes:['light','dark'],publicCdn:'not-run'},reportBytes=JSON.stringify(report);await write(evidence,'run/RESULTS.json',reportBytes);
 // A bounded signature fixture tests evidence binding, not image decoding or vision.
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('original synthetic signature fixture')]),screenshots={};
 for(const theme of['light','dark'])for(const width of[390,768,1100]){const name=`synthetic-${theme}-${width}.png`;await write(evidence,'run/'+name,png);screenshots[name]=sha(png);}
 const proof={format:'inform-ui-build-equivalence/1',coreRevision:c.revision,assetRevision:asset.revision,sourceTree:git(core,['rev-parse','HEAD:src']),buildInputPaths:['src','bin','package.json','package-lock.json','tsconfig.json','LICENSE','THIRD_PARTY_NOTICES.md','scripts/build.mjs','scripts/build-cdn.mjs','scripts/math-assets.mjs','scripts/generate-schema.mjs','scripts/schema-subsets.mjs','scripts/schema-subset.mjs'],distSha256:Object.fromEntries(['index.js','browser.js','standalone.js','style.css'].map(name=>['dist/'+name,sha('synthetic runtime '+name)])),cdnSha256:{'cdn/synthetic.js':sha(cdn)},integritySha256:sha(integrity)},proofBytes=JSON.stringify(proof);await write(evidence,'BUILD-EQUIVALENCE.json',proofBytes);
 const receipt={buildProofSha256:sha(proofBytes),format:'inform-ui-consumer-reuse/1',assetRevision:asset.revision,coreRevision:c.revision,coreTree:c.tree,skillRevision:s.revision,skillTree:s.tree,integritySha256:sha(integrity),schemaSha256:sha(schema),consumers:[{id:'synthetic',status:'passed',scriptSha256:sha(script),exampleLanguages:{synthetic:language},evidenceDirectory:'run',reportSha256:sha(reportBytes),examples:[{name:'synthetic',sha256:sha(input)}],screenshots}]},receiptPath=path.join(evidence,'receipt.json');await writeFile(receiptPath,JSON.stringify(receipt));
 return {root,core,library,skill,evidence,lockPath,receiptPath,receipt,report,proof,options:{receiptPath,lockPath,coreRoot:core,coreRevision:c.revision,libraryRoot:library,skillRoot:skill}};
}
for(const language of ['zh-CN','en'])test('exact committed anchors, bytes and '+language+' evidence produce inline-only reuse',async()=>{const f=await fixture(language);try{const r=await verifyConsumerReuse(f.options);assert.deepEqual([...r.names],['synthetic']);assert.equal(r.records[0].mode,'inline');assert.equal(r.records[0].lang,language);assert.equal(r.cdnsReused,0);}finally{await rm(f.root,{recursive:true,force:true});}});
for(const [name,mutate]of[
 ['stale core revision',r=>r.coreRevision='0'.repeat(40)],['wrong tree',r=>r.coreTree='0'.repeat(40)],['wrong asset',r=>r.assetRevision='0'.repeat(40)],['wrong Skill',r=>r.skillRevision='0'.repeat(40)],['wrong manifest',r=>r.integritySha256='0'.repeat(64)],['wrong schema',r=>r.schemaSha256='0'.repeat(64)],['missing consumer',r=>r.consumers=[]],['duplicate consumer',r=>r.consumers.push(structuredClone(r.consumers[0]))],['not passed',r=>r.consumers[0].status='pending'],['changed script',r=>r.consumers[0].scriptSha256='0'.repeat(64)],['changed JSON',r=>r.consumers[0].examples[0].sha256='0'.repeat(64)],['parent traversal',r=>r.consumers[0].evidenceDirectory='../outside'],['absolute path',r=>r.consumers[0].evidenceDirectory='/tmp'],['Windows traversal',r=>r.consumers[0].evidenceDirectory='..\\outside'],['missing image record',r=>delete r.consumers[0].screenshots['synthetic-light-390.png']],['wrong image hash',r=>r.consumers[0].screenshots['synthetic-light-390.png']='0'.repeat(64)],['wrong report hash',r=>r.consumers[0].reportSha256='0'.repeat(64)]])test('reject '+name,async()=>{const f=await fixture();try{mutate(f.receipt);await writeFile(f.receiptPath,JSON.stringify(f.receipt));await assert.rejects(()=>verifyConsumerReuse(f.options));}finally{await rm(f.root,{recursive:true,force:true});}});
for(const [name,mutate]of[
 ['missing screenshot',async f=>rm(path.join(f.evidence,'run/synthetic-light-390.png'))],['missing RESULTS',async f=>rm(path.join(f.evidence,'run/RESULTS.json'))],['dirty source',async f=>write(f.core,'tests/consumer/scripts/synthetic.mjs','changed')],['wrong workflow expected head',async f=>{f.options.coreRevision='f'.repeat(40);}],['missing committed lock',async f=>{const p=path.join(f.evidence,'external-lock.json');await writeFile(p,await readFile(f.lockPath));f.options.lockPath=p;}],['symlink evidence',async f=>{const p=path.join(f.evidence,'run/synthetic-light-390.png');await rm(p);await symlink(path.join(f.evidence,'run/synthetic-dark-390.png'),p);}],['partial views despite updated digest',async f=>{f.report.localCompiledViews=5;const b=JSON.stringify(f.report);await write(f.evidence,'run/RESULTS.json',b);f.receipt.consumers[0].reportSha256=sha(b);await writeFile(f.receiptPath,JSON.stringify(f.receipt));}],['stale actual report revision',async f=>{f.report.revision='0'.repeat(40);const b=JSON.stringify(f.report);await write(f.evidence,'run/RESULTS.json',b);f.receipt.consumers[0].reportSha256=sha(b);await writeFile(f.receiptPath,JSON.stringify(f.receipt));}],['wrong browser report',async f=>{f.report.browser='unknown';const b=JSON.stringify(f.report);await write(f.evidence,'run/RESULTS.json',b);f.receipt.consumers[0].reportSha256=sha(b);await writeFile(f.receiptPath,JSON.stringify(f.receipt));}],['CDN evidence mislabeled as reusable inline',async f=>{f.report.publicCdn='passed';const b=JSON.stringify(f.report);await write(f.evidence,'run/RESULTS.json',b);f.receipt.consumers[0].reportSha256=sha(b);await writeFile(f.receiptPath,JSON.stringify(f.receipt));}]
])test('reject '+name,async()=>{const f=await fixture();try{await mutate(f);await assert.rejects(()=>verifyConsumerReuse(f.options));}finally{await rm(f.root,{recursive:true,force:true});}});

for(const [name,mutate] of [
 ['missing receipt locale',record=>delete record.exampleLanguages],
 ['wrong receipt locale',record=>record.exampleLanguages.synthetic='en'],
 ['extra receipt locale',record=>record.exampleLanguages.other='zh-CN']
])test('reject '+name,async()=>{const f=await fixture();try{mutate(f.receipt.consumers[0]);await writeFile(f.receiptPath,JSON.stringify(f.receipt));await assert.rejects(()=>verifyConsumerReuse(f.options),/locale mismatch/);}finally{await rm(f.root,{recursive:true,force:true});}});
for(const [name,mutate] of [
 ['missing report locale',report=>delete report.exampleLanguages],
 ['wrong report locale with updated hash',report=>report.exampleLanguages.synthetic='en'],
 ['extra report locale with updated hash',report=>report.exampleLanguages.other='zh-CN']
])test('reject '+name,async()=>{const f=await fixture();try{mutate(f.report);const bytes=JSON.stringify(f.report);await write(f.evidence,'run/RESULTS.json',bytes);f.receipt.consumers[0].reportSha256=sha(bytes);await writeFile(f.receiptPath,JSON.stringify(f.receipt));await assert.rejects(()=>verifyConsumerReuse(f.options),/RESULTS example locale mismatch/);}finally{await rm(f.root,{recursive:true,force:true});}});
for(const [name,mutate] of [
 ['missing committed plan locale',plan=>delete plan.exampleLanguages],
 ['wrong committed plan locale',plan=>plan.exampleLanguages.synthetic='en'],
 ['extra committed plan locale',plan=>plan.exampleLanguages.other='zh-CN']
])test('reject '+name,async()=>{const f=await fixture();try{
 const lock=JSON.parse(await readFile(f.lockPath,'utf8'));mutate(lock.consumers[0]);await writeFile(f.lockPath,JSON.stringify(lock));const next=commit(f.core);
 f.proof.coreRevision=next.revision;const proofBytes=JSON.stringify(f.proof);await write(f.evidence,'BUILD-EQUIVALENCE.json',proofBytes);f.receipt.buildProofSha256=sha(proofBytes);
 f.options.coreRevision=next.revision;f.receipt.coreRevision=next.revision;f.receipt.coreTree=next.tree;f.report.revision=next.revision;
 const bytes=JSON.stringify(f.report);await write(f.evidence,'run/RESULTS.json',bytes);f.receipt.consumers[0].reportSha256=sha(bytes);await writeFile(f.receiptPath,JSON.stringify(f.receipt));
 await assert.rejects(()=>verifyConsumerReuse(f.options),/languages required|planned language|locale mismatch/);
 }finally{await rm(f.root,{recursive:true,force:true});}});

test('CDN mode cannot be skipped by exact same-byte, same-locale inline receipt',async()=>{const f=await fixture('zh-CN');try{
 const verified=await verifyConsumerReuse(f.options);
 assert.equal(reusableInlineRecord(verified,{name:'synthetic',mode:'cdn',lang:'zh-CN'}),null);
 assert.equal(reusableInlineRecord(verified,{name:'synthetic',mode:'inline',lang:'zh-CN'}).name,'synthetic');
 assert.throws(()=>reusableInlineRecord(verified,{name:'synthetic',mode:'inline',lang:'en'}),/locale mismatch/);
 assert.throws(()=>reusableInlineRecord(verified,{name:'synthetic',mode:'inline',lang:'fr'}),/en\/zh-CN/);
 }finally{await rm(f.root,{recursive:true,force:true});}});

for(const [name,mutate] of [
 ['missing build proof',async f=>rm(path.join(f.evidence,'BUILD-EQUIVALENCE.json'))],
 ['changed proof bytes',async f=>write(f.evidence,'BUILD-EQUIVALENCE.json','{}')],
 ['missing proof hash',async f=>{delete f.receipt.buildProofSha256;}],
 ['changed ignored core runtime',async f=>write(f.core,'dist/index.js','changed runtime')],
 ['changed ignored asset runtime',async f=>write(f.library,'dist/index.js','changed runtime')],
 ['extra ignored runtime',async f=>write(f.core,'dist/extra.js','extra runtime')],
 ['missing ignored runtime',async f=>rm(path.join(f.core,'dist/index.js'))],
 ['runtime symlink',async f=>{await rm(path.join(f.core,'dist/index.js'));await symlink(path.join(f.library,'dist/index.js'),path.join(f.core,'dist/index.js'));}],
 ['proof symlink',async f=>{await write(f.evidence,'original-proof.json',JSON.stringify(f.proof));await rm(path.join(f.evidence,'BUILD-EQUIVALENCE.json'));await symlink(path.join(f.evidence,'original-proof.json'),path.join(f.evidence,'BUILD-EQUIVALENCE.json'));}]
])test('reject '+name,async()=>{const f=await fixture();try{await mutate(f);await writeFile(f.receiptPath,JSON.stringify(f.receipt));await assert.rejects(()=>verifyConsumerReuse(f.options));}finally{await rm(f.root,{recursive:true,force:true});}});
for(const [name,mutate]of[
 ['core anchor',p=>p.coreRevision='0'.repeat(40)],['asset anchor',p=>p.assetRevision='0'.repeat(40)],['source anchor',p=>p.sourceTree='0'.repeat(40)],['manifest anchor',p=>p.integritySha256='0'.repeat(64)],['build input scope',p=>p.buildInputPaths=['src']],['CDN map',p=>p.cdnSha256={}],['runtime map',p=>p.distSha256['dist/index.js']='0'.repeat(64)]
])test('reject rehashed build proof with wrong '+name,async()=>{const f=await fixture();try{mutate(f.proof);const bytes=JSON.stringify(f.proof);await write(f.evidence,'BUILD-EQUIVALENCE.json',bytes);f.receipt.buildProofSha256=sha(bytes);await writeFile(f.receiptPath,JSON.stringify(f.receipt));await assert.rejects(()=>verifyConsumerReuse(f.options));}finally{await rm(f.root,{recursive:true,force:true});}});
