import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFixture } from '../candidates/restored-lottie/generate-fixture.mjs';
import { buildCases } from '../candidates/restored-lottie/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-lottie/examples/supplied-lottie.json', import.meta.url)));
test('Original Lottie fixture reproduces byte-independent supplied geometry', () => {
  assert.deepEqual(buildFixture(), input); assert.deepEqual(input.state, { time: 0, rate: 0 });
  const data = input.body[0].source; assert.equal((data.op - data.ip) / data.fr, 2); assert.deepEqual(data.assets, []);
  assert.equal(data.layers[0].ty, 4); assert.deepEqual(data.layers[0].ks.p.k.map(k => k.s), [[30, 40, 0], [90, 40, 0]]);
  assert.ok(input.body[1].source.startsWith('data:image/png;base64,')); assert.equal(input.body[0].loop, false);
});
test('Lottie cases retain finite data and do not mutate the original fixture', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 6); assert.equal(c.negatives.length, 15); assert.equal(JSON.stringify(input), before);
  assert.equal(c.negatives.find(([n]) => n === 'rate exceeds finite bound')[3], '/body/0/advanceRate');
  const bitmap = c.positives.find(([n]) => n === 'embedded original raster asset')[1].body[0].source;
  assert.equal(bitmap.layers[0].refId, bitmap.assets[0].id); assert.ok(bitmap.assets[0].p.startsWith('data:image/png;base64,'));
});
test('Lottie147 records engine provenance and bounded source-build closure', async () => {
  const lock = JSON.parse(await readFile(new URL('../candidates/restored-lottie/source-build-lock.safe.json', import.meta.url)));
  assert.equal(lock.sourceCommit, 'c1320b35d90ba004855109f7a0aaeffb08e37a8a'); assert.equal(lock.protocolNodes, 147); assert.equal(lock.cdnExecuted, false);
  assert.equal(lock.files.length, 21); assert.ok(lock.files.some(f => f.path === 'scripts/lottie-assets.mjs')); assert.ok(lock.files.every(f => !/(AGENTS|private|\.\.\/)/.test(f.path)));
});
