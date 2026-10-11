export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0], d.body[1]); return d; };
  const positives = [['original footer and wrapped requests', structuredClone(input)]], negatives = [];
  const add = (name, fn) => positives.push([name, edit(fn)]), bad = (name, fn, code = 'SCHEMA', path) => negatives.push([name, edit(fn), code, path]);
  add('pending presentations', (a, b) => { a.status = b.status = 'pending'; });
  add('failed with and without fallback', (a, b) => { a.status = b.status = 'failed'; a.fallback = 'No supplied choices are available.'; });
  add('resolved empty presentations', (a, b) => { a.actions = []; b.actions = []; });
  add('legacy flat ID-only compatibility', (a, b) => { for (const n of [a, b]) { delete n.presentation; n.actions = n.actions.map(({ id, label }) => ({ id, label })); } });
  add('disabled group and individual request', (a, b) => { a.disabled = true; b.actions[1].disabled = true; });
  add('maximum bounded supplied actions', (a, b) => { for (const n of [a, b]) n.actions = Array.from({ length: 12 }, (_, i) => ({ ...n.actions[0], id: 'choice_' + i })); });
  add('literal labels and query', (a, b) => { a.actions[0].label = '<b>Literal label</b>'; b.actions[0].query = '<script>Plain supplied characters</script>'; });
  bad('unsupported presentation', a => { a.presentation = 'carousel'; });
  bad('unsupported phase', a => { a.status = 'retrieved'; });
  bad('explicit null phase', a => { a.status = null; });
  bad('state reference is not a literal phase', a => { a.status = { $: 'phase' }; });
  bad('null query', a => { a.actions[0].query = null; });
  bad('query exceeds finite limit', a => { a.actions[0].query = 'x'.repeat(2001); });
  bad('blank query', a => { a.actions[0].query = '  '; }, 'FOLLOW_UP_ACTION_QUERY', '/body/0/actions/0/query');
  bad('footer missing query', a => { delete a.actions[0].query; }, 'FOLLOW_UP_ACTION_QUERY', '/body/0/actions/0/query');
  bad('wrapped missing query', (_, b) => { delete b.actions[0].query; }, 'FOLLOW_UP_ACTION_QUERY', '/body/1/actions/0/query');
  bad('footer voice request', a => { a.actions[0].intent = 'start-voice'; }, 'FOLLOW_UP_ACTION_INTENT', '/body/0/actions/0/intent');
  bad('footer image request', a => { a.actions[0].intent = 'open-image-composer'; }, 'FOLLOW_UP_ACTION_INTENT', '/body/0/actions/0/intent');
  bad('unknown local intent', (_, b) => { b.actions[0].intent = 'send-payment'; });
  bad('unsafe icon', (_, b) => { b.actions[0].iconSrc = 'javascript:untrusted()'; }, 'FOLLOW_UP_ACTION_SOURCE', '/body/1/actions/0/iconSrc');
  bad('relative icon', (_, b) => { b.actions[0].iconSrc = '/unprovided.png'; }, 'FOLLOW_UP_ACTION_SOURCE', '/body/1/actions/0/iconSrc');
  bad('callback is not supplied data', (_, b) => { b.actions[0].onClick = 'activate()'; });
  bad('duplicate request ID', a => { a.actions[1].id = a.actions[0].id; }, 'FOLLOW_UP_ACTION_ID', '/body/0/actions/1/id');
  return { positives, negatives };
}
