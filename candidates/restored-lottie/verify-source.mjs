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
  const checkFiles = async () => { const names = new Set(); for (const f of lock.files) {
    assert.ok(!names.has(f.path) && !path.isAbsolute(f.path) && !f.path.split('/').includes('..')); names.add(f.path);
    const p = await realpath(path.join(root, f.path)); assert.ok(p.startsWith(root + path.sep)); const b = await readFile(p); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path);
  } }; await checkFiles();
  const [node, browser] = await Promise.all(['dist/index.js', 'dist/browser.js'].map(p => import(pathToFileURL(path.join(root, p)))));
  const input = await local('examples/supplied-lottie.json'), cases = buildCases(input);
  for (const api of [node, browser]) {
    for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, name + ': ' + JSON.stringify(v)); }
    for (const [name, d, code, p] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, name); assert.ok(v.issues.some(i => i.code === code && (!p || i.path === p)), name + ': ' + JSON.stringify(v)); }
  }
  const schema = JSON.parse(await readFile(path.join(root, 'src/schema/iui.schema.json'))), baseline = await local('schema-baseline-146.json');
  for (const [name, digest] of Object.entries(baseline.definitions)) assert.equal(hash(JSON.stringify(schema.$defs[name])), digest, name);
  assert.deepEqual(schema.$defs.Node.oneOf.filter(x => x.$ref !== '#/$defs/LottieNode'), baseline.nodeRefs);
  const index = JSON.parse(await readFile(path.join(root, 'src/schema/fragments/index.json'))); assert.equal(index.nodeOwners.lottie, 'base');
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom'), Ajv = require('ajv/dist/2020.js').default;
  const base = new Ajv({ strict: false }).compile(JSON.parse(await readFile(path.join(root, 'src/schema/fragments/base.schema.json')))); for (const [, d] of cases.positives) assert.equal(base(d), true);
  const css = await readFile(path.join(root, 'dist/style.css'), 'utf8'); for (const api of [node, browser]) assert.equal(api.styles, css);
  assert.equal(hash(await readFile(path.join(root, 'node_modules/lottie-web/build/player/lottie.js'))), '134b7463eec8de573fb3c6778c3c13368fb89f336b1b905e752f0be80de6a4c9');
  const generated = await readFile(path.join(root, 'src/renderer/lottie-player.generated.js'), 'utf8'); assert.ok(generated.includes('Animation expressions are disabled')); assert.ok(!generated.includes('var readyStateCheckInterval = setInterval(checkReady, 100);'));
  let requests = 0; const errors = [], checks = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected network request'); } }
  // Only the engine's transparent bootstrap is adapted. Shape/SVG construction and transforms run the bundled official engine.
  const makeDOM = html => { const dom = new JSDOM(html, { url: 'https://local.example/', resources: new Reject(), virtualConsole: vc, pretendToBeVisual: true }); dom.window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, measureText() { return { width: 10 }; } }); dom.window.fetch = () => { requests++; throw Error('Unexpected fetch'); }; return dom; };
  const tick = () => new Promise(resolve => setTimeout(resolve, 30));
  const dom = makeDOM('<main></main>'), host = dom.window.document.querySelector('main'), controller = browser.mount(host, input, { styles: false });
  try {
    await tick(); let vector = host.querySelector('.iui-lottie'), svg = vector.querySelector('svg'); assert.equal(vector.dataset.phase, 'ready'); assert.ok(svg); assert.equal(svg.getAttribute('viewBox'), '0 0 120 80'); assert.ok(svg.querySelector('path')); assert.equal(vector.getAttribute('role'), 'img'); assert.equal(vector.getAttribute('aria-label'), input.body[0].alt); assert.equal(vector.dataset.playing, 'false');
    const transforms = () => [...svg.querySelectorAll('[transform]')].map(e => e.getAttribute('transform')); const before = transforms(); controller.setState({ time: 1 }); assert.notDeepEqual(transforms(), before); assert.equal(vector.dataset.playing, 'false');
    checks.push('The pinned complete SVG engine constructs the original rectangle and changes actual transforms on supplied seek');
    const bitmap = host.querySelectorAll('.iui-lottie')[1]; assert.equal(bitmap.dataset.phase, 'requested'); assert.equal(bitmap.querySelector('img').getAttribute('src'), input.body[1].source); assert.equal(bitmap.querySelector('img').style.objectFit, 'contain');
    checks.push('Original inline bitmap uses the real image path without a fetch; decoding is not simulated');
    controller.setState({ rate: 1 }); assert.equal(vector.dataset.playing, 'true'); controller.setState({ rate: 0 }); assert.equal(vector.dataset.playing, 'false'); const state = controller.getState(); assert.throws(() => controller.setState({ rate: 17 })); assert.deepEqual(controller.getState(), state);
    checks.push('Finite supplied playback rate starts and pauses engine state, while invalid rate updates remain atomic');
    controller.update(cases.positives.find(([n]) => n === 'static vector frame')[1]); await tick(); vector = host.querySelector('.iui-lottie'); assert.equal(vector.dataset.phase, 'ready'); assert.ok(vector.querySelector('svg path'));
    controller.update(cases.positives.find(([n]) => n === 'inline JSON data URL')[1]); await tick(); assert.equal(host.querySelector('.iui-lottie').dataset.phase, 'ready'); assert.ok(host.querySelector('svg path'));
    checks.push('Static geometry and local JSON data URLs both reach actual SVG-engine rendering');
    const bad = cases.negatives.find(([n]) => n === 'executable expression')[1], beforeBad = host.innerHTML; assert.throws(() => controller.update(bad)); assert.equal(host.innerHTML, beforeBad);
    const oldVector = host.querySelector('.iui-lottie'), oldImage = host.querySelector('img'); controller.update({ version: 'iui/1', body: [{ type: 'text', value: 'Finished local reading' }] }); await tick(); assert.equal(oldVector.querySelector('svg'), null); assert.equal(oldImage.hasAttribute('src'), false); assert.match(host.textContent, /Finished local reading/);
    checks.push('Unsafe replacement is atomic and successful replacement destroys SVG and releases the owned bitmap source');
  } finally { controller.dispose(); dom.window.close(); }
  const delayed = makeDOM('<aside></aside>'), delayedHost = delayed.window.document.createElement('main'), later = browser.mount(delayedHost, input, { styles: false });
  try { await tick(); assert.equal(delayedHost.querySelector('svg'), null); delayed.window.document.body.append(delayedHost); await tick(); const vector = delayedHost.querySelector('.iui-lottie'); assert.ok(vector.querySelector('svg')); delayed.window.document.querySelector('aside').append(delayedHost); delayed.window.document.body.append(delayedHost); later.setState({ time: 1 }); await tick(); assert.equal(vector.querySelector('svg'), null); checks.push('Shared first connection starts the engine, and observed same-turn owner loss permanently destroys its resources'); } finally { later.dispose(); delayed.window.close(); }
  const artifact = await node.compileArtifact(input); const page = new JSDOM(artifact.html); try { assert.equal(page.window.document.querySelector('style').textContent, css); const csp = page.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content; assert.match(csp, /connect-src 'none'/); assert.ok(!csp.includes("'unsafe-eval'")); } finally { page.window.close(); }
  const remote = structuredClone(input); remote.body = [remote.body[0]]; remote.body[0].source = 'https://animation.example.org/original.json'; const remoteArtifact = await node.compileArtifact(remote); const remotePage = new JSDOM(remoteArtifact.html); try { const csp = remotePage.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content; assert.match(csp, /connect-src https:\/\/animation\.example\.org(?:;|$)/); assert.ok(!csp.includes('connect-src https:;')); } finally { remotePage.window.close(); }
  checks.push('Actual compiler HTML retains full styles and grants only the supplied animation origin, with no unsafe-eval');
  assert.equal(requests, 0); assert.deepEqual(errors, []); await checkFiles();
  return { format: 'inform-source-build-consumer-result/1', sourceCommit: lock.sourceCommit, sourceTree: lock.sourceTree, protocolNodes: 147, positive: cases.positives.length, negative: cases.negatives.length, validatorEntries: ['dist/index.js', 'dist/browser.js'], checks, lockedFiles: lock.files.length, historicalDefinitions: Object.keys(baseline.definitions).length, engine: { package: 'lottie-web', version: '5.13.0', upstreamSha256: '134b7463eec8de573fb3c6778c3c13368fb89f336b1b905e752f0be80de6a4c9', actualSvgEngineExecuted: true, canvasBootstrapAdapter: true }, externalRequests: requests, standaloneHtmlBytes: Buffer.byteLength(artifact.html), compilerArtifacts: 2, cdnExecuted: false, standaloneScriptExecuted: false, nativeScenariosExecuted: 0, nativePlaybackOrPixelAcceptance: false, fullLibraryAcceptance: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { const i = process.argv.indexOf('--library'); assert.ok(i >= 0 && process.argv[i + 1]); console.log(JSON.stringify(await verify(process.argv[i + 1]), null, 2)); }
