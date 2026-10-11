export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['three original supplied local actions', structuredClone(input)],
    ['one available action', edit(n => { n.actions = n.actions.slice(0, 1); })],
    ['two actions and omitted optional label', edit(n => { n.actions = n.actions.slice(0, 2); delete n.label; })],
    ['whole bar explicitly disabled', edit(n => { n.disabled = true; })],
    ['explicit empty actions', edit(n => { n.actions = []; })],
    ['twelve supplied actions', edit(n => { n.actions = Array.from({ length: 12 }, (_, i) => ({ id: 'local_' + i, label: 'Local choice ' + i })); })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('duplicate action ID', n => { n.actions[1].id = n.actions[0].id; }, 'FOLLOW_UP_ACTION_ID', '/body/0/actions/1/id'),
    negative('blank action label', n => { n.actions[0].label = ' '; }, 'FOLLOW_UP_ACTION_LABEL', '/body/0/actions/0/label'),
    negative('blank group label', n => { n.label = ' '; }, 'FOLLOW_UP_ACTION_LABEL', '/body/0/label'),
    negative('invalid action key', n => { n.actions[0].id = '1 bad'; }),
    negative('thirteen actions exceed finite bound', n => { n.actions = Array.from({ length: 13 }, (_, i) => ({ id: 'local_' + i, label: 'Local choice ' + i })); }),
    negative('unbounded display label', n => { n.actions[0].label = 'x'.repeat(201); }),
    negative('actions are required', n => { delete n.actions; }),
    negative('action identifier is required', n => { delete n.actions[0].id; }),
    negative('action display label is required', n => { delete n.actions[0].label; }),
    negative('disabled is a literal boolean', n => { n.disabled = 'true'; }),
    negative('per-action disabled is a literal boolean', n => { n.actions[0].disabled = 1; }),
    negative('provider endpoints are outside local intent', n => { n.endpoint = 'https://example.org/generate'; }),
    negative('automatic action navigation is outside local intent', n => { n.actions[0].url = 'https://example.org/next'; })
  ];
  return { positives, negatives };
}
