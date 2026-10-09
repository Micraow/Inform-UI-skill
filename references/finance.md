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

金融instrument/range/cell的id用体育英文标识规则；名称/标签1–200字符。行情/比较的范围、系列开关、真实时间X、键盘读数与全表由库提供；隐藏系列不删除表内记录。loading/error仍给合法必填数据并说明message，空历史/空cells保留空态，比较仍需2–6个合法标的。视图状态本地独立，update完整快照重置、dispose清理；不保存/联网。不支持K线、成交量双轴、技术指标、汇率换算或交易。反例：无来源称实时、不同币种绝对价格共轴、用各自首点冒充共同基准、按颜色饱和篡改涨跌、0/null补面积。

完整文档示例：[行情/历史/比较](../examples/supplied-finance.json)、[权重热图](../examples/supplied-heatmap.json)。
