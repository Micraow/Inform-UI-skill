/** Record a canceled local request. No voice activation or prompt delivery. */
export function attachConversationReceipt(host, output) {
  const receive = event => { event.preventDefault(); const { id, prompt, intent } = event.detail; output.textContent = `Local ${intent ?? 'legacy'} request: ${id}. Supplied text: ${prompt}`; };
  host.addEventListener('iui:conversation-suggestion', receive);
  return () => host.removeEventListener('iui:conversation-suggestion', receive);
}
