import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));
const hash = b => createHash('sha256').update(b).digest('hex');
test('Recovery154 reuses21 exact original examples and their existing case builders', async () => {
  const index = await read('candidates/recovery154/fixture-index.json'); assert.equal(index.fixtures.length, 21); assert.equal(new Set(index.fixtures.map(f => f.family)).size, 21);
  for (const f of index.fixtures) for (const [field, digest] of [['example', 'exampleSha256'], ['cases', 'casesSha256']]) { assert.ok(f[field].startsWith('candidates/') && !f[field].split('/').includes('..')); assert.equal(hash(await readFile(new URL('../' + f[field], import.meta.url))), f[digest]); }
});
test('Recovery154 asset lock excludes source instructions and separates assets from source identity', async () => {
  const lock = await read('candidates/recovery154/runtime-lock.safe.json'); assert.equal(lock.runtimeAndAssetCommit, '8e21f4fd06826a42301719ae0c90b007d46589c7'); assert.equal(lock.localSourceCommit, 'e4802079563d12dbd34cefcf4325cda6b478fa6d'); assert.equal(lock.files.length, 54); assert.equal(new Set(lock.files.map(f => f.path)).size, 54); assert.equal(lock.nativeExecuted, false);
  assert.ok(lock.files.every(f => !/(AGENTS|node_modules|private|\.\.\/)/.test(f.path))); assert.match(lock.publicSourceBoundary, /does not establish/);
});
test('Recovery154 preserves the six-partial canonical interpretation', async () => {
  const scope = await read('references/recovery-functional-subsets.json'); assert.equal(scope.protocolNodes, 154); assert.equal(scope.completeImplementationCoverage, 142); assert.equal(scope.counts.partial, 6); assert.equal(scope.counts.not_implemented, 108);
});
