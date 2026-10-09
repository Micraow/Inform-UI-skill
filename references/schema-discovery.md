# 按需 Schema 发现与单根入口范围

本阶段把全领域发现与完整字段合同分开：常用基础仍在根 Skill；深入领域按需读索引、Schema 和同版示例。完整 JSON Schema 仍由核心库单一来源生成，不再手工维护一份平行 Schema。

## 固定版本与入口

- Skill 功能提交：[d2cf1d9ef40e13cfc390b831530e6807532c54ad](https://github.com/Micraow/Inform-UI-skill/commit/d2cf1d9ef40e13cfc390b831530e6807532c54ad)
- 库与所有当前 CDN 入口：6797f7f7755f483db6c3be3831aa03433b7c4696
- [机器索引](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@6797f7f7755f483db6c3be3831aa03433b7c4696/cdn/schema/index.json)
- [完整 Schema](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@6797f7f7755f483db6c3be3831aa03433b7c4696/cdn/iui.schema.json)
- [根 Skill](../SKILL.md)：33,167 UTF-8 字节
- [完整 Web Chat 指南](../WEB-CHAT-GUIDE.md)：42,263 UTF-8 字节

旧 32 KB 是项目早期人为控制目标，未发现宿主或分发硬限制；相应测试已移除。本阶段按使用方式拆分，不为固定字节上限删除常用能力。文件大小不等于模型 token 数。索引的 estimatedTokens 仅按 Unicode 码点数除以 4 上取整，不是实测值或节省承诺。

## 单根能做什么

只提供根文件时，模型仍能按明确字段生成正文、公式、布局、指标、表格、五类图、拓扑、控件、本地表单、自测/闪卡、九类单位换算和受控 SVG，并用固定 CDN HTML 壳交付。天气、体育、金融和货币快照的名字与适用场景在根内，但生成前还要读取其完整字段合同。

能够读取外部资料的 Agent：索引 → 对应 documentSchema → 一个同版示例。不必先抓取全部分片。无法读取外部资料的普通 Web Chat：提供完整指南或同版完整 Schema，不从索引名字猜字段。

## 两类分片不能混用

- documentSchema：完整 Document 根，默认 base＋所选领域，保留 state/computed，引用递归闭合；includedGroups 标明实际包含范围。
- nodeSchema：Node 根，仅供字段查询；不含文档 state，其递归 Node 子项也只包含本组，不能当完整页面校验器。
- 跨领域：同版 CLI 用 `--groups base,forms,charts,finance` 生成闭合并集；不手拼 `$defs`。单一 finance 包不能校验混有 forms/charts 的文档。
- Schema 结构检查不能替代完整 validateDocument 的语义检查，包括状态引用、日期、范围、URL、计算图及 native 拒绝。
- path 均相对索引 URL 解析；同版示例同时给 repositoryPath。运行时、索引、Schema 和示例必须保持同一 pin。

## 验证证据

本地固定 checkout 与当前发布 pin 精确一致，重新安装并构建后完成：

- 11 项结构、品牌、可复制壳、完整发现与冻结边界测试。
- 14 份 Skill 示例经真实 API/CLI 验证、重复构建确定性和输入不变性；61 份反例确认拒绝，API/CLI 诊断一致。
- 根内 3 份及完整指南 8 份字面 JSON 均有效，两个入口的 HTML 壳完全一致。
- 10 组、21 份完整/Document/Node Schema 的 SHA-256、字节数、码点/粗估元数据与本地引用闭包。
- 52 节点唯一归属、12 份同版示例、Document/Node 根互拒，以及真实跨领域并集通过。finance 单片拒绝混合 forms/charts 的对照例。
- 实际新 CDN 索引直接 HTTP 200、无重定向，JSON MIME、CORS 与固定提交字节相符。

本地 Chromium 因该终端的 socket 权限限制未能启动，此次失败不计作渲染通过。最终真实浏览器证据取自下面的 GitHub Actions 运行。

完整 CI：[37882182256](https://github.com/Micraow/Inform-UI-skill/actions/runs/37882182256)，已回读为成功，四个矩阵任务均通过。测试包括 Linux Node 22/24、Windows/macOS Node 22，以及 68 个 Chromium 明暗/390px/桌面视图。浏览器额外从 file:// 实取索引、base/finance/converters 的六份 Document/Node 分片并核 SHA-256，再取三份同版示例交给真实 CDN 运行时验证。

已取本轮 96 张当前页面/局部截图；人工复看手机暗色根壳与辅助节点、手机亮色同 SVG 返回鼠标描边、桌面亮色转换器。图文及控件可读，热图描边没有旧黑框；轮播在自己的局部区域横向浏览。可见辅助反馈文字仍作为库呈现层观察保留，不用功能通过掩盖视觉差异。

本报告及金融沿革更新属于纯文档检查点：本地轻检查通过后以明确 skip 标记推送，不重复四平台/68 视图。完整功能验收对应上面的 d2cf1d9 提交；未运行的检查不算通过。

此项是既有功能的合同与消费者回归，不是新一轮盲测。41/46 的输入、首稿、合同及原始说明保持原字节；不以新文档或新资源重算旧首试成绩。通过结构、功能和列举视图，也不等于完整复刻参考产品的全部视觉细节。
