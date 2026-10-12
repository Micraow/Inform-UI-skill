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
  const fixture = await json('examples/original-criteria.json'), vectors = await json('arithmetic-vectors.json');
  async function identity() {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await readFile(path.join(root, f.path)); assert.equal(b.length, f.bytes); assert.equal(hash(b), f.sha256, f.path);
    }
  }
  await identity();
  const api = await import(pathToFileURL(path.join(root, 'dist/index.js'))), docs = cases(fixture);
  for (const [name, d] of docs.positives) assert.equal(api.validateDocument(d).ok, true, name);
  for (const [name, d] of docs.negatives) assert.equal(api.validateDocument(d).ok, false, name);
  let arithmeticChecks = 0;
  for (const v of vectors.cases) {
    const input = structuredClone(v.input), before = JSON.stringify(input), r = api.calculateQsofa(input), expected = v.expected;
    assert.equal(r.status, expected.status, v.id); assert.equal(JSON.stringify(input), before, v.id);
    if (r.status === 'calculated') {
      assert.equal(r.total, expected.total, v.id);
      if (expected.points) assert.deepEqual(r.points, expected.points, v.id);
      assert.equal(r.mentationMode, input.mentation.mode);
    } else {
      assert.equal('total' in r, false, v.id); assert.equal('points' in r, false, v.id);
      if (expected.field) assert.ok(r.fields.includes(expected.field), v.id);
    }
    arithmeticChecks++;
  }
  const base = fixture.body[0].initial;
  for (const bad of [undefined, null, [], true]) { assert.deepEqual(api.calculateQsofa(bad), { status: 'invalid', fields: ['input'] }); arithmeticChecks++; }
  for (const bad of [NaN, Infinity, true, '1e2', ' 22', '-1']) { const r = api.calculateQsofa({ ...base, respiratoryRate: bad }); assert.equal(r.status, 'invalid'); assert.equal('total' in r, false); arithmeticChecks++; }
  for (const score of ['14', 2, 16, 14.5]) { const r = api.calculateQsofa({ ...base, mentation: { mode: 'gcs', score } }); assert.equal(r.status, 'invalid'); assert.equal('total' in r, false); arithmeticChecks++; }
  assert.equal(api.calculateQsofa({ ...base, mentation: { mode: 'assessment', altered: true, score: null } }).status, 'invalid'); arithmeticChecks++;
  for (const input of [{ ...base, version: 'derivation-gcs13' }, { ...base, population: 'pediatric' }]) { assert.equal(api.calculateQsofa(input).status, 'unsupported'); arithmeticChecks++; }
  assert.equal(api.calculateQsofa({ ...base, version: null }).status, 'incomplete'); arithmeticChecks++;
  for (const rr of [21, 22]) for (const bp of [100, 101]) for (const altered of [false, true]) {
    const a = api.calculateQsofa({ ...base, respiratoryRate: rr, systolicMmHg: bp, mentation: { mode: 'assessment', altered } });
    const b = api.calculateQsofa({ ...base, respiratoryRate: rr, systolicMmHg: bp, mentation: { mode: 'gcs', score: altered ? 14 : 15 } });
    assert.equal(a.total, b.total); assert.deepEqual(a.points, b.points); arithmeticChecks++;
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), old = JSON.parse(await readFile(path.join(root, 'tests/fixtures/qsofa/schema216-baseline.json')));
  assert.equal(Object.keys(old.defs).length, 390);
  for (const [key, sha] of Object.entries(old.defs)) assert.equal(hash(JSON.stringify(schema.$defs[key])), sha, key);
  assert.equal(schema.$defs.Node.oneOf.length, 217); assert.deepEqual(schema.$defs.Node.oneOf.slice(0, 216), old.node.oneOf);
  assert.equal(api.styles, await readFile(path.join(root, 'dist/style.css'), 'utf8')); assert.ok(api.styles.includes('.iui-qsofa'));

  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  let requests = 0, services = 0; const errors = [], flows = [];
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No remote resources'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { const block = () => { services++; throw Error('No clipboard or clinical service'); }; w.fetch = w.open = w.navigator.sendBeacon = block; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: block } }); } };
  };
  const docWith = patch => ({ version: 'iui/1', body: [{ ...structuredClone(fixture.body[0]), ...patch }] });
  function setup(doc = fixture) {
    const dom = new JSDOM('<form><main></main></form>', options()), w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(doc), { styles: false });
    const q = s => host.querySelector(s), card = () => q('.iui-qsofa'), field = name => q('[data-field=' + name + ']'), action = name => q('[data-action=' + name + ']');
    const edit = (name, value) => { const el = field(name); assert.ok(el, name); el.value = String(value); el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    const details = []; host.addEventListener('iui:qsofa', e => {
      assert.equal(e.cancelable, true); assert.equal(e.composed, false); assert.ok(Object.isFrozen(e.detail));
      if (e.detail.result) { assert.ok(Object.isFrozen(e.detail.result)); if (e.detail.result.points) assert.ok(Object.isFrozen(e.detail.result.points)); }
      details.push(e.detail);
    });
    const cancel = () => host.addEventListener('iui:qsofa', e => e.preventDefault(), { once: true });
    return { w, host, form, ctl, q, card, action, field, edit, details, cancel, close() { ctl.dispose(); w.close(); } };
  }
  {
    const s = setup();
    try {
      assert.equal(s.q('[data-value=total]').textContent, '1');
      s.edit('mentationMode', 'gcs'); assert.equal(s.card().dataset.result, 'incomplete'); assert.equal(s.q('[data-value=total]'), null);
      s.edit('gcs', '14'); assert.equal(s.q('[data-value=total]').textContent, '2');
      s.edit('gcs', '15'); assert.equal(s.q('[data-value=total]').textContent, '1');
      s.edit('gcs', 'NT'); assert.equal(s.card().dataset.result, 'incomplete'); assert.equal(s.q('[data-value=total]'), null);
      s.action('copy-summary').click(); assert.equal('total' in s.details.at(-1).result, false);
      s.edit('mentationMode', 'assessment'); assert.equal(s.field('altered').value, ''); assert.equal(s.q('[data-value=total]'), null);
      s.edit('altered', 'false'); s.edit('respiratoryRate', '21.999'); s.edit('systolicMmHg', '100.001'); assert.equal(s.q('[data-value=total]').textContent, '0');
      s.edit('respiratoryRate', '22'); s.edit('systolicMmHg', '100'); assert.equal(s.q('[data-value=total]').textContent, '2');
      s.edit('altered', 'true'); s.cancel(); s.action('copy-summary').click();
      const d = s.details.at(-1); assert.equal(d.intent, 'copy-summary'); assert.equal(d.result.total, 3); assert.match(d.text, /mentation method=assessment/);
      flows.push('Explicit assessment and GCS modes preserve consensus GCS14=one point; NT/missing suppress totals, precise measurement boundaries remain live and local summary requests are frozen/cancelable');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      const tabs = [...s.host.querySelectorAll('[role=tab]')], selected = () => s.q('[role=tab][aria-selected=true]').textContent;
      s.cancel(); tabs[1].click(); assert.equal(selected(), 'Units'); tabs[1].click(); assert.equal(selected(), 'Rule version');
      const key = (button, value, extra = {}) => button.dispatchEvent(new s.w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extra }));
      key(tabs[1], 'End', { ctrlKey: true }); key(tabs[1], 'End', { isComposing: true }); key(tabs[1], 'End', { keyCode: 229 }); assert.equal(selected(), 'Rule version');
      key(tabs[1], 'End'); assert.equal(selected(), 'Record'); assert.equal(s.w.document.activeElement, tabs[2]); assert.equal(s.q('[role=tabpanel] em'), null); assert.match(s.q('[role=tabpanel]').textContent, /<em>example<\/em>/);
      s.card().style.direction = 'rtl'; key(tabs[2], 'ArrowRight'); assert.equal(selected(), 'Rule version');
      s.edit('respiratoryRate', '30'); s.cancel(); s.action('reset').click(); assert.equal(s.field('respiratoryRate').value, '30');
      s.form.addEventListener('reset', e => e.preventDefault(), { once: true }); s.form.reset(); await settleReset(); assert.equal(s.field('respiratoryRate').value, '30');
      s.form.reset(); s.edit('respiratoryRate', '31'); await settleReset(); assert.equal(s.field('respiratoryRate').value, '31');
      s.host.addEventListener('iui:qsofa', () => s.edit('respiratoryRate', '32'), { once: true }); s.action('reset').click(); assert.equal(s.field('respiratoryRate').value, '32');
      s.action('reset').click(); assert.equal(s.field('respiratoryRate').value, '21.5'); assert.equal(s.q('[data-value=total]').textContent, '2'); assert.equal(selected(), 'Rule version');
      flows.push('Literal information/notes and guarded RTL/IME tab navigation retain selection across independent defaults; canceled and newer-input resets do not overwrite the latest draft');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit('mentationMode', 'gcs'); s.edit('gcs', '14'); const focus = s.field('gcs'); focus.focus();
      s.cancel(); s.action('reset').click(); assert.equal(s.w.document.activeElement, focus); assert.equal(focus.closest('.iui-qsofa-field').hidden, false);
      s.action('reset').click(); assert.equal(focus.closest('.iui-qsofa-field').hidden, true); assert.equal(s.w.document.activeElement, s.action('reset'));
      s.edit('mentationMode', 'gcs'); s.edit('gcs', '15'); s.field('gcs').focus(); s.form.reset(); await settleReset();
      assert.equal(s.field('gcs').closest('.iui-qsofa-field').hidden, true); assert.equal(s.w.document.activeElement, s.action('reset')); assert.equal(s.q('[data-value=total]').textContent, '2');
      flows.push('Accepted local/native reset returns focus from newly hidden mode input to visible Reset; canceled reset preserves the visible input and its focus');
    } finally { s.close(); }
  }
  {
    const s = setup(docWith({ status: 'pending' }));
    try {
      assert.equal(s.card().dataset.phase, 'pending'); assert.equal(s.q('.iui-qsofa-loading').style.height, '320px'); assert.equal(s.field('gcs'), null);
      s.ctl.update(docWith({ status: 'failed' })); assert.equal(s.card().hidden, true);
      s.ctl.update(docWith({ status: 'failed', fallback: 'Original <b>unavailable</b>' })); assert.equal(s.card().textContent, 'Original <b>unavailable</b>'); assert.equal(s.q('b'), null);
      s.ctl.update(fixture); s.edit('population', 'pediatric'); assert.equal(s.card().dataset.result, 'unsupported'); assert.equal(s.q('[data-value=total]'), null);
      s.edit('respiratoryRate', '-1'); assert.equal(s.card().dataset.result, 'invalid'); s.edit('respiratoryRate', ''); assert.equal(s.card().dataset.result, 'unsupported');
      s.ctl.update(docWith({ disabled: true })); const count = s.details.length; s.action('copy-summary').click(); s.edit('respiratoryRate', '30'); assert.equal(s.details.length, count); assert.equal(s.q('[data-value=total]').textContent, '1');
      s.ctl.update(fixture); const old = s.action('copy-summary'); s.host.addEventListener('iui:qsofa', () => s.ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'New synthetic view' }] }), { once: true }); old.click(); old.click(); assert.equal(s.host.textContent, 'New synthetic view');
      s.ctl.update(fixture); s.form.reset(); s.ctl.dispose(); await settleReset(); assert.equal(s.host.children.length, 0);
      flows.push('Pending/failure/literal fallback, explicit applicability, invalid precedence, disabled controls and callback update/dispose stop stale effects');
    } finally { s.close(); }
  }
  const html = await api.compileHtml(fixture), page = new JSDOM(html, { ...options(), runScripts: 'dangerously' });
  try {
    const host = page.window.document.querySelector('.iui-qsofa'); assert.ok(host); assert.equal(host.querySelector('[data-value=total]').textContent, '1');
    host.querySelector('[data-action=reset]').click(); assert.equal(host.querySelector('[data-value=total]').textContent, '2');
    flows.push('Actual offline compiled standalone executes the original input and independent reset baseline with the same source-build styles');
  } finally { page.window.close(); }
  assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
  return { source: lock.source, publicCommit: lock.publicCommit, protocolNodes: 217, canonicalScopeAtFreeze: 211,
    arithmeticChecks, originalJsonVectors: vectors.cases.length, positiveDocuments: docs.positives.length, negativeDocuments: docs.negatives.length,
    passed: flows.length, failed: 0, flows, filesChecked: lock.files.length, preservedDefinitions: 390,
    standalone: { executed: true, bytes: Buffer.byteLength(html), sha256: hash(html) }, resourceRequests: requests, serviceCalls: services,
    clinicalValidation: false, nativeExecutedByConsumer: false, fullNewCDN: false,
    boundary: 'Original fictional measurements exercising the 2016 adult consensus software rules, without infection inference, diagnosis, treatment, clinical validation or external service.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the exact source-build read-point');
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
