---
name: inform-ui-author
description: 按任务生成语义化 iui/1 JSON。先选固定运行版本，再只读取相关组件的依赖闭包、相邻约束和示例；支持正文、图表、供数视图和本地问卷。普通文字足够时不强加界面。
---

# Inform UI Author

你负责内容、来源、阅读顺序和选型；运行库负责校验与渲染。默认使用描述性字段的 canonical `iui/1` JSON。Inform UI 是独立、非官方实现，不依赖模型厂商服务。

## 最短完整路径

1. 普通文字能说清就用文字。趋势、比较、精确数值或可见输入结果才需要图表、表格或控件。声明数据是实测、供数还是合成。
2. 在 [README](README.md) 与 [版本兼容表](RECOVERY-CONSUMERS.md) 选择一个固定运行版本。JS、CSS、schema、字体与许可必须同版；source-only 不等于公开 CDN 已包含。没有准确合同，不能只凭名称猜字段。
3. 从当前 [219节点分类索引](authoring/current219/index.json) 选模块，再读完整任务包里的 schema 闭包、语义和例子，共91个源码模块；布局族会带入41节点。跨模块与 WebChat 单文件见 [同版按需规则](authoring/current219/README.md)。先核包内公开身份；本地候选不能当可安装版本。`rating-summary` 是只读供数摘要，旧 `rating` 是输入扩展；`toggle` 的来源映射未证。219是协议覆盖数，不能当全部组件视觉验收。问卷按所选版本读取完整包。
4. nodeSchema / 节点任务包只约束一个节点，不包含整个 Document。跨组件要保留所有依赖；最终完整文档仍须调用同版 `validateDocument` 做结构和语义校验。不要自行拼接不闭合的 `$defs`，也不要把所有领域说明默认塞入上下文。
5. 核对预期数值与必要交互：取消、重置、较新输入、隐藏字段、更新和销毁。未实际编译或预览，就说明未执行；不能把 JSON 解析通过当作功能或临床验证。

## 始终保留的语义

- 单位、来源、时间、适用条件及定义版本显式提供。未知 `null`、缺失、无效、真实 `0` 和 `false` 不得互换；不擅自补值或推断。
- 问卷须显式选择隐藏值 retain/clear 策略。隐藏答案不参与提交和计算；无效或必填未知立即抑制旧结果。相邻任务包说明 pending、可取消冻结快照和异步退休规则，不能只读此摘要写问卷。
- JSON 不放任意 JavaScript、组件 HTML/CSS、事件函数、`eval` 或 `native` 逃逸。表达式使用同版受限运算；循环、非法引用和非有限值必须报错。
- 链接和来源不是授权。供数、本地意图与真正联网、导航、剪贴板、账户或医疗服务分开；不让生成的内容悄悄执行外部动作。第三方许可和适用性须另核。
- HTML 中的 JSON 数据块须把 `<` 转义为 `\u003c`，不要把用户文本拼入启动脚本。保留固定资产/SRI、错误提示和清理逻辑。

最小文档：
```json
{"version":"iui/1","body":[{"type":"text","value":"一个简短解释可以已经足够。"}]}
```

需交 HTML 时，按 [当前同版构建说明](authoring/current219/README.md) 使用固定源码和资产；独立内嵌页面由匹配的 Node `compileHtml` 构建。浏览器入口提供 `validateDocument` 与 `mount`，不提供 Node 编译器。

## 按需参考，不默认注入

- [218入口快照](SKILL.cd1c545.md)、[218目录](authoring/progressive/index.json) 与 [218按需规则](authoring/progressive/README.md) 保留原字节及测量；[旧问卷任务包](authoring/packs/questionnaire.json) 只配其自身固定源码。不能只读此摘要写问卷。
- [历史完整指南快照](SKILL.7b9a332.md) 保留原文及其固定版本。只有任务选择该版本或需要对应深层合同才读取。
- [历史 Web Chat 全文](WEB-CHAT-GUIDE.md) 与其自身旧版锁配套，不能覆盖当前版本选择。
- [量化设计与评测](authoring/README.md)：默认 canonical；可选紧凑语法尚未证明模型收益，不作为必需步骤。

历史组件对照保持212/256。通用问卷扩展不意味着剩余44个专用组件已完成，也不要求继续逐项实现它们。
