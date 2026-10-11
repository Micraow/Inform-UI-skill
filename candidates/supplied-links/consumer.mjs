/** Explicitly keep link and clipboard actions as canceled local teaching receipts. */
export function attachLinkReceipts(host, output) {
  const open = event => { event.preventDefault(); output.textContent = `Local supplied URL: ${event.detail.url}`; };
  const copy = event => { event.preventDefault(); output.textContent = `Local copy request: ${event.detail.url}`; };
  host.addEventListener('iui:link-open', open); host.addEventListener('iui:link-copy', copy);
  return () => { host.removeEventListener('iui:link-open', open); host.removeEventListener('iui:link-copy', copy); };
}
