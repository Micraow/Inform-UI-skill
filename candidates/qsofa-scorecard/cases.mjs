/** Original schema documents for the explicit 2016 consensus contract. */
export function cases(example) {
  const make = change => { const d = structuredClone(example); change(d.body[0]); return d; };
  return {
    positives: [
      ['caller assessment', structuredClone(example)],
      ['explicit GCS14', make(n => { n.initial.mentation = { mode: 'gcs', score: 14 }; })],
      ['not-testable GCS', make(n => { n.initial.mentation = { mode: 'gcs', score: 'NT' }; })],
      ['unknown assessment', make(n => { n.initial.mentation.altered = null; })],
      ['unknown whole mode', make(n => { n.initial.mentation = null; })],
      ['visible invalid numerical draft', make(n => { n.initial.respiratoryRate = 'unparsed'; })],
      ['visible out-of-range GCS', make(n => { n.initial.mentation = { mode: 'gcs', score: 16 }; })],
      ['pending state', make(n => { n.status = 'pending'; })],
      ['literal failure fallback', make(n => { n.status = 'failed'; n.fallback = '<b>Supplied unavailable</b>'; })],
      ['disabled local reader', make(n => { n.disabled = true; })],
    ],
    negatives: [
      ['boolean rate', make(n => { n.initial.respiratoryRate = true; })],
      ['text GCS number', make(n => { n.initial.mentation = { mode: 'gcs', score: '14' }; })],
      ['text assessment', make(n => { n.initial.mentation.altered = 'false'; })],
      ['mixed input modes', make(n => { n.initial.mentation.score = 14; })],
      ['unknown mode name', make(n => { n.initial.mentation = { mode: 'automatic' }; })],
      ['missing mode discriminator', make(n => { n.initial.mentation = { altered: true }; })],
      ['unknown unit property', make(n => { n.initial.systolicKPa = 13; })],
      ['wrong defaults shape', make(n => { n.defaults = []; })],
      ['blank label', make(n => { n.label = ' '; })],
      ['duplicate information ID', make(n => { n.infoSections[1].id = n.infoSections[0].id; })],
      ['unavailable active tab', make(n => { n.activeInfoId = 'absent'; })],
      ['unknown status', make(n => { n.status = 'done'; })],
      ['unsupported field name', make(n => { n.fields.automaticDiagnosis = { label: 'Other' }; })],
      ['blank field label', make(n => { n.fields.gcs.label = ' '; })],
    ],
  };
}
