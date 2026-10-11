/** Cancel local requests and display a receipt, without speaking, generating or launching. */
export function attachLauncherReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local supplied request: ${e.detail.intent}`;};host.addEventListener('iui:supplied-launcher',listener);return()=>host.removeEventListener('iui:supplied-launcher',listener);}
