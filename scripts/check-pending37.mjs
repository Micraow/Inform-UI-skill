/** Additional seven-contract source-only boundary checks. JSDOM is not a browser. */
import assert from 'node:assert/strict';
export function verifyPending37({api,full,subsetFor,JSDOM}){
 const moment='2028-02-29T10:00Z',later='2028-02-29T12:00Z';
 const flight={type:'flight-option',label:'Original supplied route',optionId:'route',legs:[{id:'one',carrier:'Example Air',number:'EX 1',departure:{airport:'LHR',at:moment},arrival:{airport:'JFK',at:later}}]};
 const events={type:'artist-upcoming-events',artist:'Original artist',events:[]};
 const assets={type:'asset-distribution',label:'Original supplied amounts',accounts:[]};
 const transactions={type:'transaction-list',label:'Original supplied entries',transactions:[]};
 const onboarding={type:'onboarding-selection',label:'Original local choice',options:[{id:'one',label:'One'},{id:'two',label:'Two'}],minimum:0};
 const shipment={type:'package-tracker',label:'Original supplied shipment',carrier:'Example Parcel',trackingId:'ORIGINAL',status:'unknown',observedAt:moment,milestones:[]};
 const tracker={type:'flight-tracker',label:'Original supplied flight',carrier:'Example Air',flightNumber:'EX 1',status:'unknown',observedAt:moment,departure:{airport:'LHR',scheduledAt:moment},arrival:{airport:'JFK',scheduledAt:later},updates:[]};
 const nodes=[flight,events,assets,transactions,onboarding,shipment,tracker],doc=n=>({version:'iui/1',body:[n]});
 const positives=[...nodes,{...assets,accounts:[{id:'zero',name:'Known zero',amount:0,currency:'USD'},{id:'unknown',name:'Unknown',amount:null,currency:'USD'},{id:'tiny',name:'Subnormal',amount:5e-324,currency:'EUR'}]},
  {...onboarding,mode:'multiple',maximum:2,initial:[]},
  {...shipment,milestones:[{id:'pending',label:'No invented occurrence',state:'pending'}]},
  {...tracker,departure:{...tracker.departure,actualAt:moment},arrival:{...tracker.arrival,estimatedAt:later}}];
 for(const node of positives){const d=doc(node),group=['asset-distribution','transaction-list'].includes(node.type)?'finance':'base';assert.equal(api.validateDocument(d).ok,true);assert.equal(full(d),true);assert.equal(subsetFor(group==='base'?['base']:['base','finance'])(d),true);}
 for(const node of nodes){const d=doc(node),wrong=['asset-distribution','transaction-list'].includes(node.type)?['base']:['learning'];assert.equal(subsetFor(wrong)(d),false,'Missing required domain '+node.type);}
 const dangerous='<img src=x onerror="globalThis.injected=true">😀 & <script>bad()</script>';
 const literal=nodes.map(n=>n.type==='artist-upcoming-events'?{...n,artist:dangerous}:{...n,label:dangerous});
 const dom=new JSDOM('<html lang="en"><body><main></main></body></html>',{url:'https://example.org/'}),host=dom.window.document.querySelector('main');let controller;
 try{
  controller=api.mount(host,{version:'iui/1',body:literal},{styles:false});assert.equal(host.querySelectorAll('script,img,iframe,[onclick],[onerror]').length,0);assert.equal(dom.window.injected,undefined);
  for(const selector of ['.iui-flight-title','.iui-events-artist','.iui-ledger-title','.iui-onboarding-title','.iui-tracker-title'])for(const node of host.querySelectorAll(selector))assert.equal(node.textContent,dangerous);
  const before=host.firstElementChild;assert.throws(()=>controller.update(doc({...shipment,milestones:[{id:'bad',label:'Bad',state:'pending',occurredAt:moment}]})));assert.equal(host.firstElementChild,before);controller.dispose();controller.dispose();assert.equal(host.childElementCount,0);controller=undefined;
  const spec={version:'iui/1',state:{other:0},body:[flight,onboarding]};controller=api.mount(host,spec,{styles:false});
  const choice=host.querySelector('.iui-flight-option'),select=choice.querySelector('.iui-flight-select'),clear=choice.querySelector('.iui-flight-clear'),eventsSeen=[];
  host.addEventListener('iui:flight-choice',e=>{eventsSeen.push(e);e.preventDefault();},{once:true});select.click();assert.equal(choice.dataset.selected,'false');select.click();assert.equal(choice.dataset.selected,'true');clear.click();assert.equal(choice.dataset.selected,'false');assert.deepEqual(eventsSeen[0].detail,{id:null,optionId:'route'});assert.ok(Object.isFrozen(eventsSeen[0].detail));
  const board=host.querySelector('.iui-onboarding'),proceed=board.querySelector('.iui-onboarding-continue');let picked;
  board.addEventListener('iui:onboarding-choice',e=>{picked=e;e.preventDefault();},{once:true});proceed.click();assert.equal(board.dataset.status,'not-accepted');assert.deepEqual(picked.detail,{componentId:null,selectedIds:[]});assert.ok(Object.isFrozen(picked.detail)&&Object.isFrozen(picked.detail.selectedIds));controller.setState({other:2});assert.equal(host.querySelector('.iui-onboarding'),board);
 }finally{controller?.dispose();dom.window.close();}
 return{positiveBoundaries:positives.length,missingDomainNegatives:nodes.length,literalInjectionTypes:literal.length,hostEvents:'JSDOM canceled choice and frozen detail only; native browser remains separate'};
}
