import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertPublicationEvidence} from '../scripts/publication-evidence.mjs';

const build = JSON.parse(await readFile(new URL('../generated/build.json', import.meta.url), 'utf8'));
test('the current publication state has matching evidence', () => assertPublicationEvidence(build));
// Synthetic pending evidence keeps these regression tests useful after a future
// real rolling publication; no fixture claims to be an observed HTTP response.
const pending = {
  verificationLockOnly:true, runtimeChannel:'latest', sourceCommit:'a'.repeat(40),
  runtimeSha256:'1'.repeat(64), runtimeURL:'https://example.invalid/runtime.js',
  validationStage:'workbranch-published-rolling-pending', publicationReady:false,
  bundledRuntimeReady:true,
  runtimeHTTP:{url:'https://example.invalid/runtime.js',status:200,matchesSnapshot:false,
    gitPublishedSourceCommit:'b'.repeat(40),expectedSha256:'2'.repeat(64)},
  developmentPublication:{sourceCommit:'a'.repeat(40),runtimeSha256:'1'.repeat(64),ref:'refs/heads/next/openui-dsl-20261013'},
  rollingPublication:{sourceCommit:'b'.repeat(40),runtimeSha256:'2'.repeat(64),ref:'refs/heads/web-chat-latest',containsBundledRuntime:false},
};
for (const [name, mutate] of [
  ['claiming readiness', value => { value.publicationReady = true; }],
  ['relabeling stale CDN bytes as published', value => { value.validationStage = 'published'; value.publicationReady = true; }],
  ['assigning the new source to the old rolling receipt', value => { value.rollingPublication.sourceCommit = value.sourceCommit; }],
  ['hiding the bundled/runtime difference', value => { value.rollingPublication.containsBundledRuntime = true; }],
]) {
  test('publication evidence rejects ' + name, () => {
    const changed = structuredClone(pending);
    mutate(changed);
    assert.throws(() => assertPublicationEvidence(changed));
  });
}
