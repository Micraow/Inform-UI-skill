import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAgentSession} from '../examples/agent-integration/session.mjs';

const directory = new URL('../examples/agent-integration/', import.meta.url);
const selection = JSON.parse(await readFile(new URL('selection.json', directory), 'utf8'));
const source = await readFile(new URL('workshop-plan.openui', directory), 'utf8');
const negativeCases = JSON.parse(await readFile(new URL('negative-cases.json', directory), 'utf8'));
const accepted = result => { assert.equal(result.ok, true, JSON.stringify(result.issues)); return result; };
const rejected = (result, code) => {
  assert.equal(result.ok, false);
  assert(result.issues.some(issue => issue.code === code), JSON.stringify(result.issues));
};
const nodes = tree => {
  const found = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'element') found.push(value);
    for (const child of Object.values(value)) Array.isArray(child) ? child.forEach(visit) : visit(child);
  };
  visit(tree);
  return found;
};
const find = (snapshot, name, predicate = () => true) => nodes(snapshot.tree).find(node => node.typeName === name && predicate(node));
function commit(session, text = source) {
  const generation = session.beginGeneration();
  accepted(session.append(generation, text));
  return session.finish(generation);
}
function withSession(run, options = selection) {
  const session = createAgentSession(options);
  try { run(session); } finally { session.dispose(); }
}

test('chunked synthetic output uses one fixed profile and keeps previews passive', () => withSession(session => {
  const token = session.beginGeneration();
  for (let offset = 0; offset < source.length; offset += 37) {
    accepted(session.append(token, source.slice(offset, offset + 37)));
    const result = accepted(session.preview(token));
    assert.equal(result.preview.interactive, false);
    assert.equal(session.getSnapshot(), null);
    assert.equal(session.getDocument(), null);
  }
  const result = accepted(session.finish(token));
  assert.equal(result.snapshot.tree.typeName, 'Stack');
  assert.deepEqual(session.getDocument(), {source,...selection});
  assert.match(session.prompt, /^MetricView\(/m);
  assert(!/^WeatherView\(/m.test(session.prompt));
  rejected(session.finish(token), 'STALE_GENERATION');
}));

test('local interactions preserve chart/table consistency, retained choices, empty states and reset', () => withSession(session => {
  let snapshot = accepted(commit(session)).snapshot;
  const sameRows = state => {
    const chart = find(state, 'BarChart');
    const table = find(state, 'Table');
    assert.deepEqual(chart.props.labels, table.props.rows.map(row => row.name));
    assert.deepEqual(chart.props.series[0].values, table.props.rows.map(row => row.score));
  };
  sameRows(snapshot);
  const choice = find(snapshot, 'Button', node => node.props.label === 'Choose Digital prototype').props.onPress;
  snapshot = accepted(session.dispatchLocal(choice)).snapshot;
  assert.equal(snapshot.state.$selected, 'digital');
  rejected(session.dispatchLocal(choice), 'STALE_ACTION');
  snapshot = accepted(session.setState({$budget:20,$order:'desc'})).snapshot;
  sameRows(snapshot);
  assert(find(snapshot, 'Alert', node => node.props.title === 'Selected plan is outside the new budget'));
  const binding = find(snapshot, 'Slider').bindings.value;
  snapshot = accepted(session.setBinding(binding, 0)).snapshot;
  assert.equal(find(snapshot, 'BarChart'), undefined);
  assert.equal(find(snapshot, 'Table'), undefined);
  assert(find(snapshot, 'Alert', node => node.props.title === 'No matching plans'));
  rejected(session.setBinding(binding, 100), 'STALE_BINDING');
  const before = session.getSnapshot();
  rejected(session.setState({$budget:70,$order:'invalid'}), 'invalid-selection');
  assert.equal(session.getSnapshot(), before);
  snapshot = accepted(session.dispatchLocal(find(snapshot, 'Button', node => node.props.label === 'Reset comparison').props.onPress)).snapshot;
  assert.deepEqual({...snapshot.state}, {$budget:100,$order:'asc',$selected:''});
  sameRows(snapshot);
}));

test('older streams and their cleanup cannot overwrite or cancel a newer generation', () => withSession(session => {
  accepted(commit(session));
  const older = session.beginGeneration();
  accepted(session.append(older, 'root = Stack([Text("old")])'));
  const newer = session.beginGeneration();
  rejected(session.append(older, ' stale'), 'STALE_GENERATION');
  rejected(session.finish(older), 'STALE_GENERATION');
  rejected(session.cancelGeneration(older), 'STALE_GENERATION');
  const fresh = 'root = Stack([Text("new")])';
  accepted(session.append(newer, fresh));
  accepted(session.finish(newer));
  assert.equal(session.getDocument().source, fresh);
}));

test('explicit cancellation keeps the last accepted document and invalidates the stream', () => withSession(session => {
  accepted(commit(session));
  const before = session.getSnapshot();
  const token = session.beginGeneration();
  accepted(session.append(token, 'root = Stack([Text("partial'));
  accepted(session.cancelGeneration(token));
  rejected(session.finish(token), 'STALE_GENERATION');
  assert.equal(session.getSnapshot(), before);
  assert.equal(session.getDocument().source, source);
}));

test('generation identity cannot be copied or borrowed from another session', () => withSession(session => {
  const second = createAgentSession(selection);
  try {
    const token = session.beginGeneration();
    rejected(session.append({...token}, source), 'STALE_GENERATION');
    rejected(second.append(token, source), 'STALE_GENERATION');
    accepted(session.append(token, source));
    accepted(session.finish(token));
  } finally { second.dispose(); }
}));

test('source cap rejects the whole oversized generation, including later finish', () => withSession(session => {
  const good = 'root = Stack([Text("ok")])';
  accepted(commit(session, good));
  const before = session.getSnapshot();
  const token = session.beginGeneration();
  accepted(session.append(token, 'x'.repeat(64)));
  rejected(session.append(token, 'x'), 'SOURCE_LIMIT');
  rejected(session.finish(token), 'STALE_GENERATION');
  assert.equal(session.getSnapshot(), before);
  assert.equal(session.getDocument().source, good);
}, {...selection,maxSourceChars:64}));

test('non-string deltas are rejected without silently coercing model envelopes', () => withSession(session => {
  const token = session.beginGeneration();
  rejected(session.append(token, {source,select:['views/weather']}), 'DELTA_TYPE');
  accepted(session.append(token, source));
  accepted(session.finish(token));
}));

test('split Unicode code units are reassembled without corrupting answer text', () => withSession(session => {
  const text = 'root = Stack([Text("Workshop 🧪")])';
  const split = text.indexOf('🧪') + 1;
  const token = session.beginGeneration();
  accepted(session.append(token, text.slice(0, split)));
  accepted(session.append(token, text.slice(split)));
  accepted(session.finish(token));
  assert.equal(session.getDocument().source, text);
}));

for (const fixture of negativeCases) {
  test('agent rejection preserves accepted state: ' + fixture.id, () => withSession(session => {
    accepted(commit(session));
    const before = session.getSnapshot();
    rejected(commit(session, fixture.source), fixture.code);
    assert.equal(session.getSnapshot(), before);
    assert.equal(session.getDocument().source, source);
  }));
}

test('caller mutation cannot broaden the already selected capability contract', () => {
  const requested = structuredClone(selection);
  withSession(session => {
    requested.select.push('views/weather');
    requested.viewNames.push('WeatherView');
    assert.deepEqual(session.selection, selection);
    assert.throws(() => session.selection.select.push('views/weather'), TypeError);
    rejected(commit(session, 'root = Stack([WeatherView({})])'), 'UNKNOWN_CALL');
  }, requested);
});

test('dispose is idempotent and invalidates streams, documents and host interactions', () => {
  const session = createAgentSession(selection);
  const snapshot = accepted(commit(session)).snapshot;
  const action = find(snapshot, 'Button').props.onPress;
  const token = session.beginGeneration();
  session.dispose();
  session.dispose();
  assert.equal(session.getSnapshot(), null);
  assert.equal(session.getDocument(), null);
  assert.throws(() => session.beginGeneration(), /disposed/);
  for (const result of [session.append(token, source),session.finish(token),session.preview(token),session.setState({$budget:10}),session.dispatchLocal(action)]) {
    rejected(result, 'SESSION_DISPOSED');
  }
});

test('invalid host configuration fails before starting a generation', () => {
  for (const options of [
    {select:[]}, {select:['base/controls']}, {...selection,viewNames:'MetricView'},
    {...selection,maxSourceChars:0}, {...selection,maxSourceChars:200001},
  ]) assert.throws(() => createAgentSession(options), TypeError);
});
