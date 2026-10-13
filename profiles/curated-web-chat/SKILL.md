---
name: inform-web-chat-views
description: 生成完整互动 HTML 答案，在 Inform 基础与图表之外只开放十个内容视图，用于指标、图注、章节、步骤、公式、折叠说明、来源、代码、引文和核对清单。
---

# 精选：十个内容视图

把本文件直接交给 Web Chat AI 即可。任务是输出一份完整 HTML 答案：直接回答问题，用图文和有意义的本地交互帮助理解。无需终端、CLI、npm、React 工程或额外的全量组件文档。

## 写作和交付合同

- 默认沿用下方可运行 HTML 壳，只替换标题、语言与配置中的 source。保持给定 select、viewNames 和固定版本 script URL。模型不要另造 DOM 框架、解释器或业务 JavaScript；交互逻辑写入 DSL。
- 47 个 UI 构造器、15 个数据构造器。本版只额外开放：MetricView、FigureView、SectionView、StepsView、MathView、DetailsView、CitationView、CodeView、BlockquoteView、ChecklistView。不要改成全部 views/content；其他领域 View 不在本版合同里。
- 所有真实可用签名就在本文件后面的自动生成合同中。schema.json、manifest.json、profile.json、minimal.html 来自同一 profile；模型不必运行生成脚本，也不需要读取全部195个View。
- CodeView 只显示字符串，不执行代码；代码块用 language、highlight:true、copy:true，inline:true 时不可同时启用高亮/复制。它保留缩进和原始换行，长行在面板内横向滚动；不把每行强行断开。复制需要浏览器安全上下文、权限与真实点击，失败应按页面提示处理。
- BlockquoteView 的文字放 children，并准确署名；原创总结要标为原创，不能冒充外部引文。ChecklistView 是视图自身的临时自检状态，不是可在其他 DSL 表达式读取的 $binding；需要联动计算时使用基础 Checkbox/Switch。
- 通用对比用 Table/Grid/MetricView，过程用 StepsView；本版没有 ComparisonView 或 TimelineView。
- 不声明已完成查询、订票、付款、发送或其他宿主服务。这里只处理给定数据和本地状态。Query、Mutation、@Run、@OpenUrl、@ToAssistant 与任意 JS 均不支持。
- 概念、数据、结论和来源必须说清楚。原创演示数据明确标为示例；不伪造真实来源。图表配可读的文字结果及必要表格；图片有 alt；控件标签说明单位和作用；处理空结果、重置和失效选择。
- 每条 DSL 声明从新行开始，单个表达式可跨行；不用分号。root = Stack(...) 可以在任意位置。组件是位置参数；对象内才写 key:value。显式声明所有 $state；只有声明为 binding 的参数能绑定状态。
- 只用 @Filter、@Sort、@Each 等下方实际列出的纯函数。没有 lambda、.map() 或 eval。Each 的第三参数是内联模板。Table 的行对象只能含 columns 声明的键；用 @Each 投影并保留原始记录做选择。
- source 是 JSON 字符串，完整进行 JSON 转义；HTML 数据块中的每个 < 写成 \u003c，避免正文的 </script> 结束数据块。不要把 DSL 直接拼接成可执行 JavaScript。
- 若使用图标，可直接选以下已核对的官方名称：Check、Info、Warning、ArrowRight、Chart、Calendar、BookOpen、Lightbulb、MapPin、Search、Filter、Settings、Play、Pause、CircleQuestion、Link。这里故意不列全部 755 个 glyph；没有额外目录时用文字或这些名称，不猜名字。
- HTML 依赖网络获取固定版本 JS；网页宿主还需允许脚本和样式。固定壳含内联初始化与样式，严格 CSP 需宿主配置 nonce/hash。不能保证所有聊天预览器都允许执行 HTML。

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

### views/content
CodeView(data: CodeData) — Supplied code View rendered with the shared Inform foundation theme.
MathView(data: MathData) — Supplied math View rendered with the shared Inform foundation theme.
BlockquoteView(data: BlockquoteData, children: Component[]) — Supplied blockquote View rendered with the shared Inform foundation theme.
SectionView(data: SectionData, children: Component[]) — Supplied section View rendered with the shared Inform foundation theme.
FigureView(data: FigureData, children: Component[]) — Supplied figure View rendered with the shared Inform foundation theme.
DetailsView(data: DetailsData, children: Component[]) — Supplied details View rendered with the shared Inform foundation theme.
CitationView(data: CitationData) — Supplied citation View rendered with the shared Inform foundation theme.
MetricView(data: MetricData) — Supplied metric View rendered with the shared Inform foundation theme.
StepsView(data: StepsData) — Supplied steps View rendered with the shared Inform foundation theme.
ChecklistView(data: ChecklistData) — Supplied checklist View rendered with the shared Inform foundation theme.

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
- CodeView: Supplied source data is not independently fetched or verified.
- CodeView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- CodeView: Base composition is a target until adapter evidence confirms extraction.
- MathView: Supplied source data is not independently fetched or verified.
- MathView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- MathView: Base composition is a target until adapter evidence confirms extraction.
- BlockquoteView: Supplied source data is not independently fetched or verified.
- BlockquoteView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- BlockquoteView: Base composition is a target until adapter evidence confirms extraction.
- SectionView: Supplied source data is not independently fetched or verified.
- SectionView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- SectionView: Base composition is a target until adapter evidence confirms extraction.
- FigureView: Supplied source data is not independently fetched or verified.
- FigureView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- FigureView: Base composition is a target until adapter evidence confirms extraction.
- DetailsView: Supplied source data is not independently fetched or verified.
- DetailsView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- DetailsView: Base composition is a target until adapter evidence confirms extraction.
- CitationView: Supplied source data is not independently fetched or verified.
- CitationView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- CitationView: Base composition is a target until adapter evidence confirms extraction.
- MetricView: Supplied source data is not independently fetched or verified.
- MetricView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- MetricView: Base composition is a target until adapter evidence confirms extraction.
- StepsView: Supplied source data is not independently fetched or verified.
- StepsView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- StepsView: Base composition is a target until adapter evidence confirms extraction.
- ChecklistView: Supplied source data is not independently fetched or verified.
- ChecklistView: Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.
- ChecklistView: Base composition is a target until adapter evidence confirms extraction.
- Data constructors (not renderers):
Series(name: string, values: number[]): Named finite series; null is supported only by HeatmapChart as a missing cell.
Slice(label: string, value: number): Named non-negative magnitude for pie, radial, funnel or segmented charts.
Point(x: number, y: number): A finite scatter coordinate. Negative and zero values are supported.
ScatterSeries(name: string, points: {x: number, y: number}[]): Named scatter dataset containing finite Point values.
CalendarDay(date: string, value: number): ISO calendar day and non-negative magnitude. Duplicate dates are summed by the upstream calendar.
CodeData(value: string, language?: string, inline?: boolean | true | false, copy?: boolean | false | boolean, highlight?: boolean | false | boolean): Strict supplied record for CodeView. Conditional variants are enforced by the same bounded validator.
MathData(latex: string, block?: boolean): Strict supplied record for MathView. Conditional variants are enforced by the same bounded validator.
BlockquoteData(attribution?: string, cite?: string): Strict supplied record for BlockquoteView. Conditional variants are enforced by the same bounded validator.
SectionData(heading?: string): Strict supplied record for SectionView. Conditional variants are enforced by the same bounded validator.
FigureData(caption?: string): Strict supplied record for FigureView. Conditional variants are enforced by the same bounded validator.
DetailsData(summary: string): Strict supplied record for DetailsView. Conditional variants are enforced by the same bounded validator.
CitationData(title: string, url: string, publisher?: string, description?: string, number?: number): Strict supplied record for CitationView. Conditional variants are enforced by the same bounded validator.
MetricData(variant?: "plain" | "card", label: string, value: string | number | boolean | any, unit?: string, hint?: string, precision?: number, color?: "default" | "secondary" | "tertiary" | "success" | "warning" | "danger" | "info" | "accent"): Strict supplied record for MetricView. Conditional variants are enforced by the same bounded validator.
StepsData(items: {title: string, detail?: string, latex?: string}[]): Strict supplied record for StepsView. Conditional variants are enforced by the same bounded validator.
ChecklistData(label: string, items: {id: string, label: string, hint?: string, disabled?: string | number | boolean | any, checked?: boolean}[], disabled?: string | number | boolean | any, filter?: boolean, bulk?: boolean, emptyText?: string): Strict supplied record for ChecklistView. Conditional variants are enforced by the same bounded validator.

## 可直接改写的最小 HTML

下面示例是完整有效程序。先保留它的 select/viewNames/加载与报错处理，再把 source 换成用户真正需要的完整答案。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>为什么一个大数会拉高平均数？</title>
<style>body{margin:0;padding:clamp(16px,4vw,40px);font:16px system-ui,sans-serif;color:#171717;background:#fff}main{max-width:960px;margin:auto}#status{max-width:960px;margin:16px auto;white-space:pre-wrap}</style>
</head>
<body>
<main id="answer" aria-label="为什么一个大数会拉高平均数？"></main>
<p id="status" role="status">正在载入答案…</p>
<noscript>需要启用 JavaScript 才能显示这份互动答案。</noscript>
<script id="inform-config" type="application/json">{"source":"$largest = 12\n$showMethod = true\nnumbers = [4,6,8,$largest]\nmean = @Avg(numbers)\nmedian = (numbers[1]+numbers[2])/2\nroot = Stack([\n Badge(\"交互式概念解释\"),\n Heading(\"为什么一个大数会拉高平均数？\",1),\n Text(\"平均数把所有值都放进总和。中位数只看排序后的中间位置。把最后一个数从 12 调高，你会看到平均数上升，而这组数据的中位数一直是 7。\",\"muted\"),\n Card([Slider(\"第四个数\",$largest,8,80,2),Switch(\"展开计算过程\",$showMethod),Button(\"恢复为 12\",@Reset($largest),\"secondary\")],\"自己试一次\"),\n Grid([MetricView({label:\"平均数\",value:@Round(mean,1)}),MetricView({label:\"中位数\",value:median}),MetricView({label:\"第四个数\",value:$largest})],3,\"lg\"),\n FigureView({caption:\"四个原创示例数字。只改变第四项，前三项始终为 4、6、8。\"},[BarChart(\"四个数的大小\",[\"第一项\",\"第二项\",\"第三项\",\"第四项\"],[Series(\"数值\",numbers)],{height:280,animate:false})]),\n $showMethod ? SectionView({heading:\"从数字到结论\"},[\n  StepsView({items:[{title:\"求和\",detail:\"4 + 6 + 8 + \"+$largest+\" = \"+@Sum(numbers)},{title:\"计算平均数\",detail:@Sum(numbers)+\" ÷ 4 = \"+mean},{title:\"找中间位置\",detail:\"已经按升序排列。中间两个数为 6 与 8，所以中位数为 (6 + 8) ÷ 2 = 7。\"}]}),\n  MathView({latex:\"\\\\bar{x}=\\\\frac{1}{n}\\\\sum_{i=1}^{n}x_i\",block:true})\n ]) : Text(\"计算过程已收起；图表与统计值仍会随滑块更新。\",\"muted\"),\n Heading(\"该用哪个指标？\",2),\n Text(\"如果问题关心总量被平均分配的结果，平均数很直接。如果想描述一组数据的中间位置，又不想让单个极端值产生很大影响，中位数往往更有帮助。先明确问题，再选择统计量。\"),\n BlockquoteView({attribution:\"本示例的原创总结\"},[Text(\"先问要描述总量的平均分配，还是数据的中间位置，再决定用平均数还是中位数。\")]),\n SectionView({heading:\"用代码复现当前数字\"},[\n  Text(\"这是可复制的 JavaScript 示例，只作代码展示，不在页面内执行。滑块改变后，第一行中的第四个数会同步更新。\"),\n  CodeView({value:\"const values = [4, 6, 8, \"+$largest+\"];\\nfunction average(values) {\\n  const total = values.reduce((sum, value) => sum + value, 0);\\n  return total / values.length;\\n}\\nconst mean = average(values);\\n// 这组数字已按升序排列，中间两项不随第四项改变。\\nconst median = (values[1] + values[2]) / 2;\\nconsole.log({ mean, median });\",language:\"javascript\",copy:true,highlight:true})\n ]),\n ChecklistView({label:\"读完后的本地核对清单\",items:[{id:\"question\",label:\"我能说明平均数和中位数各自回答什么问题\",checked:false},{id:\"extreme\",label:\"我试过把第四个数调高，比较两项指标\",checked:false},{id:\"boundary\",label:\"我知道这组数据始终有序，不能把结论无限推广\",checked:false}],filter:true,bulk:true}),\n Text(\"核对清单只记录当前页面视图中的自检，不改变上方数字，也不会发送或保存到外部服务。\",\"muted\"),\n DetailsView({summary:\"这个演示的边界\"},[Text(\"第四个数的最小值为 8，数据始终有序，中间两项不会改变。这说明的是这一组四个数的行为；别推广成任何数据变化都不会影响中位数。\")]),\n CitationView({number:1,title:\"NIST：Measures of Location\",url:\"https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm\",publisher:\"NIST/SEMATECH e-Handbook\",description:\"平均数、中位数及极端值影响的定义与解释。图表数据由本示例原创，不来自 NIST。\"})\n],\"xl\")\n","select":["base/layout","base/text","base/controls","base/icon","base/media","base/charts","views/content"],"viewNames":["MetricView","FigureView","SectionView","StepsView","MathView","DetailsView","CitationView","CodeView","BlockquoteView","ChecklistView"],"theme":"light"}</script>
<script src="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@675c6659b40becce1b1ed2d6383d2dee852e8a14/cdn/next/inform-ui.global.js"></script>
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
