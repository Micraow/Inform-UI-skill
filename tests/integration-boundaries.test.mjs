import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRuntime} from '../scripts/lib.mjs';

const api = await loadRuntime();
const select = ['base/layout', 'base/controls', 'base/charts'];
const profile = api.createProfile({select,viewNames:[]});
const accepted = result => {
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  return result.snapshot;
};
const withRuntime = run => {
  const runtime = api.createRuntime(profile);
  try { run(runtime); } finally { runtime.dispose(); }
};

test('data constructors are chart values and cannot become UI children', () => withRuntime(runtime => {
  accepted(runtime.commit('root = Stack([BarChart("x",["a"],[Series("s",[1])])])'));
  const invalid = runtime.commit('root = Stack([Series("s",[1])])');
  assert.equal(invalid.ok, false);
  assert(invalid.issues.some(issue => issue.code === 'CHILD_TYPE'));
  assert.equal(profile.components.Series, undefined);
  assert(profile.data.Series);
}));

test('explicit selection does not admit unrelated View constructors', () => withRuntime(runtime => {
  for (const source of [
    'root = Stack([MetricView({label:"x",value:1})])',
    'root = Stack([WeatherView({})])',
    'root = Stack([UnknownView({})])',
  ]) assert.equal(runtime.commit(source).ok, false, source);
  accepted(runtime.commit('root = Stack([Text("Still usable")])'));
}));

test('Input string limit is enforced on initial data and later state updates', () => withRuntime(runtime => {
  assert.equal(profile.schema.$defs.Input.properties.value.maxLength, 4096);
  const source = '$text = "valid"\nroot = Stack([Input("Value",$text)])';
  accepted(runtime.commit(source));
  accepted(runtime.setState({$text:'x'.repeat(4096)}));
  const before = runtime.getSnapshot();
  for (const value of ['x'.repeat(4097), null, 10, {value:'wrong'}]) {
    assert.equal(runtime.setState({$text:value}).ok, false);
    assert.equal(runtime.getSnapshot(), before, 'Rejected updates must preserve the snapshot');
  }
  assert.equal(runtime.commit('root = Stack([Input("Value",' + JSON.stringify('x'.repeat(4097)) + ')])').ok, false);
}));

test('selection membership failure rolls back other valid state changes atomically', () => withRuntime(runtime => {
  const source = '$choice = "a"\n$count = 0\nroot = Stack([Select("Choice",$choice,[{label:"A",value:"a"},{label:"B",value:"b"}]),Text("Count: " + $count)])';
  accepted(runtime.commit(source));
  const before = runtime.getSnapshot();
  assert.equal(runtime.setState({$choice:'missing',$count:7}).ok, false);
  assert.equal(runtime.getSnapshot(), before);
  assert.equal(runtime.getSnapshot().state.$count, 0);
  const after = accepted(runtime.setState({$choice:'b',$count:7}));
  assert.equal(after.state.$choice, 'b');
  assert.equal(after.state.$count, 7);
}));

test('strict objects and cross-field uniqueness remain runtime boundaries', () => withRuntime(runtime => {
  for (const options of [
    '[{label:"A",value:"a",unexpected:true}]',
    '[{label:"A",value:"a"},{label:"Again",value:"a"}]',
  ]) assert.equal(runtime.commit('root = Stack([Select("Choice","a",' + options + ')])').ok, false);
  accepted(runtime.commit('root = Stack([Select("Choice","a",[{label:"A",value:"a"}])])'));
}));

test('model text cannot acquire a host action or execute JavaScript', () => withRuntime(runtime => {
  for (const action of ['@ToAssistant("send")', '@OpenUrl("https://example.com")', '@Run("x")']) {
    assert.equal(runtime.commit('root = Stack([Button("Do",' + action + ')])').ok, false);
  }
  for (const expression of ['eval("1")', 'Function("return 1")()', 'globalThis.process']) {
    assert.equal(runtime.commit('root = Stack([Text(' + expression + ')])').ok, false);
  }
  accepted(runtime.commit('root = Stack([Text("No host services required")])'));
}));
