import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases } from './cases.mjs';
import { attachSuggestionReceipt } from './consumer.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
export async function verify(library) {
  const root = await realpath(library), lock = await local('source-build-lock.safe.json');
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 151); assert.equal(lock.cdnExecuted, false);
  const checkFiles = async () => { const names = new Set(); for (const f of lock.files) {
    assert.ok(!names.has(f.path) && !path.isAbsolute(f.path) && !f.path.split('/').includes('..')); names.add(f.path);
    const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep)); const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
  } }; await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/local-suggestions.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-150.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => x.$ref !== '#/$defs/ConversationSuggestionsNode'), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json'))); assert.equal(index.nodeOwners['conversation-suggestions'], 'base');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json')))); for (const [, d] of cases.positives) assert.equal(base(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/conversation-suggestions.css'), 'utf8'); for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form><output id="receipt"></output><aside></aside>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc }), host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), output = dom.window.document.querySelector('#receipt'), controller = browser.mount(host, input, { styles: false });
  const buttons = () => [...host.querySelectorAll('button')], status = () => host.querySelector('.iui-conversation-suggestion-status');
  let off = attachSuggestionReceipt(host, output);
  try {
    assert.equal(host.querySelector('[role=group]').getAttribute('aria-label'), input.body[0].label); assert.deepEqual(buttons().map(b => b.textContent), input.body[0].suggestions.map(a => a.label)); assert.equal(buttons()[2].disabled, true);
    let event, submits = 0; const capture = e => { event = e; }; host.addEventListener('iui:conversation-suggestion', capture); form.addEventListener('submit', e => { submits++; e.preventDefault(); }); buttons()[1].click(); assert.deepEqual(event.detail, { id: 'compare', prompt: input.body[0].suggestions[1].prompt }); assert.ok(Object.isFrozen(event.detail)); assert.equal(event.composed, false); assert.equal(event.cancelable, true); assert.equal(status().textContent, 'Suggestion cancelled'); assert.equal(output.textContent, 'compare: ' + input.body[0].suggestions[1].prompt); assert.equal(submits, 0); assert.deepEqual([...new dom.window.FormData(form)], []); host.removeEventListener('iui:conversation-suggestion', capture);
    checks.push('Original local host receives the frozen supplied ID and prompt, cancels its intent and does not submit the surrounding form');
    off(); buttons()[0].click(); assert.equal(status().textContent, 'Suggestion requested'); assert.equal(output.textContent, 'compare: ' + input.body[0].suggestions[1].prompt);
    checks.push('Accepted intent reports only a request receipt, without generating content or carrying out external work');
    let count = 0; const countIntent = () => { count++; }; host.addEventListener('iui:conversation-suggestion', countIntent); buttons()[2].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); buttons()[0].setAttribute('aria-disabled', 'true'); buttons()[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); assert.equal(count, 0); controller.update(cases.positives.find(([n]) => n === 'explicitly disabled suggestions')[1]); buttons()[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); assert.equal(count, 0); host.removeEventListener('iui:conversation-suggestion', countIntent);
    checks.push('Per-action, group and current-control ARIA disabled states all prevent ordinary intents');
    controller.update(cases.positives.find(([n]) => n === 'explicit empty suggestions')[1]); assert.equal(buttons().length, 0); assert.equal(status().textContent, ''); controller.update(cases.positives.find(([n]) => n === 'twelve supplied suggestions')[1]); assert.equal(buttons().length, 12);
    const literal = structuredClone(input); literal.body[0].suggestions[0].label = '<img src=x onerror=untrusted()>'; controller.update(literal); assert.equal(buttons()[0].textContent, literal.body[0].suggestions[0].label); assert.equal(host.querySelector('img'), null); const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'duplicate suggestion ID')[1])); assert.equal(host.innerHTML, before);
    checks.push('Zero and twelve-item bounds render deterministically, labels remain literal and duplicate-ID updates are atomic');
    controller.update(input); host.addEventListener('iui:conversation-suggestion', () => controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'New local reading' }] }), { once: true }); const old = buttons()[0]; old.click(); assert.equal(status(), null); assert.match(host.textContent, /New local reading/); old.click(); assert.match(host.textContent, /New local reading/);
    checks.push('Host replacement during delivery keeps the successor intact and leaves no stale suggestion receipt');
    controller.update(input); let retiredIntents = 0; host.addEventListener('iui:conversation-suggestion', () => { retiredIntents++; }); const bar = host.querySelector('.iui-conversation-suggestions'), parent = bar.parentElement, oldButton = buttons()[0]; bar.remove(); parent.append(bar); oldButton.click(); assert.equal(retiredIntents, 0); assert.equal(status().textContent, '');
    checks.push('Observed same-turn removal and restoration permanently retires the old suggestion controls');
  } finally { off(); controller.dispose(); }
  const shadowHost = dom.window.document.querySelector('aside'), shadow = shadowHost.attachShadow({ mode: 'open' }), inner = dom.window.document.createElement('main'); shadow.append(inner); const nested = browser.mount(inner, input, { styles: false });
  try { let inside = 0, outside = 0; inner.addEventListener('iui:conversation-suggestion', e => { inside++; e.preventDefault(); }); shadowHost.addEventListener('iui:conversation-suggestion', () => { outside++; }); inner.querySelector('button').click(); assert.equal(inside, 1); assert.equal(outside, 0); checks.push('The explicit composed:false contract confines delivery to the local shadow tree'); } finally { nested.dispose(); dom.window.close(); }
  const artifact = await node.compileArtifact(input), page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  assert.equal(requests, 0); assert.deepEqual(errors, []); await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 151, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, pixelAcceptance: false, fullLibraryAcceptance: false, apiProvenance: 'New independently authored local API, not a recovered historical API identity.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
