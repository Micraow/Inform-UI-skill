import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const library=process.env.PLAYER_RUNTIME;
assert.ok(library,'Set PLAYER_RUNTIME to the exact runtime directory.');
const root=path.resolve(library),{JSDOM,VirtualConsole}=createRequire(path.join(root,'package.json'))('jsdom');
const api=await import(pathToFileURL(path.join(root,'cdn/iui.min.js')));
const read=async relative=>JSON.parse(await readFile(new URL(relative,import.meta.url)));
const players=await read('examples/supplied-players.json'),ledger=await read('../restored-ledger-records/examples/supplied-ledger.json');
const nodes=[...players.body,...ledger.body];
for(const [index,selector,latest] of [[0,'.iui-nba-player','Sample Ridge'],[1,'.iui-tennis-player','Different supplied'],[2,'.iui-ledger-accounts','cash'],[3,'.iui-ledger-recurring','periodic']]) {
  for(const boundary of ['event target','control form']) test(selector+' preserves newer input delivered by reset '+boundary+' getter',async()=>{
    const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
    const dom=new JSDOM('<form><main></main></form>',{virtualConsole:vc});
    const d=dom.window.document,form=d.querySelector('form'),host=d.querySelector('main');
    let query,once=false;
    const type=value=>{query.value=value;query.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
    const newer=()=>{if(once)return;once=true;type(latest);};
    if(boundary==='event target')d.addEventListener('reset',event=>{
      const descriptor=Object.getOwnPropertyDescriptor(dom.window.Event.prototype,'target');
      Object.defineProperty(event,'target',{configurable:true,get(){newer();return descriptor.get.call(this);}});
    },{capture:true,once:true});
    // Put the target first so its own reset entry observes the reentrant read.
    const body=[nodes[index],...nodes.filter((_,i)=>i!==index)];
    const ctl=api.mount(host,{version:'iui/1',body},{styles:false});
    query=host.querySelector(selector+' input');type('older draft');
    if(boundary==='control form'){
      const descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'form');
      Object.defineProperty(query,'form',{configurable:true,get(){newer();return descriptor.get.call(this);}});
    }
    try {
      form.reset();await Promise.resolve();await Promise.resolve();
      assert.equal(once,true);assert.equal(query.value,latest);
      assert.equal(host.querySelectorAll('.iui-player-summary').length,2);
      assert.equal(host.querySelectorAll('.iui-ledger-records').length,2);
      assert.deepEqual(errors,[]);
    } finally {ctl.dispose();dom.window.close();}
  });
}
