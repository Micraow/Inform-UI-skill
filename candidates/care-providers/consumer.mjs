/** Receipt-only local integration. No provider lookup, clinical evaluation or appointment call. */
export function attachCareReceipt(host,output){const receive=e=>{e.preventDefault();output.textContent='Local supplied directory request: '+e.detail.intent;};host.addEventListener('iui:care-provider',receive);return()=>host.removeEventListener('iui:care-provider',receive);}
