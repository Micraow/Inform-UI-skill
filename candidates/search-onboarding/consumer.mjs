/** This adapter records and cancels a local request. It never opens a URL or loads a provider. */
export function attachSearchReceipt(host,output){const receive=e=>{e.preventDefault();output.textContent=`Requested supplied source: ${e.detail.itemId} (${e.detail.url})`;};host.addEventListener('iui:search-open',receive);return()=>host.removeEventListener('iui:search-open',receive);}
