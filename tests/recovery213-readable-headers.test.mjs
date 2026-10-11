import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyHeaderRules } from '../candidates/recovery213-readable-headers/verify-cdn.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));
const lock = await read('candidates/recovery213-readable-headers/runtime-lock.safe.json');
const old = await read('candidates/recovery213/runtime-lock.safe.json');
const delta = await read('candidates/recovery213-readable-headers/style-successor.json');

test('933dc separately locks the byte-verified public successor without changing5081', () => {
  assert.equal(lock.localAssetCommit, '933dc0af71457df14e5be50ed53b73522a902e00');
  assert.equal(lock.localAssetTree, '5f43b6552237b9c9cf35a8322b391a168e42a487');
  assert.equal(lock.publicCommit, 'd1196a06e0561bc384d94eb6ff625ea61309969d');
  assert.equal(lock.publicTree, '7c087b53926399dd14904defe1e0370b0b2f00bf');
  assert.equal(lock.publicAssetDirectory, 'https://github.com/Micraow/Inform-UI/tree/' + lock.publicCommit + '/cdn');
  assert.equal(lock.protocolNodes, 213);
  assert.equal(lock.files.length, 57);
  assert.equal(new Set(lock.files.map(f => f.path)).size, 57);
  assert.ok(lock.files.every(f => !/AGENTS|private-reference|\.env/.test(f.path)));
  assert.equal(old.localAssetCommit, '5081b29b99eea2dce1f09a3588628f9414b5e393');
  assert.equal(old.localAssetTree, 'b11a81f54e3d624975364de3e26c3134e9602b7f');
  assert.equal(old.publicCommit, null);
});

test('Remote receipt binds all52 fetched asset bytes/SRI and preserves the remote-CI boundary', async () => {
  const r = await read('candidates/recovery213-readable-headers/public-assets.json');
  assert.equal(r.publicCommit, lock.publicCommit);
  assert.equal(r.publicTree, lock.publicTree);
  assert.equal(r.localAssetCommit, lock.localAssetCommit);
  assert.equal(r.assetCount, 52);
  assert.equal(r.files.length, 52);
  assert.equal(new Set(r.files.map(f => f.path)).size, 52);
  assert.equal(r.totalAssetBytes, 33438701);
  assert.equal(r.files.reduce((n, f) => n + f.bytes, 0), r.totalAssetBytes);
  assert.equal(r.treeTruncated, false);
  assert.equal(r.remoteTreeLeaves, 1356);
  for (const f of [r.manifest, ...r.files]) {
    const expected = lock.files.find(x => x.path === f.path);
    assert.ok(expected, f.path);
    assert.equal(f.bytes, expected.bytes);
    assert.equal(f.sha256, expected.sha256);
    assert.match(f.gitBlob, /^[a-f0-9]{40}$/);
    assert.match(f.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
    assert.equal(f.mode, '100644');
  }
  assert.equal(r.executionScope.remoteCiRuns, 0);
  assert.equal(r.executionScope.remoteCiPassed, false);
  assert.equal(r.executionScope.domRerunForPublication, false);
  assert.equal(r.executionScope.newAggregateRun, false);
  assert.equal(r.executionScope.newNativeRun, false);
  assert.deepEqual(r.scope, { implemented: 208, historicalVerified: 53, pendingReferenceAcceptance: 155, partial: 0, missing: 48 });
});

test('Only nine generated leaves differ; schema, inventory and all other asset leaves stay exact', () => {
  const changes = lock.files.filter(f => f.sha256 !== old.files.find(x => x.path === f.path).sha256).map(f => f.path);
  assert.deepEqual(changes, delta.changedLockedPaths);
  assert.equal(changes.length, 9);
  for (const p of ['cdn/iui.schema.json', 'docs/component-progress.json']) {
    assert.deepEqual(lock.files.find(f => f.path === p), old.files.find(f => f.path === p));
  }
  assert.deepEqual(delta.sourceChangedPaths, ['src/renderer/care-providers.css', 'src/renderer/credit-score.css']);
  assert.equal(delta.styles.length, 2);
  for (const style of delta.styles) assert.equal(style.afterBytes - style.beforeBytes, Buffer.byteLength(style.appendedRules));
});

test('Header CSS assertions reject missing rules and an incorrectly widened breakpoint', () => {
  const css = delta.styles.map(x => x.appendedRules).join('\n');
  verifyHeaderRules(css);
  assert.throws(() => verifyHeaderRules(delta.styles[0].appendedRules), /Credit/);
  assert.throws(() => verifyHeaderRules(delta.styles[1].appendedRules), /Care/);
  assert.throws(() => verifyHeaderRules(css.replaceAll('max-width:575px', 'max-width:576px')), /Credit/);
});
