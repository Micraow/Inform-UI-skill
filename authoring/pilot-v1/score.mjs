import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url)),base=path.dirname(here);
const runtime=process.env.UI_PILOT_RUNTIME;
if(!runtime)throw Error('Set UI_PILOT_RUNTIME to the exact source-build path recorded below');
const skill=path.resolve(here,'../..');
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const references=await load(path.join(here,'reference-documents.json')),vectors=await load(path.join(here,'semantic-vectors.json'));
const lock=await load(path.join(skill,'candidates/questionnaire/runtime-lock.safe.json'));
const source=lock.files.find(x=>x.path==='dist/index.js'),bytes=await readFile(path.join(runtime,source.path));
assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
const api=await import(pathToFileURL(path.join(runtime,'dist/index.js')));
const {JSDOM,ResourceLoader,VirtualConsole}=createRequire(path.join(runtime,'package.json'))('jsdom');
const errors=[];let network=0;
class Deny extends ResourceLoader{fetch(){network++;throw Error('External resources prohibited');}}
function frozen(x){if(x&&typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v);}}
function containsRef(x,name){if(!x||typeof x!=='object')return false;if(x.$===name)return true;return Object.values(x).some(v=>Array.isArray(v)?v.some(a=>containsRef(a,name)):containsRef(v,name));}
function structural(doc,ref){
 assert.equal(doc.version,'iui/1');assert.equal(doc.body.length,1);const n=doc.body[0],e=ref.body[0];assert.equal(n.type,'questionnaire');
 for(const k of ['questionnaireId','version','hiddenValuePolicy','initialAnswers','defaults','sources','action','submitLabel','resetLabel'])assert.deepEqual(n[k],e[k],k);
 assert.equal(n.fields.length,e.fields.length);assert.ok(typeof n.title==='string'&&n.title.trim());
 for(let i=0;i<e.fields.length;i++){const a=n.fields[i],b=e.fields[i];for(const k of ['id','type','min','max','step','minLength','maxLength','options'])assert.deepEqual(a[k],b[k],`${b.id}.${k}`);assert.equal(a.required??false,b.required??false,`${b.id}.required`);assert.ok(typeof a.label==='string'&&a.label.trim());if(b.visibleWhen)assert.ok(a.visibleWhen,'visibility must be supplied');if(b.validWhen){assert.ok(a.validWhen);assert.ok(typeof a.validationMessage==='string'&&a.validationMessage.trim());}}
 assert.deepEqual(Object.keys(n.computed).sort(),Object.keys(e.computed).sort());if(e.questionnaireId==='display_panels')assert.ok(containsRef(n.computed.doubleSpanM,'spanM'),'named computed dependency required');
}
function semantic(node,id){
 const details=[];
 for(const v of vectors[id]){try{const r=api.evaluateQuestionnaire(node,{...node.initialAnswers,...v.patch}),s=r.snapshot;frozen(s);assert.equal(s.status,v.status);assert.deepEqual(s.computed,v.computed);assert.equal(s.version,node.version);assert.deepEqual(s.sources,node.sources);for(const [k,x]of Object.entries(v.validity))assert.equal(s.validity[k].status,x);for(const k of v.hidden){assert.equal(s.validity[k].status,'hidden');assert.equal(Object.hasOwn(s.answers,k),false);}details.push({name:v.name,ok:true});}catch(e){details.push({name:v.name,ok:false,error:e.message});}}
 return details;
}
const settle=async()=>{for(let i=0;i<4;i++)await new Promise(r=>setTimeout(r,0));};
async function interaction(doc,id){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const d=new JSDOM('<form><main></main></form>',{url:'https://pilot.example/',resources:new Deny(),virtualConsole:vc});const w=d.window,host=w.document.querySelector('main'),form=host.parentElement;
 const block=()=>{network++;throw Error('External service prohibited')};w.fetch=w.open=w.navigator.sendBeacon=block;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:block}});
 const adapters=[];const ctl=api.mount(host,doc,{styles:false,questionnaireActions:{reviewEquipment(ctx){adapters.push(ctx);return Promise.resolve();}}});
 const field=k=>host.querySelector(`[data-field="${k}"]`),button=k=>host.querySelector(`[data-action="${k}"]`),out=k=>host.querySelector(`[data-result="${k}"]`),status=()=>host.querySelector('.iui-questionnaire').dataset.status;
 const edit=(k,v)=>{const e=field(k);assert.ok(e,k);e.value=v===null?'':String(v);e.dispatchEvent(new w.Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 const events=[];host.addEventListener('iui:questionnaire',e=>{frozen(e.detail);assert.equal(e.cancelable,true);assert.equal(e.composed,false);events.push(e.detail);});
 const cancel=()=>host.addEventListener('iui:questionnaire',e=>e.preventDefault(),{once:true});
 try{
  if(id==='P01'){assert.equal(out('itemCount').textContent,'0');assert.equal(field('reused').value,'false');edit('units',3);assert.equal(out('itemCount').textContent,'9');edit('units','bad');assert.equal(status(),'invalid');assert.equal(out('itemCount'),null);edit('units',null);assert.equal(status(),'incomplete');edit('units',0);}
  if(id==='P02'){assert.equal(status(),'ready');edit('extra',0);assert.equal(out('totalHours').textContent,'2');edit('extra',null);assert.equal(status(),'ready');}
  if(id==='P03'){assert.equal(field('distanceKm').closest('.iui-questionnaire-field').hidden,true);edit('route','delivery');edit('distanceKm','8x');assert.equal(status(),'invalid');edit('route','pickup');assert.equal(status(),'ready');assert.equal(out('chargeUnits').textContent,'8');edit('route','delivery');assert.equal(field('distanceKm').value,'8x');assert.equal(status(),'invalid');edit('distanceKm',3.5);}
  if(id==='P04'){edit('power','wired');assert.equal(out('powerUnits').textContent,'12');edit('power','battery');assert.equal(field('cells').value,'');assert.equal(status(),'incomplete');edit('cells',2);}
  if(id==='P05'){button('submit').click();assert.equal(w.document.activeElement,field('people'));assert.equal(events.length,0);edit('people',5);assert.equal(status(),'invalid');edit('chairs',8);assert.equal(out('freeChairs').textContent,'3');}
  if(id==='P06'){assert.equal(out('doubleSpanM').textContent,'12');edit('widthM',.75);assert.equal(out('spanM'),null);assert.equal(status(),'invalid');edit('widthM',2);assert.equal(out('doubleSpanM').textContent,'16');}
  if(id==='P07'){edit('copies',7);cancel();button('reset').click();assert.equal(field('copies').value,'7');button('reset').click();assert.equal(field('copies').value,'1');assert.equal(field('labelText').value,'重置牌');form.reset();edit('copies',4);await settle();assert.equal(field('copies').value,'4');}
  if(id==='P08'){edit('needsCable',true);assert.equal(status(),'incomplete');edit('cableChecked',false);assert.equal(status(),'ready');assert.equal(field('cableChecked').value,'false');}
  cancel();const before=adapters.length;button('submit').click();assert.equal(events.at(-1).intent,'submit');assert.equal(events.at(-1).snapshot.status,'ready');assert.equal(adapters.length,before);assert.doesNotMatch(host.querySelector('.iui-questionnaire-status').textContent,/accepted locally/i);
  const snap=events.at(-1).snapshot;assert.equal(snap.version,doc.body[0].version);assert.deepEqual(snap.sources,doc.body[0].sources);
  if(id==='P08'){button('submit').click();await settle();assert.equal(adapters.length,1);assert.deepEqual(adapters[0].snapshot,snap);}
  return {ok:true,kind:'actual-JSDOM-mount',externalCalls:network};
 }catch(e){return {ok:false,kind:'actual-JSDOM-mount',error:e.message};}finally{ctl.dispose();w.close();}
}
const arg=process.argv[2],self=arg==='--self-test';if(!arg)throw Error('Pass --self-test or generated arm directory');
const rows=[];
for(const ref of references){const result={id:ref.id};let doc;try{doc=self?structuredClone(ref.document):JSON.parse(await readFile(path.join(arg,ref.id+'.json'),'utf8'));result.parse={ok:true};}catch(e){result.parse={ok:false,error:e.message};rows.push(result);continue;}
 try{const v=api.validateDocument(doc);result.schema={ok:v.ok,errors:v.ok?[]:v.errors};}catch(e){result.schema={ok:false,error:e.message};}
 if(!result.schema.ok){rows.push(result);continue;}
 try{structural(doc,ref.document);result.taskContract={ok:true};}catch(e){result.taskContract={ok:false,error:e.message};}
 result.semanticVectors=semantic(doc.body[0],ref.id);result.runtime=await interaction(doc,ref.id);rows.push(result);
}
const passed=(r)=>r.parse?.ok&&r.schema?.ok&&r.taskContract?.ok&&r.semanticVectors.every(x=>x.ok)&&r.runtime?.ok;
const report={selfTest:self,source:lock.source,results:rows,summary:{documents:8,parse:rows.filter(r=>r.parse?.ok).length,schema:rows.filter(r=>r.schema?.ok).length,taskContract:rows.filter(r=>r.taskContract?.ok).length,semanticVectorsPassed:rows.reduce((n,r)=>n+(r.semanticVectors??[]).filter(x=>x.ok).length,0),semanticVectorsTotal:31,runtime:rows.filter(r=>r.runtime?.ok).length,allStages:rows.filter(passed).length},externalCalls:network,jsdomErrors:errors,nativeExecuted:false,modelTokenCounts:null};
const output=process.argv[3];if(output)await writeFile(output,JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2));if(self&&(report.summary.allStages!==8||network||errors.length))process.exitCode=1;
