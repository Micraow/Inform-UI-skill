export function cases(fixture) {
  const edit = fn => { const doc = structuredClone(fixture); fn(doc.body[0]); return doc; };
  const positives = [
    ['required unknown remains an authored draft', structuredClone(fixture)],
    ['explicit clear hidden policy', edit(n => { n.hiddenValuePolicy = 'clear'; })],
    ['true zero and false are answers', edit(n => { n.initialAnswers.participants = 2; n.initialAnswers.packsEach = 0; })],
    ['invalid numeric draft is representable', edit(n => { n.initialAnswers.participants = 'two'; })],
    ['independent reset baseline', edit(n => { n.defaults.participants = 4; })],
    ['computed dependency', edit(n => { n.computed.doublePackets = { op: 'mul', args: [{ $: 'totalPackets' }, 2] }; })],
    ['optional unknown handled explicitly', edit(n => { n.fields.push({ id: 'note', type: 'text', label: 'Optional note' }); n.computed.noteProvided = { op: 'if', args: [{ op: 'eq', args: [{ $: 'note' }, null] }, false, true] }; })],
    ['named local asynchronous action', edit(n => { n.action = 'reviewPacking'; })],
    ['source title with optional version only', edit(n => { n.sources = [{ title: 'Original synthetic packing rules', version: '1.0.0' }]; })],
    ['safe source URL is provenance', edit(n => { n.sources[0].url = 'https://example.test/packing-rules'; })],
  ];
  const negatives = [
    ['hidden policy is mandatory', n => { delete n.hiddenValuePolicy; }],
    ['unknown hidden policy', n => { n.hiddenValuePolicy = 'submit-hidden'; }],
    ['duplicate field', n => { n.fields.push(structuredClone(n.fields[0])); }],
    ['unknown field kind', n => { n.fields[0].type = 'javascript'; }],
    ['future visibility reference', n => { n.fields[0].visibleWhen = { op: 'eq', args: [{ $: 'seats' }, 8] }; }],
    ['self visibility reference', n => { n.fields[0].visibleWhen = { op: 'eq', args: [{ $: 'mode' }, 'travel'] }; }],
    ['computed visibility reference', n => { n.fields[4].visibleWhen = { op: 'gt', args: [{ $: 'totalPackets' }, 0] }; }],
    ['computed validation reference', n => { n.fields[4].validWhen = { op: 'gt', args: [{ $: 'totalPackets' }, 0] }; }],
    ['unknown answer reference', n => { n.computed.totalPackets = { $: 'undeclared' }; }],
    ['computed cycle', n => { n.computed.totalPackets = { $: 'second' }; n.computed.second = { $: 'totalPackets' }; }],
    ['computed field collision', n => { n.computed.mode = 1; }],
    ['unknown operator', n => { n.computed.totalPackets = { op: 'eval', args: ['2+2'] }; }],
    ['nonboolean condition', n => { n.fields[4].visibleWhen = 1; }],
    ['zero step', n => { n.fields[1].step = 0; }],
    ['reversed numeric range', n => { n.fields[1].min = 21; }],
    ['duplicate choice value', n => { n.fields[0].options.push(structuredClone(n.fields[0].options[0])); }],
    ['undeclared initial answer', n => { n.initialAnswers.undeclared = 1; }],
    ['nested answer object', n => { n.initialAnswers.participants = { value: 2 }; }],
    ['unsafe source URL', n => { n.sources[0].url = 'javascript:alert(1)'; }],
    ['blank version', n => { n.version = ' '; }],
  ].map(([name, fn]) => [name, edit(fn)]);
  return { positives, negatives };
}
