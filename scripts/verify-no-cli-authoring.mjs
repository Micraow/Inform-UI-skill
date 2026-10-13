#!/usr/bin/env node
// The fixture was authored using only the standalone core SKILL, without CLI,
// runtime access, other component documentation, or validation feedback.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const index=process.argv.indexOf('--runtime-dir');
if(index<0||!process.argv[index+1])throw Error('Pass --runtime-dir verified-dist-directory');
const api=await import(pathToFileURL(join(resolve(process.argv[index+1]),'node.mjs')).href);
const html=await readFile(join(root,'tests/no-cli-authored.html'),'utf8');
const config=JSON.parse(html.match(/<script id="inform-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const profile=api.createProfile({select:config.select,viewNames:config.viewNames});
const nodes=root=>{const out=[];const walk=value=>{if(!value||typeof value!=='object')return;if(value.type==='element')out.push(value);for(const child of Object.values(value))Array.isArray(child)?child.forEach(walk):walk(child);};walk(root);return out;};
const runtime=api.createRuntime(profile);
const accepted=result=>{assert(result.ok,JSON.stringify(result));return result.snapshot;};
try{
 let snapshot=accepted(runtime.commit(config.source));
 assert.equal(nodes(snapshot.tree).filter(n=>n.typeName==='BarChart').length,2);
 snapshot=accepted(runtime.setState({$maximum:55,$direction:'desc'}));
 assert.deepEqual(nodes(snapshot.tree).find(n=>n.typeName==='Table').props.rows.map(row=>row.name),['公园线','河边线']);
 const choose=nodes(snapshot.tree).find(n=>n.typeName==='Button'&&n.props.label==='选择 公园线');
 snapshot=accepted(runtime.dispatchLocal(choose.props.onPress));assert.equal(snapshot.state.$chosen,'park');
 assert(nodes(snapshot.tree).some(n=>n.typeName==='Alert'&&n.props.title==='当前选择：公园线'));
 snapshot=accepted(runtime.setState({$maximum:30}));
 assert.equal(snapshot.state.$chosen,'park');
 assert(!nodes(snapshot.tree).some(n=>n.typeName==='BarChart'));
 assert(nodes(snapshot.tree).some(n=>n.typeName==='Alert'&&n.props.title==='没有匹配的路线'));
 assert(nodes(snapshot.tree).some(n=>n.typeName==='Alert'&&n.props.title==='当前有效选择：无'));
 const reset=nodes(snapshot.tree).find(n=>n.typeName==='Button'&&n.props.label==='恢复全部并清空选择');
 snapshot=accepted(runtime.dispatchLocal(reset.props.onPress));
 assert.equal(snapshot.state.$maximum,75);assert.equal(snapshot.state.$direction,'asc');assert.equal(snapshot.state.$chosen,'');
 assert.equal(nodes(snapshot.tree).find(n=>n.typeName==='Table').props.rows.length,3);
 const report={format:'inform-no-cli-authoring-check/1',fixture:'tests/no-cli-authored.html',fixtureSha256:createHash('sha256').update(html).digest('hex'),authorInputs:'Only core SKILL.md and fictional three-route task; no CLI/runtime/other docs or validation feedback',firstCommitPassed:true,filterSortPassed:true,selectionActionPassed:true,invalidSelectionExplicit:true,emptyStatePassed:true,resetPassed:true,codeGenerationFromStrings:process.execArgv.includes('--disallow-code-generation-from-strings')?'disabled':'not disabled in this invocation',browser:'Not established by this Node check',scope:'One independent authoring trial; not a model-wide reliability benchmark'};
 await writeFile(join(root,'tests/no-cli-authoring-result.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{runtime.dispose();}
