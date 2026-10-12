import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyFunctionalScope } from '../scripts/verify-recovery-functional-scope.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('published209 inventory is counted from all256 exact canonical rows', async () => {
  const inventory = await read('references/recovery-scope209.json');
  const scope = await read('references/recovery-functional-subsets.json');
  const result = verifyFunctionalScope(inventory, scope);
  assert.equal(result.implemented, 209); assert.equal(result.protocolNodes, 214);
  assert.equal(inventory.publicCommit, '29d8813ff4632ba5ca28010246cf57d3e8a96634');
  assert.equal(inventory.inventory.sha256, 'ea18ea89f371f561953a61b2201b3178fc20b4649f27c5a8af7f1f515e68d295');
  const date = inventory.components.find(x => x.id === 'calculator-corrected-adjusted-age-of-preterm-infants');
  assert.equal(date.status, 'implemented_pending_verification');
  assert.equal(inventory.clinicalValidation, false); assert.equal(inventory.actionsRuns, 0);
});

test('209 current accounting cannot silently upgrade immutable933 or original371 execution', async () => {
  const old = await read('candidates/recovery213-readable-headers/runtime-lock.safe.json');
  const candidate = await read('candidates/corrected-age/runtime-lock.safe.json');
  assert.equal(candidate.implemented, 208); assert.equal(candidate.publicCommit, null);
  assert.equal(old.publicCommit, 'd1196a06e0561bc384d94eb6ff625ea61309969d');
  assert.equal(old.protocolNodes, 213);
});
