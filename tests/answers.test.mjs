import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {skillRoot,json,loadRuntime,htmlDocument,validateSource} from '../scripts/lib.mjs';

const api=await loadRuntime();
const cases=await json(join(skillRoot,'examples/examples.json'));
const source=async id=>readFile(join(skillRoot,'examples',id+'.openui'),'utf8');
const ok=result=>{assert.equal(result.ok,true,JSON.stringify(result));return result.snapshot;};
function nodes(root){const result=[];function visit(value){if(!value||typeof value!=='object')return;if(value.type==='element')result.push(value);for(const nested of Object.values(value))if(nested!==value)if(Array.isArray(nested))nested.forEach(visit);else if(nested&&typeof nested==='object')visit(nested);}visit(root);return result;}
const find=(snapshot,name,predicate=()=>true)=>nodes(snapshot.tree).find(node=>node.typeName===name&&predicate(node));
const textOf=snapshot=>nodes(snapshot.tree).flatMap(node=>[node.props.content,node.props.title,node.props.description,node.props.label].filter(x=>typeof x==='string')).join('\n');
async function runtimeFor(id){const example=cases.find(x=>x.id===id),runtime=api.createRuntime(api.createProfile({select:example.select,...example.viewNames?{viewNames:example.viewNames}:{}}));return{runtime,snapshot:ok(runtime.commit(await source(id)))};}

for(const example of cases)test(example.id+' is a complete real-profile final program and HTML source matches',async()=>{
 const dsl=await source(example.id),result=validateSource(api,dsl,example.select,example.viewNames);
 assert.equal(result.snapshot.tree.typeName,'Stack');
 assert(nodes(result.snapshot.tree).length>10);
 assert(nodes(result.snapshot.tree).some(node=>node.typeName==='Heading'&&node.props.level===1));
 const html=await readFile(join(skillRoot,'examples',example.id+'.html'),'utf8');
 const encoded=html.match(/<script id="inform-document" type="application\/json">([\s\S]*?)<\/script>/)[1];
 assert.equal(JSON.parse(encoded).source,dsl);
 assert.deepEqual(JSON.parse(encoded).select,example.select);
 assert(html.includes('../assets/runtime/inform-ui.global.js'));
});

test('budget choice uses captured item, responds to a reduced budget, rejects stale events and resets atomically',async()=>{
 const {runtime,snapshot}=await runtimeFor('budget-choice');
 try{
  const choose=find(snapshot,'Button',node=>node.props.label==='选择舒适组合').props.onPress;
  let s=ok(runtime.dispatchLocal(choose));assert.equal(s.state.$chosen,'comfort');assert(textOf(s).includes('20 元'));
  s=ok(runtime.setState({$budget:180,$order:'desc'}));assert.equal(s.state.$chosen,'comfort');assert(textOf(s).includes('选择超出新预算'));
  assert.equal(runtime.dispatchLocal(choose).ok,false);
  assert.equal(nodes(s.tree).filter(n=>n.typeName==='Button'&&n.props.label.startsWith('选择')).length,1);
  s=ok(runtime.dispatchLocal(find(s,'Button',n=>n.props.label==='重置选择与预算').props.onPress));
  assert.deepEqual({...s.state},{$budget:300,$order:'asc',$chosen:''});
  s=ok(runtime.setState({$budget:100}));assert(textOf(s).includes('当前没有可选组合'));
 }finally{runtime.dispose();}
});

test('filter and sort feed identical chart/table data and have a meaningful empty state',async()=>{
 const {runtime,snapshot}=await runtimeFor('filter-sort-chart');
 const same=s=>{
  const chart=find(s,'BarChart'),table=find(s,'Table');
  assert.deepEqual(chart.props.labels,table.props.rows.map(row=>row.name));
  assert.deepEqual(chart.props.series[0].values,table.props.rows.map(row=>row.score));
  return table.props.rows;
 };
 try{
  assert.deepEqual(same(snapshot).map(x=>x.score),[91,82,76,67]);
  let s=ok(runtime.setState({$direction:'asc',$minimum:76}));assert.deepEqual(same(s).map(x=>x.score),[76,82,91]);
  const slider=find(s,'Slider');s=ok(runtime.setBinding(slider.bindings.value,100));
  assert.equal(find(s,'BarChart'),undefined);assert.equal(find(s,'Table'),undefined);assert(textOf(s).includes('没有活动达到这个阈值'));
  const before=runtime.getSnapshot();assert.equal(runtime.setState({$minimum:'bad'}).ok,false);assert.equal(runtime.getSnapshot(),before);
 }finally{runtime.dispose();}
});

test('composed explanation updates real View data and conditionally hides method children',async()=>{
 const {runtime,snapshot}=await runtimeFor('composed-explanation');
 try{
  assert.equal(find(snapshot,'MetricView',n=>n.props.data.label==='平均数').props.data.value,7.5);
  assert(find(snapshot,'MathView'));assert(find(snapshot,'CitationView'));
  let s=ok(runtime.setState({$largest:80}));
  assert.equal(find(s,'MetricView',n=>n.props.data.label==='平均数').props.data.value,24.5);
  assert.equal(find(s,'MetricView',n=>n.props.data.label==='中位数').props.data.value,7);
  assert.deepEqual(find(s,'BarChart').props.series[0].values,[4,6,8,80]);
  s=ok(runtime.setBinding(find(s,'Switch').bindings.checked,false));
  assert.equal(find(s,'MathView'),undefined);assert.equal(find(s,'StepsView'),undefined);assert(find(s,'DetailsView'));
 }finally{runtime.dispose();}
});

test('HTML serialization cannot terminate its data script; unsafe runtime protocols are rejected',()=>{
 const source='root = Stack([Text("</script><script>bad()</script>&\\\"")])';
 const html=htmlDocument({source,title:'<img src=x onerror=bad()>',runtime:'./runtime.js?a=1&b=2'});
 assert(!html.includes('<img src=x'));
 assert(!html.includes('<script>bad()'));
 const config=JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.equal(config.source,source);
 for(const runtime of ['javascript:alert(1)','data:text/javascript,x','//unverified.example/x.js'])assert.throws(()=>htmlDocument({source,runtime}));
});

test('machine-generated catalog, signatures and runtime lock describe these exact bytes',async()=>{
 const manifest=api.createProfile().manifest(),catalog=await json(join(skillRoot,'generated/catalog.json')),lock=await json(join(skillRoot,'generated/runtime-lock.json')),signatures=await json(join(skillRoot,'generated/signatures.json'));
 assert.equal(catalog.componentCount,manifest.components.length);assert.equal(lock.componentCount,manifest.components.length);
 assert.equal(catalog.modules.flatMap(m=>m.components).length,manifest.components.length);
 assert.deepEqual(Object.keys(signatures).sort(),manifest.components.map(c=>c.name).sort());
 for(const component of manifest.components)assert.deepEqual(signatures[component.name].orderedProps,component.orderedProps);
 for(const [name,expected]of Object.entries(lock.bundles)){
  const bytes=await readFile(join(skillRoot,'assets/runtime',name));assert.equal(bytes.length,expected.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256);
 }
 const prompt=api.createProfile({select:['base/layout','base/icon']}).prompt({bindings:true,builtinFunctions:true});
 assert(prompt.split('\n').find(line=>line.startsWith('Icon(')).length<2500);
 assert(!/available steps \([^)]*@(?:OpenUrl|ToAssistant|Run)/.test(prompt));
});

test('strict parser refuses JS evaluation, unsupported host actions and incomplete final input',()=>{
 const profile=api.createProfile({select:['base/layout','base/controls']}),runtime=api.createRuntime(profile);
 try{
  for(const input of ['root = Stack([Text(eval("1"))])','root = Stack([Button("Send",@ToAssistant("hello"))])','root = Stack([Text("unfinished','root = Stack([Text(1/0)])'])assert.equal(runtime.commit(input).ok,false,input);
  assert.equal(runtime.commit('root = Stack([Text("Safe")])').ok,true);
 }finally{runtime.dispose();}
});

test('CLI generates and validates a standalone answer folder without installing dependencies',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'inform-answer-test-'));
 try{
  const cli=join(skillRoot,'scripts/inform-answer.mjs');
  const checked=spawnSync(process.execPath,['--disallow-code-generation-from-strings',cli,'check',join(skillRoot,'examples/budget-choice.openui'),'--select','base/layout,base/controls'],{encoding:'utf8'});
  assert.equal(checked.status,0,checked.stderr);assert.equal(JSON.parse(checked.stdout).ok,true);
  const built=spawnSync(process.execPath,[cli,'build',join(skillRoot,'examples/budget-choice.openui'),'--out',join(dir,'answer.html'),'--select','base/layout,base/controls'],{encoding:'utf8'});
  assert.equal(built.status,0,built.stderr);assert.equal(JSON.parse(built.stdout).ok,true);
  assert((await readFile(join(dir,'inform-ui.global.js'))).length>1000);
  assert((await readFile(join(dir,'THIRD_PARTY_NOTICES.txt'),'utf8')).includes('MIT'));
  assert((await readFile(join(dir,'answer.html'),'utf8')).includes('InformUI.mount'));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('fresh-authoring acceptance fixture supports projected Table rows, forward references and retained selection',async()=>{
 const runtime=api.createRuntime(api.createProfile({select:['base/layout','base/controls','base/charts']}));
 try{
  const dsl=await readFile(join(skillRoot,'tests/fixtures/authoring-activity-choice.openui'),'utf8');
  let s=ok(runtime.commit(dsl));
  assert.deepEqual(find(s,'Table').props.rows.map(row=>row.participants),[32,20,18,16]);
  const button=find(s,'Button',node=>node.props.label==='选择：写作课');s=ok(runtime.dispatchLocal(button.props.onPress));
  s=ok(runtime.setState({$minimum:80,$direction:'asc'}));assert.equal(s.state.$chosen,'writing');
  assert(textOf(s).includes('当前选择已不满足筛选条件'));
  assert.deepEqual(find(s,'Table').props.rows,[{name:'读书会',participants:18,score:91}]);
  s=ok(runtime.setState({$minimum:100}));assert.equal(find(s,'Table'),undefined);
  assert(textOf(s).includes('没有符合条件的活动'));
 }finally{runtime.dispose();}
});

test('the generated local Action example is itself valid final DSL',()=>{
 const profile=api.createProfile({select:['base/layout','base/controls']}),prompt=profile.prompt({bindings:true,builtinFunctions:true});
 const sample=prompt.match(/Example:\n(\$[^\n]*\nroot = [^\n]*)/);
 assert(sample,'Expected the generated local Action example');
 const runtime=api.createRuntime(profile);
 try{let s=ok(runtime.commit(sample[1]));assert.equal(s.state.$count,0);s=ok(runtime.dispatchLocal(find(s,'Button',n=>n.props.label==='Add one').props.onPress));assert.equal(s.state.$count,1);}finally{runtime.dispose();}
});

test('a requested View brings only its restricted child-View dependencies',()=>{
 const profile=api.createProfile({select:['base/layout','views/content'],viewNames:['TabGroupView']});
 assert(profile.components.TabGroupView);assert(profile.components.TabPanelView);assert.equal(profile.components.StepsView,undefined);
 assert.deepEqual(profile.manifest().components.filter(c=>c.moduleId==='views/content').map(c=>c.name).sort(),['TabGroupView','TabPanelView']);
});
