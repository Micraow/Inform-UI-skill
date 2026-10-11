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
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 147); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/schema/iui.schema.json', 'src/renderer/async-image.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-async-images.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-144.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['AsyncImageNode', 'AsyncImageGroupNode', 'LottieNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  for (const n of input.body) assert.equal(index.nodeOwners[n.type], 'base');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json'))));
  for (const [, d] of cases.positives) assert.equal(base(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/async-image.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
  const button = (root, text) => [...root.querySelectorAll('button')].find(b => b.textContent === text);
  try {
    await flush(); let single = host.querySelector('.iui-async-image-single'), group = host.querySelector('.iui-async-image-group');
    assert.equal(single.dataset.phase, 'resolved'); assert.equal(group.dataset.phase, 'resolved'); assert.equal(group.dataset.layout, 'bento'); assert.equal(single.querySelectorAll('.iui-async-image-hit').length, 1); assert.equal(group.querySelectorAll('.iui-async-image-hit').length, 3); assert.equal(host.querySelectorAll('img').length, 4);
    checks.push('Finite inline collections render one single-card image and the three supplied bento tiles');
    let detail; const cancel = e => { detail = e.detail; e.preventDefault(); }; host.addEventListener('iui:image-open', cancel);
    group.querySelectorAll('.iui-async-image-hit')[2].click(); await flush(); assert.equal(host.querySelector('[role=dialog]'), null); assert.equal(detail.index, 2); assert.equal(detail.component, 'async-image-group'); assert.deepEqual(detail.images, input.body[1].images); assert.ok(Object.isFrozen(detail) && Object.isFrozen(detail.images) && detail.images.every(Object.isFrozen)); assert.ok(Object.isFrozen(detail.images[0].content_size)); host.removeEventListener('iui:image-open', cancel);
    checks.push('Canceled image-open intent carries a deeply frozen supplied collection and exact selected index');
    const trigger = single.querySelector('.iui-async-image-hit'); trigger.click(); await flush(); let viewer = single.querySelector('[role=dialog]'); assert.ok(viewer); assert.equal(viewer.dataset.implementation, 'local-basic'); assert.equal(viewer.getAttribute('aria-label'), 'Local image viewer'); assert.equal(viewer.querySelector('output').textContent, '1 / 2');
    const first = viewer.querySelector('img'); button(viewer, 'Next').click(); await flush(); assert.equal(viewer.querySelector('output').textContent, '2 / 2'); assert.equal(button(viewer, 'Next').disabled, true); assert.equal(first.hasAttribute('src'), false); assert.equal(viewer.querySelector('img').getAttribute('src'), input.body[0].images[1].content_url);
    button(viewer, 'Previous').click(); await flush(); assert.equal(viewer.querySelector('output').textContent, '1 / 2'); button(viewer, 'Close').click(); await flush(); assert.equal(single.querySelector('[role=dialog]'), null); assert.equal(dom.window.document.activeElement, trigger);
    checks.push('Explicit local-basic viewer has bounded next/previous navigation and retires replaced images on close');
    group.querySelectorAll('.iui-async-image-hit')[1].click(); await flush(); viewer = group.querySelector('[role=dialog]'); assert.ok(viewer); assert.equal(viewer.querySelector('output').textContent, '2 / 3'); const openBitmap = viewer.querySelector('img');
    controller.setState({ mediaStatus: 'pending' }); await flush(); assert.equal(host.querySelector('[role=dialog]'), null); assert.equal(openBitmap.hasAttribute('src'), false); assert.equal(single.dataset.phase, 'pending'); assert.equal(single.querySelector('.iui-async-image-hit').disabled, true);
    controller.setState({ mediaStatus: 'failed' }); await flush(); assert.equal(single.dataset.phase, 'failed'); assert.equal(group.dataset.phase, 'failed'); assert.equal(host.querySelector('img'), null); assert.match(host.textContent, /Supplied image group unavailable/);
    controller.setState({ mediaStatus: 'resolved' }); await flush(); assert.equal(group.dataset.phase, 'resolved'); assert.equal(host.querySelectorAll('img').length, 4);
    checks.push('Caller phase changes close stale viewers and distinguish pending, failed and restored supplied content');
    controller.update(cases.positives.find(([n]) => n === 'noninteractive and disabled reading')[1]); await flush(); assert.equal(host.querySelector('.iui-async-image-hit'), null); assert.equal(host.querySelectorAll('img').length, 4);
    controller.update(input); await flush(); let submits = 0; form.addEventListener('submit', e => { submits++; e.preventDefault(); }); group = host.querySelector('.iui-async-image-group'); group.querySelector('.iui-async-image-hit').click(); await flush(); assert.equal(submits, 0); assert.deepEqual([...new dom.window.FormData(form)], []);
    checks.push('Noninteractive reading keeps pictures without hit controls and local viewer buttons do not submit the parent form');
    const before = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'unsupported status value')[1])); assert.equal(host.innerHTML, before);
    const oldImages = [...host.querySelectorAll('img')], oldHit = group.querySelector('.iui-async-image-hit'); controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'New supplied content' }] }); await flush(); assert.ok(oldImages.every(i => !i.hasAttribute('src'))); oldHit.click(); await flush(); assert.equal(host.querySelector('[role=dialog]'), null); assert.match(host.textContent, /New supplied content/);
    checks.push('Invalid phase updates are atomic; replacement retires both viewer and base images');
    assert.deepEqual(errors, []); assert.equal(requests, 0);
  } finally { controller.dispose(); dom.window.close(); }
  const detachedDom = new JSDOM('<aside></aside>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc }), detachedHost = detachedDom.window.document.createElement('main'), detached = browser.mount(detachedHost, input, { styles: false });
  try { await flush(); assert.equal(detachedHost.querySelector('img'), null); detachedDom.window.document.body.append(detachedHost); await flush(); assert.equal(detachedHost.querySelectorAll('img').length, 4); const images = [...detachedHost.querySelectorAll('img')]; detachedDom.window.document.querySelector('aside').append(detachedHost); detachedDom.window.document.body.append(detachedHost); detached.setState({ mediaStatus: 'resolved' }); await flush(); assert.ok(images.every(i => !i.hasAttribute('src'))); checks.push('Shared first connection starts deferred pictures and observed owner loss permanently retires them'); } finally { detached.dispose(); detachedDom.window.close(); }
  const artifact = await node.compileArtifact(input); assert.deepEqual(artifact, await node.compileArtifact(input)); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); } finally { page.window.close(); }
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 147, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, mediaDecodedOrPlayed: false, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
