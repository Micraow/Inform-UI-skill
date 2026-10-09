---
name: intelligent-ui-author
description: 为解释、真坐标图、本地表单、供数天气/体育/金融、本地自测/闪卡生成 iui/1 JSON；无终端Web Chat直接用固定CDN与本文HTML壳交付页面，Agent可用本地库。普通文字足够时不强加界面。
---

# Intelligent UI Author

你负责内容、来源、阅读顺序和选型；库负责校验、DOM、样式、布局与交互。正文自然穿插图、公式和必要控件，不把每段话塞进卡片。

本文件可完整复制给无终端的Web Chat，内嵌合同与壳不依赖其他文件。固定协议50个节点注册项（含拒绝的native），本文给出41个常用节点的保守生成子集。能读取完整Schema才扩展；只有URL不等于读过合同，不猜字段。

这是独立公开库，无模型厂商账号/API/私有运行时依赖。portable是后端名称。CDN需要联网，npm包尚未发布。

## 1. 先决定要表达什么

- 结论/问题 → 证据/演示 → 观察方法。短回答可纯文字；明确要HTML则交完整文件。
- 趋势用折线/面积，类别比较用柱图，成对观测用散点，非负组成用环图；关系/瓶颈用拓扑，推理用步骤/公式，少量关键数用指标，精确值用表格。推荐用标题/正文/链接，图片须有用且来源合适。
- 控件必须回答“输入改变会怎样”并连接可见结果；不要无效按钮或装饰图。
- 标明实测、推导或模拟，保留单位、假设、时间、来源；缺测null不能补零。
- 默认section/figure纵向阅读，card只框完整演示。不写组件HTML/CSS、固定宽度、像素间距或渐变；长公式拆短并解释变量。

## 2. 无终端 Web Chat：完整 HTML 路径

固定的公开文件（同一提交，不混用版本）：

- 浏览器全局脚本：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f35e33b146c266ecf16371733c51064129afaec3/cdn/iui.global.min.js`
- 进阶 ESM（可选）：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f35e33b146c266ecf16371733c51064129afaec3/cdn/iui.min.js`
- 样式：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f35e33b146c266ecf16371733c51064129afaec3/cdn/iui.css`
- 完整 JSON Schema：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f35e33b146c266ecf16371733c51064129afaec3/cdn/iui.schema.json`

window.IUI提供浏览器API：validateDocument(input)返回{ok:true,document}或{ok:false,issues:[{code,path,message}]}；mount(element,document,{styles:false})渲染JSON并返回update(nextDocument)、dispose()、getState()、setState(patch)。保留styles:false让字体相对CDN样式表加载。compileHtml仅为Node API，不能在浏览器导入。

数学为KaTeX可视HTML及辅助MathML；CSS按需加载同一提交cdn/fonts/的20款官方MIT WOFF2。自设严格CSP须同时许可脚本、样式及font-src https://cdn.jsdelivr.net；不要换字体或删规则。

HTML交付复制完整壳，只改JSON、语言、标题和与JSON theme一致的body data-theme。iui-page控制整页背景，margin:0去浏览器边距；嵌入网页时背景由宿主决定。不以JSON冒充页面，也不手写组件DOM。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Intelligent UI 解释文档</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f35e33b146c266ecf16371733c51064129afaec3/cdn/iui.css" integrity="sha384-R+ybWEp3LYtcukj5okG9CNtbw1tj9iz5/gmk1gujU5Tyg9G8pF5LIBP+WSJ1TmfH" crossorigin="anonymous">
</head>
<body class="iui-page" data-theme="auto" style="margin:0">
  <main id="iui">正在加载界面…</main>
  <noscript>请启用 JavaScript 以查看这个交互文档。</noscript>
  <script id="iui-spec" type="application/json">
  {"version":"iui/1","theme":"auto","state":{"x":4},"computed":{"twice":{"op":"mul","args":[2,{"$":"x"}]}},"body":[{"type":"title","level":1,"value":"观察一个输入与结果的关系"},{"type":"text","value":"改变 x，观察 2x 如何同步变化。"},{"type":"slider","label":"输入 x","bind":"x","min":1,"max":10,"step":1},{"type":"metric","label":"2x","value":{"$":"twice"}},{"type":"math","latex":"y=2x","block":true},{"type":"caption","value":"这是合成教学示例，不是实测数据。"}]}
  </script>
  <script src="https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@f35e33b146c266ecf16371733c51064129afaec3/cdn/iui.global.min.js" integrity="sha384-ExWzUtY9GmozAptkPneHZmDC/HDRNNA8SN+gug8wRukKTWOkKo2QwNEJOF9ekPZr" crossorigin="anonymous"></script>
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

## 3. 内嵌协议：可以直接据此写 JSON

以下为保守子集，省略样式旋钮。记号?为可省略，S为字符串、N为有限数值、B为布尔值、V见第4节、Node[]为本文节点数组；输出真实JSON，不输出记号或未列字段。

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

文字不解释Markdown/HTML；段落用text，公式用math。链接/图片只用有权使用的公开HTTPS URL，最多2048字符；无合适图片则省略。普通节点来源用caption/link；领域节点按各自source合同。

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
- 初值可未填有效，失焦/提交显示错误；结构校验成功不等于表单有效。数字空白/不完整输入仅作DOM草稿，state不变为null/空串/NaN；非required的空number也须修正/取消。指标显示最后有效state，不证明草稿有效。
- form 不能嵌套。默认省略 action：内置提交按钮只做本地校验、显示结果、派发 `iui:submit`（`{id,values}`）；没有联网、保存或自动刷新。快照只含该表单未禁用的绑定字段，含嵌套 field 内的 slider/toggle/select；不夹带全局无关 state 或 computed。
- form取消中止宿主动作并恢复本表单初值；若违反全局约束则报错、保留有效状态。普通button的reset重置整份文档，不能替代局部取消。
- **本页 Web Chat 壳不注册宿主动作，必须省略 form.action。** 仅已有可信宿主明确提供并获授权的白名单标识符才可填 action；它不是 URL/函数/fetch。宿主 Promise 产生真实 busy/error/retry，忙碌时防重、取消/替换后忽略迟到结果。不要给 form 编造 `status:"loading"`；无宿主时也不能假称数据已发送。文件上传、日期选择器、富文本与正则 pattern 均未支持。

### 天气：展示已提供的数据，不接入服务

weather展示有来源的当前/逐日/逐小时供数。教学合成标synthetic:true，不称实时预报；所有状态仍须以下必填字段：

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

### 组合边界

正文交代问题，weather提供环境快照，form输入state，computed推导，metric/chart读取V。不自动把表单连到天气数据。反例：城市名交weather查询、0.4当40%、form设URL action、空数字写null、嵌套form、category画不等距数轴、donut负数/多系列、scatter无xScale。未列地图/球员等节点不要猜标签。

### 体育：调用方供数的赛程、记分牌与积分榜

赛程用sports-schedule，一场比分/分节/统计用sports-scoreboard，多队排名/赛绩用sports-standings。只展示供数，无抓取/计时/直播；教学合成须标明。

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

loading/error仍需合法data和message；无数据用空teams/games/standings，删不存在的初始引用。筛选/选场/排序是组件本地状态，不绑state、不跨视图联动；controller.update完整快照重置选择。手机积分榜局部横滚。

组合：来源/时刻→赛程→关键场记分牌→解释，需跨队比较才加积分榜，不重复堆砌。禁止scheduled+0:0、null补零、比分判冠军、clock冒充实时、比分填V、服务URL抓取。球员/逐球/投篮图/完整box score/淘汰树/赛车圈速未支持。

### 学习：本地自测与闪卡

quiz检验客观理解，flashcards用于先回忆后翻面自评。先讲概念再给少量题；主观建议不设唯一答案。作者核实答案/解释；答案已在HTML中，不适合保密考试。

- `quiz`：`{type:"quiz",title:S,questions:[题,...],id?:S,description?:S,status?:"ready"|"loading"|"error",message?:S}`。
- 题：`{id:S,kind:"single"|"multiple",prompt:S,choices:[{id:S,label:S},...],correct:[选项id,...],explanation:S,latex?:S,explanationLatex?:S,points?:1..100整数}`。0–100题，每题2–20选项，correct非空且不重复、只引用本题选项；single必须恰好一个答案，multiple可以一个或多个。points默认1。
- `flashcards`：`{type:"flashcards",title:S,cards:[卡,...],id?:S,description?:S,status?:"ready"|"loading"|"error",message?:S}`。
- 卡：`{id:S,front:S,back:S,hint?:S,frontLatex?:S,backLatex?:S}`，0–100张。正反面纯文本，公式放各自LaTeX字段。

题/卡id在各自数组内唯一，选项id在本题内唯一；这些id采用上面体育id的英文标识规则。title为1–200字符，题干/正反面/公式最多6000字符且非空，explanation必填、最多6000字符；选项label非空最多2000字符，hint最多2000。内容不接受V表达式、bind、HTML或随机出题脚本。

最小自测节点：

```json
{"type":"quiz","title":"先自己算一算","questions":[{"id":"sum","kind":"single","prompt":"2加3等于多少？","choices":[{"id":"four","label":"4"},{"id":"five","label":"5"}],"correct":["five"],"explanation":"把2和3相加得到5。"}]}
```

确认后显示答案/解释并锁题、防重复得分，才能下一题；可回看。multiple须集合完全相同，无部分分。进度按题数、成绩按points；完成显示总分/逐题结果，重来清空。

闪卡先揭晓再自评，重复标记只更新本卡。导航保留标记、新卡回正面；全评后总结，重来清空。无间隔重复调度或能力诊断。

空数组为空态；loading/error保留title/合法数组并说明message。学习状态只在组件本轮，不写state、不保存/同步/联网；刷新或update重置。无提交URL/成绩上报/考试服务。

### 金融：调用方供数的行情、历史、比较与热图

当前价格/相对前收盘用finance-quote，单标的时间走势用finance-chart，同一时刻基准的相对表现用finance-comparison，多个标的的权重与涨跌分布用finance-heatmap。来源→快照→必要图→解释，普通数值趋势不必套金融节点。只展示供数，不查询/订阅行情或推断交易时段；合成必须声明，不把教学页当投资建议。

四者必填source:{label:S,synthetic:B,url?:S}，可选id:S,title:S,status:"ready"|"loading"|"error",message:S。source.url仅为公开HTTPS出处，不触发抓取。所有字段为字面值，不接受V/bind/API密钥/服务端点。

- finance-quote必填instrument；finance-chart必填instrument,ranges，可选initialRange。
- finance-comparison必填instruments:[instrument,...]（2–6个且id唯一）、baselineAt:S、ranges；可选initialRange、timezone:S（轴默认UTC）。
- instrument:{id:S,symbol:S,name:S,currency:S,timezone:S,asOf:S,marketStatus:M,delayMinutes:D,price:P,previousClose:P,history:[{time:S,price:P},...],exchange?:S}。
- P为非负有限数或null；currency为3个大写字母；M为open|closed|pre|post|halted|unknown；D为0–10080整数。0分钟仅声明延迟，不保证实时。timezone用IANA；所有时间用真实有效、带Z/明确偏移的ISO时间。
- history最多500点，真实时间严格递增、不重复、不晚于asOf；null保留断口，0是真实零。price不自动取历史末点。变动为price−previousClose，百分比仅previousClose>0时计算；零/缺测基准不伪造百分比，溢出值拒绝。
- ranges:[{id:S,label:S,from:S,to:S},...]最多12项，id唯一、from≤to且都带偏移；包含两端，相同时间为单点。ranges:[]为全部；initialRange若给须引用已有id；无观测范围为空态，不补点。
- 比较每系列须在baselineAt同一瞬间有正历史价，按(price/baseline−1)×100计算；不同偏移同瞬间等价。缺/零基准显示不可比，不借相邻观测。基准可在显示范围外。只比各自币种相对变化，不做汇率换算；调用方说明拆股/复权口径。

最小完整行情；改type为finance-chart并加ranges:[]即可画提供的历史：

```json
{"type":"finance-quote","source":{"label":"原创合成行情","synthetic":true},"instrument":{"id":"demo","symbol":"DEMO","name":"合成样本","currency":"USD","timezone":"UTC","asOf":"2026-10-09T10:00:00Z","marketStatus":"closed","delayMinutes":15,"price":12,"previousClose":10,"history":[{"time":"2026-10-08T10:00:00Z","price":10},{"time":"2026-10-09T10:00:00Z","price":12}]}}
```

- finance-heatmap必填asOf:S,timezone:S,weightLabel:S,changeBasis:S,cells:[cell,...]，可选initialSector:S（须存在）。
- cell:{id:S,symbol:S,name:S,sector:S,weight:P,price:P,currency:S,changePercent:N|null,asOf:S,marketStatus:M,delayMinutes:D}，最多200项、id唯一；cell.asOf不晚于整体asOf。
- weightLabel说明统一单位/口径的面积权重；changeBasis说明涨跌比较基准。正权重决定面积，0/null/小至不可表达的权重不造面积，仍在完整表。不同币种市值先由调用方统一口径，不把价格当权重。changePercent为百分数：2表示2%，0.02是0.02%。
- 正值绿、负值红、零/缺测中性，另有符号文字；色阶±10%饱和，原始幅度不被裁成±10。小格可无文字，详情与全表保留记录。行业筛选、方向键/Home/End（含无面积项）、Enter展开表及点选均由库实现。

```json
{"type":"finance-heatmap","source":{"label":"合成样本","synthetic":true},"asOf":"2026-10-09T10:00:00Z","timezone":"UTC","weightLabel":"统一合成权重","changeBasis":"较合成前收盘","cells":[]}
```

金融instrument/range/cell的id用体育英文标识规则；名称/标签1–200字符。行情/比较的范围、系列开关、真实时间X、键盘读数与全表由库提供；隐藏系列不删除表内记录。loading/error仍给合法必填数据并说明message，空历史/空cells保留空态，比较仍需2–6个合法标的。视图状态本地独立，update完整快照重置、dispose清理；不保存/联网。不支持K线、成交量双轴、技术指标、汇率换算或交易。反例：无来源称实时、不同币种绝对价格共轴、用各自首点冒充共同基准、按颜色饱和篡改涨跌、0/null补面积。

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
| `WEATHER_DATE` / `WEATHER_RANGE` / `TIMEZONE` | 修正日期/偏移/顺序、百分比与IANA时区，缺测保留null |
| `SPORTS_ID` / `SPORTS_TEAM` / `SPORTS_DATE` / `SPORTS_FILTER` | 查唯一id、存在的不同球队、时间偏移及初始筛选引用 |
| `SPORTS_STATUS` / `SPORTS_RESULT` / `SPORTS_PERIOD` / `SPORTS_STAT` / `SPORTS_RECORD` | 匹配状态与比分/胜者、详情标签唯一及赛绩和；不推断赛制 |
| `LEARNING_ID` / `QUIZ_ANSWER` | 修重复题/卡/选项id，正确答案只引用本题选项且符合单选数量 |
| `FINANCE_DATE` / `FINANCE_ORDER` / `FINANCE_ID` / `FINANCE_RANGE` / `FINANCE_FILTER` / `FINANCE_VALUE` | 查时间/顺序/id/区间或行业引用，确保变化百分比有限；缺基准保留不可比 |
| `TABLE_WIDTH` | 让每行与列数一致，真正缺测用 null |
| `UNSAFE_URL` / `UNSUPPORTED_NATIVE` | 使用允许的公开 HTTPS 资源或本文节点；不要绕过校验、伪造私有组件 |

预览检查桌面/390px、明暗、中文/公式、键盘与反馈。未预览仍交完整HTML并说明；结构通过不等于事实/视觉正确，不手写CSS/HTML掩盖库错误。

## 6. 有终端的 Agent：可选本地路径

无终端跳过。核心仓库https://github.com/Micraow/Intelligent-UI使用上述CDN同一提交；在库目录先npm ci、npm run build，再执行：

```sh
node bin/iui.mjs validate answer.json --json
node bin/iui.mjs build answer.json --out answer.html --lang zh-CN
```

Node的compileHtml(input,{backend:"portable",assets:"inline"})返回HTML，内嵌库和数学字体data:URL（严格CSP须允许font-src data:）。所选远程图片仍需联网；不使用未发布的npx iui。

可选：[绑定](references/schema-and-binding.md)、[Agent工作流](references/library-workflow.md)、[边界](references/support.md)、[例子](references/examples.md)。要求JSON则只交JSON；要页面则交完整HTML。
