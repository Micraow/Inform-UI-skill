/** Both handlers cancel local intent and display only a receipt. They perform no financial operation. */
export function attachFinanceReceipts(host, output) {
  const activity = event => { event.preventDefault(); output.textContent = `Supplied activity: ${event.detail.id}`; };
  const category = event => { event.preventDefault(); output.textContent = `Supplied category: ${event.detail.id}`; };
  host.addEventListener('iui:upcoming-activity', activity); host.addEventListener('iui:spend-category', category);
  return () => { host.removeEventListener('iui:upcoming-activity', activity); host.removeEventListener('iui:spend-category', category); };
}
