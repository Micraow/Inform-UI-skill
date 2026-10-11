import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import path from 'node:path';
import {prepareSuppliedConsumer} from '../../scripts/verify-supplied-consumer.mjs';
import {buildCases} from './cases.mjs';import {buildCases as motorCases} from '../restored-motorsport/cases.mjs';
const directory=import.meta.dirname,read=async name=>JSON.parse(await readFile(path.join(directory,name)));
export async function verify(library) {
  const input=await read('examples/supplied-boxscores.json'),motor=await read('../restored-motorsport/examples/supplied-motorsport.json'),players=await read('../restored-player-summaries/examples/supplied-players.json'),ledger=await read('../restored-ledger-records/examples/supplied-ledger.json');
  const cases=buildCases(input),oldCases=motorCases(motor),combined={version:'iui/1',title:'Independent supplied sports and account records',body:[...input.body,...motor.body,...players.body,...ledger.body]};
  const {check,finish}=await prepareSuppliedConsumer(library,directory,{protocolNodes:128,canonicalId:'nba-game-boxscore',requiredFiles:['src/core/boxscores.ts','src/renderer/boxscores.ts','src/renderer/boxscores.css'],owner:'sports',types:['nba-game-boxscore','cricket-match-boxscore'],addedDefinitions:['NbaGameBoxscoreNode','CricketMatchBoxscoreNode'],baselineFile:'schema-baseline-126.json',previousLock:'../restored-motorsport/runtime-lock.safe.json',deltaFile:'runtime-delta-126.json',styleFile:'src/renderer/boxscores.css',cases:[{name:'boxscores',...cases},{name:'motorsport',...oldCases}],document:combined});
  const change=(dom,el,value)=>{el.value=value;el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT'?'change':'input'));},flush=async()=>{await Promise.resolve();await Promise.resolve();};
  const rows=table=>[...table.querySelectorAll('tbody tr:not([hidden])')].map(row=>row.querySelector('th').textContent);
  await check('Scores, period zeros, unknowns and supplied status stay distinct',({host})=>{
    const r=host.querySelector('.iui-nba-boxscore');assert.match(r.querySelector('[data-team-id=all]').textContent,/999/);assert.match(r.querySelector('[data-team-id=harbor]').textContent,/Not supplied/);
    assert.deepEqual([...r.querySelector('.iui-boxscore-periods tbody tr').querySelectorAll('td')].map(c=>c.textContent),['0','Not supplied']);assert.match(r.textContent,/Outcome was not supplied/);
    assert.equal(r.querySelector('time').dateTime,'2028-02-29T18:45+05:30');
  });
  await check('A team named All has a distinct selector ID and lineup filters combine',({dom,host})=>{
    const r=host.querySelector('.iui-nba-boxscore'),[team,role]=r.querySelectorAll('select'),table=r.querySelector('.iui-basketball-players');
    change(dom,team,'t0');assert.deepEqual(rows(table),['River Sample','Morgan Sample','Unknown Sample']);change(dom,role,'bench');assert.deepEqual(rows(table),['Morgan Sample']);
    change(dom,r.querySelector('input'),'absent');assert.deepEqual(rows(table),[]);r.querySelector('.iui-boxscore-reset').click();assert.equal(rows(table).length,5);
  });
  await check('Basketball stable sorting preserves supplied ties, negative plus-minus and disclosure identity',({dom,host})=>{
    const r=host.querySelector('.iui-nba-boxscore'),table=r.querySelector('.iui-basketball-players'),detail=table.querySelector('details');detail.open=true;
    change(dom,r.querySelectorAll('select')[2],'points');assert.deepEqual(rows(table),['Second River Sample','River Sample','Morgan Sample','Zero Sample','Unknown Sample']);
    assert.equal(table.querySelector('details'),detail);assert.equal(detail.open,true);assert.equal(table.querySelector('thead th[aria-sort]').textContent,'Points');
    const rowByLabel=label=>[...table.querySelectorAll('tbody tr')].find(row=>row.querySelector('th').textContent===label);
    assert.equal(rowByLabel('River Sample').children[10].textContent,'-5');assert.equal(rowByLabel('Zero Sample').children[4].textContent,'0');assert.equal(rowByLabel('Unknown Sample').children[4].textContent,'Not supplied');
  });
  await check('Cricket source text and independent totals/rates are never recomputed',({host})=>{
    const r=host.querySelector('.iui-cricket-boxscore'),first=r.querySelector('[data-innings-id=first]');assert.match(first.textContent,/999/);assert.match(first.textContent,/19\.5/);assert.match(first.textContent,/17/);
    assert.equal(first.querySelector('.iui-cricket-batting tbody tr').children[6].textContent,'43.21');assert.equal(first.querySelector('.iui-cricket-bowling tbody tr').children[5].textContent,'1.25');assert.match(r.textContent,/Live \(supplied status\)/);
  });
  await check('Cricket innings and numeric sort directions stay local',({dom,host})=>{
    const r=host.querySelector('.iui-cricket-boxscore'),[innings,batting,bowling]=r.querySelectorAll('select'),first=r.querySelector('[data-innings-id=first]');
    change(dom,batting,'runs');assert.deepEqual(rows(first.querySelector('.iui-cricket-batting')),['River Sample','Morgan Sample','Unknown Sample']);
    change(dom,bowling,'economy');assert.deepEqual(rows(first.querySelector('.iui-cricket-bowling')),['Bowling Zero Sample','Bowling River Sample','Unknown Bowler']);
    change(dom,innings,'i1');assert.equal(first.hidden,true);assert.match(r.querySelector('[data-innings-id=second]').textContent,/Not supplied/);r.querySelector('.iui-boxscore-reset').click();assert.equal(innings.value,'i0');
  });
  await check('Eight-reader parent reset respects cancellation, newer edits and selected session',async({dom,host})=>{
    const form=dom.window.document.querySelector('form'),queries=[...host.querySelectorAll('input[type=search]')],session=host.querySelector('.iui-f1-races li button');assert.equal(queries.length,8);session.click();for(const q of queries)change(dom,q,'draft');
    form.addEventListener('reset',e=>e.preventDefault(),{once:true});form.reset();await flush();assert.ok(queries.every(q=>q.value==='draft'));
    form.reset();change(dom,queries[0],'Morgan');await flush();assert.equal(queries[0].value,'Morgan');assert.ok(queries.slice(1).every(q=>q.value===''));assert.equal(session.getAttribute('aria-pressed'),'true');assert.deepEqual([...new dom.window.FormData(form)],[]);
  });
  for(const selector of ['.iui-nba-boxscore','.iui-cricket-boxscore'])await check('New input wins through a reentrant getter '+selector,({dom,host})=>{
    const r=host.querySelector(selector),q=r.querySelector('input'),descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value');let first=true;
    Object.defineProperty(q,'value',{configurable:true,get(){if(first){first=false;descriptor.set.call(this,'Morgan');this.dispatchEvent(new dom.window.Event('input'));return 'obsolete';}return descriptor.get.call(this);},set(v){descriptor.set.call(this,v);}});q.dispatchEvent(new dom.window.Event('input'));assert.equal(q.value,'Morgan');
    const table=r.querySelector(selector==='.iui-nba-boxscore'?'.iui-basketball-players':'.iui-cricket-batting');assert.deepEqual(rows(table),['Morgan Sample']);
  });
  for(const selector of ['.iui-nba-boxscore','.iui-cricket-boxscore'])await check('Transferred table body is not rewritten '+selector,({dom,host})=>{
    const r=host.querySelector(selector),table=r.querySelector(selector==='.iui-nba-boxscore'?'.iui-basketball-players':'.iui-cricket-batting'),body=table.querySelector('tbody'),other=dom.window.document.createElement('table');r.append(other);other.append(body);const before=body.innerHTML;
    change(dom,r.querySelector('input'),'no match');assert.equal(body.parentElement,other);assert.equal(body.innerHTML,before);
  });
  for(const selector of ['.iui-nba-boxscore','.iui-cricket-boxscore'])for(const topology of ['normal','nested-shadow'])await check('Observed removal and same-turn restoration permanently retire '+selector+' '+topology,({dom,host,controller,movedAncestor})=>{
    const root=host.querySelector(selector),moved=topology==='normal'?root:movedAncestor,parent=moved.parentNode,next=moved.nextSibling;
    moved.remove();parent.insertBefore(moved,next);const before=root.innerHTML;
    change(dom,root.querySelector('input'),'no matching supplied record');assert.equal(root.innerHTML,before,'Restoration must not revive the prior owner');
    controller.update(combined);const fresh=host.querySelector(selector);assert.notEqual(fresh,root);const initial=fresh.innerHTML;change(dom,fresh.querySelector('input'),'no matching supplied record');assert.notEqual(fresh.innerHTML,initial,'Explicit update creates a working new owner');
  },combined,topology);
  await check('Session activation is single-flight before an accessibility getter reenters',({dom,host})=>{
    const button=host.querySelector('.iui-f1-races li button'),get=button.getAttribute.bind(button);let reentered=false,count=0;
    button.getAttribute=function(name){if(name==='aria-disabled'&&!reentered){reentered=true;button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));}return get(name);};
    host.addEventListener('iui:motorsport-session',()=>count++);button.click();assert.equal(reentered,true);assert.equal(count,1);
  });
  await check('Invalid source references reject atomically and replacement retires prior filters',({dom,host,controller})=>{
    const before=host.innerHTML;assert.throws(()=>controller.update(cases.negatives.find(([name])=>name==='unknown innings team')[1]));assert.equal(host.innerHTML,before);
    const q=host.querySelector('.iui-nba-boxscore input');controller.update(motor);const next=host.innerHTML;change(dom,q,'obsolete');assert.equal(host.innerHTML,next);
  });
  await check('Literal labels are readable text without creating executable media',({host})=>{assert.equal(host.querySelector('img,script,iframe'),null);assert.match(host.textContent,/<img src=untrusted>/);},cases.positives.find(([name])=>name==='literal labels and details')[1]);
  return finish();
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1],'Pass --library /absolute/runtime/path');console.log(JSON.stringify(await verify(process.argv[i+1]),null,2));}
