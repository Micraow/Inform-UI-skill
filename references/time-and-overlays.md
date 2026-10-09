# 页内时间与浮层的选型、组合及生命周期

本文件匹配library-contract.json的固定版本。旧6797f7f仅作历史基线，不支持这里的新组件；不得混用旧壳/Schema与新JSON。

## 场景选择

- 固定会议瞬间在另一个时区如何显示：clock snapshot，明确 at 和 timezone。
- 当前设备在指定时区的日期/时间：clock live，不能提供 at，注明设备时间。不要拿它填充新闻、天气、交易所或比赛直播时间。
- 记录一轮练习经过多久：stopwatch。elapsedMs 是起始偏置，不是恢复日志；刷新/更新会丢失运行中状态和圈数。
- 从预先给定的两分钟数到零：timer。durationMs 是毫秒字面值，120000 才是两分钟；不能把“每天两点提醒”表达为 timer。
- 一两句术语解释：tooltip。trigger 必须有可理解的 label，正文 value 不容纳链接/控件。
- 临时查看补充资料或小型本地设置：popover。需要导航的链接或交互表单放其 children，仍遵守这些节点的合同与授权边界。
- 有阅读顺序的长说明或关键限制：section/details。不要为模态确认、强制签署或保密问卷使用 popover。

字段、数值范围、默认值直接保留在根 SKILL.md。这里补充跨组件容易误判的行为，不维护另一份 schema。

## 生命周期：宿主状态与组件本地状态是两层

1. mount：文档 state 初始化；clock 按模式显示；stopwatch/timer 暂停起始；浮层关闭。
2. setState(patch)：原子计算并刷新已绑定 V。不会重建 timer、stopwatch、圈数、浮层或其子节点。对 patch 中明确出现的表单 bind，宿主值覆盖 DOM 草稿，即使数值与当前 state 相同；未触及的数字草稿保持。
3. 基本 button set：明确覆盖对应 state 及字段草稿。button reset：重置文档 state 和表单草稿，不是计时组件的 Reset，也不是取消宿主表单动作的替代品。
4. 表单 Cancel：中止该表单宿主动作并恢复表单初值、清理其草稿；若会破坏全局约束则拒绝状态回滚并显示错误。其他表单/计时组件不随之重置。
5. stopwatch Reset / timer Reset：仅重置该组件并暂停。timer Restart 是到零后从 durationMs 再开始一轮，不等同 Reset。
6. 关闭 popover：隐藏但不销毁子节点；不会暂停正在计时的子组件或自动取消子表单动作。重要计时宜放正文；有未结束动作时应先让用户明确暂停/取消。
7. update(nextDocument)：先验证新文档；失败不破坏已挂载状态，成功才清理原控件并挂载新初始值，旧局部编辑/圈数/打开状态不保留。
8. dispose：清理原控件、定时器、观察器和监听，不保证页面外工作。已处置 controller 不应继续使用。

用户键入数字字段的输入草稿包括空白、不完整数字，以及有限但不满足 min/max/step 的数字；它们不写入 state。指标读取最后被接受的数字，不能证明输入框当前有效。文本/email/textarea 仍即时绑定字符串，required、长度或 email 格式错误可能已经在 state 中；不要把“最后有效值”泛化到所有字段。没有给 number.step 时允许任意有限小数；给 step 时相对 min（未给 min 则0）对齐。

## 跨领域选择：节点归属与嵌套不混淆

唯一 schema 来源是对应版本完整 iui.schema.json。schema/index.json 的 nodeOwners 与 groups 决定选择；文档包默认包括 base＋目标组，node 片只查字段。不要在 Skill 中复制一份结构定义或手工拼 $defs。

这些是本次冻结契约下应从真实索引得到的选择，验收脚本会重新推导并核对，不是另一份 schema：

- local-overlays.json：base。tooltip/popover 的容器归 base。
- local-time.json：base＋time。clock、stopwatch、timer 归 time，标题/说明归 base。
- local-number-draft.json：base＋forms。popover 里放 form，仍需要 forms；“包在 base 容器里”不改变子节点归属。
- timed-local-practice.json：base＋forms＋charts＋time。自定义练习数值驱动 metric/chart，timer 自己计时，双方没有暗含自动联动。
- foundation-explainer.json：base。rich text、blockquote、grid-item、structured table 都是基础表达，根文件给出规则。
- local-status-primitives.json：base。flow/icon/pulse-indicator均为基础组件。
- primitives-with-form-and-time.json：base＋forms＋time。flow只是保序布局，不会消除后代的领域归属或生命周期。

已有匹配核心 checkout 时，可从该 checkout 的官方脚本生成跨域并集，输出到自己的草稿目录：

    node scripts/schema-subset.mjs --groups base,forms,charts,time --out /absolute/path/to/union.schema.json

没有终端时按需读取各领域 documentSchema 理解字段，再把完整混合文档交给同版完整 validateDocument。forms 包不能验证 time；time 包即使包含 base popover，也不能验证其未包含的 forms/chart 子节点。读 nodeSchema 不能替代文档 state/computed 语义检查。

schema 文件、索引、示例、运行时与 CSS 均使用同一个已核验的40字符提交。JSON 合法、结构通过、语义通过、DOM 测试、真实浏览器、公开固定 CDN 各是独立关卡。未运行/未发布不是通过。

## 最小交互验收

- 首次开始、重复点击、暂停/继续、reset/restart、timer 完成一次、stopwatch 非零起始分圈及100圈上限；多实例独立。
- number 输入无效草稿时指标不变；不相关 setState 不清草稿；宿主同值明确赋值清草稿；真实点击提交/取消不会被失焦时布局变化吞掉。
- tooltip 键盘/指针/触屏序列，指针从按钮移到内容，Escape，指针按下后移走再松开的中断手势。
- popover Close/Escape 归焦点，外点不抢焦点，Tab 非困陷，嵌套 Escape 只关最深一层，切同级清旧分支；隐藏内容不能聚焦。
- 不相关 state 更新保留 timer/浮层与子输入选择；非法 update 原子拒绝，合法 update/dispose 清理旧内容和回调。
- 390/768/1100px、明暗、中文/英文、缩放/滚动/视口四角、减少动态效果；降级时可读且无页面横向溢出。

真实屏幕阅读器与跨浏览器审计未做时应单独注明；原生语义或自动断言不构成全面无障碍合规声明。

宿主明确 setState 是另一条权威写入路径。form 的 min/max/step 是字段/提交有效性规则，不是全局state约束；通过全局校验的有限宿主数值可以覆盖输入框，即使越界或不合步长。此时指标读该state，提交仍invalid。当前固定库实际挂载DOM复验：键入3（step2）时state仍6；宿主明确写100（max20）后state与输入框都为100，表单提交无效。不要把此例当成需要允许越界的业务建议。
