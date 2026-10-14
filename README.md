<div align="center">

# Inform UI Skill

**让 AI 答案变成可阅读、可探索的页面。**

文字、图表与本地交互，一份 HTML 即可交付。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent-Skill-111111.svg)](SKILL.md)
[![JavaScript / TypeScript](https://img.shields.io/badge/JavaScript%20%2F%20TypeScript-provider--neutral-3178c6.svg)](examples/agent-integration/)

[快速开始](#-快速开始) · [示例](#-示例) · [组件目录](references/catalog.md) · [Inform UI](https://github.com/Micraow/Inform-UI)

</div>

[![Inform UI 原有 gallery 的组件组合截图：日程、选项、步骤和本地交互](https://raw.githubusercontent.com/Micraow/Inform-UI/main/docs/assets/gallery-compose.png)](https://github.com/Micraow/Inform-UI)

<p align="center"><sub>Inform UI 原有 gallery 的真实运行截图，使用虚构数据；展示组件风格。当前 Skill 的 DSL 示例见下方。</sub></p>

## ✨ 特性

- **完整答案**：把解释、数据、图表和控件放进同一页面。
- **按需组合**：基础版 39 个 UI 构造器，精选版 48 个；Agent 可按模块发现与加载。
- **基础代码组件**：`Code` 默认带语言名称、highlight.js 高亮和一键复制，三项都可单独关闭。
- **一份文件起步**：Web Chat 读取 Skill 后直接生成 HTML，无需 React 工程。
- **供应商无关**：JavaScript 会话适配器与 TypeScript 文本流示例，自选模型服务。
- **本地交互**：筛选、排序、选择与重置，由严格 DSL 和随包运行库处理。

## 🚀 快速开始

### Web Chat

把 [SKILL.md](SKILL.md) 交给模型，然后提出任务：

> 用 Inform 做一份预算比较答案。允许调整预算、排序和选择；说明推荐理由，处理没有结果的情况。使用明确标注的示例数据，输出完整 HTML。

下载生成的 HTML，用允许 JavaScript 的浏览器打开。若 `generated/build.json` 的 `publicationReady` 为 `false`，请按 [运行库准备](references/delivery.md#foundation-code) 使用匹配的随包 JS；这时 latest 外链模板尚未确认支持本快照的新组件。需要更多图文表达时，改用 [精选内容 Skill](profiles/curated-web-chat/SKILL.md)。每次选择一份入口即可。

### Agent

下载仓库，把完整目录放入宿主支持的 Skill 目录，入口为根目录 `SKILL.md`。宿主的加载方式以其文档为准。具备文件和终端能力的 Agent 还可使用随包 CLI（Node.js 22+，无需安装依赖）：

```sh
node scripts/inform-answer.mjs catalog
node scripts/inform-answer.mjs prompt --select base/layout,base/controls,base/charts --out prompt.txt
node scripts/inform-answer.mjs check examples/filter-sort-chart.openui --select base/layout,base/controls,base/charts
node scripts/inform-answer.mjs build examples/filter-sort-chart.openui --out output/answer.html --select base/layout,base/controls,base/charts
```

同一组模块用于 prompt、检查和渲染。接入自选模型的文本流，见 [JavaScript / TypeScript 示例](examples/agent-integration/)。

## 🖼 示例

| 示例 | 内容 |
| --- | --- |
| [预算选择](examples/budget-choice.html) | 调整预算、比较方案、保留选择与重置 |
| [数据探索](examples/filter-sort-chart.html) | 同一数据驱动文字、图表和表格 |
| [图文解释](examples/composed-explanation.html) | 用指标、公式、步骤和图表解释平均数与中位数 |
| [Agent 集成](examples/agent-integration/) | 模型文本流、被动预览、最终校验、取消与过期回复 |

HTML 示例可随完整仓库下载后直接打开，使用随包 JS。数据均为示例；Agent 回放使用合成文本，不调用模型 API。

## 📚 文档与结构

- [Skill 入口](SKILL.md) · [基础 profile](profiles/web-chat-core/) · [精选 profile](profiles/curated-web-chat/)
- [组件目录](references/catalog.md) · [DSL 语法](references/dialect.md) · [HTML 交付与运行时](references/delivery.md)
- [维护指南](references/maintenance.md) · [问题反馈](https://github.com/Micraow/Inform-UI-skill/issues)

```text
SKILL.md      Agent 与 Web Chat 入口
profiles/     可单独使用的精简 Skill
examples/     HTML、DSL 与 JS/TS 集成示例
references/   组件发现、语法与交付文档
generated/    自动生成的合同、schema 与构建元数据
assets/       随包 browser / Node 运行库及许可
source/       profile 配置与源示例
scripts/      生成、检查和构建工具
tests/        回归测试与固定样例
```

## 🧭 使用边界

仅处理给定数据和页面本地状态，外部查询、发送、订票或付款需宿主自行接入。Web Chat HTML 默认通过可更新的 CDN 入口加载 JS，需要联网，更新可能受缓存影响；仓库示例与 CLI 默认使用随包快照。精简 profile 减少模型合同，浏览器仍加载完整 bundle。详见 [交付说明](references/delivery.md)。

## 🤝 参与

欢迎提交问题和改进。开发命令与生成规则见 [维护指南](references/maintenance.md)。

[MIT](LICENSE) · 随包依赖许可见 [第三方声明](assets/runtime/THIRD_PARTY_NOTICES.txt)。
