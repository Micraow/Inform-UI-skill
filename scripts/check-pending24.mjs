/** Original focused checks for four source-only supplied-data contracts. JSDOM is not a browser receipt. */
import assert from 'node:assert/strict';
export function verifyPending24({api,full,subsetFor,JSDOM}) {
 const doc=node=>({version:'iui/1',body:[node]});
 const news={type:'news-article',headline:'Synthetic',source:{label:'Synthetic'}};
 const review=(id,rating=null)=>({id,author:'Fictional',body:'Synthetic',rating});
 const reviews={type:'entity-reviews',label:'Synthetic',items:[]};
 const availability={type:'restaurant-availability',id:'synthetic_choice',title:'Synthetic',venue:'Fictional venue',partySize:2,timeZoneLabel:'Literal wall time',slots:[]};
 const comment=id=>({id,author:'Fictional',body:'Synthetic'});
 const thread={type:'reddit-thread-card',title:'Synthetic',author:'Fictional',body:'',source:{label:'Synthetic'},comments:[]};
 let deep=comment('level4');for(let i=3;i>=1;i--)deep={...comment('level'+i),replies:[deep]};
 const positives=[
  {...news,headline:'😀'.repeat(300),published:'0001-01-01',paragraphs:Array.from({length:30},()=> 'Synthetic paragraph')},
  {...news,published:'9999-12-31',paragraphs:[]},
  {...reviews,items:Array.from({length:50},(_,i)=>review('r'+i,i%2===0?null:5))},
  {...reviews,items:[{...review('a',1),date:'0001-01-01'},{...review('b',5),date:'9999-12-31'}]},
  {...availability,partySize:20,slots:Array.from({length:100},(_,i)=>({id:'s'+i,date:'2024-02-29',time:String(Math.floor(i/60)).padStart(2,'0')+':'+String(i%60).padStart(2,'0'),available:i%2===0}))},
  {...availability,partySize:1,slots:[{id:'first',date:'0001-01-01',time:'00:00',available:true},{id:'last',date:'9999-12-31',time:'23:59',available:false}]},
  {...thread,score:-1000000000,comments:[deep]},
  {...thread,score:1000000000,comments:Array.from({length:50},(_,i)=>({...comment('t'+i),score:i===0?0:null,replies:[{...comment('c'+i),score:-1}]}))},
  news,reviews,availability,thread
 ];
 for(const node of positives){const d=doc(node),result=api.validateDocument(d);assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(full(d),true);assert.equal(subsetFor(['base'])(d),true);}
 for(const node of [news,reviews,availability,thread])assert.equal(subsetFor(['learning'])(doc(node)),false,'Wrong domain must reject '+node.type);
 const dangerous='<img src=x onerror="globalThis.injected=true">😀 & <script>bad()</script>';
 const source={label:dangerous,url:'https://example.com/synthetic'};
 const literalNodes=[
  {...news,headline:dangerous,source,summary:dangerous,author:dangerous,tags:[dangerous.slice(0,30)],paragraphs:[dangerous]},
  {...reviews,label:dangerous,description:dangerous,source,items:[{id:'literal',author:dangerous,title:dangerous,body:dangerous,rating:null,url:'https://example.com/synthetic-review'}]},
  {...availability,title:dangerous,venue:dangerous,timeZoneLabel:dangerous,description:dangerous,source},
  {...thread,title:dangerous,author:dangerous,community:dangerous,body:dangerous,source,comments:[{id:'literal',author:dangerous,body:dangerous,replies:[{id:'reply',author:dangerous,body:dangerous}]}]}
 ];
 const literalDoc={version:'iui/1',body:literalNodes};assert.equal(api.validateDocument(literalDoc).ok,true);
 const dom=new JSDOM('<html lang="en"><body><main></main></body></html>',{pretendToBeVisual:true}),host=dom.window.document.querySelector('main');
 let controller;
 try{
  controller=api.mount(host,literalDoc);
  assert.equal(host.querySelectorAll('script,img,iframe,object,embed,[onerror],[onclick],em,strong').length,0);
  for(const selector of ['.iui-news-headline','.iui-news-paragraph','.iui-reviews-author','.iui-reviews-body','.iui-availability-venue','.iui-thread-body','.iui-thread-comment-body']){
   const nodes=host.querySelectorAll(selector);assert.ok(nodes.length,selector);for(const node of nodes)assert.equal(node.textContent,dangerous,selector);
  }
  for(const a of host.querySelectorAll('a')){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.match(a.textContent,/Opens in a new tab/);}
  assert.equal(dom.window.injected,undefined);
  controller.dispose();controller=undefined;
  const supplied={version:'iui/1',state:{unrelated:0},body:[
   {...news,paragraphs:['Synthetic full text']},
   {...reviews,items:[{...review('missing'),body:'Missing rating'},{...review('high',5),date:'2024-02-29'},{...review('tie',5),date:'2024-02-29'},review('low',1)]},
   {...availability,slots:[{id:'later',date:'2024-03-01',time:'19:00',available:true},{id:'first',date:'2024-02-29',time:'18:00',available:true},{id:'unavailable',date:'2024-02-29',time:'18:30',available:false}]},
   {...thread,score:0,comments:[{...comment('one'),score:null,replies:[{...comment('two'),score:-1}]}]}
  ]};
  const original=JSON.stringify(supplied);controller=api.mount(host,supplied);
  const details=[...host.querySelectorAll('details')];for(const d of details)d.open=true;
  const rows=[...host.querySelectorAll('.iui-reviews-item')],sort=host.querySelector('.iui-reviews-sort'),filter=host.querySelector('.iui-reviews-filter');
  const change=(select,value)=>{select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
  change(sort,'highest');assert.deepEqual([...host.querySelectorAll('.iui-reviews-item')].map(x=>x.dataset.reviewId),['high','tie','low','missing']);
  change(filter,'5');assert.deepEqual(rows.filter(x=>!x.hidden).map(x=>x.dataset.reviewId),['high','tie']);
  change(sort,'lowest');assert.deepEqual([...host.querySelectorAll('.iui-reviews-item')].map(x=>x.dataset.reviewId),['low','high','tie','missing']);
  change(filter,'unrated');assert.deepEqual(rows.filter(x=>!x.hidden).map(x=>x.dataset.reviewId),['missing']);
  assert.match(rows[0].textContent,/Rating not supplied/);
  const choices=host.querySelector('.iui-availability'),date=choices.querySelector('select'),clear=choices.querySelector('.iui-availability-clear');
  const button=id=>choices.querySelector('[data-slot-id="'+id+'"] button');
  assert.deepEqual([...choices.querySelectorAll('[data-slot-id]')].map(x=>x.dataset.slotId),['first','unavailable','later']);
  const events=[];let cancel=false;
  choices.addEventListener('iui:reservation-choice',event=>{events.push(event);if(cancel)event.preventDefault();});
  assert.equal(events.length,0);button('first').click();assert.equal(events.length,1);
  assert.deepEqual(events[0].detail,{componentId:'synthetic_choice',slotId:'first',date:'2024-02-29',time:'18:00',partySize:2,venue:'Fictional venue',timeZoneLabel:'Literal wall time'});
  assert.ok(Object.isFrozen(events[0].detail));assert.equal(events[0].bubbles,true);assert.equal(events[0].cancelable,true);assert.equal(events[0].composed,false);
  assert.match(choices.querySelector('.iui-availability-status').textContent,/No reservation has been made/);
  cancel=true;button('later').click();assert.equal(events.length,2);assert.equal(button('first').getAttribute('aria-pressed'),'true');assert.equal(button('later').getAttribute('aria-pressed'),'false');cancel=false;
  button('unavailable').click();assert.equal(events.length,2);
  change(date,'2024-03-01');assert.ok(button('first').closest('li').hidden);assert.match(choices.querySelector('.iui-availability-selection').textContent,/2024-02-29.*18:00.*Literal wall time/);
  button('first').click();assert.equal(events.length,2);
  controller.setState({unrelated:1});assert.equal(events.length,2);
  assert.equal(host.querySelector('.iui-availability'),choices);assert.equal(date.value,'2024-03-01');assert.equal(filter.value,'unrated');assert.equal(sort.value,'lowest');
  for(const detail of details){assert.ok(host.contains(detail));assert.equal(detail.open,true);}
  const html=host.innerHTML;assert.throws(()=>controller.update({...supplied,body:[{...news,published:'2023-02-29'}]}));assert.equal(host.innerHTML,html);
  clear.click();assert.equal(events.length,2);assert.equal(date.value,'2024-03-01');assert.equal(clear.getAttribute('aria-disabled'),'true');
  assert.deepEqual([...host.querySelectorAll('.iui-thread-score-value')].map(x=>x.textContent),['0','Not supplied','-1']);
  assert.equal(JSON.stringify(supplied),original);
  controller.dispose();controller=undefined;
 }finally{controller?.dispose();dom.window.close();}
 return{positiveBoundaries:positives.length,missingDomainNegatives:4,literalInjectionTypes:4,sourceLinks:'safe explicit links and literal text passed',localContract:'review exact filtering/stable missing-last sort; reservation event/cancel/filter/no-booking; disclosure/state preservation and atomic invalid update passed in JSDOM',browser:'not-run'};
}
