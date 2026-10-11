import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,symlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {buildCases} from '../candidates/recovered-transaction-detail/cases.mjs';
import {checkLock} from '../candidates/recovered-transaction-detail/verify.mjs';
import {mountTransactionReceipt} from '../candidates/recovered-transaction-detail/consumer.mjs';
const base=new URL('../candidates/recovered-transaction-detail/',import.meta.url);
const document=JSON.parse(await readFile(new URL('examples/receipt-detail.json',base)));
test('Original receipt preserves zero, refund, unknown and literal identifiers; cases never mutate it',()=>{
 const before=JSON.stringify(document),{positives,negatives}=buildCases(document),data=document.body[0].data;
 assert.equal(data.transactionId,'001234');assert.equal(data.amountLabel,'USD 0.00');
 assert.deepEqual(data.related.map(i=>i.amountLabel),['−USD 6.00','Not supplied']);
 assert.equal(positives.length,12);assert.equal(negatives.length,16);assert.equal(JSON.stringify(document),before);
 assert.equal(document.body.length,1);assert.equal(data.logo,undefined);
});
test('Receipt consumer validates before installing listeners and releases failed mounts',()=>{
 const listeners=new Set(),host={contains:()=>false,addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
 const invalid={validateDocument:()=>({ok:false,issues:[{code:'SCHEMA',path:'/body/0'}]})};
 assert.throws(()=>mountTransactionReceipt(invalid,host,document,{}),/SCHEMA/);assert.equal(listeners.size,0);
 const api={validateDocument:d=>({ok:true,document:d}),mount(){throw Error('Mount failed')}};
 assert.throws(()=>mountTransactionReceipt(api,host,document,{}),/Mount failed/);assert.equal(listeners.size,0);
});
test('Receipt consumer writes literal local IDs and has idempotent teardown',()=>{
 const listeners=new Set(),output={textContent:''},host={contains:()=>false,addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
 let disposed=0,canceled=0;const api={validateDocument:d=>({ok:true,document:d}),mount:()=>({update(){},dispose(){disposed++}})};
 const controller=mountTransactionReceipt(api,host,document,output),handler=[...listeners][0];
 const event={detail:{transactionId:'000<script>'},preventDefault(){canceled++}};handler(event);
 assert.equal(output.textContent,'Selected supplied receipt: 000<script>');assert.equal(canceled,1);
 controller.dispose();controller.dispose();assert.equal(disposed,1);assert.equal(listeners.size,0);
 output.textContent='Preserved';handler(event);assert.equal(output.textContent,'Preserved');
});
test('117 lock names precise local source/asset pins without promoting canonical acceptance',async()=>{
 const lock=JSON.parse(await readFile(new URL('runtime-lock.safe.json',base)));
 assert.equal(lock.sourceCommit,'a8446f469385859de432d762fcbf2a9e2771f318');
 assert.equal(lock.implementationSourceCommit,'55dd3312d94904c3e42155ff7107cdab8777c8ab');
 assert.equal(lock.files.length,824);assert.equal(lock.protocolNodes,117);
 assert.deepEqual(lock.canonicalCounts,{functionallyVerified:53,implementedPendingVerification:57,notImplemented:141,partial:5,total:256});
 assert.equal(lock.nativeScenariosExecuted,0);assert.equal(lock.publicCdnVerified,false);
});
test('Shared verifier rejects duplicate paths, changed bytes and path escapes before import',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'inform-transaction-lock-'));
 try{
  await writeFile(path.join(root,'asset.js'),'original');const file={path:'asset.js',bytes:8,sha256:createHash('sha256').update('original').digest('hex')};
  const lock={format:'inform-recovered-consumer-lock/1',protocolNodes:117,newCanonicalId:'ledger-transaction-detail',nativeScenariosExecuted:0,publicCdnVerified:false,files:[file,file]};
  await assert.rejects(checkLock(root,lock),/Duplicate locked path/);
  lock.files=[file];await writeFile(path.join(root,'asset.js'),'modified');await assert.rejects(checkLock(root,lock),/SHA256/);
  lock.files=[{...file,path:'../escape.js'}];await assert.rejects(checkLock(root,lock));
  await symlink(path.join(root,'..'),path.join(root,'escape'));lock.files=[{...file,path:'escape'}];await assert.rejects(checkLock(root,lock),/escapes runtime/);
 }finally{await rm(root,{recursive:true,force:true})}
});
