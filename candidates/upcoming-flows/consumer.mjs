/** The supplied record ID is a local request only; this adapter opens no service. */
export function attachUpcomingReceipt(host, output) {
  const listener = event => { event.preventDefault(); output.textContent = `Supplied ${event.detail.flow ?? 'legacy'} record: ${event.detail.id}`; };
  host.addEventListener('iui:upcoming-activity', listener);
  return () => host.removeEventListener('iui:upcoming-activity', listener);
}
