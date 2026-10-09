/** Original source-only candidate helpers. No network, CI, or asset promotion. */
import assert from 'node:assert/strict';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
export const candidateDirectory = 'candidates/pending-batch';
export const acceptedRevision = 'd370ffb2df310fce0da9299e6e254a58509ba544';
export const candidateRevision = '75fd165f20ee6cca9beb2c172c19dbac98136b88';
export async function safeFile(root, relative) {
  assert.equal(typeof relative, 'string');
  assert.ok(/^[A-Za-z0-9._/-]+$/.test(relative) && !path.posix.isAbsolute(relative));
  assert.ok(relative.split('/').every(x => x && x !== '.' && x !== '..'), 'Unsafe candidate path');
  let file = path.resolve(root);
  for (const part of relative.split('/')) { file = path.join(file, part); assert.equal((await lstat(file)).isSymbolicLink(), false, 'Pinned file symlink refused'); }
  assert.ok((await lstat(file)).isFile());
  return file;
}
export function deriveCategories(index, lock) {
  return {format:'inform-skill-candidate-categories/1',candidateOnly:true,sourceRevision:lock.sourceRevision,fullSchema:lock.fullSchema,sourceIndex:lock.sourceIndex,semantics:index.semantics,canonicalCount:lock.canonicalCount,protocolNodeCount:lock.protocolNodeCount,nodeOwners:index.nodeOwners,groups:index.groups.map(g=>({...g,canonicalCandidates:lock.items.filter(i=>i.groups.includes(g.id)).map(i=>i.canonicalId)}))};
}
export async function verifyPinnedInputs(root, library, lock) {
  assert.equal(lock.format, 'inform-skill-candidate-inputs/1'); assert.equal(lock.candidateOnly, true);
  assert.equal(lock.sourceRevision, candidateRevision); assert.equal(lock.acceptedAssetRevision, acceptedRevision);
  assert.equal(sha256(await readFile(path.join(root, 'library-contract.json'))), lock.formalAcceptedContractSha256, 'Accepted contract must not change');
  assert.equal((await readJSON(path.join(root, 'library-contract.json'))).revision, acceptedRevision);
  assert.equal(sha256(await readFile(path.join(root,candidateDirectory,'manifest24.source.json'))),lock.manifestSha256);
  for (const [relative, expected] of Object.entries(lock.acceptedGuidancePrefixes)) assert.equal(sha256((await readFile(await safeFile(root,relative))).subarray(0,expected.bytes)),expected.sha256,'Accepted guidance prefix changed: '+relative);
  for (const [relative, expected] of Object.entries(lock.candidateFiles)) assert.equal(sha256(await readFile(await safeFile(root,relative))),expected,'Candidate artifact changed: '+relative);
  for (const [relative, expected] of Object.entries({...lock.sourceFiles,...lock.runtimeFiles})) {
    assert.match(expected,/^[a-f0-9]{64}$/);
    assert.equal(sha256(await readFile(await safeFile(library,relative))),expected,`Frozen source/build changed: ${relative}`);
  }
  for (const [relative, expected] of Object.entries(await readJSON(path.join(root,'tests/frozen-history-sha256.json')))) assert.equal(sha256(await readFile(await safeFile(root,relative))),expected,`Historical bytes changed: ${relative}`);
}
