import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Validate accounting only. This does not execute or accept the runtime. */
export function verifyFunctionalScope(inventory, scope) {
  const fail = message => { throw new Error(`Canonical scope: ${message}`); };
  const statuses = ['functionally_verified', 'implemented_pending_verification', 'partial', 'not_implemented'];
  if (!Array.isArray(inventory?.components) || inventory.components.length !== scope.canonicalTotal) fail('expected one row for each canonical ID');
  const counts = Object.fromEntries(statuses.map(status => [status, 0]));
  const ids = new Set();
  for (const row of inventory.components) {
    if (typeof row?.id !== 'string' || !row.id.trim() || ids.has(row.id)) fail('blank or duplicate canonical ID');
    if (!statuses.includes(row.status)) fail(`unsupported status for ${row.id}`);
    ids.add(row.id); counts[row.status] += 1;
  }
  for (const status of statuses) {
    if (counts[status] !== inventory.counts?.[status]) fail(`inventory summary differs from rows: ${status}`);
    if (counts[status] !== scope.counts?.[status]) fail(`declared scope differs from rows: ${status}`);
  }
  const implemented = counts.functionally_verified + counts.implemented_pending_verification;
  if (implemented !== scope.completeImplementationCoverage) fail('implemented count must exclude partial rows');
  const partialIds = inventory.components.filter(row => row.status === 'partial').map(row => row.id).sort();
  const expectedPartialIds = [scope.existingPartialId, ...scope.subsets.map(row => row.id)].sort();
  if (JSON.stringify(partialIds) !== JSON.stringify(expectedPartialIds)) fail('partial IDs differ from declared functional subsets');
  if (!scope.subsets.every(row => row.status === 'partial' && Array.isArray(row.missing) && row.missing.length > 0)) fail('each subset needs explicit missing functions');
  return { canonicalTotal: inventory.components.length, implemented, counts, partialIds, protocolNodes: scope.protocolNodes, boundary: 'Accounting check only; no runtime, browser or visual acceptance.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/verify-recovery-functional-scope.mjs /path/to/component-progress.json');
  const bytes = await readFile(resolve(process.argv[2]));
  const scope = JSON.parse(await readFile(new URL('../references/recovery-functional-subsets.json', import.meta.url)));
  const result = verifyFunctionalScope(JSON.parse(bytes), scope);
  console.log(JSON.stringify({ ...result, inventorySha256: createHash('sha256').update(bytes).digest('hex') }, null, 2));
}
