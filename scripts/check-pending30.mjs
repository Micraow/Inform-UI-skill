/** Original final-six source/API checks. Event-model probes below are JSDOM only. */
import assert from 'node:assert/strict';
export function verifyPending30({api,full,subsetFor,JSDOM}) {
 const doc=node=>({version:'iui/1',body:[node]});
 const animate={type:'animate',label:'Local supplied content',children:[]};
 const celebration={type:'celebration',label:'Supplied message',message:'Original supplied words'};
 const email={type:'email-draft',label:'Local draft',to:[],subject:'',body:''};
 const task={type:'task-expansion-card',title:'Supplied outline',steps:[{id:'one',title:'Read the supplied text'}]};
 const location={type:'location-choice-request',label:'Supplied places',options:[{id:'one',label:'Synthetic place'}]};
 const gallery={type:'business-gallery',label:'Supplied pictures',images:[{id:'one',src:'https://example.invalid/synthetic.png',alt:'Original synthetic example'}]};
 const nodes=[animate,celebration,email,task,location,gallery];
 const positives=[
  {...animate,duration:100,disabled:true},
  {...animate,effect:'rise',duration:1000,children:Array.from({length:50},(_,i)=>({type:'text',value:'Original '+i}))},
  {...celebration,duration:300,message:'😀'.repeat(1000)},
  {...celebration,label:'😀'.repeat(200),duration:1800,disabled:true},
  email,
  {...email,subject:'😀'.repeat(300),body:'😀'.repeat(12000),to:Array.from({length:20},()=> 'A'.repeat(320)),cc:[],editable:false},
  task,
  {...task,summary:'',disabled:false,steps:Array.from({length:20},(_,i)=>({id:'s'+i,title:'Step '+i,description:'',details:'',reviewed:i%2===0}))},
  location,
  {...location,options:Array.from({length:12},(_,i)=>({id:'p'+i,label:'Place '+i,address:'',description:''})),source:{label:'Supplied'}},
  gallery,
  {...gallery,images:Array.from({length:12},(_,i)=>({id:'img'+i,src:'https://example.invalid/synthetic-'+i+'.png',alt:'Supplied '+i,caption:''}))}
 ];
 for(const node of positives){const d=doc(node),result=api.validateDocument(d);assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(full(d),true);assert.equal(subsetFor(['base'])(d),true);}
 for(const node of nodes)assert.equal(subsetFor(['learning'])(doc(node)),false,'Missing base domain '+node.type);
 const formChild={...animate,children:[{type:'input',kind:'text',label:'Draft',bind:'draft'}]};
 const composite={version:'iui/1',state:{draft:''},body:[formChild]};
 assert.equal(api.validateDocument(composite).ok,true);assert.equal(full(composite),true);
 assert.equal(subsetFor(['base'])(composite),false,'Animate must not imply forms domain');assert.equal(subsetFor(['base','forms'])(composite),true);
 const dangerous='<img src=x onerror="globalThis.injected=true">😀 & <script>bad()</script>';
 const literals=[
  {...animate,label:dangerous,children:[{type:'text',value:dangerous}]},
  {...celebration,label:dangerous,message:dangerous},
  {...email,label:dangerous,to:[dangerous],cc:[dangerous],subject:dangerous,body:dangerous,note:dangerous},
  {...task,title:dangerous,summary:dangerous,steps:[{id:'one',title:dangerous,description:dangerous,details:dangerous}]},
  {...location,label:dangerous,description:dangerous,options:[{id:'one',label:dangerous,address:dangerous,description:dangerous}]},
  {...gallery,label:dangerous,description:dangerous,images:[{...gallery.images[0],alt:dangerous,caption:dangerous}]}
 ];
 const dom=new JSDOM('<html lang="en"><body><main></main></body></html>',{pretendToBeVisual:true}),host=dom.window.document.querySelector('main');let controller;
 try{
  controller=api.mount(host,{version:'iui/1',body:literals},{styles:false});
  assert.equal(host.querySelectorAll('script,img,iframe,object,embed,[onerror],[onclick]').length,0);
  for(const selector of ['.iui-motion-label','.iui-email-subject','.iui-task-review-step-title','.iui-location-choice-label','.iui-business-gallery-caption']){
   const found=host.querySelectorAll(selector);assert.ok(found.length,selector);for(const element of found)assert.equal(element.textContent,dangerous,selector);
  }
  assert.equal(host.querySelector('textarea').value,dangerous);assert.equal(dom.window.injected,undefined);
  controller.dispose();controller=undefined;
  const spec={version:'iui/1',state:{other:0,locked:false},body:[
   {...animate,children:[{type:'text',value:'Always readable'}]},celebration,
   {...email,id:'mail',to:[' A <a@example.invalid> ','A <a@example.invalid>'],body:'First\r\nSecond\rThird'},
   {...task,disabled:{$:'locked'},steps:[{id:'one',title:'First',details:'Provided details',reviewed:true},{id:'two',title:'Second'}]},
   {...location,id:'place',options:[{id:'one',label:'First',address:''},{id:'two',label:'Second'}]},gallery
  ]};
  const original=JSON.stringify(spec);controller=api.mount(host,spec,{styles:false});
  assert.equal(host.querySelectorAll('.iui-motion[data-status=playing]').length,0,'Mount does not autoplay');
  const draft=host.querySelector('.iui-email-draft textarea');assert.equal(draft.value,'First\nSecond\nThird');
  assert.deepEqual([...host.querySelectorAll('.iui-email-recipients li')].map(n=>n.textContent),spec.body[2].to);
  // Source event-model check only: not native typing or trusted browser input.
  draft.value='Original local edit';draft.dispatchEvent(new dom.window.Event('input',{bubbles:true}));draft.focus();draft.setSelectionRange(1,4);
  controller.setState({other:1});assert.equal(host.querySelector('.iui-email-draft textarea'),draft);assert.equal(draft.value,'Original local edit');assert.deepEqual([draft.selectionStart,draft.selectionEnd],[1,4]);
  const card=host.querySelector('.iui-task-expansion-card'),boxes=[...card.querySelectorAll('input')],details=card.querySelector('details'),reset=card.querySelector('.iui-task-review-reset');
  details.open=true;boxes[1].checked=true;boxes[1].dispatchEvent(new dom.window.Event('input',{bubbles:true}));boxes[1].dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  assert.equal(card.querySelector('.iui-task-review-count').textContent,'2 of 2 steps marked reviewed');assert.equal(boxes[1].defaultChecked,true);
  assert.deepEqual(controller.getState(),{other:1,locked:false});assert.equal(card.querySelectorAll('[name],[data-bind]').length,0);
  reset.click();assert.deepEqual(boxes.map(n=>n.checked),[true,false]);assert.equal(details.open,true);assert.equal(reset.getAttribute('aria-disabled'),'true');
  const boundary=card.innerHTML;reset.click();assert.equal(card.innerHTML,boundary);
  controller.setState({locked:true});assert.equal(card.disabled,true);const html=host.innerHTML;assert.throws(()=>controller.setState({locked:1}));assert.equal(host.innerHTML,html);controller.setState({locked:false});
  const choice=host.querySelector('.iui-location-choice'),options=choice.querySelectorAll('.iui-location-choice-option'),clear=choice.querySelector('.iui-location-choice-clear'),events=[];let cancel=false;
  choice.addEventListener('iui:location-choice',event=>{events.push(event);if(cancel)event.preventDefault();});
  options[0].click();assert.equal(events.length,1);assert.deepEqual(events[0].detail,{componentId:'place',optionId:'one',label:'First',address:''});
  assert.ok(Object.isFrozen(events[0].detail));assert.equal(events[0].bubbles,true);assert.equal(events[0].cancelable,true);assert.equal(events[0].composed,false);
  cancel=true;options[1].click();assert.equal(choice.dataset.status,'not-accepted');assert.equal(options[0].getAttribute('aria-pressed'),'true');assert.equal(events[1].detail.address,null);cancel=false;
  options[0].click();assert.equal(events.length,3);clear.click();clear.click();assert.equal(events.length,3);assert.equal(clear.getAttribute('aria-disabled'),'true');
  assert.equal(host.querySelectorAll('.iui-business-gallery img').length,0,'No remote img before individual consent');
  assert.equal(host.querySelectorAll('.iui-business-gallery [src]').length,0);assert.equal(host.querySelectorAll('.iui-business-gallery .iui-image-consent button').length,1);
  const before=host.innerHTML;assert.throws(()=>controller.update({...spec,body:[{...location,options:[]}]}));assert.equal(host.innerHTML,before);
  assert.equal(JSON.stringify(spec),original);controller.dispose();controller.dispose();controller=undefined;assert.equal(host.childElementCount,0);
 }finally{controller?.dispose();dom.window.close();}
 return{positiveBoundaries:positives.length,missingDomainNegatives:nodes.length+1,literalInjectionTypes:nodes.length,localContract:'literal email/body normalization, plan review model/reset/strict-disabled state, exact cancelable local place event, no remote gallery image before consent, source atomic invalid replacement and cleanup passed in JSDOM only',browser:'not-run',motion:'no real WAAPI run',clipboard:'not-accessed',network:'not-requested'};
}
