# 三种有限学习候选

仅用于 26ec211fa529516af3b1523248f5912c45ec64c6 同版待验资产；不搭配历史 d370 CDN。common/base 指导仍在 [SKILL.md 第7节](../SKILL.md#7-隔离候选30-项本地组件指导尚未浏览器验收)；完整规范仍为源仓库生成的 src/schema/iui.schema.json，本文件不是替代 Schema。候选 [分类索引](../candidates/pending-batch/category-index.json) 从同一完整 Schema 和索引生成。

所有字段是字面值；没有表达式、bind、可执行代码或网络地址字段，提供的文字始终按字面显示。答案随 JSON 一起公开；不适合保密考试，也不验证掌握程度或保存学习记录。长度为 Unicode 码点，共享全局预算仍适用。key 为英文字母/下划线开头，后接字母、数字、下划线、点或短横线，总长1–80。

## 句中填空：fill-blank

需要围绕真实空位练习时用，不把未知事实写成唯一答案。

- 必填 title（1–200）、parts（1–50）、blanks（1–12）。可选普通id、description（0–2000）。
- 每个part是0–2000字符的字面字符串，或 {blank:key}。
- 每个blank是 {id,label,answers,hint?,explanation?}：label为1–200，answers为1–8个1–200字符，hint≤1000，explanation≤2000。
- 每个定义恰好出现一次，禁止重复、遗漏、未引用定义。答案经trim后非空且不重复，剩余CR/LF非法。不同组件可重用局部id。
- 比较仅 draft.trim() === answer.trim()，区分大小写，不做Unicode规范化、数值等价、模糊或AI评分。给出所需显式别名，不自创宽容算法。
- 空白或超过200码点的草稿属于未完成，不判错、不截断；显示反馈与首次未完成焦点遵循句子顺序。Check不累加积分；修改清除旧反馈。Reveal保留草稿并进入未评分参考模式，Retry清空。
- 禁止放入form（含深层）；完整同级form允许。局部草稿不写state、网络或持久存储；无关state更新保留草稿，合法整文update重建。

```json candidate-only
{"version":"iui/1","body":[{"type":"fill-blank","title":"原创填空练习","parts":["水的化学式是 ",{"blank":"water"},"。"],"blanks":[{"id":"water","label":"化学式","answers":["H2O","H₂O"],"explanation":"两种写法是显式提供的可接受参考，不做自动规范化。"}]}]}
```

## 排序句子：sentence-builder

- 必填 title（1–200）、tokens（1–30个{id,text}）、answer（所有token id恰好一次的有序数组）。text为1–200字符，id唯一；可见文本允许重复，评分仍比身份顺序。
- 可选 prompt≤2000、joiner（只能" "或""，默认空格）、explanation≤2000、普通id。joiner只用于预览，不推断分词、语法、标点或翻译。
- 原始token bank顺序保留；选择、前后移动、移除、Check、Reveal、Retry全是本地操作。未齐全不判错；修改清除旧判断。Reveal不修改用户排列，但此后检查明确为参考辅助；Retry才开始新尝试。
- 禁止位于form，允许完整同级form。无共享state、权重评分、远程答案、持久化、拖拽协议或自定义回调。隐藏tab保留局部状态。

```json candidate-only
{"version":"iui/1","body":[{"type":"sentence-builder","title":"按提供的身份排序","tokens":[{"id":"second","text":"I"},{"id":"verb","text":"am"},{"id":"first","text":"I"}],"answer":["first","verb","second"],"joiner":" ","explanation":"重复文字仍对应不同的作者token身份。"}]}
```

## 词汇卡：vocab-card

- 必填 term（1–200）、senses（1–10个{id,meaning,translation?,examples?}）。id局部唯一；meaning为1–2000；translation为0–1000；examples为0–5个1–2000字面字符串。
- 可选 languageLabel/partOfSpeech（1–200）、pronunciation（1–500）、普通id；未知元数据省略，不写空串。pronunciation只是供数字符串，不播放或生成语音。
- 显示/隐藏释义与Again/Familiar自评独立；揭晓不算评分，隐藏保留选择，Reset review清空。不是词典查询、能力诊断、间隔重复调度或保存记录。
- 允许位于form，但无可提交字段，按钮不会提交，禁用/busy fieldset照常限制操作。未知字段、HTML、链接、媒体、音频、麦克风、state绑定或初始评分被拒绝。

```json candidate-only
{"version":"iui/1","body":[{"type":"vocab-card","term":"finite","languageLabel":"English","senses":[{"id":"bounded","meaning":"Having a limit.","translation":"有限的","examples":["This is a finite local exercise."]}]}]}
```

三个组件都属于learning，单独Document包包含base+learning。跨forms/time等领域必须依照实际节点取并集，而不是因为外层tabs归base就省掉learning。无需学习交互时用正文即可。本地语义、DOM测试和编译不证明真实浏览器、辅助技术或视觉验收。
