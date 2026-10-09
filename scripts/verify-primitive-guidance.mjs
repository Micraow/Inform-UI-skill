/** Positive/negative authoring fixtures consume the canonical library validator. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function argument(flag) { const at = process.argv.indexOf(flag); if (at < 0) return; const v = process.argv[at + 1]; assert.ok(v && !v.startsWith('--')); return v; }
const names = ['local-status-primitives.json', 'primitives-with-form-and-time.json'];
const directory = root, readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const positives = await Promise.all(names.map(name => readJson(path.join(directory, 'examples', name))));
const negatives = await readJson(path.join(root, 'tests/primitives-invalid.json'));
console.log(`PASS JSON syntax: ${positives.length} original primitive documents and ${negatives.length} negative fixtures`);
if (!argument('--library')) { console.log('NOT RUN: canonical schema/semantic validation; integration is required. No handwritten substitute schema is used.'); process.exit(0); }
const library = path.resolve(argument('--library')), revision = argument('--revision') ?? (await readJson(path.join(root, 'library-contract.json'))).revision;
assert.match(revision ?? '', /^[a-f0-9]{40}$/);
const git = args => { const r = spawnSync('git', ['-C', library, ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
assert.equal(git(['rev-parse', 'HEAD']), revision); assert.equal(git(['status', '--porcelain']), '', 'Require frozen clean integration');
const pkg = await readJson(path.join(library, 'package.json'));
const api = await import(pathToFileURL(path.resolve(library, pkg.exports['.'].import)).href);
const bytes = await readFile(path.join(library, 'src/schema/iui.schema.json')), full = JSON.parse(bytes);
const index = await readJson(path.join(library, 'src/schema/fragments/index.json'));
const fullHash = createHash('sha256').update(bytes).digest('hex'); assert.equal(fullHash, index.fullSchema.sha256);
for (const type of ['flow', 'icon', 'pulse-indicator']) assert.equal(index.nodeOwners[type], 'base', `${type} not yet integrated into canonical base schema`);
const { createSchemaSubset, assertClosedReferences } = await import(pathToFileURL(path.join(library, 'scripts/schema-subsets.mjs')).href);
const require = createRequire(path.join(library, 'package.json')), Ajv = require('ajv/dist/2020.js').default;
const groupsFor = value => { const groups = new Set(); const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.type === 'string') { assert.ok(index.nodeOwners[v.type]); groups.add(index.nodeOwners[v.type]); } Object.values(v).forEach(walk); }; walk(value); return [...groups].sort(); };
const results = [];
for (let i = 0; i < names.length; i++) {
 const input = positives[i], before = JSON.stringify(input), result = api.validateDocument(input); assert.equal(result.ok, true, JSON.stringify(result.issues));
 const html = await api.compileHtml(input, { backend: 'portable', assets: 'inline', lang: 'zh-CN' }); assert.equal(await api.compileHtml(input, { backend: 'portable', assets: 'inline', lang: 'zh-CN' }), html); assert.equal(JSON.stringify(input), before);
 const groups = groupsFor(input), subset = createSchemaSubset(full, index.nodeOwners, groups); assertClosedReferences(subset);
 const check = new Ajv({ strict: false, allErrors: true }).compile(subset); assert.equal(check(input), true, JSON.stringify(check.errors));
 results.push({ file: names[i], groups, semantic: 'passed', deterministicCompile: 'passed', derivedSubset: 'passed' }); console.log(`PASS ${names[i]}: actual public validator, deterministic compile, immutable input, ${groups.join('+')} derived subset`);
}
for (const entry of negatives) assert.equal(api.validateDocument(entry.document).ok, false, `Invalid primitive accepted: ${entry.name}`);
const baseOnly = new Ajv({ strict: false }).compile(createSchemaSubset(full, index.nodeOwners, ['base'])); assert.equal(baseOnly(positives[1]), false, 'flow does not erase forms/time child domains');
assert.equal(git(['rev-parse', 'HEAD']), revision); assert.equal(git(['status', '--porcelain']), '');
await mkdir(path.join(root, 'artifacts/next-guidance'), { recursive: true });
await writeFile(path.join(root, 'artifacts/next-guidance/primitive-guidance-validation.json'), JSON.stringify({ revision, fullSchemaSha256: fullHash, positives: results, negatives: negatives.length, missingDomainNegative: 'passed', browser: 'not-run', publicCdn: 'not-run' }, null, 2) + '\n');
console.log(`PASS ${negatives.length} canonical-validator negative cases; browser/CDN acceptance is separate`);
