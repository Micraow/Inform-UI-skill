<div align="center">

# Inform UI Skill

> Pending acceptance：本分支合同与壳固定 26ec211fa529516af3b1523248f5912c45ec64c6，37 项候选等待同版集中 CI 与原图验收。已验53计数、旧版推荐及用户演示不升级。

### 让 AI 把解释写清楚，也把关系画明白。

[![CI](https://github.com/Micraow/Inform-UI-skill/actions/workflows/verify.yml/badge.svg?branch=feat%2Fsemantic-authoring-skill&event=pull_request)](https://github.com/Micraow/Inform-UI-skill/actions/workflows/verify.yml)
![协议 iui/1](https://img.shields.io/badge/schema-iui%2F1-2563eb)
![开发版 0.1.0，尚未发布](https://img.shields.io/badge/status-0.1.0%20preview%20%7C%20unpublished-f59e0b)
[![MIT License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

**清晰的正文 · 自然混排的图表与公式 · 恰到好处的交互**

[快速上手](#快速上手) · [安装技能](#安装技能) · [示例](#从这些例子开始) · [支持范围](references/support.md)

</div>

Inform UI Skill 帮助 AI 判断什么时候值得用图、选什么组件，以及怎样把正文、公式、数据和交互组织成一段好读的解释。网页聊天可以直接交付可打开的 HTML；其中的组件由精简的 `iui/1` JSON 描述，再由 [Inform UI](https://github.com/Micraow/Inform-UI) 校验并生成界面。

整个方案独立于模型厂商：不需要 OpenAI 账号、API 或私有运行时。能读取技能说明的 Agent 都可以使用它。库的 API 中 `portable` 是渲染后端的技术名称；单文件 HTML 和嵌入网页是同一套库的交付方式，无需等待另一种“原生版”。

## 项目身份与第三方权利 / Project identity and third-party rights

1. Inform UI 及本 Skill 是独立、非官方的社区实现。
2. 项目目标是高保真复刻 OpenAI Intelligent UI 的视觉与交互；这是实现目标，不代表所有功能或视觉细节已经完成。
3. 本项目并非由 OpenAI 开发、维护、赞助或认可。
4. 文中 OpenAI、ChatGPT 和 Intelligent UI 等名称仅用于说明参考对象，不暗示官方关联、合作或授权关系。
5. 第三方素材与代码仍受各自的许可证和知识产权约束；本项目许可证不改变这些权利。
6. 以上声明不能替代使用第三方内容时所需的授权。

1. Inform UI and this Skill are independent, unofficial community implementations.
2. The project aims to reproduce the visual design and interactions of OpenAI Intelligent UI with high fidelity. This is a development goal, not a claim that every feature or visual detail is complete.
3. This project is not developed, maintained, sponsored, or endorsed by OpenAI.
4. Names such as OpenAI, ChatGPT, and Intelligent UI are used only to identify the reference, and do not imply an official affiliation, partnership, or authorization.
5. Third-party assets and code remain subject to their respective licenses and intellectual-property rights. This project's license does not alter those rights.
6. These statements do not replace any permission required to use third-party content.

为保持已有文档可运行，技术标识 iui/1、window.IUI、CLI iui 与 CSS .iui-* 不随品牌改名。

旧名称下的 41/46 节点盲测是历史版本记录。其输入、HTML/JSON 首稿、库合同和原始说明保留原字节与旧 CDN 地址，不用品牌迁移改写实验；新入口与示例使用 Inform UI。历史版权署名也予以保留。

Technical identifiers iui/1, window.IUI, the iui CLI, and .iui-* CSS classes remain unchanged so existing documents keep working.

The 41-node and 46-node blind tests are historical records from the project's former name. Their inputs, first HTML/JSON outputs, library contracts, and original notes retain their original bytes and CDN URLs. The rebrand does not rewrite those experiments; current entry points and examples use Inform UI. Historical copyright attribution is retained as well.

## 适合什么时候用？

- **解释技术原理**：让正文、公式、步骤与拓扑图按阅读顺序自然衔接
- **看懂数据变化**：用折线、柱状、散点、面积或环图表达关系，按真实数值/时间摆放坐标，保留单位、来源和缺测值
- **组织本地输入**：用表单、文本/数字/邮箱、多行文本、单选和分段选择完成校验、确认与取消，默认不发送或保存数据
- **说明天气数据**：展示调用方提供的观测/预报，切换日期、单位和图表；没有天气服务也不会冒充实时预报
- **读懂比赛快照**：用已有数据展示赛程、记分牌和积分榜，保留未知比分、并列名次与来源；不冒充直播
- **练习与回忆**：本地单选/多选自测、解释反馈、翻面自评与重来，答案公开且不保存成绩
- **单位与金额试算**：九类单位、绝对温度/温差、调用方提供的汇率快照；明确基准、缺测与费用边界，不执行换汇交易
- **本地时间与按需说明**：固定瞬间/设备时钟、暂停起始的秒表/倒计时，以及纯文本tooltip/非模态popover；不冒充系统闹钟或网络校时
- **呈现进度与来源**：显示调用方提供的精确比例、未知进度和有限占位，以及字面引用/资料卡；不推断任务进展、不搜索或核实来源
- **清楚表达状态**：保序换行flow、10种原创有限icon和显式pulse-indicator；不加载任意图标或自动推断服务状态
- **探索“如果改变……”**：用滑块或选择器改变输入，让相关数值同步更新
- **整理指标和资源**：把关键指标、简短说明与链接放在读者需要的位置

如果一句话就能说清，技能会保留普通文字。模拟数据必须明确标注，真实数据不能凭空补齐。

## 两条入口：常用基础与按需领域

把 [`SKILL.md`](SKILL.md) **全文**交给 Agent 或 Web Chat。根文件保留常用富文本、引用、跨格/流式布局、结构化表格、有限图标/状态、时间与浮层、图表、控件、表单、自测/闪卡、单位换算、受控 SVG、公开 API 与完整 CDN HTML 壳；只使用已内嵌字段即可生成基础页面，无需终端或读取实现。

天气、体育、金融与货币快照等深入领域，先按根文件的用途索引选择组，再读[同版机器索引](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@26ec211fa529516af3b1523248f5912c45ec64c6/cdn/schema/index.json)指向的 Document Schema 和一个同版示例。每个领域文档包默认包含 base；Node 查询片仅供查字段，不能当完整 Document 校验器。跨领域按完整 Schema 或同版 CLI 生成的并集校验，仍需真实 validateDocument 做语义检查。

不能读取外部资料的普通 Web Chat，可额外接收[完整 Web Chat 指南](WEB-CHAT-GUIDE.md)或同版[完整 JSON Schema](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@26ec211fa529516af3b1523248f5912c45ec64c6/cdn/iui.schema.json)。完整版指南保留同版 97 个注册项的用途及保守生成合同；根文件中的领域名字只是发现入口，不能替代尚未读取的字段合同。完整 Schema 是唯一规范来源，分片由它自动生成，不手工维护第二份 Schema。

让模型返回完整 HTML，保存成 `.html` 后用联网浏览器打开。组件、布局和交互由库完成，不必重写 CSS 或控件；聊天气泡能否直接运行脚本取决于宿主。没有取得所需领域资料时，应请求补充资料或留在根文件明确支持的范围，不猜字段。

数学使用库自带的 KaTeX 排版：联网壳通过固定 CDN 的 CSS 按需加载官方 MIT 数学字体，请保留 `styles:false` 和匹配的 CSS。需要完全离线时使用下方本地 inline 构建，它会把数学字体一同内嵌。

## 安装技能（Agent 可选）

当前为 **0.1.0 开发版**，尚未发布 npm 包。先获取已可使用的开发分支：

```sh
git clone --branch feat/semantic-authoring-skill https://github.com/Micraow/Inform-UI-skill.git inform-ui-author
```

将整个 `inform-ui-author/` 文件夹放进你的 Agent 宿主支持的技能目录。具体路径由宿主决定；请保留 `SKILL.md`、`references/`、`examples/` 和其余相对路径。这里只提供技能文件，不会替你更改宿主配置。

没有技能安装能力时，直接使用上面的网页聊天路径即可。需要本地校验或离线构建的 Agent，再使用下面的命令行路径。

## 快速上手

先试着对 Agent 说：

> 使用 inform-ui-author，解释一条网络路径为什么会受最忙的链路限制。给我一个能调整负载的小演示，明确标注教学假设。只使用说明中的 JSON 协议和固定 CDN 壳，返回完整 HTML；不要手写组件 HTML/CSS，也不要假装运行过本地校验。

网页聊天到这里即可生成文档。下面是有终端的 Agent 可选用的本地路径。

第一次在本地构建时，需要 **Git 和 Node.js 22 或 24**。在 `inform-ui-author/` 的上一级目录运行：

```sh
git clone https://github.com/Micraow/Inform-UI.git Inform-UI
git -C Inform-UI checkout --detach 26ec211fa529516af3b1523248f5912c45ec64c6
npm --prefix Inform-UI ci
npm --prefix Inform-UI run build
node Inform-UI/bin/iui.mjs validate inform-ui-author/examples/hpcc-feedback.json --json
node Inform-UI/bin/iui.mjs build inform-ui-author/examples/hpcc-feedback.json --out answer.html --lang zh-CN
```

用浏览器打开 `answer.html`，调整滑块查看反馈。示例展示的是简化的教学模型，所有数值均为合成数据。

以上命令使用固定的核心库提交和真实 CLI。完整版本对应保存在 [`library-contract.json`](library-contract.json)；如果已有本地 checkout，请先确认版本，不要覆盖尚未保存的修改。更多 API、状态计算和排错方法见[使用指南](references/library-workflow.md)。

## 从这些例子开始

| 例子 | 可以学到什么 |
| --- | --- |
| [最小文字回答](examples/minimal.json) | 内容足够简单时，不必添加组件 |
| [瓶颈负载与反馈](examples/hpcc-feedback.json) | 正文、拓扑、滑块、公式与计算结果的混排 |
| [RTT 趋势](examples/rtt-trend.json) | 比较两条曲线，保留缺测数据，并展开查看数值 |
| [Wi-Fi 指标](examples/wifi-status.json) | 用紧凑指标解释含义，区分链路速率与实际吞吐 |
| [本地练习计划](examples/local-practice.json) | 字段校验、禁用、提交/取消与指标、柱图的同一state联动 |
| [已提供的天气数据](examples/supplied-weather.json) | 有来源的数据、日期/单位切换与缺测、空/加载/错误状态 |
| [真实坐标与五图种](examples/coordinate-scenarios.json) | 不等距X、跨年毫秒时间、微量数据与图种边界 |
| [合成比赛快照](examples/supplied-sports.json) | 赛程筛选、记分牌、并列排名、扣分和空/加载/错误状态 |
| [本地自测与闪卡](examples/local-learning.json) | 加权计分、严格多选、翻面自评、回看与重来 |
| [供数行情与相对表现](examples/supplied-finance.json) | 来源/延迟、范围、缺测、同一瞬间的共同基准与不可比状态 |
| [权重与涨跌热图](examples/supplied-heatmap.json) | 正权重面积、色阶饱和、无面积项的键盘/全表与行业筛选 |
| [单位与货币快照](examples/local-converters.json) | 类别与温差、互换/重置、缺汇率/零金额/同币种及完整表 |
| [辅助内容与矢量](examples/auxiliary-surfaces.json) | code/badge/box/轮播、静态SVG、有限 Markdown 子集 |
| [资源短名单](examples/resource-shortlist.json) | 把有用的链接和介绍融入正文 |
| [基础表达增强](examples/foundation-explainer.json) | 富文本、行内代码、引用、跨格网格与结构化表格 |
| [页内时间](examples/local-time.json) | 固定时刻、设备时间、暂停起始的秒表与倒计时 |
| [按需说明](examples/local-overlays.json) | 纯文本tooltip、非模态与嵌套popover、关闭和归焦 |
| [数值草稿](examples/local-number-draft.json) | 用户无效数字草稿、权威宿主覆盖、提交和取消 |
| [限时本地练习](examples/timed-local-practice.json) | base/forms/charts/time跨域组合与独立计时生命周期 |
| [本地状态基元](examples/local-status-primitives.json) | 保序换行、有限图标和显式状态的语义边界 |
| [基础布局组合](examples/primitives-with-form-and-time.json) | flow中的表单、倒计时和浮层仍保留各自领域与状态 |
| [手动比例与未知进度](examples/loading-numeric-progress.json) | 合成比例的精确数值、0与未知的区别 |
| [有限占位形状](examples/loading-placeholder-shapes.json) | 可读标签、三种有界结构和减少动态效果 |
| [手动进度与来源](examples/supplied-source-reading.json) | form驱动loading，来源卡不自动标记已读或核实证据 |

这些示例全部为原创。请一起修改数据与解释；示例数字不是用户的真实测量结果。

## 两个仓库怎样配合？

| 仓库 | 负责什么 |
| --- | --- |
| **[Inform UI Skill](https://github.com/Micraow/Inform-UI-skill)** | 教 Agent 选择内容、组织阅读顺序、输出 JSON，并检查质量 |
| **[Inform-UI](https://github.com/Micraow/Inform-UI)** | 定义协议、验证输入，确定性生成 HTML，处理样式、响应式和交互 |

技能不要求 AI 为每次回答重新写 HTML、CSS 或 JavaScript。字体、间距、主题与移动端布局交给库处理。

本待验分支固定协议有97项注册：96个portable节点和native拒绝说明。根技能保留常用合同及全领域选型/发现路径；完整指南可一次提供全部保守合同，按需Schema由核心单一规范自动生成。天气与体育视图使用调用方提供的数据；测验与闪卡使用作者提供的答案，仅处理本轮学习流程。金融支持供数行情、历史、同基准比较与权重热图；不抓取行情、不自动换汇、不交易，详见[供数合同与验证记录](references/finance.md)。实时地图或外部提交服务需要自己的数据与授权；任意脚本应用不在本技能的输入范围内。详见[组件与能力说明](references/support.md)。

## 运行检查

在技能目录中执行：

```sh
npm test
npm run check:library -- --library ../Inform-UI
npm run check:schema -- --library ../Inform-UI
npm run check:inventory -- --library ../Inform-UI
npm run check:components -- --library ../Inform-UI
npm run check:primitives -- --library ../Inform-UI
npm run check:next66 -- --library ../Inform-UI --revision 26ec211fa529516af3b1523248f5912c45ec64c6
```

这些命令检查技能结构与文件边界、真实库API/CLI与全部示例、自动分片的引用闭包/哈希/完整归属/同版示例、派生库存、根文档JSON字面例及新增组件正反例。可选的[浏览器检查](references/library-workflow.md#browser-regression)还会操作滑块，并检查桌面与 390 px 布局。

以下是 d370 的既有验收历史，不属于本待验 5c7f 分支的新结果。

[持续验证](https://github.com/Micraow/Inform-UI-skill/actions/workflows/verify.yml)保留Linux Node22/24、Windows/macOS Node22的实际API/CLI与Schema检查。66节点指导已在本地通过24全例、29根/完整指南字面JSON、53个后批新增反例及派生闭合检查；本轮核心338项Node、241项Chromium与42旧＋18新消费者已通过[集中CI](https://github.com/Micraow/Inform-UI/actions/runs/37898154911)。本次[Skill独立入口CI](https://github.com/Micraow/Inform-UI-skill/actions/runs/37899000574)四平台全部通过，当前100视图中68次加载真实固定CDN、32次内嵌构建；实际复看3新例的窄暗/宽亮及2张入口壳共8图，没有观察到阻塞性溢出或裁切。历史盲测、[已验62阶段](references/schema-discovery-62-history.md)和[6797阶段](references/schema-discovery-6797-history.md)保留原pin、输入与范围，当前结论见[验收记录](references/schema-discovery.md)。

按需入口、单根范围、Schema 边界与本轮完整验证见[发现与验收记录](references/schema-discovery.md)。纯文档检查点可只跑轻检查，完整功能结果明确绑定到已验提交，不把跳过当通过。

## 许可证

采用 [MIT License](LICENSE)。欢迎提交原创示例与改进；引用第三方内容时，请保留清楚的来源和兼容许可。

## Current pending 37 preparation

The 26ec211 asset adds supplied flight options, artist events, asset distributions, transaction lists, local onboarding selection, shipment snapshots and flight snapshots. These are seven original candidate contracts using five unique synthetic examples; no live services, provider accounts or persistence are implied. The separate [37-input lock](candidates/pending-batch/library-candidate-lock37.json) binds the current immutable source. [Prior 30 preparation](candidates/pending-batch/library-candidate-lock.json) remains historical and is reproducible only with its exact earlier Skill checkout. Full schema is the sole specification; base/domain bundles and inventory are generated from it. Accepted canonical count stays 53 until real combined acceptance.
