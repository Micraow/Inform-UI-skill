---
name: intelligent-ui-author
description: 为技术解释、真坐标图、本地表单、已提供天气/体育数据、本地自测/闪卡、拓扑和受控交互生成 iui/1 JSON；无终端的 Web Chat 可直接用固定 CDN 与本文 HTML 壳交付可运行文档，Agent 也可用本地库。普通文字足够时不强加界面。
---

# Intelligent UI Author

你负责内容、数据、阅读顺序与组件选择；Intelligent-UI 库负责校验、DOM、样式、布局和交互。目标是正文中自然穿插图、公式与有用的控件，形成克制的编辑式解释，不是把每段文字塞进仪表盘卡片。

本文件可完整复制给没有终端、无法读取本地文件的 Web Chat。下面内嵌的保守协议子集与 HTML 壳足以生成基础文档，不需要读库源码或其他文件。当前固定完整协议有46个节点注册项（含1个明确拒绝的历史native项）；本文覆盖37个常用节点的保守子集。完整 Schema URL 供有读取能力时扩展；拿到 URL 不等于已经读取其内容。读不到时只用本文明确列出的字段，不猜新组件。

这是一套独立于模型厂商的公开库，无需 OpenAI 账号、API 或私有运行时。`portable` 只是库的后端名称，不是另一种产品版本。CDN 页面需要联网加载库；它不是已发布的 npm 包。

## 1. 先决定要表达什么

- 先给结论/问题，再给证据或演示，随后解释读者应观察什么。未要求文档/可视化时，短答案可保留普通文字；用户明确要 HTML 时仍交付完整 HTML。
- 趋势用折线/面积图，类别比较用柱状图，成对观测用散点，少量非负组成用环图；连接/瓶颈用拓扑，推理过程用步骤与公式；少量重要数字用指标，精确数值用表格；推荐用标题、简短正文、链接，图片仅在有用且来源合适时加入。
- 只有能回答“如果改变输入，会怎样？”时才加控件，且必须连接可见结果。避免无效按钮、无关图表和装饰性卡片。
- 在正文或图注里标清真实测量、推导值或教学模拟；保留单位、假设、时间和来源。缺测用 `null`，不得补成零或虚构实测。
- 用 `section`、`figure` 表达分组，默认纵向阅读；`card` 只框住完整演示。不要写组件 HTML/CSS；不要添加固定宽度、像素间距、渐变背景。长公式拆成短公式并解释变量，手机上也能顺着读。

## 2. 无终端 Web Chat：完整 HTML 路径

固定的公开文件（同一提交，不混用版本）：

- 浏览器全局脚本：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f372c71d31633be85bb228f57fdb07da9e8f2112/cdn/iui.global.min.js`
- 进阶 ESM（可选）：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f372c71d31633be85bb228f57fdb07da9e8f2112/cdn/iui.min.js`
- 样式：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f372c71d31633be85bb228f57fdb07da9e8f2112/cdn/iui.css`
- 完整 JSON Schema：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f372c71d31633be85bb228f57fdb07da9e8f2112/cdn/iui.schema.json`

全局脚本加载后通过 `window.IUI` 访问浏览器 API：`validateDocument(input)` 返回 `{ok:true,document}` 或 `{ok:false,issues:[{code,path,message}]}`。`mount(element,document,{styles:false})` 把 JSON 渲染到容器；这里由独立 CSS 文件提供样式；必须保留 `styles:false`，使字体相对该 CDN 样式表加载。它返回 `update(nextDocument)`、`dispose()`、`getState()`、`setState(patch)`。**`compileHtml` 是 Node API，不能从浏览器模块导入。** 浏览器的 JSON→界面转换由 `mount` 完成。

数学排版使用可视 KaTeX HTML 与辅助阅读用 MathML。CSS 会从同一固定提交的 `cdn/fonts/` 按需加载 20 款官方 MIT WOFF2 字体，并非无字体下载。示例壳未设置 CSP；若宿主另设严格 CSP，除脚本/样式许可外，`font-src` 必须允许 `https://cdn.jsdelivr.net`。不要自行换字体或删除字体规则。

用户要 HTML 时，交付下列完整壳，并只替换 JSON 数据、页面语言、标题及与JSON theme相同的body data-theme。iui-page是库提供的整页背景入口，margin:0仅移除浏览器外边距；嵌入现有网页时由宿主决定整页背景。不要只输出 JSON 后声称已生成页面，也不要手写图表、卡片或控件 DOM。这个壳中的固定启动脚本仅加载库、解析数据、校验和挂载。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Intelligent UI 解释文档</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f372c71d31633be85bb228f57fdb07da9e8f2112/cdn/iui.css" integrity="sha384-C+dusRekNRJiTU/8pVtFBTI6qqJ60MrvrFkZSGX7DdoE7p9++WfH3OKUE1//MnjD" crossorigin="anonymous">
</head>
<body class="iui-page" data-theme="auto" style="margin:0">
  <main id="iui">正在加载界面…</main>
  <noscript>请启用 JavaScript 以查看这个交互文档。</noscript>
  <script id="iui-spec" type="application/json">
  {
    "version": "iui/1",
    "theme": "auto",
    "state": { "x": 4 },
    "computed": { "twice": { "op": "mul", "args": [2, {"$":"x"}] } },
    "body": [
      {"type":"title","level":1,"value":"观察一个输入与结果的关系"},
      {"type":"text","value":"改变 x，观察 2x 如何同步变化。"},
      {"type":"slider","label":"输入 x","bind":"x","min":1,"max":10,"step":1},
      {"type":"metric","label":"2x","value":{"$":"twice"}},
      {"type":"math","latex":"y=2x","block":true},
      {"type":"caption","value":"这是合成教学示例，不是实测数据。"}
    ]
  }
  </script>
  <script src="https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f372c71d31633be85bb228f57fdb07da9e8f2112/cdn/iui.global.min.js" integrity="sha384-iSRKUQ1PkW22WeAPJV0kUHRGTQMLfhge7BMgMaH2YdfeXAHE+YjrutcGVI9TVJS+" crossorigin="anonymous"></script>
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

嵌入 HTML 时，JSON 的所有 `<` 字符写成 `\u003c`，防止内容里的结束标签提前关闭数据块；不要把用户文本拼进启动脚本。JSON 中的反斜杠也要转义，例如 LaTeX 使用 `"\\frac{a}{b}"`。固定 URL 与 integrity 必须一起保留；不要混用版本，也不要删除完整性校验来掩盖加载失败。不要省略加载错误提示。若聊天宿主不允许运行脚本，给用户完整 HTML 保存为 `.html` 后在联网浏览器打开；不要声称聊天气泡内已经执行。未实际预览时应明确说明。

## 3. 内嵌协议：可以直接据此写 JSON

以下是完整 Schema 的**保守子集**，有意省略样式旋钮与进阶节点。记号 `?` 表示可省略，不是 JSON 键的一部分；`S` 是字符串，`N` 是有限数值，`B` 是布尔值，`V` 见下一节，`Node[]` 是本表节点数组。只输出实际 JSON，不输出这些记号。对象不加未列字段。

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

文字是普通文本，不把 Markdown/HTML 当格式执行。用多个 `text` 节点表示段落，用 `math` 表示公式。链接/图片在本页只使用可公开访问且有权使用的 HTTPS URL；URL 保持在 2,048 字符以内；没有合适图片就省略。普通节点需要来源时用可见图注与 `link`，不猜 `source` 属性；weather 的必填 source 见其专用契约。

### 指标、表格与图

- `metric`：`{type:"metric",label:S,value:V,unit?:S,hint?:S,precision?:0..6整数,color?:上述语义色}`。
- `metric-grid`：`{type:"metric-grid",children:[metric节点,...],columns?:1..4整数}`，1–12 个指标。
- `table`：`{type:"table",columns:[S,...],rows:[[V,...],...],caption?:S}`。1–20 列，每行单元数等于列数，最多 200 行；缺测格用 `null`。
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

需要多个有关联的字段、约束和一次本地确认时用 `form`；单个 what-if 数字仍可用 slider。不把普通解释做成收集个人信息的表单。以下四种新输入共享可选 `id:S,hint:S,error:V,required:B,disabled:V`：error 必须解析为字符串（空串表示无自定义错误），disabled 必须解析为布尔值。原 slider/toggle/select 没有这些新增属性；需要整体禁用时放入 field。

| type | 必填字段（除 type） | 额外可选字段 |
| --- | --- | --- |
| `input` | `kind:"text"|"number"|"email",label:S,bind:名称` | `placeholder:S`；text/email 用 `minLength/maxLength`，number 用 `min/max/step` |
| `textarea` | `label:S,bind:名称` | `placeholder:S,rows:2..20整数,minLength/maxLength` |
| `radio` / `segmented` | `label:S,bind:名称,options:[{value:字符串或数值,label:S,disabled?:B},...]` | 上述共享字段 |
| `field` | `label:S,children:Node[]`（1–20项） | `id:S,hint:S,disabled:V`；分组/继承禁用，不是单个输入 |
| `form` | `label:S,children:Node[]` | `id:S,submitLabel:S,cancelLabel:S,disabled:V,successMessage:S,errorMessage:S`；宿主专用 `action:S` 见下 |

- text/email/textarea 绑定字符串 state；number 绑定数值 state。radio/segmented 的1–40个选项使用相同原始类型，值唯一，初值属于选项；选项 disabled 是字面布尔值。required 是字面布尔值，不写成表达式。
- minLength 为0–12000整数，maxLength 为1–12000整数，按 HTML 的 UTF-16 单元计数；上下限有序。number 的 min/max 有序、step 为正数；不要把文本约束写到 number 或把数值约束写到文本。
- 文档可以有空白或不合约束的字段初值，失焦/提交时显示错误；`validateDocument` 成功不等于用户表单已填写有效。数字的空白/不完整输入只作 DOM 草稿，不把 state 改成 null、空串或 NaN。即使不是 required，清空 number 也要修正或取消；指标保留最后的有效 state，不表示草稿有效。
- form 不能嵌套。默认省略 action：内置提交按钮只做本地校验、显示结果、派发 `iui:submit`（`{id,values}`）；没有联网、保存或自动刷新。快照只含该表单未禁用的绑定字段，含嵌套 field 内的 slider/toggle/select；不夹带全局无关 state 或 computed。
- 取消中止进行中的宿主动作，并尝试恢复本表单初值；其它全局约束使恢复无效时显示错误、保留有效状态。用 form 自带取消按钮；普通 `button` 的 reset 会重置整份文档，不能冒充局部取消。
- **本页 Web Chat 壳不注册宿主动作，必须省略 form.action。** 仅已有可信宿主明确提供并获授权的白名单标识符才可填 action；它不是 URL/函数/fetch。宿主 Promise 产生真实 busy/error/retry，忙碌时防重、取消/替换后忽略迟到结果。不要给 form 编造 `status:"loading"`；无宿主时也不能假称数据已发送。文件上传、日期选择器、富文本与正则 pattern 均未支持。

### 天气：展示已提供的数据，不接入服务

`weather` 适合展示有来源的当前观测、逐日和逐小时数据。缺乏真实数据时，若任务是示例/教学演示，可明确写 synthetic:true；不能把演示当成实时预报。节点必须包含以下全部字段，状态页也不能省略它们：

```json
{"type":"weather","location":{"name":"合成观测点","timezone":"Asia/Shanghai"},"updatedAt":"2026-12-15T08:00:00+08:00","source":{"label":"教学合成数据","synthetic":true},"units":{"temperature":"celsius"},"current":{"time":"2026-12-15T08:00:00+08:00","temperature":12,"condition":"cloudy"},"daily":[{"date":"2026-12-15","low":8,"high":16,"condition":"cloudy","precipitationProbability":30}],"hourly":[{"time":"2026-12-15T08:00:00+08:00","temperature":12,"precipitationProbability":30}]}
```

- `location:{name:S,timezone:S}` 使用有效 IANA 时区。updatedAt 是该批数据的更新时间；current.time/hourly.time 是观测/预报时刻，全部用带 Z 或明确偏移的 ISO 时间，不能仅写本地钟面时间。
- `source:{label:S,synthetic:B,url?:S}` 必填；真实来源可补允许的 HTTPS URL。`units:{temperature:"celsius"|"fahrenheit"}` 表示原始数值单位。
- `current:{time:S,temperature:N|null,condition:条件,feelsLike?:N|null,humidity?:N|null}`。
- `daily:[{date:"YYYY-MM-DD",low:N|null,high:N|null,condition:条件,precipitationProbability:N|null},...]`，0–16天、有效日期严格递增且唯一；low/high 都已知时 low 不大于 high。
- `hourly:[{time:S,temperature:N|null,precipitationProbability:N|null},...]`，0–384项，按真实时刻严格递增；夏令时重复的01:00需保留不同偏移，不能去掉偏移后重排。
- 条件只能是 clear、partly-cloudy、cloudy、rain、snow、storm、fog、unknown。湿度和降水概率是0–100百分数或null；0是真实零，null是缺测。0.4代表0.4%，要表示40%就填40。天气数值/日期不接受 V 表达式或 state 引用。
- 可选 `id:S,initialDate:S,status:"ready"|"loading"|"error",message:S`；initialDate 必须在 daily 中，无daily就省略。空状态用daily/hourly空数组及已知或null的current；loading/error加说明，不虚构请求进度。
- ℃/℉、日期、温度/降水概率、图/表切换由组件本地处理，并从原始值换算，不改变输入文档。它们是weather自身视图状态，不是文档state的可绑定字段；不能写 `bind`、API密钥、城市查询或刷新端点。

### 组合时保持边界清楚

先用正文解释问题，再用weather交代已提供的环境信息；需要试算时加本地form，将数值输入写入state、推导写入computed，由metric/chart的V字段读取。天气可以独立展示；表单不会自动改weather里的字面数据或查询新预报。一个有效的小组合是“观测背景 → 输入试算倍率 → 不等距坐标图 → 结果解释”，图的横坐标来源和单位应明确。不要为了展示所有组件而堆砌重复图表。

反例：把城市名交给weather让它查天气、把0.4当40%、给form设置URL action、把数字草稿清空写入null、嵌套form、用category画不等距数轴、给donut负数/多系列、给scatter省略xScale，均不符合本版边界。金融、地图、球员档案等未列出的领域节点不在当前固定合同内，不能猜标签名。

### 体育：调用方供数的赛程、记分牌与积分榜

选择视图时先问读者要看什么：接下来何时比赛用 `sports-schedule`；一场的当前比分、分节与统计用 `sports-scoreboard`；多队排名与赛绩用 `sports-standings`。三者只显示提供的数据，不能抓比分、自动计时或订阅直播。没有真实数据的教学页必须标明合成。

三个节点都必填 `type,data`，可选 `id:S,status:"ready"|"loading"|"error",message:S`。额外字段分别是：

- `sports-schedule`：`initialDate?:"YYYY-MM-DD",initialTeamId?:S,initialStage?:S`；日期允许无比赛，球队与阶段须来自 data。
- `sports-scoreboard`：`gameId?:S`，若指定必须存在；省略时优先进行中比赛，再取最早一场。
- `sports-standings`：`initialTeamId?:S,initialGroup?:S`，若指定须对应已有数据。

每个节点内放完整的 `data` 对象，不是 URL、变量名或 `$` 引用。下面给出最小完整节点：

```json
{"type":"sports-scoreboard","data":{"league":{"id":"demo_cup","name":"合成示例杯","sport":"football"},"timezone":"Asia/Shanghai","updatedAt":"2026-10-10T18:00:00+08:00","source":{"label":"原创教学数据","synthetic":true},"teams":[{"id":"north","name":"北岸队"},{"id":"south","name":"南岸队"}],"games":[{"id":"match_one","startAt":"2026-10-10T19:00:00+08:00","homeTeam":"north","awayTeam":"south","status":"scheduled","homeScore":null,"awayScore":null}]}}
```

`data` 的完整保守结构：

- `league:{id:S,name:S,sport:"football"|"basketball"|"baseball"|"hockey"|"other",season?:S}`，`timezone:S`（有效IANA时区），`updatedAt:S`（含Z/偏移的ISO时间），`source:{label:S,synthetic:B,url?:S}`。
- `teams:[{id:S,name:S,shortName?:S,color?:"blue"|"green"|"orange"|"red"|"purple"|"gray"},...]`，0–100队，id唯一，shortName最多16字符。league/team/game的id及引用以英文字母或下划线开头，后接字母、数字、下划线、点或短横线，最多80字符；不要把球队id误写为中文名称。
- `games:[{id:S,startAt:S,homeTeam:S,awayTeam:S,status:"scheduled"|"live"|"final"|"postponed"|"cancelled",homeScore:Q,awayScore:Q,...},...]`，0–300场。Q为0–1000000整数或null。比赛id唯一；两队须已声明且不同；startAt含Z/明确偏移。无需预先排序，库按真实时间排序并按当地日期分组。
- 比赛可选 `period:S,clock:S,stage:S,venue:S,neutral:B,detail:S,winnerTeamId:S`；clock是来源给定文字，不是倒计时。winnerTeamId仅用于final且必须是参赛队，不能凭大小自动推断。
- 可选 `periodScores:[{label:S,home:Q,away:Q},...]`、`tieBreak:{label:S,home:Q,away:Q}`、`stats:[{label:S,home:S|N|null,away:S|N|null},...]`；两种数组各最多30项，各自标签不重复。分节不强求加总等于总分；tieBreak只用于live/final，点球/加赛不擅自并入总分。stats的数字和文字均为字面值，数字须有限。
- `standings?:[{teamId:S,rank:1..10000整数,played:Q,won:Q,drawn:Q,lost:Q,points:N|null,group?:S,for?:Q,against?:Q,note?:S},...]`，0–100行，teamId存在且每队最多一行，允许并列名次。已知胜平负之和不超过played；三项及played全知时必须相等。points允许负数和小数，保留扣分/赛制，不从胜场猜积分或重新排名。

scheduled的比分必须为null；live的真实0:0保留0；final仍可缺测，不能补零；延期/取消可保留来源提供的中断前比分。不把缺失排名/胜负编成已知值。名称和详情标签一般1–200字符；venue最多300、detail最多3000、note最多500。source.url仅用允许的公开HTTPS来源，库不自动读取它。

loading/error仍需提供合法data，配message说明；无数据用teams/games空数组（积分榜可加standings空数组），不保留指向不存在记录的初始筛选。赛程筛选、记分牌选场、积分榜排序属于各组件本地视图状态，不与文档state绑定；不同视图不会自动联动，`controller.update`用完整快照更新并重置本地选择。窄屏积分榜可在自身区域横向滚动。

组合示例是“来源与更新时刻 → 赛程 → 一场关键比赛的记分牌 → 解释”，需要跨队比较时再放积分榜；不为凑节点而把同一批信息重复三遍。反例：用scheduled+0:0暗示已经开赛、把null补零、以当前比分替来源判冠军、以clock文字声称实时更新、给比分字段放V表达式、传数据服务URL让组件抓取，都不成立。球员档案、逐球事件、投篮图、完整box score、淘汰赛树、赛车圈速仍不支持。

### 学习：本地自测与闪卡

用 `quiz` 检查能客观判定的理解，用 `flashcards` 让读者先回忆再翻面自评。先讲清概念再放少量相关题；不要把主观建议强塞进唯一正确答案。答案与解释由作者提供，应核对事实和计算；答案直接包含在HTML中，不能用于保密考试。

- `quiz`：`{type:"quiz",title:S,questions:[题,...],id?:S,description?:S,status?:"ready"|"loading"|"error",message?:S}`。
- 题：`{id:S,kind:"single"|"multiple",prompt:S,choices:[{id:S,label:S},...],correct:[选项id,...],explanation:S,latex?:S,explanationLatex?:S,points?:1..100整数}`。0–100题，每题2–20选项，correct非空且不重复、只引用本题选项；single必须恰好一个答案，multiple可以一个或多个。points默认1。
- `flashcards`：`{type:"flashcards",title:S,cards:[卡,...],id?:S,description?:S,status?:"ready"|"loading"|"error",message?:S}`。
- 卡：`{id:S,front:S,back:S,hint?:S,frontLatex?:S,backLatex?:S}`，0–100张。正反面纯文本，公式放各自LaTeX字段。

题/卡id在各自数组内唯一，选项id在本题内唯一；这些id采用上面体育id的英文标识规则。title为1–200字符，题干/正反面/公式最多6000字符且非空，explanation必填、最多6000字符；选项label非空最多2000字符，hint最多2000。内容不接受V表达式、bind、HTML或随机出题脚本。

最小自测节点：

```json
{"type":"quiz","title":"先自己算一算","questions":[{"id":"sum","kind":"single","prompt":"2加3等于多少？","choices":[{"id":"four","label":"4"},{"id":"five","label":"5"}],"correct":["five"],"explanation":"把2和3相加得到5。"}]}
```

选择后点确认才显示参考答案/解释；确认后锁定本题，不能重复得分，已提交才能下一题，也可回看。multiple必须与正确集合完全相同才得整题分，没有部分分；进度按题数、成绩按points加权。完成后显示总分和逐题结果，重新开始清空。

闪卡先揭晓，再标记已掌握/再练一次；重复标记只更新本卡。前后导航保留本轮标记，新卡回正面；全部评估后可看总结，重新开始清空。它不安排间隔重复，不诊断掌握程度。

空questions/cards显示空态；loading/error仍需title及合法数组，可用message说明。选择、得分、翻面、自评都是组件本地状态，不写文档state，不自动保存/同步/联网；刷新或controller.update的新快照会重置整轮。别加提交URL、成绩上报或持久化承诺，别把按钮演示说成真实考试服务。

## 4. 绑定与表达式

`V` 只能是字符串、有限数值、布尔值、null、`{"$":"名称"}`，或 `{"op":"运算符","args":[V,...]}`。`$` 直接引用一个 state/computed 名称，不是 JavaScript 属性路径。依赖必须无环；计算不得写成函数、字符串公式、模板表达式或任意脚本。用于展示的 LaTeX 仍放在 `math.latex`。

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

浏览器模块也导出 `evaluateState(document,patch)`：成功返回 `{ok:true,state,computed}`，失败返回 `{ok:false,issues}`。先检查 ok，再读取结果。每次从文档初始 state 加本次 patch 求值；要连续变更就显式合并当前 state。它只算数据，不更新 DOM；显示中的页面用 `controller.setState(patch)`。不要把 computed 名称作为 patch 的键。

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
| `WEATHER_DATE` / `WEATHER_RANGE` / `TIMEZONE` | 修正日期/偏移/顺序、百分比与IANA时区，缺测保留null |
| `SPORTS_ID` / `SPORTS_TEAM` / `SPORTS_DATE` / `SPORTS_FILTER` | 查唯一id、存在的不同球队、时间偏移及初始筛选引用 |
| `SPORTS_STATUS` / `SPORTS_RESULT` / `SPORTS_PERIOD` / `SPORTS_STAT` / `SPORTS_RECORD` | 匹配状态与比分/胜者、详情标签唯一及赛绩和；不推断赛制 |
| `LEARNING_ID` / `QUIZ_ANSWER` | 修重复题/卡/选项id，正确答案只引用本题选项且符合单选数量 |
| `TABLE_WIDTH` | 让每行与列数一致，真正缺测用 null |
| `UNSAFE_URL` / `UNSUPPORTED_NATIVE` | 使用允许的公开 HTTPS 资源或本文节点；不要绕过校验、伪造私有组件 |

能运行浏览器时，检查桌面和 390 px、亮/暗色、中文换行、数学可读性、键盘控件与可见反馈。不能运行时，仍交付完整 HTML，但标明“尚未实际打开验证”。校验通过不等于事实正确或视觉验收完成。不要用手写 CSS/HTML 掩盖库错误。

## 6. 有终端的 Agent：可选本地路径

同一协议可用本地构建；没有终端时跳过本节，不影响上面的 CDN 路径。核心仓库 `https://github.com/Micraow/Intelligent-UI`，与上面固定 CDN 使用同一提交 `f372c71d31633be85bb228f57fdb07da9e8f2112`。在库目录先 `npm ci`、`npm run build`，然后：

```sh
node bin/iui.mjs validate answer.json --json
node bin/iui.mjs build answer.json --out answer.html --lang zh-CN
```

本地 `compileHtml(input,{backend:'portable',assets:'inline'})` 返回 HTML 字符串；它是 Node API。该 inline 构建把库资源与数学字体的 `data:` URL 一起内嵌；自设严格 CSP 时字体也需允许 `data:`。你选择的远程图片等内容仍可能需要联网。不要使用未经发布验证的 `npx iui`。

[进阶绑定](references/schema-and-binding.md)、[Agent工作流](references/library-workflow.md)、[能力边界](references/support.md)和[更多例子](references/examples.md)是可选资料，不是基础生成的前置条件。用户明确只要 JSON 时仅输出 JSON；要可打开文档时输出完整 HTML。
