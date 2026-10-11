import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { verifyFunctionalScope } from '../../scripts/verify-recovery-functional-scope.mjs';
const hash = (b, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(b).digest(encoding);
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const skillRoot = path.resolve(import.meta.dirname, '../..');
export async function verify(library) {
  const root = await realpath(library), lock = await local('runtime-lock.safe.json'), fixtureIndex = await local('fixture-index.json');
  const bytesAt = async p => { assert.ok(!path.isAbsolute(p) && !p.split('/').includes('..')); const real = await realpath(path.join(root, p)); assert.ok(real.startsWith(root + path.sep)); return readFile(real); };
  const checkAssets = async () => { for (const f of lock.files) { const b = await bytesAt(f.path); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path); } };
  await checkAssets(); const manifest = JSON.parse(await bytesAt('cdn/integrity.json'));
  for (const [name, f] of Object.entries(manifest.files)) { const b = await bytesAt('cdn/' + name); assert.equal(b.length, f.bytes, name); assert.equal(hash(b), f.sha256, name); assert.equal('sha384-' + hash(b, 'sha384', 'base64'), f.integrity, name); }
  const scope = verifyFunctionalScope(JSON.parse(await bytesAt('docs/component-progress.json')), await local('canonical-scope.lock.json'));
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  let requests = 0; const errors = []; class Reject extends ResourceLoader { fetch() { requests++; return null; } }
  const consoleFor = () => { const c = new VirtualConsole(); c.on('jsdomError', e => errors.push(e)); return c; };
  const globalDOM = new JSDOM('', { url: 'https://local.example/', runScripts: 'outside-only', resources: new Reject(), virtualConsole: consoleFor() });
  try {
    globalDOM.window.eval((await bytesAt('cdn/iui.global.min.js')).toString() + '\n;globalThis.__IUI_CONSUMER__ = IUI;');
    const module = await import(pathToFileURL(path.join(root, 'cdn/iui.min.js'))), rawGlobal = globalDOM.window.__IUI_CONSUMER__;
    // The standalone global bundle receives JSON parsed in its own realm, as in a page.
    const inGlobal = value => globalDOM.window.JSON.parse(JSON.stringify(value));
    const global = { ...rawGlobal, validateDocument: d => rawGlobal.validateDocument(inGlobal(d)), mount: (host, d, options) => { const c = rawGlobal.mount(host, inGlobal(d), options); return { ...c, update: next => c.update(inGlobal(next)), setState: patch => c.setState(inGlobal(patch)) }; } };
    const apis = [['esm', module], ['global', global]], css = (await bytesAt('cdn/iui.css')).toString();
    // CDN CSS uses relative WOFF2 files; the export embeds those same verified bytes.
    let embeddedCss = css;
    for (const name of Object.keys(manifest.files).filter(name => name.endsWith('.woff2'))) embeddedCss = embeddedCss.replaceAll('url(' + name + ')', 'url(data:font/woff2;base64,' + (await bytesAt('cdn/' + name)).toString('base64') + ')');
    const families = [], docs = new Map(); let positive = 0, negative = 0;
    for (const fixture of fixtureIndex.fixtures) {
      const exampleBytes = await readFile(path.join(skillRoot, fixture.example)), caseBytes = await readFile(path.join(skillRoot, fixture.cases)); assert.equal(hash(exampleBytes), fixture.exampleSha256); assert.equal(hash(caseBytes), fixture.casesSha256);
      const input = JSON.parse(exampleBytes), { buildCases } = await import(pathToFileURL(path.join(skillRoot, fixture.cases))), cases = buildCases(input); docs.set(fixture.family, input);
      for (const [entry, api] of apis) {
        for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, `${entry}/${fixture.family}/${name}: ${JSON.stringify(v)}`); }
        for (const [name, d, code, issuePath] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, `${entry}/${fixture.family}/${name}`); assert.ok(v.issues.some(i => i.code === code && (!issuePath || i.path === issuePath)), `${entry}/${fixture.family}/${name}: ${JSON.stringify(v)}`); }
      }
      positive += cases.positives.length; negative += cases.negatives.length; families.push({ family: fixture.family, positive: cases.positives.length, negative: cases.negatives.length });
    }
    const selected = ['local-finance-readers', 'local-follow-up-actions', 'local-conversation-suggestions', 'local-image-grid', 'restored-pressable', 'restored-media-readers'].map(key => docs.get(key));
    const combined = { version: 'iui/1', state: Object.assign({}, ...selected.map(d => d.state)), body: selected.flatMap(d => structuredClone(d.body)) };
    const checks = [];
    for (const [entry, api] of apis) {
      assert.equal(hash(api.styles.split('\n').filter(Boolean).join('\n')), hash(embeddedCss.split('\n').filter(Boolean).join('\n')), entry + ' CSS closure: exact font bytes and nonblank lines'); assert.equal(api.validateDocument(combined).ok, true);
      const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: consoleFor() }), host = dom.window.document.querySelector('main'), form = host.parentElement;
      const controller = api.mount(host, combined, { styles: false }), tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
      try {
        await tick();
        assert.equal(host.querySelector('.iui-spend-total').textContent, '900 supplied credits'); assert.deepEqual([...host.querySelectorAll('.iui-spend-fill')].map(e => e.style.width), ['70%', '0%']); assert.equal(host.querySelector('iframe'), null); assert.equal(host.querySelectorAll('.iui-image-grid img').length, 3);
        checks.push(entry + ': supplied zero/unknown/fractions coexist with inline images and on-demand video');
        const pairs = [['iui:follow-up-action', '.iui-follow-up-action-bar button'], ['iui:conversation-suggestion', '.iui-conversation-suggestions button'], ['iui:image-grid-open', '.iui-image-grid button'], ['iui:upcoming-activity', '.iui-upcoming-activity button'], ['iui:spend-category', '.iui-spend-month button'], ['iui:press', '.iui-pressable-hit']];
        const receipts = []; let submits = 0; form.addEventListener('submit', e => { submits++; e.preventDefault(); });
        for (const [type, selector] of pairs) { host.addEventListener(type, e => { assert.ok(Object.isFrozen(e.detail)); e.preventDefault(); receipts.push(type); }); host.querySelector(selector).click(); }
        assert.deepEqual(receipts, pairs.map(([type]) => type)); assert.equal(submits, 0); assert.deepEqual([...new dom.window.FormData(form)], []);
        checks.push(entry + ': six local frozen intents are canceled without submitting a form or contacting services');
        controller.setState({ blocked: true, videoDisabled: true }); assert.equal(host.querySelector('.iui-pressable-hit').disabled, true); const receiptCount = receipts.length; host.querySelector('.iui-pressable-hit').click(); assert.equal(receipts.length, receiptCount); assert.equal(host.querySelector('iframe'), null);
        checks.push(entry + ': dynamic passive action and on-demand video disabled state stay local');
        const select = host.querySelector('.iui-upcoming-activity select'); select.value = 'income'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); form.addEventListener('reset', e => e.preventDefault(), { once: true }); form.reset(); await tick(); assert.equal(select.value, 'income'); form.reset(); await tick(); assert.equal(select.value, 'all'); assert.equal(host.querySelector('.iui-spend-total').textContent, '900 supplied credits');
        checks.push(entry + ': canceled and accepted native reset preserve independent supplied totals');
        const invalid = structuredClone(combined); invalid.body[0].activities[1].id = invalid.body[0].activities[0].id; const before = host.innerHTML; assert.throws(() => controller.update(invalid)); assert.equal(host.innerHTML, before);
        checks.push(entry + ': invalid cross-family update remains atomic');
        const old = host.querySelector('.iui-image-grid button'); host.addEventListener('iui:image-grid-open', () => controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'New local reading' }] }), { once: true }); old.click(); assert.equal(host.textContent, 'New local reading'); const after = receipts.length; old.click(); assert.equal(receipts.length, after);
        checks.push(entry + ': replacement during intent delivery retires old controls');
        controller.dispose(); assert.equal(host.childNodes.length, 0); old.click(); assert.equal(receipts.length, after);
        checks.push(entry + ': disposal leaves no active old receipt controls');
      } finally { controller.dispose(); dom.window.close(); }
    }
    assert.equal(requests, 0); assert.deepEqual(errors, []); await checkAssets();
    return { format: 'inform-exact-cdn-combination/1', localSourceCommit: lock.localSourceCommit, runtimeAndAssetCommit: lock.runtimeAndAssetCommit, protocolNodes: lock.protocolNodes, manifestAssets: Object.keys(manifest.files).length, lockedFiles: lock.files.length, originalDocuments: families.length, positive, negative, entries: apis.map(([name]) => name), families, checks, scope, externalRequests: requests, nativeExecuted: false, pixelAcceptance: false, remoteCiAcceptance: false, completePublicSourceVerified: false, boundary: '21 original family contracts run against exact local ESM/global CDN bytes. Five new APIs remain functional subsets; no native or remote CI claim.' };
  } finally { globalDOM.window.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
