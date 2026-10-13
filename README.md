<div align="center">

# Inform UI Skill

### Turn ideas into interfaces.

让 AI 用 Inform UI 构建图表、表单、学习卡片与完整的交互页面。
从内容和数据出发，得到可校验、可修改、可独立交付的 JSON 与 HTML。

[快速开始](#快速开始) · [组件展示](#组件展示) · [看看示例](#看看示例) · [Inform UI 运行库](https://github.com/Micraow/Inform-UI) · [MIT License](LICENSE)

</div>

<p align="center">
  <a href="assets/gallery-panorama.png"><img src="assets/gallery-create.png" alt="Inform UI 真实组件：折线图、环形图、表单、滑块、词汇卡片与表格" width="1200"></a>
</p>
<p align="center">
  <a href="assets/gallery-explore.png"><img src="assets/gallery-explore.png" alt="数据与工具：天气、指标、金融图表、单位转换与数学公式" width="49%"></a>
  <a href="assets/gallery-compose.png"><img src="assets/gallery-compose.png" alt="计划与组合：日程、航班、选项卡、问答与菜单" width="49%"></a>
</p>
<p align="center">真实运行库渲染 · 原创合成数据 · <a href="assets/gallery-panorama.png">横向三页全景 →</a></p>

## 用它做什么

- **把信息讲清楚**：正文、公式、表格与图表，按内容选择合适的表达
- **让结果可以操作**：本地表单、条件问卷、选项卡与即时计算
- **得到可复用的文件**：标准 `iui/1` JSON，可校验、修改，也可生成独立 HTML

Skill 提供组件用法与示例，**Inform UI 运行库负责校验、计算和渲染**。两者都不调用模型服务；运行库不依赖 OpenAI SDK、账号或 API。你可以使用自己的 AI 工具，也可以直接手写 JSON。

## 快速开始

### 1. 安装 Skill

需要 Git。以 Codex CLI / IDE 的[项目技能目录](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)为例，在项目根目录执行：

```sh
mkdir -p .agents/skills
git clone \
  https://github.com/Micraow/Inform-UI-skill.git \
  .agents/skills/inform-ui-author
```

在技能菜单中选择 `inform-ui-author`，提供你的内容、数据和想要的结果即可。其他支持 `SKILL.md` 的工具可按各自的安装方式导入完整仓库；请保留文件夹结构。

### 2. 生成第一个页面

需要 **Node.js 22+**。在同一项目根目录执行以下命令，构建固定版本的运行库，并渲染附带示例：

```sh
git clone https://github.com/Micraow/Inform-UI.git Inform-UI
git -C Inform-UI checkout --detach 5849d9ba6352da8f3fe32dcf3525d0418129e3f8
npm --prefix Inform-UI ci --ignore-scripts
npm --prefix Inform-UI run build
node Inform-UI/bin/iui.mjs validate .agents/skills/inform-ui-author/getting-started/capacity.json --json
node Inform-UI/bin/iui.mjs build .agents/skills/inform-ui-author/getting-started/capacity.json --out answer.html --lang zh-CN
```

用浏览器打开 `answer.html`。示例中，30 个活动名额已有 12 人参加，页面显示剩余 18 个；拖动人数滑块，结果随之更新。数据为原创合成示例，所有计算在本地完成。

以后将命令中的示例路径换成你生成的 JSON，就能校验并导出自己的页面。运行库目前通过源码构建使用，无需安装同名 npm 包。

## 看看示例

| 你提供的内容 | 得到的结果 | JSON |
| --- | --- | --- |
| 活动人数与总名额 | 调整人数，即时计算剩余名额 | [活动名额](getting-started/capacity.json) |
| 一组随时间变化的数据 | 趋势图，附可展开的数据表 | [趋势与数据](examples/rtt-trend.json) |
| 活动的准备与练习安排 | 可切换的两页日程 | [选项卡日程](authoring/design-workflows/examples/workshop-agenda.json) |
| 活动类型与出行条件 | 按回答展开的打包问卷 | [条件问卷](authoring/design-workflows/examples/branching-packing.json) |

简单内容也可以只有一段文字：

```json
{
  "version": "iui/1",
  "body": [{ "type": "text", "value": "下一场分享在下午两点开始。" }]
}
```

更多可运行输入见 [examples](examples)。示例不会自动连接真实账户、提交预约或发送消息；这些动作需要应用自行接入。

## 组件展示

三页横向瀑布流展示 **24 组原创组合、32 种节点**。每张卡片都是真实渲染，可交互并下载完整 JSON。


浏览全部 **219 个协议节点**：218 个可渲染示例，以及明确展示错误的 `native` 拒绝边界。每个示例都附带实际挂载的完整 JSON，可复制或下载。当前目录包含只读评分摘要；全量原版视觉对应仍在逐项审查，协议数量不代表视觉复刻验收。

完成上面的运行库安装后，在同一项目根目录启动展示页：

```sh
npm --prefix Inform-UI run showcase
```

浏览器打开 **http://127.0.0.1:4175/gallery.html** 看组合画廊，或打开 **http://127.0.0.1:4175** 搜索全部组件、切换浅色 / 深色并试用交互。静态构建与更多操作见[组件展示指南](https://github.com/Micraow/Inform-UI/blob/5849d9ba6352da8f3fe32dcf3525d0418129e3f8/docs/showcase.md)。

## 继续探索

- [组件索引](authoring/current219/index.json)：219 个节点的分类与使用资料
- [作者指南](authoring/README.md)：组件组合、校验和按需参考
- [运行库源码](https://github.com/Micraow/Inform-UI/tree/5849d9ba6352da8f3fe32dcf3525d0418129e3f8)：与快速开始、组件展示相同的固定版本
- [浏览器资产](https://github.com/Micraow/Inform-UI/blob/5849d9ba6352da8f3fe32dcf3525d0418129e3f8/docs/cdn-218.md)：无需本地构建的独立接入方式
- [历史版本兼容表](RECOVERY-CONSUMERS.md)：旧示例、独立版本锁与验证记录

JS、CSS 和 schema 应来自同一运行版本。旧示例旁的版本锁保留其原始验证范围；专业评分组件的软件测试不构成临床验证。

<details>
<summary>开发与测试</summary>

```sh
cd .agents/skills/inform-ui-author
npm ci
npm test
```

本仓库测试检查技能入口、示例与历史合同。运行库的构建和交互测试见 [Inform UI](https://github.com/Micraow/Inform-UI)。

</details>

## 许可与项目关系

原创代码采用 [MIT License](LICENSE)。第三方素材与代码仍受各自的许可证和知识产权约束，本项目许可不能替代所需授权。

Inform UI 和本 Skill 是**独立、非官方**社区实现，参考 OpenAI Intelligent UI 的视觉与交互表达；并非由 OpenAI 开发、维护、赞助或认可，不暗示官方关联。

<details>
<summary>English notice</summary>

Inform UI and this Skill are independent, unofficial community implementations. They are not developed, maintained, sponsored, or endorsed by OpenAI. The reference names do not imply an official association; these statements do not replace any permission required for third-party content.

</details>
