import { drawPanel } from '../image-grid-completion-draft/fixtures.mjs';
/** Neutral original data awaiting the three link readers' final field contracts. */
export function linkFamilyFixtures() {
  const icon = 'data:image/png;base64,' + drawPanel(24, 24, [42, 111, 171]).toString('base64');
  const image = 'data:image/png;base64,' + drawPanel(128, 96, [176, 96, 54]).toString('base64');
  return {
    links: [
      { id: 'supplied_guide', url: 'https://example.test/teaching/guide', label: 'Original supplied guide', source: 'Example teaching source', title: 'An original reading guide', snippet: 'A fictional guide used to test a local link request.', icon },
      { id: 'supplied_notes', url: 'https://example.test/teaching/notes?section=shapes', label: 'Original supplied notes', source: 'Example notes source', title: 'Original notes about colored shapes', snippet: 'A supplied summary that is never fetched or expanded from the URL.', icon },
      { id: 'supplied_catalog', url: 'https://example.test/teaching/catalog#original-panel', label: 'Original supplied catalog', source: 'Example catalog source', title: 'Original panel collection', snippet: 'A fictional linked item with a separately supplied inline image.', icon, image }
    ],
    passiveText: [{ type: 'text', value: 'Read the supplied guide' }],
    passiveBox: [{ type: 'box', children: [{ type: 'text', value: 'Original supplied reading' }, { type: 'text', value: 'Two passive lines inside one box' }] }],
    unsafeSources: ['javascript:unrequested()', 'data:text/html,<b>unrequested</b>'],
    interactiveChild: { type: 'input', kind: 'text', label: 'Unrelated input', bind: 'not_link_content' },
    scenarios: ['inline label and passive children', 'local open cancellation', 'local copy cancellation', 'explicit supplied source/title/snippet', 'optional inline icon and recommendation image', 'no URL-derived favicon request', 'pending and failed supplied phases', 'disabled requests remain passive']
  };
}
