import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
import{checkedDiscoveryJson,digest,discoveryGroups}from'../scripts/cdn-discovery-contract.mjs';
const bytes=Buffer.from('{"format":"original-synthetic-index"}\n'),expected={bytes:bytes.length,sha256:digest(bytes)};
test('whole discovery index bytes bind before metadata can authorize child hashes',()=>{assert.deepEqual(checkedDiscoveryJson(bytes,expected),{format:'original-synthetic-index'});assert.deepEqual(discoveryGroups,['base','forms','finance','converters','time']);});
for(const [name,data,metadata]of [['changed index bytes',Buffer.from(bytes.toString().replace('synthetic','different')),expected],['wrong expected hash',bytes,{...expected,sha256:'0'.repeat(64)}],['wrong expected byte length',bytes,{...expected,bytes:bytes.length+1}],['missing trusted metadata',bytes,undefined]])test('reject '+name,()=>assert.throws(()=>checkedDiscoveryJson(data,metadata)));
test('prepared browser binds fetched index and example bytes and keeps exact historical/final Markdown boundaries',async()=>{
 const source=await readFile(new URL('../scripts/verify-browser.mjs',import.meta.url),'utf8');
 for(const token of ['trustedDiscoveryInputs(library,contract)','indexBytes.byteLength!==expectedIndex.bytes','digest(indexBytes)!==expectedIndex.sha256','exampleBytes.byteLength!==expected.bytes','digest(exampleBytes)!==expected.sha256',"mode:cdn?'cdn':'inline'","contract.revision==='d370ffb2df310fce0da9299e6e254a58509ba544'",'7978f23da0222ad9122bb0b40daa4f1844b5b9cd'])assert.ok(source.includes(token),token);
});
