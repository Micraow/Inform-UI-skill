import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { cases } from './cases.mjs';
import { settleReset } from '../host-form-reset/verify-source.mjs';
const json = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const hash = b => createHash('sha256').update(b).digest('hex');

export async function verify(library) {
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const fixture = await json('examples/original-numeric-scorecard.json'), vectors = await json('numeric-vectors.json');
  async function identity() {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await readFile(path.join(root, f.path)); assert.equal(b.length, f.bytes); assert.equal(hash(b), f.sha256, f.path);
    }
  }
  await identity();
  const api = await import(pathToFileURL(path.join(root, 'dist/index.js')));
  const c = cases(fixture);
  for (const [name, d] of c.positives) assert.equal(api.validateDocument(d).ok, true, name);
  for (const [name, d] of c.negatives) assert.equal(api.validateDocument(d).ok, false, name);
  const defaults = { version: vectors.version, population: vectors.population, eye: 4, verbal: 5, motor: 6 };
  let arithmeticChecks = 0;
  for (const v of vectors.cases) {
    const input = { ...defaults, eye: v.eye, verbal: v.verbal, motor: v.motor }, before = JSON.stringify(input), r = api.calculateGcs(input);
    assert.equal(r.status, 'calculated'); assert.equal(r.total, v.expectedSum); assert.equal(JSON.stringify(input), before);
    assert.deepEqual(Object.fromEntries(Object.entries(r.components).map(([k, s]) => [k, s.value])), { eye: v.eye, verbal: v.verbal, motor: v.motor });
    arithmeticChecks++;
  }
  const arithmetic = [];
  for (const key of ['eye', 'verbal', 'motor']) for (const [value, status] of [['NT', 'not-testable'], [null, 'incomplete']]) arithmetic.push([{ ...defaults, [key]: value }, status]);
  for (const [key, value] of [['eye', 0], ['eye', 5], ['verbal', 6], ['motor', 7], ['eye', 2.5], ['verbal', '5'], ['motor', NaN], ['eye', Infinity], ['eye', true], ['motor', []]]) arithmetic.push([{ ...defaults, [key]: value }, 'invalid']);
  arithmetic.push([{ ...defaults, eye: null, verbal: 0 }, 'invalid'], [{ ...defaults, version: null }, 'incomplete'], [{ ...defaults, population: 'other' }, 'unsupported'], [{ ...defaults, version: '1974-original' }, 'unsupported'], [{}, 'incomplete'], [{ eye: 'NT' }, 'not-testable'], [{ ...defaults, eye: 'NT', verbal: 'NT', motor: 'NT' }, 'not-testable']);
  for (const [input, expected] of arithmetic) { const r = api.calculateGcs(input); assert.equal(r.status, expected); assert.equal('total' in r, false); assert.deepEqual(Object.keys(r.components), ['eye', 'verbal', 'motor']); arithmeticChecks++; }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json')));
  const old = JSON.parse(await readFile(path.join(root, 'tests/fixtures/gcs/schema214-baseline.json')));
  assert.equal(Object.keys(old.defs).length, 386);
  for (const [key, sha] of Object.entries(old.defs)) assert.equal(hash(JSON.stringify(schema.$defs[key])), sha, key);
  assert.equal(schema.$defs.Node.oneOf.length, 215); assert.deepEqual(schema.$defs.Node.oneOf.slice(0, 214), old.node.oneOf);
  assert.equal(api.styles, await readFile(path.join(root, 'dist/style.css'), 'utf8')); assert.ok(api.styles.includes('.iui-gcs'));

  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  let requests = 0, services = 0; const errors = [], flows = [];
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No resource request from a synthetic numeric fixture'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { const block = () => { services++; throw Error('No clipboard, assessment or external service'); }; w.fetch = w.open = w.navigator.sendBeacon = block; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: block } }); } };
  };
  const docWith = patch => ({ version: 'iui/1', body: [{ ...structuredClone(fixture.body[0]), ...patch }] });
  function setup(doc = fixture) {
    const dom = new JSDOM('<form><main></main></form>', options()), w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(doc), { styles: false });
    const q = s => host.querySelector(s), gcs = () => q('.iui-gcs'), action = name => q('[data-action=' + name + ']');
    const field = name => q('select[data-field=' + name + ']');
    const edit = (name, value) => {
      const radios = [...host.querySelectorAll('input[data-field=' + name + ']')];
      const el = radios.length ? radios.find(r => r.value === String(value)) : field(name); assert.ok(el, name + '=' + value);
      if (radios.length) el.checked = true; else el.value = String(value);
      el.dispatchEvent(new w.Event('change', { bubbles: true }));
    };
    const details = []; host.addEventListener('iui:gcs', e => {
      assert.equal(e.cancelable, true); assert.equal(e.composed, false); assert.ok(Object.isFrozen(e.detail));
      if (e.detail.result) { assert.ok(Object.isFrozen(e.detail.result)); assert.ok(Object.isFrozen(e.detail.result.components)); }
      details.push(e.detail);
    });
    const cancel = () => host.addEventListener('iui:gcs', e => e.preventDefault(), { once: true });
    return { w, host, form, ctl, q, gcs, action, field, edit, details, cancel, close() { ctl.dispose(); w.close(); } };
  }
  {
    const s = setup();
    try {
      assert.equal(s.q('[data-value=total]').textContent, '9'); assert.equal(s.action('calculate').hidden, true);
      assert.equal(s.host.querySelectorAll('.iui-gcs-notes li').length, 2);
      s.edit('eye', 4); assert.equal(s.q('[data-value=total]').textContent, '11'); assert.ok(s.host.textContent.includes('fourth numeric choice'));
      s.edit('eye', 'NT'); assert.equal(s.q('[data-value=total]'), null); assert.equal(s.gcs().dataset.result, 'not-testable');
      assert.ok(s.q('[data-component=eye]').textContent.endsWith('NT')); assert.ok(s.host.textContent.includes('explicit unavailable marker'));
      s.edit('eye', ''); assert.equal(s.gcs().dataset.result, 'incomplete'); assert.equal(s.q('[data-value=total]'), null);
      s.edit('eye', 2); s.action('copy-summary').click(); const detail = s.details.at(-1);
      assert.equal(detail.intent, 'copy-summary'); assert.equal(detail.result.total, 9); assert.match(detail.text, /eye=2, verbal=3, motor=4; Numeric sum=9/);
      s.cancel(); s.action('copy-summary').click(); assert.equal(s.q('[data-value=total]').textContent, '9');
      flows.push('Live numeric and segmented/select controls preserve component states, selected help, NT/unknown suppression and a cancelable local summary request');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      const tabs = [...s.host.querySelectorAll('[role=tab]')], selected = () => s.q('[role=tab][aria-selected=true]').dataset.infoId;
      s.cancel(); tabs[1].click(); assert.equal(selected(), 'inputs'); tabs[1].click(); assert.equal(selected(), 'arithmetic');
      const key = (button, value, extra = {}) => button.dispatchEvent(new s.w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extra }));
      key(tabs[1], 'End', { ctrlKey: true }); key(tabs[1], 'End', { isComposing: true }); key(tabs[1], 'End', { keyCode: 229 }); assert.equal(selected(), 'arithmetic');
      key(tabs[1], 'End'); assert.equal(selected(), 'audit'); assert.equal(s.w.document.activeElement, tabs[2]);
      assert.equal(s.q('[role=tabpanel]').textContent, 'Literal <strong>text</strong> is displayed without markup.'); assert.equal(s.q('[role=tabpanel] strong'), null);
      s.gcs().style.direction = 'rtl'; key(tabs[2], 'ArrowRight'); assert.equal(selected(), 'arithmetic');
      s.edit('motor', 6); s.cancel(); s.action('reset').click(); assert.equal(s.field('motor').value, '6');
      s.action('reset').click(); assert.equal(s.q('[data-value=total]').textContent, '6'); assert.equal(selected(), 'arithmetic');
      flows.push('Information tabs support cancellation and guarded RTL keyboard navigation; literal notes stay inert and independent defaults reset ratings without resetting the tab');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit('motor', 6); s.form.addEventListener('reset', e => e.preventDefault(), { once: true }); s.form.reset(); await settleReset(); assert.equal(s.field('motor').value, '6');
      s.form.reset(); s.edit('verbal', 5); await settleReset(); assert.equal(s.field('verbal').value, '5');
      s.host.addEventListener('iui:gcs', () => s.edit('motor', 5), { once: true }); s.action('reset').click(); assert.equal(s.field('motor').value, '5');
      s.action('reset').click(); assert.equal(s.field('motor').value, '3'); assert.equal(s.q('[data-value=total]').textContent, '6');
      flows.push('Host reset cancellation and newer native/local-intent input supersede stale reset while an accepted independent default baseline remains usable');
    } finally { s.close(); }
  }
  {
    const s = setup(docWith({ resultMode: 'on-demand' }));
    try {
      assert.equal(s.gcs().dataset.result, 'not-calculated'); s.cancel(); s.action('calculate').click(); assert.equal(s.q('[data-value=total]'), null);
      s.action('calculate').click(); assert.equal(s.q('[data-value=total]').textContent, '9'); s.edit('motor', 6); assert.equal(s.q('[data-value=total]'), null);
      s.host.addEventListener('iui:gcs', () => s.edit('verbal', 4), { once: true }); s.action('calculate').click(); assert.equal(s.q('[data-value=total]'), null);
      s.action('calculate').click(); assert.equal(s.q('[data-value=total]').textContent, '12');
      const button = s.action('calculate'); s.host.addEventListener('iui:gcs', () => s.ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'New synthetic view' }] }), { once: true });
      button.click(); button.click(); assert.equal(s.host.textContent, 'New synthetic view');
      s.ctl.update(fixture); s.form.reset(); s.ctl.dispose(); await settleReset(); assert.equal(s.host.children.length, 0);
      flows.push('On-demand totals honor cancellation, stale-result removal and callback input/replacement; pending reset cannot resurrect a disposed generation');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      for (const [input, status] of [[{ ...defaults, eye: '4' }, 'invalid'], [{ ...defaults, version: 'other' }, 'unsupported'], [{ ...defaults, population: 'other' }, 'unsupported'], [{ ...defaults, eye: null, motor: 7 }, 'invalid'], [{ ...defaults, eye: 'NT', verbal: null }, 'not-testable']]) {
        s.ctl.update(docWith({ initial: input })); assert.equal(s.gcs().dataset.result, status); assert.equal(s.q('[data-value=total]'), null); assert.equal(s.host.querySelectorAll('[data-component]').length, 3);
        s.action('copy-summary').click(); assert.equal('total' in s.details.at(-1).result, false);
      }
      s.ctl.update(docWith({ disabled: true })); const before = s.details.length; s.action('copy-summary').click(); s.edit('eye', 4); assert.equal(s.details.length, before); assert.equal(s.q('[data-value=total]').textContent, '9');
      flows.push('Invalid raw values and unsupported version/population remain explicit without a total or fabricated clinical output; disabled controls stay passive');
    } finally { s.close(); }
  }
  {
    const s = setup(docWith({ status: 'pending' }));
    try {
      assert.equal(s.gcs().dataset.phase, 'pending'); assert.equal(s.q('.iui-gcs-loading').style.height, '320px'); assert.equal(s.action('calculate'), null);
      s.ctl.update(docWith({ status: 'failed' })); assert.equal(s.gcs().hidden, true);
      s.ctl.update(docWith({ status: 'failed', fallback: 'Original <b>unavailable</b> message' })); assert.equal(s.gcs().textContent, 'Original <b>unavailable</b> message'); assert.equal(s.q('b'), null);
      s.ctl.update(fixture); assert.equal(s.q('[data-value=total]').textContent, '9');
      flows.push('Pending, hidden failure, literal supplied fallback and resolved phases replace one another through the public controller');
    } finally { s.close(); }
  }
  const standaloneDoc = structuredClone(fixture), second = { ...structuredClone(fixture.body[0]), id: 'original_numeric_on_demand', resultMode: 'on-demand' }; standaloneDoc.body.push(second);
  const html = await api.compileHtml(standaloneDoc), page = new JSDOM(html, { ...options(), runScripts: 'dangerously' });
  try {
    const nodes = [...page.window.document.querySelectorAll('.iui-gcs')]; assert.equal(nodes.length, 2);
    assert.equal(nodes[0].querySelector('[data-value=total]').textContent, '9'); assert.equal(nodes[1].querySelector('[data-value=total]'), null);
    nodes[1].querySelector('[data-action=calculate]').click(); assert.equal(nodes[1].querySelector('[data-value=total]').textContent, '9');
    flows.push('Actual compiled offline standalone executes the original live and on-demand numeric fixtures');
  } finally { page.window.close(); }
  assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
  return { source: lock.source, publicCommit: lock.publicCommit, protocolNodes: 215, canonicalScopeAtFreeze: 209,
    arithmeticChecks, numericCombinations: 120, positiveDocuments: c.positives.length, negativeDocuments: c.negatives.length,
    passed: flows.length, failed: 0, flows, filesChecked: lock.files.length, preservedDefinitions: 386,
    standalone: { executed: true, bytes: Buffer.byteLength(html), sha256: hash(html) }, resourceRequests: requests, serviceCalls: services,
    clinicalValidation: false, nativeExecutedByConsumer: false, fullNewCDN: false,
    boundary: 'Software arithmetic over fictional explicitly supplied adult six-motor-level component ratings and local UI only; no examination, severity, prognosis or treatment output.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the exact source-build read-point');
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
