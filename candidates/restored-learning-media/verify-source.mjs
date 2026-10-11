import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases } from './cases.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
export async function verify(library) {
  const root = await realpath(library), lock = await local('source-build-lock.safe.json');
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 136); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/compiler.ts', 'src/schema/iui.schema.json', 'src/renderer/learning-media.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-learning-media.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-133.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['LearningImageChoiceCardNode', 'LearningImageLabelCardNode', 'LearningAudioLabelCardNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  for (const n of input.body) assert.equal(index.nodeOwners[n.type], 'learning');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const learning = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/learning.schema.json'))));
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json'))));
  for (const [, d] of cases.positives) assert.equal(learning(d), true); assert.equal(base(input), false);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/learning-media.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  const action = (r, name) => r.querySelector('[data-practice-action="' + name + '"]');
  const change = (c, v) => { c.value = v; c.dispatchEvent(new dom.window.Event('input')); };
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  try {
    const roots = [...host.querySelectorAll('.iui-learning-media')]; assert.equal(roots.length, 3); const [choice, label, audio] = roots;
    action(choice, 'check').click(); assert.equal(choice.dataset.phase, 'missing');
    choice.querySelector('[data-option-id=orange]').click(); action(choice, 'check').click(); assert.equal(choice.dataset.phase, 'incorrect');
    choice.querySelector('[data-option-id=blue]').click(); action(choice, 'check').click(); assert.equal(choice.dataset.phase, 'correct');
    action(choice, 'retry').click(); assert.equal(choice.dataset.phase, 'editing'); assert.ok([...choice.querySelectorAll('input')].every(c => !c.checked));
    checks.push('Choice practice distinguishes missing, incorrect, correct and retry');
    const answer = label.querySelector('input'); change(answer, 'Blue'); action(label, 'check').click(); assert.equal(label.dataset.phase, 'incorrect');
    change(answer, ' blue '); action(label, 'check').click(); assert.equal(label.dataset.phase, 'correct');
    action(label, 'reveal').click(); assert.equal(label.dataset.phase, 'reference'); assert.match(label.querySelector('[role=status]').textContent, /blue/);
    checks.push('Label matching is trimmed and case-sensitive, with a local reference answer');
    const player = audio.querySelector('audio'); assert.ok(player); assert.equal(player.controls, true); assert.equal(player.preload, 'none'); assert.equal(player.autoplay, false);
    assert.match(audio.querySelector('details').textContent, /No speech/); change(audio.querySelector('input'), 'beep'); action(audio, 'check').click(); assert.equal(audio.dataset.phase, 'correct');
    checks.push('Supplied audio has controls and transcript, without autoplay or preload; accepted alternate answer works');
    form.addEventListener('reset', e => e.preventDefault(), { once: true }); form.reset(); await flush(); assert.equal(audio.dataset.phase, 'correct');
    form.reset(); await flush(); assert.ok(roots.every(r => r.dataset.phase === 'editing')); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Native form reset honors cancellation and unnamed practice inputs do not submit answers');
    controller.update(cases.positives.find(([n]) => n === 'explicit disabled practice')[1]);
    for (const r of host.querySelectorAll('.iui-learning-media')) { assert.equal(r.disabled, true); action(r, 'reveal').click(); assert.equal(r.dataset.phase, 'editing'); }
    assert.equal(host.querySelector('audio').controls, true); const transcript = host.querySelector('details'); transcript.open = true; assert.equal(transcript.open, true);
    checks.push('Disabled practice leaves ordinary supplied audio and transcript reading controls separate');
    const external = cases.positives.find(([n]) => n === 'explicit external media URLs')[1]; controller.update(external);
    assert.equal(host.querySelector('audio'), null); assert.equal(host.querySelector('[src^="https:"]'), null);
    assert.ok(host.querySelector('[data-practice-action=load-image]')); assert.ok(host.querySelector('[data-practice-action=load-audio]'));
    const disabledExternal = structuredClone(external); disabledExternal.body.forEach(n => { n.disabled = true; }); controller.update(disabledExternal);
    for (const b of host.querySelectorAll('[data-practice-action^="load-"]')) b.click(); assert.equal(host.querySelector('[src^="https:"]'), null);
    checks.push('External media starts unrequested and disabled cards cannot activate it');
    controller.update(input); const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives[1][1])); assert.equal(host.innerHTML, before);
    controller.update(cases.positives.find(([n]) => n === 'literal labels and transcripts')[1]); assert.equal(host.querySelector('script,svg,iframe'), null); assert.match(host.textContent, /<script>literal title<\/script>/);
    controller.dispose(); const after = host.innerHTML; change(answer, 'obsolete'); assert.equal(host.innerHTML, after);
    checks.push('Invalid updates are atomic, supplied copy stays literal and disposed controls are retired');
    assert.deepEqual(errors, []); assert.equal(requests, 0);
  } finally { controller.dispose(); dom.window.close(); }
  const policies = [], parse = html => new JSDOM(html);
  for (const [name, d, expected] of [['inline', input, ['data:']], ['external', cases.positives.find(([n]) => n === 'explicit external media URLs')[1], ['https://example.org']], ['no audio', { ...input, body: input.body.slice(0, 2) }, null]]) {
    for (const assets of ['inline', 'shared']) {
      const artifact = await node.compileArtifact(d, { assets }); assert.deepEqual(artifact, await node.compileArtifact(d, { assets }));
      const page = parse(artifact.html); try {
        const policy = page.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
        const directives = Object.fromEntries(policy.split(';').map(s => s.trim().split(/\s+/)).filter(([n]) => n).map(([n, ...v]) => [n, v]));
        assert.deepEqual(directives['media-src'] ?? null, expected); assert.deepEqual(directives['connect-src'], ["'none'"]); assert.deepEqual(directives['default-src'], ["'none'"]);
        if (assets === 'inline') assert.equal(page.window.document.querySelector('style').textContent, css);
        else assert.ok(Object.values(artifact.assets).includes(css));
        policies.push({ name, assets, mediaSources: expected, bytes: Buffer.byteLength(artifact.html) });
      } finally { page.window.close(); }
    }
  }
  checks.push('Six actual compiler artifacts preserve exact audio CSP origins and the same closed family stylesheet');
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, implementationCommit: lock.implementationCommit, sourceTree: lock.sourceTree, protocolNodes: 136, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, compiledArtifacts: policies, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, mediaDecodedOrPlayed: false, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
