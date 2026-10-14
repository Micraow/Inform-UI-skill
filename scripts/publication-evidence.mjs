import assert from 'node:assert/strict';

// A successful local check or workbranch push cannot promote an old CDN receipt.
export function assertPublicationEvidence(build) {
  assert.equal(build.verificationLockOnly, true);
  assert.equal(build.runtimeChannel, 'latest');
  assert.match(build.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(build.runtimeSha256, /^[a-f0-9]{64}$/);
  const stage = build.validationStage;
  assert(['local', 'published', 'git-published-cdn-pending', 'workbranch-published-rolling-pending'].includes(stage), 'Unknown publication stage');
  if (stage === 'local') {
    assert.equal(build.publicationReady, false);
    return;
  }
  const http = build.runtimeHTTP;
  assert(http, 'An HTTP observation is required for this publication stage');
  assert.equal(http.url, build.runtimeURL);
  assert.equal(http.status, 200);
  if (stage === 'published') {
    assert.equal(build.publicationReady, true);
    assert.equal(http.verifiedSourceCommit ?? http.version, build.sourceCommit);
    assert.equal(http.publishedSha256, build.runtimeSha256);
    assert.notEqual(http.matchesSnapshot, false);
    return;
  }
  assert.equal(build.publicationReady, false);
  assert.equal(build.bundledRuntimeReady, true);
  assert.equal(http.matchesSnapshot, false);
  if (stage === 'git-published-cdn-pending') {
    assert.equal(http.gitPublishedSourceCommit, build.sourceCommit);
    assert.equal(http.expectedSha256, build.runtimeSha256);
    return;
  }
  const development = build.developmentPublication;
  const rolling = build.rollingPublication;
  assert(development && rolling, 'Workbranch and rolling provenance must be recorded separately');
  assert.equal(development.sourceCommit, build.sourceCommit);
  assert.equal(development.runtimeSha256, build.runtimeSha256);
  assert.equal(development.ref, 'refs/heads/next/openui-dsl-20261013');
  assert.equal(rolling.ref, 'refs/heads/web-chat-latest');
  assert.equal(rolling.sourceCommit, http.gitPublishedSourceCommit);
  assert.equal(rolling.runtimeSha256, http.expectedSha256);
  assert.notEqual(rolling.sourceCommit, development.sourceCommit);
  assert.notEqual(rolling.runtimeSha256, development.runtimeSha256);
  assert.equal(rolling.containsBundledRuntime, false);
}
