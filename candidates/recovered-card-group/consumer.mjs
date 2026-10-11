/** Original local-only consumer. The caller supplies an already loaded, pinned runtime. */
export function mountIntentReceipt(api, host, document, output) {
  if (!output || host.contains(output)) throw new TypeError('Use a separate output element.');
  const valid = api.validateDocument(document);
  if (!valid.ok) throw new TypeError(valid.issues.map(i => i.code + ' ' + i.path).join('\n'));
  let active = true;
  const listen = event => {
    if (!active) return;
    event.preventDefault();
    const {itemId, intent} = event.detail;
    // textContent keeps supplied content literal; nothing is executed.
    output.textContent = 'Recorded locally: ' + itemId + ' (' + intent.kind + ')';
  };
  host.addEventListener('iui:follow-up-card', listen);
  let controller;
  try { controller = api.mount(host, valid.document); }
  catch (error) { host.removeEventListener('iui:follow-up-card', listen); throw error; }
  return {
    update: document => controller.update(document),
    dispose() {
      if (!active) return;
      active = false;
      host.removeEventListener('iui:follow-up-card', listen);
      controller.dispose();
    }
  };
}
