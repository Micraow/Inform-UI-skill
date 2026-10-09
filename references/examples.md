# Choose the nearest example

All fixtures are original and use the public `iui/1` protocol. Their measurements are synthetic unless the fixture explicitly says otherwise.

| Example | What it teaches | What to preserve when adapting |
| --- | --- | --- |
| [minimal.json](../examples/minimal.json) | Prose is a valid outcome | Do not add components merely to fill space |
| [hpcc-feedback.json](../examples/hpcc-feedback.json) | Prose → topology → bound slider → computed metrics → formula → interpretation | Explicit teaching-model scope, positive denominator, labels, visible feedback, reset |
| [rtt-trend.json](../examples/rtt-trend.json) | A trend with a missing observation and inspectable values | `null` stays missing, series labels and units remain visible, no causal claim from the curve alone |
| [wifi-status.json](../examples/wifi-status.json) | Compact metrics with their meaning | A PHY rate is not measured throughput; synthetic readings are not live device access |
| [local-practice.json](../examples/local-practice.json) | 本地表单与联动指标/柱图 | 同类型state、字段约束、禁用字段不进入快照；提交不联网，空数字草稿不改最后有效值 |
| [supplied-weather.json](../examples/supplied-weather.json) | 数据来源、单位转换、缺测及空/加载/错误视图 | 合成标签、更新时间、IANA时区、0–100百分比；无自动获取/刷新 |
| [coordinate-scenarios.json](../examples/coordinate-scenarios.json) | 五图种、不等距数值与跨年毫秒时间 | 不等距X用linear/time；微量变化用明确纵轴范围，不改变原数据 |
| [supplied-sports.json](../examples/supplied-sports.json) | 赛程、记分牌与积分榜的组合 | 来源、时区、null与0、来源胜者/排名/扣分；无自动直播或规则推断 |
| [local-learning.json](../examples/local-learning.json) | 自测反馈与闪卡自评的完整本地流程 | 题目与答案正确、单选/多选边界、无持久化或保密考试承诺 |
| [supplied-finance.json](../examples/supplied-finance.json) | 行情、真实时间历史和共同基准比较 | 来源、延迟声明、缺测、零基准、各自币种归一化；无换汇/交易 |
| [supplied-heatmap.json](../examples/supplied-heatmap.json) | 统一权重面积、涨跌色阶与全记录 | 0/null无伪造面积，色阶饱和不改变原始幅度，小格与缺面积项仍可查表 |
| [local-converters.json](../examples/local-converters.json) | 单位与汇率快照本地试算 | 同类单位、绝对温度/温差、base方向、缺测/0/同币种不混淆；不查市场、不交易 |
| [auxiliary-surfaces.json](../examples/auxiliary-surfaces.json) | code/badge/容器/轮播/矢量与降级文本 | 不执行代码，不把Markdown降级当富文本；只用受控SVG属性 |
| [resource-shortlist.json](../examples/resource-shortlist.json) | Useful links embedded in normal prose | Honest project status; omit thumbnails without useful, authorized images |

Change the data and explanation together. A fixture is not evidence for a user's real situation. The HPCC-inspired example demonstrates one simplified proportional feedback relation; it is not an implementation or validation of the full scientific algorithm.

## 基础、时间与浮层示例

以下是本次原创示例，不属于历史6797盲测。使用library-contract.json中的当前固定运行时；旧6797不支持它们，语法/本地校验不能替代浏览器验收。

- [local-time.json](../examples/local-time.json)：固定瞬间、设备时钟、暂停起始的秒表与两分钟倒计时；base＋time。
- [local-overlays.json](../examples/local-overlays.json)：文字提示、非模态面板、嵌套 Escape 与同级分支；base。
- [local-number-draft.json](../examples/local-number-draft.json)：面板内表单、min/max/step 数字草稿、同值明确覆盖与局部取消；base＋forms。
- [timed-local-practice.json](../examples/timed-local-practice.json)：计划输入驱动指标/分类柱图，独立页内计时不自动联动；base＋forms＋charts＋time。
- [foundation-explainer.json](../examples/foundation-explainer.json)：富文本、引用、移动网格、结构化多层表头及缺测；base。

组名由验收脚本从匹配的完整 schema/index 再推导，不能因为外层容器属于 base 就忽略 children 的所属域。状态与关闭语义见[时间与浮层](time-and-overlays.md)。

- [local-status-primitives.json](../examples/local-status-primitives.json)：flow换行、装饰/命名图标、显式合成状态；base。
- [primitives-with-form-and-time.json](../examples/primitives-with-form-and-time.json)：flow内表单不改变state或计时边界；base＋forms＋time。
