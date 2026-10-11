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
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 139); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/schema/iui.schema.json', 'src/renderer/net-worth.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-net-worth.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-138.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['LedgerNetWorthNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  for (const n of input.body) assert.equal(index.nodeOwners[n.type], 'finance');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const finance = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/finance.schema.json'))));
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json'))));
  for (const [, d] of cases.positives) assert.equal(finance(d), true); assert.equal(base(input), false);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/net-worth.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  const key = (chart, value) => chart.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  try {
    let root = host.querySelector('.iui-net-worth'), chart = root.querySelector('.iui-net-worth-chart'), value = root.querySelector('.iui-net-worth-value'), tooltip = root.querySelector('.iui-net-worth-tooltip');
    assert.equal(value.dataset.rawValue, '900'); assert.match(root.querySelector('.iui-net-worth-change').textContent, /-25 USD/); assert.match(root.querySelector('.iui-net-worth-change').textContent, /-2.7/);
    assert.equal(chart.querySelectorAll('[data-net-worth-segment]').length, 2); assert.equal(chart.querySelectorAll('[data-point-index]').length, 3);
    assert.equal(chart.querySelector('[data-point-index="1"]'), null); assert.ok([...chart.querySelectorAll('circle')].every(dot => dot.getAttribute('r') === '0'));
    checks.push('Supplied current900 and change facts stay independent of last observation120, with null gaps and no default dots');
    key(chart, 'Home'); assert.equal(value.dataset.rawValue, '0'); assert.equal(tooltip.hidden, false); assert.match(tooltip.textContent, /2028-02-01/);
    key(chart, 'ArrowRight'); assert.equal(value.textContent, 'Not supplied'); assert.equal(value.hasAttribute('data-raw-value'), false); assert.match(tooltip.textContent, /2028-02-02/);
    key(chart, 'ArrowRight'); assert.equal(value.dataset.rawValue, '-40'); key(chart, 'End'); assert.equal(value.dataset.rawValue, '120');
    key(chart, 'Escape'); assert.equal(value.dataset.rawValue, '900'); assert.equal(tooltip.hidden, true);
    checks.push('Keyboard inspection distinguishes zero, missing and negative observations, then restores supplied current value');
    root.querySelector('[data-interval-id=empty]').click(); assert.equal(value.textContent, 'Not supplied'); assert.equal(root.querySelector('.iui-net-worth-chart-wrap').hidden, true); assert.match(root.querySelector('.iui-net-worth-empty').textContent, /No chart observations/);
    root.querySelector('[data-interval-id=zero]').click(); assert.equal(value.dataset.rawValue, '0'); assert.equal(root.querySelector('.iui-net-worth-chart-wrap').hidden, false);
    root.querySelector('[data-interval-id=month]').click(); key(chart, 'Home'); root.querySelector('[data-interval-id=month]').click(); assert.equal(value.dataset.rawValue, '900'); assert.equal(tooltip.hidden, true);
    let submissions = 0; form.addEventListener('submit', e => { submissions++; e.preventDefault(); }); for (const b of root.querySelectorAll('button')) assert.equal(b.type, 'button'); assert.equal(submissions, 0); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Empty and zero intervals remain distinct; repeat interval selection clears inspection without form submission');
    const stop = e => e.preventDefault(); const emptyButton = root.querySelector('[data-interval-id=empty]'); emptyButton.addEventListener('click', stop, true); emptyButton.click(); assert.equal(value.dataset.rawValue, '900'); emptyButton.removeEventListener('click', stop, true);
    controller.update(cases.positives.find(([n]) => n === 'long real elapsed interval')[1]); root = host.querySelector('.iui-net-worth'); chart = root.querySelector('.iui-net-worth-chart');
    const first = chart.querySelector('[data-point-index="0"]'), last = chart.querySelector('[data-point-index="2"]'); assert.equal(Number(first.getAttribute('cx')), Number(chart.dataset.plotLeft)); assert.equal(Number(last.getAttribute('cx')), Number(chart.dataset.plotLeft) + Number(chart.dataset.plotWidth)); assert.equal(chart.querySelector('[data-point-index="1"]'), null);
    checks.push('Canceled interval click leaves the selection unchanged and real dated endpoints retain time-axis positions');
    controller.update(cases.positives.find(([n]) => n === 'masked and disabled reading')[1]); root = host.querySelector('.iui-net-worth'); value = root.querySelector('.iui-net-worth-value'); chart = root.querySelector('.iui-net-worth-chart');
    assert.equal(value.textContent, '••••'); assert.equal(value.hasAttribute('data-raw-value'), false); assert.equal(chart.disabled, true); key(chart, 'Home'); root.querySelector('[data-interval-id=zero]').click(); assert.equal(value.textContent, '••••'); assert.equal(root.querySelector('[data-interval-id=month]').getAttribute('aria-pressed'), 'true');
    checks.push('Masked disabled reading hides numeric header and rejects practice inspection or range changes');
    controller.update(input); const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'duplicate observation date')[1])); assert.equal(host.innerHTML, before);
    controller.update(cases.positives.find(([n]) => n === 'literal copy and explicit source')[1]); assert.equal(host.querySelector('script,img,iframe'), null); assert.match(host.textContent, /<script>literal teaching label<\/script>/);
    const link = host.querySelector('.iui-net-worth-source'); assert.equal(link.target, '_blank'); assert.match(link.rel, /noopener/); assert.equal(link.referrerPolicy, 'no-referrer');
    checks.push('Invalid date updates are atomic; literal copy and supplied source link remain safe');
    controller.update(cases.positives.find(([n]) => n === 'empty supplied intervals')[1]); assert.match(host.textContent, /No net-worth data supplied/); assert.equal(host.querySelector('.iui-net-worth-intervals').hidden, true);
    controller.dispose(); const after = host.innerHTML; key(chart, 'End'); assert.equal(host.innerHTML, after); assert.deepEqual(errors, []); assert.equal(requests, 0);
    checks.push('Empty collection and disposal have explicit stable outcomes');
  } finally { controller.dispose(); dom.window.close(); }
  const artifact = await node.compileArtifact(input); assert.deepEqual(artifact, await node.compileArtifact(input)); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 139, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, pixelAcceptance: false, fullLibraryAcceptance: false, knownLimitations: ['Independent QA confirmed Ctrl+Home still inspects; modifier/IME navigation isolation awaits a runtime successor.'] };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
