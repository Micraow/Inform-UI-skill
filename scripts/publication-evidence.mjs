import assert from 'node:assert/strict';

export const mainRuntimeURL = 'https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js';

// Local checks and Git commits cannot promote an older CDN observation.
export function assertPublicationEvidence(build) {
  assert.equal(build.verificationLockOnly, true);
  assert.equal(build.runtimeChannel, 'main');
  assert.equal(build.runtimeURL, mainRuntimeURL);
  assert.match(build.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(build.runtimeSha256, /^[a-f0-9]{64}$/);
  const stage = build.validationStage;
  assert(['local', 'published', 'git-published-cdn-pending', 'git-published-unverified'].includes(stage), 'Unknown publication stage');
  if (stage === 'local') {
    assert.equal(build.publicationReady, false);
    return;
  }
  if (stage === 'git-published-unverified') {
    assert.equal(build.publicationReady, false);
    assert.equal(build.bundledRuntimeReady, true);
    assert.equal(build.runtimeHTTP, null, 'Unverified publication must not invent an HTTP observation');
    assert.equal(build.gitPublication?.repository, 'Micraow/Inform-UI');
    assert.equal(build.gitPublication?.sourceCommit, build.sourceCommit);
    assert.match(build.gitPublication?.commit ?? '', /^[a-f0-9]{40}$/);
    return;
  }
  const http = build.runtimeHTTP;
  assert(http, 'An HTTP observation is required');
  assert.equal(http.url, build.runtimeURL);
  assert.equal(http.status, 200);
  if (stage === 'published') {
    assert.equal(build.publicationReady, true);
    assert.equal(http.verifiedSourceCommit, build.sourceCommit);
    assert.equal(http.publishedSha256, build.runtimeSha256);
    assert.equal(http.matchesSnapshot, true);
    assert.match(build.noticesSha256, /^[a-f0-9]{64}$/);
    assert.equal(http.notices?.url, new URL('THIRD_PARTY_NOTICES.txt', build.runtimeURL).href);
    assert.equal(http.notices?.status, 200);
    assert.equal(http.notices?.publishedSha256, build.noticesSha256);
    assert.equal(http.notices?.matchesSnapshot, true);
    return;
  }
  assert.equal(build.publicationReady, false);
  assert.equal(build.bundledRuntimeReady, true);
  assert.equal(http.matchesSnapshot, false);
  assert.equal(http.gitPublishedSourceCommit, build.sourceCommit);
  assert.equal(http.expectedSha256, build.runtimeSha256);
}
