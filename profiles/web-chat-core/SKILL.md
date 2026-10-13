---
name: inform-web-chat-core
description: 供 Agent 和 Web Chat AI 生成完整互动 HTML 答案。默认使用 Inform 基础组件与图表；Agent 可按需发现模块、领域视图和图标，并使用可选 CLI 验证与构建。无需创建 React 工程。
---

# Web Chat 基础与图表

把本文件交给 Agent 或 Web Chat AI 即可。任务是输出一份完整 HTML 答案：直接回答问题，用图文和有意义的本地交互帮助理解。默认路线无需终端、CLI、npm、React 工程或额外的全量组件文档。

## 写作和交付合同

- 默认沿用下方可运行 HTML 壳，只替换标题、语言与配置中的 source。保持给定 select、viewNames 和 script URL；默认入口跟随 latest，不把 commit 或版本号写入 HTML。模型不要另造 DOM 框架、解释器或业务 JavaScript；交互逻辑写入 DSL。
- 37 个 UI 构造器、5 个数据构造器。本版不开放任何领域 View。使用基础组件、图表与文字完成答案；不要从旧目录猜 View 名称。
- 所有真实可用签名就在本文件后面的自动生成合同中。schema.json、manifest.json、profile.json、minimal.html 来自同一 profile；模型不必运行生成脚本，也不需要读取全部195个View。
- 不声明已完成查询、订票、付款、发送或其他宿主服务。这里只处理给定数据和本地状态。Query、Mutation、@Run、@OpenUrl、@ToAssistant 与任意 JS 均不支持。
- 概念、数据、结论和来源必须说清楚。原创演示数据明确标为示例；不伪造真实来源。图表配可读的文字结果及必要表格；图片有 alt；控件标签说明单位和作用；处理空结果、重置和失效选择。
- 每条 DSL 声明从新行开始，单个表达式可跨行；不用分号。root = Stack(...) 可以在任意位置。组件是位置参数；对象内才写 key:value。显式声明所有 $state；只有声明为 binding 的参数能绑定状态。
- 只用 @Filter、@Sort、@Each 等下方实际列出的纯函数。没有 lambda、.map() 或 eval。Each 的第三参数是内联模板。Table 的行对象只能含 columns 声明的键；用 @Each 投影并保留原始记录做选择。
- source 是 JSON 字符串，完整进行 JSON 转义；HTML 数据块中的每个 < 写成 \u003c，避免正文的 </script> 结束数据块。不要把 DSL 直接拼接成可执行 JavaScript。
- 若使用图标，可直接选以下已核对的官方名称：Check、Info、Warning、ArrowRight、Chart、Calendar、BookOpen、Lightbulb、MapPin、Search、Filter、Settings、Play、Pause、CircleQuestion、Link。这里故意不列全部 755 个 glyph；没有额外目录时用文字或这些名称，不猜名字。
- HTML 依赖网络获取 latest JS；它是会更新的入口，CDN 与浏览器缓存可能延后看到更新，不保证每次打开立即拿到最新字节。网页宿主还需允许脚本和样式。固定壳含内联初始化与样式，严格 CSP 需宿主配置 nonce/hash。不能保证所有聊天预览器都允许执行 HTML。

这是 OpenUI 派生的严格本地方言，不是全部上游 runtime 的兼容替代。精简的是模型合同与可用组件集合；使用的 browser JS 仍是同一完整 bundle。不宣称未测的 token 或下载体积节省。

## 同源自动生成的 DSL 合同

Generate an Inform UI 2 document using the pinned OpenUI language. This profile is local-only. Use only the component and data constructors listed below.

## Syntax Rules

1. Start each declaration on a new line: `identifier = Expression`. A continued expression may span lines.
2. `root` is the entry point — every program must define `root = Stack(...)`
3. Expressions are: strings ("..."), numbers, booleans (true/false), null, arrays ([...]), objects ({...}), or component calls TypeName(arg1, arg2, ...)
4. Use references for readability: define `name = ...` on one line, then use `name` later
5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables do not render; connect intended output to root. Always include defined variables in their parent's children/items array.
6. Arguments are POSITIONAL (order matters, not names). Write `SomeComp([children], "row", "l")` NOT `SomeComp([children], direction: "row", gap: "l")` — colon syntax is rejected
7. Optional arguments can be omitted from the end
8. Declare mutable state with `$varName = defaultValue`. Components marked with `$binding` can read/write these. Undeclared $variables are errors in Inform UI.
9. String concatenation: `"text" + $var + "more"`
10. Dot member access: `query.field` reads a field; on arrays it extracts that field from every element
11. Index access: `arr[0]`, `data[index]`
12. Arithmetic operators: +, -, *, /, % (work on numbers; + is string concat when either side is a string)
13. Comparison: ==, !=, >, <, >=, <=
14. Logical: &&, ||, ! (prefix)
15. Ternary: `condition ? valueIfTrue : valueIfFalse`
16. Parentheses for grouping: `(a + b) * c`
- Strings use double quotes with backslash escaping

## Component Signatures

Arguments marked with ? are optional. Sub-components can be inline or referenced; prefer references for better streaming.
Props typed `ActionExpression` accept one @step, or Action([@steps...]) for several. See the Action section for available steps (@Set, @Reset).
Props marked `$binding<type>` accept a `$variable` reference for two-way binding.

### base/charts
AreaChart(title: string, labels: string[], series: Series[], options?: {height?: number, legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string, yAxisLabel?: string, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "linear" | "natural" | "step", stacked?: boolean, crosshair?: boolean, highlight?: boolean}) — Multi-series area chart, including stacked and signed values.
BarChart(title: string, labels: string[], series: Series[], options?: {height?: number, legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string, yAxisLabel?: string, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "grouped" | "stacked", orientation?: "vertical" | "horizontal", barRadius?: number}) — Grouped or stacked vertical/horizontal bar chart.
HorizontalBarChart(title: string, labels: string[], series: Series[], options?: {height?: number, legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string, yAxisLabel?: string, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "grouped" | "stacked", barRadius?: number}) — Horizontal orientation of the same upstream BarChart engine.
LineChart(title: string, labels: string[], series: Series[], options?: {height?: number, legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string, yAxisLabel?: string, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "linear" | "natural" | "step", showDots?: boolean, crosshair?: boolean, highlight?: boolean}) — Multi-series line chart with configurable interpolation and dots.
HeatmapChart(title: string, labels: string[], series: Series[], options?: {height?: number, legend?: boolean, animate?: boolean, rampMode?: "sequential" | "diverging", showColorScale?: boolean, showCellLabels?: boolean, showYAxis?: boolean}) — Value heatmap with missing cells and signed diverging color scales.
RadarChart(title: string, labels: string[], series: Series[], options?: {height?: number, legend?: boolean, animate?: boolean, grid?: boolean, gridShape?: "circle" | "polygon", gridLevels?: number, variant?: "line" | "area", showDots?: boolean}) — Multi-series radar chart with polygon or circular grids.
PieChart(title: string, slices: Slice[], options?: {height?: number, legend?: boolean, animate?: boolean, variant?: "pie" | "donut", appearance?: "circular" | "semiCircular", format?: "percentage" | "number", legendVariant?: "default" | "stacked"}) — Pie or donut chart with a keyboard-accessible interactive legend.
RadialChart(title: string, slices: Slice[], options?: {height?: number, legend?: boolean, animate?: boolean, variant?: "circular" | "semiCircular", format?: "percentage" | "number", legendVariant?: "default" | "stacked", grid?: boolean}) — Circular or semicircular radial magnitude chart.
FunnelChart(title: string, slices: Slice[], options?: {height?: number, legend?: boolean, animate?: boolean, orientation?: "horizontal" | "vertical", edges?: "curved" | "straight", layers?: number, showLabels?: boolean, showValues?: boolean, showPercentage?: boolean}) — Actual curved/straight multi-stage funnel with upstream geometry.
SegmentedBar(title: string, slices: Slice[], options?: {legend?: boolean, animate?: boolean, legendVariant?: "default" | "stacked"}) — Proportional segmented bar with interactive legend.
SingleStackedBar(title: string, slices: Slice[], options?: {legend?: boolean, animate?: boolean, legendVariant?: "default" | "stacked"}) — Compatibility name for the same upstream SegmentedBar core.
ScatterChart(title: string, datasets: ScatterSeries[], options?: {height?: number, legend?: boolean, animate?: boolean, grid?: boolean, verticalGrid?: boolean, showYAxis?: boolean, xAxisLabel?: string, yAxisLabel?: string, dotRadius?: number}) — Multiple named scatter datasets with finite signed coordinates.
CalendarHeatmap(title: string, days: CalendarDay[], options?: {height?: number, animate?: boolean, range?: "6m" | "12m" | any, thresholds?: any, layout?: "fluid" | "fill", weekStartDay?: number, showMonthLabels?: boolean, weekdayTickFilter?: "all" | "odd" | "even", weekdayLabelFormat?: "full" | "initial", legendVariant?: "swatches" | "gradient" | "none", valueLabel?: string, patterns?: "diagonal" | "dots" | "cross" | "horizontal" | "vertical"[]}) — Contribution calendar with real date geometry, sparse days and level patterns.
MiniAreaChart(title: string, values: number[], options?: {size?: number, animate?: boolean, variant?: "linear" | "natural" | "step", useGradient?: boolean, opacity?: number}) — Compact upstream area sparkline with signed values.
MiniBarChart(title: string, values: number[], options?: {size?: number, animate?: boolean, radius?: number}) — Compact upstream bar sparkline with signed values.
MiniLineChart(title: string, values: number[], options?: {size?: number, animate?: boolean, variant?: "linear" | "natural" | "step"}) — Compact upstream line sparkline with signed values.

### base/text
Text(content: string, tone?: "default" | "muted" | "info" | "success" | "warning" | "error") — Plain text with a semantic tone. HTML is displayed literally.
Heading(content: string, level?: number) — Semantic heading.
Badge(label: string, tone?: "default" | "muted" | "info" | "success" | "warning" | "error") — Compact supplied status label.
Divider() — Thematic separator.
Alert(title: string, description: string, tone?: "default" | "muted" | "info" | "success" | "warning" | "error") — Supplied notice with visible title and explanation.
Table(columns: {key: string, label: string}[], rows: Record<string, string | number | boolean | any>[], caption?: string) — Supplied scalar data table. Row keys must be declared column keys; use @Each to project business records before rendering.

### base/controls
Button(label: string, onPress: ActionExpression, variant?: "primary" | "secondary" | "ghost", disabled?: boolean) — Explicit local state action button.
Input(label: string, value: $binding<string>, placeholder?: string, disabled?: boolean) — Labeled single-line text input bound to local state.
Textarea(label: string, value: $binding<string>, rows?: number, placeholder?: string, disabled?: boolean) — Labeled multiline text input.
Select(label: string, value: $binding<string>, options: {label: string, value: string}[], disabled?: boolean) — Labeled single selection from supplied options.
RadioGroup(label: string, value: $binding<string>, options: {label: string, value: string}[], disabled?: boolean) — Visible single-choice radio options.
Checkbox(label: string, checked: $binding<boolean>, disabled?: boolean) — Labeled boolean checkbox.
Switch(label: string, checked: $binding<boolean>, disabled?: boolean) — Labeled local on/off switch.
Slider(label: string, value: $binding<number>, min: number, max: number, step?: number, disabled?: boolean) — Bounded numeric local slider.

### base/icon
Icon(name: string, label?: string, tone?: "default" | "muted" | "info" | "success" | "warning" | "error", size?: 16 | 20 | 24 | 32 | 48) — A bundled official SVG icon with semantic tone and a fixed optical size.

### base/layout
Stack(children: Component[], gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl") — Vertical flow of components.
Row(children: Component[], gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl", align?: "start" | "center" | "end" | "stretch") — Wrapping horizontal flow.
Grid(children: Component[], columns?: number, gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl") — Responsive bounded column grid.
Card(children: Component[], title?: string) — Grouped surface with optional title.

### base/media
Image(src: string, alt: string, caption?: string) — Image subject to the host media policy.
Video(src: string, title: string, poster?: string, captions?: {src: string, label: string, language: string}[]) — Native video with real browser controls and optional captions. Embedded media works offline; remote media requires an explicit host policy.

## Built-in Functions

Data functions prefixed with `@` to distinguish from components. These are the ONLY functions available — do NOT invent new ones.
Use @-prefixed built-in functions (@Count, @Sum, @Avg, @Min, @Max, @Round) on data. Do NOT hardcode computed values.

@Count(array: any[]) → number — Returns array length
@First(array: any[]) → any — Returns first element of array
@Last(array: any[]) → any — Returns last element of array
@Sum(numbers: number[]) → number — Sum of numeric array
@Avg(numbers: number[]) → number — Average of numeric array
@Min(numbers: number[]) → number — Minimum value in array
@Max(numbers: number[]) → number — Maximum value in array
@Sort(array: any[], field: string, direction?: "asc" | "desc") → any[] — Sort array by field. Direction: "asc" (default) or "desc"
@Filter(array: any[], field: string, operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains", value: any) → any[] — Filter array by field value
@Round(number: number, decimals?: number) → number — Round to N decimal places (default 0)
@Abs(number: number) → number — Absolute value
@Floor(number: number) → number — Round down to nearest integer
@Ceil(number: number) → number — Round up to nearest integer
@Each(array: any[], varName: string, template: any) — Evaluate template for each element. varName is the loop variable — use it ONLY inside the template expression (inline). Do NOT create a separate statement for the template.

Builtins compose — output of one is input to the next:
`@Count(@Filter(data.rows, "field", "==", "val"))` for KPIs/chart values, `@Round(@Avg(data.rows.score), 1)`, `@Each(data.rows, "item", Comp(item.field))` for per-item rendering.
Array pluck: `data.rows.field` extracts a field from every row → use with @Sum, @Avg, charts, tables.

IMPORTANT @Each rule: The loop variable (e.g. "item") is ONLY available inside the @Each template expression. Always inline the template — do NOT extract it to a separate statement.
CORRECT: `list = @Each(rows, "t", Comp(t.name))`
WRONG: `item = Comp(t.name)` then `list = @Each(rows, "t", item)`, because t is undefined in item.

## Action — Button Behavior

An action updates declared local state. Pass a listed step, or Action([...]) for a transaction of local steps. A button must have an explicit action; it never sends a message or opens a URL automatically.

Available steps:
- @Set(variable: $variable, value: any) — Set a $variable to a specific value
- @Reset(variable: $variable) — Reset $variables to their declared defaults; pass several to reset each (e.g. @Reset($title, $priority) restores $title="" and $priority="medium")

Example:
$count = 0
root = Stack([Button("Add one", @Set($count, $count + 1)), Button("Reset", @Reset($count))])
A rejected step rolls back the complete transaction.

## Statement order and passive previews

openui-lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.

During streaming, the output is re-parsed on every chunk. Undefined references are temporarily unresolved and appear once their definitions stream in. This creates a progressive top-down reveal — structure first, then data fills in.

**Optional layout-first ordering for passive previews:**
1. `root = Stack(...)` — UI shell appears immediately
2. $variable declarations — state ready for bindings
3. Component definitions — fill in with data already available
4. Data values — leaf content last

The root statement may appear anywhere in a complete document. Placing it first is optional. Inform partial previews remain passive and do not commit state, execute actions, load resources, or guarantee streaming performance.

## Examples

root = Stack([AreaChart("Quarterly revenue", ["Q1", "Q2", "Q3", "Q4"], [Series("Revenue", [24,38,30,47]), Series("Plan", [20,30,35,40])])])

root = Stack([BarChart("Quarterly revenue", ["Q1", "Q2", "Q3", "Q4"], [Series("Revenue", [24,38,30,47]), Series("Plan", [20,30,35,40])])])

root = Stack([HorizontalBarChart("Quarterly revenue", ["Q1", "Q2", "Q3", "Q4"], [Series("Revenue", [24,38,30,47]), Series("Plan", [20,30,35,40])])])

root = Stack([LineChart("Quarterly revenue", ["Q1", "Q2", "Q3", "Q4"], [Series("Revenue", [24,38,30,47]), Series("Plan", [20,30,35,40])])])

root = Stack([HeatmapChart("Delta heatmap", ["Q1","Q2","Q3","Q4"], [Series("Delta",[-2,0,null,4])], {rampMode:"diverging",showCellLabels:true})])

root = Stack([RadarChart("Quarterly revenue", ["Q1", "Q2", "Q3", "Q4"], [Series("Revenue", [24,38,30,47]), Series("Plan", [20,30,35,40])])])

## Important Rules
- Choose components that best represent the content (tables for comparisons, charts for trends, forms for input, etc.)

## Final Verification
Before finishing, walk your output and verify:
1. Define root = Stack(...) exactly once. Its position is unrestricted in a complete document.
2. Every referenced name is defined. Every defined name (other than root) is reachable from root.
3. Every $binding appears in at least one component or expression.

- Component means any available UI component in this profile. Data constructors are not UI children.
- The positional parameter order is an ABI. Never emit named arguments, unknown props, callback functions, raw HTML, arbitrary CSS, imports, Query, Mutation, @Run, @OpenUrl or @ToAssistant.
- All mutable variables must be explicitly declared. Use direct declared $variables for ordinary writable bindings. $value is reserved for assignment-binding input; it is not standalone state. Arbitrary callbacks or JavaScript functions are forbidden.
- Only @Set, @Reset and Action([...]) are local action syntax. Actions have no authority to call external services.
- Output must be complete. Partial streaming is preview-only. Invalid values or unknown components reject the document, rather than silently dropping content.
- Numbers are finite. Division and remainder by zero are errors. Do not depend on implicit numeric coercion or unsafe object keys.
- Inform semantics: == and != compare scalar values strictly; logical operators require booleans. Sort uses deterministic lexicographic string order and rejects mixed number/string keys. Filter relational operators require numbers. @Each uses an inline template with a named item, no index parameter or JavaScript lambda.
- Display supplied facts accurately. Domain modules do not fetch, verify or transact on data.
- Icon.name must match an exact name from the bundled searchable icon catalog. Search the catalog by purpose and include only the names needed for this answer; the runtime still validates its full enum.
- AreaChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- AreaChart: Legend visibility is local presentation state, not a second DSL state store.
- AreaChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- BarChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- BarChart: Legend visibility is local presentation state, not a second DSL state store.
- BarChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- HorizontalBarChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- HorizontalBarChart: Legend visibility is local presentation state, not a second DSL state store.
- HorizontalBarChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- LineChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- LineChart: Legend visibility is local presentation state, not a second DSL state store.
- LineChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- HeatmapChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- HeatmapChart: Legend visibility is local presentation state, not a second DSL state store.
- HeatmapChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- RadarChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- RadarChart: Legend visibility is local presentation state, not a second DSL state store.
- RadarChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- PieChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- PieChart: Legend visibility is local presentation state, not a second DSL state store.
- PieChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- RadialChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- RadialChart: Legend visibility is local presentation state, not a second DSL state store.
- RadialChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- FunnelChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- FunnelChart: Legend visibility is local presentation state, not a second DSL state store.
- FunnelChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- SegmentedBar: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- SegmentedBar: Legend visibility is local presentation state, not a second DSL state store.
- SegmentedBar: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- SingleStackedBar: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- SingleStackedBar: Legend visibility is local presentation state, not a second DSL state store.
- SingleStackedBar: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- ScatterChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- ScatterChart: Legend visibility is local presentation state, not a second DSL state store.
- ScatterChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- CalendarHeatmap: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- CalendarHeatmap: Legend visibility is local presentation state, not a second DSL state store.
- CalendarHeatmap: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- MiniAreaChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- MiniAreaChart: Legend visibility is local presentation state, not a second DSL state store.
- MiniAreaChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- MiniBarChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- MiniBarChart: Legend visibility is local presentation state, not a second DSL state store.
- MiniBarChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- MiniLineChart: Hover tooltips are pointer-only; the data table exposes the same values to keyboard and assistive-technology users.
- MiniLineChart: Legend visibility is local presentation state, not a second DSL state store.
- MiniLineChart: Arbitrary colors, JavaScript callbacks, remote data, detached legend stores and export APIs are not exposed by this DSL.
- Button: No host tools, navigation, account access or message sending.
- Icon: No remote SVG or arbitrary path data.
- Image: HTTPS is syntactically allowed but remains blocked until the host media policy explicitly permits it. SVG data URLs are rejected.
- Data constructors (not renderers):
Series(name: string, values: number[]): Named finite series; null is supported only by HeatmapChart as a missing cell.
Slice(label: string, value: number): Named non-negative magnitude for pie, radial, funnel or segmented charts.
Point(x: number, y: number): A finite scatter coordinate. Negative and zero values are supported.
ScatterSeries(name: string, points: {x: number, y: number}[]): Named scatter dataset containing finite Point values.
CalendarDay(date: string, value: number): ISO calendar day and non-negative magnitude. Duplicate dates are summed by the upstream calendar.

## 可直接改写的最小 HTML

下面示例是完整有效程序。先保留它的 select/viewNames/加载与报错处理，再把 source 换成用户真正需要的完整答案。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>让图表、表格和解释一起更新</title>
<style>body{margin:0;padding:clamp(16px,4vw,40px);font:16px system-ui,sans-serif;color:#171717;background:#fff}main{max-width:960px;margin:auto}#status{max-width:960px;margin:16px auto;white-space:pre-wrap}</style>
</head>
<body>
<main id="answer" aria-label="让图表、表格和解释一起更新"></main>
<p id="status" role="status">正在载入答案…</p>
<noscript>需要启用 JavaScript 才能显示这份互动答案。</noscript>
<script id="inform-config" type="application/json">{"source":"$minimum = 60\nrows = [{name:\"读书会\",score:91},{name:\"写作课\",score:76},{name:\"分享会\",score:67},{name:\"讨论班\",score:54}]\nvisible = @Sort(@Filter(rows,\"score\",\">=\",$minimum),\"score\",\"desc\")\nroot = Stack([\n Heading(\"让图表、表格和解释一起更新\",1),\n Text(\"这组原创示例中，读书会反馈分最高，为 91 分。调整最低分，可以观察候选活动怎样变化；图表和表格始终使用同一份筛选结果。\",\"muted\"),\n Card([Slider(\"最低反馈分\",$minimum,0,100,1),Button(\"恢复 60 分\",@Reset($minimum),\"secondary\")],\"试着筛选\"),\n Text(\"达到阈值：\"+@Count(visible)+\" 场活动\"),\n @Count(visible)>0 ? Stack([\n  Text(\"候选活动的等权平均反馈分：\"+@Round(@Avg(visible.score),1)+\" 分。\"),\n  BarChart(\"候选活动反馈分\",visible.name,[Series(\"反馈分\",visible.score)],{height:280,animate:false}),\n  Table([{key:\"name\",label:\"活动\"},{key:\"score\",label:\"反馈分\"}],visible,\"与图表相同的数据\")\n ],\"lg\") : Alert(\"当前没有匹配结果\",\"把最低分调到 91 或以下，或使用恢复按钮。\",\"warning\"),\n Text(\"反馈分不能单独决定活动是否适合你。还要核对主题、时间与费用。这里没有提供这些资料，所有活动与分数都是演示数据。\"),\n Text(\"来源：本例原创四行数据。筛选按 score ≥ 最低分；平均分按活动等权计算。\",\"muted\")\n],\"xl\")\n","select":["base/layout","base/text","base/controls","base/icon","base/media","base/charts"],"viewNames":[],"theme":"light"}</script>
<script src="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@web-chat-latest/cdn/next/inform-ui.global.js"></script>
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
```
