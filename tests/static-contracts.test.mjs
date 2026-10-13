import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const json=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
test('all static contracts and CLI runtime share the recorded snapshot',async()=>{
 const status=await json('generated/snapshot-status.json'),lock=await json('generated/runtime-lock.json');
 assert.equal(status.status,'current-bundled-runtime');assert.equal(status.viewPromptCount,195);
 assert.equal(status.sourceRef,lock.sourceRef);
 assert.equal(status.nodeRuntimeSha256,lock.bundles['node.mjs'].sha256);
 assert.equal(digest(await readFile(new URL('assets/runtime/node.mjs',root))),status.nodeRuntimeSha256);
 for(const [path,expected] of Object.entries(status.contracts)){
  const bytes=await readFile(new URL(path,root));assert.equal(bytes.length,expected.bytes,path);assert.equal(digest(bytes),expected.sha256,path);
 }
 const chart=await readFile(new URL('generated/modules/base--charts.txt',root),'utf8');
 for(const name of ['MiniAreaChart','MiniBarChart','MiniLineChart'])assert.match(chart.split('\n').find(line=>line.startsWith(name+'(')),/size\?: integer\[100,320\]/);
 const code=await readFile(new URL('generated/views/CodeView.txt',root),'utf8');assert(code.includes('"oneOf"'));
});
