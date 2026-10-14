import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const generator = await read('scripts/generate-web-chat.mjs');
const heading = '## 先决定表达方式';
const end = '## 写作和交付合同';
const guidance = text => text.slice(text.indexOf(heading), text.indexOf(end));

for (const path of ['SKILL.md', 'profiles/web-chat-core/SKILL.md', 'profiles/curated-web-chat/SKILL.md']) {
  test(path + ' preserves task-driven presentation guidance from its generator', async () => {
    const skill = await read(path);
    assert(skill.includes(heading));
    assert.match(skill, /^# Inform HTML 答案：(?:基础版|精选视图版)$/m);
    assert(!skill.includes('# Inform 互动答案：基础与图表'));
    assert.equal(guidance(skill), guidance(generator));
    for (const principle of ['表达目标与关系类型', '文字足以说清时可以只用文字', '区分数量关系与非数量关系', '交互必须服务于当前问题', '不默认在结尾添加可点清单', '凑组件覆盖率', '不是回答结构模板']) {
      assert(skill.includes(principle), principle);
    }
    assert(!skill.includes('默认使用 Inform 基础组件与图表'));
    // Keep the approved repetition syntax alongside editorial guidance.
    assert(skill.includes('@Each(array,"item",内联模板)'));
    assert(skill.includes('## 让组件接续正文'));
    assert(skill.includes('后续正文接着解释观察结果和适用边界'));
    assert(skill.includes('Alert 仅用于真实风险'));
    assert(skill.includes('不要给原句强加空格来迁就解析'));
    const compact = skill.match(/```openui\n([\s\S]*?)\n```/)[1];
    assert(!/\b(?:Card|Badge)\(/.test(compact));
  });
}

test('curated starter omits an automatic end-of-answer checklist without removing its API', async () => {
  const source = await read('source/views.openui');
  assert(!source.includes('ChecklistView('));
  assert.equal(await read('profiles/curated-web-chat/minimal.openui'), source);
  const html = await read('profiles/curated-web-chat/minimal.html');
  const config = JSON.parse(html.match(/<script id="inform-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(config.source, source);
  assert(config.viewNames.includes('ChecklistView'));
  assert((await read('profiles/curated-web-chat/prompt.txt')).includes('ChecklistView('));
  assert(!(await read('scripts/verify-web-chat.mjs')).includes('Starter must demonstrate'));
});

const layoutHeading = '## 布局也是表达的一部分';
const layoutGuidance = text => text.slice(text.indexOf(layoutHeading), text.indexOf(end));
for (const path of ['SKILL.md', 'profiles/web-chat-core/SKILL.md', 'profiles/curated-web-chat/SKILL.md']) {
  test(path + ' teaches content-led text layout without requiring a card template', async () => {
    const skill = await read(path);
    assert(skill.includes(layoutHeading));
    assert.equal(layoutGuidance(skill), layoutGuidance(generator));
    assert(skill.indexOf(layoutHeading) < skill.indexOf('## 同源自动生成的 DSL 合同'));
    for (const principle of [
      '即使只有文字', '真实章节层级', '组与组间距较大', '连续论述用纵向流',
      '不要用空格凑列', '行宽与阅读节奏', 'responsive:"stack"', 'wrap:"wrap"',
      '没有任意 CSS、像素宽度、行高或断点参数', '避免卡片套卡片',
      '不强制标题、摘要、卡片或固定结尾', '不把这些检查转成每份答案都必须出现的版式清单',
    ]) assert(layoutGuidance(skill).includes(principle), principle);
  });
}

test('text-only layout advice uses the actual profile contracts without cards or extra Views', async () => {
  const {loadRuntime} = await import('../scripts/lib.mjs');
  const api = await loadRuntime();
  // Original, domain-neutral contract exercise; not a mandatory answer template.
  const source = `
root = Stack([
  Heading("Overview",1),
  Text("The main answer.","default","start","lg","semibold"),
  Stack([
    Heading("Details",2),
    Text("A complete paragraph follows the reading order."),
    Text("Supporting context.","muted","start","sm")
  ],"sm"),
  Grid([
    Stack([Heading("First",3),Text("One related point.")],"xs"),
    Stack([Heading("Second",3),Text("Another related point.")],"xs")
  ],2,"md","stack"),
  Row([Text("Label"),Text("Value")],"sm","start",{wrap:"wrap",distribution:"natural",justify:"start"}),
  Box([Text("A short supporting note.")],{width:"full",padding:"sm",gap:"xs",background:"transparent"})
],"lg")`;
  for (const directory of ['web-chat-core', 'curated-web-chat']) {
    const config = JSON.parse(await read('profiles/' + directory + '/profile.json'));
    const runtime = api.createRuntime(api.createProfile({select:config.select,viewNames:config.viewNames}));
    try {
      const result = runtime.commit(source);
      assert.equal(result.ok, true, JSON.stringify(result.issues));
    } finally { runtime.dispose(); }
  }
});

const compositionHeading = '## 从内容关系组合组件';
const compositionGuidance = text => text.slice(text.indexOf(compositionHeading), text.indexOf(end));
for (const path of ['SKILL.md', 'profiles/web-chat-core/SKILL.md', 'profiles/curated-web-chat/SKILL.md']) {
  test(path + ' teaches composition from relationships within finite DSL capabilities', async () => {
    const skill = await read(path);
    assert(skill.includes(compositionHeading));
    assert.equal(compositionGuidance(skill), compositionGuidance(generator));
    for (const principle of [
      '先拆出内容单元', '先定外层排布，再填内层组件', '并列单元共享的标题',
      '有文字标签的 Box', 'Divider 是主题分隔线', '没有绝对坐标、自由连线或任意绘图能力',
      '外层组与内层条目分别展开', '模板必须内联', '读取同一份派生结果', '没有交互需求就保持静态组合',
    ]) assert(compositionGuidance(skill).includes(principle), principle);
  });
}

test('original nested composition validates in both profiles using only foundation components', async () => {
  const {loadRuntime} = await import('../scripts/lib.mjs');
  const api = await loadRuntime();
  const source = `
sections = [
  {title:"First",items:[{label:"A",detail:"A short explanation."},{label:"B",detail:"A longer explanation stays within the same information structure."}]},
  {title:"Second",items:[{label:"C",detail:"Another point."}]}
]
root = Stack([
  Heading("Related information",1),
  Text("Shared context belongs before the parallel groups."),
  Grid(@Each(sections,"section",Stack([
    Heading(section.title,2),
    Stack(@Each(section.items,"item",Box([
      Row([Icon("Info","Supporting point"),Text(item.label,"default","start","md","semibold")],"sm","start",{wrap:"wrap"}),
      Text(item.detail)
    ],{background:"surface",padding:"sm",gap:"xs",width:"full"})),"sm")
  ],"sm")),2,"lg","stack"),
  Text("Shared supporting context follows the groups.","muted","start","sm")
],"lg")`;
  for (const directory of ['web-chat-core', 'curated-web-chat']) {
    const config = JSON.parse(await read('profiles/' + directory + '/profile.json'));
    const runtime = api.createRuntime(api.createProfile({select:config.select,viewNames:config.viewNames}));
    try {
      const result = runtime.commit(source);
      assert.equal(result.ok, true, JSON.stringify(result.issues));
    } finally { runtime.dispose(); }
  }
});
