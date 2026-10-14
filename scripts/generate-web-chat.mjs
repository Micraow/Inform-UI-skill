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
const runtimeChannel=args['runtime-channel']??'main';
if(runtimeChannel!=='main')throw Error('Web Chat delivery uses --runtime-channel main');
if(runtimeURL.href.includes(args['source-commit']))throw Error('Do not pin the development source commit in the user HTML URL');
const validationStage=args['validation-stage']??'published';
if(!['local','published','git-published-unverified'].includes(validationStage))throw Error('Use --validation-stage local, published or git-published-unverified');
if(validationStage==='git-published-unverified'&&!/^[a-f0-9]{40}$/.test(args['git-release-commit']??''))throw Error('Provide the complete --git-release-commit recorded from the main ref');
const httpReceipt=args['http-receipt']?JSON.parse(await readFile(resolve(args['http-receipt']),'utf8')):null;
if(validationStage==='git-published-unverified'&&httpReceipt)throw Error('Unverified Git publication cannot include an HTTP receipt');
if(validationStage==='published'&&!httpReceipt)throw Error('Provide --http-receipt for the verified public runtime entry');
if(httpReceipt&&(httpReceipt.url!==runtimeURL.href||(httpReceipt.verifiedSourceCommit??httpReceipt.version)!==args['source-commit']||httpReceipt.status!==200))throw Error('HTTP receipt does not verify this runtime entry and development snapshot');
const api=await import(pathToFileURL(join(resolve(args['runtime-dir']),'node.mjs')).href);
const sourceProfiles=JSON.parse(await readFile(join(root,'source/profiles.json'),'utf8'));
const iconCatalog=JSON.parse(await readFile(resolve(args.icons),'utf8'));
const requestedIcons=['Check','Info','Warning','ArrowRight','Chart','Calendar','BookOpen','Lightbulb','MapPin','Search','Filter','Settings','Play','Pause','CircleQuestion','Link'];
const iconNames=new Set(iconCatalog.icons.map(item=>item.name));
const glyphs=requestedIcons.filter(name=>iconNames.has(name));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const browserBytes=await readFile(join(resolve(args['runtime-dir']),'inform-ui.global.js'));
if(httpReceipt&&httpReceipt.publishedSha256!==sha(browserBytes))throw Error('Published runtime and local snapshot differ');
const noticesBytes=await readFile(join(resolve(args['runtime-dir']),'THIRD_PARTY_NOTICES.txt'));
if(validationStage==='published'&&(httpReceipt.notices?.url!==new URL('THIRD_PARTY_NOTICES.txt',runtimeURL).href||httpReceipt.notices?.status!==200||httpReceipt.notices?.publishedSha256!==sha(noticesBytes)))throw Error('Published notices and local snapshot differ');
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
 const runtimePreparation=validationStage==='local'?`
## 当前运行库准备

这份开发合同来自随包运行库，尚未确认 main 入口字节与它一致。下方带 main 外链的 HTML 是发布模板，不能直接视为新组件已经上线。当前先把 assets/runtime/inform-ui.global.js 和 THIRD_PARTY_NOTICES.txt 复制到答案 HTML 同一目录，把唯一的外部 script src 改为 ./inform-ui.global.js，其余配置不变；无需 npm 或 React。具备终端时，也可用随包 CLI build，保留默认本地 runtime，不传 --runtime-url。具体命令见 references/delivery.md。
`:validationStage==='git-published-unverified'?`
## 运行库交付

匹配的运行库已提交到 main，随包快照也已更新。本次没有独立核验线上缓存或浏览器表现，不能把 Git 发布或随包检查表述为线上验收。下方 HTML 使用 main 在线入口；需要离线交付或明确使用本次快照时，把 assets/runtime/inform-ui.global.js 和 THIRD_PARTY_NOTICES.txt 放到 HTML 旁，并将 script src 改为 ./inform-ui.global.js。发布记录与验证范围见 generated/build.json。
`:'';
 const runtimeInstruction=validationStage==='local'?'沿用下方 HTML 结构，按上方说明改用匹配的随包运行库；只替换标题、语言与配置中的 source，保留 select 和 viewNames。':'默认沿用下方可运行 HTML 壳，只替换标题、语言与配置中的 source。保持给定 select、viewNames 和 script URL；默认入口跟随 main，不把 commit 或版本号写入 HTML。';
 const agentRouting=definition.skillPath==='SKILL.md'?`\n## 两条使用路线\n\n- **直接写答案**：Agent 和 Web Chat 都可以只读本文件，用下面的基础与图表合同输出 HTML，不要求终端。专门的轻量入口位于 profiles/web-chat-core/SKILL.md 和 profiles/curated-web-chat/SKILL.md。\n- **Agent 按需扩展**：有仓库文件或工具能力时，先读 references/catalog.md 做名称与模块发现，再用随包 CLI prompt 从当前 runtime 按模块或精确 View 名生成合同。generated/modules/*.txt 与 generated/views/<ViewName>.txt 是按同一 runtime 生成的静态合同，读取前核对 generated/snapshot-status.json 与 runtime 锁；换了 runtime 后须重新生成，不沿用旧签名。不要把全部 View 和 glyph 一次性塞进上下文。全量目录不是本默认 profile 的额外授权。\n- **可选 CLI**：node scripts/inform-answer.mjs catalog 做模块发现；prompt --select 模块列表 --views 精确View列表 生成该选择的合同；icons --query 关键词 发现官方图标；check answer.openui 检查，build answer.openui --out answer.html 构建。check/build 都要传同一 --select 和 --views；构建使用 --runtime-url ${runtimeURL.href} 跟随 main。CLI 随仓库提供 Node runtime，不要求安装 React 工程。\n- 扩展时必须同时用真实 profile 重新生成 prompt/schema，并让 HTML 的 select/viewNames 保持一致；不能把扩展 View 混进本文件默认的 ${manifest.components.length} 个 UI 合同。离线或调试可显式使用随包的验证快照，但不要把固定 commit 写成默认 HTML 入口。\n`:'';
 const extra=definition.viewNames.length?`本版只额外开放：${definition.viewNames.join('、')}。不要改成全部 views/content；其他领域 View 不在本版合同里。`:'本版不开放任何领域 View。从已开放的文字、基础组件与图表中按需选择；不要从旧目录猜 View 名称。';
 const codeGuidance=manifest.components.some(c=>c.name==='Code')?'\n- 代码使用基础模块 base/code 的 Code({value:"代码文本",language:"javascript"})；CodeView(data) 保留为同模块兼容别名，不再放入 viewNames。块模式默认显示语言名称、启用 highlight.js 高亮和一键复制，无需重复写 true；可分别用 showLanguage:false、highlight:false、copy:false 关闭。没有语言时显示 Plain text；不支持的语言安全回退为纯文本，不自动猜语言或远程加载语法。inline:true 为纯文本行内代码，不能显式启用这三项增强。代码只展示、不执行；保留缩进与换行，长行在面板内横向滚动。复制需要浏览器安全上下文、权限与真实点击，失败时按页面提示处理。':'';
 const viewGuidance=definition.viewNames.length?'\n- BlockquoteView 的文字放 children，并准确署名；原创总结要标为原创，不能冒充外部引文。ChecklistView 是视图自身的临时自检状态，不是可在其他 DSL 表达式读取的 $binding；需要联动计算时使用基础 Checkbox/Switch。\n- 根据要表达的关系选择组件；Table/Grid/MetricView 可组织对比，StepsView 可组织步骤，均非固定搭配。本版没有 ComparisonView 或 TimelineView。':'';
 return `---
name: ${definition.name}
description: ${definition.description}
---

# ${definition.label}

把本文件交给 Agent 或 Web Chat AI 即可。任务是输出一份完整 HTML 答案：直接回答问题，按表达目标选择呈现方式，需要时再加入图示、数据图表或有意义的本地交互。默认路线无需终端、CLI、npm、React 工程或额外的全量组件文档。${runtimePreparation}${agentRouting}

## 先决定表达方式

- 先明确要回答的问题、表达目标与关系类型，再选择文字、基础组件组合、图示或数据图表。文字足以说清时可以只用文字；组件目录表示可用能力，不是答案结构或覆盖率要求。
- 区分数量关系与非数量关系。数据图表用于有明确数值含义的比较、趋势、分布或占比，标明指标、单位和必要条件；不要为了画图把位置、层级、顺序、连接或状态任意编码成数量。结构与过程应保留其真实关系，可用文字、布局组合或合同支持的图示表达，不固定采用某一种图形技术。
- 交互必须服务于当前问题：明确用户能改变什么，以及变化如何帮助理解、比较或完成已请求的操作。没有真实目的就省略控件；静态答案同样有效。不要为体现“互动”或展示组件能力添加点击、开关、滑块或待办。
- 不默认在结尾添加可点清单、自检或下一步任务。仅在用户明确需要核对或任务进度，或它确实承担当前任务所需的状态记录时使用清单；一般总结直接用文字。结尾由答案内容决定。
- 一种表达已经足够时，不必再配齐图、表、代码、引文与控件。交付前检查每个元素是否帮助回答问题、是否忠实表达关系，删除只为装饰、重复结论或凑组件覆盖率而加入的元素。

## 布局也是表达的一部分

- 即使只有文字，也要主动安排视觉层级、分组、留白和阅读顺序；纯文字不等于把所有内容堆成同样密度的长段落。先让读者找到核心回答，再按内容关系展开，短答案可以直接用少量段落，不强制标题、摘要、卡片或固定结尾。
- 用 Heading 表达真实章节层级，用 Text 的 size、weight 和 tone 区分正文、重点与辅助说明；同级内容保持一致，避免把每句都加重、放大或着色。说明和来源靠近所解释的内容，弱化辅助信息，但不要把正文都缩小或淡化。
- 用 Stack 建立纵向阅读主线：同组内容间距较小，组与组间距较大，通过 gap 的有限档位形成稳定节奏。先用间距分组，只有主题确实转换时才用 Divider；不要在每段之间加线，也不要靠连续空行、空组件或大块留白撑版面。
- 按关系选择布局：连续论述用纵向流；紧密关联的短内容用 Row；同级、需要并列查看的内容用 Grid。并列项保持标题、正文和辅助信息的顺序与对齐一致；不要为了填满一行拆散完整论述，或把所有段落都变成等宽格子。
- 正文通常沿阅读起点对齐，居中只用于适合独立强调的短内容。用 Row 的 align、justify 和 distribution 表达对齐与分配，选择 natural 或 equal 应取决于内容关系；不要用空格凑列，也不要为视觉等高补写冗余文字。
- 行宽与阅读节奏一起考虑：长解释优先保持清楚的单列段落，过长段落按语义拆开；并排后读起来过窄就减少列数或恢复纵向。需要容器尺度时只用 Box 的 width、padding、gap 等实际支持的 token；没有任意 CSS、像素宽度、行高或断点参数，不臆造属性，也不另加样式框架绕过合同。
- 响应式必须保留阅读顺序。一般并列内容可用 Grid 的 responsive:"stack" 在窄布局堆叠，短行可用 Row 的 wrap:"wrap" 换行；只有空间关系不可拆分且已考虑窄屏可读性时才用 preserve 或 nowrap。不要把字号缩小到难读来维持多列，内容较长时优先改变外层组织。
- Card 用于确实需要独立边界的内容组；Box 用于必要的容器尺度、内边距或语义背景。能用 Stack、Row、Grid 和留白说清的关系，不必再包卡片；避免卡片套卡片、每段一个面板，以及无含义的彩色背景、徽章和图标。布局层级应帮助理解内容，而不是增加装饰层数。
- 交付前按阅读路径检查：核心回答是否醒目、同级内容是否对齐、组内与组间距离是否可辨、长文字是否容易连续阅读、窄布局是否仍按合理顺序呈现。根据内容删减或调整，不把这些检查转成每份答案都必须出现的版式清单。

## 从内容关系组合组件

- 先拆出内容单元：核心结论、说明、数值、标签、媒体、来源或有真实目的的控件；再判断它们是从属、并列、先后还是相互说明。一个完整表达可以由多个基础组件共同承担，不必寻找一个名称完全对应主题的 View，也不必把每个信息单元独立做成卡片。
- 先定外层排布，再填内层组件：外层 Stack 维持整篇阅读主线，局部 Grid 安排并列单元，每个单元内部再用 Stack 组织标题、主体和说明；短标签与对应内容可用 Row 对齐。只有确有从属关系时才增加一层，每一层应能说明它组织了什么，避免为包装而嵌套。
- 让组合表达一个整体：并列单元共享的标题、前提和来源放在它们共同的外层；各自的说明留在各自单元。标签、值与补充文字可用 Text 的字重、字号和语气分层；媒体与解释可在同一 Grid 中并排，解释一侧仍用 Stack 连续阅读，窄屏时按同样语义顺序堆叠。根据关系选择这些组合，不要求一篇答案配齐它们。
- 基础组件也能构成简洁的非数量示意：用有文字标签的 Box 表示区域，用 Stack/Row/Grid 的相邻、先后和分组表达关系；必要时用文字或合同内已核对的 Icon 辅助指示方向。颜色只作补充，区域大小不暗示未经给定的数值。Divider 是主题分隔线，不是任意节点之间的连线；这些布局组件没有绝对坐标、自由连线或任意绘图能力，复杂关系超出能力时改用更清楚的文字或另行获取匹配的图示合同，不能伪造接口。
- 同级重复单元先设计一份内部结构，再把内容写成数据数组，用 @Each 展开；需要分组重复时，外层组与内层条目分别展开。统一的是信息角色与对齐方式，不要求内容等长，不把不同性质的段落硬套同一模板。抽出的组件可用声明复用，但 @Each 的模板必须内联，循环变量只在所属模板作用域内读取。
- 组合有交互时，先明确共享数据与已声明的 $state，再让相关文字、数值和可视区域读取同一份派生结果；控件只绑定合同允许 binding 的位置，通过支持的 Action 更新。不要让两块本应联动的内容各维护一份互相矛盾的数据，不把局部 View 的临时状态当作可读的共享状态。没有交互需求就保持静态组合。

## 写作和交付合同

- ${runtimeInstruction}模型不要另造 DOM 框架、解释器或业务 JavaScript；交互逻辑写入 DSL。
- ${manifest.components.length} 个 UI 构造器、${manifest.dataShapes.length} 个数据构造器。${extra}
- 下面的范围、整数、长度、枚举、默认值和组合条件均属于校验合同；省略可选参数不等于可以传任意值。变量、计算结果和状态更新也必须满足约束，图表空间不足时调整外层布局，不把受限尺寸缩到下限以下。
- 所有真实可用签名就在本文件后面的自动生成合同中。schema.json、manifest.json、profile.json、minimal.html 来自同一 profile；模型不必运行生成脚本，也不需要读取全部 View。${codeGuidance}${viewGuidance}
- 不声明已完成查询、订票、付款、发送或其他宿主服务。这里只处理给定数据和本地状态。Query、Mutation、@Run、@OpenUrl、@ToAssistant 与任意 JS 均不支持。
- 概念、数据、结论和来源必须说清楚。原创演示数据明确标为示例；不伪造真实来源。使用图表时配可读的文字结果，并保证数据可访问，必要时补充表格；使用图片时提供 alt；使用控件时标签说明单位和作用，并按实际状态流程处理空结果、重置和失效选择。
- 每条 DSL 声明从新行开始，单个表达式可跨行；不用分号。root = Stack(...) 可以在任意位置。组件是位置参数；对象内才写 key:value。显式声明所有 $state；只有声明为 binding 的参数能绑定状态。
- 只用 @Filter、@Sort、@Each 等下方实际列出的纯函数。没有 lambda、.map() 或 eval。Each 的第三参数是内联模板。Table 的行对象只能含 columns 声明的键；用 @Each 投影并保留原始记录做选择。
- 同构重复的卡片、行、格子或分组，优先写数据数组 + @Each(array,"item",内联模板)，不要逐项复制组件树；分组内仍有重复时嵌套 @Each。不同结构的少量段落不必强行统一模板。
- @Each 是已有的逐项展开方式，不另造 foreach、@ForEach、lambda 或 .map()；没有索引参数。内层模板可读取外层 item，循环变量不能用于模板外的独立声明。需要序号时把序号写入数据。
- source 是 JSON 字符串，完整进行 JSON 转义；HTML 数据块中的每个 < 写成 \\u003c，避免正文的 </script> 结束数据块。不要把 DSL 直接拼接成可执行 JavaScript。
- 若使用图标，可直接选以下已核对的官方名称：${glyphs.join('、')}。这里故意不列全部 ${iconCatalog.iconCount} 个 glyph；没有额外目录时用文字或这些名称，不猜名字。
- HTML 依赖网络获取 main JS；它是会更新的入口，CDN 与浏览器缓存可能延后看到更新，不保证每次打开立即拿到最新字节。网页宿主还需允许脚本和样式。固定壳含内联初始化与样式，严格 CSP 需宿主配置 nonce/hash。不能保证所有聊天预览器都允许执行 HTML。

这是 OpenUI 派生的严格本地方言，不是全部上游 runtime 的兼容替代。精简的是模型合同与可用组件集合；使用的 browser JS 仍是同一完整 bundle。不宣称未测的 token 或下载体积节省。

## 重复结构：先数据，再模板

下面是完整 DSL 小例子；外层生成分组卡片，内层生成徽章。把它放进同一 HTML 壳的 source，仍只需要本 profile 已有的基础组件。

\`\`\`openui
groups = [{title:"第一组",items:["甲","乙"]},{title:"第二组",items:["丙"]}]
root = Stack(@Each(groups,"group",Card([Row(@Each(group.items,"item",Badge(item)),"sm")],group.title)),"md")
\`\`\`

写完后检查：同一组件结构是否被逐项抄写？能否抽成一份内联模板？更完整的空组与本地选择例子按需读 references/repeated-structures.md；语法边界见 references/dialect.md。无需为此加载更多 View。

## 同源自动生成的 DSL 合同

${prompt}

## 可直接改写的最小 HTML

下面示例是完整有效程序，用于说明 DSL 与 HTML 壳的连接，不是回答结构模板，也不要求复用其中的图表、控件或其他组件。保留它的 select/viewNames/加载与报错处理，再按当前问题重新组织 source。

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
 if(definition.skillPath==='SKILL.md')await writeFile(join(dir,'SKILL.md'),instructions({...definition,name:'inform-web-chat-core',label:'Inform HTML 答案：基础版',skillPath:definition.outputDirectory+'/SKILL.md'},manifest,prompt,minimal));
 generated.push({...config,promptBytes:Buffer.byteLength(prompt),skillBytes:Buffer.byteLength(skill),schemaBytes:Buffer.byteLength(JSON.stringify(profile.schema,null,2)+'\n'),sourceSha256:sha(source)});
}
await writeFile(join(root,'generated/build.json'),JSON.stringify({format:'inform-web-chat-skill/1',validationStage,publicationReady:validationStage==='published',sourceCommit:args['source-commit'],verificationLockOnly:true,runtimeChannel,runtimeURL:runtimeURL.href,runtimeSha256:sha(browserBytes),noticesSha256:sha(noticesBytes),nodeRuntimeSha256:sha(await readFile(join(resolve(args['runtime-dir']),'node.mjs'))),runtimeUpdateSemantics:'The default main URL is mutable; this commit and hash record the tested development snapshot, not a version lock in user HTML. CDN and browser caches can delay updates.',promptProseProjection,...(validationStage==='git-published-unverified'?{bundledRuntimeReady:true,gitPublication:{repository:'Micraow/Inform-UI',commit:args['git-release-commit'],sourceCommit:args['source-commit']}}:{}),profiles:generated,runtimeHTTP:httpReceipt,modelWorkflow:'Read one SKILL.md; produce complete HTML using the main entry; no CLI required',browserVerification:'Not established by generation or Node validation'},null,2)+'\n');
console.log(JSON.stringify(generated.map(p=>({id:p.id,uiComponents:p.uiComponents,dataConstructors:p.dataConstructors,promptBytes:p.promptBytes,skillBytes:p.skillBytes})),null,2));
