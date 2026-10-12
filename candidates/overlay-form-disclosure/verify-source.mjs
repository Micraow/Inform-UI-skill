import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const json = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export async function verify(library) {
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const fixture = await json('examples/original-paper-disclosures.json');
  async function identity() {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await readFile(path.join(root, f.path)); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256, f.path);
    }
  }
  await identity();
  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  let requests = 0, services = 0; const errors = [], flows = [];
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Original disclosure consumer has no resources'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { w.fetch = w.open = w.navigator.sendBeacon = () => { services++; throw Error('No external service'); }; } };
  };
  const carrier = new JSDOM('', { ...options(), runScripts: 'outside-only' });
  carrier.window.eval((await readFile(path.join(root, 'test-dist/iui.global.min.js'), 'utf8')) + '\n;globalThis.__consumer = IUI;');
  const raw = carrier.window.__consumer, into = d => carrier.window.JSON.parse(JSON.stringify(d));
  assert.equal(raw.validateDocument(into(fixture)).ok, true);
  assert.equal(raw.styles, await readFile(path.join(root, 'dist/style.css'), 'utf8'));
  function setup(doc = fixture, outer = false) {
    const dom = new JSDOM(outer ? '<details id="host"><summary>Host disclosure</summary><main></main></details>' : '<main></main>', options());
    const w = dom.window, host = w.document.querySelector('main');
    // Deliberate host API shims test resource ownership, not real top-layer geometry.
    const shown = new WeakSet(), frames = new Map(), observers = new Set(), cancelled = [];
    const proto = w.HTMLElement.prototype, originalMatches = proto.matches;
    proto.showPopover = function () { shown.add(this); };
    proto.hidePopover = function () { shown.delete(this); const e = new w.Event('toggle'); e.newState = 'closed'; this.dispatchEvent(e); };
    proto.matches = function (s) { return s === ':popover-open' ? shown.has(this) : originalMatches.call(this, s); };
    proto.getBoundingClientRect = function () { return { x: 20, y: 20, left: 20, top: 20, right: 220, bottom: 60, width: 200, height: 40 }; };
    proto.getClientRects = function () { return [this.getBoundingClientRect()]; };
    let next = 1;
    w.requestAnimationFrame = callback => { const id = next++; frames.set(id, callback); return id; };
    w.cancelAnimationFrame = id => { cancelled.push(id); frames.delete(id); };
    w.ResizeObserver = class { constructor() { observers.add(this); } observe() {} disconnect() { observers.delete(this); } };
    const controller = raw.mount(host, into(doc), { styles: false });
    const ctl = { update: d => controller.update(into(d)), setState: d => controller.setState(into(d)), dispose: () => controller.dispose() };
    const overlay = kind => host.querySelector('.iui-overlay-' + kind);
    const parts = kind => { const node = overlay(kind); return { node, trigger: node.querySelector('.iui-overlay-trigger'), surface: node.querySelector('.iui-overlay-surface'), close: node.querySelector('.iui-overlay-close') }; };
    const event = (target, name, props = {}) => { const e = new w.Event(name, { bubbles: true, cancelable: true }); Object.assign(e, props); target.dispatchEvent(e); };
    return { dom, w, host, ctl, frames, observers, cancelled, parts, event, close() { ctl.dispose(); w.close(); } };
  }
  try {
    {
      const h = setup();
      try {
        const initialObservers = h.observers.size;
        for (const kind of ['tooltip', 'popover']) {
          const p = h.parts(kind);
          if (kind === 'tooltip') p.trigger.focus(); else p.trigger.click();
          assert.equal(p.node.dataset.open, 'true'); assert.equal(p.surface.hidden, false);
          assert.ok(p.surface.textContent.includes(kind === 'tooltip' ? 'paper edges' : 'folded paper'));
          h.ctl.setState({ counter: 2 }); assert.ok(h.frames.size > 0);
          h.event(h.w.document, 'keydown', { key: 'Escape' });
          assert.equal(p.node.dataset.open, 'false'); assert.equal(p.surface.hidden, true);
          assert.equal(h.frames.size, 0); assert.equal(h.observers.size, initialObservers);
          p.trigger.click(); assert.equal(p.node.dataset.open, 'true');
          if (p.close) p.close.click(); else h.event(h.w.document, 'keydown', { key: 'Escape' });
          assert.equal(p.node.dataset.open, 'false');
        }
        flows.push('Both original overlay notes open, update in place, dismiss and reopen while releasing their session resources');
      } finally { h.close(); }
    }
    {
      for (const kind of ['tooltip', 'popover']) {
        const h = setup();
        try {
          const p = h.parts(kind); p.trigger.click();
          h.w.requestAnimationFrame = () => { h.ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'New original generation' }] }); return 929; };
          h.ctl.setState({ counter: 7 });
          assert.ok(h.cancelled.includes(929)); assert.equal(p.surface.isConnected, false);
          assert.equal(h.host.textContent, 'New original generation');
        } finally { h.close(); }
        const h2 = setup();
        try {
          let live = 0, observed = 0;
          h2.w.ResizeObserver = class { constructor() { live++; h2.ctl.dispose(); } observe() { observed++; } disconnect() { live--; } };
          h2.parts(kind).trigger.click(); assert.equal(live, 0); assert.equal(observed, 0); assert.equal(h2.host.children.length, 0);
        } finally { h2.close(); }
      }
      flows.push('Frames and observers returned after synchronous replacement or disposal are compensated for both overlay kinds');
    }
    {
      const h = setup(fixture, true);
      try {
        let submits = 0; h.host.addEventListener('iui:submit', () => submits++);
        h.host.querySelector('[type=submit]').click();
        const disclosures = [...h.host.querySelectorAll('details')]; assert.deepEqual(disclosures.map(x => x.open), [true, true, false]);
        const name = h.host.querySelector('[data-bind=paperName]');
        assert.equal(h.w.document.activeElement, name); assert.equal(h.w.document.querySelector('#host').open, false);
        assert.equal(h.host.querySelector('form').dataset.status, 'invalid'); assert.equal(submits, 0);
        h.ctl.setState({ paperName: 'Paper crane' });
        disclosures.forEach(d => { d.open = false; }); h.host.querySelector('[type=submit]').click(); await Promise.resolve();
        assert.deepEqual(disclosures.map(x => x.open), [false, false, false]); assert.equal(submits, 1);
        flows.push('Required local form input reveals only its owned disclosure ancestors and receives focus; valid local submission leaves sections and host ancestor closed');
      } finally { h.close(); }
    }
    {
      for (const retire of ['update', 'dispose']) {
        const h = setup();
        try {
          const d = h.host.querySelector('details'), input = h.host.querySelector('[data-bind=paperName]'); let staleFocus = 0;
          input.focus = () => { staleFocus++; };
          Object.defineProperty(d, 'open', { configurable: true, get: () => false, set() { retire === 'update' ? h.ctl.update({ version: 'iui/1', body: [{ type: 'text', value: 'Replacement paper note' }] }) : h.ctl.dispose(); } });
          h.host.querySelector('[type=submit]').click(); assert.equal(staleFocus, 0); assert.equal(input.isConnected, false);
          assert.equal(h.host.textContent, retire === 'update' ? 'Replacement paper note' : '');
        } finally { h.close(); }
      }
      flows.push('Opening a disclosure cannot focus a retired field after a synchronous host update or disposal');
    }
    assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
    return { source: lock.source, overlaySource: lock.overlaySource, publicCommit: lock.publicCommit, entry: 'test-dist/iui.global.min.js',
      filesChecked: 12, fixtureDocuments: 1, passed: flows.length, failed: 0, flows, resourceRequests: requests, serviceCalls: services,
      nativeExecuted: false, fullNewCDN: false, buildExecuted: false, fullSuiteExecuted: false,
      boundary: 'Actual source-build public mount in JSDOM; synthetic host popover/frame/observer APIs do not constitute native positioning or screenshots. Published fed5 assets remain separate.' };
  } finally { carrier.window.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the exact source build');
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
