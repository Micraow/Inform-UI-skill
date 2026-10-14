#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {webChatPrompt,promptProseProjection} from './prompt-projection.mjs';
import {assertPublicationEvidence} from './publication-evidence.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--runtime-dir');if(arg<0||!process.argv[arg+1])throw Error('Pass --runtime-dir verified-dist-directory');
const runtimeDir=resolve(process.argv[arg+1]),api=await import(pathToFileURL(join(runtimeDir,'node.mjs')).href);
const readJSON=async path=>JSON.parse(await readFile(path,'utf8'));
const build=await readJSON(join(root,'BUILD.json')),definitions=await readJSON(join(root,'source/profiles.json'));
assert.equal(build.promptProseProjection,promptProseProjection);
const bytes=await readFile(join(runtimeDir,'inform-ui.global.js'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),build.runtimeSha256);
assert.equal(createHash('sha256').update(await readFile(join(runtimeDir,'node.mjs'))).digest('hex'),build.nodeRuntimeSha256);
for(const [name,hash]of [['node.mjs',build.nodeRuntimeSha256],['inform-ui.global.js',build.runtimeSha256]])assert.equal(createHash('sha256').update(await readFile(join(root,'assets/runtime',name))).digest('hex'),hash,'Bundled Agent runtime must match generated profiles');
const runtimeLock=await readJSON(join(root,'generated/runtime-lock.json'));assert.equal(runtimeLock.sourceRef,build.sourceCommit);assert.equal(runtimeLock.bundles['node.mjs'].sha256,build.nodeRuntimeSha256);
assertPublicationEvidence(build);
assert.equal(build.verificationLockOnly,true);assert.equal(build.runtimeChannel,'latest');
const checks=[];
function nodes(root){const out=[];const walk=value=>{if(!value||typeof value!=='object')return;if(value.type==='element')out.push(value);for(const child of Object.values(value))Array.isArray(child)?child.forEach(walk):walk(child);};walk(root);return out;}
const accepted=result=>{assert(result.ok,JSON.stringify(result));return result.snapshot;};
for(const def of definitions){
 const dir=join(root,def.outputDirectory),config=await readJSON(join(dir,'profile.json'));
 const profile=api.createProfile({select:def.select,viewNames:def.viewNames});
 const manifest=profile.manifest(),stored=await readJSON(join(dir,'manifest.json'));
 assert.deepEqual(stored,manifest);
 assert.deepEqual(await readJSON(join(dir,'schema.json')),profile.schema);
 assert.equal(await readFile(join(dir,'prompt.txt'),'utf8'),webChatPrompt(profile.prompt({bindings:true,builtinFunctions:true}))+'\n');
 assert.deepEqual(config.select,def.select);assert.deepEqual(config.viewNames,def.viewNames);
 assert.equal(config.sourceCommit,build.sourceCommit);assert.equal(config.runtimeSha256,build.runtimeSha256);assert.equal(config.runtimeURL,build.runtimeURL);
 assert.equal(config.uiComponents,Object.keys(profile.components).length);
 assert.equal(config.dataConstructors,Object.keys(profile.data).length);
 assert.deepEqual(manifest.components.filter(c=>c.moduleId.startsWith('views/')).map(c=>c.name).sort(),[...def.viewNames].sort());
 const skill=await readFile(join(root,def.skillPath),'utf8'),html=await readFile(join(dir,'minimal.html'),'utf8'),source=await readFile(join(dir,'minimal.openui'),'utf8');
 assert.equal(source,await readFile(join(root,'source',def.source),'utf8'));
 assert(skill.includes(webChatPrompt(profile.prompt({bindings:true,builtinFunctions:true}))));
 assert(!skill.includes('FIRST line (for optimal streaming)'));
 const embedded=[...skill.matchAll(/```html\n([\s\S]*?)\n```/g)];assert.equal(embedded.length,1);assert.equal(embedded[0][1],html.trim());
 const htmlConfig=JSON.parse(html.match(/<script id="inform-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual(htmlConfig,{source,select:def.select,viewNames:def.viewNames,theme:'light'});
 const src=html.match(/<script src="([^"]+)"><\/script>/)[1].replaceAll('&amp;','&');
 assert.equal(src,build.runtimeURL);assert(!src.includes(build.sourceCommit));assert(!html.includes(build.sourceCommit));assert(!skill.includes(build.sourceCommit));
 assert.equal((html.match(/<script/g)||[]).length,3);
 assert(skill.includes('无需终端、CLI、npm、React 工程'));
 if(def.skillPath==='SKILL.md'){
  assert(skill.includes('Agent 按需扩展'));assert(skill.includes('scripts/inform-answer.mjs'));
  const webSkill=await readFile(join(dir,'SKILL.md'),'utf8');
  assert(webSkill.includes('name: inform-web-chat-core'));
  assert(webSkill.includes(webChatPrompt(profile.prompt({bindings:true,builtinFunctions:true}))));
  assert(webSkill.includes(html.trim()));
 }
 const iconLine=profile.prompt().split('\n').find(line=>line.startsWith('Icon('));assert(iconLine.length<2000);
 const allowedIcons=new Set(profile.schema.$defs.Icon.properties.name.enum);for(const name of config.glyphShortlist)assert(allowedIcons.has(name),name);
 const runtime=api.createRuntime(profile);
 try{
  let s=accepted(runtime.commit(source));assert.equal(s.tree.typeName,'Stack');
  assert(nodes(s.tree).some(n=>n.typeName==='Heading'&&n.props.level===1));
  if(def.id==='web-chat-core'){
   assert(nodes(s.tree).some(n=>n.typeName==='BarChart'));
   s=accepted(runtime.setState({$minimum:100}));assert(!nodes(s.tree).some(n=>n.typeName==='BarChart'));
   assert(nodes(s.tree).some(n=>n.typeName==='Alert'&&n.props.title==='当前没有匹配结果'));
   const button=nodes(s.tree).find(n=>n.typeName==='Button');s=accepted(runtime.dispatchLocal(button.props.onPress));assert.equal(s.state.$minimum,60);
   assert.equal(runtime.commit('root = Stack([MetricView({label:"Unavailable",value:1})])').ok,false);
  }else{
   for(const name of def.viewNames)assert(nodes(s.tree).some(n=>n.typeName===name),'Starter must demonstrate '+name);
   const code=nodes(s.tree).find(n=>n.typeName==='CodeView');assert.equal(code.props.data.highlight,true);assert.equal(code.props.data.copy,true);assert(code.props.data.value.includes('\n'));
   s=accepted(runtime.setState({$largest:80,$showMethod:false}));
   assert.equal(nodes(s.tree).find(n=>n.typeName==='MetricView'&&n.props.data.label==='平均数').props.data.value,24.5);
   assert(!nodes(s.tree).some(n=>n.typeName==='StepsView'));
   assert.equal(runtime.commit('root = Stack([WeatherView({})])').ok,false);
  }
 }finally{runtime.dispose();}
 checks.push({profile:def.id,uiComponents:config.uiComponents,dataConstructors:config.dataConstructors,contractEquality:true,htmlMatchesSkill:true,finalCommit:true,stateTransitions:true,unselectedViewsRejected:true,glyphNamesValidated:true});
}
const report={format:'inform-web-chat-verification/1',publicationReady:build.publicationReady,validationStage:build.validationStage,sourceCommit:build.sourceCommit,runtimeSha256:build.runtimeSha256,codeGenerationFromStrings:process.execArgv.includes('--disallow-code-generation-from-strings')?'disabled':'not disabled in this invocation',profiles:checks,browser:'not run by this script',externalRuntimeURL:build.runtimeHTTP?{method:build.runtimeHTTP.method,status:build.runtimeHTTP.status,contentType:build.runtimeHTTP.contentType,accessControlAllowOrigin:build.runtimeHTTP.accessControlAllowOrigin,publishedBlobMatchesSnapshot:build.runtimeHTTP.publishedSha256===build.runtimeSha256,cacheState:build.runtimeHTTP.cacheState??'observed snapshot match only',purgeStatus:build.runtimeHTTP.purgeStatus??'not required for recorded observation',browserExecution:'not run'}:'must be independently verified against the published bundle'};
await writeFile(join(root,'DELIVERY.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
