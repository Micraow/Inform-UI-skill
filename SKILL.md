---
name: intelligent-ui-author
description: 为技术解释、图表、拓扑、指标和受控交互生成 iui/1 JSON；无终端的 Web Chat 可直接用固定 CDN 与本文 HTML 壳交付可运行文档，Agent 也可用本地库。普通文字足够时不强加界面。
---

# Intelligent UI Author

你负责内容、数据、阅读顺序与组件选择；Intelligent-UI 库负责校验、DOM、样式、布局和交互。目标是正文中自然穿插图、公式与有用的控件，形成克制的编辑式解释，不是把每段文字塞进仪表盘卡片。

本文件可完整复制给没有终端、无法读取本地文件的 Web Chat。下面内嵌的保守协议子集与 HTML 壳足以生成基础文档，不需要读库源码或其他文件。完整 Schema URL 供有读取能力时扩展；拿到 URL 不等于已经读取其内容。读不到时只用本文明确列出的字段，不猜新组件。

这是一套独立于模型厂商的公开库，无需 OpenAI 账号、API 或私有运行时。`portable` 只是库的后端名称，不是另一种产品版本。CDN 页面需要联网加载库；它不是已发布的 npm 包。

## 1. 先决定要表达什么

- 先给结论/问题，再给证据或演示，随后解释读者应观察什么。未要求文档/可视化时，短答案可保留普通文字；用户明确要 HTML 时仍交付完整 HTML。
- 趋势用折线图，类别比较用柱状图；连接/瓶颈用拓扑，推理过程用步骤与公式；少量重要数字用指标，精确数值用表格；推荐用标题、简短正文、链接，图片仅在有用且来源合适时加入。
- 只有能回答“如果改变输入，会怎样？”时才加控件，且必须连接可见结果。避免无效按钮、无关图表和装饰性卡片。
- 在正文或图注里标清真实测量、推导值或教学模拟；保留单位、假设、时间和来源。缺测用 `null`，不得补成零或虚构实测。
- 用 `section`、`figure` 表达分组，默认纵向阅读；`card` 只框住完整演示。不要写组件 HTML/CSS；不要添加固定宽度、像素间距、渐变背景。长公式拆成短公式并解释变量，手机上也能顺着读。

## 2. 无终端 Web Chat：完整 HTML 路径

固定的公开文件（同一提交，不混用版本）：

- 浏览器全局脚本：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@b46f974d10d6a344fe5fc615e4aa5b895e4567f7/cdn/iui.global.min.js`
- 进阶 ESM（可选）：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@b46f974d10d6a344fe5fc615e4aa5b895e4567f7/cdn/iui.min.js`
- 样式：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@b46f974d10d6a344fe5fc615e4aa5b895e4567f7/cdn/iui.css`
- 完整 JSON Schema：`https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@b46f974d10d6a344fe5fc615e4aa5b895e4567f7/cdn/iui.schema.json`

全局脚本加载后通过 `window.IUI` 访问浏览器 API：`validateDocument(input)` 返回 `{ok:true,document}` 或 `{ok:false,issues:[{code,path,message}]}`。`mount(element,document,{styles:false})` 把 JSON 渲染到容器；这里由独立 CSS 文件提供样式。它返回 `update(nextDocument)`、`dispose()`、`getState()`、`setState(patch)`。**`compileHtml` 是 Node API，不能从浏览器模块导入。** 浏览器的 JSON→界面转换由 `mount` 完成。

用户要 HTML 时，交付下列完整壳，并只替换 JSON 数据、页面语言与标题。不要只输出 JSON 后声称已生成页面，也不要手写图表、卡片或控件 DOM。这个壳中的固定启动脚本仅加载库、解析数据、校验和挂载。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Intelligent UI 解释文档</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@b46f974d10d6a344fe5fc615e4aa5b895e4567f7/cdn/iui.css" integrity="sha384-yO4iUqoqAWFZqWp58yjTOukFYTtnWxdU6wD2Njgfr4RQfKFVu11IPBGtFceh0usS" crossorigin="anonymous">
</head>
<body>
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
      {"type":"caption","value":"这是合成教学示例，不是实测数据。"}
    ]
  }
  </script>
  <script src="https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@b46f974d10d6a344fe5fc615e4aa5b895e4567f7/cdn/iui.global.min.js" integrity="sha384-827a7wCX0YwSwGRfwWtbkfO7uIJeangVNsSrqHZ6PnW04Rce4izMJmky08L3xYsP" crossorigin="anonymous"></script>
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

文字是普通文本，不把 Markdown/HTML 当格式执行。用多个 `text` 节点表示段落，用 `math` 表示公式。链接/图片在本页只使用可公开访问且有权使用的 HTTPS URL；URL 保持在 2,048 字符以内；没有合适图片就省略。需要来源时用可见图注与 `link`，不要虚构 `source` 字段。

### 指标、表格与图

- `metric`：`{type:"metric",label:S,value:V,unit?:S,hint?:S,precision?:0..6整数,color?:上述语义色}`。
- `metric-grid`：`{type:"metric-grid",children:[metric节点,...],columns?:1..4整数}`，1–12 个指标。
- `table`：`{type:"table",columns:[S,...],rows:[[V,...],...],caption?:S}`。1–20 列，每行单元数等于列数，最多 200 行；缺测格用 `null`。
- `chart`：`{type:"chart",kind:"line"|"bar",xKey:S,data:[{字段:V,...},...],series:[{key:S,label:S,color?:"blue"|"green"|"orange"|"red"|"purple"|"gray"},...],title?:S,unit?:S,note?:S,yMin?:N,yMax?:N}`。1–300 行，1–6 系列，系列 key 不重复。每行含 `xKey` 对应字段及每个系列 `key`；横坐标解析为字符串或数值，系列值解析为数值或 `null`。`yMin < yMax`；柱图比较通常包含零。用 `note` 说明来源、缺测和单位。
- `topology`：`{type:"topology",nodes:[{id:S,label:S,subtitle?:S},...],links:[{from:S,to:S,label?:S,load?:V},...],highlight?:"max-load"|"none",caption?:S}`。2–24 个节点、1–40 条边；节点 id 唯一，from/to 必须指向存在的 id。load 解析为数值，用 `"max-load"` 强调最大负载。它是关系示意，不是地理地图。

标签、列名、控件名和拓扑 id 保持 1–200 字符；普通文字不超过 12,000 字符，单条 `math.latex` 不超过 6,000。子节点数组最多 500 项，列表最多 100 项，步骤 1–20 项。可选 `unit` 无内容时直接省略，不填空字符串。不要生成空图表或无限大/NaN 数值。

### 控件

- `slider`：`{type:"slider",label:S,bind:名称,min:N,max:N,step:N,unit?:S}`；bind 指向数值 state，`min < max`，`0 < step <= max-min`，初值在范围内并与步长对齐。
- `toggle`：`{type:"toggle",label:S,bind:名称}`；绑定布尔 state。
- `select`：`{type:"select",label:S,bind:名称,options:[{value:字符串或数值,label:S},...]}`；1–40 个不同选项，全部与初值同类型，初值必须是一个选项。
- `button`：`{type:"button",label:S,action:{kind:"reset"}}` 恢复初始状态；或 `action:{kind:"set",bind:名称,value:字符串或数值或布尔值}` 设置已声明的 state。

控件只能改 state，不能写 computed；它们不是网络请求或表单提交。除标为 `V` 的字段外，其余字段必须是字面值：例如不能把 `chart.kind`、`math.latex` 或 `section.heading` 改成引用。

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
| `TABLE_WIDTH` | 让每行与列数一致，真正缺测用 null |
| `UNSAFE_URL` / `UNSUPPORTED_NATIVE` | 使用允许的公开 HTTPS 资源或本文节点；不要绕过校验、伪造私有组件 |

能运行浏览器时，检查桌面和 390 px、亮/暗色、中文换行、数学可读性、键盘控件与可见反馈。不能运行时，仍交付完整 HTML，但标明“尚未实际打开验证”。校验通过不等于事实正确或视觉验收完成。不要用手写 CSS/HTML 掩盖库错误。

## 6. 有终端的 Agent：可选本地路径

同一协议可用本地构建；没有终端时跳过本节，不影响上面的 CDN 路径。核心仓库 `https://github.com/Micraow/Intelligent-UI`，与上面固定 CDN 使用同一提交 `b46f974d10d6a344fe5fc615e4aa5b895e4567f7`。在库目录先 `npm ci`、`npm run build`，然后：

```sh
node bin/iui.mjs validate answer.json --json
node bin/iui.mjs build answer.json --out answer.html --lang zh-CN
```

本地 `compileHtml(input,{backend:'portable',assets:'inline'})` 返回 HTML 字符串；它是 Node API。该 inline 构建的库资源随文件携带；你选择的远程图片等内容仍可能需要联网。不要使用未经发布验证的 `npx iui`。

[进阶绑定](references/schema-and-binding.md)、[Agent工作流](references/library-workflow.md)、[能力边界](references/support.md)和[更多例子](references/examples.md)是可选资料，不是基础生成的前置条件。用户明确只要 JSON 时仅输出 JSON；要可打开文档时输出完整 HTML。
