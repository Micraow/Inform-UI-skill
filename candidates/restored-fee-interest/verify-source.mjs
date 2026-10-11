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
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 141); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/schema/iui.schema.json', 'src/renderer/fee-interest.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-fee-interest.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-140.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['LedgerFeeInterestPaidNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  for (const n of input.body) assert.equal(index.nodeOwners[n.type], 'finance');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const finance = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/finance.schema.json'))));
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json'))));
  for (const [, d] of cases.positives) assert.equal(finance(d), true); assert.equal(base(input), false);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/fee-interest.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  const change = (c, v) => { c.value = v; c.dispatchEvent(new dom.window.Event('change')); }, flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  try {
    await flush(); let root = host.querySelector('.iui-fee-interest'), select = root.querySelector('select'), total = root.querySelector('.iui-fee-interest-total');
    assert.equal(total.textContent, 'USD 900.00 supplied'); assert.equal(root.querySelectorAll('[role=listitem]').length, 5);
    assert.deepEqual([...root.querySelectorAll('.iui-fee-interest-amount')].map(x => x.textContent), ['USD 1.00', 'USD 2.00', 'USD 3.00', 'USD 0.00', 'Amount not supplied']); assert.equal(root.querySelector('.iui-fee-interest-more-wrap').hidden, true);
    checks.push('Total and row display labels remain independent, including true zero and missing text');
    const six = cases.positives.find(([n]) => n === 'six-row disclosure')[1]; controller.update(six); await flush(); root = host.querySelector('.iui-fee-interest'); select = root.querySelector('select'); total = root.querySelector('.iui-fee-interest-total'); const more = root.querySelector('.iui-fee-interest-more');
    assert.equal(root.querySelectorAll('[role=listitem]').length, 5); assert.equal(root.querySelector('.iui-fee-interest-more-wrap').hidden, false);
    const cancel = e => e.preventDefault(); more.addEventListener('click', cancel, true); more.click(); assert.equal(root.querySelectorAll('[role=listitem]').length, 5); more.removeEventListener('click', cancel, true);
    more.click(); await flush(); assert.equal(root.querySelectorAll('[role=listitem]').length, 6); assert.equal(more.getAttribute('aria-expanded'), 'true'); assert.equal(more.textContent, 'Show fewer rows');
    more.click(); await flush(); assert.equal(root.querySelectorAll('[role=listitem]').length, 5); assert.equal(more.getAttribute('aria-expanded'), 'false');
    checks.push('Local six-row disclosure is bounded, reversible and cancelable');
    change(select, 'zero'); assert.equal(total.textContent, 'USD 0.00 supplied'); assert.equal(root.querySelector('.iui-fee-interest-empty').hidden, false); assert.match(root.querySelector('.iui-fee-interest-empty').textContent, /No charges supplied/);
    change(select, 'unknown'); assert.equal(total.textContent, 'Total not supplied'); assert.equal(root.querySelectorAll('[role=listitem]').length, 1); assert.equal(root.querySelector('.iui-fee-interest-empty').hidden, true);
    checks.push('Zero and unknown totals keep distinct supplied labels and empty-state behavior');
    form.reset(); await flush(); assert.equal(select.value, 'unknown'); assert.equal(total.textContent, 'Total not supplied');
    form.addEventListener('reset', e => e.preventDefault(), { once: true }); form.reset(); await flush(); assert.equal(select.value, 'unknown'); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Outer form reset preserves accepted local range and cancellation, with no submitted reader fields');
    change(select, 'month'); await flush(); const logo = root.querySelector('img'); assert.ok(logo); assert.match(logo.src, /^data:image\/png;base64,/); logo.dispatchEvent(new dom.window.Event('load')); assert.equal(logo.parentElement.dataset.logo, 'loaded');
    change(select, 'zero'); assert.equal(logo.hasAttribute('src'), false); const beforeLate = root.innerHTML; logo.dispatchEvent(new dom.window.Event('error')); assert.equal(root.innerHTML, beforeLate);
    checks.push('Original inline logo is retired when its local range leaves the view');
    controller.update(cases.positives.find(([n]) => n === 'masked disabled reading')[1]); root = host.querySelector('.iui-fee-interest'); select = root.querySelector('select'); assert.equal(select.disabled, true); assert.equal(root.querySelector('.iui-fee-interest-total').textContent, 'Amounts hidden'); assert.ok([...root.querySelectorAll('.iui-fee-interest-amount')].every(e => e.textContent === 'Amounts hidden'));
    change(select, 'zero'); assert.equal(select.value, 'month'); controller.update(input); const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'duplicate range ID')[1])); assert.equal(host.innerHTML, before);
    checks.push('Masking and disabled reading preserve supplied selection; invalid range updates are atomic');
    controller.update(cases.positives.find(([n]) => n === 'literal display copy')[1]); assert.equal(host.querySelector('script,iframe'), null); assert.match(host.textContent, /<script>literal charge<\/script>/); assert.match(host.textContent, /<img src=untrusted>/);
    controller.update(cases.positives.find(([n]) => n === 'no supplied ranges')[1]); assert.equal(host.querySelector('.iui-fee-interest-total').hidden, true); assert.match(host.textContent, /No fee or interest entries supplied/);
    controller.dispose(); const after = host.innerHTML; more.click(); change(select, 'unknown'); assert.equal(host.innerHTML, after); assert.deepEqual(errors, []); assert.equal(requests, 0);
    checks.push('Literal copy, absent ranges and disposal stay finite and stable');
  } finally { controller.dispose(); dom.window.close(); }
  const artifact = await node.compileArtifact(input); assert.deepEqual(artifact, await node.compileArtifact(input)); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 141, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
