# 金融供数选型与完整边界

本文对应[当前固定合同](../library-contract.json)，示例均为原创合成数据。它说明显示协议，不提供投资建议。


当前价格/相对前收盘用finance-quote，单标的时间走势用finance-chart，同一时刻基准的相对表现用finance-comparison，多个标的的权重与涨跌分布用finance-heatmap。来源→快照→必要图→解释，普通数值趋势不必套金融节点。只展示供数，不查询/订阅行情或推断交易时段；合成必须声明，不把教学页当投资建议。

四者必填source:{label:S,synthetic:B,url?:S}，可选id:S,title:S,status:"ready"|"loading"|"error",message:S。source.url仅为公开HTTPS出处，不触发抓取。所有字段为字面值，不接受V/bind/API密钥/服务端点。

- finance-quote必填instrument；finance-chart必填instrument,ranges，可选initialRange。
- finance-comparison必填instruments:[instrument,...]（2–6个且id唯一）、baselineAt:S、ranges；可选initialRange、timezone:S（轴默认UTC）。
- instrument:{id:S,symbol:S,name:S,currency:S,timezone:S,asOf:S,marketStatus:M,delayMinutes:D,price:P,previousClose:P,history:[{time:S,price:P},...],exchange?:S}。
- P为非负有限数或null；currency为3个大写字母；M为open|closed|pre|post|halted|unknown；D为0–10080整数。0分钟仅声明延迟，不保证实时。timezone用IANA；所有时间用真实有效、带Z/明确偏移的ISO时间。
- history最多500点，真实时间严格递增、不重复、不晚于asOf；null保留断口，0是真实零。price不自动取历史末点。变动为price−previousClose，百分比仅previousClose>0时计算；零/缺测基准不伪造百分比，溢出值拒绝。
- ranges:[{id:S,label:S,from:S,to:S},...]最多12项，id唯一、from≤to且都带偏移；包含两端，相同时间为单点。ranges:[]为全部；initialRange若给须引用已有id；无观测范围为空态，不补点。
- 比较每系列须在baselineAt同一瞬间有正历史价，按(price/baseline−1)×100计算；不同偏移同瞬间等价。缺/零基准显示不可比，不借相邻观测。基准可在显示范围外。只比各自币种相对变化，不做汇率换算；调用方说明拆股/复权口径。

最小完整行情；改type为finance-chart并加ranges:[]即可画提供的历史：

```json
{"type":"finance-quote","source":{"label":"原创合成行情","synthetic":true},"instrument":{"id":"demo","symbol":"DEMO","name":"合成样本","currency":"USD","timezone":"UTC","asOf":"2026-10-09T10:00:00Z","marketStatus":"closed","delayMinutes":15,"price":12,"previousClose":10,"history":[{"time":"2026-10-08T10:00:00Z","price":10},{"time":"2026-10-09T10:00:00Z","price":12}]}}
```

- finance-heatmap必填asOf:S,timezone:S,weightLabel:S,changeBasis:S,cells:[cell,...]，可选initialSector:S（须存在）。
- cell:{id:S,symbol:S,name:S,sector:S,weight:P,price:P,currency:S,changePercent:N|null,asOf:S,marketStatus:M,delayMinutes:D}，最多200项、id唯一；cell.asOf不晚于整体asOf。
- weightLabel说明统一单位/口径的面积权重；changeBasis说明涨跌比较基准。正权重决定面积，0/null/小至不可表达的权重不造面积，仍在完整表。不同币种市值先由调用方统一口径，不把价格当权重。changePercent为百分数：2表示2%，0.02是0.02%。
- 正值绿、负值红、零/缺测中性，另有符号文字；色阶±10%饱和，原始幅度不被裁成±10。小格可无文字，详情与全表保留记录。行业筛选、方向键/Home/End（含无面积项）、Enter展开表及点选均由库实现。

```json
{"type":"finance-heatmap","source":{"label":"合成样本","synthetic":true},"asOf":"2026-10-09T10:00:00Z","timezone":"UTC","weightLabel":"统一合成权重","changeBasis":"较合成前收盘","cells":[]}
```

金融instrument/range/cell的id用体育英文标识规则；名称/标签1–200字符。历史/比较提供范围、真实时间X、键盘读数与全表；比较另有系列开关，隐藏不删表内记录。loading/error仍给合法必填数据并说明message，空历史/空cells保留空态，比较仍需2–6个合法标的。视图状态本地独立，update完整快照重置、dispose清理；不保存/联网。不支持K线、成交量双轴、技术指标、汇率换算或交易。反例：无来源称实时、不同币种绝对价格共轴、用各自首点冒充共同基准、按颜色饱和篡改涨跌、0/null补面积。

完整文档示例：[行情/历史/比较](../examples/supplied-finance.json)、[权重热图](../examples/supplied-heatmap.json)。

## 固定版本验证记录

2026-10-09，Skill [7276bbe](https://github.com/Micraow/Inform-UI-skill/commit/7276bbe0beb95b5ec87ef643faddd461b01d9012) 的 [CI 37874394218](https://github.com/Micraow/Inform-UI-skill/actions/runs/37874394218) 四平台通过。固定库与所有 CDN 资源来自 [f35e33b](https://github.com/Micraow/Inform-UI/commit/f35e33b146c266ecf16371733c51064129afaec3)，已修正热图选择与鼠标焦点边框的颜色；四边粗细一致性仍有待修问题，见下。

- 9 项结构/边界测试，12 份示例、48 份无效输入及根 Skill 的 5 个字面 JSON 经真实 API/CLI 验证，含确定性构建和输入不变性。
- 共 60 个浏览器视图：48 个当前示例、4 个当前根 HTML 壳、41/46 两代历史首稿各 4 个。金融与热图的 8 个明暗/桌面/390px 视图直接使用禁用缓存的 file:// 页面与固定 CDN/SRI。
- 金融：真实时间轴的 1:12 间距比例、null 断线、单点/空区间、键盘端点、共同瞬间基准、缺基准不可比、隐藏系列仍保留全表、切换范围不偷换基准、零前收盘不伪造百分比。
- 热图：60:30:10 面积比例，0/null 无面积项的键盘访问，Enter 展开全表，完整保留 −100%/+12%，行业筛选和空/加载/错误状态。
- 人工检查原始手机/桌面、明暗及交互后截图：无整页横溢、数据文字可读；热图选中颜色已调整，但后续放大视觉检查确认四边粗细不一致，此项尚未通过。手机宽表使用局部横滚；不把未入当前截图的列当作数据缺失。

原始截图在该 CI 的 `skill-current-browser` artifact，保留七天。本轮是合同与示例回归，**不是新一轮只读 Skill 作者盲测**；[41 节点](../tests/blind/README.md)与[46 节点](../tests/blind46/README.md)的输入、首稿及库合同都保持冻结。新合同也不包含尚未完成验收的转换器或未列节点。

### 尚未关闭的视觉问题

2026-10-09，进一步视觉复核确认固定 f35 版本的热图选中描边四边粗细不一致。现有功能/颜色断言不足以证明描边层级和屏幕像素宽度正确；不得将 CI 全绿表述为全部视觉细节已通过。核心库正定位并修复，随后只更换已验证的资源提交和 SRI，不改写本轮金融字段合同或历史盲测记录。
