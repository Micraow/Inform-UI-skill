import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyFunctionalScope } from '../scripts/verify-recovery-functional-scope.mjs';
const scope = JSON.parse(await readFile(new URL('../references/recovery-functional-subsets.json', import.meta.url)));
const fixture = (input=scope) => ({ counts: { ...input.counts }, components: [
  ...Array.from({ length: input.counts.functionally_verified }, (_, i) => ({ id: `historical-${i}`, status: 'functionally_verified' })),
  ...Array.from({ length: input.counts.implemented_pending_verification }, (_, i) => ({ id: `pending-${i}`, status: 'implemented_pending_verification' })),
  ...[input.existingPartialId, ...input.subsets.map(s => s.id)].map(id => ({ id, status: 'partial' })),
  ...Array.from({ length: input.counts.not_implemented }, (_, i) => ({ id: `missing-${i}`, status: 'not_implemented' }))
] });
test('Accounting separates implemented rows, remaining partial functions and protocol registrations', () => {
  const inventory = fixture(), before = JSON.stringify(inventory), result = verifyFunctionalScope(inventory, scope);
  assert.equal(result.implemented, 158); assert.equal(result.canonicalTotal, 256); assert.equal(result.protocolNodes, 164); assert.equal(result.partialIds.length, 1); assert.equal(JSON.stringify(inventory), before);
});
test('Remaining partial weather cannot be promoted by changing only summary or registered-node totals', () => {
  const bad = fixture(); bad.counts.implemented_pending_verification += 1; assert.throws(() => verifyFunctionalScope(bad, scope), /summary differs/);
  assert.throws(() => verifyFunctionalScope(fixture(), { ...scope, completeImplementationCoverage: scope.completeImplementationCoverage + 1 }), /exclude partial/);
});
test('Unknown status, missing row and duplicate canonical ID are rejected', () => {
  for (const mutate of [d => d.components.pop(), d => { d.components[1].id = d.components[0].id; }, d => { d.components[0].status = 'rendered'; }]) {
    const bad = fixture(); mutate(bad); assert.throws(() => verifyFunctionalScope(bad, scope), /Canonical scope:/);
  }
});
test('Equal totals cannot conceal a different partial ID and any future subset must declare its functional gap', () => {
  const bad = fixture(), subset = bad.components.find(c => c.id === scope.existingPartialId), replacement = bad.components.find(c => c.status === 'implemented_pending_verification');
  subset.status = 'implemented_pending_verification'; replacement.status = 'partial'; assert.throws(() => verifyFunctionalScope(bad, scope), /partial IDs differ/);
  const emptyGap = structuredClone(scope); emptyGap.counts.implemented_pending_verification--; emptyGap.counts.partial++; emptyGap.completeImplementationCoverage--; emptyGap.subsets.push({ id:'hypothetical-unfinished-family',status:'partial',missing:[] }); assert.throws(() => verifyFunctionalScope(fixture(emptyGap), emptyGap), /explicit missing/);
});
