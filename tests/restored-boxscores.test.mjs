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
