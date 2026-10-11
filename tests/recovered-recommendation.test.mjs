import test from 'node:test';import assert from 'node:assert/strict';import {readFile}from'node:fs/promises';
import {buildCases}from'../candidates/recovered-recommendation/cases.mjs';
import {mountReadingReceipt}from'../candidates/recovered-recommendation/consumer.mjs';
const base=new URL('../candidates/recovered-recommendation/',import.meta.url),document=JSON.parse(await readFile(new URL('examples/recommendation.json',base)));
test('Recommendation authoring keeps strict inert status envelopes and original input',()=>{
 const before=JSON.stringify(document),cases=buildCases(document);assert.equal(cases.positives.length,7);assert.equal(cases.negatives.length,10);assert.equal(JSON.stringify(document),before);
 for(const[,d]of cases.positives.filter(([,d])=>d.body[0].status!=='resolved')){assert.equal(d.body[0].data,undefined);assert.equal(d.body[0].canOpenConversation,undefined)}
 assert.equal(document.body[0].data.iconData,undefined);
});
test('Unified local host cancels all three intent types and tears down every listener once',()=>{
 const listeners=new Map(),host={contains:()=>false,addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)},output={textContent:''};let disposed=0,canceled=0;
 const api={validateDocument:d=>({ok:true,document:d}),mount:()=>({update(){},dispose(){disposed++}})},controller=mountReadingReceipt(api,host,document,output);
 const names=['iui:recommendation-card','iui:transaction-detail','iui:follow-up-card'],keys=['conversationId','transactionId','itemId'];
 names.forEach((name,i)=>{listeners.get(name)({type:name,detail:{[keys[i]]:'000<script>'},preventDefault(){canceled++}});assert.equal(output.textContent,'Selected locally: 000<script>')});
 assert.equal(canceled,3);const retained=listeners.get(names[0]);controller.dispose();controller.dispose();assert.equal(disposed,1);assert.equal(listeners.size,0);
 output.textContent='Preserved';retained({type:names[0],detail:{conversationId:'late'}});assert.equal(output.textContent,'Preserved');
});
test('Unified host removes all listeners if runtime construction fails',()=>{
 const listeners=new Map(),host={contains:()=>false,addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)};
 const api={validateDocument:d=>({ok:true,document:d}),mount(){throw Error('Unavailable mount')}};
 assert.throws(()=>mountReadingReceipt(api,host,document,{}),/Unavailable mount/);assert.equal(listeners.size,0);
});
test('118 candidate binds one new canonical item and exact repaired asset without native promotion',async()=>{
 const lock=JSON.parse(await readFile(new URL('runtime-lock.safe.json',base)));
 assert.equal(lock.sourceCommit,'4c6f52e3f14adb9eca4095f7e2f7485eead467dd');assert.equal(lock.assetCommit,'3c57878df3f290cd0a34d96be0577d5c9ff64fff');assert.equal(lock.copyWordsFixCommit,'ceab8b21a52581e84e61dd4a3a5802828432d390');assert.equal(lock.protocolNodes,118);assert.equal(lock.newCanonicalId,'recommendation-card');
 assert.equal(lock.files.length,837);assert.equal(lock.canonicalCounts.functionallyVerified,53);assert.equal(lock.canonicalCounts.implementedPendingVerification,58);assert.equal(lock.canonicalCounts.total,256);assert.equal(lock.nativeScenariosExecuted,0);assert.equal(lock.publicCdnVerified,false);
});
