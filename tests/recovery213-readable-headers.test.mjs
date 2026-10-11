import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyHeaderRules } from '../candidates/recovery213-readable-headers/verify-cdn.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));
const lock = await read('candidates/recovery213-readable-headers/runtime-lock.safe.json');
const old = await read('candidates/recovery213/runtime-lock.safe.json');
const delta = await read('candidates/recovery213-readable-headers/style-successor.json');

test('933dc is a separately locked local successor with no invented public asset URL', () => {
  assert.equal(lock.localAssetCommit, '933dc0af71457df14e5be50ed53b73522a902e00');
  assert.equal(lock.localAssetTree, '5f43b6552237b9c9cf35a8322b391a168e42a487');
  assert.equal(lock.publicCommit, null);
  assert.equal(lock.protocolNodes, 213);
  assert.equal(lock.files.length, 57);
  assert.equal(new Set(lock.files.map(f => f.path)).size, 57);
  assert.ok(lock.files.every(f => !/AGENTS|private-reference|\.env/.test(f.path)));
  assert.equal(old.localAssetCommit, '5081b29b99eea2dce1f09a3588628f9414b5e393');
  assert.equal(old.localAssetTree, 'b11a81f54e3d624975364de3e26c3134e9602b7f');
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
