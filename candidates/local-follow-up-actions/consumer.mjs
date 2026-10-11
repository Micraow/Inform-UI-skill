/** A local receipt only. It cancels the intent and performs no generated response, search or navigation. */
export function attachActionReceipt(host, output) {
  const receive = event => { event.preventDefault(); output.textContent = `Selected local action: ${event.detail.id}`; };
  host.addEventListener('iui:follow-up-action', receive);
  return () => host.removeEventListener('iui:follow-up-action', receive);
}
