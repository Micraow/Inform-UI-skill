import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyFunctionalScope } from '../scripts/verify-recovery-functional-scope.mjs';
const read = async p => JSON.parse(await readFile(new URL('../' + p, import.meta.url)));

test('published211 inventory derives totals from all256 rows and changes only GCS/ROX after209', async () => {
  const current = await read('references/recovery-scope211.json'), previous = await read('references/recovery-scope209.json'), scope = await read('references/recovery-functional-subsets.json');
  const historical = { ...scope, counts: current.counts, completeImplementationCoverage: 211, protocolNodes: 216 };
  const r = verifyFunctionalScope(current, historical);
  assert.equal(r.implemented, 211); assert.equal(r.protocolNodes, 216); assert.equal(r.counts.not_implemented, 45);
  assert.equal(current.publicCommit, 'f5a753a488e53504a7086d51b26a75d8f94b1748');
  assert.equal(current.inventory.sha256, '2d380f348795527b4b812e6d0dd8965c3d704797897a8b81f49396b6a22fb171');
  assert.deepEqual(current.components.filter((row, i) => JSON.stringify(row) !== JSON.stringify(previous.components[i])), [
    { id: 'calculator-glasgow-coma-scale-gcs', status: 'implemented_pending_verification' },
    { id: 'calculator-rox-index-for-high-flow-nasal-cannula', status: 'implemented_pending_verification' }
  ]);
  assert.equal(current.clinicalValidation, false); assert.equal(current.actionsRuns, 0);
});

test('actual source publications retain original execution metadata and unchanged214 assets', async () => {
  for (const [folder, commit] of [['gcs-scorecard', 'c138b93b745990c02ec41d7b924cb615d80ed172'], ['rox-scorecard', 'd9b0ed410d9aa2dd7f8fa888ff44b22595239853']]) {
    const l = await read(`candidates/${folder}/runtime-lock.safe.json`), p = await read(`candidates/${folder}/source-public.json`), r = await read(`candidates/${folder}/consumer-result.json`);
    assert.equal(l.publicCommit, commit); assert.equal(p.publicCommit, commit); assert.equal(p.source, l.source); assert.equal(r.source, l.source);
    assert.equal(r.publicCommit, null); assert.equal(p.sourceFilesMatchedByGitBlob.length, 41); assert.equal(p.actualRemotePayloads.length, 5); assert.equal(p.preservedCDNLeaves, 54);
    for (const f of p.actualRemotePayloads) assert.deepEqual(f, l.files.find(x => x.path === f.path));
    assert.equal(p.publishedAssetsRemain, 'fed5f86f49e73f908ac9ea98966b1515a3aaa597'); assert.equal(p.actionsRuns, 0); assert.equal(p.clinicalValidation, false);
  }
});

test('public product guides expose concise usage and independently pinned source/asset versions', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8'), matrix = await readFile(new URL('../RECOVERY-CONSUMERS.md', import.meta.url), 'utf8');
  for (const text of [readme, matrix]) {
    assert.ok(Buffer.byteLength(text) < 12000, 'Top-level product guides remain concise; detailed contracts live with their versioned examples.');

  }
  assert.match(readme, /\[历史版本兼容表\]\(RECOVERY-CONSUMERS\.md\)/);
  assert.ok(matrix.includes('d9b0ed410d9aa2dd7f8fa888ff44b22595239853'));
  assert.ok(matrix.includes('fed5f86f49e73f908ac9ea98966b1515a3aaa597'));
  assert.match(matrix, /node --max-old-space-size=768/);
});
