import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkSkill, root } from './check-skill.mjs';

const argument = process.argv.indexOf('--library');
if (argument >= 0 && !process.argv[argument + 1]) throw new Error('--library requires a checkout path.');
const library = path.resolve(argument >= 0 ? process.argv[argument + 1] : process.env.IUI_LIBRARY_DIR || path.join(root, '../Intelligent-UI'));
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const contract = await readJson(path.join(root, 'library-contract.json'));
const packageJson = await readJson(path.join(library, 'package.json')).catch(error => {
  throw new Error(`Build the matched Intelligent-UI checkout and pass --library PATH. Cannot read ${library}: ${error.message}`);
});
assert.equal(packageJson.name, contract.packageName, 'Wrong library package');
assert.equal(packageJson.version, contract.packageVersion, 'Library version differs from the tested contract');
if (!process.argv.includes('--allow-working-tree')) {
  assert.match(contract.revision ?? '', /^[a-f0-9]{40}$/, 'Contract needs a verified library commit');
  const revision = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  assert.equal(revision.status, 0, 'Use the pinned Git checkout, or explicitly opt into --allow-working-tree for development');
  assert.equal(revision.stdout.trim(), contract.revision, 'Library checkout differs from the pinned tested revision');
}
function exportedPath(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return exportedPath(value.import ?? value.default);
  throw new Error('The library must expose an ESM import/default entrypoint.');
}
const entry = path.resolve(library, exportedPath(packageJson.exports['.']));
const api = await import(pathToFileURL(entry).href).catch(error => {
  throw new Error(`Cannot import built library ${entry}; run npm ci and npm run build in the library. ${error.message}`);
});
for (const name of contract.apiExports) assert.equal(typeof api[name], 'function', `Missing public API export ${name}`);
const schema = await readJson(path.resolve(library, exportedPath(packageJson.exports[contract.schemaExport])));
assert.equal(schema.properties.version.const, contract.schemaVersion);
const inventory = await readJson(path.join(root, 'references/node-support.json'));
assert.deepEqual(schema.$defs.Node.oneOf.map(node => { const definition = node.$ref ? schema.$defs[node.$ref.split('/').at(-1)] : node; return definition.properties.type.const; }).sort(), inventory.map(item => item.type).sort(), 'Node inventory drifted from the real library schema');
await checkSkill();

const names = (await readdir(path.join(root, 'examples'))).filter(name => name.endsWith('.json')).sort();
const directory = await mkdtemp(path.join(tmpdir(), 'intelligent-ui-skill-'));
function cli(args) {
  const result = spawnSync(process.execPath, [path.join(library, contract.cli), ...args], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  return result;
}
try {
  for (const name of names) {
    const file = path.join(root, 'examples', name);
    const document = await readJson(file);
    const before = JSON.stringify(document);
    const result = api.validateDocument(document);
    assert.equal(result.ok, true, `${name}: ${JSON.stringify(result.issues)}`);
    const options = { backend: 'portable', assets: 'inline', lang: name === 'hpcc-feedback.json' ? 'zh-CN' : 'en' };
    const html = await api.compileHtml(result.document, options);
    assert.equal(typeof html, 'string');
    assert.ok(html.toLowerCase().includes('<!doctype html>'), `${name}: no standalone HTML document`);
    assert.equal(await api.compileHtml(result.document, options), html, `${name}: nondeterministic compilation`);
    assert.equal(JSON.stringify(document), before, `${name}: validation or compilation mutated input`);
    cli(['validate', file, '--json']);
    const out = path.join(directory, name.replace(/\.json$/, '.html'));
    cli(['build', file, '--out', out, '--lang', options.lang]);
    assert.equal(await readFile(out, 'utf8'), html, `${name}: API/CLI build mismatch`);
    console.log(`PASS ${name}: validate, compile twice, CLI validate/build, input immutability`);
  }
  const feedback = await readJson(path.join(root, 'examples/hpcc-feedback.json'));
  assert.equal(typeof api.evaluateState, 'function', 'Missing public state evaluator');
  for (const [load, maximum, window] of [[1.2, 1.2, 84.16666666666666], [0.9, 0.9, 110.55555555555554], [0.4, 0.9, 110.55555555555554], [1.5, 1.5, 68.33333333333333]]) {
    const evaluated = api.evaluateState(feedback, { middleLoad: load });
    assert.equal(evaluated.ok, true, JSON.stringify(evaluated.issues));
    assert.equal(evaluated.computed.maximumLoad, maximum);
    assert.ok(Math.abs(evaluated.computed.nextWindow - window) < 1e-9, 'Feedback calculation disagrees with explanatory prose');
  }
  console.log('PASS feedback values at initial, changed, minimum and maximum inputs');
  const invalid = [
    ['unknown type', { version: 'iui/1', body: [{ type: 'live-weather', city: 'Example' }] }],
    ['native runtime', { version: 'iui/1', body: [{ type: 'native', name: 'text', children: [] }] }],
    ['undefined reference', { version: 'iui/1', body: [{ type: 'metric', label: 'Missing', value: { $: 'undeclared' } }] }],
    ['invalid table shape', { version: 'iui/1', body: [{ type: 'table', columns: ['A', 'B'], rows: [[1]] }] }],
    ['unsafe link', { version: 'iui/1', body: [{ type: 'link', value: 'Unsafe', href: 'javascript:alert(1)' }] }],
    ['computed cycle', { version: 'iui/1', computed: { a: { $: 'b' }, b: { $: 'a' } }, body: [{ type: 'text', value: { $: 'a' } }] }],
    ['invalid slider binding', { version: 'iui/1', state: { value: 'not numeric' }, body: [{ type: 'slider', label: 'Input', bind: 'value', min: 0, max: 10, step: 1 }] }]
  ];
  for (const [label, document] of invalid) {
    const result = api.validateDocument(document);
    assert.equal(result.ok, false, `${label}: unsafe/invalid input accepted`);
    assert.ok(result.issues.length > 0);
    for (const issue of result.issues) {
      assert.equal(typeof issue.code, 'string');
      assert.equal(typeof issue.path, 'string');
      assert.ok(issue.path === '' || issue.path.startsWith('/'));
      assert.equal(typeof issue.message, 'string');
    }
    const invalidFile = path.join(directory, `invalid-${label.replaceAll(' ', '-')}.json`);
    await writeFile(invalidFile, JSON.stringify(document));
    const cliResult = spawnSync(process.execPath, [path.join(library, contract.cli), 'validate', invalidFile, '--json'], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(cliResult.status, 1, `${label}: CLI exit code should identify invalid input`);
    assert.deepEqual(JSON.parse(cliResult.stdout), result, `${label}: CLI/API diagnostics differ`);
    await assert.rejects(() => api.compileHtml(document, { backend: 'portable', assets: 'inline' }), `${label}: compiler accepted invalid input`);
    console.log(`PASS rejects ${label}`);
  }
  console.log(`Verified ${names.length} examples and ${invalid.length} invalid inputs against ${packageJson.name}@${packageJson.version}.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
