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
