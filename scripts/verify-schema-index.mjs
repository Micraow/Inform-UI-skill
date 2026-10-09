import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './check-skill.mjs';
const pos = process.argv.indexOf('--library');
const library = path.resolve(pos >= 0 ? process.argv[pos + 1] : process.env.IUI_LIBRARY_DIR || path.join(root, '../Inform-UI'));
const contract = JSON.parse(await readFile(path.join(root, 'library-contract.json')));
const indexArgument = process.argv.indexOf('--index');
const indexFile = indexArgument >= 0 ? process.argv[indexArgument + 1] : contract.cdn.schemaIndex;
assert.ok(indexFile, 'Current contract must publish its discovery index, or pass --index for local development');
const workingTree = process.argv.includes('--allow-working-tree');
const revision = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(revision.status, 0);
if (!workingTree) assert.equal(revision.stdout.trim(), contract.revision);
const indexPath = path.join(library, 'cdn', indexFile), directory = path.dirname(indexPath);
const index = JSON.parse(await readFile(indexPath));
assert.equal(index.format, 'inform-ui-schema-index/1');
assert.equal(index.schemaVersion, contract.schemaVersion);
const require = createRequire(path.join(library, 'package.json')), Ajv = require('ajv/dist/2020.js').default;
const pkg = JSON.parse(await readFile(path.join(library, 'package.json')));
const { validateDocument } = await import(pathToFileURL(path.resolve(library, pkg.exports['.'].import)).href);
const resolveFile = relative => {
  const file = path.resolve(directory, relative);
  assert.ok(file.startsWith(library + path.sep), 'Index paths must stay in the pinned library');
  return file;
};
async function checked(meta) {
  const file = resolveFile(meta.path);
  assert.ok(file.startsWith(path.join(library, "cdn") + path.sep) && file.endsWith(".json"), "Schema metadata must point inside CDN JSON assets");
  const bytes = await readFile(file);
  assert.equal(bytes.length, meta.utf8Bytes, meta.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), meta.sha256, meta.path);
  assert.equal(Array.from(bytes.toString('utf8')).length, meta.unicodeCodePoints, meta.path);
  assert.equal(Math.ceil(meta.unicodeCodePoints / 4), meta.estimatedTokens, meta.path);
  const schema = JSON.parse(bytes);
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === '$ref' || key === '$dynamicRef') {
        assert.ok(item.startsWith('#/'), `${meta.path}: external reference`);
        let target = schema;
        for (const part of decodeURIComponent(item.slice(2)).split('/').map(s => s.replaceAll('~1', '/').replaceAll('~0', '~'))) {
          assert.ok(target && Object.hasOwn(target, part), `${meta.path}: unresolved ${item}`);
          target = target[part];
        }
      }
      walk(item);
    }
  }
  walk(schema);
  return schema;
}
const types = schema => schema.$defs.Node.oneOf.map(ref => schema.$defs[ref.$ref.split('/').at(-1)].properties.type.const).sort();
const full = await checked(index.fullSchema);
assert.deepEqual(types(full), Object.keys(index.nodeOwners).sort());
assert.deepEqual(Object.keys(index.nodeOwners).sort(), JSON.parse(await readFile(path.join(root, 'references/node-support.json'))).map(n => n.type).sort());
const allOwned = [], bundles = new Map();
let files = 1, examples = 0;
for (const group of index.groups) {
  assert.equal(group.documentSchema.rootKind, 'document');
  assert.equal(group.nodeSchema.rootKind, 'node');
  assert.deepEqual(group.includedGroups, group.id === 'base' ? ['base'] : ['base', group.id]);
  const document = await checked(group.documentSchema), node = await checked(group.nodeSchema);
  const allowed = Object.entries(index.nodeOwners).filter(([, owner]) => group.includedGroups.includes(owner)).map(([type]) => type).sort();
  assert.deepEqual(types(document), allowed);
  assert.deepEqual(types(node), [...group.ownedNodeTypes].sort());
  assert.deepEqual([...group.ownedNodeTypes].sort(), Object.entries(index.nodeOwners).filter(([, owner]) => owner === group.id).map(([type]) => type).sort());
  allOwned.push(...group.ownedNodeTypes);
  const valid = new Ajv({ strict: false, allErrors: true }).compile(document);
  bundles.set(group.id, valid);
  const validNode = new Ajv({ strict: false }).compile(node);
  assert.equal(validNode({ version: contract.schemaVersion, body: [{ type: 'text', value: 'A document is not a Node' }] }), false, `${group.id}: Node lookup must reject Document roots`);
  assert.equal(valid({ type: group.ownedNodeTypes[0] }), false, `${group.id}: Document bundle must reject Node roots`);
  for (const example of group.examples) {
    assert.ok(example.repositoryPath.startsWith('examples/') && example.repositoryPath.endsWith('.json'));
    assert.ok(resolveFile(example.path).startsWith(path.join(library, 'examples') + path.sep));
    assert.equal(resolveFile(example.path), path.join(library, example.repositoryPath), 'Example URL and checkout path must name the same file');
    const input = JSON.parse(await readFile(resolveFile(example.path)));
    assert.equal(valid(input), true, JSON.stringify(valid.errors));
    assert.equal(validateDocument(input).ok, true, example.path);
    examples++;
  }
  files += 2;
}
assert.equal(new Set(allOwned).size, allOwned.length);
assert.deepEqual(allOwned.sort(), types(full));
assert.equal(index.nodeSupportExceptions.native, 'rejected');
assert.equal(index.nodeSupportExceptions.markdown, 'plain-text fallback');
assert.ok(index.groups.find(g => g.id === 'compatibility').warning.includes('rejected'));
const dir = await mkdtemp(path.join(tmpdir(), 'inform-schema-union-'));
try {
  const output = path.join(dir, 'union.json');
  const result = spawnSync(process.execPath, [path.join(library, 'scripts/schema-subset.mjs'), '--groups', 'base,forms,charts,finance', '--out', output], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr);
  const union = JSON.parse(await readFile(output));
  const practice = JSON.parse(await readFile(path.join(root, 'examples/local-practice.json')));
  const finance = JSON.parse(await readFile(path.join(root, 'examples/supplied-finance.json'))).body.find(node => node.type === 'finance-quote');
  const mixed = { ...practice, body: [...practice.body, finance] };
  assert.equal(bundles.get('finance')(mixed), false, 'A finance bundle must not pretend to include forms/charts');
  const valid = new Ajv({ strict: false, allErrors: true }).compile(union);
  assert.equal(valid(mixed), true, JSON.stringify(valid.errors));
  assert.equal(validateDocument(mixed).ok, true);
} finally { await rm(dir, { recursive: true, force: true }); }
console.log(`PASS ${workingTree ? "working-tree" : "pinned"} schema discovery: ${index.groups.length} groups, ${files} closed/hash-matched schemas, ${examples} same-pin examples, full inventory ownership, Node-vs-Document boundary and multi-domain union`);
