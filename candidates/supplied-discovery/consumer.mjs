/** Cancel local requests without navigation, sidebar access, composer writes or analytics. */
export function attachDiscoveryReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local discovery request: ${e.detail.intent}`;};host.addEventListener('iui:supplied-discovery',listener);return()=>host.removeEventListener('iui:supplied-discovery',listener);}
