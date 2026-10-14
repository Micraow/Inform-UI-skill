import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadRuntime} from '../scripts/lib.mjs';

const api = await loadRuntime();
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const profile = api.createProfile({select:['base/layout','base/text','base/controls'],viewNames:[]});
const accept = result => {
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  return result.snapshot;
};
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree.type === 'element' ? [tree] : [], ...Object.values(tree).map(value =>
    Array.isArray(value) ? value.flatMap(nodes) : nodes(value))].flat();
}
const find = (snapshot, name, predicate = () => true) => nodes(snapshot.tree)
  .find(node => node.typeName === name && predicate(node.props));
const compactSource = (await read('references/repeated-structures.md')).match(/```openui\n([\s\S]*?)\n```/)[1];
const fullSource = await read('examples/repeated-groups.openui');

for (const path of ['SKILL.md','profiles/web-chat-core/SKILL.md','profiles/curated-web-chat/SKILL.md']) {
  test(path + ' teaches repeated-structure selection before the generated contract', async () => {
    const skill = await read(path);
    const guidance = skill.split('## 同源自动生成的 DSL 合同')[0];
    assert(guidance.includes('优先写数据数组 + @Each'));
    assert(guidance.includes('分组内仍有重复时嵌套 @Each'));
    assert(guidance.includes('内层模板可读取外层 item'));
    assert(guidance.includes('不同结构的少量段落不必强行统一模板'));
    assert(guidance.includes('references/repeated-structures.md'));
    assert.equal(guidance.match(/```openui\n([\s\S]*?)\n```/)[1], compactSource);
    const directory = path.startsWith('profiles/curated') ? 'curated-web-chat' : 'web-chat-core';
    const selection = JSON.parse(await read('profiles/' + directory + '/profile.json'));
    const runtime = api.createRuntime(api.createProfile({select:selection.select,viewNames:selection.viewNames}));
    try { accept(runtime.commit(compactSource)); } finally { runtime.dispose(); }
  });
}

test('nested data templates expand to the same component tree as explicit components', () => {
  const expanded = 'root = Stack([Card([Row([Badge("甲"),Badge("乙")],"sm")],"第一组"),Card([Row([Badge("丙")],"sm")],"第二组")],"md")';
  const loop = api.createRuntime(profile), explicit = api.createRuntime(profile);
  try {
    assert.deepEqual(accept(loop.commit(compactSource)).tree, accept(explicit.commit(expanded)).tree);
  } finally { loop.dispose(); explicit.dispose(); }
});

test('complete nested example retains empty groups and captures every group/item pair', () => {
  const runtime = api.createRuntime(profile);
  try {
    let snapshot = accept(runtime.commit(fullSource));
    assert.deepEqual(nodes(snapshot.tree).filter(node => node.typeName === 'Card').map(node => node.props.title), ['绘画桌','手作桌','备用桌']);
    assert(find(snapshot,'Text',props => props.content === '这组暂无材料。'));
    assert.equal(nodes(snapshot.tree).filter(node => node.typeName === 'Button').length, 4);
    for (const pair of ['绘画桌 / 纸张','绘画桌 / 画笔','手作桌 / 剪刀']) {
      const action = find(snapshot,'Button',props => props.label === '选择 ' + pair).props.onPress;
      snapshot = accept(runtime.dispatchLocal(action));
      assert.equal(snapshot.state.$chosen, pair);
      assert(find(snapshot,'Text',props => props.content === '当前选择：' + pair));
      assert.equal(runtime.dispatchLocal(action).ok, false, 'a previous revision handle stays invalid');
    }
    snapshot = accept(runtime.dispatchLocal(find(snapshot,'Button',props => props.label === '清空选择').props.onPress));
    assert.equal(snapshot.state.$chosen, '');
    assert(find(snapshot,'Button',props => props.label === '清空选择').props.disabled);
  } finally { runtime.dispose(); }
});

test('an empty outer array yields a valid empty child slot', () => {
  const runtime = api.createRuntime(profile);
  try {
    const source = 'groups = []\n' + compactSource.split('\n').slice(1).join('\n');
    const snapshot = accept(runtime.commit(source));
    assert.deepEqual(snapshot.tree.props.children, []);
  } finally { runtime.dispose(); }
});

test('the documented no-index and inline-scope boundaries reject invented loop forms', () => {
  const runtime = api.createRuntime(profile);
  try {
    for (const source of [
      'items = ["甲"]\ntile = Badge(item)\nroot = Stack(@Each(items,"item",tile))',
      'root = Stack(@Each(["甲"],"item",Badge(item),"index"))',
      'root = Stack(@ForEach(["甲"],"item",Badge(item)))',
    ]) assert.equal(runtime.commit(source).ok, false, source);
  } finally { runtime.dispose(); }
});
