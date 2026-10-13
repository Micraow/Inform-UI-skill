#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {webChatPrompt,promptProseProjection} from './prompt-projection.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,item,index,list)=>{if(index%2===0){if(!item.startsWith('--')||!list[index+1])throw Error('Options require --name value');pairs.push([item.slice(2),list[index+1]]);}return pairs;},[]));
for(const name of ['runtime-dir','runtime-url','source-commit','icons'])if(!args[name])throw Error('Required: --'+name);
if(!/^[a-f0-9]{40}$/.test(args['source-commit']))throw Error('Use the complete immutable source commit');
const runtimeURL=new URL(args['runtime-url']);
if(runtimeURL.protocol!=='https:')throw Error('Use a verified HTTPS browser runtime URL');
const runtimeChannel=args['runtime-channel']??'latest';
if(runtimeChannel!=='latest')throw Error('Web Chat delivery uses --runtime-channel latest');
if(runtimeURL.href.includes(args['source-commit']))throw Error('Do not pin the development source commit in the user HTML URL');
const httpReceipt=args['http-receipt']?JSON.parse(await readFile(resolve(args['http-receipt']),'utf8')):null;
if(!httpReceipt)throw Error('Provide --http-receipt for the verified public runtime entry');
if(httpReceipt.url!==runtimeURL.href||(httpReceipt.verifiedSourceCommit??httpReceipt.version)!==args['source-commit']||httpReceipt.status!==200)throw Error('HTTP receipt does not verify this runtime entry and development snapshot');
const api=await import(pathToFileURL(join(resolve(args['runtime-dir']),'node.mjs')).href);
const sourceProfiles=JSON.parse(await readFile(join(root,'source/profiles.json'),'utf8'));
const iconCatalog=JSON.parse(await readFile(resolve(args.icons),'utf8'));
const requestedIcons=['Check','Info','Warning','ArrowRight','Chart','Calendar','BookOpen','Lightbulb','MapPin','Search','Filter','Settings','Play','Pause','CircleQuestion','Link'];
const iconNames=new Set(iconCatalog.icons.map(item=>item.name));
const glyphs=requestedIcons.filter(name=>iconNames.has(name));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const browserBytes=await readFile(join(resolve(args['runtime-dir']),'inform-ui.global.js'));
if(httpReceipt&&httpReceipt.publishedSha256!==sha(browserBytes))throw Error('Published runtime and local snapshot differ');
const htmlEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scriptJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function html(source,definition){
 const config={source,select:definition.select,viewNames:definition.viewNames,theme:'light'};
 return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${htmlEscape(definition.title)}</title>
<style>body{margin:0;padding:clamp(16px,4vw,40px);font:16px system-ui,sans-serif;color:#171717;background:#fff}main{max-width:960px;margin:auto}#status{max-width:960px;margin:16px auto;white-space:pre-wrap}</style>
</head>
<body>
<main id="answer" aria-label="${htmlEscape(definition.title)}"></main>
<p id="status" role="status">正在载入答案…</p>
<noscript>需要启用 JavaScript 才能显示这份互动答案。</noscript>
<script id="inform-config" type="application/json">${scriptJSON(config)}</script>
<script src="${htmlEscape(runtimeURL.href)}"></script>
<script>
(() => {
 const status=document.getElementById('status');
 let failed=false;
 const onError=issues=>{failed=true;status.hidden=false;status.textContent='答案无法显示：'+issues.map(issue=>issue.message||String(issue)).join(' ');};
 try {
  if(!globalThis.InformUI)throw Error('运行库未能载入，请检查网络或 HTML 环境是否允许外部脚本。');
  const config=JSON.parse(document.getElementById('inform-config').textContent);
  const view=InformUI.mount(document.getElementById('answer'),{...config,onError});
  if(view.getSnapshot()&&!failed)status.hidden=true;
  addEventListener('pagehide',()=>view.dispose(),{once:true});
 } catch(error) {onError([{message:error.message}]);}
})();
</script>
</body>
</html>
`;
}
function instructions(definition,manifest,prompt,minimal){
 const agentRouting=definition.skillPath==='SKILL.md'?`\n## 两条使用路线\n\n- **直接写答案**：Agent 和 Web Chat 都可以只读本文件，用下面的基础与图表合同输出 HTML，不要求终端。专门的轻量入口位于 profiles/web-chat-core/SKILL.md 和 profiles/curated-web-chat/SKILL.md。\n- **Agent 按需扩展**：有仓库文件或工具能力时，先读 references/catalog.md，再按模块读 generated/modules/*.txt，或按名称读 generated/views/<ViewName>.txt；不要把所有 195 个 View 和 755 个 glyph 一次性塞进上下文。全量目录不是本默认 profile 的额外授权。\n- **可选 CLI**：node scripts/inform-answer.mjs catalog 做模块发现；prompt --select 模块列表 --views 精确View列表 生成该选择的合同；icons --query 关键词 发现官方图标；check answer.openui 检查，build answer.openui --out answer.html 构建。check/build 都要传同一 --select 和 --views；构建使用 --runtime-url ${runtimeURL.href} 跟随 latest。CLI 随仓库提供 Node runtime，不要求安装 React 工程。\n- 扩展时必须同时用真实 profile 重新生成 prompt/schema，并让 HTML 的 select/viewNames 保持一致；不能把扩展 View 混进本文件默认的 37 个 UI 合同。离线或调试可显式使用随包的验证快照，但不要把固定 commit 写成默认 HTML 入口。\n`:'';
 const extra=definition.viewNames.length?`本版只额外开放：${definition.viewNames.join('、')}。不要改成全部 views/content；其他领域 View 不在本版合同里。`:'本版不开放任何领域 View。使用基础组件、图表与文字完成答案；不要从旧目录猜 View 名称。';
 const viewGuidance=definition.viewNames.length?'\n- CodeView 只显示字符串，不执行代码；代码块用 language、highlight:true、copy:true，inline:true 时不可同时启用高亮/复制。它保留缩进和原始换行，长行在面板内横向滚动；不把每行强行断开。复制需要浏览器安全上下文、权限与真实点击，失败应按页面提示处理。\n- BlockquoteView 的文字放 children，并准确署名；原创总结要标为原创，不能冒充外部引文。ChecklistView 是视图自身的临时自检状态，不是可在其他 DSL 表达式读取的 $binding；需要联动计算时使用基础 Checkbox/Switch。\n- 通用对比用 Table/Grid/MetricView，过程用 StepsView；本版没有 ComparisonView 或 TimelineView。':'';
 return `---
name: ${definition.name}
description: ${definition.description}
---

# ${definition.label}

把本文件交给 Agent 或 Web Chat AI 即可。任务是输出一份完整 HTML 答案：直接回答问题，用图文和有意义的本地交互帮助理解。默认路线无需终端、CLI、npm、React 工程或额外的全量组件文档。${agentRouting}

## 写作和交付合同

- 默认沿用下方可运行 HTML 壳，只替换标题、语言与配置中的 source。保持给定 select、viewNames 和 script URL；默认入口跟随 latest，不把 commit 或版本号写入 HTML。模型不要另造 DOM 框架、解释器或业务 JavaScript；交互逻辑写入 DSL。
- ${manifest.components.length} 个 UI 构造器、${manifest.dataShapes.length} 个数据构造器。${extra}
- 所有真实可用签名就在本文件后面的自动生成合同中。schema.json、manifest.json、profile.json、minimal.html 来自同一 profile；模型不必运行生成脚本，也不需要读取全部195个View。${viewGuidance}
- 不声明已完成查询、订票、付款、发送或其他宿主服务。这里只处理给定数据和本地状态。Query、Mutation、@Run、@OpenUrl、@ToAssistant 与任意 JS 均不支持。
- 概念、数据、结论和来源必须说清楚。原创演示数据明确标为示例；不伪造真实来源。图表配可读的文字结果及必要表格；图片有 alt；控件标签说明单位和作用；处理空结果、重置和失效选择。
- 每条 DSL 声明从新行开始，单个表达式可跨行；不用分号。root = Stack(...) 可以在任意位置。组件是位置参数；对象内才写 key:value。显式声明所有 $state；只有声明为 binding 的参数能绑定状态。
- 只用 @Filter、@Sort、@Each 等下方实际列出的纯函数。没有 lambda、.map() 或 eval。Each 的第三参数是内联模板。Table 的行对象只能含 columns 声明的键；用 @Each 投影并保留原始记录做选择。
- source 是 JSON 字符串，完整进行 JSON 转义；HTML 数据块中的每个 < 写成 \\u003c，避免正文的 </script> 结束数据块。不要把 DSL 直接拼接成可执行 JavaScript。
- 若使用图标，可直接选以下已核对的官方名称：${glyphs.join('、')}。这里故意不列全部 ${iconCatalog.iconCount} 个 glyph；没有额外目录时用文字或这些名称，不猜名字。
- HTML 依赖网络获取 latest JS；它是会更新的入口，CDN 与浏览器缓存可能延后看到更新，不保证每次打开立即拿到最新字节。网页宿主还需允许脚本和样式。固定壳含内联初始化与样式，严格 CSP 需宿主配置 nonce/hash。不能保证所有聊天预览器都允许执行 HTML。

这是 OpenUI 派生的严格本地方言，不是全部上游 runtime 的兼容替代。精简的是模型合同与可用组件集合；使用的 browser JS 仍是同一完整 bundle。不宣称未测的 token 或下载体积节省。

## 同源自动生成的 DSL 合同

${prompt}

## 可直接改写的最小 HTML

下面示例是完整有效程序。先保留它的 select/viewNames/加载与报错处理，再把 source 换成用户真正需要的完整答案。

\`\`\`html
${minimal.trim()}
\`\`\`
`;
}
const generated=[];
for(const definition of sourceProfiles){
 const profile=api.createProfile({select:definition.select,viewNames:definition.viewNames});
 const manifest=profile.manifest();
 const views=manifest.components.filter(c=>c.moduleId.startsWith('views/')).map(c=>c.name).sort();
 if(JSON.stringify(views)!==JSON.stringify([...definition.viewNames].sort()))throw Error('Unexpected View closure for '+definition.id);
 const prompt=webChatPrompt(profile.prompt({bindings:true,builtinFunctions:true}));
 const source=await readFile(join(root,'source',definition.source),'utf8');
 const runtime=api.createRuntime(profile),result=runtime.commit(source);
 if(!result.ok)throw Error(definition.id+': '+JSON.stringify(result.issues));
 runtime.dispose();
 const minimal=html(source,definition),dir=join(root,definition.outputDirectory);await mkdir(dir,{recursive:true});
 const config={id:definition.id,outputDirectory:definition.outputDirectory,skillPath:definition.skillPath,sourceCommit:args['source-commit'],verificationLockOnly:true,runtimeChannel,runtimeURL:runtimeURL.href,runtimeSha256:sha(browserBytes),select:definition.select,viewNames:definition.viewNames,modules:manifest.modules,uiComponents:manifest.components.length,dataConstructors:manifest.dataShapes.length,glyphShortlist:glyphs};
 await writeFile(join(dir,'profile.json'),JSON.stringify(config,null,2)+'\n');
 await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await writeFile(join(dir,'schema.json'),JSON.stringify(profile.schema,null,2)+'\n');
 await writeFile(join(dir,'prompt.txt'),prompt+'\n');
 await writeFile(join(dir,'minimal.openui'),source);
 await writeFile(join(dir,'minimal.html'),minimal);
 const skill=instructions(definition,manifest,prompt,minimal);
 await writeFile(join(root,definition.skillPath),skill);
 if(definition.skillPath==='SKILL.md')await writeFile(join(dir,'SKILL.md'),instructions({...definition,name:'inform-web-chat-core',label:'Web Chat 基础与图表',skillPath:definition.outputDirectory+'/SKILL.md'},manifest,prompt,minimal));
 generated.push({...config,promptBytes:Buffer.byteLength(prompt),skillBytes:Buffer.byteLength(skill),schemaBytes:Buffer.byteLength(JSON.stringify(profile.schema,null,2)+'\n'),sourceSha256:sha(source)});
}
await writeFile(join(root,'BUILD.json'),JSON.stringify({format:'inform-web-chat-skill/1',sourceCommit:args['source-commit'],verificationLockOnly:true,runtimeChannel,runtimeURL:runtimeURL.href,runtimeSha256:sha(browserBytes),nodeRuntimeSha256:sha(await readFile(join(resolve(args['runtime-dir']),'node.mjs'))),runtimeUpdateSemantics:'The default latest URL is mutable; this commit and hash record the tested development snapshot, not a version lock in user HTML. CDN and browser caches can delay updates.',promptProseProjection,profiles:generated,runtimeHTTP:httpReceipt,modelWorkflow:'Read one SKILL.md; produce complete HTML using the latest entry; no CLI required',browserVerification:'Not established by generation or Node validation'},null,2)+'\n');
console.log(JSON.stringify(generated.map(p=>({id:p.id,uiComponents:p.uiComponents,dataConstructors:p.dataConstructors,promptBytes:p.promptBytes,skillBytes:p.skillBytes})),null,2));
