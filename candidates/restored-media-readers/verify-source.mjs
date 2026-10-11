import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { buildCases } from './cases.mjs';
import { buildCases as htmlCases } from '../restored-html-view/cases.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
export async function verify(library) {
  const root = await realpath(library), lock = await local('source-build-lock.safe.json');
  assert.equal(lock.format, 'inform-source-build-contract/1'); assert.equal(lock.protocolNodes, 144); assert.equal(lock.cdnExecuted, false);
  const names = new Set();
  const checkFiles = async () => {
    for (const f of lock.files) {
      assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'));
      const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep));
      const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
    }
  };
  for (const f of lock.files) { assert.ok(!names.has(f.path)); names.add(f.path); }
  for (const p of ['dist/index.js', 'dist/browser.js', 'dist/style.css', 'dist/standalone.js', 'src/schema/iui.schema.json', 'src/renderer/html-view.ts', 'src/renderer/search-image.ts', 'src/renderer/youtube.ts']) assert.ok(names.has(p));
  await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const mediaInput = await local('examples/supplied-media-readers.json'), htmlInput = await local('../restored-html-view/examples/local-label-picker.json');
  const mediaCases = buildCases(mediaInput), authoredCases = htmlCases(htmlInput), cases = { positives: [...mediaCases.positives, ...authoredCases.positives], negatives: [...mediaCases.negatives, ...authoredCases.negatives] };
  const input = { ...mediaInput, title: 'Original local HTML and finite media', body: [...htmlInput.body, ...mediaInput.body] };
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-141.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => !['HtmlViewNode', 'SearchImageNode', 'YoutubeNode'].some(n => x.$ref === '#/$defs/' + n)), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json')));
  for (const n of input.body) assert.equal(index.nodeOwners[n.type], 'base');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json'))));
  for (const [, d] of cases.positives) assert.equal(base(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8');
  for (const api of [node, browser]) { assert.equal(api.styles, css); for (const name of ['html-view', 'search-image', 'youtube']) assert.ok(api.styles.includes(await readFile(path.join(root, 'src/renderer/' + name + '.css'), 'utf8'))); }
  const denied = [], errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch(url) { denied.push(url); return null; } }
  const dom = new JSDOM('<form><main></main></form>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc });
  const host = dom.window.document.querySelector('main'), form = dom.window.document.querySelector('form'), controller = browser.mount(host, input, { styles: false });
  const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  try {
    await flush(); let html = host.querySelector('.iui-html-view'), frame = html.querySelector('iframe');
    assert.ok(frame); assert.equal(frame.getAttribute('sandbox'), 'allow-scripts'); assert.equal(frame.referrerPolicy, 'no-referrer'); assert.equal(frame.title, 'Local supplied label picker'); assert.equal(html.style.height, '260px'); assert.equal(html.style.width, '100%');
    assert.ok(frame.srcdoc.indexOf('Content-Security-Policy') < frame.srcdoc.indexOf('<h2>')); assert.ok(frame.srcdoc.includes(htmlInput.body[0].html)); assert.equal(host.querySelector('#choose,#result,script'), null);
    checks.push('Connected authored HTML stays in one scriptable opaque-origin srcdoc frame with policy before supplied content');
    let imageRoot = host.querySelector('.iui-search-image'), bitmap = imageRoot.querySelector('img'); assert.ok(bitmap); assert.equal(bitmap.getAttribute('src'), mediaInput.body[0].searchImage.content_url); assert.equal(bitmap.alt, mediaInput.body[0].alt); assert.equal(bitmap.referrerPolicy, 'no-referrer');
    const primary = bitmap; bitmap.dispatchEvent(new dom.window.Event('error')); bitmap = imageRoot.querySelector('img'); assert.notEqual(bitmap, primary); assert.equal(primary.hasAttribute('src'), false); assert.equal(bitmap.getAttribute('src'), mediaInput.body[0].searchImage.thumbnail_url);
    bitmap.dispatchEvent(new dom.window.Event('error')); assert.equal(imageRoot.dataset.phase, 'error'); assert.equal(imageRoot.querySelector('img'), null); assert.match(imageRoot.textContent, /Supplied picture unavailable/);
    checks.push('Synthetic image error events exercise content-first fallback and finite failure text without decoding');
    let video = host.querySelector('.iui-youtube'); assert.equal(video.dataset.loadMode, 'on-demand'); assert.equal(video.querySelector('iframe'), null); assert.equal(denied.length, 0);
    controller.setState({ videoDisabled: true }); video.querySelector('.iui-youtube-load').click(); assert.equal(video.querySelector('iframe'), null); controller.setState({ videoDisabled: false });
    video.querySelector('.iui-youtube-load').click(); const player = video.querySelector('iframe'); assert.ok(player); const url = new URL(player.src); assert.equal(url.origin, 'https://www.youtube-nocookie.com'); assert.equal(url.pathname, '/embed/AbCdEf012_-'); assert.equal(url.searchParams.get('autoplay'), '0'); assert.equal(url.searchParams.get('enablejsapi'), '0'); assert.equal(url.searchParams.get('start'), '30'); assert.equal(url.searchParams.get('fs'), '0'); assert.equal(player.hasAttribute('allowfullscreen'), false);
    video.querySelector('.iui-youtube-unload').click(); assert.equal(video.querySelector('iframe'), null); assert.equal(player.hasAttribute('src'), false); assert.equal(video.dataset.phase, 'idle');
    checks.push('On-demand video is initially unrequested, respects disabled state and unloads its fixed-origin player');
    const direct = structuredClone(input); delete direct.body[2].loadMode; delete direct.body[2].fullscreen; delete direct.body[2].startSeconds; controller.update(direct); await flush(); video = host.querySelector('.iui-youtube'); const directFrame = video.querySelector('iframe'); assert.ok(directFrame); assert.equal(video.dataset.loadMode, 'direct'); assert.equal(directFrame.hasAttribute('allowfullscreen'), true); assert.equal(new URL(directFrame.src).searchParams.get('autoplay'), '0'); assert.equal(video.querySelector('.iui-youtube-actions').hidden, true);
    assert.deepEqual([...new dom.window.FormData(form)], []); controller.update(input); await flush(); assert.equal(directFrame.hasAttribute('src'), false); assert.equal(directFrame.isConnected, false);
    checks.push('Omitted video mode retains the original direct/fullscreen defaults without native playback claims');
    const empty = structuredClone(input); empty.body[1].searchImage = null; controller.update(empty); await flush(); imageRoot = host.querySelector('.iui-search-image'); assert.equal(imageRoot.dataset.phase, 'empty'); assert.equal(imageRoot.querySelector('img'), null);
    empty.body[1].sourcePending = true; controller.update(empty); await flush(); assert.equal(host.querySelector('.iui-search-image').dataset.phase, 'pending');
    controller.update(input); await flush(); const before = host.innerHTML, invalid = structuredClone(input); invalid.body[2].videoId = 'invalid'; assert.throws(() => controller.update(invalid)); assert.equal(host.innerHTML, before);
    frame = host.querySelector('.iui-html-view iframe'); bitmap = host.querySelector('.iui-search-image img'); controller.dispose(); assert.equal(frame.isConnected, false); assert.equal(frame.hasAttribute('srcdoc'), false); assert.equal(bitmap.hasAttribute('src'), false);
    checks.push('Empty and pending images stay distinct; invalid updates are atomic and disposal revokes both frame and image sources');
    assert.deepEqual(errors, []); for (const url of denied) assert.equal(new URL(url).origin, 'https://www.youtube-nocookie.com'); assert.equal(denied.length, 2);
  } finally { controller.dispose(); dom.window.close(); }
  const detachedDom = new JSDOM('<aside></aside>', { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc }), detachedHost = detachedDom.window.document.createElement('main'), detached = browser.mount(detachedHost, input, { styles: false });
  try {
    await flush(); assert.equal(detachedHost.querySelector('iframe,img'), null); detachedDom.window.document.body.append(detachedHost); await flush();
    const frame = detachedHost.querySelector('.iui-html-view iframe'), bitmap = detachedHost.querySelector('.iui-search-image img'); assert.ok(frame); assert.ok(bitmap); assert.equal(detachedHost.querySelector('.iui-youtube iframe'), null);
    checks.push('The shared connection successor starts deferred HTML and image resources after first attachment');
    detachedDom.window.document.querySelector('aside').append(detachedHost); detachedDom.window.document.body.append(detachedHost); detached.setState({ videoDisabled: false }); await flush(); assert.equal(frame.hasAttribute('srcdoc'), false); assert.equal(bitmap.hasAttribute('src'), false);
    checks.push('Observed same-turn owner removal retires resources permanently despite later restoration');
  } finally { detached.dispose(); detachedDom.window.close(); }
  const authored = new JSDOM(htmlInput.body[0].html), scriptHash = "'sha256-" + createHash('sha256').update(authored.window.document.querySelector('script').textContent).digest('base64') + "'", handlerHash = "'sha256-" + createHash('sha256').update(authored.window.document.querySelector('[onclick]').getAttribute('onclick')).digest('base64') + "'"; authored.window.close();
  const policies = [];
  for (const assets of ['inline', 'shared']) {
    const artifact = await node.compileArtifact(input, { assets }); assert.deepEqual(artifact, await node.compileArtifact(input, { assets })); const page = new JSDOM(artifact.html);
    try { const csp = page.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content, directives = Object.fromEntries(csp.split(';').map(s => s.trim().split(/\s+/)).filter(([k]) => k).map(([k, ...v]) => [k, v]));
      assert.ok(directives['script-src'].includes(scriptHash)); assert.equal(directives['script-src'].includes("'unsafe-inline'"), false); assert.ok(directives['script-src-attr'].includes("'unsafe-hashes'")); assert.ok(directives['script-src-attr'].includes(handlerHash)); assert.deepEqual(directives['frame-src'], ['https://www.youtube-nocookie.com']); assert.deepEqual(directives['object-src'], ["'none'"]); assert.deepEqual(directives['form-action'], ["'none'"]);
      if (assets === 'inline') assert.equal(page.window.document.querySelector('style').textContent, css); else assert.ok(Object.values(artifact.assets).includes(css)); policies.push({ assets, bytes: Buffer.byteLength(artifact.html), scriptHash, handlerHash });
    } finally { page.window.close(); }
  }
  const plain = await node.compileArtifact({ version: 'iui/1', body: [{ type: 'text', value: 'Plain supplied text' }] }), plainPage = new JSDOM(plain.html);
  try { const csp = plainPage.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content; assert.ok(!csp.includes(scriptHash) && !csp.includes(handlerHash)); assert.match(csp, /connect-src 'none'/); assert.doesNotMatch(csp, /youtube-nocookie|unsafe-hashes|cdn\.jsdelivr/); } finally { plainPage.window.close(); }
  checks.push('Actual inline/shared compiler artifacts hash only authored script/handler sources and plain documents keep the old restrictive policy');
  await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 144, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, networkRequestsPerformed: 0, iframeLoadAttemptsDenied: denied.length, compiledArtifacts: policies, plainCompilerControl: true, cdnExecuted: false, standaloneHtmlCompiled: true, standaloneScriptExecuted: false, authoredFrameScriptExecuted: false, nativeScenariosExecuted: 0, mediaDecodedOrPlayed: false, pixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
