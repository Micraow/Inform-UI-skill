import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { settleReset } from '../host-form-reset/verify-source.mjs';

const json = async name => JSON.parse(await readFile(new URL(name, import.meta.url)));
export async function verify(library, dependencies = library) {
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const fixture = await json('examples/original-paper-fields.json');
  async function identity() {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await readFile(path.join(root, f.path));
      assert.equal(b.length, f.bytes, f.path);
      assert.equal(createHash('sha256').update(b).digest('hex'), f.sha256, f.path);
    }
  }
  await identity();
  const require = createRequire(path.join(await realpath(dependencies), 'package.json'));
  const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  const errors = [], flows = []; let requests = 0, services = 0;
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No remote resource expected'); } }
  const globalConsole = new VirtualConsole(); globalConsole.on('jsdomError', e => errors.push(e.message));
  const globalDOM = new JSDOM('', { runScripts: 'outside-only', resources: new Reject(), virtualConsole: globalConsole });
  globalDOM.window.eval((await readFile(path.join(root, 'cdn/iui.global.min.js'), 'utf8')) + '\n;globalThis.__fieldsConsumer = IUI;');
  const raw = globalDOM.window.__fieldsConsumer;
  const intoRealm = d => globalDOM.window.JSON.parse(JSON.stringify(d));
  const api = { validateDocument: d => raw.validateDocument(intoRealm(d)), mount: (h, d, opts) => {
    const c = raw.mount(h, intoRealm(d), opts);
    return { ...c, getState: () => JSON.parse(JSON.stringify(c.getState())),
      update: d => c.update(intoRealm(d)), setState: d => c.setState(intoRealm(d)) };
  } };
  assert.equal(api.validateDocument(fixture).ok, true);
  function setup() {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    const dom = new JSDOM('<form><main></main><button type="reset">Reset original paper fields</button></form>', {
      url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { w.fetch = w.open = w.navigator.sendBeacon = () => { services++; throw Error('No service permitted'); }; }
    });
    const w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(fixture), { styles: false });
    const controls = key => [...host.querySelectorAll('[data-bind="' + key + '"]')];
    const control = key => controls(key)[0];
    function input(key, value) {
      const list = controls(key), el = list.length > 1 ? list[value] : list[0];
      if (el.type === 'checkbox') el.checked = value;
      else if (el.type === 'radio') el.checked = true;
      else el.value = String(value);
      el.dispatchEvent(new w.Event(['checkbox', 'radio'].includes(el.type) ? 'change' : 'input', { bubbles: true }));
    }
    const snapshot = () => ({ state: ctl.getState(), title: control('title').value,
      notes: control('notes').value, width: control('width').value, enabled: control('enabled').checked,
      edge: controls('edge').map(x => x.checked), layout: controls('layout').map(x => x.checked) });
    const edit = () => { input('title', 'Paper kite'); input('notes', 'Fold firmly'); input('width', 8);
      input('enabled', true); input('edge', 2); input('layout', 2); };
    return { w, host, form, ctl, controls, control, input, snapshot, edit,
      close() { ctl.dispose(); w.close(); } };
  }
  const initial = { state: fixture.state, title: 'Paper crane', notes: 'Fold\ngently', width: '4', enabled: false,
    edge: [false, true, false], layout: [false, true, false] };
  {
    const s = setup();
    try {
      assert.equal(s.controls('edge')[0].disabled, true); assert.equal(s.controls('layout')[0].disabled, true);
      for (const reset of [() => s.form.reset(), () => s.form.querySelector('[type=reset]').click()]) {
        s.edit(); reset(); await settleReset(); assert.deepEqual(s.snapshot(), initial);
        assert.ok([...s.host.querySelectorAll('[aria-invalid]')].every(el => el.getAttribute('aria-invalid') === 'false'));
      }
      flows.push('Text, textarea, number, checkbox and choice fields restore together, including groups with a disabled first option');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      for (const capture of [false, true]) {
        s.input('width', 14); assert.equal(s.ctl.getState().width, 4);
        s.form.addEventListener('reset', e => e.preventDefault(), { capture, once: true });
        s.form.reset(); await settleReset(); assert.equal(s.control('width').value, '14');
        assert.equal(s.ctl.getState().width, 4);
      }
      s.form.reset(); await settleReset(); assert.equal(s.control('width').value, '4');
      assert.equal(s.control('width').getAttribute('aria-invalid'), 'false');
      s.input('width', 7); s.form.reset();
      s.w.setTimeout(() => s.input('width', 14), 0); await settleReset();
      assert.equal(s.control('width').value, '14'); assert.equal(s.ctl.getState().width, 7);
      s.control('width').disabled = true; s.form.reset(); await settleReset();
      assert.equal(s.control('width').value, '14'); assert.equal(s.ctl.getState().width, 7);
      flows.push('Canceled and disabled resets preserve invalid numeric drafts; accepted reset clears them; a newer draft keeps its accepted state');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit(); s.form.reset(); s.input('title', 'New paper bird');
      s.w.setTimeout(() => { s.input('edge', 2); s.ctl.setState({ notes: 'New supplied fold' }); }, 0);
      await settleReset();
      assert.deepEqual(s.snapshot(), { ...initial, state: { ...fixture.state, title: 'New paper bird', notes: 'New supplied fold', edge: 'square' },
        title: 'New paper bird', notes: 'New supplied fold', edge: [false, false, true] });
      flows.push('New text, supplied textarea state and same-value radio change survive a pending reset without blocking sibling fields');
    } finally { s.close(); }
  }
  {
    for (const retire of ['update', 'dispose']) {
      const s = setup();
      try {
        s.edit(); s.form.reset();
        if (retire === 'update') {
          const next = structuredClone(fixture); next.state.title = 'New generation model'; next.state.notes = 'New generation note';
          s.ctl.update(next); await settleReset();
          assert.equal(s.control('title').value, next.state.title); assert.equal(s.control('notes').value, next.state.notes);
          s.edit(); s.form.reset(); await settleReset(); assert.deepEqual(s.ctl.getState(), next.state);
        } else {
          s.ctl.dispose(); await settleReset(); assert.equal(s.host.children.length, 0);
        }
      } finally { s.close(); }
    }
    flows.push('Pending field resets retire on replacement and disposal, and replacement defaults stay authoritative');
  }
  {
    const s = setup();
    try {
      const number = s.control('width'), reset = s.form.querySelector('[type=reset]');
      const error = number.closest('.iui-field').querySelector('.iui-field-error');
      let resetEvents = 0; s.form.addEventListener('reset', () => resetEvents++);
      const pointer = type => {
        const event = new s.w.MouseEvent(type, { bubbles: true, button: 0 });
        Object.defineProperties(event, { pointerId: { value: 17 }, pointerType: { value: 'mouse' }, isPrimary: { value: true } });
        reset.dispatchEvent(event);
      };
      number.focus(); s.input('width', 14); assert.equal(error.hidden, true);
      pointer('pointerdown'); reset.focus();
      assert.equal(error.hidden, true, 'Host Reset pointer focus must not expose a layout-changing error before click');
      pointer('pointerup'); reset.click(); await settleReset();
      assert.equal(resetEvents, 1); assert.equal(number.value, '4'); assert.equal(error.hidden, true);
      number.focus(); s.input('width', 14); pointer('pointerdown'); reset.focus();
      assert.equal(error.hidden, true); pointer('pointercancel');
      assert.equal(error.hidden, false); assert.equal(resetEvents, 1);
      flows.push('Host Reset pointerdown and focus transfer defer error visibility until click; first dispatched click resets once, and pointercancel releases validation');
    } finally { s.close(); }
  }
  globalDOM.window.close();
  assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
  return { source: lock.source, publicCommit: lock.publicCommit, filesChecked: lock.files.length,
    passed: flows.length, failed: 0, flows, resourceRequests: requests, serviceCalls: services,
    nativeExecuted: false, compileExecuted: false, fullSuiteExecuted: false,
    boundary: 'Five independent JSDOM groups against the exact local browser global build. Pointer sequencing checks error visibility, not native geometry. No complete52 release, medical formula or service.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = n => { const i = process.argv.indexOf(n); return i < 0 ? undefined : process.argv[i + 1]; };
  if (!arg('--library')) throw Error('Pass --library for the exact partial read-point and --dependencies for existing jsdom');
  console.log(JSON.stringify(await verify(arg('--library'), arg('--dependencies')), null, 2));
}
