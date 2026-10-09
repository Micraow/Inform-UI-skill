---
name: inform-ui-author
description: 为解释、真坐标图、本地表单、供数天气/体育/金融、本地自测/闪卡、单位/货币换算、时间控件、按需说明与基础状态生成 iui/1 JSON；无终端Web Chat直接用固定CDN与本文HTML壳交付页面，Agent可用本地库。普通文字足够时不强加界面。
---

# Inform UI Author

> 固定运行时已通过292项核心检查、216项Chromium测试和42个组件消费者视图；范围与精确提交见[验收记录](references/schema-discovery.md)。当前Skill入口的独立CDN回归另行记录，旧盲测保留原版本。

你负责内容、来源、阅读顺序和选型；库负责校验、DOM、样式、布局与交互。正文自然穿插图、公式和必要控件，不把每段话塞进卡片。

本文件是默认Agent入口，也能单独提供给普通Web Chat生成基础内容。本版固定协议有62个注册项：60个渲染节点、markdown纯文本降级、native明确拒绝。协议节点数不是组件目录验收计数。单根内嵌下述常用基础、布局、图、控件、表单、学习、单位换算与受控SVG的生成规则。天气、体育、金融、货币快照等深领域须先读取同版索引指向的完整合同与示例；不能只凭名称猜字段。无法读取外部资料的Web Chat可额外接收完整Schema或WEB-CHAT-GUIDE.md全文。

Inform UI为独立非官方社区实现，参考OpenAI Intelligent UI；无模型厂商账号/API/私有运行时依赖。portable是后端名称。CDN需要联网，npm包尚未发布。

## 1. 先决定要表达什么

- 结论/问题 → 证据/演示 → 观察方法。短回答可纯文字；明确要HTML则交完整文件。
- 趋势用折线/面积，类别比较用柱图，成对观测用散点，非负组成用环图；关系/瓶颈用拓扑，推理用步骤/公式，少量关键数用指标，精确值用表格。推荐用标题/正文/链接，图片须有用且来源合适。
- 控件必须回答“输入改变会怎样”并连接可见结果；不要无效按钮或装饰图。
- 标明实测、推导或模拟，保留单位、假设、时间、来源；缺测null不能补零。
- 默认section/figure纵向阅读，card只框完整演示。不写组件HTML/CSS、固定宽度、像素间距或渐变；长公式拆短并解释变量。

## 2. 无终端 Web Chat：完整 HTML 路径

固定的公开文件（实际取回字节已核对，保持同一提交）：

- 浏览器全局脚本：`https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.global.min.js`
- 进阶 ESM（可选）：`https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.min.js`
- 样式：`https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.css`
- 完整 JSON Schema：`https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.schema.json`

window.IUI提供浏览器API：validateDocument(input)返回{ok:true,document}或{ok:false,issues:[{code,path,message}]}；mount(element,document,{styles:false})渲染JSON并返回update(nextDocument)、dispose()、getState()、setState(patch)。保留styles:false让字体相对CDN样式表加载。compileHtml仅为Node API，不能在浏览器导入。

数学为KaTeX可视HTML及辅助MathML；CSS按需加载同一提交cdn/fonts/的20款官方MIT WOFF2。自设严格CSP须同时许可脚本、样式及font-src https://cdn.jsdelivr.net；不要换字体或删规则。

HTML交付复制下壳，只改JSON、语言、标题和与JSON theme一致的body data-theme。iui-page控制整页背景，margin:0去浏览器边距；嵌入网页时背景由宿主决定。不以JSON冒充页面，也不手写组件DOM。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Inform UI 解释文档</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.css" integrity="sha384-qNWPFoy6Ymjw326+NVax/jDhejs64mwImn+qdIzX44lT5LB9RHqPifXo8AHYIC2v" crossorigin="anonymous">
</head>
<body class="iui-page" data-theme="auto" style="margin:0">
  <main id="iui">正在加载界面…</main>
  <noscript>请启用 JavaScript 以查看这个交互文档。</noscript>
  <script id="iui-spec" type="application/json">
  {"version":"iui/1","theme":"auto","state":{"x":4},"computed":{"twice":{"op":"mul","args":[2,{"$":"x"}]}},"body":[{"type":"title","level":1,"value":"观察一个输入与结果的关系"},{"type":"text","value":"改变 x，观察 2x 如何同步变化。"},{"type":"slider","label":"输入 x","bind":"x","min":1,"max":10,"step":1},{"type":"metric","label":"2x","value":{"$":"twice"}},{"type":"math","latex":"y=2x","block":true},{"type":"caption","value":"这是合成教学示例，不是实测数据。"}]}
  </script>
  <script src="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.global.min.js" integrity="sha384-kCdDypduBjoPeuXDsQ+Jh87xRL4aVxFlSy0DyPQ9xoEtvQfucAYKVVodpT0TvuxN" crossorigin="anonymous"></script>
  <script>
    const host = document.getElementById('iui');
    try {
      if (!window.IUI) throw new Error('库未加载，请检查网络或 CDN 地址。');
      const { validateDocument, mount } = window.IUI;
      const input = JSON.parse(document.getElementById('iui-spec').textContent);
      const result = validateDocument(input);
      if (!result.ok) throw new Error(result.issues.map(i => `${i.code} ${i.path}: ${i.message}`).join('\n'));
      mount(host, result.document, { styles: false });
    } catch (error) {
      host.textContent = `未能显示界面：${error.message}`;
    }
  </script>
</body>
</html>
```

嵌入JSON将所有<写成\u003c，防止结束标签关闭数据块；反斜杠要转义，如LaTeX用"\\frac{a}{b}"。不把用户文本拼进启动脚本。固定URL与integrity一起保留，不混版本、不删SRI或加载错误提示。宿主不运行脚本时给完整HTML供保存后联网打开；未预览须说明，不能声称气泡已执行。

## 按需发现领域合同

本根已给出常用基础、布局、图、控件、表单、学习、单位换算与受控SVG的生成规则。只用这些明确字段时，不必先下载完整Schema。深入供数领域或核对进阶字段时，走最短路线：版本化索引 → 所需schema → 同版示例。

索引：`https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/schema/index.json`

| 需求与选型 | 索引group | 节点与重要边界 |
| --- | --- | --- |
| 正文、富文本、引用、跨格布局、结构化表格、联动控件与提示/面板 | base | 本根内嵌；markdown仅纯文本降级，不执行格式 |
| 关联字段、约束与一次本地确认 | forms | input/textarea/radio/segmented/field/form；默认不联网，宿主动作须明确配置和授权 |
| 类别比较、真数轴、时间趋势、散点或组成 | charts | chart；正确选category/linear/time，不造缺测或裁极值 |
| 关系/瓶颈示意、原创小型静态矢量 | graphics | topology/svg；不是地理地图、原始SVG或脚本容器 |
| 当前设备时区时间 / 固定瞬间 / 本地经过与剩余时长 | time | clock / stopwatch / timer；常用合同在根，暂停起始、无系统提醒或校时 |
| 已提供的当前/逐日/逐小时天气 | weather | weather；须有来源、更新时间、时区、单位与缺测，不自动查预报 |
| 接下来何时比赛 / 一场比分 / 多队排名 | sports | sports-schedule / sports-scoreboard / sports-standings；完整供数快照，不计时、不推断赛制或直播 |
| 客观理解自测 / 翻面回忆自评 | learning | quiz / flashcards；本根已给常用合同，答案在文档里，不是保密考试或持久化学习系统 |
| 单标的快照 / 价格历史 / 同基准相对表现 / 权重分布 | finance | finance-quote / finance-chart / finance-comparison / finance-heatmap；来源与市场/延迟声明、共同瞬间基准、面积权重和涨跌不可混淆；不取行情或交易 |
| 物理单位试算 / 提供汇率快照的交叉换算 | converters | unit-converter / currency-converter；单位常用合同在根；货币需完整rates/base/asOf/source合同，不能仅从名字猜字段或视为实时换汇 |
| 识别旧输入为何被拒绝 | compatibility | native虽在结构Schema中识别，validateDocument仍明确拒绝；不要据此生成新界面 |

1. 读取索引一次，用nodeOwners确认目标type归属，按groups的ownedNodeTypes选择相关组，不遍历抓取全部分片。
2. 生成完整页面时优先读取groups[].documentSchema。该包已包含base与目标领域，includedGroups会明确列出。包内引用闭合，可独立做该子集的Document结构校验。
3. nodeSchema适合已经理解上下文时只查字段。它的rootKind是node，不包含文档state；递归Node子项也限于该组，不得当完整Document Schema使用。查询片与可创作文档包不是同一种根结构。
4. 按examples读取一个最贴近需求的示例。documentSchema.path、nodeSchema.path、fullSchema.path、examples[].path均相对索引URL解析；本地仓库可用examples[].repositoryPath。不要把缺测样例改成实测数据或把示例url猜成服务端点。
5. 跨多个领域时，先确认所有节点所属组。可在同版库中运行node scripts/schema-subset.mjs --groups base,forms,charts,finance --out union.schema.json生成闭合并集；跨域例可选base,forms,charts,time。不手工拼接$defs。无终端时可读所需Document包了解字段，但最终混合文档仍用同版完整validateDocument校验，不能拿一个领域包冒充所有领域。
6. 完整Schema仍是索引fullSchema指向的唯一规范来源。分片由它自动生成，不维护另一套手写Schema。结构通过不等于语义通过：状态引用、日期、范围、URL、计算图和native拒绝仍由完整validateDocument检查。

领域选择例和宿主生命周期见 [时间与浮层](references/time-and-overlays.md)。popover 的子form/chart/time仍需其所属组，容器归base不代表包含所有领域。

用utf8Bytes判断实际文件大小；estimatedTokens仅是Unicode码点数除以4后上取整的粗估，不是实测模型token，也不是节省保证。URL、索引、分片、示例和运行时必须来自同一固定提交。若不能取得领域合同，明确索取完整Schema或WEB-CHAT-GUIDE.md全文；不能用半合同猜出一个看似完整的领域节点。单根可用范围以本根内嵌字段为准，索引中出现名字不等于已经读取该节点合同。

## 3. 内嵌协议：可以直接据此写 JSON

以下为本根内嵌节点的保守生成规范，默认省略可选样式旋钮。记号?为可省略，S为字符串、N为有限数值、B为布尔值、V见绑定与表达式一节、Node[]为本文节点数组；输出真实JSON，不输出记号或未列字段。

根对象：`{version:"iui/1", body:Node[], title?:S, description?:S, theme?:"auto"|"light"|"dark", state?:{名称:字符串或数值或布尔值}, computed?:{名称:V}}`。`body` 非空，最多 150 项。状态/计算名称用英文字母或下划线开头，后接字母、数字、下划线，最多 80 字符；两组各最多 80 项，名称不能重名；对象键避开 `__proto__`、`constructor`、`prototype`。不要把 `state` 或 `computed` 写在节点内。

### 正文、分组与媒体

| type | 必填字段（除 type） | 本页允许的可选字段 |
| --- | --- | --- |
| `text` / `caption` | `value:V` | `weight:"normal"|"medium"|"semibold"|"bold"`，`color:"default"|"secondary"|"success"|"warning"|"danger"|"info"|"accent"` |
| `title` | `value:V` | `level:1|2|3`，`weight`、`color` 同上 |
| `math` | `latex:S` | `block:B`（独立公式用 true） |
| `section` | `children:Node[]` | `heading:S` |
| `figure` | `children:Node[]` | `caption:S` |
| `card` / `row` / `col` | `children:Node[]` | 无；让库决定间距与宽度 |
| `grid` | `children:Node[]` | `columns:1..6 的整数` |
| `details` | `summary:S, children:Node[]` | 无 |
| `callout` | `value:S` | `tone:"neutral"|"info"|"caution"` |
| `list` | `items:[V 或 Node,...]` | `ordered:B` |
| `steps` | `items:[{title:S, detail?:S, latex?:S},...]` | 无 |
| `link` | `value:V, href:S` | 无 |
| `image` | `src:S, alt:S` | `aspectRatio:"1:1"|"4:3"|"16:9"|"3:4"`，`fit:"cover"|"contain"` |

文字不解释Markdown/HTML；段落用text，公式用math。链接/图片只用有权使用的公开HTTPS URL，最多2048字符；无合适图片则省略。普通节点来源用caption/link；领域节点按各自source合同。外链image先显示来源与加载按钮，用户点击后才请求图片，不是自动联网图片流。

### 富文本、引用与网格

这些是常用基础能力，直接在根文件给出生成规则，不必先读取领域文档。

- `text` 二选一：旧 `value:V`，或 `runs:[{value:V,bold?:B,italic?:B,underline?:B,strike?:B,code?:B,href?:S},...]`，1–100 段，不能同时给 value/runs。href 用允许的 HTTPS 链接，最多2048字符；文字与代码始终是惰性文本，不接收 HTML、事件或脚本。
- `text` / `title` / `caption` 可加整段 `italic:B,underline:B,strike:B`。`shimmer:B` 只表示装饰效果，不代替真实 loading 状态，不暗示联网；非必要时省略，减少动态效果设置会停动画。
- `code` 可加 `inline:true` 表示行内代码；默认仍为代码块。不会执行、编辑代码，也不承诺语法高亮或复制按钮。
- `blockquote`：`{type:"blockquote",children:Node[],attribution?:S,cite?:S,id?:S}`；children 1–30，attribution 最多500字符，cite 是最多2048字符的允许 HTTPS 链接。由作者提供并核实引用，不把合成文字归于真人。
- `grid` 新增 `mobileColumns:1..6整数`，默认1，在520px及以下生效；columns 默认2。`grid-item` 必须是 grid 的直接子项：`{type:"grid-item",children:Node[],colSpan?:整数,rowSpan?:1..20整数,mobileColSpan?:整数,id?:S}`，children 1–30；两个列跨度默认1，分别不得超过父 grid 的 columns/mobileColumns。窄屏 rowSpan 恢复自动，阅读顺序保持原数组顺序。不要用跨格实现视觉重排或改变阅读顺序。

合成例：

```json
{"type":"grid","columns":3,"mobileColumns":1,"children":[{"type":"grid-item","colSpan":2,"mobileColSpan":1,"children":[{"type":"text","runs":[{"value":"观察结论：","bold":true},{"value":"零值与缺测不同；字段 "},{"value":"count","code":true},{"value":" 保留原始含义。"}]}]},{"type":"grid-item","children":[{"type":"blockquote","children":[{"type":"text","value":"缺测应保留为空，不应补成零。"}],"attribution":"本页原创合成示例"}]}]}
```

### 结构化表格

简单矩形数据继续用前述 columns＋rows。需要多层表头、行分组、跨格或页脚时才用以下扩展；不要为排版把正文塞进表格。

- `table` 必有 columns（1–20个列名），再二选一 `rows` 或 `sections`，不能同时给。单元格仍可用 V，或 `{value:V,header?:B,rowSpan?:1..200整数,colSpan?:1..20整数,align?:"start"|"center"|"end",scope?:"row"|"col"|"rowgroup"}`；两个跨度默认1。null 是真实空值，不是被跨格占据位置的占位符。
- `sections:[{kind:"head"|"body"|"foot",rows:单元格[][]},...]` 为1–12段，顺序是可选 head、一个或多个 body、可选 foot；至多各一个 head/foot，全部段合计不超过200个输入行。head 替代 columns 自动表头；未给 head 则仍从 columns 生成表头。
- 每格放入从左到右第一个未占列，其矩形必须完全位于本段内；不能重叠、超宽、跨段或留下逻辑缺格。已完全被上方 rowSpan 覆盖的行可以写 `[]`，其余空行不合法。不能给合并覆盖位置再补 null。
- head 中每格是列头，scope 为 col；body/foot 中 header:true 默认为 row，只关联其右侧且行范围相交的格。显式 rowgroup 必须位于本段首行并跨完整段。scope 仅用于表头格；不写 colgroup，不用 scope 修补错误跨度。库生成 headers 关联，不在 JSON 中伪造 DOM ID。
- `status:"ready"|"loading"|"error"` 默认 ready，可配 `message:S`。非 ready 保留 caption/表头而不展示数据体；ready 无数据是真实空态。这些值不触发请求、不计算合计。宽表局部滚动、保留原生 table 语义，不是可编辑电子表格。

原生完整例见 [基础增强示例](examples/foundation-explainer.json)。复杂跨度应先用同版 validateDocument 校验，再实看窄屏滚动与表头关系。

### 指标、表格与图

- `metric`：`{type:"metric",label:S,value:V,unit?:S,hint?:S,precision?:0..6整数,color?:上述语义色}`。
- `metric-grid`：`{type:"metric-grid",children:[metric节点,...],columns?:1..4整数}`，1–12 个指标。
- 简单矩形 `table`：`{type:"table",columns:[S,...],rows:[[V,...],...],caption?:S}`。1–20 列，每行单元数等于列数，最多 200 行；缺测格用 `null`。
- `chart`：`{type:"chart",kind:"line"|"bar"|"scatter"|"area"|"donut",xKey:S,xScale?:"category"|"linear"|"time",xLabel?:S,xMin?:N,xMax?:N,timezone?:S,data:[{字段:V,...},...],series:[{key:S,label:S,color?:"blue"|"green"|"orange"|"red"|"purple"|"gray"},...],title?:S,unit?:S,note?:S,yMin?:N,yMax?:N,status?:"ready"|"loading"|"error",message?:S}`。0–300 行、1–6 系列，系列 key 不重复；每行含 xKey 和各系列 key。Y 解析为有限数值或 null。
  - `category` 默认把字符串/数值标签等距排放。真实距离、数值大小用 `linear`，X 必须解析为有限数值：0、1、100 三个点不能等距伪装成真实坐标。
  - `time` 的 X 用带 `Z`/明确偏移的 ISO 时间（可含秒/毫秒）或 Unix 毫秒；`timezone` 为有效 IANA 时区，默认 UTC。不能用无时区的日期时刻或把 Unix 秒当毫秒。`xLabel`/`unit` 写清轴和单位。
  - line/area/bar 在 linear/time 下，X 按真实数值/时刻严格递增、不可重复；scatter 必须用 linear/time，允许无序或重复 X。散点表示成对观测；面积强调量随 X 的变化，不表示堆叠。
  - xMin/xMax 是有限数值（time 也用 Unix 毫秒）；显式域不得裁掉观测，且下界小于上界。yMin/yMax 同理。缺测 Y 用 null，线/面积在这里断开。不要为了合规改掉原始数据；不要用限制坐标域隐藏极值。
  - donut 只用 category、恰好一个系列、非负数值或 null，不加任何坐标边界；总和为零显示空状态。适合少量类别的整体构成，不能表现趋势或负数。
  - `data:[]` 或全部 Y 缺测是空状态；loading/error 可配 message，但仍提供合法必填字段。它们不会请求数据。系列开关、数据表、图上方向键/Home/End 由库提供；本版不支持缩放、堆叠、框选、导出或用 state 改 kind。
- `topology`：`{type:"topology",nodes:[{id:S,label:S,subtitle?:S},...],links:[{from:S,to:S,label?:S,load?:V},...],highlight?:"max-load"|"none",caption?:S}`。2–24 个节点、1–40 条边；节点 id 唯一，from/to 必须指向存在的 id。load 解析为数值，用 `"max-load"` 强调最大负载。它是关系示意，不是地理地图。

标签、列名、控件名和拓扑 id 保持 1–200 字符；普通文字不超过 12,000 字符，单条 `math.latex` 不超过 6,000。子节点数组最多 500 项，列表最多 100 项，步骤 1–20 项。可选 `unit` 无内容时直接省略，不填空字符串。图表没有有效观测时保留真实空状态，不捏造点填满；不得使用无限大/NaN 数值。

### 控件

- `slider`：`{type:"slider",label:S,bind:名称,min:N,max:N,step:N,unit?:S}`；bind 指向数值 state，`min < max`，`0 < step <= max-min`，初值在范围内并与步长对齐。
- `toggle`：`{type:"toggle",label:S,bind:名称}`；绑定布尔 state。
- `select`：`{type:"select",label:S,bind:名称,options:[{value:字符串或数值,label:S},...]}`；1–40 个不同选项，全部与初值同类型，初值必须是一个选项。
- `button`：`{type:"button",label:S,action:{kind:"reset"}}` 恢复初始状态；或 `action:{kind:"set",bind:名称,value:字符串或数值或布尔值}` 设置已声明的 state。

上述基本控件只能改 state，不能写 computed；它们不会发起网络请求，也不是 form 的提交按钮。除标为 `V` 的字段外，其余字段必须是字面值：例如不能把 `chart.kind`、`math.latex` 或 `section.heading` 改成引用。

### 本地表单：输入、确认与状态

多字段/约束/本地确认用form；单数字试算用slider，不无故收集个人信息。四种输入共享可选id:S,hint:S,error:V,required:B,disabled:V：error解析为字符串（空串无错误），disabled为布尔。slider/toggle/select无这些属性，可放field整体禁用。

| type | 必填字段（除 type） | 额外可选字段 |
| --- | --- | --- |
| `input` | `kind:"text"|"number"|"email",label:S,bind:名称` | `placeholder:S`；text/email 用 `minLength/maxLength`，number 用 `min/max/step` |
| `textarea` | `label:S,bind:名称` | `placeholder:S,rows:2..20整数,minLength/maxLength` |
| `radio` / `segmented` | `label:S,bind:名称,options:[{value:字符串或数值,label:S,disabled?:B},...]` | 上述共享字段 |
| `field` | `label:S,children:Node[]`（1–20项） | `id:S,hint:S,disabled:V`；分组/继承禁用，不是单个输入 |
| `form` | `label:S,children:Node[]` | `id:S,submitLabel:S,cancelLabel:S,disabled:V,successMessage:S,errorMessage:S`；宿主专用 `action:S` 见下 |

- text/email/textarea 绑定字符串 state；number 绑定数值 state。radio/segmented 的1–40个选项使用相同原始类型，值唯一，初值属于选项；选项 disabled 是字面布尔值。required 是字面布尔值，不写成表达式。
- minLength 为0–12000整数，maxLength 为1–12000整数，按 HTML 的 UTF-16 单元计数；上下限有序。number 的 min/max 有序、step 为正数；不要把文本约束写到 number 或把数值约束写到文本。
- 初值可未填有效，失焦/提交显示错误；结构校验成功不等于表单有效。用户在 number 输入框中键入的空白/不完整、非有限数字，及不满足 min/max/step 的有限数字仅作DOM草稿，不写入state；非required的空number也须修正/取消。指标保留最后接受的数字值，不证明草稿有效。text/email/textarea 仍即时写入字符串，格式/长度/required 错误可能已在state中；不可泛称所有字段都保留最后有效值。
- number 的 step 相对 min（省略 min 时为0）对齐；未给 step 时允许有限小数。不相关 setState 保留数字草稿；宿主对该 bind 明确 setState 或基本 button set 会覆盖草稿，即使赋同一个值。成功的 reset/表单取消清除相应草稿与错误；拒绝的更新不能假称重置成功。
- 宿主明确 setState 的有限数值是权威 state 写入：它仍须通过类型、引用、计算和其他全局约束，但 form 的 min/max/step 不是全局state约束，所以越界或不合步长的宿主数值也可能写入并覆盖输入框。此时指标随state更新，表单失焦/提交仍判无效；宿主须自行决定是否允许这种初值/更新，不把表单校验当宿主数据验证。
- form 不能嵌套。默认省略 action：内置提交按钮只做本地校验、显示结果、派发 `iui:submit`（`{id,values}`）；没有联网、保存或自动刷新。快照只含该表单未禁用的绑定字段，含嵌套 field 内的 slider/toggle/select；不夹带全局无关 state 或 computed。
- form取消中止宿主动作并恢复本表单初值；若违反全局约束则报错、保留有效状态。普通button的reset重置整份文档，不能替代局部取消。
- **本页 Web Chat 壳不注册宿主动作，必须省略 form.action。** 仅已有可信宿主明确提供并获授权的白名单标识符才可填 action；它不是 URL/函数/fetch。宿主 Promise 产生真实 busy/error/retry，忙碌时防重、取消/替换后忽略迟到结果。不要给 form 编造 `status:"loading"`；无宿主时也不能假称数据已发送。文件上传、日期选择器、富文本与正则 pattern 均未支持。

### 时钟、秒表与倒计时

展示某个瞬间/当前设备时区时间用 clock；累计经过多久用 stopwatch；从已知时长向零计时用 timer。只需写明一个时刻或时长时用正文即可。三者属于 time 域，都是页内本地组件，字段是字面值，不接受 V、bind、自动开始、回调、通知或服务 URL。

| type | 必填字段（除 type） | 可选字段与初始状态 |
| --- | --- | --- |
| `clock` | `mode:"live"|"snapshot",timezone:S` | `id:S,title:S,hourCycle:"h12"|"h23",seconds:B`；默认 h23、显示秒。snapshot 必须有 at，live 禁止 at |
| `stopwatch` | 无 | `id:S,title:S,elapsedMs:0..604800000整数,laps:B`；默认0、允许分圈，暂停起始 |
| `timer` | `durationMs:1..604800000整数` | `id:S,title:S`；暂停起始，显示完整输入时长 |

- timezone 为有效 IANA 时区。snapshot 的 at 是有效且带 Z/明确偏移的 ISO 时间，最多40字符；不会前进。live 读取设备时钟并显示该区日期，不是服务端校时；没有可信实时时间来源时，不把设备时钟说成权威时间。id/title 为1–200字符。
- 两种时长控件用单调时间基线追踪；迟到回调按经过时长追赶，不按回调次数累加。页面关闭不继续提醒，设备挂起不保证准确恢复；不能用来承诺服药、紧急事件或必须送达的系统闹钟。
- stopwatch 提供开始、暂停/继续、重置及可选分圈；重置回 文档给定的 elapsedMs 并暂停，不一定回零。最多100条内存分圈，达上限禁用分圈且保留已有条目；暂停时不能记圈。首圈 split 不包括 文档给定的 elapsedMs，total 包括它；达到604800000ms停止并显示上限。
- timer 到零停止，显示不为负，单次运行只播报一次完成；正的不足一显示单位的剩余时长向上显示。完成后的重新开始从原 durationMs 开始计时；重置回原时长但保持暂停。没有铃声、推送、持久化或跨标签同步。
- 内建原生按钮支持 Tab、Enter、Space；动作/完成另行播报，时间数字不会逐 tick aria-live 播报。当前按钮被禁用时库把焦点移到相应可用动作，普通 ticking 不夺焦点。不要手写按钮替代或额外重复播报。
- `setState` 不重建这些控件：不相关 state 更新或文档 state 重置不会重置其局部计时/圈数。`update(nextDocument)` 成功时有意重建并恢复新文档初始值；校验失败原子拒绝，保留现有界面。dispose 取消定时器/监听。需要改变 durationMs 等配置时改文档后 update，不能猜一个 state 绑定。

```json
{"type":"clock","title":"固定瞬间的上海时间","mode":"snapshot","timezone":"Asia/Shanghai","at":"2026-10-09T00:00:00Z","hourCycle":"h23","seconds":false}
```

最小页内倒计时是 `{"type":"timer","title":"两分钟练习","durationMs":120000}`，不会自行开始。完整例见 [时间组件](examples/local-time.json)；状态边界见 [时间与浮层](references/time-and-overlays.md)。

### 小提示与非模态说明面板

两者是 base 常用节点，在此直接给全量常用合同。短的非交互解释用 tooltip；含链接、表单或其他控件的按需补充内容用 popover。关键说明、错误信息与必须读完的条款直接留在正文，不只藏在悬停内容里；长正文优先 details/section。

- `tooltip`：`{type:"tooltip",label:S,value:S,placement?:"top"|"bottom",id?:S}`；label 为1–200字符可见原生帮助按钮名，value 为最多2000字符惰性纯文本；placement 默认 top。它不是任意节点包裹器，不能写 children、HTML、交互链接或 V。
- `popover`：`{type:"popover",label:S,children:Node[],title?:S,placement?:"top"|"bottom",id?:S}`；label/title 为1–200字符，children 1–20，默认 bottom。所有子节点仍遵守自身领域合同；标题省略时以触发器 label 命名。不是模态确认框，不会阻塞背景或自动提交表单。
- tooltip 可悬停、聚焦或轻触打开；指针移至内容时保持可见；离开/失焦或 Escape 关闭。popover 用点击/Enter/Space 开关，打开聚焦其关闭按钮；Close/Escape 归还触发器焦点，外点或焦点移出分支关闭但不抢外部目标焦点，Tab 不锁在面板内。
- 每个文档同时只保留一个 popover 分支：打开同级会关闭前分支，嵌套面板保留祖先，Escape 每次只关最深一层，关闭祖先同时关闭后代。不要靠同时打开兄弟面板完成必需流程。
- placement 是偏好，库会为视口边缘翻转/收窄。原生顶层 API 不可用时降级为页面流式展开，不保证浮动几何；滚动/缩放会重新定位，锚点不可见/被移除时关闭。不要加 CSS 去绕过降级或越过遮挡。
- 开关面板不重置子内容的本地状态；不相关 setState 保留打开状态、焦点与已渲染子节点。隐藏时间控件不会自动暂停；隐藏表单不会自动取消动作。需要真正结束它们时使用组件自身的暂停/取消，或由宿主明确 update/dispose。成功 update/dispose 会移除旧浮层及其子内容。
- label/title/value 都按文本处理。子 form.action 仍只可使用可信宿主已提供且获授权的白名单标识；本页 Web Chat 壳没有宿主动作用途，必须省略。不把提示当数据获取器或借面板发起请求。

```json
{"type":"popover","label":"查看计时说明","title":"仅在页面内运行","children":[{"type":"text","value":"请保持页面打开。计时结束不会播放声音，也不会发送系统通知。"},{"type":"tooltip","label":"为什么要说明这个限制？","value":"避免把页面内倒计时误认为可保证送达的系统闹钟。"}]}
```

可访问性语义与键盘约定来自库，不能据此宣称已通过所有浏览器/屏幕阅读器审计。作者仍需给可理解标签，检查键盘、触屏、缩放、浅深色及窄屏；未验项目要明确。完整例见 [按需说明](examples/local-overlays.json)。

### 流式排列、有限图标与状态点

三者均归 base，常用规则直接保留在根文件；旧版本不一定支持，必须保留本文匹配的固定运行时。

- `flow`：`{type:"flow",children:Node[],gap?:"none"|"sm"|"md"|"lg",align?:"start"|"center"|"end",justify?:"start"|"center"|"end"|"between",id?:S}`；children 1–50，默认 gap:md、align:center、justify:start。用于一行短标签、图标/文字或少量相关控件，宽度不足时按原数组顺序换行。不是文字段内富文本、grid/masonry，也不会改变阅读顺序；grid-item 仍只能是 grid 的直接子节点。这里 gap 是枚举，不是 box/row 等容器的数字 gap；不加 width、order、绝对定位或任意 CSS。
- `icon`：`{type:"icon",name:图标名,size?:"sm"|"md"|"lg",tone?:"default"|"muted"|"info"|"success"|"warning"|"danger",label?:S,id?:S}`。图标名仅 `info/check/warning/error/plus/minus/arrow-left/arrow-right/external-link/clock`。默认 md、default；sm/md/lg 为16/20/24 CSS像素。都是库内原创有限几何，不读图标包、URL或传入SVG path；不是任意图标加载器。
  - 旁边文字已经表达含义时省略 label，让图标作为装饰；独立承担信息时提供1–200字符 label，使它成为有名称的 img。它永不进入键盘焦点序列，不是按钮，不能加 action、href 或点击回调。需要行为时使用有可见标签的 button/link。
  - `name:"clock"` 只是时钟图案，不显示设备时间或计时；真正时间组件仍用 `type:"clock"/"stopwatch"/"timer"`。tone 不应作为唯一信息载体。
- `pulse-indicator`：`{type:"pulse-indicator",label:S,status:"idle"|"busy"|"success"|"warning"|"error",animate?:B,id?:S}`；label 为1–200字符可见文字，status 必填，animate 默认 true。库同时显示本地化状态文字；点本身是装饰。只有 busy 可以动画，减少动态效果设置下静止；animate:false 可始终关闭动画。
  - status 是调用方提供的字面值，不填 V、bind、进度百分比、自动倒计时或服务地址；不会自行从 busy 变 success，也不会联网。仅在已有真实状态时说明实际任务；合成示例须明确标为合成，不把动画伪装成正在发送/保存。
  - 没有重复 live-region 播报，不能替代重要完成/失败通知。需要改变 status 时由可信宿主 update 新文档；setState 不会改这个字面配置。成功 update 会重建整份文档，可能清除其他组件的本地草稿、计时和面板状态；不要用循环 update 来做闪动或进度模拟。

选型例：短语义提示用 `flow` 放装饰 `icon`＋清楚文字；正文强调仍用 text.runs；精确列对齐用 grid/table；需要描述已知状态用 pulse-indicator，单个静态分类可用 badge。默认无需同时叠加图标、状态点、badge和callout。

最小流式提示（图标旁已有可读解释，因此不重复命名）：

```json
{"type":"flow","gap":"sm","children":[{"type":"icon","name":"info","tone":"info"},{"type":"text","value":"这是原创合成示例，不代表实时设备或服务状态。"}]}
```

明确提供、且不自行变化的合成状态：

```json
{"type":"pulse-indicator","label":"合成任务状态示意","status":"busy","animate":false}
```

完整原生例见[流式提示与状态](examples/local-status-primitives.json)。完整文档仍须通过同版validateDocument，不把本节生成指导当成另一份Schema。

### 组合边界

正文交代问题，weather提供环境快照，form输入state，computed推导，metric/chart读取V。不自动把表单连到天气数据。反例：城市名交weather查询、0.4当40%、form设URL action、空数字写null、嵌套form、category画不等距数轴、donut负数/多系列、scatter无xScale。未列地图/球员等节点不要猜标签。

### 学习：本地自测与闪卡

quiz检验客观理解，flashcards用于先回忆后翻面自评。先讲概念再给少量题；主观建议不设唯一答案。作者核实答案/解释；答案已在HTML中，不适合保密考试。

- `quiz`：`{type:"quiz",title:S,questions:[题,...],id?:S,description?:S,status?:"ready"|"loading"|"error",message?:S}`。
- 题：`{id:S,kind:"single"|"multiple",prompt:S,choices:[{id:S,label:S},...],correct:[选项id,...],explanation:S,latex?:S,explanationLatex?:S,points?:1..100整数}`。0–100题，每题2–20选项，correct非空且不重复、只引用本题选项；single必须恰好一个答案，multiple可以一个或多个。points默认1。
- `flashcards`：`{type:"flashcards",title:S,cards:[卡,...],id?:S,description?:S,status?:"ready"|"loading"|"error",message?:S}`。
- 卡：`{id:S,front:S,back:S,hint?:S,frontLatex?:S,backLatex?:S}`，0–100张。正反面纯文本，公式放各自LaTeX字段。

题/卡id在各自数组内唯一，选项id在本题内唯一；这些id以英文字母或下划线开头，后接字母、数字、下划线、点或短横线，最多80字符。title为1–200字符，题干/正反面/公式最多6000字符且非空，explanation必填、最多6000字符；选项label非空最多2000字符，hint最多2000。内容不接受V表达式、bind、HTML或随机出题脚本。

最小自测节点：

```json
{"type":"quiz","title":"先自己算一算","questions":[{"id":"sum","kind":"single","prompt":"2加3等于多少？","choices":[{"id":"four","label":"4"},{"id":"five","label":"5"}],"correct":["five"],"explanation":"把2和3相加得到5。"}]}
```

确认后显示答案/解释并锁题、防重复得分，才能下一题；可回看。multiple须集合完全相同，无部分分。进度按题数、成绩按points；完成显示总分/逐题结果，重来清空。

闪卡先揭晓再自评，重复标记只更新本卡。导航保留标记、新卡回正面；全评后总结，重来清空。无间隔重复调度或能力诊断。

空数组为空态；loading/error保留title/合法数组并说明message。学习状态只在组件本轮，不写state、不保存/同步/联网；刷新或update重置。无提交URL/成绩上报/考试服务。

### 辅助内容、容器与受控矢量图

下面补充全部辅助节点的适用场景。优先使用上面更具体的语义节点；不要为凑组件加空白、徽章或轮播。

| type | 生成合同 | 何时用 / 边界 |
| --- | --- | --- |
| code | {type:"code",value:S,language?:S,id?:S} | 展示原样代码；language只作语言说明，不承诺语法高亮、复制服务、编辑或执行。value最多12000字符 |
| badge | {type:"badge",value:V,color?:"default"|"secondary"|"tertiary"|"success"|"warning"|"danger"|"info"|"accent",id?:S} | 紧凑状态/分类标签；重要含义还须有文字，不能只靠颜色 |
| divider | {type:"divider",id?:S} | 真实段落边界；有标题时通常不必再加分隔线 |
| spacer | {type:"spacer",height?:0..200整数,id?:S} | 少数明确留白需要；height默认16像素。正常正文依赖自动间距，不用它拼桌面坐标布局 |
| box | {type:"box",children:Node[],id?:S} | 通用容器；有章节/图注语义时改用section/figure，有完整独立内容才用card |
| carousel | {type:"carousel",children:Node[],id?:S} | 同级短条目/授权图片需要横向浏览时用；组件为可聚焦的横向区域，不是自动播放、远程分页或图片编辑器。空数组不造占位内容 |
| markdown | {type:"markdown",value:S,id?:S} | 只用于明确保留原始Markdown文本；界面会显示纯文本降级提示，不执行Markdown格式。正常正文用text/list/title/math，不期待星号变粗或链接自动生成 |

box/card/row/col/grid共享可选布局字段：gap、padding为0–16整数；radius为none/sm/md/lg/xl/2xl；border为B；background为none/surface/surface-secondary/surface-tertiary/success-soft/danger-soft/info-soft；align为start/center/end/stretch；justify为start/center/end/between/around；width为30–1400整数或"100%"/"auto"。grid另有columns 1–6。默认省略这些旋钮，避免固定像素宽度；它们是受控JSON字段，不授权写CSS或塞HTML。children最多500项。辅助节点的id、language为1–200字符；正文value按各节点约束，不把id误当全局state引用。

svg用于原创、静态且普通chart/topology不足以表达的小矢量示意。不要用它重做现有组件、假地理地图、交互编辑器或复制无授权第三方图。

- {type:"svg",viewBox:S,shapes:[{tag:标签,attrs:{属性:有限数值或字符串},text?:S},...],label?:S,id?:S}。
- viewBox为四个非负整数字符串，如"0 0 200 100"，宽高必须大于0且面积有限。shapes为1–150项，每项attrs最多24个属性；label写可理解的替代说明；text/label/属性字符串最多12000字符。
- tag仅rect、line、circle、path、text、polyline、polygon。只有text标签需要文字时填写shape.text；这不是HTML，也不是嵌套SVG字符串。
- 数值属性仅x/y/x1/y1/x2/y2/cx/cy/r/rx/ry/width/height/stroke-width/opacity/fill-opacity/stroke-opacity/font-size/dx/dy，须有限、无单位；半径/宽高/线宽/字号非负，透明度0–1。
- fill/stroke用none、currentColor、transparent、black/white/red/green/blue/gray/grey/orange/purple、十六进制颜色或数字形式rgb/rgba/hsl/hsla；不允许url()、CSS变量或外部资源。
- d只含标准SVG路径命令M/Z/L/H/V/C/S/Q/T/A（可小写）与有限数字；points为数字列表；stroke-dasharray为数字列表或none；transform仅数字参数的translate/scale/rotate/matrix/skewX/skewY。
- stroke-linecap为butt/round/square，stroke-linejoin为miter/round/bevel，text-anchor为start/middle/end，dominant-baseline为auto/middle/central/hanging/text-before-edge/text-after-edge/alphabetic，font-weight为normal/bold或100至900的整百值。未列属性禁止；不写style、class、href、onload、foreignObject、image、动画或脚本。

```json
{"type":"svg","viewBox":"0 0 200 80","label":"原创示意：两个点由直线相连","shapes":[{"tag":"line","attrs":{"x1":30,"y1":40,"x2":170,"y2":40,"stroke":"currentColor","stroke-width":2}},{"tag":"circle","attrs":{"cx":30,"cy":40,"r":8,"fill":"currentColor"}},{"tag":"circle","attrs":{"cx":170,"cy":40,"r":8,"fill":"currentColor"}}]}
```

native是历史识别项，当前验证明确返回UNSUPPORTED_NATIVE；不要生成，也不要寻找私有运行时来绕过。历史盲测保持各自固定版本与原始输入，不用本版重新计算首试成绩。

### 常用本地单位换算

已知物理单位之间的量用unit-converter；已提供同一基准币种汇率快照的金额换算用currency-converter。只需一句固定换算结果时可直接用正文；读者需要改数值/单位才加组件。金融行情比较仍只比较各自币种的相对变化，不会自动调用货币换算器。两个转换器均为本地组件，不读写文档state、不联网取报价、不交易、不保存输入；字段均为字面值，不填V、bind或API端点。


必填{type:"unit-converter",category:类别,amount:N,from:单位ID,to:单位ID}；可选id:S,title:S,precision:1..12整数,temperatureMode:"absolute"|"difference"。precision为最大有效数字数（默认8），不是小数位数。temperatureMode只可用于temperature，默认absolute。from/to大小写敏感，必须同属category；不要把显示标签或单位符号猜成ID。

| category | 用途 | 可用单位ID |
| --- | --- | --- |
| length | 长度/带方向的位移 | m, cm, mm, km, in, ft, yd, mi, nmi |
| mass | 质量 | kg, g, mg, t, lb, oz |
| temperature | 温度或温差 | K, C, F |
| speed | 速度 | m-s, km-h, ft-s, mph, kn |
| area | 面积 | m2, cm2, km2, ft2, ha, acre |
| volume | 体积 | L, mL, m3, gal-us, gal-imp |
| time | 固定时长 | s, ms, min, h, d |
| pressure | 压强 | Pa, kPa, MPa, bar, atm, psi |
| data | 数据量 | B, bit, kB, MB, GB, KiB, MiB, GiB |

absolute计入温标偏移，不得低于绝对零度（0K、−273.15°C、−459.67°F）；difference只换算带符号温差，不加偏移，如10Δ°C=18Δ°F。其他类别允许负值但调用方需解释其含义。kB/MB/GB为十进制，KiB/MiB/GiB为二进制，B是字节、bit是比特；日为86400秒固定时长，不代表日历月份/年份或时区计算；gal-us为美制液体加仑，gal-imp为英制，不含美制干量加仑或美国测量英尺。

```json
{"type":"unit-converter","title":"把长度换成厘米","category":"length","amount":1.25,"from":"m","to":"cm","precision":8}
```

温差例：把上述节点改为category:"temperature",amount:10,from:"C",to:"F",temperatureMode:"difference"。不要用absolute算温差。单位组件没有status/message；非法初始温度或类别混用会被验证拒绝。输入允许十进制/科学记数法；空串、未完成1e、千位分隔符和非有限数不当作0。互换仅交换单位、数值不变；重置恢复初值。极小值用科学记数法，超出可表示范围则报错。currency-converter的完整rates合同按领域索引读取，不从本节推测。

## 4. 绑定与表达式

V为字符串、有限数值、布尔、null、{"$":"名称"}或{"op":"运算符","args":[V,...]}。$只引用state/computed名称，非属性路径；依赖无环，不用函数/字符串公式/模板/脚本。展示公式放math.latex。

| 运算符 | 参数与结果 |
| --- | --- |
| `add` / `mul` / `min` / `max` | 1–12 个数值，返回数值 |
| `sub` / `div` | 两个数值，按顺序相减/相除；除数不能为零 |
| `abs` | 一个数值 |
| `round` / `format` | 数值，及可选的 0–6 位整数精度；round 返回数值，format 返回字符串 |
| `clamp` | 数值、下界、上界，下界不大于上界 |
| `gt` / `lt` | 两个数值，返回布尔值 |
| `eq` | 两个值，返回是否相等 |
| `if` | 布尔条件、条件成立值、条件不成立值 |

派生值放进 `computed`，例如 `"total":{"op":"mul","args":[{"$":"rate"},10]}`，在指标或图表数据里用 `{"$":"total"}`。检查整个可选输入范围：分母保持非零，单位一致，不把格式化字符串当图表数值。

evaluateState(document,patch)在浏览器也可用：成功{ok:true,state,computed}，失败{ok:false,issues}，先检查ok。每次由初始state加patch计算；连续变更须合并当前state。它不更新DOM，显示页面用controller.setState(patch)。patch不能写computed。

## 5. 检查与修复

| 问题 | 修复 |
| --- | --- |
| `SCHEMA` | 对照本页结构补必填字段、删猜测属性；不要把子集记号 `?`、`S`、`V` 写进 JSON |
| `UNKNOWN_REFERENCE` / `UNKNOWN_BIND` | 修正名字或声明 state/computed；绑定必须写 state 名 |
| `COMPUTED_CYCLE` | 把计算改成无环依赖，输入放 state |
| `INPUT_TYPE` / `INPUT_RANGE` | 检查控件初值类型、范围、步长与选项 |
| `OPERATOR_ARITY` / `OPERATOR_TYPE` / `DIVISION_BY_ZERO` | 修正参数个数、类型与整个输入范围中的除数 |
| `FIELD_CONSTRAINT` / `NESTED_FORM` | 检查字段约束类型/上下限，移除表单嵌套 |
| `CHART_AXIS` / `CHART_BOUNDS` / `CHART_ORDER` / `CHART_DONUT` | 匹配坐标类型、范围、排序及单系列非负组成；不要裁改真实观测 |
| `TIME_DATE` / `WEATHER_DATE` / `WEATHER_RANGE` / `TIMEZONE` | 修正日期/偏移/顺序、百分比与IANA时区，缺测保留null |
| `SPORTS_ID` / `SPORTS_TEAM` / `SPORTS_DATE` / `SPORTS_FILTER` | 查唯一id、存在的不同球队、时间偏移及初始筛选引用 |
| `SPORTS_STATUS` / `SPORTS_RESULT` / `SPORTS_PERIOD` / `SPORTS_STAT` / `SPORTS_RECORD` | 匹配状态与比分/胜者、详情标签唯一及赛绩和；不推断赛制 |
| `LEARNING_ID` / `QUIZ_ANSWER` | 修重复题/卡/选项id，正确答案只引用本题选项且符合单选数量 |
| `FINANCE_DATE` / `FINANCE_ORDER` / `FINANCE_ID` / `FINANCE_RANGE` / `FINANCE_FILTER` / `FINANCE_VALUE` | 查时间/顺序/id/区间或行业引用，确保变化百分比有限；缺基准保留不可比 |
| `UNIT_ID` / `UNIT_MODE` / `UNIT_RANGE` | 检查类别内单位ID、温度专用模式及绝对零度/有限结果 |
| `CURRENCY_ID` / `CURRENCY_RATE` / `CURRENCY_DATE` / `CURRENCY_RANGE` | 检查币种唯一/选择、相对base汇率方向、正值或null、base=1、时间偏移及有限结果 |
| `SVG_VIEWBOX` / `SVG_ATTRIBUTE` / `SVG_PAINT` / `SVG_NUMBER` / `SVG_PATH` / `SVG_TRANSFORM` | 检查正面积viewBox、属性白名单、安全字面颜色、有限数字和受控路径/变换；不加脚本或外部资源 |
| `TABLE_SOURCE` / `TABLE_SECTION` / `TABLE_LIMIT` / `TABLE_WIDTH` / `TABLE_SPAN` / `TABLE_OVERLAP` / `TABLE_SCOPE` | rows/sections二选一；按段核对逻辑列覆盖、跨度与表头scope，不给合并占位补null |
| `UNSAFE_URL` / `UNSUPPORTED_NATIVE` | 使用允许的公开 HTTPS 资源或本文节点；不要绕过校验、伪造私有组件 |

预览检查桌面/390px、明暗、中文/公式、键盘与反馈。未预览仍交完整HTML并说明；结构通过不等于事实/视觉正确，不手写CSS/HTML掩盖库错误。

## 6. 有终端的 Agent：可选本地路径

无终端跳过。核心仓库https://github.com/Micraow/Inform-UI使用上述CDN同一提交；在库目录先npm ci、npm run build，再执行：

```sh
node bin/iui.mjs validate answer.json --json
node bin/iui.mjs build answer.json --out answer.html --lang zh-CN
```

Node的compileHtml(input,{backend:"portable",assets:"inline"})返回HTML，内嵌库和数学字体data:URL（严格CSP须允许font-src data:）。所选远程图片仍需联网；不使用未发布的npx iui。

可选：[绑定](references/schema-and-binding.md)、[Agent工作流](references/library-workflow.md)、[边界](references/support.md)、[例子](references/examples.md)。要求JSON则只交JSON；要页面则交完整HTML。
