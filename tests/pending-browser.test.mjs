/** Source contract tests only. Importing the consumer must never launch Chromium. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,mkdir,writeFile,rm,symlink,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {root} from '../scripts/check-skill.mjs';
import {sha256,readJSON,candidateDirectory} from '../scripts/pending-inputs.mjs';
import {examples,widths,themes,sourceRevision,executionOwner,verifyExampleInputs,parseOptions} from '../candidates/pending-batch/verify-browser.mjs';
const base=path.join(root,candidateDirectory);
const read=p=>readJSON(path.join(base,p));

test('prepared Chromium consumer is exact 32-example/30-contract ownership, never execution evidence',async()=>{
 const plan=await read('consumer-plan.json'),manifest=await read('manifest30.source.json');
 assert.equal(plan.status,'prepared-not-run');assert.equal(plan.browser,'not-run');assert.equal(plan.ci,'not-run');assert.equal(plan.publicCdn,'not-run');
 assert.equal(plan.executionOwner,executionOwner);assert.equal(executionOwner,'core:scripts/run-batch-consumers.mjs');
 assert.equal(sourceRevision,manifest.sourceRevision);assert.equal(plan.sourceRevision,sourceRevision);
 assert.equal(examples.length,32);assert.equal(new Set(examples.flatMap(x=>x.canonicalIds)).size,30);
 assert.deepEqual(widths,[390,768,1100]);assert.deepEqual(themes,['light','dark']);assert.equal(plan.plannedLocalCompiledViews,192);
 assert.deepEqual(plan.examples.map(({owner,skillPath,corePath,futureSkillPath,...x})=>x),examples);
 assert.deepEqual(examples.map(e=>'examples/'+e.name+'.json'),[...new Set(manifest.items.flatMap(i=>i.examples))]);
 assert.equal(plan.acceptedAssetRevision,'d370ffb2df310fce0da9299e6e254a58509ba544');
 assert.equal(plan.skillBaseRevision,'94b5cd14a7f47fc477ee781cec06e0e6810a7169');
});

test('candidate native smoke reads exact source bytes and preserves the input objects',async()=>{
 const documents=await verifyExampleInputs();const lock=await read('library-candidate-lock.json');
 assert.equal(documents.size,32);
 for(const entry of examples){
  assert.equal(entry.sha256,lock.sourceFiles['examples/'+entry.name+'.json']);
  const bytes=await readFile(path.join(base,'examples',entry.name+'.json'));
  assert.equal(sha256(bytes),entry.sha256);assert.deepEqual(documents.get(entry.name),JSON.parse(bytes));
 }
});

test('ownership comparison retains 15 existing consumers, no duplicate names or same-byte reruns',async()=>{
 const plan=await read('consumer-plan.json'),comparison=plan.existingConsumerComparison;
 assert.equal(comparison.sourceRevision,sourceRevision);assert.equal(comparison.examples.length,15);
 assert.deepEqual(comparison.byteIdenticalOverlaps,[]);assert.deepEqual(comparison.nameOverlaps,[]);
 const all=[...examples,...comparison.examples];
 assert.equal(new Set(all.map(e=>e.name)).size,47);assert.equal(new Set(all.map(e=>e.sha256)).size,47);
 for(const example of plan.examples){
  assert.equal(example.owner,'pending');assert.equal(example.skillPath,candidateDirectory+'/examples/'+example.name+'.json');
  assert.equal(example.corePath,'tests/consumer/pending/examples/'+example.name+'.json');
  assert.equal(example.futureSkillPath,'examples/'+example.name+'.json');
 }
});

test('consumer arguments require actual SHA and reject unknown, duplicate, missing or short revision',()=>{
 const args=['--library','.','--revision','f'.repeat(40),'--screenshots','artifacts/pending'];
 assert.equal(parseOptions(args).revision,'f'.repeat(40));
 for(const bad of [[],args.slice(0,4),[...args,'--run','yes'],args.map(x=>x==='--screenshots'?'--library':x),args.map(x=>x==='f'.repeat(40)?'75fd165':x),args.map(x=>x==='--screenshots'?'--force':x)])assert.throws(()=>parseOptions(bad));
});

test('input verification rejects changed bytes before any browser dependency is loaded',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'pending-input-negative-'));
 try{await mkdir(path.join(dir,'examples'));await writeFile(path.join(dir,'examples',examples[0].name+'.json'),'{}\n');await assert.rejects(verifyExampleInputs(dir),/Candidate example changed/);}
 finally{await rm(dir,{recursive:true,force:true});}
});

test('input verification refuses fixture symlinks rather than trusting a matching target',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'pending-input-link-'));
 try{
  await mkdir(path.join(dir,'examples'));const target=path.join(dir,'original.json');await copyFile(path.join(base,'examples',examples[0].name+'.json'),target);
  try{await symlink(target,path.join(dir,'examples',examples[0].name+'.json'));}catch(error){if(error.code==='EPERM'){t.skip('This platform does not permit unprivileged symlinks');return;}throw error;}
  await assert.rejects(verifyExampleInputs(dir),/Input symlink refused/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('smoke source has native input, strict report, truthful limits and no route/DOM-click substitutions',async()=>{
 const source=await readFile(path.join(base,'verify-browser.mjs'),'utf8');
 for(const entry of examples)assert.ok(source.includes("case '"+entry.name+"':"),'Missing explicit smoke '+entry.name);
 for(const required of ['page.mouse.click','page.keyboard.press','page.keyboard.insertText','toBeDisabled','toBeFocused','toHaveCount(1)','document.documentElement.scrollWidth<=innerWidth+1',"context.on('request'", "page.on('pageerror'",'fullPage:true',"{flag:'wx'}",'Clean core checkout required','Fresh empty evidence directory required'])assert.ok(source.includes(required),required);
 assert.match(source,/JSON\.stringify\(\{revision,browser:'chromium',widths,themes,localCompiledViews:views,publicCdn:'not-run',exampleLanguages\}/);
 for(const forbidden of ['dispatchEvent(','new MouseEvent(','setOffline(','page.route(','context.route(','overflow:hidden','RECEIPT.json','requestPermission(','grantPermissions(','navigator.clipboard'])assert.ok(!source.includes(forbidden),'Unexpected browser shortcut: '+forbidden);
 assert.doesNotMatch(source,/\.click\(\{\s*force\s*:/);
 assert.match(source,/page\.getByRole\('checkbox', \{name:'锁定这份清单'/);
 assert.ok(!source.includes("getByRole('switch'"),'Core toggle is a native checkbox, not an ARIA switch');
});

test('promoted root examples and locale map exactly cover 24 historical plus five existing plus 32 candidate inputs',async()=>{
 const map=await readJSON(path.join(root,'references/example-languages.json'));const names=(await readdir(path.join(root,'examples'))).filter(n=>n.endsWith('.json')).map(n=>n.slice(0,-5)).sort();assert.equal(names.length,61);assert.deepEqual(Object.keys(map).sort(),names);assert.ok(Object.values(map).every(lang=>['en','zh-CN'].includes(lang)));
 const plan=await read('consumer-plan.json');for(const entry of [...plan.examples,...plan.existingEnhancementPromotion]){assert.equal(sha256(await readFile(path.join(root,entry.futureSkillPath))),entry.sha256);assert.equal(map[entry.name],entry.lang);}
 const added=new Set([...plan.examples,...plan.existingEnhancementPromotion].map(e=>e.name));const prior=names.filter(n=>!added.has(n));assert.equal(prior.length,24);assert.equal(prior.filter(n=>map[n]==='zh-CN').length,20);assert.equal(prior.filter(n=>map[n]==='en').length,4);
});


test('agenda smoke dismisses the native select popup before later selection without losing value or focus',async()=>{
 const source=await readFile(path.join(base,'verify-browser.mjs'),'utf8');
 const agenda=source.split("case 'agenda': {")[1].split("case 'button-actions':")[0];
 const escape=agenda.indexOf("await page.keyboard.press('Escape');");
 assert.ok(escape>agenda.indexOf("await page.keyboard.press('Enter');"),'Dismiss after native keyboard selection');
 assert.ok(escape<agenda.indexOf('await select.selectOption('),'Dismiss before later selection and screenshots');
 const afterEscape=agenda.slice(escape,agenda.indexOf('await select.selectOption('));
 assert.ok(afterEscape.includes("await expect(select).toHaveValue('2026-10-09')"),'Escape must preserve selected value');
 assert.ok(afterEscape.includes('await expect(select).toBeFocused()'),'Escape must preserve native focus');
 assert.ok(!agenda.includes('.blur('),'Do not remove focus to hide a native popup failure');
});
