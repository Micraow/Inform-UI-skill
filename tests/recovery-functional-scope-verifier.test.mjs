import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyFunctionalScope } from '../scripts/verify-recovery-functional-scope.mjs';
const scope = JSON.parse(await readFile(new URL('../references/recovery-functional-subsets.json', import.meta.url)));
const fixture = (input=scope) => ({ counts: { ...input.counts }, components: [
  ...Array.from({ length: input.counts.functionally_verified }, (_, i) => ({ id: `historical-${i}`, status: 'functionally_verified' })),
  ...Array.from({ length: input.counts.implemented_pending_verification }, (_, i) => ({ id: `pending-${i}`, status: 'implemented_pending_verification' })),
  ...[...(input.existingPartialId === null ? [] : [input.existingPartialId]), ...input.subsets.map(s => s.id)].map(id => ({ id, status: 'partial' })),
  ...Array.from({ length: input.counts.not_implemented }, (_, i) => ({ id: `missing-${i}`, status: 'not_implemented' }))
] });
test('Accounting separates implemented rows, remaining partial functions and protocol registrations', () => {
  const inventory = fixture(), before = JSON.stringify(inventory), result = verifyFunctionalScope(inventory, scope);
  assert.equal(result.implemented, 184); assert.equal(result.canonicalTotal, 256); assert.equal(result.protocolNodes, 189); assert.equal(result.partialIds.length, 0); assert.equal(JSON.stringify(inventory), before);
});
test('Canonical totals cannot be changed by altering only summaries or registered-node totals', () => {
  const bad = fixture(); bad.counts.implemented_pending_verification += 1; assert.throws(() => verifyFunctionalScope(bad, scope), /summary differs/);
  assert.throws(() => verifyFunctionalScope(fixture(), { ...scope, completeImplementationCoverage: scope.completeImplementationCoverage + 1 }), /exclude partial/);
});
test('Unknown status, missing row and duplicate canonical ID are rejected', () => {
  for (const mutate of [d => d.components.pop(), d => { d.components[1].id = d.components[0].id; }, d => { d.components[0].status = 'rendered'; }]) {
    const bad = fixture(); mutate(bad); assert.throws(() => verifyFunctionalScope(bad, scope), /Canonical scope:/);
  }
});
test('Historical weather-partial accounting remains supported and equal totals cannot conceal another partial ID', () => {
  const historical=structuredClone(scope);historical.existingPartialId='weather';historical.counts.implemented_pending_verification--;historical.counts.partial++;historical.completeImplementationCoverage--;
  const original=fixture(historical);assert.deepEqual(verifyFunctionalScope(original,historical).partialIds,['weather']);
  const bad=structuredClone(original),subset=bad.components.find(c=>c.id==='weather'),replacement=bad.components.find(c=>c.status==='implemented_pending_verification');subset.status='implemented_pending_verification';replacement.status='partial';assert.throws(()=>verifyFunctionalScope(bad,historical),/partial IDs differ/);
});
test('Zero partial rows require explicit null, and a future subset must declare actual missing functions', () => {
  assert.deepEqual(verifyFunctionalScope(fixture(),scope).partialIds,[]);
  for(const value of[undefined,''])assert.throws(()=>verifyFunctionalScope(fixture(),{...scope,existingPartialId:value}),/explicit null/);
  const emptyGap=structuredClone(scope);emptyGap.counts.implemented_pending_verification--;emptyGap.counts.partial++;emptyGap.completeImplementationCoverage--;emptyGap.subsets.push({id:'hypothetical-unfinished-family',status:'partial',missing:[]});assert.throws(()=>verifyFunctionalScope(fixture(emptyGap),emptyGap),/explicit missing/);
});
