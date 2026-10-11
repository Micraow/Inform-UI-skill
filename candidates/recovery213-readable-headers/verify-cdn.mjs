import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases as creditCases } from '../credit-score/cases.mjs';
import { buildCases as careCases } from '../care-providers/cases.mjs';
const hash = (b, a = 'sha256', e = 'hex') => createHash(a).update(b).digest(e);
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const normalized = s => s.split('\n').filter(Boolean).join('\n');

export function verifyHeaderRules(css) {
  assert.ok(css.includes('@container(max-width:575px){.iui-root .iui-credit-header{flex-wrap:wrap}.iui-root .iui-credit-header h3{flex-basis:100%}.iui-root .iui-credit-header .iui-credit-info{max-inline-size:100%}}'), 'Credit uses a full title row at local widths <=575px');
  assert.ok(css.includes('.iui-root .iui-care-provider{container-type:inline-size}'), 'Care establishes its own inline-size container');
  assert.ok(css.includes('@container(max-width:575px){.iui-root .iui-care-calendar{grid-template-columns:repeat(2,minmax(0,1fr))}.iui-root .iui-care-month{grid-column:1/-1}.iui-root .iui-care-calendar>[data-care-action=previous-month],.iui-root .iui-care-calendar>[data-care-action=next-month]{min-inline-size:0;max-inline-size:100%}}'), 'Care month occupies a full row above two bounded navigation controls');
}

export async function verify(library) {
  const root = await realpath(library), lock = await local('runtime-lock.safe.json');
  const before = await local('../recovery213/runtime-lock.safe.json'), delta = await local('style-successor.json');
  const bytesAt = async p => {
    assert.ok(!path.isAbsolute(p) && !p.split('/').includes('..'));
    const real = await realpath(path.join(root, p));
    assert.ok(real.startsWith(root + path.sep));
    return readFile(real);
  };
  const checkFiles = async () => {
    for (const f of lock.files) {
      const b = await bytesAt(f.path);
      assert.equal(b.length, f.bytes, f.path);
      assert.equal(hash(b), f.sha256, f.path);
    }
  };
  await checkFiles();
  const changed = lock.files.filter(f => f.sha256 !== before.files.find(b => b.path === f.path).sha256).map(f => f.path);
  assert.deepEqual(changed, delta.changedLockedPaths);
  const manifest = JSON.parse(await bytesAt('cdn/integrity.json'));
  for (const [name, f] of Object.entries(manifest.files)) {
    const b = await bytesAt('cdn/' + name);
    assert.equal(b.length, f.bytes, name); assert.equal(hash(b), f.sha256, name);
    assert.equal('sha384-' + hash(b, 'sha384', 'base64'), f.integrity, name);
  }
  const schemaBytes = await bytesAt('cdn/iui.schema.json');
  assert.equal(hash(schemaBytes), delta.unchangedSchemaSha256);
  const schema = JSON.parse(schemaBytes);
  assert.equal(schema.$defs.Node.oneOf.length, 213);
  const css = (await bytesAt('cdn/iui.css')).toString(), distCss = (await bytesAt('dist/style.css')).toString();
  let reverted = distCss;
  for (const d of delta.styles) {
    const source = await bytesAt(d.path);
    assert.equal(hash(source), d.afterSha256); assert.equal(source.length, d.afterBytes);
    const prefix = source.subarray(0, d.beforeBytes);
    assert.equal(hash(prefix), d.beforeSha256);
    assert.equal(source.subarray(d.beforeBytes).toString(), d.appendedRules);
    assert.equal(reverted.split(d.appendedRules).length, 2, 'Exactly one appended CSS block per family');
    reverted = reverted.replace(d.appendedRules, '');
  }
  assert.equal(hash(reverted), before.files.find(f => f.path === 'dist/style.css').sha256, 'Removing only the two appended blocks restores exact5081 CSS');
  verifyHeaderRules(css); verifyHeaderRules(distCss);
  let embedded = css;
  for (const name of Object.keys(manifest.files).filter(x => x.endsWith('.woff2'))) {
    embedded = embedded.replaceAll('url(' + name + ')', 'url(data:font/woff2;base64,' + (await bytesAt('cdn/' + name)).toString('base64') + ')');
  }
  assert.equal(hash(normalized(embedded)), hash(normalized(distCss)));

  const credit = await local('../credit-score/examples/original-credit-score.json');
  const care = await local('../care-providers/examples/original-care-providers.json');
  const combined = { version: 'iui/1', body: [...structuredClone(credit.body), ...structuredClone(care.body)] };
  const require = createRequire(path.join(root, 'package.json'));
  const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  let requests = 0, serviceCalls = 0; const errors = [], checks = [];
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No external resource allowed'); } }
  const vc = () => { const c = new VirtualConsole(); c.on('jsdomError', e => errors.push(e)); return c; };
  const block = w => {
    const reject = () => { serviceCalls++; throw Error('No account, credit, directory, booking or navigation service'); };
    w.fetch = w.open = reject; w.navigator.sendBeacon = reject;
  };
  const globals = new JSDOM('', { url: 'https://consumer.example/', runScripts: 'outside-only', resources: new Reject(), virtualConsole: vc(), beforeParse: block });
  try {
    globals.window.eval((await bytesAt('cdn/iui.global.min.js')).toString() + '\n;globalThis.__readableConsumer = IUI;');
    const raw = globals.window.__readableConsumer, inRealm = d => globals.window.JSON.parse(JSON.stringify(d));
    const global = { ...raw, validateDocument: d => raw.validateDocument(inRealm(d)), mount: (host, d, opts) => {
      const ctl = raw.mount(host, inRealm(d), opts);
      return { ...ctl, update: d => ctl.update(inRealm(d)) };
    } };
    const esm = await import(pathToFileURL(path.join(root, 'cdn/iui.min.js')));
    const families = [['credit-score', credit, creditCases(credit)], ['care-providers', care, careCases(care)]];
    for (const [entry, api] of [['esm', esm], ['global', global]]) {
      assert.equal(hash(normalized(api.styles)), hash(normalized(distCss)), entry + ' styles closure');
      for (const [family, , cases] of families) {
        for (const [name, d] of cases.positives) assert.equal(api.validateDocument(d).ok, true, entry + '/' + family + '/' + name);
        for (const [name, d, code, issuePath] of cases.negatives) {
          const v = api.validateDocument(d); assert.equal(v.ok, false, name);
          assert.ok(v.issues.some(i => i.code === code && (!issuePath || i.path === issuePath)), name);
        }
      }
      const dom = new JSDOM('<form><main style="width:390px"></main></form>', { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc(), beforeParse: block });
      const w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
      const ctl = api.mount(host, combined, { styles: false });
      const q = s => host.querySelector(s), tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
      const creditRoot = () => q('[data-kind=ledger-credit-score]'), sidebar = () => q('[data-kind=care-provider-sidebar]');
      const c = a => creditRoot().querySelector('[data-credit-action=' + a + ']');
      const s = a => sidebar().querySelector('[data-care-action=' + a + ']');
      const details = [];
      for (const name of ['iui:credit-view', 'iui:care-provider']) host.addEventListener(name, e => {
        assert.ok(Object.isFrozen(e.detail)); assert.equal(e.cancelable, true); assert.equal(e.composed, false);
        details.push(JSON.parse(JSON.stringify(e.detail)));
      });
      const cancel = name => host.addEventListener(name, e => e.preventDefault(), { once: true });
      try {
        await tick();
        const title = creditRoot().querySelector('.iui-credit-header h3');
        assert.equal(title.textContent, credit.body[0].title);
        assert.equal(creditRoot().querySelector('.iui-credit-score-label').textContent, '615.500 supplied label');
        assert.match(creditRoot().querySelector('.iui-credit-marker').style.left, /23%/);
        assert.equal(sidebar().querySelector('.iui-care-month').textContent, 'Original calendar panel A');
        assert.equal(sidebar().querySelectorAll('.iui-care-calendar > button').length, 2);
        cancel('iui:credit-view'); c('open-factor').click();
        assert.equal(details.at(-1).metricId, 'zero_factor');
        assert.equal(q('[data-item-id=zero] .iui-credit-progress-fill').style.width, '0%');
        checks.push(entry + ': Supplied title, independent score/marker and0% detail remain intact; calendar header has separate month and two navigation controls');

        const views = creditRoot().querySelectorAll('[data-credit-action=select-view]');
        cancel('iui:credit-view'); views[1].click(); assert.equal(creditRoot().querySelector('.iui-credit-trend').hidden, true);
        views[1].click(); assert.equal(creditRoot().querySelector('.iui-credit-trend').hidden, false);
        creditRoot().querySelector('[data-period-id=recent] [data-point-id=p2]').click();
        assert.equal(creditRoot().querySelector('[data-period-id=recent] [role=status]').textContent, 'Original middle point: missing and negative two');
        assert.equal(title.textContent, credit.body[0].title);
        cancel('iui:care-provider'); s('next-month').click(); assert.equal(sidebar().querySelector('.iui-care-month').textContent, 'Original calendar panel A');
        s('next-month').click(); assert.equal(sidebar().querySelector('.iui-care-month').textContent, 'Original calendar panel B');
        checks.push(entry + ': Header-adjacent Credit view/inspection and Care month navigation retain canceled/accepted intent contracts');

        form.addEventListener('reset', e => e.preventDefault(), { once: true }); form.reset(); await tick();
        assert.equal(sidebar().querySelector('.iui-care-month').textContent, 'Original calendar panel B');
        assert.equal(creditRoot().querySelector('.iui-credit-trend').hidden, false);
        form.reset(); await tick();
        assert.equal(sidebar().querySelector('.iui-care-month').textContent, 'Original calendar panel A');
        assert.equal(creditRoot().querySelector('.iui-credit-trend').hidden, true);
        form.reset(); s('next-month').click(); views[1].click(); await tick();
        assert.equal(sidebar().querySelector('.iui-care-month').textContent, 'Original calendar panel B');
        assert.equal(creditRoot().querySelector('.iui-credit-trend').hidden, false);
        checks.push(entry + ': Shared canceled reset preserves both readers; accepted reset restores headers, and newer header controls survive queued reset');

        const old = s('previous-month');
        host.addEventListener('iui:care-provider', () => ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'Newest original header view' }] }), { once: true });
        old.click(); old.click(); assert.equal(host.textContent, 'Newest original header view');
        ctl.update(combined); form.reset(); ctl.dispose(); await tick(); assert.equal(host.childNodes.length, 0);
        checks.push(entry + ': Callback replacement and pending-reset disposal retire the original header controls');
      } finally { ctl.dispose(); dom.window.close(); }
    }
    const compiler = await import(pathToFileURL(path.join(root, 'dist/index.js')));
    const artifact = await compiler.compileArtifact(combined);
    const page = new JSDOM(artifact.html, { url: 'https://standalone.example/', runScripts: 'dangerously', resources: new Reject(), virtualConsole: vc(), beforeParse: block });
    try {
      const d = page.window.document;
      assert.equal(hash(d.querySelector('style').textContent), hash(distCss));
      verifyHeaderRules(d.querySelector('style').textContent);
      assert.match(d.querySelector('meta[http-equiv="Content-Security-Policy"]').content, /connect-src 'none'/);
      assert.equal(d.querySelector('.iui-credit-header h3').textContent, credit.body[0].title);
      const captured = [];
      for (const n of ['iui:credit-view', 'iui:care-provider']) d.addEventListener(n, e => { captured.push(e.detail.intent); e.preventDefault(); });
      d.querySelector('[data-credit-action=open-factor]').click();
      d.querySelector('[data-care-action=next-month]').click();
      assert.deepEqual(captured, ['open-factor', 'select-month']);
      assert.equal(d.querySelector('.iui-care-month').textContent, 'Original calendar panel A');
    } finally { page.window.close(); }
    assert.equal(requests, 0); assert.equal(serviceCalls, 0); assert.deepEqual(errors, []);
    await checkFiles();
    return { format: 'inform-narrow-css-consumer-result/1', localAssetCommit: lock.localAssetCommit, publicCommit: lock.publicCommit, protocolNodes: 213,
      manifestAssets: Object.keys(manifest.files).length, lockedFiles: lock.files.length, changedLockedPaths: changed,
      unchangedDefinitions: Object.keys(schema.$defs).length - 1, schemaByteIdentical: true, sourceCssChanges: delta.sourceChangedPaths,
      positive: families.reduce((n, [, , c]) => n + c.positives.length, 0), negative: families.reduce((n, [, , c]) => n + c.negatives.length, 0), entries: ['esm', 'global'], checks,
      standaloneScriptExecuted: true, externalRequests: requests, serviceCalls, nativeExecuted: false, geometryMeasured: false, pixelAcceptance: false, aggregateSuiteRerun: false,
      boundary: 'Only Credit/Care original contracts and header-adjacent workflows rerun on933dc. Exact52asset SRI,57safe leaves and two appended CSS blocks verified. The unchanged5081/183 locks retain their historical results; no full-suite or native result is inferred.' };
  } finally { globals.window.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]);
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
