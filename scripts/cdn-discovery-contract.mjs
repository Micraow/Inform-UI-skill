/** Trusted local expectations for later real-CDN browser discovery. No fetches here. */
import assert from 'node:assert/strict';
import {readFile,lstat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
export const discoveryGroups=Object.freeze(['base','forms','finance','converters','time']);
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function checkedDiscoveryJson(bytes,expected,label='Discovery asset'){
 assert.ok(expected&&typeof expected==='object','Trusted discovery metadata required');
 assert.match(expected.sha256??'',/^[a-f0-9]{64}$/);assert.ok(Number.isSafeInteger(expected.bytes)&&expected.bytes>0);
 assert.equal(bytes.length,expected.bytes,label+' byte length mismatch');assert.equal(digest(bytes),expected.sha256,label+' SHA-256 mismatch');
 return JSON.parse(bytes.toString('utf8'));
}
async function readSafe(root,relative){
 assert.ok(typeof relative==='string'&&/^[A-Za-z0-9._/-]+$/.test(relative)&&!path.posix.isAbsolute(relative)&&relative.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Unsafe discovery path');
 let file=path.resolve(root);for(const part of relative.split('/')){file=path.join(file,part);assert.equal((await lstat(file)).isSymbolicLink(),false,'Discovery symlink refused');}
 assert.ok((await lstat(file)).isFile());return readFile(file);
}
export async function trustedDiscoveryInputs(library,contract){
 const git=(...args)=>{const result=spawnSync('git',['-C',library,...args],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout.trim();};
 assert.equal(git('rev-parse','HEAD'),contract.revision,'CDN expectations require exact contract checkout');
 assert.equal(git('status','--porcelain'),'','CDN expectations require clean committed source');
 const integrity=JSON.parse(await readSafe(library,'cdn/integrity.json'));
 const indexPath=contract.cdn.schemaIndex,indexBytes=await readSafe(library,'cdn/'+indexPath);
 const metadata=integrity.files?.[indexPath];
 const index=checkedDiscoveryJson(indexBytes,metadata,'Trusted local index');
 assert.equal(index.format,'inform-ui-schema-index/1');
 const expectedExamples={};
 for(const id of discoveryGroups){
  const example=index.groups.find(group=>group.id===id)?.examples?.[0];assert.ok(example,'Missing discovery example '+id);
  assert.ok(example.repositoryPath.startsWith('examples/')&&example.repositoryPath.endsWith('.json'));
  const bytes=await readSafe(library,example.repositoryPath);
  expectedExamples[id]={path:example.path,bytes:bytes.length,sha256:digest(bytes)};
 }
 return{expectedIndex:{bytes:indexBytes.length,sha256:digest(indexBytes)},expectedExamples};
}
