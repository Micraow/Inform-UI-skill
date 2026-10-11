import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const scope = JSON.parse(await readFile(new URL('../references/recovery-functional-subsets.json', import.meta.url)));
test('Current canonical counts exclude remaining finite functional subsets from complete implementation coverage', () => {
  assert.equal(Object.values(scope.counts).reduce((a, b) => a + b, 0), 256);
  assert.equal(scope.completeImplementationCoverage, scope.counts.functionally_verified + scope.counts.implemented_pending_verification);
  assert.equal(scope.completeImplementationCoverage, 174); assert.equal(scope.protocolNodes, 179); assert.equal(scope.subsets.length, scope.counts.partial); assert.equal(scope.existingPartialId, null);
  assert.deepEqual(scope.subsets.map(s => s.id), []); assert.equal(scope.implementedFunctionalCompletions.length, 32); assert.ok(scope.implementedFunctionalCompletions.every(s => s.status === 'implemented_pending_verification' && s.nativeAndPixelAcceptance === false));
});
