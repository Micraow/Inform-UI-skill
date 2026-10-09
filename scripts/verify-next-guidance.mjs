/** Original component guidance regression. Never modifies the library or hand-maintains schema. */
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['foundation-explainer.json', 'local-time.json', 'local-overlays.json', 'local-number-draft.json', 'timed-local-practice.json', 'local-status-primitives.json', 'primitives-with-form-and-time.json'];
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function argument(flag) { const at = process.argv.indexOf(flag); if (at < 0) return; const value = process.argv[at + 1]; assert.ok(value && !value.startsWith('--'), `${flag} needs a value`); return value; }
const docs = new Map();
for (const name of names) docs.set(name, await readJson(path.join(root, 'examples', name)));
const history = await readJson(path.join(root, 'tests/frozen-history-sha256.json'));
assert.ok(Object.keys(history).length > 0, 'History manifest must not be vacuously empty');
for (const [name, expected] of Object.entries(history)) assert.equal(hash(await readFile(path.join(root, name))), expected, `Frozen history changed: ${name}`);
const literalDocs = [];
for (const name of ['SKILL.md', 'WEB-CHAT-GUIDE.md']) {
  const content = await readFile(path.join(root, name), 'utf8');
  for (const match of content.matchAll(/^```json\r?\n([\s\S]*?)^```/gm)) {
    const parsed = JSON.parse(match[1]); literalDocs.push({ name, document: parsed.version ? parsed : { version: 'iui/1', body: [parsed] } });
  }
  const html = content.match(/^```html\r?\n([\s\S]*?)^```/m)?.[1];
  assert.ok(html, `${name}: the complete current HTML shell must be retained`);
  const raw = html.match(/<script id="iui-spec" type="application\/json">\s*([\s\S]*?)\s*<\/script>/)?.[1];
  JSON.parse(raw);
}
console.log(`PASS syntax: ${names.length} new documents, ${literalDocs.length} root/guide JSON literals, ${Object.keys(history).length} byte-frozen historical files`);
if (!argument('--library')) {
  console.log('NOT RUN: real-library semantic, compilation, schema subsets, browser, public CDN. Pass --library PATH --revision FROZEN_SHA for the pinned frozen library.');
  process.exit(0);
}
const library = path.resolve(argument('--library')), revision = argument('--revision') ?? (await readJson(path.join(root, 'library-contract.json'))).revision;
assert.match(revision ?? '', /^[0-9a-f]{40}$/, 'Explicit frozen 40-character revision required');
function git(args) { const result = spawnSync('git', ['-C', library, ...args], { encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); return result.stdout; }
assert.equal(git(['rev-parse', 'HEAD']).trim(), revision, 'Wrong library revision');
assert.equal(git(['status', '--porcelain', '--untracked-files=normal']).trim(), '', 'Wait for a clean frozen library; do not test a moving integration tree');
const pkg = await readJson(path.join(library, 'package.json'));
assert.equal(pkg.name, '@micraow/inform-ui');
const api = await import(pathToFileURL(path.resolve(library, pkg.exports['.'].import)).href);
const fullPath = path.resolve(library, pkg.exports['./schema']);
const fullBytes = await readFile(fullPath), full = JSON.parse(fullBytes);
const indexPath = path.join(library, 'src/schema/fragments/index.json'), index = await readJson(indexPath);
assert.equal(hash(fullBytes), index.fullSchema.sha256, 'Index does not match canonical full schema');
const { createSchemaSubset, assertClosedReferences } = await import(pathToFileURL(path.join(library, 'scripts/schema-subsets.mjs')).href);
const require = createRequire(path.join(library, 'package.json')), Ajv = require('ajv/dist/2020.js').default;
const compile = schema => new Ajv({ strict: false, allErrors: true }).compile(schema);
function owners(value, groups = new Set()) {
  if (!value || typeof value !== 'object') return groups;
  if (!Array.isArray(value) && typeof value.type === 'string') {
    assert.ok(index.nodeOwners[value.type], `No schema owner for ${value.type}`); groups.add(index.nodeOwners[value.type]);
  }
  for (const child of Object.values(value)) owners(child, groups);
  return groups;
}
const results = [];
for (const [name, document] of docs) {
  const before = JSON.stringify(document), checked = api.validateDocument(document);
  assert.equal(checked.ok, true, `${name}: ${JSON.stringify(checked.issues)}`);
  const html = await api.compileHtml(document, { backend: 'portable', assets: 'inline', lang: 'zh-CN' });
  assert.match(html, /<!doctype html>/i); assert.equal(await api.compileHtml(document, { backend: 'portable', assets: 'inline', lang: 'zh-CN' }), html, `${name}: nondeterministic compilation`);
  assert.equal(JSON.stringify(document), before, `${name}: input mutated`);
  const groups = [...owners(document)].sort(), subset = createSchemaSubset(full, index.nodeOwners, groups);
  assertClosedReferences(subset); const validate = compile(subset);
  assert.equal(validate(document), true, `${name}: subset rejected ${JSON.stringify(validate.errors)}`);
  const cli = spawnSync(process.execPath, [path.join(library, 'bin/iui.mjs'), 'validate', path.join(root, 'examples', name), '--json'], { encoding: 'utf8' });
  assert.equal(cli.status, 0, `${name}: CLI rejected ${cli.stderr} ${cli.stdout}`);
  assert.equal(JSON.parse(cli.stdout).ok, true);
  results.push({ file: name, groups, sourceSha256: hash(before), compiledHtmlSha256: hash(html), semantic: 'passed', deterministicCompile: 'passed', canonicalSubset: 'passed', cli: 'passed' });
  console.log(`PASS ${name}: public validator, CLI, deterministic compile, unchanged input, derived ${groups.join('+')} closed subset`);
}
const existingExampleNames = (await readdir(path.join(root, 'examples'))).filter(name => name.endsWith('.json') && !names.includes(name)).sort();
for (const name of existingExampleNames) {
  const document = await readJson(path.join(root, 'examples', name)), before = JSON.stringify(document);
  const valid = api.validateDocument(document); assert.equal(valid.ok, true, `${name}: existing example ${JSON.stringify(valid.issues)}`);
  const html = await api.compileHtml(document, { backend: 'portable', assets: 'inline', lang: 'zh-CN' });
  assert.equal(await api.compileHtml(document, { backend: 'portable', assets: 'inline', lang: 'zh-CN' }), html, `${name}: existing compilation drift`);
  assert.equal(JSON.stringify(document), before, `${name}: existing input mutation`);
}
console.log(`PASS ${existingExampleNames.length} unchanged existing examples: public validator, deterministic compilation and unchanged input`);
for (const item of literalDocs) { const result = api.validateDocument(item.document); assert.equal(result.ok, true, `${item.name} literal: ${JSON.stringify(result.issues)}`); }
console.log(`PASS all ${literalDocs.length} root/guide literals against frozen public validateDocument`);
const doc = node => ({ version: 'iui/1', body: [node] });
const clock = { type: 'clock', mode: 'snapshot', timezone: 'UTC', at: '2026-10-09T00:00:00Z' };
const mutated = (node, change) => { const value = structuredClone(node); change(value); return value; };
const invalid = [
 ['snapshot lacks at', mutated(clock, n => delete n.at)], ['live has at', { ...clock, mode: 'live' }],
 ['impossible date', { ...clock, at: '2026-02-30T00:00:00Z' }], ['offset absent', { ...clock, at: '2026-10-09T00:00:00' }],
 ['timezone invalid', { ...clock, timezone: 'Invalid/Zone' }], ['clock config bound', { ...clock, seconds: { $: 'x' } }],
 ['negative elapsed', { type: 'stopwatch', elapsedMs: -1 }], ['elapsed overflow', { type: 'stopwatch', elapsedMs: 604800001 }],
 ['fractional elapsed', { type: 'stopwatch', elapsedMs: 1.5 }], ['zero timer', { type: 'timer', durationMs: 0 }],
 ['duration overflow', { type: 'timer', durationMs: 604800001 }], ['fractional duration', { type: 'timer', durationMs: 0.5 }],
 ['timer bind unsupported', { type: 'timer', durationMs: 1000, bind: 'duration' }], ['alarm unsupported', { type: 'timer', durationMs: 1000, notify: true }],
 ['tooltip children', { type: 'tooltip', label: 'Help', value: 'Text', children: [{ type: 'text', value: 'No' }] }],
 ['tooltip expression', { type: 'tooltip', label: 'Help', value: { $: 'x' } }], ['empty trigger', { type: 'tooltip', label: '', value: 'Text' }],
 ['tooltip text overflow', { type: 'tooltip', label: 'Help', value: 'x'.repeat(2001) }], ['unknown placement', { type: 'tooltip', label: 'Help', value: 'Text', placement: 'auto' }],
 ['empty popover', { type: 'popover', label: 'Open', children: [] }], ['popover child limit', { type: 'popover', label: 'Open', children: Array.from({ length: 21 }, () => ({ type: 'text', value: 'Example' })) }],
 ['popover remote loader', { type: 'popover', label: 'Open', children: [{ type: 'text', value: 'Example' }], src: 'https://example.com/' }],
 ['text sources conflict', { type: 'text', value: 'Text', runs: [{ value: 'Text' }] }], ['empty text runs', { type: 'text', runs: [] }],
 ['grid item outside grid', { type: 'grid-item', children: [{ type: 'text', value: 'Example' }] }],
 ['grid span exceeds parent', { type: 'grid', columns: 2, children: [{ type: 'grid-item', colSpan: 3, children: [{ type: 'text', value: 'Example' }] }] }],
 ['table sources conflict', { type: 'table', columns: ['A'], rows: [[1]], sections: [{ kind: 'body', rows: [[1]] }] }],
 ['table span past section', { type: 'table', columns: ['A'], rows: [[{ value: 1, rowSpan: 2 }]] }],
 ['body cannot be column header', { type: 'table', columns: ['A'], rows: [[{ value: 'A', header: true, scope: 'col' }]] }],
];
for (const [name, node] of invalid) { const result = api.validateDocument(doc(node)); assert.equal(result.ok, false, `${name}: unexpectedly accepted`); }
console.log(`PASS rejects ${invalid.length} invalid time/overlay/foundation inputs`);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html lang="zh-CN"><body><main></main></body></html>', { pretendToBeVisual: true });
const host = dom.window.document.querySelector('main'), controller = api.mount(host, docs.get('local-number-draft.json'));
try {
 const number = host.querySelector('input[type=number]'), form = host.querySelector('form');
 const fill = value => { number.value = value; number.dispatchEvent(new dom.window.Event('input', { bubbles: true })); };
 fill('3'); assert.equal(controller.getState().samples, 6); assert.equal(number.value, '3');
 controller.setState({ note: 'Unrelated update' }); assert.equal(number.value, '3');
 controller.setState({ samples: 6 }); assert.equal(number.value, '6');
 fill('3'); controller.setState({ samples: 100 }); assert.equal(controller.getState().samples, 100); assert.equal(number.value, '100');
 form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
 assert.equal(form.dataset.status, 'invalid'); assert.equal(number.getAttribute('aria-invalid'), 'true');
 const textInput = host.querySelector('input[type=text]'); textInput.value = ''; textInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
 assert.equal(controller.getState().note, '');
} finally { controller.dispose(); dom.window.close(); }
console.log('PASS public mount in JSDOM: numeric DOM draft gate, unrelated state, same-value overwrite, authoritative out-of-range host state, invalid submit, immediate text binding (not real browser)');
const mixed = docs.get('timed-local-practice.json'), formsOverlay = docs.get('local-number-draft.json');
for (const [name, groups, document] of [['time-only excludes forms/charts', ['base', 'time'], mixed], ['forms-only excludes time/charts', ['base', 'forms'], mixed], ['base popover does not erase child domain', ['base'], formsOverlay]]) {
 const check = compile(createSchemaSubset(full, index.nodeOwners, groups)); assert.equal(check(document), false, name); console.log(`PASS subset boundary: ${name}`);
}
const timeNodeOnly = compile(createSchemaSubset(full, index.nodeOwners, ['time'], { rootKind: 'node' }));
assert.equal(timeNodeOnly(clock), true); assert.equal(timeNodeOnly(docs.get('local-time.json')), false);
const timeDocument = compile(createSchemaSubset(full, index.nodeOwners, ['base', 'time']));
assert.equal(timeDocument(clock), false);
const oldSchema = JSON.parse(git(['show', '6797f7f7755f483db6c3be3831aa03433b7c4696:src/schema/iui.schema.json']));
const oldCheck = compile(oldSchema);
for (const [name, document] of docs) assert.equal(oldCheck(document), false, `New example must not silently claim old CDN compatibility: ${name}`);
console.log('PASS Node/Document roots are not interchangeable; old 6797 schema rejects all new examples');
assert.equal(git(['rev-parse', 'HEAD']).trim(), revision, 'Library HEAD moved during validation');
assert.equal(git(['status', '--porcelain', '--untracked-files=normal']).trim(), '', 'Library changed during validation');
assert.equal(hash(await readFile(fullPath)), hash(fullBytes), 'Canonical schema changed during validation');
const report = { libraryRevision: revision, fullSchemaSha256: hash(fullBytes), indexSha256: hash(await readFile(indexPath)), examples: results, existingExamples: existingExampleNames.length, literalExamples: literalDocs.length, invalidInputs: invalid.length, frozenHistoryFiles: Object.keys(history).length, hostStateBoundary: 'passed-public-mount-JSDOM-not-browser', browser: 'not-run', publicCdn: 'not-run' };
await mkdir(path.join(root, 'artifacts/next-guidance'), { recursive: true });
await writeFile(path.join(root, 'artifacts/next-guidance/frozen-library-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Local consumer validation passed. NOT RUN: real browser, screenshots, public CDN. No release/acceptance count is implied.');
