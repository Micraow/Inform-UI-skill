import test from 'node:test';import assert from 'node:assert/strict';import{mkdtemp,mkdir,readFile,writeFile,rm}from'node:fs/promises';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import{tmpdir}from'node:os';import path from'node:path';import{verifyUpcomingEighteenManifest}from'../scripts/verify-consumer-reuse.mjs';
const root=path.resolve(import.meta.dirname,'..'),base='candidates/upcoming-eighteen/',hash=b=>createHash('sha256').update(b).digest('hex'),git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'Synthetic Test',GIT_AUTHOR_EMAIL:'test@example.invalid',GIT_COMMITTER_NAME:'Synthetic Test',GIT_COMMITTER_EMAIL:'test@example.invalid'}}).trim();
async function fixture(){const skillRoot=await mkdtemp(path.join(tmpdir(),'inform115-reuse-')),raw=await readFile(path.join(root,base,'consumer-manifest.json')),manifest=JSON.parse(raw),files=['consumer-manifest.json','consumer.source.mjs',...manifest.examples.map(e=>'examples/'+e.name+'.json')];for(const file of files){const at=path.join(skillRoot,base,file);await mkdir(path.dirname(at),{recursive:true});await writeFile(at,await readFile(path.join(root,base,file)));}git(skillRoot,'init','-q');git(skillRoot,'add','.');git(skillRoot,'commit','-qm','Synthetic exact candidate inputs');const plan={id:'upcoming-eighteen',skillManifestPath:base+'consumer-manifest.json',skillManifestSha256:hash(raw),scriptSha256:hash(await readFile(path.join(root,base,'consumer.source.mjs'))),widths:manifest.widths,themes:manifest.themes,examples:manifest.examples.map(e=>({name:e.name,sha256:e.sha256}))};return{skillRoot,plan,assetRevision:manifest.sourceRevision,manifest};}
test('exact candidate manifest binds ten same-byte examples and locale map',async()=>{const f=await fixture();try{const result=await verifyUpcomingEighteenManifest(f);assert.equal(Object.keys(result.paths).length,10);assert.equal(result.paths['entity-facts'],base+'examples/entity-facts.json');assert.equal(result.languages['entity-facts'],'en');}finally{await rm(f.skillRoot,{recursive:true,force:true});}});
for(const[name,mutate]of[
 ['missing manifest path',async f=>delete f.plan.skillManifestPath],
 ['missing manifest file',async f=>rm(path.join(f.skillRoot,f.plan.skillManifestPath))],
 ['wrong manifest path',async f=>f.plan.skillManifestPath='references/example-languages.json'],
 ['wrong manifest digest',async f=>f.plan.skillManifestSha256='0'.repeat(64)],
 ['altered candidate example',async f=>writeFile(path.join(f.skillRoot,base,'examples/entity-facts.json'),'{}')],
 ['wrong source revision',async f=>f.assetRevision='0'.repeat(40)],
 ['wrong widths',async f=>f.plan.widths=[390]],
 ['wrong themes',async f=>f.plan.themes=['light']],
 ['wrong candidate group',async f=>f.plan.id='other'],
 ['wrong source runner hash',async f=>f.plan.scriptSha256='0'.repeat(64)],
 ['wrong planned example digest',async f=>f.plan.examples[0].sha256='0'.repeat(64)]
])test('candidate receipt rejects '+name,async()=>{const f=await fixture();try{await mutate(f);await assert.rejects(()=>verifyUpcomingEighteenManifest(f));}finally{await rm(f.skillRoot,{recursive:true,force:true});}});

test('alphabetically ordered core plans preserve exact candidate set binding',async()=>{const f=await fixture();try{f.plan.examples.sort((a,b)=>a.name.localeCompare(b.name));const result=await verifyUpcomingEighteenManifest(f);assert.equal(Object.keys(result.paths).length,10);}finally{await rm(f.skillRoot,{recursive:true,force:true});}});

test('actual generated core115 plan metadata/order resolves the current exact Skill candidate',async()=>{const regression=JSON.parse(await readFile(path.join(root,'tests/fixtures/upcoming-eighteen-core-plan.json'),'utf8'));assert.equal(regression.preparedInputOnly,true);assert.equal(regression.source,'Inform-UI/tests/consumer/batch-lock-115.json');const result=await verifyUpcomingEighteenManifest({plan:regression.plan,assetRevision:regression.assetRevision,skillRoot:root});assert.equal(Object.keys(result.paths).length,10);assert.deepEqual(regression.plan.exampleLanguages,result.languages);});
