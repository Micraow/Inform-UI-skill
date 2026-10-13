---
name: inform-interactive-answers
description: 用 Inform 的 OpenUI 派生 DSL 生成打开即可阅读和交互的完整 HTML 答案。适用于带文字、图表、图片、领域视图和本地筛选控件的解释、比较与探索；使用已构建的 browser JS，无需创建 React 工程。
---

# Inform 互动答案

交付一份完整答案，而不是组件陈列页：先回答问题，再用有目的的图文与交互帮助理解。输出 HTML，使用提供的 Inform browser bundle 和 DSL；框架与图表依赖已在 bundle 内。不要创建 React 工程、安装运行时依赖、套用旧 iui1 JSON 或自行实现另一套解释器。

## 最短路径

1. 确认实际 runtime 文件或已验证的固定版本 URL。随附 assets/runtime/inform-ui.global.js 是可用本地 bundle；版本与 SHA-256 见 generated/runtime-lock.json。未给公开地址时，使用同目录相对路径并交付该文件，不能猜 CDN 路径、latest 或发布状态。
2. 读 references/catalog.md 找所需模块；先读取相关 generated/modules/*.txt；领域组件可进一步只读 generated/views/<ViewName>.txt。模块 prompt 来自实际 createProfile({select,viewNames}).prompt({bindings:true,builtinFunctions:true})。base/* 是基础组件与图表；views/* 是领域组合视图；Series 等是数据构造器，不能放进 UI children。按分类发现 glyph，别把完整图标目录放入 prompt。
3. 按下面的壳写 HTML，并在 JSON 配置的 source 字符串里放 DSL。只使用已选模块中的签名与数据结构。完整范例见 examples/；语法边界见 references/dialect.md，交付与宿主限制见 references/delivery.md。
4. 有终端时运行 scripts/inform-answer.mjs check，再用 build 生成安全壳。无终端时沿用壳与已验证范例；不要声称运行过检查。HTML 打开后应直接呈现答案，而不是让读者点击“生成”或粘贴代码。

## 固定 HTML 壳

以下为最小可运行例。实际输出应有准确标题、语言、完整答案和可见加载失败提示；CLI 会生成这些。JSON 内字符串必须用 JSON.stringify 转义，并将所有 `<` 转为 `\u003c`，避免正文中的 `</script>` 提前结束数据块。

```html
<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>答案</title>
<main id="answer"></main>
<script id="document" type="application/json">{"source":"root = Stack([Heading(\"答案\",1),Text(\"这里写完整解释。\")])","select":["base/layout"]}</script>
<script src="./inform-ui.global.js"></script>
<script>
const config = JSON.parse(document.getElementById('document').textContent);
const view = InformUI.mount(document.getElementById('answer'), config);
addEventListener('pagehide', () => view.dispose(), {once:true});
</script>
</html>
```

mount 接受 source、select、viewNames、theme（light/dark）；样式随 bundle 注入。select 选模块，viewNames 进一步限定所选模块中的领域 View；两者限定可用组件和 prompt 范围，不会使已下载的完整 JS 变小。允许的其他宿主选项与生命周期见 references/delivery.md。

## DSL 必须遵守

- 每条声明独占一行；最终 root 必须是 Stack。组件参数按位置传递，只有末尾可选参数能直接省略。对象数据内使用 key:value，不能把组件调用写成命名参数。
- 普通变量承载数据或组件；$state = default 显式声明可变状态。每次完整 commit 会重置默认状态；阅读中的交互通过绑定与本地 Action 完成。
- 算术 + - * / %；比较 == != < <= > >=；布尔逻辑 && || !；三元条件。数值必须有限，条件必须是 boolean，除零会报错。
- 数据访问用 row.field、array[index]。@Filter(rows,"score",">=",$minimum)、@Sort(rows,"score","desc") 和 @Each(rows,"row",Text(row.name))；无箭头函数、回调、JS 方法、任意脚本。
- 控件绑定传 $state。Button 的动作使用 @Set($state,expression)、@Reset($state) 或 Action([@Set(...),@Reset(...)])。先检查组件有哪些 binding/action props；不能把普通 JSON 当动作。
- 纯函数、精确参数与严格差异见 references/dialect.md。这是固定 OpenUI 派生方言，不代表全部上游能力或语义；不宣传未测 token 节省。

## 让答案真正有用

保留问题所需的论述、依据、假设和结论。图表补充文字解释与数据表；图片必须有 alt 与必要图注；用有语义的标题和可理解的控件标签。单位、范围、日期、数据来源应可见。真实资料与原创示例数据分别标注，不伪造引用、最新行情或查询结果。

交互应改变读者关心的结果：筛选后同步更新图表、表格与统计值；处理空集合、极值、重置和原选择失效。保留可见的文本结果，不靠颜色或图标传达唯一含义。图标使用准确官方名称，运行 icons --query 只拿相关候选。

宿主服务不由 DSL 名称自动获得：查询、订票、支付、发送、地图/媒体加载等必须另有真实宿主集成与授权。外部 intent 视图最多展示所给数据与明确的不可用状态，不得假装执行成功。
