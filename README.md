# Inform：直接给 Web Chat 的互动答案 Skill

默认使用根目录 [SKILL.md](./SKILL.md)。把这个文件完整交给模型，再提出你的问题；模型即可输出一份引用固定版本 Inform browser JS 的完整 HTML。

无需让模型操作终端、运行 CLI、安装 npm/React，或读取全部领域组件。

## 选一份即可

- 默认基础 + 图表：[SKILL.md](./SKILL.md)。适合比较、数据探索、预算选择与普通图文解释。没有领域 View。
- 精选十个内容视图：[curated-web-chat/SKILL.md](./profiles/curated-web-chat/SKILL.md)。在相同基础上加入 MetricView、FigureView、SectionView、StepsView、MathView、DetailsView、CitationView、CodeView、BlockquoteView、ChecklistView，用于指标、图注、分节、步骤、公式、折叠说明、来源、代码、引文和核对清单。

当前基础版为 37 个 UI，精选版为 47 个 UI；数据构造器不计入 UI。通用对比使用已有 Table/Grid/MetricView，过程使用 StepsView；当前合同没有 ComparisonView 或 TimelineView，不借用金融专用比较组件冒充通用组件。

不要把两个 Skill 或全量组件目录一起塞给模型。精确组件数量、数据类型数量、固定 UI commit、runtime URL 和 SHA-256 见 [BUILD.json](./BUILD.json)。

## 直接试用

- [基础与图表 HTML](./profiles/web-chat-core/minimal.html)
- [精选内容视图 HTML](./profiles/curated-web-chat/minimal.html)

保存对应 HTML 后用浏览器打开。HTML 通过固定 HTTPS URL 加载运行库，需要联网；浏览器或聊天预览器必须允许脚本运行。若预览器禁用脚本，请下载后用普通浏览器打开。页面会明确显示加载或渲染错误。

每个 profile 目录都包含由同一配置自动生成的 prompt.txt、schema.json、manifest.json、profile.json、minimal.openui 与 minimal.html。模型只需读取对应的一份 Skill；其他文件供审阅、验证或程序化集成使用。

## 边界

- 精简的是模型上下文和 profile 可用集合；browser JS 仍使用完整 bundle，不能称为按模块缩小下载。
- 只执行给定数据的本地交互。不会自动查询、发送、预订或付款，也不继承旧 iui1 JSON 输入。
- 这是严格 OpenUI 派生方言，没有完整上游 runtime 等价保证，也没有未经测量的 token 节省承诺。
- HTML 的固定初始化包含内联脚本和样式；严格 CSP 的站点需另行配置 nonce/hash。
- 生成和 Node 检查不等于浏览器验收。实际检查状态记在 DELIVERY.json。

## 维护者

source/profiles.json 是唯一选库配置。scripts/generate-web-chat.mjs 从对应版本的真实 runtime API 生成所有模型合同与 HTML；scripts/verify-web-chat.mjs 用同一 runtime 复核。发布新 UI 版本时应一起再生成并验证，不能仅手改 CDN URL。普通使用者与模型不需要运行这些脚本。

scripts/prompt-projection.mjs 只修正固定 runtime prompt 中两处说明文字：声明从新行开始但表达式可跨行，以及 root 不必在首行。组件签名、示例、名称和 schema 不变；原文变化时生成会停止并要求复核。

代码遵循 MIT；外部 browser bundle 保留其发布包中的第三方许可。
