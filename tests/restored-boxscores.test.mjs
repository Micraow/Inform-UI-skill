import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {buildCases} from '../candidates/restored-boxscores/cases.mjs';
const input=JSON.parse(await readFile(new URL('../candidates/restored-boxscores/examples/supplied-boxscores.json',import.meta.url)));
test('Original boxscores retain independent totals, null/zero and source-text overs',()=>{
 const [n,c]=input.body;assert.deepEqual(input.body.map(x=>x.type),['nba-game-boxscore','cricket-match-boxscore']);assert.equal(n.teams[0].score,999);assert.equal(n.teams[1].score,null);assert.deepEqual(n.periods[0].scores,[0,null]);assert.equal(n.teams[0].players[0].plusMinus,-5);assert.equal(c.innings[0].overs,'19.5');assert.equal(c.innings[0].wickets,17);assert.equal(c.innings[0].batting[0].strikeRate,43.21);assert.equal(c.innings[0].bowling[0].economy,1.25);
});
test('Ten positives and twenty-seven negatives preserve their original input',()=>{
 const before=JSON.stringify(input),cases=buildCases(input);assert.equal(cases.positives.length,10);assert.equal(cases.negatives.length,27);assert.equal(new Set([...cases.positives,...cases.negatives].map(([n])=>n)).size,37);assert.equal(JSON.stringify(input),before);
});
test('Local IDs and explicit references retain precise semantic issue paths',()=>{
 const c=buildCases(input);assert.equal(input.body[0].teams[0].players[0].id,input.body[0].teams[1].players[0].id);assert.equal(input.body[1].innings[0].batting[0].id,input.body[1].innings[0].bowling[0].id);assert.equal(c.negatives.find(([n])=>n==='unknown innings team')[3],'/body/1/innings/0/teamId');assert.equal(c.negatives.find(([n])=>n==='duplicate batting ID')[3],'/body/1/innings/0/batting/1/id');
});
test('Maximum positive examples stay finite at each declared collection boundary',()=>{
 const [n,c]=buildCases(input).positives.find(([name])=>name==='maximum finite lists')[1].body;assert.equal(n.teams.length,2);assert.equal(n.teams[0].players.length,40);assert.equal(n.periods.length,20);assert.equal(c.innings.length,12);assert.equal(c.innings[0].batting.length,30);assert.equal(c.innings[0].bowling.length,30);
});
test('Frozen126 baseline preserves218 definitions and126 node references',async()=>{
 const base=JSON.parse(await readFile(new URL('../candidates/restored-boxscores/schema-baseline-126.json',import.meta.url))),prior=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/runtime-lock.safe.json',import.meta.url)));
 assert.equal(base.sourceCommit,prior.sourceCommit);assert.equal(base.schemaSha256,prior.files.find(f=>f.path==='src/schema/iui.schema.json').sha256);assert.equal(Object.keys(base.definitions).length,218);assert.equal(base.nodeRefs.length,126);
});
test('Shared consumer verifier rejects an invalid lock before touching a runtime',async()=>{
 const {mkdtemp,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),path=await import('node:path'),{prepareSuppliedConsumer}=await import('../scripts/verify-supplied-consumer.mjs');
 const directory=await mkdtemp(path.join(tmpdir(),'inform-consumer-negative-'));
 try {await writeFile(path.join(directory,'runtime-lock.safe.json'),JSON.stringify({format:'invalid'}));await assert.rejects(prepareSuppliedConsumer('/not-read',directory,{protocolNodes:128,canonicalId:'nba-game-boxscore',requiredFiles:[]}),/inform-recovered-consumer-lock/);}
 finally {await rm(directory,{recursive:true,force:true});}
});
test('Exact128 safe lock distinguishes application assets from the tests-only source successor',async()=>{
 const lock=JSON.parse(await readFile(new URL('../candidates/restored-boxscores/runtime-lock.safe.json',import.meta.url)));assert.equal(lock.protocolNodes,128);assert.equal(lock.sourceCommit,'73bfbeffd408cd10722900caee37425f8e9a234c');assert.equal(lock.assetCommit,'2a36d9012b70feca5e3d371cbac20c4cca7b2d5f');assert.equal(lock.implementationSourceCommit,'6f7140a53226f606d5744280c5f7ab14b296a04e');assert.equal(lock.files.length,920);assert.equal(lock.safeRecovery.verifiedFiles,920);assert.equal(lock.safeRecovery.wholeTreeGitVerification,false);assert.equal(lock.nativeScenariosExecuted,0);assert.equal(lock.publicCdnVerified,false);
 assert.equal(new Set(lock.files.map(f=>f.path)).size,920);assert.ok(lock.files.every(f=>!/(^|\/)(AGENTS\.md|\.agents|\.codex)(\/|$)/i.test(f.path)));assert.deepEqual(lock.restoredHistoricalCanonicalIds,['nba-game-boxscore','cricket-match-boxscore']);
 const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(JSON.stringify(lock.files.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path)))).digest('hex'),lock.safeRecovery.verifiedContentSha256);
});
test('Unified renderer delta names all nine existing changes and five added files',async()=>{
 const delta=JSON.parse(await readFile(new URL('../candidates/restored-boxscores/runtime-delta-126.json',import.meta.url))),prior=JSON.parse(await readFile(new URL('../candidates/restored-motorsport/runtime-lock.safe.json',import.meta.url)));assert.equal(delta.baseAsset,prior.assetCommit);assert.equal(delta.changedOldRendererFiles.length,9);assert.equal(delta.newRendererFiles.length,5);
 for(const f of delta.changedOldRendererFiles){assert.equal(f.beforeSha256,prior.files.find(p=>p.path===f.path).sha256);assert.notEqual(f.beforeSha256,f.afterSha256);assert.ok(f.reason);}
 assert.ok(delta.newRendererFiles.some(f=>f.path==='src/renderer/owned-tree.ts'));assert.ok(delta.newRendererFiles.some(f=>f.path==='src/renderer/intent-gate.ts'));assert.equal(prior.sourceCommit,'5efdc31a952f291263846cb4320a7890f3fe4b29');
});
