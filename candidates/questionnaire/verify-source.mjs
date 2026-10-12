import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { cases } from './cases.mjs';
const json = async name => JSON.parse(await readFile(new URL(name, import.meta.url)));
const hash = b => createHash('sha256').update(b).digest('hex');
const settle = async () => { for (let i = 0; i < 4; i++) await new Promise(r => setTimeout(r, 0)); };
function frozen(value) {
  if (value && typeof value === 'object') { assert.ok(Object.isFrozen(value)); for (const child of Object.values(value)) frozen(child); }
}

export async function verify(library) {
  const root = await realpath(library), lock = await json('runtime-lock.safe.json');
  const fixture = await json('examples/event-packing.json'), vectors = await json('answer-vectors.json');
  const identity = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const b = await readFile(path.join(root, f.path)); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  await identity();
  const api = await import(pathToFileURL(path.join(root, 'dist/index.js'))), docs = cases(fixture), node = fixture.body[0];
  for (const [name, d] of docs.positives) assert.equal(api.validateDocument(d).ok, true, name);
  for (const [name, d] of docs.negatives) assert.equal(api.validateDocument(d).ok, false, name);
  let arithmeticChecks = 0;
  for (const v of vectors.cases) {
    const raw = structuredClone(v.answers), before = JSON.stringify(raw), result = api.evaluateQuestionnaire(node, raw), s = result.snapshot;
    assert.equal(JSON.stringify(raw), before, v.id); frozen(result);
    assert.equal(s.status, v.expected.status, v.id); assert.deepEqual(s.computed, v.expected.computed, v.id);
    assert.equal(s.questionnaireId, node.questionnaireId); assert.equal(s.version, node.version); assert.deepEqual(s.sources, node.sources);
    for (const [id, status] of Object.entries(v.expected.validity ?? {})) assert.equal(s.validity[id].status, status, v.id);
    for (const [id, state] of Object.entries(s.validity)) {
      if (!state.visible) assert.equal(Object.hasOwn(s.answers, id), false, v.id);
      else if (state.status !== 'valid') assert.equal(s.answers[id], null, v.id);
    }
    arithmeticChecks++;
  }
  const valid = { ...node.initialAnswers, participants: 2, seats: '8x' };
  const retained = api.evaluateQuestionnaire(node, valid); assert.equal(retained.draft.seats, '8x'); arithmeticChecks++;
  const cleared = api.evaluateQuestionnaire({ ...node, hiddenValuePolicy: 'clear' }, valid); assert.equal(Object.hasOwn(cleared.draft, 'seats'), false); arithmeticChecks++;
  const optional = structuredClone(node); optional.fields.push({ id: 'note', label: 'Optional note', type: 'text' }); optional.computed.noteKnown = { op: 'if', args: [{ op: 'eq', args: [{ $: 'note' }, null] }, false, true] };
  const o = api.evaluateQuestionnaire(optional, valid).snapshot; assert.equal(o.status, 'ready'); assert.equal(o.answers.note, null); assert.equal(o.computed.noteKnown, false); arithmeticChecks++;
  const unsafeMath = structuredClone(node); unsafeMath.computed.totalPackets = { op: 'div', args: [{ $: 'participants' }, { $: 'packsEach' }] };
  const failedMath = api.evaluateQuestionnaire(unsafeMath, { ...valid, packsEach: 0 }).snapshot; assert.equal(failedMath.status, 'invalid'); assert.deepEqual(failedMath.computed, {}); arithmeticChecks++;
  const chained = structuredClone(node); chained.computed.doublePackets = { op: 'mul', args: [{ $: 'totalPackets' }, 2] }; assert.equal(api.evaluateQuestionnaire(chained, valid).snapshot.computed.doublePackets, 12); arithmeticChecks++;
  const resetNode = { ...node, defaults: { ...node.initialAnswers, participants: 4 } }; assert.equal(api.createQuestionnaireDraft(resetNode).participants, null); assert.equal(api.createQuestionnaireDraft(resetNode, true).participants, 4); arithmeticChecks++;
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json')));
  assert.equal(schema.$defs.Node.oneOf.length, lock.protocolNodes);
  assert.equal(api.styles, await readFile(path.join(root, 'dist/style.css'), 'utf8')); assert.ok(api.styles.includes('.iui-questionnaire'));

  const { JSDOM, ResourceLoader, VirtualConsole } = createRequire(path.join(root, 'package.json'))('jsdom');
  let requests = 0, services = 0; const errors = [], flows = [];
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('No remote resource belongs to this synthetic questionnaire'); } }
  const options = () => {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
    return { url: 'https://consumer.example/', resources: new Reject(), virtualConsole: vc,
      beforeParse(w) { const block = () => { services++; throw Error('No external service'); }; w.fetch = w.open = w.navigator.sendBeacon = block; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: block } }); } };
  };
  const docWith = patch => ({ version: 'iui/1', body: [{ ...structuredClone(node), ...patch }] });
  function setup(doc = fixture, actions = {}) {
    const dom = new JSDOM('<form><main></main></form>', options()), w = dom.window, host = w.document.querySelector('main'), form = host.parentElement;
    const ctl = api.mount(host, structuredClone(doc), { styles: false, questionnaireActions: actions });
    const q = s => host.querySelector(s), card = () => q('.iui-questionnaire'), field = id => q('[data-field="' + id + '"]'), action = id => q('[data-action="' + id + '"]'), output = key => q('[data-result="' + key + '"]');
    const edit = (id, value) => { const el = field(id); assert.ok(el, id); el.value = value === null ? '' : String(value); el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    const details = []; host.addEventListener('iui:questionnaire', e => { assert.equal(e.cancelable, true); assert.equal(e.composed, false); frozen(e.detail); details.push(e.detail); });
    const cancel = () => host.addEventListener('iui:questionnaire', e => e.preventDefault(), { once: true });
    return { w, host, form, ctl, q, card, field, action, output, edit, details, cancel, close() { ctl.dispose(); w.close(); } };
  }
  {
    const s = setup();
    try {
      assert.equal(s.card().dataset.status, 'incomplete'); assert.equal(s.output('totalPackets'), null); assert.equal(s.field('borrowed').value, 'false');
      s.edit('participants', 2); assert.equal(s.output('totalPackets').textContent, '6');
      s.edit('participants', 'two'); assert.equal(s.card().dataset.status, 'invalid'); assert.equal(s.output('totalPackets'), null); assert.equal(s.field('participants').value, 'two');
      const before = s.details.length; s.action('submit').click(); assert.equal(s.details.length, before);
      s.edit('participants', ''); assert.equal(s.card().dataset.status, 'incomplete'); assert.equal(s.output('totalPackets'), null);
      s.edit('participants', 2); s.edit('packsEach', 0); assert.equal(s.output('totalPackets').textContent, '0');
      s.edit('mode', 'travel'); assert.equal(s.card().dataset.status, 'incomplete'); assert.equal(s.output('totalPackets'), null);
      s.edit('seats', 1); assert.equal(s.card().dataset.status, 'invalid'); assert.match(s.host.textContent, /不能少于/);
      s.edit('seats', 8); assert.equal(s.output('spareSeats').textContent, '6'); s.edit('participants', null); assert.equal(s.card().dataset.status, 'incomplete'); assert.equal(s.output('spareSeats'), null);
      flows.push('Unknown, invalid draft and pending cross-field validation remove stale results; explicit false and zero remain valid answers');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit('participants', 2); s.edit('mode', 'travel'); s.edit('seats', 8); s.field('seats').focus();
      s.edit('mode', 'onsite'); assert.equal(s.field('seats').closest('.iui-questionnaire-field').hidden, true); assert.equal(s.w.document.activeElement, s.action('reset'));
      s.cancel(); s.action('submit').click(); const first = s.details.at(-1).snapshot;
      assert.equal(Object.hasOwn(first.answers, 'seats'), false); assert.equal(first.validity.seats.status, 'hidden'); assert.deepEqual(first.computed, { totalPackets: 6, spareSeats: null });
      s.edit('mode', 'travel'); assert.equal(s.field('seats').value, '8'); s.edit('seats', '8x'); s.edit('mode', 'onsite'); assert.equal(s.output('totalPackets').textContent, '6');
      s.edit('mode', 'travel'); assert.equal(s.field('seats').value, '8x'); assert.equal(s.card().dataset.status, 'invalid'); assert.equal(s.output('totalPackets'), null);
      s.ctl.update(docWith({ hiddenValuePolicy: 'clear' })); s.edit('participants', 2); s.edit('mode', 'travel'); s.edit('seats', 8); s.edit('mode', 'onsite'); s.edit('mode', 'travel');
      assert.equal(s.field('seats').value, ''); assert.equal(s.card().dataset.status, 'incomplete');
      flows.push('Retain and clear hidden policies differ explicitly; hidden raw drafts are excluded from snapshots and calculations, reactivation revalidates, and hidden focus returns to visible Reset');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit('participants', 2); s.edit('mode', 'travel'); s.edit('seats', 8); s.cancel(); s.action('submit').click();
      const canceled = s.details.at(-1); assert.equal(canceled.intent, 'submit'); assert.equal(canceled.snapshot.answers.participants, 2); assert.equal(canceled.snapshot.answers.borrowed, false); assert.deepEqual(canceled.snapshot.sources, node.sources); assert.equal(canceled.snapshot.version, node.version); assert.doesNotMatch(s.q('.iui-questionnaire-status').textContent, /accepted/i);
      s.host.addEventListener('iui:questionnaire', () => s.edit('participants', 3), { once: true }); s.action('submit').click();
      assert.equal(s.details.at(-1).snapshot.answers.participants, 2); assert.equal(s.output('totalPackets').textContent, '9'); assert.equal(s.output('spareSeats').textContent, '5'); assert.doesNotMatch(s.q('.iui-questionnaire-status').textContent, /accepted/i);
      s.action('submit').click(); assert.match(s.q('.iui-questionnaire-status').textContent, /accepted locally/); assert.equal(canceled.snapshot.computed.totalPackets, 6);
      flows.push('Canceled local submit has no success; immutable answers, results, version and sources belong to one revision, and listener edits prevent stale acceptance');
    } finally { s.close(); }
  }
  {
    const s = setup();
    try {
      s.edit('participants', 2); s.edit('mode', 'travel'); s.edit('seats', 8); const field = s.field('seats'); field.focus(); s.cancel(); s.action('reset').click(); assert.equal(s.w.document.activeElement, field); assert.equal(s.output('spareSeats').textContent, '6');
      s.host.addEventListener('iui:questionnaire', () => s.edit('participants', 3), { once: true }); s.action('reset').click(); assert.equal(s.field('participants').value, '3');
      s.form.addEventListener('reset', e => e.preventDefault(), { once: true }); s.form.reset(); await settle(); assert.equal(s.field('participants').value, '3');
      s.form.reset(); s.edit('participants', 4); await settle(); assert.equal(s.field('participants').value, '4'); assert.equal(s.output('totalPackets').textContent, '12');
      s.field('seats').focus(); s.form.reset(); await settle(); assert.equal(s.field('participants').value, ''); assert.equal(s.card().dataset.status, 'incomplete'); assert.equal(s.w.document.activeElement, s.action('reset'));
      flows.push('Local and host form reset preserve cancellation and newer inputs; accepted reset restores unknown defaults and transfers focus out of a hidden branch');
    } finally { s.close(); }
  }
  {
    const s = setup(docWith({ fields: [{ id: 'nickname', label: 'Optional project nickname', type: 'text' }, ...structuredClone(node.fields)] }));
    try {
      s.action('submit').click(); assert.equal(s.w.document.activeElement, s.field('participants')); assert.equal(s.details.length, 0);
      s.edit('participants', 2); s.action('submit').click(); assert.equal(s.details.at(-1).snapshot.answers.nickname, null); assert.equal(s.details.at(-1).snapshot.status, 'ready');
      flows.push('A missing required answer receives submit focus ahead of an optional unknown field; the optional null answer does not block otherwise complete results');
    } finally { s.close(); }
  }
  {
    const pending = [], contexts = [];
    const s = setup(docWith({ action: 'reviewPacking' }), { reviewPacking(ctx) { frozen(ctx.snapshot); contexts.push(ctx); return new Promise((resolve, reject) => pending.push({ resolve, reject })); } });
    try {
      s.edit('participants', 2); s.cancel(); s.action('submit').click(); assert.equal(contexts.length, 0);
      s.action('submit').click(); s.action('submit').click(); assert.equal(contexts.length, 1); assert.equal(s.card().getAttribute('aria-busy'), 'true');
      s.edit('participants', 3); assert.equal(contexts[0].signal.aborted, true); pending[0].resolve(); await settle(); assert.equal(s.output('totalPackets').textContent, '9'); assert.doesNotMatch(s.q('.iui-questionnaire-status').textContent, /accepted/i);
      s.action('submit').click(); assert.equal(contexts.length, 2); s.ctl.update(docWith({ title: 'Revised packing definition', version: '1.0.1' })); assert.equal(contexts[1].signal.aborted, true); pending[1].resolve(); await settle(); assert.equal(s.card().dataset.status, 'incomplete');
      s.ctl.update(docWith({ action: 'reviewPacking' })); s.edit('participants', 2); s.action('submit').click(); s.ctl.dispose(); assert.equal(contexts[2].signal.aborted, true); pending[2].reject(Error('Synthetic late failure')); await settle(); assert.equal(s.host.children.length, 0);
      flows.push('Named local asynchronous adapters receive an immutable snapshot and abort signal; canceled or duplicate submissions do not call them, and editing/update/dispose aborts stale completion');
    } finally { s.close(); }
  }
  const html = await api.compileHtml(fixture), page = new JSDOM(html, { ...options(), runScripts: 'dangerously' });
  try {
    const host = page.window.document.querySelector('.iui-questionnaire'), field = host.querySelector('[data-field=participants]'); assert.equal(host.dataset.status, 'incomplete');
    field.value = '2'; field.dispatchEvent(new page.window.Event('input', { bubbles: true })); assert.equal(host.querySelector('[data-result=totalPackets]').textContent, '6');
    let captured; host.addEventListener('iui:questionnaire', e => { captured = e.detail; e.preventDefault(); }); host.querySelector('[data-action=submit]').click(); frozen(captured); assert.equal(captured.snapshot.computed.totalPackets, 6); assert.doesNotMatch(host.querySelector('.iui-questionnaire-status').textContent, /accepted/i);
    flows.push('Actual offline compiled standalone executes the same declarative questionnaire and a cancelable frozen result snapshot');
  } finally { page.window.close(); }
  assert.deepEqual(errors, []); assert.equal(requests, 0); assert.equal(services, 0); await identity();
  return { source: lock.source, publicCommit: lock.publicCommit, protocolNodes: lock.protocolNodes, canonicalScopeAtFreeze: lock.canonicalScopeAtFreeze,
    arithmeticChecks, originalJsonVectors: vectors.cases.length, positiveDocuments: docs.positives.length, negativeDocuments: docs.negatives.length,
    passed: flows.length, failed: 0, flows, filesChecked: lock.files.length,
    standalone: { executed: true, bytes: Buffer.byteLength(html), sha256: hash(html) }, resourceRequests: requests, serviceCalls: services,
    nativeExecutedByConsumer: false, fullNewCDN: false,
    boundary: 'Original synthetic nonmedical packing questionnaire; JSON only, bounded expressions and explicit local adapters. Historical component inventory is unchanged.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--library'); if (i < 0) throw Error('Pass --library for the exact source-build read-point');
  console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2));
}
