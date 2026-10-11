/** Display and cancel a finite request; no bank connection, navigation or composer mutation. */
export function attachFinanceEntryReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local finance-entry request: ${e.detail.intent}`;};host.addEventListener('iui:finance-entry',listener);return()=>host.removeEventListener('iui:finance-entry',listener);}
