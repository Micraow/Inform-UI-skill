# 46 节点：只读根 Skill 的首次生成验收

这是独立作者只读根 `SKILL.md` 后生成的原创、全合成篮球周报与规则自测。作者没有读取实现、其他说明、Schema、fixtures 或旧输出，也没有加载库或浏览器；只检查了 JSON 语法。所有队名、赛事、赛制、场馆和数值均为教学合成数据，不对应真实赛事。原始 HTML 与 JSON 不随验收修复或重写。

输入来自 [efd40d6 的根 Skill](https://github.com/Micraow/Intelligent-UI-skill/blob/efd40d64ad81d6c79c26900ec361a328df62229a/SKILL.md)，31741 字节。完整输入及库合同独立保留，未来升级根 Skill 不改变本次实验：

- `input-skill.txt` SHA256：`15a6d47b737619ef257054c806f5a99e27f9fdfbaf560933bf6470178d1262ea`
- `basketball-weekly.html` SHA256：`2d4df5841c54a2cb43672f557f2266b36c5643bbb487f3641c0edadb3d7fab2c`
- `basketball-weekly.json` SHA256：`d4292000b1e985d0e85e4d2ebded8dcbc91d41e6d9de0573f650530a422b4e89`
- 固定库与 CDN：`f372c71d31633be85bb228f57fdb07da9e8f2112`

本地复验：`node scripts/verify-blind46.mjs --library /path/to/pinned-library`。这会检查不可变哈希、原样引导脚本、JSON 转义与一致性、API/CLI 验证、确定性构建、不变性，以及独立计算的四队赛绩/排名、分节合计和答案。首次 API/CLI 与数值验收通过。

加 `--browser --screenshots artifacts/blind46` 会在 Chromium 直接打开未经修改的 HTML，并加载真实固定 CDN/SRI；覆盖 390/1280 px、明暗主题、移动端整页溢出、赛程筛选和详情、排序保留来源名次、未赛空分数、视图独立性、严格加权多选（部分正确为 3/6，完整正确为 6/6）、回看/刷新/重来、四张闪卡翻面与 2/4 自评。首次真实浏览器验收四视图均通过，四平台 CI 全绿；详见[完整结果与保留观察](RESULTS.md)。

作者的疑问与推断保留在 `author-notes.txt`。页面末尾的“尚未实际打开验证”是首次交付时的真实声明，不因后续独立验收而修改。若验收发现问题，应分别归因于作者产物、Skill 指导、库实现或测试工具，不可修稿后称首次通过。
