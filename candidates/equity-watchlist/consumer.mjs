/** Cancel and record a local request; no account or transaction service is used. */
export function attachEquityReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local supplied-table request: ${e.detail.intent}`;};host.addEventListener('iui:equity-watch',listener);return()=>host.removeEventListener('iui:equity-watch',listener);}
