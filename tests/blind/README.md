# 只读 Skill 的首次生成验收

本目录保存一位全新作者只读公开根 `SKILL.md` 后生成的原创、合成数据页面。作者没有读取源码、其他说明或样例，没有运行库、CLI 或浏览器；只做了 JSON 语法检查。HTML 和 JSON 是首次完整产物，验收不重写它们。

输入为 [cdd0499 的根 SKILL.md](https://github.com/Micraow/Intelligent-UI-skill/blob/cdd04991518f141d95a66e1d3bbf00aba9968eec/SKILL.md)，23779 字节，SHA256 `41f71c5cb1b51910b6dc33ab30694c25ac891d67aa6897c2400d40bdf5c6f8ea`。固定库/CDN 为 `7c490585f3ae4b72999b3dd5db7a0b8ee65ac417`。

相同字节的输入副本保存在 `input-skill.txt`，原库版本保存在 `library-contract.json`。这是历史验收的固定输入，里面的相对引用以当时仓库根目录为基准；今后当前根技能或库升级不改写本次证据，也不让新版本冒充最初的运行环境。

产物 SHA256：

- `weekend-plan.html`：`aea207da253b08ea313235d2aeac43db35cfba0587676b473d343b41e0bc8e47`
- `weekend-plan.json`：`37b9256ab4c41ff5521e2b409c8f7a34d17869c2aba5ff4617f45e4b44c1a704`

本地复验：`node scripts/verify-blind.mjs --library /path/to/pinned-library`。脚本核对不可变哈希、嵌入 JSON 一致、原样引导脚本、转义、真实 API/CLI 和 448 组独立数值结果。加 `--browser --screenshots artifacts/blind` 则在新 Chromium 上直接打开原 HTML，检查真实 CDN/SRI、移动/桌面与亮暗主题、表单草稿/提交/恢复、天气日期/单位切换和数值图表比例。截图仅来自本目录原创页面。

作者指出的三个未明确细节作为观察项保留：390px 的两列指标布局、成功状态在继续编辑后的变化、稀疏跨日天气时点的筛选。页面已将结果称为“当前有效输入的即时预览”，并清楚标注天气为合成样本；没有把界面推断或未实际浏览宣称为已验证。
