import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{inflateSync}from'node:zlib';import{buildFixture,colorPng,shortTone}from'../candidates/restored-learning-media/generate-fixture.mjs';import{buildCases}from'../candidates/restored-learning-media/cases.mjs';
const input=JSON.parse(await readFile(new URL('../candidates/restored-learning-media/examples/supplied-learning-media.json',import.meta.url)));
test('Original media fixture reproduces exactly without external images or recorded speech',()=>{assert.deepEqual(buildFixture(),input);assert.deepEqual(input.body.map(n=>n.type),['learning-image-choice-card','learning-image-label-card','learning-audio-label-card']);assert.ok(input.body[2].audio.src.startsWith('data:audio/wav;base64,'));assert.match(input.body[2].audio.transcript,/No speech/);});
test('Generated PNG pixel rows and finite PCM WAV header are structurally valid',()=>{const p=colorPng([33,99,220]);assert.deepEqual([...p.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(p.readUInt32BE(16),16);assert.equal(p.readUInt32BE(20),16);const data=inflateSync(p.subarray(41,41+p.readUInt32BE(33)));assert.equal(data.length,16*49);assert.deepEqual([...data.subarray(1,4)],[33,99,220]);const w=shortTone();assert.equal(w.toString('ascii',0,4),'RIFF');assert.equal(w.readUInt32LE(4)+8,w.length);assert.equal(w.toString('ascii',8,12),'WAVE');assert.equal(w.readUInt16LE(20),1);assert.equal(w.readUInt32LE(24),8000);assert.equal(w.readUInt32LE(40),640*2);});
test('Six positives and16 negatives preserve source and exact semantic issue paths',()=>{const before=JSON.stringify(input),c=buildCases(input);assert.equal(c.positives.length,6);assert.equal(c.negatives.length,16);assert.equal(JSON.stringify(input),before);assert.equal(c.negatives.find(([n])=>n==='answers duplicate after trimming')[3],'/body/1/answers/1');assert.equal(c.negatives.find(([n])=>n==='wildcard audio host')[3],'/body/2/audio/src');});
test('Learning consumer pins only a selected source-build closure and keeps native playback unclaimed', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-learning-media/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'f6d4893ffebfc8e3ba9f6b48b04b957a236cb7e1');
  assert.equal(lock.implementationCommit, 'bb213abb2ae7c8947944e61f85ba858c0c47c833');
  assert.equal(lock.files.length, 17); assert.equal(lock.cdnExecuted, false); assert.equal(lock.nativeScenariosExecuted, 0);
  assert.equal(new Set(lock.files.map(f => f.path)).size, 17);
  assert.ok(lock.files.every(f => !/(?:AGENTS|private-reference|node_modules|^\/|\.\.)/.test(f.path) && /^[a-f0-9]{64}$/.test(f.sha256)));
  for (const p of ['src/compiler.ts', 'dist/standalone.js', 'dist/style.css']) assert.ok(lock.files.some(f => f.path === p));
});
test('All old 133 schema definitions have immutable hashes for three-node extension checks', async () => {
  const baseline = JSON.parse(await readFile(new URL('../candidates/restored-learning-media/schema-baseline-133.json', import.meta.url)));
  assert.equal(baseline.nodeRefs.length, 133); assert.ok(Object.keys(baseline.definitions).length > 234);
  assert.ok(Object.values(baseline.definitions).every(h => /^[a-f0-9]{64}$/.test(h)));
});
