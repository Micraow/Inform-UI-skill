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
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 140); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/schema/iui.schema.json', 'src/renderer/pressable.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-pressable.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-139.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['PressableNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  for (const n of input.body) assert.equal(index.nodeOwners[n.type], 'base');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json'))));
  for (const [, d] of cases.positives) assert.equal(base(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/pressable.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  try {
    let root = host.querySelector('.iui-pressable'), button = root.querySelector('button'), content = root.querySelector('.iui-pressable-content');
    assert.equal(button.type, 'button'); assert.equal(button.getAttribute('aria-label'), 'Review the supplied items'); assert.equal(content.getAttribute('aria-hidden'), 'true');
    assert.equal(content.querySelector('a,button,input,select,textarea'), null); assert.match(content.textContent, /Supplied item count/); assert.match(content.textContent, /3/);
    checks.push('Explicit action naming stays separate from passive visual content');
    const receipts = []; const cancel = event => { receipts.push(event.detail); event.preventDefault(); };
    host.addEventListener('iui:press', cancel); button.click(); assert.equal(root.dataset.status, 'cancelled'); assert.deepEqual(receipts[0], { componentId: 'review-supplied', actionId: 'review-items' }); assert.ok(Object.isFrozen(receipts[0])); host.removeEventListener('iui:press', cancel);
    button.click(); assert.equal(root.dataset.status, 'requested'); assert.equal(dom.window.location.href, 'https://local.example/');
    checks.push('Frozen local intents can be canceled or accepted without automatic navigation');
    let count = 0; const recursive = () => { count++; button.click(); }; host.addEventListener('iui:press', recursive); button.click(); assert.equal(count, 1); host.removeEventListener('iui:press', recursive);
    checks.push('Shared single-flight intent gate prevents recursive duplicate requests');
    host.addEventListener('iui:press', cancel); controller.setState({ blocked: true, count: 9 }); assert.equal(button.disabled, true); assert.match(content.textContent, /9/); assert.equal(button.getAttribute('aria-label'), 'Review the supplied items'); const beforeCount = receipts.length; button.click(); assert.equal(receipts.length, beforeCount);
    controller.setState({ blocked: false }); button.click(); assert.equal(receipts.length, beforeCount + 1); host.removeEventListener('iui:press', cancel);
    checks.push('Reactive disabled and visible count update independently without stale accessible naming');
    controller.update(cases.positives.find(([n]) => n === 'derived boolean disabled state')[1]); root = host.querySelector('.iui-pressable'); button = root.querySelector('button'); controller.setState({ count: 0 }); assert.equal(button.disabled, true); controller.setState({ count: 1 }); assert.equal(button.disabled, false);
    let submissions = 0; form.addEventListener('submit', e => { submissions++; e.preventDefault(); }); button.click(); assert.equal(submissions, 0); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Derived disabled values resolve to booleans and the action never submits its enclosing form');
    const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'nested interactive text link')[1])); assert.equal(host.innerHTML, before);
    controller.update(cases.positives.find(([n]) => n === 'literal action copy')[1]); assert.equal(host.querySelector('script,img,iframe,a'), null); assert.equal(host.querySelector('button').getAttribute('aria-label'), '<script>Review supplied items</script>');
    checks.push('Interactive descendants are rejected atomically and literal action copy remains safe');
    controller.update(input); button = host.querySelector('.iui-pressable-hit'); const replace = () => controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'New supplied view' }] }); host.addEventListener('iui:press', replace, { once: true }); button.click(); assert.equal(host.querySelector('.iui-pressable'), null); assert.match(host.textContent, /New supplied view/); controller.dispose(); const after = host.innerHTML; button.click(); assert.equal(host.innerHTML, after);
    checks.push('Host replacement during intent delivery retires the old action and later disposal is stable');
    assert.deepEqual(errors, []); assert.equal(requests, 0);
  } finally { controller.dispose(); dom.window.close(); }
  const netInput = await local('../restored-net-worth/examples/supplied-net-worth.json');
  const netDom = new JSDOM('<main></main>'), netHost = netDom.window.document.querySelector('main'), net = browser.mount(netHost, netInput, { styles: false });
  try {
    const chart = netHost.querySelector('.iui-net-worth-chart'), value = netHost.querySelector('.iui-net-worth-value');
    for (const options of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }, { keyCode: 229 }]) {
      chart.dispatchEvent(new netDom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true, ...options })); assert.equal(value.dataset.rawValue, '900');
    }
    chart.dispatchEvent(new netDom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })); assert.equal(value.dataset.rawValue, '0');
    checks.push('The included net-worth successor rejects modifier and IME navigation while ordinary Home still inspects');
  } finally { net.dispose(); netDom.window.close(); }
  const artifact = await node.compileArtifact(input); assert.deepEqual(artifact, await node.compileArtifact(input)); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 140, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
