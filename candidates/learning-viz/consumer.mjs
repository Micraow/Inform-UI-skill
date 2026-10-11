/** Optional receipt-only host integration. Cancels each request and never calls a service. */
export function attachMotionReceipt(host,output){const receive=e=>{e.preventDefault();output.textContent='Local animation request: '+e.detail.intent;};host.addEventListener('iui:learning-viz',receive);return()=>host.removeEventListener('iui:learning-viz',receive);}
