export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['three original supplied suggestion texts', structuredClone(input)],
    ['one supplied suggestion', edit(n => { n.suggestions = n.suggestions.slice(0, 1); })],
    ['omitted optional group label', edit(n => { delete n.label; })],
    ['explicitly disabled suggestions', edit(n => { n.disabled = true; })],
    ['explicit empty suggestions', edit(n => { n.suggestions = []; })],
    ['twelve supplied suggestions', edit(n => { n.suggestions = Array.from({ length: 12 }, (_, i) => ({ id: 'local_' + i, label: 'Local choice ' + i, prompt: 'Original supplied text ' + i })); })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('duplicate suggestion ID', n => { n.suggestions[1].id = n.suggestions[0].id; }, 'CONVERSATION_SUGGESTION_ID', '/body/0/suggestions/1/id'),
    negative('blank suggestion label', n => { n.suggestions[0].label = ' '; }, 'CONVERSATION_SUGGESTION_LABEL', '/body/0/suggestions/0/label'),
    negative('blank group label', n => { n.label = ' '; }, 'CONVERSATION_SUGGESTION_LABEL', '/body/0/label'),
    negative('blank supplied prompt', n => { n.suggestions[0].prompt = ' '; }, 'CONVERSATION_SUGGESTION_PROMPT', '/body/0/suggestions/0/prompt'),
    negative('suggestions are required', n => { delete n.suggestions; }),
    negative('suggestion ID is required', n => { delete n.suggestions[0].id; }),
    negative('display label is required', n => { delete n.suggestions[0].label; }),
    negative('prompt text is required', n => { delete n.suggestions[0].prompt; }),
    negative('invalid suggestion key', n => { n.suggestions[0].id = '1 bad'; }),
    negative('thirteen suggestions exceed bound', n => { n.suggestions = Array.from({ length: 13 }, (_, i) => ({ id: 'local_' + i, label: 'Choice ' + i, prompt: 'Supplied text ' + i })); }),
    negative('unbounded label', n => { n.suggestions[0].label = 'x'.repeat(201); }),
    negative('unbounded prompt', n => { n.suggestions[0].prompt = 'x'.repeat(2001); }),
    negative('null prompt is not supplied text', n => { n.suggestions[0].prompt = null; }),
    negative('disabled is a literal boolean', n => { n.disabled = 'true'; }),
    negative('item disabled is a literal boolean', n => { n.suggestions[0].disabled = 1; }),
    negative('provider endpoint is outside local intent', n => { n.endpoint = 'https://example.org/generate'; }),
    negative('automatic send command is unsupported', n => { n.suggestions[0].autoSend = true; })
  ];
  return { positives, negatives };
}
