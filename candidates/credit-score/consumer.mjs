/** Cancel finite display requests without retrieving reports or making a credit decision. */
export function attachCreditReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local supplied-credit request: ${e.detail.intent}`;};host.addEventListener('iui:credit-view',listener);return()=>host.removeEventListener('iui:credit-view',listener);}
