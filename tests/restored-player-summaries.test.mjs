import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildCases} from '../candidates/restored-player-summaries/cases.mjs';
import {checkLock} from '../candidates/restored-player-summaries/verify.mjs';
const directory=new URL('../candidates/restored-player-summaries/',import.meta.url);
const json=async p=>JSON.parse(await readFile(new URL(p,directory)));
const input=await json('examples/supplied-players.json'),lock=await json('runtime-lock.safe.json');
test('Original player records keep supplied zero, unknown, repeated labels and nonreconciled totals',()=>{
  assert.deepEqual(input.body.map(n=>n.type),['nba-player-summary','tennis-player-summary']);
  const [nba,tennis]=input.body;assert.equal(nba.records[0].season,'All');assert.equal(nba.records[1].season,'All');
  assert.equal(nba.records[2].pointsPerGame,0);assert.equal(nba.records[3].pointsPerGame,null);
  assert.equal(tennis.records[0].matches,1);assert.equal(tennis.records[0].wins,9);assert.equal(tennis.records[0].losses,7);
});
test('Ten positive and eighteen negative cases preserve input and precise semantic locations',()=>{
  const before=JSON.stringify(input),c=buildCases(input);assert.equal(c.positives.length,10);assert.equal(c.negatives.length,18);
  assert.equal(JSON.stringify(input),before);assert.equal(new Set([...c.positives,...c.negatives].map(([n])=>n)).size,28);
  assert.equal(c.positives.find(([n])=>n==='one hundred finite records')[1].body[0].records.length,100);
  assert.equal(c.negatives.find(([n])=>n==='duplicate tennis record ID')[3],'/body/1/records/1/id');
});
test('Safe882-file closure excludes instruction files and records restored rather than new historical IDs',()=>{
  assert.equal(lock.protocolNodes,124);assert.equal(lock.files.length,882);assert.equal(lock.safeRecovery.wholeTreeGitVerification,false);
  assert.deepEqual(lock.restoredHistoricalCanonicalIds,['nba-player-summary','tennis-player-summary']);
  assert.ok(lock.files.every(f=>!/(^|\/)(AGENTS|CLAUDE)\.md$/.test(f.path)));
  const records=lock.files.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'),lock.safeRecovery.verifiedContentSha256);
  assert.equal(lock.nativeScenariosExecuted,0);assert.equal(lock.publicCdnVerified,false);
});
test('Baseline anchors209 definitions and122 existing node refs to prior immutable lock',async()=>{
  const baseline=await json('schema-baseline-122.json'),prior=await json('../restored-ledger-records/runtime-lock.safe.json');
  assert.equal(Object.keys(baseline.definitions).length,209);assert.equal(baseline.nodeRefs.length,122);
  assert.equal(baseline.sourceCommit,prior.assetCommit);assert.equal(baseline.schemaSha256,prior.files.find(f=>f.path==='src/schema/iui.schema.json').sha256);
});
test('Only four explicit prior renderer changes and four new family/helper files are allowed',async()=>{
  const delta=await json('runtime-delta-122.json'),prior=await json('../restored-ledger-records/runtime-lock.safe.json');
  assert.equal(delta.changedOldRendererFiles.length,4);assert.equal(delta.newRendererFiles.length,4);
  for(const f of delta.changedOldRendererFiles){assert.equal(f.beforeSha256,prior.files.find(x=>x.path===f.path).sha256);assert.equal(f.afterSha256,lock.files.find(x=>x.path===f.path).sha256);assert.ok(f.reason);}
});
test('Wrong protocol or canonical identity is rejected before a runtime can be used',async()=>{
  await assert.rejects(checkLock('/not-used',{...lock,protocolNodes:122}),/122 !== 124/);
  await assert.rejects(checkLock('/not-used',{...lock,newCanonicalId:'tennis-player-summary'}));
});
