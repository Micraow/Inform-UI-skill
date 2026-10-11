import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const scope = JSON.parse(await readFile(new URL('../references/recovery-functional-subsets.json', import.meta.url)));
test('Canonical154 counts exclude remaining finite functional subsets from complete implementation coverage', () => {
  assert.equal(Object.values(scope.counts).reduce((a, b) => a + b, 0), 256);
  assert.equal(scope.completeImplementationCoverage, scope.counts.functionally_verified + scope.counts.implemented_pending_verification);
  assert.equal(scope.completeImplementationCoverage, 144); assert.equal(scope.protocolNodes, 154); assert.equal(scope.subsets.length + 1, scope.counts.partial); assert.equal(scope.existingPartialId, 'weather');
  assert.deepEqual(scope.subsets.map(s => s.id), ['image-grid', 'ledger-upcoming-activity', 'ledger-spend-so-far-this-month']); assert.ok(scope.subsets.every(s => s.status === 'partial' && s.missing.length > 0));
});
