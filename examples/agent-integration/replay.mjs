#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createAgentSession} from './session.mjs';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const selection = await json('./selection.json');
const source = await readFile(new URL('./workshop-plan.openui', import.meta.url), 'utf8');
const lock = await json('../../generated/runtime-lock.json');
const runtime = await readFile(new URL('../../assets/runtime/node.mjs', import.meta.url));
assert.equal(hash(runtime), lock.bundles['node.mjs'].sha256, 'Runtime differs from the recorded snapshot');
const session = createAgentSession(selection);
try {
  const generation = session.beginGeneration();
  let chunks = 0;
  for (let start = 0; start < source.length; start += 91) {
    assert(session.append(generation, source.slice(start, start + 91)).ok);
    assert.equal(session.preview(generation).preview.interactive, false);
    chunks++;
  }
  assert.equal(session.getSnapshot(), null);
  assert(session.finish(generation).ok);
  const accepted = session.getSnapshot();
  const rejections = [];
  for (const fixture of await json('./negative-cases.json')) {
    const token = session.beginGeneration();
    assert(session.append(token, fixture.source).ok);
    const result = session.finish(token);
    assert.equal(result.ok, false);
    assert(result.issues.some(issue => issue.code === fixture.code));
    assert.equal(session.getSnapshot(), accepted);
    rejections.push({id:fixture.id,code:fixture.code});
  }
  console.log(JSON.stringify({
    format:'inform-agent-integration-replay/1',ok:true,
    simulation:'Synthetic recorded output; no model API or host service was invoked.',
    sourceRef:lock.sourceRef,nodeRuntimeSha256:hash(runtime),fixtureSha256:hash(source),
    selection,chunks,passivePreview:true,finalCommit:true,preservesLastAccepted:true,rejections,
    browser:'Not tested by this replay.',
  }, null, 2));
} finally { session.dispose(); }
