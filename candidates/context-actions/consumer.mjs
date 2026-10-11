/** Record and cancel a local context request without opening a provider or installing a plugin. */
export function attachContextReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local context request: ${e.detail.intent}`;};host.addEventListener('iui:context-action',listener);return()=>host.removeEventListener('iui:context-action',listener);}
