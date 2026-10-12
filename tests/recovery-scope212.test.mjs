import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyFunctionalScope } from '../scripts/verify-recovery-functional-scope.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('current212 inventory changes exactly the tested qSOFA row after published211', async () => {
  const current = await read('references/recovery-scope212.json'), previous = await read('references/recovery-scope211.json'), scope = await read('references/recovery-functional-subsets.json');
  const r = verifyFunctionalScope(current, scope);
  assert.equal(r.implemented, 212); assert.equal(r.protocolNodes, 217); assert.equal(r.counts.not_implemented, 44);
  assert.equal(current.localSource, '9b949a490f7222b6c6d40b066bed89a1e1b27328');
  assert.equal(current.inventory.sha256, '41711defad7f3def159e41683d46ae23d72a6d4463fad1c1f773565ac94a5a61');
  assert.deepEqual(current.components.filter((r,i) => JSON.stringify(r) !== JSON.stringify(previous.components[i])), [{ id: 'calculator-qsofa-score', status: 'implemented_pending_verification' }]);
  assert.equal(current.publicCommit, null); assert.equal(current.sourcePublicCommit, null); assert.equal(current.latestPublishedInventory, previous.publicCommit); assert.equal(current.clinicalValidation, false);
});

test('current212 accounting does not rewrite source candidate or prior packaged asset scope', async () => {
  const lock = await read('candidates/qsofa-scorecard/runtime-lock.safe.json'), result = await read('candidates/qsofa-scorecard/consumer-result.json'), old = await read('candidates/recovery214/runtime-lock.safe.json');
  assert.equal(lock.implemented, 211); assert.equal(result.canonicalScopeAtFreeze, 211); assert.equal(lock.publicCommit, null); assert.equal(result.publicCommit, null);
  assert.equal(old.protocolNodes, 214); assert.equal(old.publicCommit, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597');
  const text = await readFile(new URL('../RECOVERY-CONSUMERS.md', import.meta.url), 'utf8'); assert.match(text, /ba96c208c3934e89d861d8e75ec02195eede7941/); assert.match(text, /preserve their at-test publication state/);
});
