/** Cancel and record the local request. Never grant permission, read coordinates or navigate. */
export function attachLocationReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Requested location-card action: ${e.detail.intent}`;};host.addEventListener('iui:ask-location',listener);return()=>host.removeEventListener('iui:ask-location',listener);}
