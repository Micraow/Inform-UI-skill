import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadRuntime} from '../scripts/lib.mjs';

const api = await loadRuntime();
const profile = api.createProfile({select:['base/layout','base/code'],viewNames:[]});
const commit = source => {
  const runtime = api.createRuntime(profile);
  try { return runtime.commit(source); } finally { runtime.dispose(); }
};
const accepted = source => assert.equal(commit(source).ok, true, source);

test('Code and its CodeView compatibility alias belong to the foundation module', () => {
  for (const name of ['Code','CodeView']) {
    const component = profile.manifest().components.find(item => item.name === name);
    assert(component, name);
    assert.equal(component.moduleId, 'base/code');
    assert.deepEqual(component.orderedProps, ['data']);
    accepted(`root = Stack([${name}({value:"const n = 1;",language:"javascript"})])`);
    accepted(`root = Stack([${name}(CodeData("const n = 1;","javascript"))])`);
  }
  assert(profile.data.CodeData);
  assert.equal(profile.components.MetricView, undefined);
});

test('code display accepts omitted enhancements and individual block opt-outs', () => {
  for (const data of [
    '{value:"plain text"}',
    '{value:"const n = 1;",language:"javascript"}',
    '{value:"unrecognized grammar",language:"example-language"}',
    ...['copy','highlight','showLanguage'].map(flag => `{value:"sample",${flag}:false}`),
    '{value:"sample",copy:false,highlight:false,showLanguage:false}',
    '{value:"sample",inline:true}',
    '{value:"sample",inline:true,copy:false,highlight:false,showLanguage:false}',
  ]) accepted(`root = Stack([Code(${data})])`);
});

test('older exact CodeView selections still resolve to the foundation alias', () => {
  const legacy = api.createProfile({select:['base/layout','views/content'],viewNames:['CodeView']});
  assert.equal(legacy.manifest().components.find(item => item.name === 'CodeView').moduleId, 'base/code');
  assert(legacy.components.Code);
  assert.equal(legacy.components.MetricView, undefined);
  const runtime = api.createRuntime(legacy);
  try {
    assert.equal(runtime.commit('root = Stack([CodeView({value:"echo hello",language:"bash",highlight:true,copy:true})])').ok, true);
  } finally { runtime.dispose(); }
});

test('inline code rejects explicit enhancements and all code keeps strict data bounds', () => {
  for (const name of ['Code','CodeView']) {
    for (const flag of ['copy','highlight','showLanguage']) {
      assert.equal(commit(`root = Stack([${name}({value:"sample",inline:true,${flag}:true})])`).ok, false);
    }
    for (const data of ['{value:"x",unexpected:true}', '{value:"x",language:""}', '{value:7}', '{language:"javascript"}']) {
      assert.equal(commit(`root = Stack([${name}(${data})])`).ok, false);
    }
    accepted(`root = Stack([${name}({value:${JSON.stringify('x'.repeat(12000))}})])`);
    accepted(`root = Stack([${name}({value:${JSON.stringify('😀'.repeat(12000))}})])`);
    assert.equal(commit(`root = Stack([${name}({value:${JSON.stringify('😀'.repeat(12001))}})])`).ok, false);
    assert.equal(commit(`root = Stack([${name}({value:${JSON.stringify('x'.repeat(12001))}})])`).ok, false);
  }
});

test('both bundled profile selections include foundation code without a CodeView filter', async () => {
  const definitions = JSON.parse(await readFile(new URL('../source/profiles.json',import.meta.url),'utf8'));
  for (const definition of definitions) {
    assert(definition.select.includes('base/code'), definition.id);
    assert(!definition.viewNames.includes('CodeView'), definition.id);
    const selected = api.createProfile({select:definition.select,viewNames:definition.viewNames});
    assert(selected.components.Code, definition.id);
    assert(selected.components.CodeView, definition.id);
  }
  const prompt = await readFile(new URL('../generated/modules/base--code.txt',import.meta.url),'utf8');
  for (const name of ['Code','CodeView']) assert(prompt.split('\n').some(line => line.startsWith(name+'(')));
  assert(prompt.includes('showLanguage'));
  const notices = await readFile(new URL('../assets/runtime/THIRD_PARTY_NOTICES.txt',import.meta.url),'utf8');
  assert.match(notices, /highlight\.js/i);
});
