/** Generate only an inventory from the canonical library schema; no parallel schema. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
function argument(flag) { const at = process.argv.indexOf(flag); if (at < 0) return; assert.ok(process.argv[at + 1] && !process.argv[at + 1].startsWith('--'), `${flag} needs a value`); return process.argv[at + 1]; }
const contract = await readJson(path.join(root, 'library-contract.json'));
const library = path.resolve(argument('--library') ?? path.join(root, '../Inform-UI'));
const revision = argument('--revision') ?? contract.revision;
assert.match(revision, /^[0-9a-f]{40}$/);
const head = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(head.status, 0, head.stderr); assert.equal(head.stdout.trim(), revision);
const bytes = await readFile(path.join(library, 'src/schema/iui.schema.json')), full = JSON.parse(bytes);
const index = await readJson(path.join(library, 'src/schema/fragments/index.json'));
assert.equal(createHash('sha256').update(bytes).digest('hex'), index.fullSchema.sha256);
const inventory = full.$defs.Node.oneOf.map(item => {
 const type = full.$defs[item.$ref.split('/').at(-1)].properties.type.const;
 assert.ok(index.nodeOwners[type], `${type} needs exactly one generated domain owner`);
 const exception = index.nodeSupportExceptions[type];
 assert.ok(exception === undefined || exception === 'plain-text fallback' || exception === 'rejected', `Unrecognized support exception for ${type}`);
 return { type, status: exception === 'plain-text fallback' ? 'plain-text-fallback' : exception ?? 'portable' };
});
assert.equal(new Set(inventory.map(item => item.type)).size, inventory.length);
assert.deepEqual(inventory.map(item => item.type).sort(), Object.keys(index.nodeOwners).sort());
const output = path.resolve(argument('--out') ?? path.join(root, 'references/node-support.json'));
const generated = JSON.stringify(inventory, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(await readFile(output, 'utf8'), generated, 'Inventory must be regenerated from the matched full schema');
else await writeFile(output, generated);
console.log(`PASS ${process.argv.includes('--check') ? 'checked' : 'derived'} ${inventory.length} inventory entries from canonical schema at ${revision}`);
