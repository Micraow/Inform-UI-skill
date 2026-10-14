import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertPublicationEvidence, mainRuntimeURL} from '../scripts/publication-evidence.mjs';

const build = JSON.parse(await readFile(new URL('../generated/build.json', import.meta.url), 'utf8'));
test('the current publication state has matching evidence', () => assertPublicationEvidence(build));
// Synthetic receipts exercise failure paths without claiming a real observation.
const pending = {
  verificationLockOnly:true, runtimeChannel:'main', runtimeURL:mainRuntimeURL,
  sourceCommit:'a'.repeat(40), runtimeSha256:'1'.repeat(64),
  validationStage:'git-published-cdn-pending', publicationReady:false, bundledRuntimeReady:true,
  runtimeHTTP:{url:mainRuntimeURL,status:200,matchesSnapshot:false,
    gitPublishedSourceCommit:'a'.repeat(40),expectedSha256:'1'.repeat(64),publishedSha256:'2'.repeat(64)},
};
for (const [name, mutate] of [
  ['claiming readiness', value => { value.publicationReady = true; }],
  ['relabeling stale CDN bytes as published', value => { value.validationStage = 'published'; value.publicationReady = true; }],
  ['assigning a different source to the Git receipt', value => { value.runtimeHTTP.gitPublishedSourceCommit = 'b'.repeat(40); }],
  ['hiding the expected runtime hash', value => { value.runtimeHTTP.expectedSha256 = '2'.repeat(64); }],
]) {
  test('publication evidence rejects ' + name, () => {
    const changed = structuredClone(pending); mutate(changed);
    assert.throws(() => assertPublicationEvidence(changed));
  });
}
const published = {
  ...pending, validationStage:'published', publicationReady:true, noticesSha256:'3'.repeat(64),
  runtimeHTTP:{url:mainRuntimeURL,status:200,matchesSnapshot:true,verifiedSourceCommit:'a'.repeat(40),publishedSha256:'1'.repeat(64),
    notices:{url:new URL('THIRD_PARTY_NOTICES.txt',mainRuntimeURL).href,status:200,matchesSnapshot:true,publishedSha256:'3'.repeat(64)}},
};
test('published evidence rejects altered license notice bytes', () => {
  const changed = structuredClone(published);
  changed.runtimeHTTP.notices.publishedSha256 = '0'.repeat(64);
  assert.throws(() => assertPublicationEvidence(changed));
});
test('published evidence rejects a noncanonical runtime URL', () => {
  const changed = structuredClone(published);
  changed.runtimeURL += '?temporary=1'; changed.runtimeHTTP.url = changed.runtimeURL;
  assert.throws(() => assertPublicationEvidence(changed));
});

test('automatic publication checks do not install or execute a browser', async () => {
  const workflow = await readFile(new URL('../.github/workflows/cdn-main-smoke.yml', import.meta.url), 'utf8');
  assert.match(workflow, /name: Published main CDN integrity/);
  assert.match(workflow, /node scripts\/check-published-cdn\.mjs --bytes-only/);
  assert.match(workflow, /npm run check:contracts && npm run check:profiles/);
  assert.doesNotMatch(workflow, /playwright|chromium|--with-deps/i);
  const script = await readFile(new URL('../scripts/check-published-cdn.mjs', import.meta.url), 'utf8');
  const byteOnly = script.indexOf("if (process.argv.includes('--bytes-only'))");
  assert(byteOnly > script.indexOf('assert.equal(hash(bytes)'));
  assert(script.indexOf('process.exit(0);', byteOnly) < script.indexOf('await import('));
});
