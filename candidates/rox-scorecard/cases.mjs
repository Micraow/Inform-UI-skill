/** Original supplied-input contracts, verified against the exact frozen source-build lock. */
export function cases(example) {
  const make = change => { const d = structuredClone(example); change(d.body[0]); return d; };
  return {
    positives: [
      ['supplied percent with unconfirmed comparison', structuredClone(example)],
      ['equivalent fraction', make(n => { n.initial.fio2 = 0.5; n.initial.fio2Unit = 'fraction'; })],
      ['true zero', make(n => { n.initial.spo2Percent = 0; })],
      ['unknown remains explicit', make(n => { n.initial.spo2Percent = null; })],
      ['invalid draft is visible rather than discarded', make(n => { n.initial.spo2Percent = 'unparsed'; })],
      ['explicit study comparison request', make(n => { n.initial.studyContextConfirmed = true; })],
      ['pending state', make(n => { n.status = 'pending'; })],
      ['failed literal fallback', make(n => { n.status = 'failed'; n.fallback = '<b>Supplied message</b>'; })],
      ['disabled local reader', make(n => { n.disabled = true; })],
      ['omitted supplied input', make(n => { delete n.initial; delete n.defaults; })],
    ],
    negatives: [
      ['boolean measurement', make(n => { n.initial.spo2Percent = true; })],
      ['object measurement', make(n => { n.initial.respiratoryRate = { value: 20 }; })],
      ['undeclared unit', make(n => { n.initial.fio2Unit = 'litres-per-minute'; })],
      ['text confirmation', make(n => { n.initial.studyContextConfirmed = 'yes'; })],
      ['unknown root property', make(n => { n.patientIdentifier = 'synthetic-field-not-in-schema'; })],
      ['unknown initial property', make(n => { n.initial.oxygenFlow = 50; })],
      ['blank required label', make(n => { n.label = ' '; })],
      ['duplicate information ID', make(n => { n.infoSections[1].id = n.infoSections[0].id; })],
      ['unavailable active tab', make(n => { n.activeInfoId = 'not-supplied'; })],
      ['unsupported field definition', make(n => { n.fields.unrecognized = { label: 'Other' }; })],
      ['unknown status', make(n => { n.status = 'stopped'; })],
      ['wrong defaults shape', make(n => { n.defaults = []; })],
    ],
  };
}
