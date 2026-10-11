import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {buildCases} from '../candidates/recovered-card-group/cases.mjs';
import {checkLock} from '../candidates/recovered-card-group/verify.mjs';
import {mountIntentReceipt} from '../candidates/recovered-card-group/consumer.mjs';
const base=new URL('../candidates/recovered-card-group/',import.meta.url);
const document=JSON.parse(await readFile(new URL('examples/next-steps.json',base)));
test('Original CardGroup scene has three supplied intent variants and unchanged negative source',()=>{
 const before=JSON.stringify(document),{positives,negatives}=buildCases(document);
 assert.deepEqual(document.body[2].items.map(i=>i.intent.kind),['query','url','prefill']);
 assert.equal(positives.length,9);assert.equal(negatives.length,16);assert.equal(JSON.stringify(document),before);
 assert.equal(positives[1][1].body[2].items.length,0);
 assert.equal(positives[5][1].body[2].items.length,40);
});
test('Receipt consumer releases its host listener if mount fails',()=>{
 const listeners=new Set(),host={contains:()=>false,addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
 const api={validateDocument:d=>({ok:true,document:d}),mount(){throw new Error('Mount failed')}};
 assert.throws(()=>mountIntentReceipt(api,host,document,{}),/Mount failed/);
 assert.equal(listeners.size,0);
});
test('Receipt consumer cancels local intents and disposes exactly once',()=>{
 const listeners=new Set(),output={textContent:''},host={contains:()=>false,addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
 let disposed=0,canceled=0;
 const api={validateDocument:d=>({ok:true,document:d}),mount:()=>({update(){},dispose(){disposed++}})};
 const controller=mountIntentReceipt(api,host,document,output),handler=[...listeners][0];
 const event={detail:{itemId:'literal<script>',intent:{kind:'query'}},preventDefault(){canceled++}};
 handler(event);assert.equal(output.textContent,'Recorded locally: literal<script> (query)');assert.equal(canceled,1);
 controller.dispose();controller.dispose();assert.equal(disposed,1);assert.equal(listeners.size,0);
 output.textContent='Preserved';handler(event);assert.equal(output.textContent,'Preserved');
});
test('Lock rejects changed asset bytes rather than importing a nearby runtime',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'inform-consumer-lock-'));
 try {
  const p=path.join(root,'asset.js');await writeFile(p,'original');
  const lock={format:'inform-recovered-consumer-lock/1',protocolNodes:116,newCanonicalId:'follow-up-card-group',nativeScenariosExecuted:0,publicCdnVerified:false,files:[{path:'asset.js',bytes:8,sha256:createHash('sha256').update('original').digest('hex')}]};
  await assert.rejects(checkLock(root,lock),/Missing locked runtime/);
  await writeFile(p,'modified');await assert.rejects(checkLock(root,lock),/SHA256/);
 } finally {await rm(root,{recursive:true,force:true})}
});
