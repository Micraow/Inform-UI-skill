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
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * 1e-12, `${actual} != ${expected}`);

export async function verify(library) {
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const fixture = await json('examples/original-unit-scorecard.json'), vectors = await json('arithmetic-vectors.json');
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
  let arithmeticChecks = 0;
  for (const v of vectors.cases) {
    const input = structuredClone(v.input), before = JSON.stringify(input), r = api.calculateRox(input), e = v.expected;
    assert.equal(r.status, e.status, v.id); assert.equal(JSON.stringify(input), before, v.id);
    if (r.status === 'calculated') {
      if ('value' in e) close(r.value, e.value);
      if ('display' in e) assert.equal(r.display, e.display, v.id);
      if ('fio2Fraction' in e) close(r.fio2Fraction, e.fio2Fraction);
      if ('band' in e) assert.equal(r.comparison.band, e.band, v.id);
      if ('comparisonStatus' in e) assert.equal(r.comparison.status, e.comparisonStatus, v.id);
      if ('reason' in e) assert.equal(r.comparison.reason, e.reason, v.id);
    } else {
      assert.equal('value' in r, false, v.id); assert.equal('display' in r, false, v.id);
      if (e.field) assert.ok(r.fields.includes(e.field), v.id);
    }
    arithmeticChecks++;
  }
  const base = { version: 'rox-roca-2016-arithmetic', spo2Percent: 95, fio2: 0.5, fio2Unit: 'fraction', respiratoryRate: 20 };
  for (const bad of [undefined, null, [], true]) { assert.deepEqual(api.calculateRox(bad), { status: 'invalid', fields: ['input'] }); arithmeticChecks++; }
  for (const bad of [NaN, Infinity, 'NT', false]) { const r = api.calculateRox({ ...base, spo2Percent: bad }); assert.equal(r.status, 'invalid'); assert.equal('value' in r, false); arithmeticChecks++; }
  for (const input of [{ ...base, fio2: Number.MIN_VALUE, fio2Unit: 'percent' }, { ...base, respiratoryRate: Number.MIN_VALUE }]) { const r = api.calculateRox(input); assert.equal(r.status, 'uncomputable'); assert.equal('value' in r, false); arithmeticChecks++; }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), old = JSON.parse(await readFile(path.join(root, 'tests/fixtures/rox/schema215-baseline.json')));
  assert.equal(Object.keys(old.defs).length, 388);
  for (const [key, sha] of Object.entries(old.defs)) assert.equal(hash(JSON.stringify(schema.$defs[key])), sha, key);
  assert.equal(schema.$defs.Node.oneOf.length, 216); assert.deepEqual(schema.$defs.Node.oneOf.slice(0, 215), old.node.oneOf);
  assert.equal(api.styles, await readFile(path.join(root, 'dist/style.css'), 'utf8')); assert.ok(api.styles.includes('.iui-rox'));

  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  let requests = 0, services = 0; const errors = [], flows = [];
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No remote data or resources'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { const block = () => { services++; throw Error('No clipboard, clinical or external service'); }; w.fetch = w.open = w.navigator.sendBeacon = block; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: block } }); } };
  };
  const docWith = patch => ({ version: 'iui/1', body: [{ ...structuredClone(fixture.body[0]), ...patch }] });
  function setup(doc = fixture) {
    const dom = new JSDOM('<form><main></main></form>', options()), w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(doc), { styles: false });
    const q = s => host.querySelector(s), rox = () => q('.iui-rox'), field = name => q('[data-field=' + name + ']');
    const action = name => [...host.querySelectorAll('button')].find(b => b.textContent === (name === 'reset' ? 'Restore independent values' : 'Request local summary'));
    const edit = (name, value) => { const el = field(name); assert.ok(el, name); el.value = String(value); el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    const details = []; host.addEventListener('iui:rox', e => {
      assert.equal(e.cancelable, true); assert.equal(e.composed, false); assert.ok(Object.isFrozen(e.detail));
      if (e.detail.result) { assert.ok(Object.isFrozen(e.detail.result)); if (e.detail.result.comparison) assert.ok(Object.isFrozen(e.detail.result.comparison)); }
      details.push(e.detail);
    });
    const cancel = () => host.addEventListener('iui:rox', e => e.preventDefault(), { once: true });
    return { w, host, form, ctl, q, rox, action, field, edit, details, cancel, close() { ctl.dispose(); w.close(); } };
  }
  {
    const s = setup();
    try {
      assert.equal(s.q('[data-value=rox]').textContent, '9.0'); assert.match(s.q('.iui-rox-comparison').textContent, /context unconfirmed/);
      s.edit('fio2Unit', 'fraction'); assert.equal(s.rox().dataset.result, 'invalid'); assert.equal(s.q('[data-value=rox]'), null);
      s.edit('fio2', '.5'); assert.equal(s.q('[data-value=rox]').textContent, '9.0');
      s.edit('fio2Unit', 'percent'); assert.equal(s.q('[data-value=rox]').textContent, '900.0');
      s.edit('spo2Percent', '0'); assert.equal(s.q('[data-value=rox]').textContent, '0.0');
      s.edit('spo2Percent', ''); assert.equal(s.rox().dataset.result, 'incomplete'); assert.equal(s.q('[data-value=rox]'), null);
      s.edit('spo2Percent', 'NT'); assert.equal(s.rox().dataset.result, 'invalid'); s.action('copy-summary').click(); assert.equal('value' in s.details.at(-1).result, false);
      s.edit('spo2Percent', '90'); s.edit('fio2', '50'); s.cancel(); s.action('copy-summary').click();
      const d = s.details.at(-1); assert.equal(d.intent, 'copy-summary'); assert.equal(d.result.value, 9); assert.match(d.text, /FiO2=0.5 fraction/);
      flows.push('Explicit percent/fraction inputs never guess units, true zero remains zero, missing/NT suppress stale numeric output and summary requests remain local/cancelable');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit('fio2Unit', 'fraction'); s.edit('fio2', '1'); s.edit('spo2Percent', '97.58'); s.edit('studyContextConfirmed', 'true');
      assert.equal(s.q('[data-value=rox]').textContent, '4.9'); assert.match(s.q('.iui-rox-comparison').textContent, /between study boundaries/);
      s.edit('spo2Percent', '97.62'); assert.equal(s.q('[data-value=rox]').textContent, '4.9'); assert.match(s.q('.iui-rox-comparison').textContent, /at or above study upper/);
      s.edit('measuredHours', '2.01'); assert.match(s.q('.iui-rox-comparison').textContent, /unsupported time/);
      s.edit('measuredHours', ''); assert.match(s.q('.iui-rox-comparison').textContent, /unsupported time/);
      s.edit('measuredHours', '2'); s.edit('studyContextConfirmed', 'false'); assert.match(s.q('.iui-rox-comparison').textContent, /context unconfirmed/);
      s.edit('comparisonVersion', ''); assert.match(s.q('.iui-rox-comparison').textContent, /not requested/);
      s.edit('version', ''); assert.equal(s.rox().dataset.result, 'incomplete'); assert.equal(s.q('[data-value=rox]'), null);
      flows.push('Unrounded comparisons differ despite equal one-decimal labels and require explicit study version, context and exact elapsed hours');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      const tabs = [...s.host.querySelectorAll('[role=tab]')], selected = () => s.q('[role=tab][aria-selected=true]').textContent;
      s.cancel(); tabs[1].click(); assert.equal(selected(), 'Units'); tabs[1].click(); assert.equal(selected(), 'Scope');
      const key = (button, value, extra = {}) => button.dispatchEvent(new s.w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extra }));
      key(tabs[1], 'End', { ctrlKey: true }); key(tabs[1], 'End', { isComposing: true }); key(tabs[1], 'End', { keyCode: 229 }); assert.equal(selected(), 'Scope');
      key(tabs[1], 'End'); assert.equal(selected(), 'Record'); assert.equal(s.w.document.activeElement, tabs[2]); assert.equal(s.q('[role=tabpanel] b'), null);
      s.rox().style.direction = 'rtl'; key(tabs[2], 'ArrowRight'); assert.equal(selected(), 'Scope');
      s.edit('spo2Percent', '80'); s.cancel(); s.action('reset').click(); assert.equal(s.field('spo2Percent').value, '80');
      s.form.addEventListener('reset', e => e.preventDefault(), { once: true }); s.form.reset(); await settleReset(); assert.equal(s.field('spo2Percent').value, '80');
      s.form.reset(); s.edit('spo2Percent', '85'); await settleReset(); assert.equal(s.field('spo2Percent').value, '85');
      s.host.addEventListener('iui:rox', () => s.edit('spo2Percent', '87'), { once: true }); s.action('reset').click(); assert.equal(s.field('spo2Percent').value, '87');
      s.action('reset').click(); assert.equal(s.field('spo2Percent').value, '95'); assert.equal(s.q('[data-value=rox]').textContent, '2.4');
      s.action('copy-summary').click(); assert.equal(s.details.at(-1).result.value, 2.375); assert.equal(selected(), 'Scope');
      flows.push('Literal information tabs and guarded RTL keyboard navigation retain selection across independent defaults; canceled/native/local resets respect newer input');
    } finally { s.close(); }
  }
  {
    const s = setup(docWith({ status: 'pending' }));
    try {
      assert.equal(s.rox().dataset.phase, 'pending'); assert.equal(s.q('.iui-rox-loading').style.height, '320px'); assert.equal(s.field('fio2'), null);
      s.ctl.update(docWith({ status: 'failed' })); assert.equal(s.rox().hidden, true);
      s.ctl.update(docWith({ status: 'failed', fallback: 'Original <b>unavailable</b> message' })); assert.equal(s.rox().textContent, 'Original <b>unavailable</b> message'); assert.equal(s.q('b'), null);
      s.ctl.update(docWith({ disabled: true })); const n = s.details.length; s.action('copy-summary').click(); s.edit('spo2Percent', '70'); assert.equal(s.details.length, n); assert.equal(s.q('[data-value=rox]').textContent, '9.0');
      s.ctl.update(fixture); const old = s.action('copy-summary'); s.host.addEventListener('iui:rox', () => s.ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'New synthetic view' }] }), { once: true }); old.click(); old.click(); assert.equal(s.host.textContent, 'New synthetic view');
      s.ctl.update(fixture); s.form.reset(); s.ctl.dispose(); await settleReset(); assert.equal(s.host.children.length, 0);
      flows.push('Pending/failure/literal fallback, disabled state, callback replacement and disposal obey public generation ownership');
    } finally { s.close(); }
  }
  const html = await api.compileHtml(fixture), page = new JSDOM(html, { ...options(), runScripts: 'dangerously' });
  try {
    const host = page.window.document.querySelector('.iui-rox'); assert.ok(host); assert.equal(host.querySelector('[data-value=rox]').textContent, '9.0');
    const reset = [...host.querySelectorAll('button')].find(b => b.textContent === 'Restore independent values'); reset.click(); assert.equal(host.querySelector('[data-value=rox]').textContent, '2.4');
    flows.push('Actual compiled offline standalone executes the same original explicit-unit input and independent defaults');
  } finally { page.window.close(); }
  assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
  return { source: lock.source, publicCommit: lock.publicCommit, protocolNodes: 216, canonicalScopeAtFreeze: 210,
    arithmeticChecks, originalJsonVectors: 30, positiveDocuments: c.positives.length, negativeDocuments: c.negatives.length,
    passed: flows.length, failed: 0, flows, filesChecked: lock.files.length, preservedDefinitions: 388,
    standalone: { executed: true, bytes: Buffer.byteLength(html), sha256: hash(html) }, resourceRequests: requests, serviceCalls: services,
    clinicalValidation: false, nativeExecutedByConsumer: false, fullNewCDN: false,
    boundary: 'Software arithmetic over fictional explicitly supplied measurements and optional neutral study comparisons; no patient assessment, treatment instruction, measurement service or clinical validation.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the exact source-build read-point');
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
