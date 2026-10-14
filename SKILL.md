---
name: inform-interactive-answers
description: 供 Agent 和 Web Chat AI 生成完整 HTML 答案。按表达目标选择 Inform 文字、基础组件、图示、数据图表与必要交互；Agent 可按需发现模块、领域视图和图标，并使用可选 CLI 验证与构建。无需创建 React 工程。
---

# Inform HTML 答案：基础版

把本文件交给 Agent 或 Web Chat AI 即可。任务是输出一份完整 HTML 答案：直接回答问题，按表达目标选择呈现方式，需要时再加入图示、数据图表或有意义的本地交互。默认路线无需终端、CLI、npm、React 工程或额外的全量组件文档。
## 运行库交付

匹配的运行库已提交到 main，随包快照也已更新。本次没有独立核验线上缓存或浏览器表现，不能把 Git 发布或随包检查表述为线上验收。下方 HTML 使用 main 在线入口；需要离线交付或明确使用本次快照时，把 assets/runtime/inform-ui.global.js 和 THIRD_PARTY_NOTICES.txt 放到 HTML 旁，并将 script src 改为 ./inform-ui.global.js。发布记录与验证范围见 generated/build.json。

## 两条使用路线

- **直接写答案**：Agent 和 Web Chat 都可以只读本文件，用下面的基础与图表合同输出 HTML，不要求终端。专门的轻量入口位于 profiles/web-chat-core/SKILL.md 和 profiles/curated-web-chat/SKILL.md。
- **Agent 按需扩展**：有仓库文件或工具能力时，先读 references/catalog.md 做名称与模块发现，再用随包 CLI prompt 从当前 runtime 按模块或精确 View 名生成合同。generated/modules/*.txt 与 generated/views/<ViewName>.txt 是按同一 runtime 生成的静态合同，读取前核对 generated/snapshot-status.json 与 runtime 锁；换了 runtime 后须重新生成，不沿用旧签名。不要把全部 View 和 glyph 一次性塞进上下文。全量目录不是本默认 profile 的额外授权。
- **可选 CLI**：node scripts/inform-answer.mjs catalog 做模块发现；prompt --select 模块列表 --views 精确View列表 生成该选择的合同；icons --query 关键词 发现官方图标；check answer.openui 检查，build answer.openui --out answer.html 构建。check/build 都要传同一 --select 和 --views；构建使用 --runtime-url https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js 跟随 main。CLI 随仓库提供 Node runtime，不要求安装 React 工程。
- 扩展时必须同时用真实 profile 重新生成 prompt/schema，并让 HTML 的 select/viewNames 保持一致；不能把扩展 View 混进本文件默认的 40 个 UI 合同。离线或调试可显式使用随包的验证快照，但不要把固定 commit 写成默认 HTML 入口。


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

- 默认沿用下方可运行 HTML 壳，只替换标题、语言与配置中的 source。保持给定 select、viewNames 和 script URL；默认入口跟随 main，不把 commit 或版本号写入 HTML。模型不要另造 DOM 框架、解释器或业务 JavaScript；交互逻辑写入 DSL。
- 40 个 UI 构造器、6 个数据构造器。本版不开放任何领域 View。从已开放的文字、基础组件与图表中按需选择；不要从旧目录猜 View 名称。
- 下面的范围、整数、长度、枚举、默认值和组合条件均属于校验合同；省略可选参数不等于可以传任意值。变量、计算结果和状态更新也必须满足约束，图表空间不足时调整外层布局，不把受限尺寸缩到下限以下。
- 所有真实可用签名就在本文件后面的自动生成合同中。schema.json、manifest.json、profile.json、minimal.html 来自同一 profile；模型不必运行生成脚本，也不需要读取全部 View。
- 代码使用基础模块 base/code 的 Code({value:"代码文本",language:"javascript"})；CodeView(data) 保留为同模块兼容别名，不再放入 viewNames。块模式默认显示语言名称、启用 highlight.js 高亮和一键复制，无需重复写 true；可分别用 showLanguage:false、highlight:false、copy:false 关闭。没有语言时显示 Plain text；不支持的语言安全回退为纯文本，不自动猜语言或远程加载语法。inline:true 为纯文本行内代码，不能显式启用这三项增强。代码只展示、不执行；保留缩进与换行，长行在面板内横向滚动。复制需要浏览器安全上下文、权限与真实点击，失败时按页面提示处理。
- 不声明已完成查询、订票、付款、发送或其他宿主服务。这里只处理给定数据和本地状态。Query、Mutation、@Run、@OpenUrl、@ToAssistant 与任意 JS 均不支持。
- 概念、数据、结论和来源必须说清楚。原创演示数据明确标为示例；不伪造真实来源。使用图表时配可读的文字结果，并保证数据可访问，必要时补充表格；使用图片时提供 alt；使用控件时标签说明单位和作用，并按实际状态流程处理空结果、重置和失效选择。
- 每条 DSL 声明从新行开始，单个表达式可跨行；不用分号。root = Stack(...) 可以在任意位置。组件是位置参数；对象内才写 key:value。显式声明所有 $state；只有声明为 binding 的参数能绑定状态。
- 只用 @Filter、@Sort、@Each 等下方实际列出的纯函数。没有 lambda、.map() 或 eval。Each 的第三参数是内联模板。Table 的行对象只能含 columns 声明的键；用 @Each 投影并保留原始记录做选择。
- 同构重复的卡片、行、格子或分组，优先写数据数组 + @Each(array,"item",内联模板)，不要逐项复制组件树；分组内仍有重复时嵌套 @Each。不同结构的少量段落不必强行统一模板。
- @Each 是已有的逐项展开方式，不另造 foreach、@ForEach、lambda 或 .map()；没有索引参数。内层模板可读取外层 item，循环变量不能用于模板外的独立声明。需要序号时把序号写入数据。
- source 是 JSON 字符串，完整进行 JSON 转义；HTML 数据块中的每个 < 写成 \u003c，避免正文的 </script> 结束数据块。不要把 DSL 直接拼接成可执行 JavaScript。
- 若使用图标，可直接选以下已核对的官方名称：Check、Info、Warning、ArrowRight、Chart、Calendar、BookOpen、Lightbulb、MapPin、Search、Filter、Settings、Play、Pause、CircleQuestion、Link。这里故意不列全部 755 个 glyph；没有额外目录时用文字或这些名称，不猜名字。
- HTML 依赖网络获取 main JS；它是会更新的入口，CDN 与浏览器缓存可能延后看到更新，不保证每次打开立即拿到最新字节。网页宿主还需允许脚本和样式。固定壳含内联初始化与样式，严格 CSP 需宿主配置 nonce/hash。不能保证所有聊天预览器都允许执行 HTML。

这是 OpenUI 派生的严格本地方言，不是全部上游 runtime 的兼容替代。精简的是模型合同与可用组件集合；使用的 browser JS 仍是同一完整 bundle。不宣称未测的 token 或下载体积节省。

## 重复结构：先数据，再模板

下面是完整 DSL 小例子；外层生成分组卡片，内层生成徽章。把它放进同一 HTML 壳的 source，仍只需要本 profile 已有的基础组件。

```openui
groups = [{title:"第一组",items:["甲","乙"]},{title:"第二组",items:["丙"]}]
root = Stack(@Each(groups,"group",Card([Row(@Each(group.items,"item",Badge(item)),"sm")],group.title)),"md")
```

写完后检查：同一组件结构是否被逐项抄写？能否抽成一份内联模板？更完整的空组与本地选择例子按需读 references/repeated-structures.md；语法边界见 references/dialect.md。无需为此加载更多 View。

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
AreaChart(title: string{maxLength=240}, labels: string{maxLength=240}[]{maxItems=256}, series: ({name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}})[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string{maxLength=240}, yAxisLabel?: string{maxLength=240}, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "linear" | "natural" | "step", stacked?: boolean, crosshair?: boolean, highlight?: boolean}) — Multi-series area chart, including stacked and signed values.
BarChart(title: string{maxLength=240}, labels: string{maxLength=240}[]{maxItems=256}, series: ({name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}})[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string{maxLength=240}, yAxisLabel?: string{maxLength=240}, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "grouped" | "stacked", orientation?: "vertical" | "horizontal", barRadius?: number[0,16]}) — Grouped or stacked vertical/horizontal bar chart.
HorizontalBarChart(title: string{maxLength=240}, labels: string{maxLength=240}[]{maxItems=256}, series: ({name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}})[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string{maxLength=240}, yAxisLabel?: string{maxLength=240}, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "grouped" | "stacked", barRadius?: number[0,16]}) — Horizontal orientation of the same upstream BarChart engine.
LineChart(title: string{maxLength=240}, labels: string{maxLength=240}[]{maxItems=256}, series: ({name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}})[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, grid?: boolean, condensed?: boolean, showYAxis?: boolean, xAxisLabel?: string{maxLength=240}, yAxisLabel?: string{maxLength=240}, tickVariant?: "singleLine" | "multiLine" | "angled", variant?: "linear" | "natural" | "step", showDots?: boolean, crosshair?: boolean, highlight?: boolean}) — Multi-series line chart with configurable interpolation and dots.
HeatmapChart(title: string{maxLength=240}, labels: string{maxLength=240}[]{maxItems=256}, series: ({name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}})[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, rampMode?: "sequential" | "diverging", showColorScale?: boolean, showCellLabels?: boolean, showYAxis?: boolean}) — Value heatmap with missing cells and signed diverging color scales.
RadarChart(title: string{maxLength=240}, labels: string{maxLength=240}[]{maxItems=256}, series: ({name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}})[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, grid?: boolean, gridShape?: "circle" | "polygon", gridLevels?: integer[1,12], variant?: "line" | "area", showDots?: boolean}) — Multi-series radar chart with polygon or circular grids.
PieChart(title: string{maxLength=240}, slices: {label: string{maxLength=240}, value: number[0,1e15]}[]{maxItems=64}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, variant?: "pie" | "donut", appearance?: "circular" | "semiCircular", format?: "percentage" | "number", legendVariant?: "default" | "stacked"}) — Pie or donut chart with a keyboard-accessible interactive legend.
RadialChart(title: string{maxLength=240}, slices: {label: string{maxLength=240}, value: number[0,1e15]}[]{maxItems=64}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, variant?: "circular" | "semiCircular", format?: "percentage" | "number", legendVariant?: "default" | "stacked", grid?: boolean}) — Circular or semicircular radial magnitude chart.
FunnelChart(title: string{maxLength=240}, slices: {label: string{maxLength=240}, value: number[0,1e15]}[]{maxItems=64}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, orientation?: "horizontal" | "vertical", edges?: "curved" | "straight", layers?: integer[1,6], showLabels?: boolean, showValues?: boolean, showPercentage?: boolean}) — Actual curved/straight multi-stage funnel with upstream geometry.
SegmentedBar(title: string{maxLength=240}, slices: {label: string{maxLength=240}, value: number[0,1e15]}[]{maxItems=64}, options?: {legend?: boolean, animate?: boolean, legendVariant?: "default" | "stacked"}) — Proportional segmented bar with interactive legend.
SingleStackedBar(title: string{maxLength=240}, slices: {label: string{maxLength=240}, value: number[0,1e15]}[]{maxItems=64}, options?: {legend?: boolean, animate?: boolean, legendVariant?: "default" | "stacked"}) — Compatibility name for the same upstream SegmentedBar core.
ScatterChart(title: string{maxLength=240}, datasets: {name: string{maxLength=240}, points: {x: number[-1e15,1e15], y: number[-1e15,1e15]}[]{maxItems=512}}[]{maxItems=12}, options?: {height?: integer[160,800], legend?: boolean, animate?: boolean, grid?: boolean, verticalGrid?: boolean, showYAxis?: boolean, xAxisLabel?: string{maxLength=240}, yAxisLabel?: string{maxLength=240}, dotRadius?: number[1,12]}) — Multiple named scatter datasets with finite signed coordinates.
CalendarHeatmap(title: string{maxLength=240}, days: {date: string{pattern="^\\d{4}-\\d{2}-\\d{2}$"}, value: number[0,1e15]}[]{maxItems=732}, options?: {height?: integer[120,600], animate?: boolean, range?: "6m" | "12m" | [string{pattern="^\\d{4}-\\d{2}-\\d{2}$"}, string{pattern="^\\d{4}-\\d{2}-\\d{2}$"}]{minItems=2,maxItems=2}, thresholds?: [number[0,1e15], number[0,1e15], number[0,1e15], number[0,1e15]]{minItems=4,maxItems=4}, layout?: "fluid" | "fill", weekStartDay?: integer[0,6], showMonthLabels?: boolean, weekdayTickFilter?: "all" | "odd" | "even", weekdayLabelFormat?: "full" | "initial", legendVariant?: "swatches" | "gradient" | "none", valueLabel?: string{maxLength=240}, patterns?: ("diagonal" | "dots" | "cross" | "horizontal" | "vertical" | null)[]{maxItems=5}}) — Contribution calendar with real date geometry, sparse days and level patterns.
MiniAreaChart(title: string{maxLength=240}, values: number[-1e15,1e15][]{maxItems=256}, options?: {size?: integer[100,320], animate?: boolean, variant?: "linear" | "natural" | "step", useGradient?: boolean, opacity?: number[0,1]}) — Compact upstream area sparkline with signed values.
MiniBarChart(title: string{maxLength=240}, values: number[-1e15,1e15][]{maxItems=256}, options?: {size?: integer[100,320], animate?: boolean, radius?: number[0,12]}) — Compact upstream bar sparkline with signed values.
MiniLineChart(title: string{maxLength=240}, values: number[-1e15,1e15][]{maxItems=256}, options?: {size?: integer[100,320], animate?: boolean, variant?: "linear" | "natural" | "step"}) — Compact upstream line sparkline with signed values.

### base/code
Code(data: {value: string{pattern="^[\\s\\S]{0,12000}$"}, language?: string{pattern="^[\\s\\S]{1,200}$"}, inline?: boolean, copy?: boolean, highlight?: boolean, showLanguage?: boolean}) — Literal code with bundled syntax highlighting, a visible language label and one-click copy.
CodeView(data: {value: string{pattern="^[\\s\\S]{0,12000}$"}, language?: string{pattern="^[\\s\\S]{1,200}$"}, inline?: boolean, copy?: boolean, highlight?: boolean, showLanguage?: boolean}) — Compatibility alias for the foundation Code component.

### base/text
Text(content: string{maxLength=20000}, tone?: "default" | "muted" | "info" | "success" | "warning" | "error", align?: "start" | "center" | "end", size?: "xs" | "sm" | "md" | "lg", weight?: "regular" | "medium" | "semibold") — Plain text with semantic tone and finite typography tokens. HTML is displayed literally.
Heading(content: string{minLength=1,maxLength=512}, level?: integer[1,6]) — Semantic heading.
Badge(label: string{minLength=1,maxLength=512}, tone?: "default" | "muted" | "info" | "success" | "warning" | "error") — Compact supplied status label.
Divider() — Thematic separator.
Alert(title: string{minLength=1,maxLength=512}, description: string{maxLength=20000}, tone?: "default" | "muted" | "info" | "success" | "warning" | "error") — Supplied notice with visible title and explanation.
Table(columns: {key: string{maxLength=64,pattern="^[A-Za-z][A-Za-z0-9_]*$"}, label: string{minLength=1,maxLength=512}}[]{minItems=1,maxItems=32}, rows: ({[key: string]: string{maxLength=2048} | number | boolean | null})[]{maxItems=1000}, caption?: string{minLength=1,maxLength=512}) — Supplied scalar data table. Row keys must be declared column keys; use @Each to project business records before rendering.

### base/controls
Button(label: string{minLength=1,maxLength=512}, onPress: ActionExpression, variant?: "primary" | "secondary" | "ghost", disabled?: boolean) — Explicit local state action button.
Input(label: string{minLength=1,maxLength=512}, value: $binding<string{maxLength=4096}>, placeholder?: string{maxLength=512}, disabled?: boolean) — Labeled single-line text input bound to local state.
Textarea(label: string{minLength=1,maxLength=512}, value: $binding<string{maxLength=20000}>, rows?: integer[2,20], placeholder?: string{maxLength=512}, disabled?: boolean) — Labeled multiline text input.
Select(label: string{minLength=1,maxLength=512}, value: $binding<string{minLength=1,maxLength=512}>, options: {label: string{minLength=1,maxLength=512}, value: string{minLength=1,maxLength=512}}[]{minItems=1,maxItems=128}, disabled?: boolean) — Labeled single selection from supplied options.
RadioGroup(label: string{minLength=1,maxLength=512}, value: $binding<string{minLength=1,maxLength=512}>, options: {label: string{minLength=1,maxLength=512}, value: string{minLength=1,maxLength=512}}[]{minItems=1,maxItems=128}, disabled?: boolean) — Visible single-choice radio options.
Checkbox(label: string{minLength=1,maxLength=512}, checked: $binding<boolean>, disabled?: boolean) — Labeled boolean checkbox.
Switch(label: string{minLength=1,maxLength=512}, checked: $binding<boolean>, disabled?: boolean) — Labeled local on/off switch.
Slider(label: string{minLength=1,maxLength=512}, value: $binding<number[-1e100,1e100]>, min: number[-1e100,1e100], max: number[-1e100,1e100], step?: number(0,∞), disabled?: boolean) — Bounded numeric local slider.

### base/icon
Icon(name: IconName (exact bundled catalog), label?: string{minLength=1,maxLength=512} | null, tone?: "default" | "muted" | "info" | "success" | "warning" | "error", size?: 16 | 20 | 24 | 32 | 48) — A bundled official SVG icon with semantic tone and a fixed optical size.

### base/layout
Stack(children: Component[]{minItems=0,maxItems=128}, gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl") — Vertical flow of components.
Row(children: Component[]{minItems=0,maxItems=128}, gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl", align?: "start" | "center" | "end" | "stretch", options?: {wrap?: "wrap" | "nowrap", distribution?: "natural" | "equal", justify?: "start" | "center" | "end" | "between"}) — Horizontal flow with explicit wrapping and distribution.
Grid(children: Component[]{minItems=0,maxItems=128}, columns?: integer[1,8], gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl", responsive?: "stack" | "preserve") — Equal-column grid with explicit narrow-layout behavior.
Card(children: Component[]{minItems=0,maxItems=128}, title?: string{minLength=1,maxLength=512}) — Grouped surface with optional title.
Box(children: Component[]{minItems=0,maxItems=128}, options?: {background?: "transparent" | "surface" | "info" | "success" | "warning" | "error", padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl", gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl", radius?: "none" | "sm" | "md" | "lg", width?: "auto" | "full" | "grow" | "xs" | "sm" | "md", minHeight?: "none" | "sm" | "md" | "lg"}) — Generic token-based surface and sizing container.

### base/media
Image(src: string{minLength=1,maxLength=1000000}, alt: string{maxLength=2048}, caption?: string{minLength=1,maxLength=512}) — Image subject to the host media policy.
Video(src: string{maxLength=500000,pattern="^(?:data:video\\/(?:mp4|webm|ogg);base64,[A-Za-z0-9+/=]+|https:\\/\\/[^\\s]+)$"}, title: string{minLength=1,maxLength=512}, poster?: string{maxLength=500000,pattern="^(?:data:image\\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+|https:\\/\\/[^\\s]+)$"}, captions?: {src: string{maxLength=12000,pattern="^(?:data:text\\/vtt(?:;charset=utf-8)?(?:;base64)?,[^\\r\\n]*|https:\\/\\/[^\\s]+)$"}, label: string{minLength=1,maxLength=512}, language: string{pattern="^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$"}}[]{maxItems=8}) — Native video with real browser controls and optional captions. Embedded media works offline; remote media requires an explicit host policy.

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
- Read signatures together with all schema and runtime relationship rules: integer requires a whole number; [a,b] includes both bounds, (a,b) excludes them; minItems/maxItems count array entries; ? means the field may be omitted, not that null is accepted. null is allowed only when explicitly listed. Runtime string minLength/maxLength use UTF-16 code units (an emoji may count as 2), which can differ from standard JSON Schema Unicode-code-point counting; final validation uses Inform runtime. {default=...} records an annotated default; the runtime determines its application. A tuple lists positional item types; allowed rest items are shown. Undeclared keys are rejected by strict objects. Catalog-backed enums must match their named catalog. Constraints on an untyped schema apply only to the relevant value kind; do not infer a narrower type.
- The positional parameter order is an ABI. Never emit named arguments, unknown props, callback functions, raw HTML, arbitrary CSS, imports, Query, Mutation, @Run, @OpenUrl or @ToAssistant.
- All mutable variables must be explicitly declared. Use direct declared $variables for ordinary writable bindings. $value is reserved for assignment-binding input; it is not standalone state. Arbitrary callbacks or JavaScript functions are forbidden.
- Only @Set, @Reset and Action([...]) are local action syntax. Actions have no authority to call external services.
- Output must be complete. Partial streaming is preview-only. Invalid values or unknown components reject the document, rather than silently dropping content.
- Numbers are finite. Division and remainder by zero are errors. Do not depend on implicit numeric coercion or unsafe object keys.
- Inform semantics: == and != compare scalar values strictly; logical operators require booleans. Sort uses deterministic lexicographic string order and rejects mixed number/string keys. Filter relational operators require numbers. @Each uses an inline template with a named item, no index parameter or JavaScript lambda.
- Display supplied facts accurately. Domain modules do not fetch, verify or transact on data.
- Icon.name must match an exact name from the bundled searchable icon catalog. Search the catalog by purpose and include only the names needed for this answer; the runtime still validates its full enum.
- base/charts shared usage: Renders the MIT OpenUI React/D3 implementation pinned at cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7. Supplied data only; no services, callbacks, downloads or telemetry. Empty input produces an explicit empty state; all-zero input remains zero. A keyboard-operable data table provides every original value. Theme colors inherit Inform tokens, including portaled tooltips. Animation defaults off and respects reduced motion.
- AreaChart usage: Null values are rejected; signed values retain the upstream zero baseline.
- BarChart usage: Negative, positive and zero values are supported. Options.orientation selects horizontal layout.
- HorizontalBarChart usage: This is the BarChart horizontal variant, not an additional source chart family.
- LineChart usage: Null is rejected instead of silently changing a missing measurement to zero.
- HeatmapChart usage: Series correspond to rows and labels to columns. Null cells retain missing-value semantics. Use rampMode="diverging" for signed values.
- RadarChart usage: Non-negative values only. Null is rejected. Labels identify radial axes.
- PieChart usage: Non-negative slices; no fabricated equal wedges when the sum is zero.
- RadialChart usage: Non-negative magnitudes; empty and zero-total inputs are explicitly identified.
- FunnelChart usage: Stage order is supplied order. Percentages are relative to the first stage, not the sum. Non-negative values; no forced monotonic reordering. When the first stage is zero but later stages are positive, set showPercentage:false because retention is undefined.
- SegmentedBar usage: Non-negative magnitudes. SingleStackedBar is an upstream alias and does not count as a separate chart family.
- SingleStackedBar usage: Non-negative magnitudes. SingleStackedBar is an upstream alias and does not count as a separate chart family.
- ScatterChart usage: Each ScatterSeries(name, points) contains Point(x,y) data, not UI children.
- CalendarHeatmap usage: Use CalendarDay("YYYY-MM-DD",value). Dates are calendar days, duplicates sum, absent days are zero. Real dates, ascending thresholds and a maximum 732-day range are validated.
- MiniAreaChart usage: Mini charts are intentionally square (100–320 px) and use the most recent values that fit, as upstream. The expandable data table always retains all original input values; no data is deleted.
- MiniBarChart usage: Mini charts are intentionally square (100–320 px) and use the most recent values that fit, as upstream. The expandable data table always retains all original input values; no data is deleted.
- MiniLineChart usage: Mini charts are intentionally square (100–320 px) and use the most recent values that fit, as upstream. The expandable data table always retains all original input values; no data is deleted.
- base/code shared usage: Code(data) is a foundation component in base/code. value is required (at most 12000 Unicode code points). Optional language selects a bundled highlight.js grammar; missing/unknown languages stay plain text. No auto-detection or execution. Block defaults: highlight=true, copy=true, showLanguage=true. The fallback label is Plain text. Set each option false to opt out. inline=true stays text-only and rejects true for copy, highlight or showLanguage.
- Code usage: CodeView(data) is a compatible alias.
- CodeView usage: CodeView(data) is a compatible alias.
- Text usage: Use for prose or labels. Newlines remain text; markup and code are not executed. Optional align: start, center, end. Size: xs=12, sm=14, md=16, lg=18 CSS pixels. Weight: regular=400, medium=500, semibold=600. Omitted typography inherits its context. Existing content and tone positions are unchanged.
- Heading usage: Use headings in a meaningful outline. Level defaults to 2 in the renderer.
- Badge usage: A badge displays a supplied label; tone does not independently verify status. info, success, warning, and error use theme-aware soft surfaces with readable text. Pair status color with words; never use color alone.
- Divider usage: Use sparingly between sections. It has no text or interaction.
- Alert usage: Passive notice. It does not trigger a notification service or infer urgency. Tones info, success, warning, and error use semantic soft surfaces. Keep a visible title and description so meaning does not depend on color.
- Table usage: Columns have unique keys. Rows may omit a column, but may not introduce undeclared columns. Cells are plain scalar data.
- Button usage: onPress is a runtime-issued local action. Use @Set, @Reset or Action; literal action-like objects are forbidden.
- Input usage: Pass a direct declared $variable to value to allow edits. Literal values render read-only. Draft text is not committed when validation fails.
- Textarea usage: Writable through a direct declared $variable; an invalid transaction must preserve the previous committed value.
- Select usage: Options have unique values. Current value must match one option.
- RadioGroup usage: Uses the same single-choice state contract as Select, with native labeled radios.
- Checkbox usage: Pass a direct declared boolean $variable to checked for local edits.
- Switch usage: A boolean local switch. It never changes external account or app settings.
- Slider usage: Requires finite min < max and value inside the range. Step is positive and cannot exceed the range.
- Icon usage: Only exact bundled canonical names are accepted. Arguments: name, label, tone, size. Use null label for a decorative icon beside visible text. Use a nonempty label for an icon that conveys meaning alone. Tones: default, muted, info, success, warning, error. Sizes: 16, 20, 24, 32, 48; default 20. Tone communicates supplied meaning; it never verifies status. Public OpenAI Apps SDK UI glyphs are distinct from Inform UI role mapping.
- Stack usage: Children belong to the selected profile. Gap is a finite design token; there is no arbitrary CSS.
- Row usage: Defaults remain wrapping, natural child widths, centered cross-axis alignment and start justification. Optional options: wrap=nowrap keeps one row; distribution=equal gives each child an equal share; justify=between separates edge labels. Children can shrink and text can wrap within a child. Use Grid preserve for a fixed count of tracks. No arbitrary CSS.
- Grid usage: Columns: 1 through 8, default 2. Default responsive=stack preserves the existing behavior: one column when the root container is 480 CSS pixels or narrower. responsive=preserve retains the requested equal tracks on narrow screens. Use short labels and small gaps for dense tracks; it does not shrink fonts or crop content.
- Card usage: Use a card for one coherent section. Card owns its child slot, not external services.
- Box usage: Box(children, options?) is a vertical flow, not an algorithm-specific component. Defaults: transparent background, no padding, md gap, no radius, auto width, no minimum height. background: transparent, surface, info, success, warning, error; semantic backgrounds use paired theme-aware text colors. padding/gap: none, xs, sm, md, lg, xl (0,4,8,12,16,24px). radius: none=0, sm=6, md=10, lg=16px. width: auto, full, grow (remaining Row space), xs=48, sm=64, md=96px; fixed tokens do not grow or shrink in a Row. minHeight: none=0, sm=24, md=32, lg=48px; content can grow taller. Nested Box can set a different surface. No arbitrary colors, CSS, HTML, selectors or URLs.
- Image usage: Alt text is required; empty alt is for decoration. The default renderer must not fetch a remote image without a host media allowlist.
- Video usage: Video(src,title,poster?,captions?) uses a native video element. No autoplay, third-party iframe, tracking or service dependency. Playback codecs depend on the browser. Supply captions for speech and describe silent visual media.
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
- Code: Copy requires trusted user activation in a secure browser context; denied/unavailable Clipboard API reports a manual-copy fallback.
- Code: Only bundled grammars are supported; highlighting is not syntax validation.
- CodeView: Copy requires trusted user activation in a secure browser context; denied/unavailable Clipboard API reports a manual-copy fallback.
- CodeView: Only bundled grammars are supported; highlighting is not syntax validation.
- Button: No host tools, navigation, account access or message sending.
- Icon: No remote SVG or arbitrary path data.
- Image: HTTPS is syntactically allowed but remains blocked until the host media policy explicitly permits it. SVG data URLs are rejected.
- ## Schema relationship constraints

These compact JSON clauses use JSON Schema semantics in addition to the signatures; sibling constraints also apply. oneOf means exactly one branch; anyOf means at least one; allOf means every branch. Optional properties may be absent, including inside conditions. default is a schema annotation; its application is determined by the runtime contract. x-inform-runtime-rules are additional checks enforced by Inform runtime, not by an ordinary JSON Schema validator.

- AreaChart [runtime rule chart-series-relations]: Series names must be unique and cannot be __if_label__, __proto__, constructor or prototype. Each values array must have exactly labels.length entries. Null is rejected; use finite numbers. Signed values are allowed.
- BarChart [runtime rule chart-series-relations]: Series names must be unique and cannot be __if_label__, __proto__, constructor or prototype. Each values array must have exactly labels.length entries. Null is rejected; use finite numbers. Signed values are allowed.
- HorizontalBarChart [runtime rule chart-series-relations]: Series names must be unique and cannot be __if_label__, __proto__, constructor or prototype. Each values array must have exactly labels.length entries. Null is rejected; use finite numbers. Signed values are allowed.
- LineChart [runtime rule chart-series-relations]: Series names must be unique and cannot be __if_label__, __proto__, constructor or prototype. Each values array must have exactly labels.length entries. Null is rejected; use finite numbers. Signed values are allowed.
- HeatmapChart [runtime rule chart-series-relations]: Series names must be unique and cannot be __if_label__, __proto__, constructor or prototype. Each values array must have exactly labels.length entries. Null is allowed for missing cells. Signed values are allowed.
- RadarChart [runtime rule chart-series-relations]: Series names must be unique and cannot be __if_label__, __proto__, constructor or prototype. Each values array must have exactly labels.length entries. Null is rejected; use finite numbers. Values must be non-negative.
- PieChart [runtime rule slice-labels]: Slice or funnel-stage labels must be unique.
- RadialChart [runtime rule slice-labels]: Slice or funnel-stage labels must be unique.
- FunnelChart [runtime rule slice-labels]: Slice or funnel-stage labels must be unique.
- FunnelChart [runtime rule funnel-zero-baseline]: If the first stage is zero and any later stage is positive, options.showPercentage must be false; otherwise retention percentages have no valid baseline.
- SegmentedBar [runtime rule slice-labels]: Slice or funnel-stage labels must be unique.
- SingleStackedBar [runtime rule slice-labels]: Slice or funnel-stage labels must be unique.
- ScatterChart [runtime rule scatter-dataset-names]: Dataset names must be unique.
- CalendarHeatmap [runtime rule calendar-order-and-span]: Thresholds must be strictly increasing. Explicit or data-derived date ranges must be ascending and contain at most 732 days inclusive.
- Code [runtime rule inline-code-controls]: inline=true rejects copy=true, highlight=true or showLanguage=true; omitted options remain valid inline.
- CodeView [runtime rule inline-code-controls]: inline=true rejects copy=true, highlight=true or showLanguage=true; omitted options remain valid inline.
- Table [runtime rule table-column-membership]: Column keys must be unique. Row keys must name declared columns; rows may omit a declared column.
- Table.rows[]: {"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"anyOf":[{"type":"string","maxLength":2048},{"type":"number"},{"type":"boolean"},{"type":"null"}]}}
- Select [runtime rule selection-membership]: Option values must be unique. The current value must equal one supplied option value.
- RadioGroup [runtime rule selection-membership]: Option values must be unique. The current value must equal one supplied option value.
- Slider [runtime rule slider-range]: min < max; min <= value <= max; 0 < step <= max-min. If step is omitted the runtime uses 1.
- Image [runtime rule raster-image-source]: src must be a bounded PNG/JPEG/WebP/GIF base64 data URL or HTTPS URL with no whitespace. SVG data URLs are rejected. HTTPS still requires host approval to fetch.
- CalendarDay.date [runtime rule real-calendar-day]: Use a real Gregorian calendar day YYYY-MM-DD, year 0100–9999; a matching date pattern alone is insufficient.
- Data constructors (not renderers):
Series(name: string{maxLength=240}, values: (number[-1e15,1e15] | null)[]{maxItems=256}): Named finite series; null is supported only by HeatmapChart as a missing cell.
Slice(label: string{maxLength=240}, value: number[0,1e15]): Named non-negative magnitude for pie, radial, funnel or segmented charts.
Point(x: number[-1e15,1e15], y: number[-1e15,1e15]): A finite scatter coordinate. Negative and zero values are supported.
ScatterSeries(name: string{maxLength=240}, points: {x: number[-1e15,1e15], y: number[-1e15,1e15]}[]{maxItems=512}): Named scatter dataset containing finite Point values.
CalendarDay(date: string{pattern="^\\d{4}-\\d{2}-\\d{2}$"}, value: number[0,1e15]): ISO calendar day and non-negative magnitude. Duplicate dates are summed by the upstream calendar.
CodeData(value: string{pattern="^[\\s\\S]{0,12000}$"}, language?: string{pattern="^[\\s\\S]{1,200}$"}, inline?: boolean, copy?: boolean, highlight?: boolean, showLanguage?: boolean): Literal source text and optional foundation code display settings.

## 可直接改写的最小 HTML

下面示例是完整有效程序，用于说明 DSL 与 HTML 壳的连接，不是回答结构模板，也不要求复用其中的图表、控件或其他组件。保留它的 select/viewNames/加载与报错处理，再按当前问题重新组织 source。

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
<script id="inform-config" type="application/json">{"source":"$minimum = 60\nrows = [{name:\"读书会\",score:91},{name:\"写作课\",score:76},{name:\"分享会\",score:67},{name:\"讨论班\",score:54}]\nvisible = @Sort(@Filter(rows,\"score\",\">=\",$minimum),\"score\",\"desc\")\nroot = Stack([\n Heading(\"让图表、表格和解释一起更新\",1),\n Text(\"这组原创示例中，读书会反馈分最高，为 91 分。调整最低分，可以观察候选活动怎样变化；图表和表格始终使用同一份筛选结果。\",\"muted\"),\n Card([Slider(\"最低反馈分\",$minimum,0,100,1),Button(\"恢复 60 分\",@Reset($minimum),\"secondary\")],\"试着筛选\"),\n Text(\"达到阈值：\"+@Count(visible)+\" 场活动\"),\n @Count(visible)>0 ? Stack([\n  Text(\"候选活动的等权平均反馈分：\"+@Round(@Avg(visible.score),1)+\" 分。\"),\n  BarChart(\"候选活动反馈分\",visible.name,[Series(\"反馈分\",visible.score)],{height:280,animate:false}),\n  Table([{key:\"name\",label:\"活动\"},{key:\"score\",label:\"反馈分\"}],visible,\"与图表相同的数据\")\n ],\"lg\") : Alert(\"当前没有匹配结果\",\"把最低分调到 91 或以下，或使用恢复按钮。\",\"warning\"),\n Text(\"反馈分不能单独决定活动是否适合你。还要核对主题、时间与费用。这里没有提供这些资料，所有活动与分数都是演示数据。\"),\n Code({value:\"const passing = rows.filter(row => row.score >= minimum);\\nconst ranked = passing.toSorted((a, b) => b.score - a.score);\",language:\"javascript\"}),\n Text(\"来源：本例原创四行数据。筛选按 score ≥ 最低分；平均分按活动等权计算。\",\"muted\")\n],\"xl\")\n","select":["base/layout","base/text","base/controls","base/icon","base/media","base/code","base/charts"],"viewNames":[],"theme":"light"}</script>
<script src="https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js"></script>
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
