/** A local receipt that cancels all requests. No voice, composer or message service. */
export function attachPresentationReceipt(host, output) {
  const receive = event => {
    event.preventDefault();
    const { id, query, intent } = event.detail;
    output.textContent = query === undefined ? `Local legacy request: ${id}` : `Local ${intent} request: ${id}. Supplied text: ${query}`;
  };
  host.addEventListener('iui:follow-up-action', receive);
  return () => host.removeEventListener('iui:follow-up-action', receive);
}
