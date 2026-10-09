/** Source-only preflight. JSDOM structure/API checks do not run browser smoke. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './check-skill.mjs';
import {candidateDirectory,readJSON,verifyPinnedInputs,sha256} from './pending-inputs.mjs';
import {examples,verifyExampleInputs} from '../candidates/pending-batch/verify-browser.mjs';
assert.equal(process.argv.length,4,'Pass --library BUILT_FROZEN_CORE');assert.equal(process.argv[2],'--library');
const library=path.resolve(process.argv[3]);
const lock=await readJSON(path.join(root,candidateDirectory,'library-candidate-lock37.json'));
await verifyPinnedInputs(root,library,lock);
const require=createRequire(path.join(library,'package.json')), {JSDOM}=require('jsdom');
const {mount,compileHtml,validateDocument}=await import(pathToFileURL(path.join(library,'dist/index.js')).href);
const checks={
 'carousel-basic':{'.iui-carousel-shell':1,'.iui-carousel > *':3,'.iui-carousel-controls button':2},
 carousel:{'.iui-carousel-shell':4,'[id$="-main-rail"] input[data-bind=quantity]':1,'[id$="-empty-rail"] .iui-carousel-position':1},
 code:{'[id$="-main-code"] pre code':1,'[id$="-unknown-code"] code':1,'[id$="-unknown-code"] img, [id$="-unknown-code"] script':0},
 pie:{'.iui-pie':2,'.iui-pie:first-of-type svg':1},
 'checkbox-practice':{'form input[type=checkbox]':2,'input[data-bind=practice]':1},
 'markdown-subset':{'[data-iui=markdown] h1,[data-iui=markdown] h2,[data-iui=markdown] h3,[data-iui=markdown] h4,[data-iui=markdown] h5,[data-iui=markdown] h6':6,'[data-iui=markdown] img':0},
 'date-practice':{'form input[type=date]':2,'input[data-bind=practiceDate]':1,'input[data-bind=locked][type=checkbox]':1},
 tabs:{'[role=tab]':3,'[role=tab]:disabled':1},
 'tabs-local-state':{'[role=tab]':3,'[role=tab]:disabled':1,'input[type=number]':1,'.iui-overlay-popover':1},
 'fill-blank-practice':{'.iui-fill-blank input':3},
 'sentence-builder':{'.iui-sentence-builder':2,'.iui-sentence-builder:first-child [data-sentence-action=add]':5},
 checklist:{'.iui-checklist input[type=checkbox]':3,'.iui-checklist input:disabled':1,'input[data-bind=locked][type=checkbox]':1},
 'checklist-form':{'form .iui-checklist input[type=checkbox]':3,'form .iui-checklist input:disabled':1},
 'vocab-card':{'.iui-vocab-card':1,'[data-vocab-action=reveal]':1,'[data-vocab-action=again]':1,'[data-vocab-action=familiar]':1,'[data-vocab-action=reset]':1},
 rating:{'.iui-rating':2,'.iui-rating:first-of-type input[type=radio]':5,'input[data-bind=locked][type=checkbox]':1},
 favicon:{'.iui-favicon':4,'.iui-favicon:last-of-type img':0,'.iui-favicon-load':1},
 agenda:{'.iui-agenda':2,'[data-event-id=discussion] details':1,'[data-event-id=review]':1},
 'button-actions':{'.iui-button-host':1,'[id$="-set-count"]':1,'input[data-bind=locked][type=checkbox]':1},
 'restaurant-menu':{'.iui-menu':1,'.iui-menu summary':1,'.iui-menu input[type=search]':1,'.iui-menu select':1},
 'prompt-suggestions':{'.iui-suggestions-choice':5,'[data-suggestions-action=expand]':1,'[data-suggestions-action=clear]':1},
 'field-labels':{'[data-iui=label]':3,'input[type=range]':1,'input[data-bind=consent]':1},
 'person-profile':{'.iui-person-profile':2,'.iui-person-profile details':2,'.iui-person-profile details[open]':1},
 'writing-block':{'[id$="-main-draft"] textarea':1,'[id$="-readonly-draft"] textarea[readonly]':1},
 'news-article':{'[data-iui=news-article]':3,'[data-iui=news-article] details':2,'[data-iui=news-article] time':1},
 'entity-reviews':{'.iui-reviews':2,'.iui-reviews-filter':2,'.iui-reviews-sort':2,'[data-review-id=five] details':1},
 'restaurant-availability':{'.iui-availability':2,'[data-slot-id=unavailable] button:disabled':1,'.iui-availability-note':2},
 'reddit-thread-card':{'.iui-thread':2,'.iui-thread-replies':3,'.iui-thread-discussion':1},
 motion:{'.iui-motion':3,'.iui-motion-preview':2,'.iui-motion-stop':2},
 'email-draft':{'.iui-email-draft':3,'.iui-email-draft textarea':3,'.iui-email-draft textarea[readonly]':1},
 'task-expansion-card':{'.iui-task-expansion-card':2,'[id$="-main-plan"] input[type=checkbox]':3,'[id$="-main-plan"] details':2},
 'location-choice-request':{'.iui-location-choice':1,'.iui-location-choice-option':3,'.iui-location-choice-clear':1},
 'business-gallery':{'.iui-business-gallery':1,'.iui-business-gallery-item':3,'.iui-business-gallery img':1,'.iui-business-gallery .iui-image-consent button':2},
 'flight-option':{'.iui-flight-option':1,'.iui-flight-leg':2,'.iui-flight-option time':4,'.iui-flight-select':1,'.iui-flight-clear':1},
 'artist-upcoming-events':{'.iui-artist-events':2,'.iui-events-item':3,'.iui-events-filter':1},
 'finance-lists':{'.iui-asset-distribution':2,'.iui-transaction-list':2,'.iui-ledger-currency-group':3,'[data-transaction-id]':4},
 'onboarding-selection':{'.iui-onboarding':1,'.iui-onboarding input[type=checkbox]':3,'.iui-onboarding-continue':1},
 'supplied-trackers':{'.iui-tracker':2,'.iui-tracker-filter':2,'.iui-tracker-record':6,'.iui-tracker-endpoint':2,'.iui-tracker-missing':2}


};
let selectorChecks=0;
const documents=await verifyExampleInputs();
for(const entry of examples){
 const document=documents.get(entry.name), before=JSON.stringify(document);
 assert.equal(validateDocument(document).ok,true);
 const html=await compileHtml({...structuredClone(document),theme:'dark'},{assets:'inline',backend:'portable',lang:entry.lang});
 // No runScripts or resource loading: inspect the inert compile shell only.
 assert.equal([...html.matchAll(/<main id="iui">/g)].length,1);
 const serialized=html.match(/<script id="iui-data" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(serialized);assert.deepEqual(JSON.parse(serialized[1]),validateDocument({...document,theme:'dark'}).document);
 assert.equal(JSON.stringify(document),before);
 const dom=new JSDOM(`<html lang="${entry.lang}"><body><main id="iui"></main></body></html>`,{pretendToBeVisual:true});
 const host=dom.window.document.getElementById('iui');let controller;
 try{
  controller=mount(host,document,{styles:false});
  for(const [selector,count] of Object.entries(checks[entry.name])){assert.equal(host.querySelectorAll(selector).length,count,entry.name+': '+selector);selectorChecks++;}
  if(entry.name==='field-labels')for(const label of host.querySelectorAll('[data-iui=label]'))assert.ok(label.control&&label.control.id===label.htmlFor,'Native label target');
  if(entry.name==='code')assert.equal(host.querySelector('[id$="-main-code"] code').textContent,document.body.find(n=>n.id==='main-code').value);
  if(entry.name==='writing-block')assert.equal(host.querySelector('[id$="-main-draft"] textarea').value,document.body[0].value.replace(/\r\n?/g,'\n'));
  if(entry.name==='restaurant-availability')assert.ok(host.querySelector('.iui-availability-note').textContent.includes('no reservation is made'));
  const saved=host.firstElementChild;
  assert.throws(()=>controller.update({version:'iui/1',body:[{type:'not-a-real-node'}]}));
  assert.equal(host.firstElementChild,saved,'Invalid API replacement must be atomic');
  controller.dispose();controller.dispose();assert.equal(host.childElementCount,0);
 }finally{controller?.dispose();dom.window.close();}
 console.log('PASS source DOM/compile contract '+entry.name+' (JSDOM only)');
}
const plan=await readJSON(path.join(root,candidateDirectory,'consumer-plan.json'));
for(const item of plan.existingConsumerComparison.examples)assert.equal(sha256(await readFile(path.join(library,item.corePath))),item.sha256,'Existing consumer provenance '+item.name);
console.log(`PASS ${examples.length} source fixtures, ${selectorChecks} selector checks, 15 prior input hashes, atomic invalid update/idempotent disposal. Native browser interactions, focus, layout and screenshots NOT RUN.`);
