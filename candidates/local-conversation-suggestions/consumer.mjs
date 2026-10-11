/** Local text only. Cancellation never submits the supplied prompt to a model or message service. */
export function attachSuggestionReceipt(host, output) {
  const receive = event => { event.preventDefault(); output.textContent = `${event.detail.id}: ${event.detail.prompt}`; };
  host.addEventListener('iui:conversation-suggestion', receive);
  return () => host.removeEventListener('iui:conversation-suggestion', receive);
}
