# 金额与交易供数合同（后续候选，未验收）

asset-distribution、transaction-list 归 finance。通过未来同版索引选择 finance Document Schema（默认含 base）与 finance-lists.json；若同时使用 forms/charts 等领域，选择生成的并集或完整 Schema，最后仍运行公共 validateDocument。只从完整规范生成分片，不手写另一份 Schema。

## asset-distribution

必有 label:1–200字符、accounts:0–40；可选 description:最多2000、observedAt:1–200字面观察标签、source:{label,url}、普通 id。每条账户 {id:key,name,amount,currency,category?,note?}：id 局部唯一，name/category短文字1–200；amount 为 null 或0–1e12有限非负数，currency恰为三位大写ASCII，note最多2000。

按币种首次出现顺序分组、按供数顺序保留每条记录。null 保持未知，不参与已知小计/装饰份额；0 保持0；全部未知时小计不可用，全0时不伪造百分比。没有跨币种合计、换汇、账户连接或金融建议。小计按输入数字最短十进制表示相加，不强制分/分币舍入，不宣称会计级核算。小数、科学计数和次正规正数合法；准确值表格承载意义，不只依赖颜色或条宽。多币种时出现本地币种筛选。

## transaction-list

必有 label、transactions:0–100；可选 description、source、普通 id。每项 {id:key,date,description,amount,currency,direction,status?,counterparty?,note?}：id局部唯一，date为真实 YYYY-MM-DD（1000–9999），description1–1000字符，amount为0–1e12有限非负数，currency三位大写ASCII，direction=debit/credit；status=pending/posted，缺省明确未提供，counterparty短文字、note最多2000。

金额是幅值，方向另列；不从正负号推断借贷，不生成余额/跨币种总额，不把 posted 当结算保证。允许日期/文字/数额重复，保留来源顺序，不排序、设备时区转换或系统时钟判断。原生方向与月份筛选共同隐藏既有行；重置到 All、重复重置保留焦点。空输入与无匹配不同。窄屏表格使用自身可聚焦滚动区，不能让整页横向溢出。

## 本地行为与来源

无 bind、控件name、FormData、host action快照、host event、轮询、存储、账户、支付或转账。无关状态更新保留筛选/行/details/焦点；update重置，dispose移除监听与失效排队reset。原生外层reset默认动作之后协调，取消/disabled/pending/hidden/inert及较新输入必须保留一致性。安全绝对HTTP(S)来源链接不含凭据/伪装空白/危险scheme，打开新页并使用noopener noreferrer与no-referrer；没有预取。

```json candidate-only
{"version":"iui/1","body":[{"type":"asset-distribution","label":"原创合成金额，非真实账户","accounts":[{"id":"zero","name":"已提供零值","amount":0,"currency":"USD"},{"id":"unknown","name":"未提供金额","amount":null,"currency":"USD"},{"id":"other","name":"另一币种独立展示","amount":2.5,"currency":"EUR"}]},{"type":"transaction-list","label":"原创合成记录，未发生支付","transactions":[{"id":"entry","date":"2028-02-29","description":"示例记录","amount":0,"currency":"USD","direction":"debit"}]}]}
```
