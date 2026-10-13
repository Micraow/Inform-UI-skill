# Inform 互动答案 Skill

面向 Agent 和 Web Chat AI，用 Inform DSL 与 browser JS 生成完整、可阅读、可交互的 HTML 答案。文字、图表、媒体和本地控件共同解释问题；无需创建 React 工程。

根目录 [SKILL.md](./SKILL.md) 是通用入口，默认使用精简的基础与图表合同。它既能直接交给聊天模型，也能供具备文件和工具能力的 Agent 使用；默认 HTML 引用 latest，不写死版本号。

## Agent：按需发现、组合与验证

- 从 [模块目录](./references/catalog.md) 找相关能力，再读取对应 generated/modules/*.txt 或 generated/views/&lt;ViewName&gt;.txt。完整库保留 233 个 UI、195 个领域 View 与 755 个 glyph，按需求加载，不必一次全部读取。Data 构造器不计入 UI。
- 现有 CLI 入口 [scripts/inform-answer.mjs](./scripts/inform-answer.mjs) 提供 catalog、prompt、icons、check、build；[语法边界](./references/dialect.md)、[交付边界](./references/delivery.md) 和 [完整示例](./examples/) 继续保留。
- 用 createProfile({select,viewNames}) 或 CLI prompt 生成需要的合同，再用相同选择检查和构建。需要扩展时替换成匹配的 profile，不把未选组件混入默认合同。

```sh
node scripts/inform-answer.mjs catalog
node scripts/inform-answer.mjs icons --query chart --limit 8
node scripts/inform-answer.mjs prompt --select base/layout,base/text,views/content --views MetricView,CodeView --out prompt.txt
node scripts/inform-answer.mjs check answer.openui --select base/layout,base/text,views/content --views MetricView,CodeView
node scripts/inform-answer.mjs build answer.openui --out answer.html --select base/layout,base/text,views/content --views MetricView,CodeView --runtime-url https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@web-chat-latest/cdn/next/inform-ui.global.js
```

CLI 使用仓库自带的 Node runtime 做开发验证；随包快照可用于明确的离线/调试场景。它不要求安装 React 或运行时依赖。按需 prompt 和静态目录是开发辅助，不表示宿主查询、支付或发送服务自动可用。

## Web Chat：只交给模型一份文件

- [基础与图表](./profiles/web-chat-core/SKILL.md)：37 个 UI，适合比较、数据探索、预算选择与普通图文解释；也可继续使用根通用入口。
- [精选十个内容视图](./profiles/curated-web-chat/SKILL.md)：47 个 UI，在相同基础上加入 MetricView、FigureView、SectionView、StepsView、MathView、DetailsView、CitationView、CodeView、BlockquoteView、ChecklistView。

这两份轻量 profile 是项目的使用子入口，不替代 Agent 的完整模块发现能力。Web Chat 路线无需让模型运行 CLI 或读取全部组件；选一份文件，再提出问题即可。

当前基础版为 37 个 UI，精选版为 47 个 UI；数据构造器不计入 UI。通用对比使用已有 Table/Grid/MetricView，过程使用 StepsView；当前合同没有 ComparisonView 或 TimelineView，不借用金融专用比较组件冒充通用组件。

不要把两个 Skill 或全量组件目录一起塞给模型。精确组件数量、数据类型数量、runtime URL 见 [BUILD.json](./BUILD.json)。其中 UI commit 和内容 SHA-256 只记录开发验证时的快照，方便复现；它们不锁定用户 HTML 的运行版本。

## 直接试用

- [基础与图表 HTML](./profiles/web-chat-core/minimal.html)
- [精选内容视图 HTML](./profiles/curated-web-chat/minimal.html)

保存对应 HTML 后用浏览器打开。HTML 通过可更新的 latest HTTPS 入口加载运行库，需要联网；CDN 与浏览器缓存可能延后看到更新，不保证每次打开立即取得最新字节。浏览器或聊天预览器必须允许脚本运行。若预览器禁用脚本，请下载后用普通浏览器打开。页面会明确显示加载或渲染错误。

已验证的滚动入口是 https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@web-chat-latest/cdn/next/inform-ui.global.js 。web-chat-latest 是项目维护的发布分支，不是具体版本号；不要自行改成 jsDelivr 的保留选择器 @latest。此次实测响应的 Cache-Control 为 public,max-age=604800,s-maxage=43200，即浏览器缓存可达 7 天、共享缓存可达 12 小时；这不是即时更新保证。

每个 profile 目录都包含由同一配置自动生成的 prompt.txt、schema.json、manifest.json、profile.json、minimal.openui 与 minimal.html。模型只需读取对应的一份 Skill；其他文件供审阅、验证或程序化集成使用。

## 边界

- 精简的是模型上下文和 profile 可用集合；browser JS 仍使用完整 bundle，不能称为按模块缩小下载。
- 只执行给定数据的本地交互。不会自动查询、发送、预订或付款，也不继承旧 iui1 JSON 输入。
- 这是严格 OpenUI 派生方言，没有完整上游 runtime 等价保证，也没有未经测量的 token 节省承诺。
- HTML 的固定初始化包含内联脚本和样式；严格 CSP 的站点需另行配置 nonce/hash。
- 生成和 Node 检查不等于浏览器验收。实际检查状态记在 DELIVERY.json。

## 维护者

source/profiles.json 是唯一选库配置。scripts/generate-web-chat.mjs 从对应版本的真实 runtime API 生成所有模型合同与 HTML；scripts/verify-web-chat.mjs 用同一 runtime 复核。发布新 UI 版本时应一起再生成并验证，不能仅手改 CDN URL。普通使用者与模型不需要运行这些脚本。

scripts/prompt-projection.mjs 只修正已验 runtime prompt 中两处说明文字：声明从新行开始但表达式可跨行，以及 root 不必在首行。组件签名、示例、名称和 schema 不变；原文变化时生成会停止并要求复核。

代码遵循 MIT；外部 browser bundle 保留其发布包中的第三方许可。
