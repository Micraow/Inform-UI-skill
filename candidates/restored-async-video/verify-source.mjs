import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases } from './cases.mjs';
import { attachVideoReceipt } from './consumer.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
export async function verify(library) {
  const root = await realpath(library), lock = await local('source-build-lock.safe.json');
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 149); assert.equal(lock.cdnExecuted, false);
  const checkFiles = async () => { const names = new Set(); for (const f of lock.files) {
    assert.ok(!names.has(f.path) && !path.isAbsolute(f.path) && !f.path.split('/').includes('..')); names.add(f.path);
    const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep)); const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
  } }; await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-videos.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-148.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => x.$ref !== '#/$defs/AsyncVideoCarouselNode'), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json'))); assert.equal(index.nodeOwners['async-video-carousel'], 'base');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json')))); for (const [, d] of cases.positives) assert.equal(base(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'), family = await readFile(path.join(root, 'src/renderer/async-video.css'), 'utf8'); for (const api of [node, browser]) { assert.equal(api.styles, css); assert.ok(api.styles.includes(family)); }
  let deniedRequests = 0, navigations = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { deniedRequests++; return null; } }
  // External scripts are not executed. This checks local DOM and fixed resource contracts, not the provider SDK or playback.
  const makeDOM = html => { const dom = new JSDOM(html, { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc }); dom.window.open = () => { navigations++; return null; }; return dom; };
  const dom = makeDOM('<form><main></main></form><output></output>'), host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), output = dom.window.document.querySelector('output'), off = attachVideoReceipt(host, output), controller = browser.mount(host, input, { styles: false });
  const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); }, railRoot = () => host.querySelector('.iui-async-video');
  try {
    await tick(); assert.equal(railRoot().dataset.layout, 'rail'); assert.equal(host.querySelectorAll('.iui-async-video-card').length, 2); assert.equal(host.querySelectorAll('.iui-async-video-open').length, 2); assert.equal(host.querySelector('.iui-video-preview-thumbnail img').getAttribute('src'), 'https://img.youtube.com/vi/AbCdEf012_-/maxresdefault.jpg'); assert.equal(dom.window.document.querySelector('script[src]').src, 'https://www.youtube.com/iframe_api'); assert.equal(host.querySelector('iframe'), null);
    checks.push('Finite two-provider rail creates the fixed thumbnail/SDK URL contracts without executing an external SDK');
    let detail, submits = 0; const observe = event => { detail = event.detail; }; host.addEventListener('iui:video-open', observe); form.addEventListener('submit', event => { submits++; event.preventDefault(); }); host.querySelectorAll('.iui-async-video-open')[1].click(); await tick(); assert.equal(detail.index, 1); assert.equal(detail.component, 'async-video-carousel'); assert.deepEqual(detail.video, input.body[0].items[1]); assert.deepEqual(detail.videos, input.body[0].items); assert.ok(Object.isFrozen(detail) && Object.isFrozen(detail.videos) && detail.videos.every(Object.isFrozen)); assert.match(output.textContent, /Supplied record 2 of 2/); assert.equal(submits, 0); assert.equal(navigations, 0); host.removeEventListener('iui:video-open', observe);
    checks.push('Original host cancels the deeply frozen video-open intent, writes its local receipt and prevents provider navigation/form submission');
    const oldButton = host.querySelector('.iui-async-video-open'), oldImage = host.querySelector('img'); controller.setState({ videoStatus: 'failed' }); await tick(); assert.match(host.textContent, /Supplied video records are unavailable/); assert.equal(oldImage.hasAttribute('src'), false); assert.equal(dom.window.document.querySelector('script[src]'), null); const oldReceipt = output.textContent; oldButton.click(); await tick(); assert.equal(output.textContent, oldReceipt);
    controller.update(cases.positives.find(([n]) => n === 'omitted items with default pending')[1]); await tick(); assert.equal(railRoot().dataset.layout, 'pending'); assert.equal(railRoot().getAttribute('role'), 'status');
    controller.update(cases.positives.find(([n]) => n === 'explicit pending empty collection')[1]); await tick(); assert.equal(railRoot().dataset.layout, 'skeletons'); assert.equal(host.querySelectorAll('.iui-async-video-skeleton').length, 4);
    controller.update(cases.positives.find(([n]) => n === 'resolved empty collection')[1]); await tick(); assert.equal(railRoot().hidden, true);
    checks.push('Failed, missing pending, explicit pending-empty and resolved-empty phases stay distinct and retire old provider resources');
    controller.update(cases.positives.find(([n]) => n === 'disabled no-hover reading')[1]); await tick(); assert.ok([...host.querySelectorAll('.iui-async-video-open')].every(b => b.disabled)); host.querySelector('.iui-async-video-open').click(); await tick(); assert.equal(output.textContent, oldReceipt); assert.equal(navigations, 0);
    checks.push('Explicitly disabled video reading blocks its ordinary intent without creating a navigation');
    controller.update(input); await tick(); const rail = host.querySelector('.iui-async-video-rail'); Object.defineProperties(rail, { scrollWidth: { value: 900 }, clientWidth: { value: 300 } }); rail.dispatchEvent(new dom.window.Event('scroll')); assert.equal(host.querySelector('.iui-async-video-next').hidden, false); host.querySelector('.iui-async-video-next').click(); await tick(); assert.equal(rail.scrollLeft, 260); host.querySelector('.iui-async-video-previous').click(); await tick(); assert.equal(rail.scrollLeft, 0);
    checks.push('Local previous/next controls update scroll position under explicit synthetic geometry, without claiming native layout');
    const beforeBad = host.innerHTML; assert.throws(() => controller.update(cases.negatives.find(([n]) => n === 'provider URL must match supplied ID')[1])); assert.equal(host.innerHTML, beforeBad); const literal = structuredClone(input); literal.body[0].items[1].title = '<img src=x onerror=untrusted()>'; controller.update(literal); await tick(); assert.equal(host.querySelectorAll('.iui-async-video-open')[1].getAttribute('aria-label'), literal.body[0].items[1].title + ' on TikTok'); assert.equal(host.querySelector('[onerror]'), null); const images = [...host.querySelectorAll('img')]; controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'Finished supplied rail' }] }); await tick(); assert.ok(images.every(i => !i.hasAttribute('src'))); assert.equal(dom.window.document.querySelector('script[src]'), null);
    checks.push('Invalid provider replacements are atomic, supplied titles remain literal, and replacement releases preview resources');
  } finally { off(); controller.dispose(); dom.window.close(); }
  const laterDOM = makeDOM('<aside></aside>'), laterHost = laterDOM.window.document.createElement('main'), later = browser.mount(laterHost, input, { styles: false });
  try { await tick(); assert.equal(laterHost.querySelector('img'), null); laterDOM.window.document.body.append(laterHost); await tick(); const image = laterHost.querySelector('img'); assert.ok(image?.hasAttribute('src')); laterDOM.window.document.querySelector('aside').append(laterHost); laterDOM.window.document.body.append(laterHost); await tick(); assert.equal(image.hasAttribute('src'), false); assert.equal(laterDOM.window.document.querySelector('script[src]'), null); checks.push('Shared first connection starts previews and observed same-turn owner loss permanently retires images and SDK subscription'); } finally { later.dispose(); laterDOM.window.close(); }
  const artifact = await node.compileArtifact(input); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); const csp = page.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content, script = csp.split(';').find(p => p.trim().startsWith('script-src ')); assert.match(script, /https:\/\/www.youtube.com\/iframe_api https:\/\/www.youtube.com\/s\/player\//); assert.ok(!script.includes("'unsafe-inline'") && !script.includes("'unsafe-eval'")); assert.match(csp, /frame-src https:\/\/www.youtube-nocookie.com/); } finally { page.window.close(); }
  const single = structuredClone(input); single.body[0].items = single.body[0].items.slice(1); const noYoutubeArtifact = await node.compileArtifact(single), noYoutubePage = new JSDOM(noYoutubeArtifact.html); try { const csp = noYoutubePage.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content; assert.ok(!csp.includes('youtube.com')); } finally { noYoutubePage.window.close(); }
  checks.push('Actual compiled HTML includes complete family styles and fixed SDK/frame origins only for supplied YouTube records');
  assert.equal(navigations, 0); assert.deepEqual(errors, []); await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 149, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, deniedResourceRequests: deniedRequests, actualExternalRequests: 0, providerNavigations: navigations, standaloneHtmlBytes: Buffer.byteLength(artifact.html), compilerArtifacts: 2, cdnExecuted: false, standaloneScriptExecuted: false, externalSDKExecuted: false, nativeScenariosExecuted: 0, nativeMediaPlaybackOrPixelAcceptance: false, fullLibraryAcceptance: false, styleProvenance: 'Original portable CSS completion; historical final stylesheet not recovered.' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
