export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [['original phase-ready choices', structuredClone(input)]], negatives = [];
  const add = (name, fn) => positives.push([name, edit(fn)]), bad = (name, fn, code = 'SCHEMA', path) => negatives.push([name, edit(fn), code, path]);
  add('pending hides supplied choices', n => { n.status = 'pending'; });
  add('failed with supplied fallback', n => { n.status = 'failed'; n.fallback = 'No supplied teaching choices are available.'; });
  add('failed without fallback', n => { n.status = 'failed'; });
  add('resolved empty retains a group', n => { n.status = 'resolved'; n.suggestions = []; });
  add('legacy supplied prompt choices', n => { n.suggestions = n.suggestions.map(({ id, label, prompt }) => ({ id, label, prompt })); });
  add('disabled group with literal supplied copy', n => { n.disabled = true; n.suggestions[0].label = '<b>Literal label</b>'; n.suggestions[0].prompt = '<script>Supplied characters only</script>'; });
  add('maximum finite suggestions', n => { n.suggestions = Array.from({ length: 12 }, (_, i) => ({ ...n.suggestions[0], id: 'choice_' + i })); });
  bad('null phase', n => { n.status = null; });
  bad('unknown phase', n => { n.status = 'loading'; });
  bad('phase must be literal', n => { n.status = { $: 'phase' }; });
  bad('fallback must be text', n => { n.fallback = { type: 'text', value: 'Fallback' }; });
  bad('unknown voice intent', n => { n.suggestions[0].intent = 'activate-microphone'; });
  bad('image composer belongs to a different family', n => { n.suggestions[0].intent = 'open-image-composer'; });
  bad('null icon', n => { n.suggestions[0].iconSrc = null; });
  bad('unsafe icon', n => { n.suggestions[0].iconSrc = 'javascript:untrusted()'; }, 'CONVERSATION_SUGGESTION_SOURCE', '/body/0/suggestions/0/iconSrc');
  bad('relative icon', n => { n.suggestions[0].iconSrc = '/unprovided.png'; }, 'CONVERSATION_SUGGESTION_SOURCE', '/body/0/suggestions/0/iconSrc');
  bad('missing prompt', n => { delete n.suggestions[0].prompt; });
  bad('blank prompt', n => { n.suggestions[0].prompt = ' '; }, 'CONVERSATION_SUGGESTION_PROMPT', '/body/0/suggestions/0/prompt');
  bad('duplicate suggestion ID', n => { n.suggestions[1].id = n.suggestions[0].id; }, 'CONVERSATION_SUGGESTION_ID', '/body/0/suggestions/1/id');
  bad('prompt over limit', n => { n.suggestions[0].prompt = 'x'.repeat(2001); });
  bad('provider callback is not supplied data', n => { n.suggestions[0].handler = 'send()'; });
  return { positives, negatives };
}
