# 当前Schema发现与组件指导

固定库：01ae9d870b221208b31e9da437ae87fdef265cec。当前运行时、CSS、完整Schema、索引与分域文件来自同一提交。基础常用能力仍内嵌[根SKILL](../SKILL.md)，完整指南供无法按需读取资料的Web Chat使用。

[机器索引](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/schema/index.json) → 所需documentSchema → 同版示例；nodeSchema只查节点字段，不含文档state，也不能把其他领域子节点当成已包含。flow/popover在base，但子form/time/chart仍需要其领域。跨域并集由核心schema-subset脚本从完整Schema自动生成，完整validateDocument继续负责语义校验。

[完整Schema](https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@01ae9d870b221208b31e9da437ae87fdef265cec/cdn/iui.schema.json)是唯一结构规范来源。本Skill的node-support库存也由scripts/derive-node-support.mjs读取同版完整Schema与索引生成，不手工维护第二份Schema。数字节/estimatedTokens仍只是文件度量/粗估，不是实测模型token或节省承诺。

## 本轮本地证据

- 独立归档并重建固定提交，21份完整示例（7新＋14原）通过真实API、确定性编译及输入不变性；7份新例另过CLI和按实际nodeOwners生成的闭合子集。
- 根与完整指南21份字面JSON通过同版validateDocument；新增49个反例拒绝，包含时间/浮层/基础增强29个和flow/icon/pulse20个。
- Node/Document根互拒、缺域包拒绝混合文档，旧6797完整Schema拒绝7份新例。
- 实际public mount的JSDOM测试确认数字草稿与权威host state边界。这不是原生浏览器证据。
- 27份历史blind/blind46/fragment-blind文件逐字节保持，旧壳与pin不改写。

## 核心与组件消费者验收

[核心CI 37892705931](https://github.com/Micraow/Inform-UI/actions/runs/37892705931)终态success，验收提交3d2c0ce23dd1532f2a6acd7f2c5ac6c697d08323；292/292核心检查、216/216 Playwright场景、42/42独立消费者视图通过。固定CDN资产01ae的11项文件实际取回并核对SHA256/SRI、MIME与CORS；验收提交没有改变该固定版运行时/CSS/Schema。

Actions实际检出的PR合并SHA为48d0701d9727bc7cd7bb2609264ddf1c7b7d4495，消费者原始RESULTS保留该值。该合并SHA与验收提交3d2c0ce的Git tree均为7611b19c6a80704ff9922eb82db9aecb62fb7646，整树相同。不要把原报告SHA改成资产pin。

42视图是7份本Skill原创JSON×390/768/1100px×明暗两主题，使用实际inline compileHtml、Chromium原生交互，覆盖计时、表单草稿/同值覆盖、嵌套浮层与flow/icon/pulse。它们不构成公开CDN的42次浏览器加载。7份示例各抽查390亮色和1100暗色共14张原图：阅读顺序、中文折行、时间数字/按钮、表格合并关系、可见面板、焦点框与明暗背景未见阻塞。闭合浮层截图不能证明所有打开状态；交互断言与核心专门浮层图另有范围。

原始报告和42张截图在上述CI的synthetic-ui-browser-evidence artifact，test-results/skill-consumer/下。全部为原创合成内容。复用这次消费者证据，Skill工作流不再重复相同42视图；本地可用check:components:browser按需复跑。

## 当前Skill回归待终态

Skill更新了固定CDN壳、派生库存和21份示例，既有工作流继续检查四平台API/CLI与Schema；88个当前视图（21例×4＋4壳，其中56固定CDN、32内嵌构建）和真实CDN索引发现仍待本次Skill工作流终态。它与上述核心/inline消费者结果分开记录。跨浏览器和真实屏幕阅读器检查未做，不计通过。

历史发现流程、旧文件字节数、旧68视图及原始CI结论见[6797历史阶段记录](schema-discovery-6797-history.md)。本轮是消费者回归，不是新一轮盲测。
