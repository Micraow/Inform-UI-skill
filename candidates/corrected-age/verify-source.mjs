import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { cases } from './cases.mjs';
import { settleReset } from '../host-form-reset/verify-source.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));

export async function verify(library) {
  const root = await realpath(library), lock = await local('runtime-lock.safe.json');
  const fixture = await local('examples/original-date-arithmetic.json');
  async function identity() {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await readFile(path.join(root, f.path));
      assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  }
  await identity();
  const api = await import(pathToFileURL(path.join(root, 'dist/index.js')));
  const c = cases(fixture);
  for (const [name, doc] of c.positives) assert.equal(api.validateDocument(doc).ok, true, name);
  for (const [name, doc] of c.negatives) assert.equal(api.validateDocument(doc).ok, false, name);
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json')));
  const old = JSON.parse(await readFile(path.join(root, 'tests/fixtures/corrected-age/schema213-baseline.json')));
  assert.equal(Object.keys(old.defs).length, 384);
  for (const [key, sha] of Object.entries(old.defs)) assert.equal(hash(JSON.stringify(schema.$defs[key])), sha, key);
  assert.equal(schema.$defs.Node.oneOf.length, 214);
  const prior = new Set(old.node.oneOf.map(x => x.$ref));
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => prior.has(x.$ref)), old.node.oneOf);
  assert.equal(api.styles, await readFile(path.join(root, 'dist/style.css'), 'utf8'));
  assert.ok(api.styles.includes('.iui-corrected-age'));
  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  const errors = [], flows = []; let requests = 0, services = 0;
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No external resources in synthetic date consumer'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { w.fetch = w.open = w.navigator.sendBeacon = () => { services++; throw Error('No date lookup or medical service'); }; } };
  };
  function setup(doc = fixture) {
    const dom = new JSDOM('<form><main></main></form>', options()), w = dom.window;
    const host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(doc), { styles: false });
    const roots = () => [...host.querySelectorAll('.iui-corrected-age')];
    const q = (selector, i = 0) => roots()[i].querySelector(selector);
    const action = (name, i = 0) => q('[data-action=' + name + ']', i);
    const field = (name, i = 0) => q('[data-field=' + name + ']', i);
    const edit = (name, value, i = 0) => { const x = field(name, i); x.value = value; x.dispatchEvent(new w.Event(x.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    const details = [];
    host.addEventListener('iui:corrected-age', event => {
      assert.equal(event.cancelable, true); assert.equal(event.composed, false);
      assert.ok(Object.isFrozen(event.detail));
      if (event.detail.result) assert.ok(Object.isFrozen(event.detail.result));
      details.push(event.detail);
    });
    return { dom, w, host, form, ctl, roots, q, action, field, edit, details, close() { ctl.dispose(); w.close(); } };
  }
  const one = init => ({ version: 'iui/1', body: [{ ...structuredClone(fixture.body[0]), initial: init }] });
  {
    const s = setup();
    try {
      for (let i = 0; i < 2; i++) {
        assert.equal(s.roots()[i].dataset.result, 'not-calculated');
        s.action('calculate', i).click();
        assert.equal(s.details.at(-1).result.correctedDays, 56);
        assert.equal(s.q('[data-value=corrected-days]', i).textContent, '8 complete weeks and 0 days (56 days)');
      }
      assert.deepEqual(s.details[0].result, s.details[1].result);
      assert.equal(s.details[0].result.correctionDays, 40);
      assert.equal(s.details[0].result.chronologicalDays, 96);
      assert.ok(s.host.textContent.includes('No clinical validation'));
      flows.push('Two original supplied bases produce the same exact56-day result only after accepted Calculate');
    } finally { s.close(); }
  }
  {
    const s = setup(one({}));
    const leap = { basis: 'due-date', birthDate: '2023-12-28', observationDate: '2026-02-28', dueDate: '2024-02-29', confirmedPreterm: true };
    const outcomes = [
      [{}, 'incomplete'],
      [{ ...fixture.body[0].initial, birthDate: null, gestationalDays: 7 }, 'invalid'],
      [{ ...fixture.body[0].initial, gestationalWeeks: 40 }, 'unsupported'],
      [{ ...leap, confirmedPreterm: false }, 'unsupported'],
      [{ ...leap, observationDate: '2024-02-28' }, 'before-due-date'],
      [leap, 'calculated'],
      [{ ...leap, observationDate: '2026-03-01' }, 'outside-supported-window']
    ];
    try {
      for (const [init, status] of outcomes) {
        s.ctl.update(one(init)); s.action('calculate').click(); const result = s.details.at(-1).result;
        assert.equal(result.status, status); assert.equal(s.roots()[0].dataset.result, status);
        if (status === 'calculated') {
          assert.equal(result.correctedDays, 730); assert.equal(result.atWindowBoundary, true);
          assert.ok(s.q('[data-value]').textContent.includes('730 days'));
        } else { assert.equal(s.q('[data-value]'), null); assert.equal('correctedDays' in result, false); }
        if (status === 'invalid') assert.equal(s.field('gestationalDays').getAttribute('aria-invalid'), 'true');
        if (status === 'before-due-date') { assert.equal(result.remainingDays, 1); assert.equal('chronologicalDays' in result, false); }
        if (status === 'outside-supported-window') assert.deepEqual(Object.keys(result).sort(), ['reason', 'status', 'windowEndDate']);
      }
      flows.push('Missing, invalid, unsupported, pre-due and leap-anniversary window outcomes remain distinct and omit prohibited age values');
    } finally { s.close(); }
  }
  {
    const s = setup(one(fixture.body[0].initial));
    try {
      s.host.addEventListener('iui:corrected-age', e => e.preventDefault(), { once: true });
      s.action('calculate').click(); assert.equal(s.q('[data-value]'), null);
      s.action('calculate').click(); assert.ok(s.q('[data-value]'));
      s.edit('observationDate', '2026-01-10'); assert.equal(s.q('[data-value]'), null);
      s.host.addEventListener('iui:corrected-age', e => e.preventDefault(), { once: true });
      s.action('reset').click(); assert.equal(s.field('observationDate').value, '2026-01-10');
      s.action('reset').click(); assert.equal(s.field('observationDate').value, '2026-01-09');
      s.edit('observationDate', '2026-01-10');
      s.form.addEventListener('reset', e => e.preventDefault(), { once: true });
      s.form.reset(); await settleReset(); assert.equal(s.field('observationDate').value, '2026-01-10');
      s.form.reset(); s.edit('observationDate', '2026-01-11'); await settleReset();
      assert.equal(s.field('observationDate').value, '2026-01-11');
      s.action('calculate').click(); assert.equal(s.details.at(-1).result.correctedDays, 58);
      flows.push('Calculate and Reset cancellation retain the draft; edits clear old results and newer input survives host reset');
    } finally { s.close(); }
  }
  {
    const s = setup(one(fixture.body[0].initial));
    try {
      for (const native of [false, true]) {
        s.edit('basis', 'due-date'); const due = s.field('dueDate'); due.focus();
        if (native) {
          s.form.addEventListener('reset', e => e.preventDefault(), { once: true }); s.form.reset(); await settleReset();
        } else { s.host.addEventListener('iui:corrected-age', e => e.preventDefault(), { once: true }); s.action('reset').click(); }
        assert.equal(s.w.document.activeElement, due); assert.equal(due.parentElement.hidden, false);
        if (native) { s.form.reset(); await settleReset(); } else s.action('reset').click();
        assert.equal(due.parentElement.hidden, true); assert.equal(s.w.document.activeElement, s.action('reset'));
      }
      const birth = s.field('birthDate'); birth.focus(); s.form.reset(); await settleReset();
      assert.equal(s.w.document.activeElement, birth);
      flows.push('Accepted reset moves hidden due-field focus to visible Reset; canceled reset and still-visible focus are preserved');
    } finally { s.close(); }
  }
  {
    for (const retire of ['update', 'dispose']) {
      const s = setup(one(fixture.body[0].initial));
      try {
        s.host.addEventListener('iui:corrected-age', () => {
          if (retire === 'update') s.ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'Original replacement panel' }] });
          else s.ctl.dispose();
        }, { once: true });
        s.action('calculate').click(); assert.equal(s.host.querySelector('[data-value]'), null);
        if (retire === 'update') assert.ok(s.host.textContent.includes('Original replacement panel'));
        else assert.equal(s.host.children.length, 0);
      } finally { s.close(); }
    }
    const disabled = one(fixture.body[0].initial); disabled.body[0].disabled = true;
    const s = setup(disabled);
    try { s.action('calculate').disabled = false; s.action('calculate').click(); assert.equal(s.details.length, 0); }
    finally { s.close(); }
    flows.push('Disabled and retired generations cannot publish results or revive the old date view');
  }
  {
    const s = setup(one(fixture.body[0].initial));
    try {
      s.edit('observationDate', '2026-01-10');
      s.host.addEventListener('iui:corrected-age', () => s.edit('observationDate', '2026-01-12'), { once: true });
      s.action('reset').click();
      assert.equal(s.field('observationDate').value, '2026-01-12', 'New input emitted by the host Reset intent listener must supersede the pending reset');
      s.action('calculate').click(); assert.equal(s.details.at(-1).result.correctedDays, 59);
      flows.push('New local input in a host Reset intent handler supersedes that pending Reset');
    } finally { s.close(); }
  }
  const html = await api.compileHtml(fixture);
  assert.ok(html.includes('.iui-corrected-age'));
  const standalone = new JSDOM(html, { ...options(), runScripts: 'dangerously' });
  try {
    const roots = [...standalone.window.document.querySelectorAll('.iui-corrected-age')]; assert.equal(roots.length, 2);
    for (const root of roots) { root.querySelector('[data-action=calculate]').click(); assert.ok(root.querySelector('[data-value]').textContent.includes('56 days')); }
    flows.push('Actual compiled offline HTML executes both original bases with the bundled standalone runtime');
  } finally { standalone.window.close(); }
  assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
  return { source: lock.source, publicCommit: null, positiveDocuments: c.positives.length, negativeDocuments: c.negatives.length,
    passed: flows.length, failed: 0, flows, lockedFiles: lock.files.length, preservedDefinitions: 384, protocolNodes: 214,
    resourceRequests: requests, serviceCalls: services, standalone: { bytes: Buffer.byteLength(html), sha256: hash(html), executed: true },
    nativeExecutedByConsumer: false, clinicalValidation: false, status: 'software-consumer-passed; canonical promotion separately decided' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the exact frozen runtime read-point');
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
