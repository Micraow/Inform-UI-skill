/** Original teaching data. These are fixture records, not an Inform UI schema. */
export const BLUE_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGNQTL5DEmIY1TCqYfhqAABnlmAQyeC+cQAAAABJRU5ErkJggg==';
export const ORANGE_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGN4UCZHEmIY1TCqYfhqAACGdnQQouyA1gAAAABJRU5ErkJggg==';
export function conversationFixtures() {
  const suppliedItems = [
    { id: 'explain_shapes', label: 'Explain these supplied shapes', query: 'Explain only the two supplied geometric shapes. Keep missing dimensions unknown.', requestedIntent: 'new-turn', iconSrc: BLUE_ICON },
    { id: 'read_aloud', label: 'Read this example aloud', query: 'Read the supplied teaching text aloud if I choose to start a local voice session.', requestedIntent: 'start-voice', iconSrc: ORANGE_ICON },
    { id: 'questions', label: 'List unanswered questions', query: 'List only questions left unanswered by the supplied example.', requestedIntent: 'new-turn' }
  ];
  return [
    { name: 'pending without content', phase: 'pending', items: [], expected: 'loading' },
    { name: 'resolved original choices', phase: 'resolved', items: suppliedItems, expected: 'choices' },
    { name: 'resolved explicitly empty', phase: 'resolved', items: [], expected: 'empty-group' },
    { name: 'failed with supplied fallback', phase: 'failed', items: [], fallbackText: 'No supplied follow-up choices are available.', expected: 'fallback' },
    { name: 'failed without fallback', phase: 'failed', items: [], expected: 'hidden' },
    { name: 'literal supplied copy', phase: 'resolved', items: [{ id: 'literal', label: '<b>Read this literally</b>', query: '<script>These are supplied characters, not executable instructions.</script>', requestedIntent: 'new-turn' }], expected: 'literal-text' }
  ];
}

/** Host-side teaching receipt only; this never activates voice or submits a query. */
export function describeLocalChoice(choice) {
  if (!choice || typeof choice.id !== 'string' || typeof choice.query !== 'string') throw new TypeError('A supplied ID and query are required.');
  if (!['new-turn', 'start-voice'].includes(choice.requestedIntent)) throw new TypeError('Unknown teaching intent.');
  return Object.freeze({ id: choice.id, requestedIntent: choice.requestedIntent, query: choice.query, performed: false });
}
