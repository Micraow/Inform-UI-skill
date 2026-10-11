/** Caller provides an already loaded, pinned runtime. This example records an ID locally. */
export function mountTransactionReceipt(api, host, document, output) {
  if (!output || host.contains(output)) throw new TypeError('Use a separate output element.');
  const valid=api.validateDocument(document);
  if(!valid.ok)throw new TypeError(valid.issues.map(i=>i.code+' '+i.path).join('\n'));
  let active=true;
  const listen=event=>{
    if(!active)return;
    event.preventDefault();
    output.textContent='Selected supplied receipt: '+event.detail.transactionId;
  };
  host.addEventListener('iui:transaction-detail',listen);
  let controller;
  try{controller=api.mount(host,valid.document)}
  catch(error){host.removeEventListener('iui:transaction-detail',listen);throw error}
  return {
    update:document=>controller.update(document),
    dispose(){
      if(!active)return;
      active=false;host.removeEventListener('iui:transaction-detail',listen);controller.dispose();
    }
  };
}
