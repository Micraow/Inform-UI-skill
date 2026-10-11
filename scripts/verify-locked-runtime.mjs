import assert from 'node:assert/strict';
import {readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function verifyLockedRuntime(library, lock, {protocolNodes,newCanonicalId,requiredFiles=[]}) {
  assert.equal(lock.format, 'inform-recovered-consumer-lock/1');
  assert.equal(lock.protocolNodes, protocolNodes);
  assert.equal(lock.newCanonicalId, newCanonicalId);
  assert.equal(lock.nativeScenariosExecuted, 0);
  assert.equal(lock.publicCdnVerified, false);
  const root = await realpath(library);
  const names = new Set();
  for (const file of lock.files) {
    assert.ok(!path.isAbsolute(file.path) && !file.path.split('/').includes('..'));
    assert.ok(!names.has(file.path), 'Duplicate locked path'); names.add(file.path);
    const resolved = await realpath(path.join(root, file.path));
    assert.ok(resolved.startsWith(root + path.sep), 'Locked file escapes runtime');
    const bytes = await readFile(resolved);
    assert.equal(bytes.length, file.bytes, file.path + ' bytes');
    assert.equal(hash(bytes), file.sha256, file.path + ' SHA256');
  }
  for (const required of ['dist/browser.js','dist/index.js','dist/style.css','cdn/iui.min.js','cdn/iui.css','src/schema/iui.schema.json','src/schema/fragments/base.schema.json','src/schema/fragments/index.json',...requiredFiles])
    assert.ok(names.has(required), 'Missing locked runtime file: ' + required);
  if (lock.safeRecovery) {
    assert.equal(lock.safeRecovery.format,'inform-safe-file-closure/1');
    assert.equal(lock.safeRecovery.wholeTreeGitVerification,false);
    assert.equal(lock.safeRecovery.verifiedFiles,lock.files.length);
    const records=lock.files.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
    assert.equal(hash(JSON.stringify(records)),lock.safeRecovery.verifiedContentSha256,'Safe file-closure identity');
  } else if (lock.sourceCommit) {
    const git = args => execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
    assert.equal(git(['rev-parse','HEAD']),lock.sourceCommit,'Wrong local source commit');
    assert.equal(git(['rev-parse','HEAD^{tree}']),lock.sourceTree,'Wrong local source tree');
    assert.equal(git(['status','--porcelain']), '', 'Runtime tree changed after freeze');
  }
  return root;
}
