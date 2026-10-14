import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadRuntime} from '../scripts/lib.mjs';
import {componentTables,begin,end} from '../scripts/readme-components.mjs';

const api = await loadRuntime();
const profile = api.createProfile({select:['base/layout','base/text'],viewNames:[]});
const read = path => readFile(new URL('../' + path,import.meta.url),'utf8');
const run = source => {
  const runtime = api.createRuntime(profile);
  try { return runtime.commit(source); } finally { runtime.dispose(); }
};
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree.type === 'element' ? [tree] : [], ...Object.values(tree).map(value =>
    Array.isArray(value) ? value.flatMap(nodes) : nodes(value))].flat();
}

test('both Skill profile selections expose the matched foundation layout contract', async () => {
  for (const directory of ['web-chat-core','curated-web-chat']) {
    const config = JSON.parse(await read('profiles/' + directory + '/profile.json'));
    const selected = api.createProfile({select:config.select,viewNames:config.viewNames});
    const byName = new Map(selected.manifest().components.map(component => [component.name,component]));
    assert.deepEqual(byName.get('Box').orderedProps,['children','options']);
    assert.deepEqual(byName.get('Text').orderedProps,['content','tone','align','size','weight']);
    assert.deepEqual(byName.get('Row').orderedProps,['children','gap','align','options']);
    assert.deepEqual(byName.get('Grid').orderedProps,['children','columns','gap','responsive']);
    assert.equal(byName.get('Box').moduleId,'base/layout');
  }
});

test('new layout tokens and old positional forms validate with the bundled runtime', () => {
  for (const source of [
    'root = Stack([Text("Old form"),Row([Text("Wrapped")]),Grid([Text("A")],2),Card([Text("Body")],"Title")])',
    'root = Stack([Box([Text("New form","info","center","xs","semibold")],{background:"info",padding:"md",gap:"xs",radius:"sm",width:"grow",minHeight:"sm"})])',
    'root = Stack([Row([Text("A"),Text("B")],"sm","center",{wrap:"nowrap",distribution:"equal",justify:"between"}),Grid([Text("A")],8,"xs","preserve")])',
  ]) {
    const result = run(source);
    assert.equal(result.ok,true,JSON.stringify(result.issues));
  }
});

test('layout extensions retain finite tokens and exact column bounds', () => {
  for (const expression of [
    'Box([],{style:"color:red"})','Box([],{width:200})','Box([],{background:"#fff"})',
    'Text("A","default","left")','Text("A","default","start","12px")',
    'Row([],"sm","center",{justify:"space-around"})','Grid([],0)','Grid([],9)',
    'Grid([],1.5)','Grid([],8,"xs","never-wrap")',
  ]) assert.equal(run('root = Stack([' + expression + '])').ok,false,expression);
});

test('the original two-layer teaching fixture uses eight real grid columns and 65 nodes', async () => {
  const result = run(await read('tests/fixtures/foundation-layered-work.openui'));
  assert.equal(result.ok,true,JSON.stringify(result.issues));
  const tree = nodes(result.snapshot.tree);
  assert.equal(tree.length,65);
  assert.deepEqual(tree.filter(node => node.typeName === 'Grid').map(node => node.props.columns),[1,2,4,8]);
  assert(tree.filter(node => node.typeName === 'Grid').every(node => node.props.responsive === 'preserve'));
});

test('README folded component tables are generated from both exact profile manifests', async () => {
  const core = JSON.parse(await read('profiles/web-chat-core/manifest.json'));
  const curated = JSON.parse(await read('profiles/curated-web-chat/manifest.json'));
  const readme = await read('README.md');
  assert.equal(readme.slice(readme.indexOf(begin),readme.indexOf(end) + end.length),componentTables(core,curated));
  assert.equal(core.components.length,42);
  assert.equal(curated.components.length,51);
  assert.equal(curated.components.filter(component => component.moduleId.startsWith('views/')).length,11);
  assert.equal((readme.match(/<details>/g) || []).length,2);
  const stale = structuredClone(curated);
  stale.components = stale.components.filter(component => component.name !== 'Box');
  assert.throws(() => componentTables(core,stale),/omits Box/);
});
