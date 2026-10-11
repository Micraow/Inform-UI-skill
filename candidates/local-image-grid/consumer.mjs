/** Cancel the local image intent; no gallery, network search or navigation is invoked. */
export function attachGridReceipt(host, output) {
  const receive = event => { event.preventDefault(); output.textContent = `Selected supplied image ${event.detail.index + 1}: ${event.detail.id}`; };
  host.addEventListener('iui:image-grid-open', receive);
  return () => host.removeEventListener('iui:image-grid-open', receive);
}
