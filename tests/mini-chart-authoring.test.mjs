import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {loadRuntime} from '../scripts/lib.mjs';
const api=await loadRuntime();
const select=['base/layout','base/text','base/controls','base/icon','base/media','base/charts'];
const nodes=tree=>{const out=[];const visit=x=>{if(!x||typeof x!=='object')return;if(x.type==='element')out.push(x);for(const y of Object.values(x))Array.isArray(y)?y.forEach(visit):visit(y);};visit(tree);return out;};
test('fresh single-Skill mini-chart answer commits unchanged and updates all charts atomically',async()=>{
 const source=await readFile(new URL('./fixtures/mini-chart-authoring.openui',import.meta.url),'utf8');
 const html=await readFile(new URL('./fixtures/mini-chart-authoring.html',import.meta.url),'utf8');
 const config=JSON.parse(html.match(/<script id="inform-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(config.source,source);assert.deepEqual(config.select,select);assert.deepEqual(config.viewNames,[]);
 assert(html.includes('https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@web-chat-latest/cdn/next/inform-ui.global.js'));
 const runtime=api.createRuntime(api.createProfile({select,viewNames:[]}));
 const accepted=r=>{assert(r.ok,JSON.stringify(r.issues));return r.snapshot;};
 const charts=s=>nodes(s.tree).filter(n=>['MiniAreaChart','MiniBarChart','MiniLineChart'].includes(n.typeName));
 try{
  let s=accepted(runtime.commit(source));assert.equal(charts(s).length,3);
  for(const chart of charts(s)){assert.equal(chart.props.options.size,160);assert.equal(chart.props.values.length,6);}
  s=accepted(runtime.setState({$minimum:70}));for(const chart of charts(s))assert.equal(chart.props.values.length,1);
  s=accepted(runtime.setState({$minimum:80}));assert.equal(charts(s).length,0);
  assert(nodes(s.tree).some(n=>n.typeName==='Alert'&&n.props.title==='没有期次达到当前门槛'));
  const reset=nodes(s.tree).find(n=>n.typeName==='Button'&&n.props.label==='重置为全部六期');
  s=accepted(runtime.dispatchLocal(reset.props.onPress));assert.equal(s.state.$minimum,0);for(const chart of charts(s))assert.equal(chart.props.values.length,6);
 }finally{runtime.dispose();}
});
