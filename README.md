<div align="center">

# Intelligent UI Skill

### 让 AI 把解释写清楚，也把关系画明白。

[![CI](https://github.com/Micraow/Intelligent-UI-skill/actions/workflows/verify.yml/badge.svg?branch=feat%2Fsemantic-authoring-skill&event=pull_request)](https://github.com/Micraow/Intelligent-UI-skill/actions/workflows/verify.yml)
![协议 iui/1](https://img.shields.io/badge/schema-iui%2F1-2563eb)
![开发版 0.1.0，尚未发布](https://img.shields.io/badge/status-0.1.0%20preview%20%7C%20unpublished-f59e0b)
[![MIT License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

**清晰的正文 · 自然混排的图表与公式 · 恰到好处的交互**

[快速上手](#快速上手) · [安装技能](#安装技能) · [示例](#从这些例子开始) · [支持范围](references/support.md)

</div>

Intelligent UI Skill 帮助 AI 判断什么时候值得用图、选什么组件，以及怎样把正文、公式、数据和交互组织成一段好读的解释。AI 生成精简的 `iui/1` JSON，再由 [Intelligent-UI](https://github.com/Micraow/Intelligent-UI) 校验并生成界面。

整个方案独立于模型厂商：不需要 OpenAI 账号、API 或私有运行时。能读取技能说明的 Agent 都可以使用它。库的 API 中 `portable` 是渲染后端的技术名称；单文件 HTML 和嵌入网页是同一套库的交付方式，无需等待另一种“原生版”。

## 适合什么时候用？

- **解释技术原理**：让正文、公式、步骤与拓扑图按阅读顺序自然衔接
- **看懂数据变化**：用折线图或柱状图表达趋势与比较，保留单位、来源和缺测值
- **探索“如果改变……”**：用滑块或选择器改变输入，让相关数值同步更新
- **整理指标和资源**：把关键指标、简短说明与链接放在读者需要的位置

如果一句话就能说清，技能会保留普通文字。模拟数据必须明确标注，真实数据不能凭空补齐。

## 安装技能

当前为 **0.1.0 开发版**，尚未发布 npm 包。先获取已可使用的开发分支：

```sh
git clone --branch feat/semantic-authoring-skill https://github.com/Micraow/Intelligent-UI-skill.git intelligent-ui-author
```

将整个 `intelligent-ui-author/` 文件夹放进你的 Agent 宿主支持的技能目录。具体路径由宿主决定；请保留 `SKILL.md`、`references/`、`examples/` 和其余相对路径。这里只提供技能文件，不会替你更改宿主配置。

不支持技能安装的宿主，也可以直接阅读 [`SKILL.md`](SKILL.md) 和需要的引用文件。要实际校验、构建界面，还需要下面的 JavaScript 库和命令执行环境。

## 快速上手

先试着对 Agent 说：

> 使用 intelligent-ui-author，解释一条网络路径为什么会受最忙的链路限制。给我一个能调整负载的小演示，明确标注教学假设，并校验生成的 iui/1 JSON。

第一次在本地构建时，需要 **Git 和 Node.js 22 或 24**。在 `intelligent-ui-author/` 的上一级目录运行：

```sh
git clone https://github.com/Micraow/Intelligent-UI.git Intelligent-UI
git -C Intelligent-UI checkout --detach aa17c6eab822fa59dbca548071cc98f1a8499805
npm --prefix Intelligent-UI ci
npm --prefix Intelligent-UI run build
node Intelligent-UI/bin/iui.mjs validate intelligent-ui-author/examples/hpcc-feedback.json --json
node Intelligent-UI/bin/iui.mjs build intelligent-ui-author/examples/hpcc-feedback.json --out answer.html --lang zh-CN
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
| [资源短名单](examples/resource-shortlist.json) | 把有用的链接和介绍融入正文 |

这些示例全部为原创。请一起修改数据与解释；示例数字不是用户的真实测量结果。

## 两个仓库怎样配合？

| 仓库 | 负责什么 |
| --- | --- |
| **[Intelligent-UI-skill](https://github.com/Micraow/Intelligent-UI-skill)** | 教 Agent 选择内容、组织阅读顺序、输出 JSON，并检查质量 |
| **[Intelligent-UI](https://github.com/Micraow/Intelligent-UI)** | 定义协议、验证输入，确定性生成 HTML，处理样式、响应式和交互 |

技能不要求 AI 为每次回答重新写 HTML、CSS 或 JavaScript。字体、间距、主题与移动端布局交给库处理。

现有支持以公开协议为准。实时地图、天气等外部服务需要自己的数据与授权；任意脚本应用不在本技能的输入范围内。详见[组件与能力说明](references/support.md)。

## 运行检查

在技能目录中执行：

```sh
npm test
npm run check:library -- --library ../Intelligent-UI
```

第一条检查技能结构与文件边界，第二条调用真实库的 API、Schema 和 CLI 验证全部示例。可选的[浏览器检查](references/library-workflow.md#browser-regression)还会操作滑块，并检查桌面与 390 px 布局。

已通过的[验证记录](https://github.com/Micraow/Intelligent-UI-skill/actions/runs/37762008510)包括 Linux 的 Node.js 22/24、Windows 与 macOS 的 Node.js 22，以及 Chromium 下的 20 组明暗主题和桌面/手机视图。CI badge 显示开发分支的最新状态。

## 许可证

采用 [MIT License](LICENSE)。欢迎提交原创示例与改进；引用第三方内容时，请保留清楚的来源和兼容许可。
