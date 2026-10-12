export function cases(fixture) {
  const one = initial => ({ version: 'iui/1', body: [{ ...structuredClone(fixture.body[0]), initial }] });
  const base = fixture.body[0].initial;
  const positives = [
    ['two explicit equivalent bases', fixture],
    ['missing fields remain a valid unavailable draft', one({})],
    ['null fields remain unavailable', one({ basis: null, birthDate: null })],
    ['malformed date is an explicit invalid outcome', one({ ...base, birthDate: 'bad-date' })],
    ['fractional unit is an explicit invalid outcome', one({ ...base, gestationalDays: 1.5 })],
    ['numeric strings stay explicit units', one({ ...base, gestationalWeeks: '34', gestationalDays: '2' })],
    ['term input is structurally valid but unsupported', one({ ...base, gestationalWeeks: 40 })],
    ['conflicting supplied bases become an invalid outcome', one({ ...base, dueDate: '2025-11-14' })]
  ];
  const mutate = f => { const d = structuredClone(fixture); f(d.body[0]); return d; };
  const negatives = [
    ['unknown basis', mutate(n => { n.initial.basis = 'automatic'; })],
    ['confirmation must be boolean', mutate(n => { n.initial.confirmedPreterm = 'true'; })],
    ['date structure must be a string', mutate(n => { n.initial.birthDate = 20251005; })],
    ['initial cannot be an array', mutate(n => { n.initial = []; })],
    ['label is required', mutate(n => { delete n.label; })],
    ['blank label is not useful', mutate(n => { n.label = ' '; })],
    ['no implicit current-date flag', mutate(n => { n.initial.useToday = true; })],
    ['disabled must be boolean', mutate(n => { n.disabled = 'true'; })]
  ];
  return { positives, negatives };
}
