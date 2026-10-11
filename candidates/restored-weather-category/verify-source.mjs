import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases } from './cases.mjs';
import { mountCategoryReceipt } from './consumer.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
export async function verify(library) {
  const root = await realpath(library), lock = await local('source-build-lock.safe.json');
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 138); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/schema/iui.schema.json', 'src/renderer/weather-sidebar.ts', 'src/renderer/category-correction.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-weather-category.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-136.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['WeatherSidebarTitleNode', 'LedgerLowConfidenceCategoryCorrectionNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  assert.equal(index.nodeOwners[input.body[0].type], 'weather'); assert.equal(index.nodeOwners[input.body[1].type], 'finance');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const fragments = {};
  for (const group of ['weather', 'finance', 'base']) fragments[group] = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/' + group + '.schema.json'))));
  for (const [, d] of cases.positives) { assert.equal(fragments.weather({ ...d, body: [d.body[0]] }), true); assert.equal(fragments.finance({ ...d, body: [d.body[1]] }), true); }
  assert.equal(fragments.base(input), false); assert.equal(fragments.weather(input), false); assert.equal(fragments.finance(input), false);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); for (const name of ['weather-sidebar', 'category-correction']) assert.ok(api.styles.includes(await readFile(path.join(root, 'src/renderer/' + name + '.css'), 'utf8'))); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form><output></output>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), output = dom.window.document.querySelector('output');
  const adapter = mountCategoryReceipt(browser, host, input, output), controller = adapter.controller;
  const change = (c, v) => { c.value = v; c.dispatchEvent(new dom.window.Event('change')); };
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  try {
    const weather = host.querySelector('.iui-weather-sidebar-title'), category = host.querySelector('.iui-category-correction');
    const active = () => weather.querySelector('.iui-weather-title-place:not([hidden])'), place = weather.querySelector('select');
    assert.equal(active().dataset.placeId, 'freezing'); assert.equal(active().querySelector('strong').textContent, '32°F');
    weather.querySelector('[data-weather-title-unit=celsius]').click(); assert.equal(active().querySelector('strong').textContent, '0°C');
    change(place, 'p1'); assert.equal(active().querySelector('strong').textContent, '-40°C'); weather.querySelector('[data-weather-title-unit=fahrenheit]').click(); assert.equal(active().querySelector('strong').textContent, '-40°F');
    assert.equal(active().querySelector('time').dateTime, '2028-02-29T00:30Z'); assert.match(active().querySelector('time').textContent, /28/);
    checks.push('Weather uses supplied timezone and reversible zero/minus-forty unit conversions');
    change(place, 'p2'); assert.equal(active().querySelector('strong').textContent, 'Not supplied'); assert.equal(active().querySelector('time'), null);
    weather.querySelector('.iui-weather-title-reset').click(); assert.equal(active().dataset.placeId, 'freezing'); assert.equal(active().querySelector('strong').textContent, '32°F');
    checks.push('Unknown temperature and time remain missing; reset restores supplied initial state');
    const fields = [...category.querySelectorAll('select')]; assert.ok(fields.every(f => f.value === ''));
    assert.deepEqual([...category.querySelectorAll('.iui-correction-money')].map(e => e.textContent), ['0.000000000000000001 USD', '0 JPY', 'Not supplied EUR']);
    change(fields[0], 'c1'); change(fields[1], 'c2'); assert.match(category.querySelector('.iui-correction-count').textContent, /^2 /);
    category.querySelector('.iui-correction-review').click(); assert.equal(category.querySelector('.iui-correction-panel').hidden, false);
    checks.push('Exact decimal money is displayed unchanged and supplied suggestions are not auto-selected');
    let detail; const capture = e => { detail = e.detail; }; host.addEventListener('iui:ledger-category-correction', capture);
    category.querySelector('.iui-correction-confirm').click();
    assert.deepEqual(JSON.parse(output.textContent), { componentId: 'category-draft', snapshotId: 'synthetic-review-v1', changes: [{ transactionId: 'precision', fromCategoryId: 'archive', toCategoryId: 'materials' }, { transactionId: 'zero', fromCategoryId: null, toCategoryId: 'other' }] });
    assert.ok(Object.isFrozen(detail) && Object.isFrozen(detail.changes) && detail.changes.every(Object.isFrozen));
    assert.match(category.querySelector('.iui-correction-status').textContent, /canceled/); assert.equal(fields[0].value, 'c1'); host.removeEventListener('iui:ledger-category-correction', capture);
    checks.push('External local receipt adapter cancels frozen confirmation without writing any account data');
    category.querySelector('.iui-correction-cancel').click(); assert.equal(category.querySelector('.iui-correction-panel').hidden, true); assert.equal(fields[0].value, 'c1');
    category.querySelector('.iui-correction-review').click(); change(fields[0], 'c2'); assert.equal(category.querySelector('.iui-correction-confirm').getAttribute('aria-disabled'), 'true');
    const previousReceipt = output.textContent; category.querySelector('.iui-correction-confirm').click(); assert.equal(output.textContent, previousReceipt);
    category.querySelector('.iui-correction-review').click(); category.querySelector('.iui-correction-confirm').click(); assert.equal(JSON.parse(output.textContent).changes[0].toCategoryId, 'other');
    checks.push('Closing review preserves drafts and changing a reviewed draft requires another review');
    change(place, 'p1'); form.addEventListener('reset', e => e.preventDefault(), { once: true }); form.reset(); await flush(); assert.equal(place.value, 'p1'); assert.equal(fields[0].value, 'c2');
    form.reset(); await flush(); assert.equal(place.value, 'p0'); assert.ok(fields.every(f => f.value === '')); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Shared parent form reset honors cancellation across both components');
    const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'unknown original category')[1])); assert.equal(host.innerHTML, before);
    controller.update(cases.positives.find(([n]) => n === 'literal labels and descriptions')[1]); assert.equal(host.querySelector('img,script,svg,iframe'), null); assert.match(host.textContent, /<script>literal transaction<\/script>/);
    checks.push('Invalid references are atomic and supplied category labels remain plain text');
    controller.update(cases.positives.find(([n]) => n === 'empty supplied collections')[1]); assert.match(host.textContent, /No places supplied/); assert.match(host.textContent, /No transactions supplied/);
    controller.update(input); adapter.dispose(); adapter.dispose(); const finalReceipt = output.textContent;
    host.dispatchEvent(new dom.window.CustomEvent('iui:ledger-category-correction', { detail: { obsolete: true }, cancelable: true })); assert.equal(output.textContent, finalReceipt);
    checks.push('Empty data is explicit and the original adapter releases its listener idempotently');
    assert.deepEqual(errors, []); assert.equal(requests, 0);
  } finally { adapter.dispose(); dom.window.close(); }
  const artifact = await node.compileArtifact(input); assert.deepEqual(artifact, await node.compileArtifact(input));
  const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 138, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
