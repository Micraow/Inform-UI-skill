import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases } from './cases.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
export async function verify(library) {
  const root = await realpath(library), lock = await local('source-build-lock.safe.json');
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 148); assert.equal(lock.cdnExecuted, false);
  const checkFiles = async () => { const names = new Set(); for (const f of lock.files) {
    assert.ok(!names.has(f.path) && !path.isAbsolute(f.path) && !f.path.split('/').includes('..')); names.add(f.path);
    const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep)); const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
  } }; await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-income.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-147.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => x.$ref !== '#/$defs/LedgerIncomeTrackerNode'), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json'))); assert.equal(index.nodeOwners['ledger-income-tracker'], 'finance');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const finance = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/finance.schema.json')))); for (const [, d] of cases.positives) assert.equal(finance(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/income-tracker.css'), 'utf8'); for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc }), host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  const tick = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
  const roots = () => [...host.querySelectorAll('.iui-income-tracker')];
  try {
    await tick(); const [known, unknown, empty] = roots(); assert.equal(known.querySelector('.iui-income-estimate-value').textContent, '900 credits supplied'); assert.equal(known.querySelector('.iui-income-paycheck-amount').textContent, '0 credits supplied'); assert.equal(unknown.querySelector('.iui-income-paycheck-amount').textContent, ''); assert.match(unknown.querySelector('.iui-income-paycheck-meta').textContent, /Date not supplied/); assert.equal(empty.querySelector('.iui-income-estimate-value'), null); assert.match(empty.textContent, /no recurring income/);
    checks.push('Opaque supplied estimate and true-zero paycheck remain independent from missing and explicitly absent income');
    controller.update(cases.positives.find(([n]) => n === 'masked amounts preserve absent data')[1]); await tick(); assert.equal(roots()[0].querySelector('.iui-income-estimate-value').textContent, 'Hidden by the host'); assert.equal(roots()[0].querySelector('.iui-income-paycheck-amount').textContent, 'Hidden by the host'); assert.equal(roots()[1].querySelector('.iui-income-paycheck-amount').textContent, '');
    checks.push('Masking changes known display amounts while a missing paycheck amount remains empty');
    controller.update(cases.positives.find(([n]) => n === 'explicitly no upcoming paycheck')[1]); await tick(); assert.equal(roots()[0].querySelector('.iui-income-paycheck'), null); assert.match(roots()[0].textContent, /No upcoming paycheck supplied/); assert.match(roots()[0].textContent, /900 credits supplied/);
    checks.push('An explicit null upcoming paycheck has its own message without removing the supplied estimate');
    controller.update(cases.positives.find(([n]) => n === 'safe supplied source link')[1]); await tick(); const link = roots()[0].querySelector('a'); assert.equal(link.href, 'https://example.org/supplied-income'); assert.equal(link.target, '_blank'); assert.match(link.rel, /noopener/); assert.match(link.rel, /noreferrer/); assert.equal(link.referrerPolicy, 'no-referrer');
    checks.push('A supplied reference remains an ordinary safe link without automatic navigation');
    const literal = structuredClone(input); literal.body[0].estimatedMonthlyIncomeLabel = '<img src=x onerror=untrusted()>'; literal.body[0].nextPaycheck.name = '<script>untrusted()</script>'; controller.update(literal); await tick(); assert.equal(roots()[0].querySelector('.iui-income-estimate-value').textContent, literal.body[0].estimatedMonthlyIncomeLabel); assert.equal(host.querySelector('script'), null); assert.equal(host.querySelector('input,select,button'), null); const beforeReset = host.textContent; form.reset(); await tick(); assert.equal(host.textContent, beforeReset); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Display labels stay literal and this read-only snapshot adds no form controls or reset mutation');
    const beforeBad = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'unsafe paycheck logo')[1])); assert.equal(host.innerHTML, beforeBad); const oldImage = host.querySelector('img'); assert.ok(oldImage?.hasAttribute('src')); controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'New reading' }] }); await tick(); assert.equal(oldImage.hasAttribute('src'), false); assert.match(host.textContent, /New reading/);
    checks.push('Unsafe updates are atomic and replacement releases the old owned logo source');
  } finally { controller.dispose(); dom.window.close(); }
  const deferredDOM = new JSDOM('<aside></aside>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc }), deferredHost = deferredDOM.window.document.createElement('main'), deferred = browser.mount(deferredHost, input, { styles: false });
  try { await tick(); assert.equal(deferredHost.querySelector('img')?.hasAttribute('src') ?? false, false); deferredDOM.window.document.body.append(deferredHost); await tick(); const image = deferredHost.querySelector('img'); assert.ok(image?.hasAttribute('src')); deferredDOM.window.document.querySelector('aside').append(deferredHost); deferredDOM.window.document.body.append(deferredHost); await tick(); assert.equal(image.hasAttribute('src'), false); checks.push('Shared first connection starts the inline logo and observed owner loss retires it permanently'); } finally { deferred.dispose(); deferredDOM.window.close(); }
  const artifact = await node.compileArtifact(input); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  assert.equal(requests, 0); assert.deepEqual(errors, []); await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 148, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, imageDecoded: false, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
