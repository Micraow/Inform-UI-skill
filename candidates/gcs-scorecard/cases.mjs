export function cases(fixture) {
  const make = change => { const d = structuredClone(fixture); change(d.body[0]); return d; };
  return {
    positives: [
      ['original live scorecard', structuredClone(fixture)],
      ['explicit on-demand', make(n => { n.resultMode = 'on-demand'; })],
      ['unknown components', make(n => { n.initial = {}; })],
      ['NT with other supplied values', make(n => { n.initial.verbal = 'NT'; })],
      ['numeric string displayed invalid', make(n => { n.initial.eye = '4'; })],
      ['out-of-range displayed invalid', make(n => { n.initial.motor = 7; })],
      ['other version displayed unsupported', make(n => { n.initial.version = 'other-version'; })],
      ['other population displayed unsupported', make(n => { n.initial.population = 'other'; })],
      ['pending', make(n => { n.status = 'pending'; })],
      ['failed fallback', make(n => { n.status = 'failed'; n.fallback = 'Original unavailable message'; })]
    ],
    negatives: [
      ['unknown property', make(n => { n.remoteAssessment = true; })],
      ['boolean rating', make(n => { n.initial.eye = true; })],
      ['array rating', make(n => { n.initial.verbal = []; })],
      ['object rating', make(n => { n.initial.motor = {}; })],
      ['unknown population enum', make(n => { n.initial.population = 'child'; })],
      ['blank title', make(n => { n.label = ' '; })],
      ['duplicate information ID', make(n => { n.infoSections[1].id = 'inputs'; })],
      ['unknown initial information ID', make(n => { n.activeInfoId = 'missing'; })],
      ['blank information label', make(n => { n.infoSections[0].label = ' '; })],
      ['unknown field variant', make(n => { n.fields.eye.variant = 'automatic'; })],
      ['help for unavailable score', make(n => { n.fields.eye.optionHelp['5'] = 'No eye score5'; })],
      ['blank field label', make(n => { n.fields.eye.label = ' '; })],
      ['unknown result mode', make(n => { n.resultMode = 'diagnose'; })],
      ['opaque source URL', make(n => { n.sourceUrl = 'https://example.test/assessment'; })]
    ]
  };
}
