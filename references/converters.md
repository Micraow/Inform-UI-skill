# 单位与货币换算的生成合同

根Skill已内嵌以下内容，普通Web Chat不必额外打开此文件。此处便于专题查阅。

### 换算：单位与调用方汇率快照

已知物理单位之间的量用unit-converter；已提供同一基准币种汇率快照的金额换算用currency-converter。只需一句固定换算结果时可直接用正文；读者需要改数值/单位才加组件。金融行情比较仍只比较各自币种的相对变化，不会自动调用货币换算器。两个转换器均为本地组件，不读写文档state、不联网取报价、不交易、不保存输入；字段均为字面值，不填V、bind或API端点。

#### 单位换算

必填{type:"unit-converter",category:类别,amount:N,from:单位ID,to:单位ID}；可选id:S,title:S,precision:1..12整数,temperatureMode:"absolute"|"difference"。precision为最大有效数字数（默认8），不是小数位数。temperatureMode只可用于temperature，默认absolute。from/to大小写敏感，必须同属category；不要把显示标签或单位符号猜成ID。

| category | 用途 | 可用单位ID |
| --- | --- | --- |
| length | 长度/带方向的位移 | m, cm, mm, km, in, ft, yd, mi, nmi |
| mass | 质量 | kg, g, mg, t, lb, oz |
| temperature | 温度或温差 | K, C, F |
| speed | 速度 | m-s, km-h, ft-s, mph, kn |
| area | 面积 | m2, cm2, km2, ft2, ha, acre |
| volume | 体积 | L, mL, m3, gal-us, gal-imp |
| time | 固定时长 | s, ms, min, h, d |
| pressure | 压强 | Pa, kPa, MPa, bar, atm, psi |
| data | 数据量 | B, bit, kB, MB, GB, KiB, MiB, GiB |

absolute计入温标偏移，不得低于绝对零度（0K、−273.15°C、−459.67°F）；difference只换算带符号温差，不加偏移，如10Δ°C=18Δ°F。其他类别允许负值但调用方需解释其含义。kB/MB/GB为十进制，KiB/MiB/GiB为二进制，B是字节、bit是比特；日为86400秒固定时长，不代表日历月份/年份或时区计算；gal-us为美制液体加仑，gal-imp为英制，不含美制干量加仑或美国测量英尺。

```json
{"type":"unit-converter","title":"把长度换成厘米","category":"length","amount":1.25,"from":"m","to":"cm","precision":8}
```

温差例：把上述节点改为category:"temperature",amount:10,from:"C",to:"F",temperatureMode:"difference"。不要用absolute算温差。单位组件没有status/message；非法初始温度或类别混用会被验证拒绝。

#### 货币快照换算

必填{type:"currency-converter",amount:N,base:S,rates:[{currency:S,rate:P},...],asOf:S,source:{label:S,synthetic:B,url?:S}}。这里P仅为正有限汇率或null，0不是有效汇率；amount可为任何有限数。可选id:S,title:S,from:S,to:S,precision:1..12整数,status:"ready"|"loading"|"error",message:S。

- base/from/to/currency均为3个大写字母；是调用方标识，库不查询ISO名录或据代码判可交易性。rates最多200项，currency不重复。rate表示1单位base能换多少该币种；base隐含1，若显式提供必须为1。
- from默认base；to默认第一个不同于from的币种，没有则同币种。指定的from/to必须是base或rates中已有币种。相同币种保留数值；跨币种缺测即使amount=0也不可换算，不补零、不借其他时刻报价。
- asOf须是带Z/明确偏移的有效ISO时间；source标签与synthetic必填，url仅安全公开HTTPS出处、不自动读取。不把合成汇率称为当前市场价，不因本地时钟变化声称已刷新或准确实时。
- 结果按两个相对base的汇率交叉换算，未计费用、买卖价差、税务或结算规则。用于明确说明的快照试算，不作为可执行交易报价。

```json
{"type":"currency-converter","title":"合成汇率快照试算","amount":100,"base":"USD","from":"USD","to":"EUR","asOf":"2026-10-09T09:00:00+08:00","source":{"label":"作者原创合成汇率，非实时报价","synthetic":true},"rates":[{"currency":"EUR","rate":0.8},{"currency":"GBP","rate":null}]}
```

组件提供数值输入、单位/币种选择、互换、重置和可见结果。互换只换from/to，amount不变；重置恢复节点初始值。单位类别切换保留数值、改选新类别的有效单位。接受十进制/科学记数法；空串、1e等未完成值、千位分隔符、十六进制、NaN/Infinity不当作0，保留草稿并报错。极小非零值用科学记数法，结果无法表示则说明错误；显示舍入，原始值保留在结果提示。来源/带偏移时刻/完整汇率/缺测均可查看。

currency的空rates显示空态；loading/error仍提供合法必填字段，配message，隐藏计算控件但保留来源/时刻。换新快照用controller.update完整文档，重置本地选择；dispose清理事件。反例：把1USD→0.8EUR反写成1EUR→0.8USD、混用KB/KiB、温差加32、把缺汇率或空草稿当0、承诺转账/成交/自动刷新，均不成立。

[完整原创示例](../examples/local-converters.json)。
