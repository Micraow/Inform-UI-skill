import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { cases as dateCases } from '../corrected-age/cases.mjs';
import { settleReset } from '../host-form-reset/verify-source.mjs';
const json = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const hash = (b, a = 'sha256', format = 'hex') => createHash(a).update(b).digest(format);
const normalized = s => s.split('\n').filter(Boolean).join('\n');

export async function verify(library, selectedEntry = 'esm') {
  assert.ok(['esm', 'global', 'standalone'].includes(selectedEntry));
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const read = p => readFile(path.join(root, p));
  async function identity() {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await read(f.path); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  }
  await identity();
  const manifest = JSON.parse(await read('cdn/integrity.json'));
  assert.equal(Object.keys(manifest.files).length, 52);
  for (const [name, f] of Object.entries(manifest.files)) {
    const b = await read('cdn/' + name); assert.equal(b.length, f.bytes, name);
    assert.equal(hash(b), f.sha256, name); assert.equal('sha384-' + hash(b, 'sha384', 'base64'), f.integrity, name);
  }
  const schema = JSON.parse(await read('cdn/iui.schema.json'));
  assert.equal(schema.$defs.Node.oneOf.length, 214);
  const before = await json('../recovery213-readable-headers/runtime-lock.safe.json');
  const oldSchemaFile = before.files.find(f => f.path === 'cdn/iui.schema.json');
  // This fixed baseline stores definition hashes rather than another runtime copy.
  const baselineBytes = await read('tests/fixtures/corrected-age/schema213-baseline.json');
  const dateLock = await json('../corrected-age/runtime-lock.safe.json');
  assert.equal(hash(baselineBytes), dateLock.files.find(f => f.path === 'tests/fixtures/corrected-age/schema213-baseline.json').sha256);
  const old = JSON.parse(baselineBytes);
  assert.equal(Object.keys(old.defs).length, 384);
  for (const [key, sha] of Object.entries(old.defs)) assert.equal(hash(JSON.stringify(schema.$defs[key])), sha, key);
  assert.ok(oldSchemaFile); assert.deepEqual(schema.$defs.Node.oneOf.slice(0, 213), old.node.oneOf);
  const inventory = JSON.parse(await read('docs/component-progress.json'));
  const counts = { functionally_verified: 0, implemented_pending_verification: 0, partial: 0, not_implemented: 0 };
  assert.equal(new Set(inventory.components.map(c => c.id)).size, 256);
  for (const row of inventory.components) { assert.ok(row.status in counts); counts[row.status]++; }
  assert.deepEqual(counts, { functionally_verified: 53, implemented_pending_verification: 156, partial: 0, not_implemented: 47 });
  const css = (await read('dist/style.css')).toString();
  let cdnCSS = (await read('cdn/iui.css')).toString();
  for (const name of Object.keys(manifest.files).filter(n => n.endsWith('.woff2')))
    cdnCSS = cdnCSS.replaceAll('url(' + name + ')', 'url(data:font/woff2;base64,' + (await read('cdn/' + name)).toString('base64') + ')');
  assert.equal(normalized(cdnCSS), normalized(css)); assert.ok(css.includes('.iui-corrected-age'));

  const dates = await json('../corrected-age/examples/original-date-arithmetic.json');
  const preferences = await json('../host-form-reset/examples/original-host-preferences.json');
  const fields = await json('../host-fields-reset/examples/original-paper-fields.json');
  const mixed = { version: 'iui/1', state: { ...preferences.state, ...fields.state }, body: [...preferences.body, ...fields.body, ...dates.body] };
  const atomic = { version: 'iui/1', state: { a: 3, b: 7 },
    computed: { reciprocal: { op: 'div', args: [1, { op: 'sub', args: [{ $: 'a' }, { $: 'b' }] }] } },
    body: [{ ...preferences.body[0], bind: 'a' }, { ...preferences.body[0], bind: 'b' }, { type: 'metric', label: 'Original reciprocal', value: { $: 'reciprocal' } }] };
  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  let requests = 0, services = 0; const errors = [], flows = [], exports = {};
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No external resources in this original mixed consumer'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { w.fetch = w.open = w.navigator.sendBeacon = () => { services++; throw Error('No service permitted'); }; } };
  };
  const globalDOM = selectedEntry === 'global' ? new JSDOM('', { ...options(), runScripts: 'outside-only' }) : null;
  try {
    const apis = [];
    if (globalDOM) {
      globalDOM.window.eval((await read('cdn/iui.global.min.js')).toString() + '\n;globalThis.__consumer = IUI;');
      const raw = globalDOM.window.__consumer, into = x => globalDOM.window.JSON.parse(JSON.stringify(x));
      apis.push(['global', { ...raw, validateDocument: d => raw.validateDocument(into(d)), mount: (h, d, opts) => {
        const ctl = raw.mount(h, into(d), opts);
        return { ...ctl, getState: () => JSON.parse(JSON.stringify(ctl.getState())), setState: d => ctl.setState(into(d)), update: d => ctl.update(into(d)) };
      } }]);
    }
    if (selectedEntry === 'esm') apis.push(['esm', await import(pathToFileURL(path.join(root, 'cdn/iui.min.js')))]);
    for (const [entry, api] of apis) {
      exports[entry] = Object.keys(api).sort();
      for (const name of ['mount', 'validateDocument']) assert.equal(typeof api[name], 'function');
      assert.equal(normalized(api.styles), normalized(css));
      const c = dateCases(dates);
      for (const [name, d] of c.positives) assert.equal(api.validateDocument(d).ok, true, name);
      for (const [name, d] of c.negatives) assert.equal(api.validateDocument(d).ok, false, name);
      for (const d of [preferences, fields, mixed, atomic]) assert.equal(api.validateDocument(d).ok, true);
      const dom = new JSDOM('<form><main></main><button type="reset">Reset original mixed page</button></form>', options());
      const w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
      const ctl = api.mount(host, structuredClone(mixed), { styles: false });
      const control = key => host.querySelector('[data-bind="' + key + '"]');
      function input(key, value) {
        const el = control(key); if (el.type === 'checkbox') el.checked = value; else el.value = String(value);
        el.dispatchEvent(new w.Event(['checkbox', 'radio'].includes(el.type) || el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      }
      const dateRoot = (i = 0) => host.querySelectorAll('.iui-corrected-age')[i];
      const field = (name, i = 0) => dateRoot(i).querySelector('[data-field=' + name + ']');
      const action = (name, i = 0) => dateRoot(i).querySelector('[data-action=' + name + ']');
      function edit(name, value, i = 0) { const el = field(name, i); el.value = value; el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }
      const details = []; host.addEventListener('iui:corrected-age', e => {
        assert.ok(Object.isFrozen(e.detail)); assert.equal(e.cancelable, true); assert.equal(e.composed, false); details.push(JSON.parse(JSON.stringify(e.detail)));
      });
      try {
        input('paperSize', 8); input('showBorder', true); input('paperColor', 0); input('title', 'Paper kite'); input('width', 8);
        form.reset(); await settleReset(); assert.deepEqual(ctl.getState(), mixed.state);
        assert.equal(control('paperSize').value, '3'); assert.equal(host.querySelector('output').value, '3');
        assert.equal(control('paperColor').value, '1'); assert.equal(control('title').value, 'Paper crane');
        input('paperSize', 8); input('width', 14); const state = ctl.getState();
        form.addEventListener('reset', e => e.preventDefault(), { once: true }); form.reset(); await settleReset();
        assert.deepEqual(ctl.getState(), state); assert.equal(control('width').value, '14');
        form.reset(); input('title', 'Newest paper bird'); input('paperSize', 6); await settleReset();
        assert.equal(ctl.getState().title, 'Newest paper bird'); assert.equal(ctl.getState().paperSize, 6);
        assert.equal(control('width').value, '4');
        flows.push(entry + ': Mixed controlled host reset restores siblings, honors cancellation and keeps newer text/range input');

        for (let i = 0; i < 2; i++) { action('calculate', i).click(); assert.equal(details.at(-1).result.correctedDays, 56); assert.equal(details.at(-1).result.chronologicalDays, 96); }
        edit('observationDate', '2026-01-10');
        host.addEventListener('iui:corrected-age', e => e.preventDefault(), { once: true }); action('calculate').click();
        assert.equal(dateRoot().querySelector('[data-value]'), null);
        host.addEventListener('iui:corrected-age', () => edit('observationDate', '2026-01-12'), { once: true }); action('reset').click();
        assert.equal(field('observationDate').value, '2026-01-12'); action('calculate').click(); assert.equal(details.at(-1).result.correctedDays, 59);
        form.reset(); edit('observationDate', '2026-01-11'); await settleReset(); assert.equal(field('observationDate').value, '2026-01-11');
        edit('basis', 'due-date'); const due = field('dueDate'); due.focus();
        host.addEventListener('iui:corrected-age', e => e.preventDefault(), { once: true }); action('reset').click();
        assert.equal(w.document.activeElement, due); assert.equal(due.parentElement.hidden, false);
        action('reset').click(); assert.equal(due.parentElement.hidden, true); assert.equal(w.document.activeElement, action('reset'));
        flows.push(entry + ': Equivalent date bases, canceled calculation, newer local/native-reset input and hidden-field focus remain correct');

        const leap = { basis: 'due-date', birthDate: '2023-12-28', observationDate: '2026-02-28', dueDate: '2024-02-29', confirmedPreterm: true };
        for (const [draft, expected] of [[{}, 'incomplete'], [{ ...leap, observationDate: 'bad' }, 'invalid'], [{ ...leap, observationDate: '2024-02-28' }, 'before-due-date'], [leap, 'calculated'], [{ ...leap, observationDate: '2026-03-01' }, 'outside-supported-window']]) {
          ctl.update({ version: 'iui/1', body: [{ ...dates.body[0], initial: draft }] }); action('calculate').click();
          const r = details.at(-1).result; assert.equal(r.status, expected);
          if (expected === 'calculated') { assert.equal(r.correctedDays, 730); assert.equal(r.atWindowBoundary, true); }
          else { assert.equal('correctedDays' in r, false); assert.equal(dateRoot().querySelector('[data-value]'), null); }
          if (expected === 'outside-supported-window') assert.deepEqual(Object.keys(r).sort(), ['reason', 'status', 'windowEndDate']);
        }
        flows.push(entry + ': Unknown/invalid dates and pre-due/outside-window results omit age; leap anniversary is explicit software arithmetic');

        ctl.update(atomic); ctl.setState({ a: 7, b: 3 }); form.reset(); await settleReset();
        assert.deepEqual(ctl.getState(), atomic.state); assert.ok(host.textContent.includes('-0.25'));
        assert.ok([...host.querySelectorAll('[role=alert]')].every(e => !e.textContent.trim()));
        form.reset(); ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'New original generation' }] });
        await settleReset(); assert.equal(host.textContent, 'New original generation');
        ctl.dispose(); form.reset(); await settleReset(); assert.equal(host.childNodes.length, 0);
        flows.push(entry + ': Multi-binding reset is atomic and pending resets cannot restore replaced/disposed content');
      } finally { ctl.dispose(); dom.window.close(); }
    }
    let standaloneResult = { executed: false };
    if (selectedEntry === 'standalone') {
      const compiler = await import(pathToFileURL(path.join(root, 'dist/index.js')));
      const html = await compiler.compileHtml(mixed);
      const standalone = new JSDOM(html, { ...options(), runScripts: 'dangerously' });
      try {
        for (const node of standalone.window.document.querySelectorAll('.iui-corrected-age')) { node.querySelector('[data-action=calculate]').click(); assert.ok(node.querySelector('[data-value]').textContent.includes('56 days')); }
        assert.equal(standalone.window.document.querySelectorAll('.iui-corrected-age').length, 2);
        assert.equal(standalone.window.document.querySelector('[data-bind=title]').value, 'Paper crane');
      } finally { standalone.window.close(); }
      standaloneResult = { executed: true, bytes: Buffer.byteLength(html), sha256: hash(html) };
    }
    assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
    return { localAssetCommit: lock.localAssetCommit, publicCommit: null, protocolNodes: 214, scope: lock.scope,
      assetsVerified: 52, lockedFiles: 58, preservedDefinitions: 384, positiveDocumentsPerEntry: 12, negativeDocumentsPerEntry: 8,
      entries: selectedEntry === 'standalone' ? [] : [selectedEntry], exports, passed: flows.length, failed: 0, flows,
      standalone: standaloneResult, resourceRequests: requests, serviceCalls: services,
      clinicalValidation: false, nativeExecutedByConsumer: false, fullSuiteExecuted: false };
  } finally { globalDOM?.window.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the immutable asset read-point');
  const e = process.argv.indexOf('--entry');
  console.log(JSON.stringify(await verify(process.argv[i + 1], e < 0 ? 'esm' : process.argv[e + 1]), null, 2));
}
