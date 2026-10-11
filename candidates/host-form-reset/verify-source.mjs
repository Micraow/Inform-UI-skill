import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const json = async name => JSON.parse(await readFile(new URL(name, import.meta.url)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const settleReset = async () => {
  // The host's default action must finish before reconciliation and atomic commit.
  for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0));
};

export async function verify(library, dependencies = library) {
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const fixture = await json('examples/original-host-preferences.json');
  const identity = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const bytes = await readFile(path.join(root, f.path));
      assert.equal(bytes.length, f.bytes, f.path);
      assert.equal(hash(bytes), f.sha256, f.path);
    }
  };
  await identity();
  const api = await import(pathToFileURL(path.join(root, 'dist/browser.js')));
  assert.equal(api.validateDocument(fixture).ok, true);
  const require = createRequire(path.join(await realpath(dependencies), 'package.json'));
  const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  let resourceRequests = 0, serviceCalls = 0;
  const errors = [], flows = [];
  class Reject extends ResourceLoader {
    fetch() { resourceRequests++; throw Error('This original preferences consumer has no resources'); }
  }
  function setup(doc = fixture) {
    const console = new VirtualConsole(); console.on('jsdomError', e => errors.push(e.message));
    const dom = new JSDOM('<!doctype html><form><main></main><button type="reset">Reset original preferences</button></form>', {
      url: 'https://consumer.example/', resources: new Reject(), virtualConsole: console,
      beforeParse(w) {
        w.fetch = w.open = w.navigator.sendBeacon = () => { serviceCalls++; throw Error('No service permitted'); };
      }
    });
    const w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(doc), { styles: false });
    const control = key => host.querySelector('[data-bind="' + key + '"]');
    function input(key, value) {
      const el = control(key);
      if (el.type === 'checkbox') el.checked = value; else el.value = String(value);
      el.dispatchEvent(new w.Event(el.type === 'range' ? 'input' : 'change', { bubbles: true }));
    }
    function snapshot() {
      return { state: ctl.getState(), size: control('paperSize').value, output: host.querySelector('output').value,
        border: control('showBorder').checked, color: control('paperColor').value };
    }
    const edit = () => { input('paperSize', 8); input('showBorder', true); input('paperColor', 0); };
    return { w, host, form, ctl, control, input, snapshot, edit,
      close() { ctl.dispose(); dom.window.close(); } };
  }
  const initial = { state: fixture.state, size: '3', output: '3', border: false, color: '1' };

  {
    const s = setup();
    try {
      for (const action of [() => s.form.reset(), () => s.form.querySelector('[type=reset]').click()]) {
        s.edit(); assert.deepEqual(s.ctl.getState(), { paperSize: 8, showBorder: true, paperColor: 'blue' });
        action(); await settleReset(); assert.deepEqual(s.snapshot(), initial);
      }
      flows.push('External form.reset and its reset button restore all three controlled state and DOM values');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      for (const capture of [true, false]) {
        s.edit(); const before = s.snapshot();
        s.form.addEventListener('reset', e => e.preventDefault(), { once: true, capture });
        s.form.reset(); await settleReset(); assert.deepEqual(s.snapshot(), before);
      }
      for (const write of [() => s.input('paperSize', 6), () => s.ctl.setState({ paperSize: 6 })]) {
        s.edit(); s.form.reset(); write(); await settleReset();
        assert.deepEqual(s.snapshot(), { ...initial, state: { ...fixture.state, paperSize: 6 }, size: '6', output: '6' });
      }
      s.edit(); s.form.addEventListener('reset', () => s.input('paperSize', 8), { once: true });
      s.form.reset(); await settleReset();
      assert.deepEqual(s.snapshot(), { ...initial, state: { ...fixture.state, paperSize: 8 }, size: '8', output: '8' });
      flows.push('Capture and bubble cancellation preserve edits; later input, state and same-value input win their binding while siblings reset');
    } finally { s.close(); }
  }
  {
    const doc = { version: 'iui/1', state: { a: 3, b: 7 },
      computed: { reciprocal: { op: 'div', args: [1, { op: 'sub', args: [{ $: 'a' }, { $: 'b' }] }] } },
      body: [
        { ...fixture.body[0], label: 'Original first marker', bind: 'a' },
        { ...fixture.body[0], label: 'Original second marker', bind: 'b' },
        { type: 'metric', label: 'Original reciprocal', value: { $: 'reciprocal' } }
      ] };
    assert.equal(api.validateDocument(doc).ok, true);
    const s = setup(doc);
    try {
      assert.ok(s.host.textContent.includes('-0.25'));
      s.ctl.setState({ a: 7, b: 3 }); assert.ok(s.host.textContent.includes('0.25'));
      s.form.reset(); await settleReset();
      assert.deepEqual(s.ctl.getState(), { a: 3, b: 7 });
      assert.equal(s.control('a').value, '3'); assert.equal(s.control('b').value, '7');
      assert.ok(s.host.textContent.includes('-0.25'));
      assert.ok([...s.host.querySelectorAll('[role=alert]')].every(el => el.textContent.trim() === ''));
      flows.push('Sibling bindings reset atomically before a reciprocal expression that would otherwise divide by zero');
    } finally { s.close(); }
  }
  {
    for (const retire of ['update', 'dispose']) {
      const s = setup();
      try {
        s.edit(); s.form.reset();
        if (retire === 'update') {
          s.ctl.update({ ...structuredClone(fixture), state: { paperSize: 4, showBorder: true, paperColor: 'blue' } });
          await settleReset();
          assert.deepEqual(s.snapshot(), { state: { paperSize: 4, showBorder: true, paperColor: 'blue' }, size: '4', output: '4', border: true, color: '0' });
          s.edit(); s.form.reset(); await settleReset(); assert.equal(s.snapshot().size, '4');
        } else {
          s.ctl.dispose(); await settleReset(); assert.equal(s.host.children.length, 0);
          s.form.reset(); await settleReset(); assert.equal(s.host.children.length, 0);
        }
      } finally { s.close(); }
    }
    flows.push('Pending old resets retire on update and dispose; a new generation uses its own supplied initial values');
  }
  assert.deepEqual(errors, []); assert.equal(resourceRequests, 0); assert.equal(serviceCalls, 0);
  await identity();
  return { source: lock.source, publicCommit: lock.publicCommit, filesChecked: lock.files.length,
    controls: lock.coveredControls, fixtureDocumentsValidated: 2, passed: flows.length, failed: 0, flows,
    resourceRequests, serviceCalls, nativeExecuted: false, fullSuiteExecuted: false,
    boundary: 'Four independent JSDOM consumer flows against exact source-built browser bytes. No Input, Textarea, Radio or full CDN package claim.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
  const library = arg('--library');
  if (!library) throw Error('Pass --library for the frozen partial read-point and --dependencies for an existing jsdom installation');
  console.log(JSON.stringify(await verify(library, arg('--dependencies')), null, 2));
}
