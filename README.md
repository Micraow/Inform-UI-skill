# Inform UI Skill

用语义化 `iui/1` JSON 组织正文、图表、公式与本地交互，再由 [Inform UI](https://github.com/Micraow/Inform-UI) 校验和渲染。内容足够简单时，保留普通文字；需要图表时，说明数据、单位、来源和假设。

本仓库提供作者指南、原创合成示例、可执行消费者测试及版本锁。它不调用模型服务，不需要 OpenAI 账号或 API，也不捆绑运行库。

## 选择可复现的版本

| 用途 | 固定公开版本 | 使用边界 |
| --- | --- | --- |
| 直接使用已打包浏览器资产 | [Inform UI 214 / fed5f86f](https://github.com/Micraow/Inform-UI/tree/fed5f86f49e73f908ac9ea98966b1515a3aaa597/cdn) | 214 个协议节点，209 项完整功能实现；含宿主 Reset 和日期算术，未含后续 GCS、ROX |
| 使用 GCS 数值计分及完整本地交互 | [源代码 c138b93b](https://github.com/Micraow/Inform-UI/commit/c138b93b745990c02ec41d7b924cb615d80ed172) | 215 个协议节点；须构建该源版本，不能搭配 214 的旧 schema/脚本 |
| 使用 ROX 显式单位算术与可选研究数值比较 | [源代码 d9b0ed41](https://github.com/Micraow/Inform-UI/commit/d9b0ed410d9aa2dd7f8fa888ff44b22595239853) | 216 个协议节点；包含 GCS 和已验证的本地表单、浮层后续修复 |

| 使用 qSOFA 显式模式计分 | [源码09733658](https://github.com/Micraow/Inform-UI/commit/09733658d6fff687f4255ea6dde2901772ce33c1) | 217登记；同版本源构建 |
| 使用通用条件问卷 | [源码a97a7c13](https://github.com/Micraow/Inform-UI/commit/a97a7c13323a91662f758c5c0034e943776935a3) | 218登记；包含qSOFA，须源构建；214 CDN仍209完成 |

当前 [软件功能表](references/recovery-scope212.json) 为 **212/256 已实现**：历史功能验收 53、待完整验收 159，部分实现 0、未实现 44；协议登记数为217。qSOFA消费者已通过49项算术和5组实际使用测试，运行源码已公开，见 [qSOFA 09733658](https://github.com/Micraow/Inform-UI/commit/09733658d6fff687f4255ea6dde2901772ce33c1)。[公开功能表 ba96c208](https://github.com/Micraow/Inform-UI/commit/ba96c208c3934e89d861d8e75ec02195eede7941) 已为212项、217登记；后续通用问卷源为218登记但不增加历史完成数；CDN仍为209项、214登记。软件行为、原生浏览器、像素一致性和临床有效性是不同的验证范围。

浏览器资产的实际远端字节、SHA256 和 SRI 已逐项核对，参见 [214 使用说明](candidates/recovery214/README.md)。保留同版本的 JS、CSS、schema、字体与第三方许可说明；不要只替换一个文件或使用浮动分支 URL。GitHub 文件页用于获取源码和资产，不是可直接执行的脚本地址。

## 安装与开始使用

需要 Git 和 Node.js 22 或更高版本。本项目不假设已有 npm 发布包。

```sh
git clone --branch recovery/consumers-126-20261011 https://github.com/Micraow/Inform-UI-skill.git inform-ui-author
git clone https://github.com/Micraow/Inform-UI.git Inform-UI
git -C Inform-UI checkout --detach a97a7c13323a91662f758c5c0034e943776935a3
npm --prefix Inform-UI ci
npm --prefix Inform-UI run build
node Inform-UI/bin/iui.mjs validate inform-ui-author/examples/minimal.json --json
node Inform-UI/bin/iui.mjs build inform-ui-author/examples/minimal.json --out answer.html --lang zh-CN
```

打开生成的 `answer.html` 查看结果。已有工作目录时，先保存自己的修改，再选择版本；验证器不会下载或悄悄替换缺失的运行库。

支持技能目录的 Agent 保留整个仓库的相对路径，但默认只读精简的 [SKILL.md](SKILL.md)，再按任务取 [闭合合同与相邻示例](authoring/README.md)。旧130KB全文在 [固定快照](SKILL.7b9a332.md) 逐字保留，与 [WEB-CHAT-GUIDE.md](WEB-CHAT-GUIDE.md) 都按需读取，不能把其旧登记数或 CDN 链接当作当前版本。使用新增组件时，应读对应任务包/消费者说明、同版 schema 依赖和一个同版示例，最终用完整 `validateDocument` 校验。最新公开源 schema 位于 [固定 a97a7c13](https://github.com/Micraow/Inform-UI/blob/a97a7c13323a91662f758c5c0034e943776935a3/src/schema/iui.schema.json)。

没有终端时，可使用 [214 固定资产说明](candidates/recovery214/README.md) 的浏览器入口，或让宿主提供已构建的匹配运行库。不要把未执行的 HTML 说成已预览。

## 作者应遵守的合同

- 先确定读者要理解的关系，再选择正文、图表、表格或控件；不要把每一段话塞进卡片。
- 所有示例数据明确标注为实测、供数或合成。缺失值保留 `null`，真实零值不能丢失。
- JSON 只表达允许的字段；不要附带组件 HTML、任意脚本或事件处理函数字符串。
- 结构校验之后仍需调用 `validateDocument` 做语义校验。单节点 schema 不能替代完整文档合同。
- 金额、比分、目录、自动化和能力卡默认读取宿主供数；本地意图不等于银行、消息、预约、录音或外部服务已经执行。
- GCS、ROX、qSOFA 和日期组件只验证相应的软件规则与界面合同。调用方仍须确认版本、单位、适用范围及其自身场景的验证要求。软件测试不构成临床验证或治疗建议。

最小文档可以只有文字：

```json
{"version":"iui/1","body":[{"type":"text","value":"一个简短解释可以已经足够。"}]}
```

浏览器入口提供 `validateDocument`、`mount` 与更新/清理控制器；Node 入口另提供 `compileHtml`。请使用固定版本公开的实际类型和返回值，不猜组件字段。

## 原创示例与必要验证

### 通用问卷扩展

Agent 可以用 JSON 声明字段、前序字段控制的条件显示、跨字段校验、有限表达式计算和版本来源，参见 [原创活动打包问卷](candidates/questionnaire/README.md)。未知或无效答案会立即移除旧结果；隐藏答案按明确的保留或清除策略处理，并排除于提交快照。提交可本地取消，宿主异步处理收到冻结快照和取消信号。

此消费者对应 [公开源码 a97a7c13](https://github.com/Micraow/Inform-UI/commit/a97a7c13323a91662f758c5c0034e943776935a3)，协议登记为218；须构建该固定源版本，214 CDN尚不含问卷。历史212/256对照不变，剩余44个专用组件不再作为当前逐项实现目标。通用问卷不意味着这些组件已实现，也不能代替具体规则的独立正确性与适用性审查。

| 示例或消费者 | 覆盖内容 |
| --- | --- |
| [最小文字](examples/minimal.json) | 不添加无必要装饰 |
| [瓶颈与反馈](examples/hpcc-feedback.json) | 正文、拓扑、公式与本地输入 |
| [通用问卷](candidates/questionnaire/README.md) | 非医疗原创分支问卷、未知与无效草稿、冻结结果快照及本地取消提交 |
| [GCS scorecard](candidates/gcs-scorecard/README.md) | 120 个数值组合，NT/未知，信息 tabs、独立 defaults 与本地 summary |
| [ROX 显式单位](candidates/rox-scorecard/README.md) | 百分数/分数、零/缺失、未经舍入比较与 reset |
| [qSOFA 共识数值](candidates/qsofa-scorecard/README.md) | 两种显式意识状态输入、GCS14边界、未知/NT与Reset；公开源09733658 |
| [日期算术](candidates/corrected-age/README.md) | 两种日期依据、闰日周年、无效/未知与边界输出 |
| [宿主表单字段](candidates/host-fields-reset/README.md) | 无效草稿、取消、较新输入与可见焦点 |
| [浮层与表单披露](candidates/overlay-form-disclosure/README.md) | 本地浮层资源和关闭 Details 内的必填字段焦点 |

更多固定版本与命令见 [消费者兼容表](RECOVERY-CONSUMERS.md)。每个消费者保留自己的运行源、资产与结果；旧版本通过记录不自动适用于新版本。

```sh
cd inform-ui-author
node --test tests/questionnaire.test.mjs tests/source-public218.test.mjs tests/recovery214.test.mjs
node --max-old-space-size=768 candidates/questionnaire/verify-source.mjs --library ../Inform-UI
```

完整 `npm test` 检查本仓库的全部测试；它和针对某个精确运行库执行的消费者测试不同。测试结果中的实际执行、未执行和限制应分别说明。

## 项目身份与许可

Inform UI 和本 Skill 是**独立、非官方**社区实现，参考 OpenAI Intelligent UI 的视觉与交互表达。项目并非由 OpenAI 开发、维护、赞助或认可；相关名称仅用于说明参考对象，不暗示官方关联。

Inform UI and this Skill are independent, unofficial community implementations. They are not developed, maintained, sponsored, or endorsed by OpenAI. The reference names do not imply an official association; these statements do not replace any permission required for third-party content.

原创代码采用 [MIT License](LICENSE)。第三方素材与代码仍受各自的许可证和知识产权约束；本项目许可不能替代所需授权。公开论文、图表或评分资料的可读性也不自动赋予复制、翻译或重新许可的权利。
