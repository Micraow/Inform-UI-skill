/** Local recommendation receipt. Cancel opening when the host wants no viewer. */
export function attachGridPresentationReceipts(host, output, { cancelOpen = true } = {}) {
  const open = event => { if (cancelOpen) event.preventDefault(); output.textContent = `Supplied image: ${event.detail.id}`; };
  const recommendation = event => { event.preventDefault(); output.textContent = `Supplied recommendation: ${event.detail.query}`; };
  host.addEventListener('iui:image-grid-open', open); host.addEventListener('iui:image-grid-recommendation', recommendation);
  return () => { host.removeEventListener('iui:image-grid-open', open); host.removeEventListener('iui:image-grid-recommendation', recommendation); };
}
