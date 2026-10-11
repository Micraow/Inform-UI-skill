/** Cancel local category/puzzle requests without changing financial records or sending prompts. */
export function attachInteractionReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local supplied interaction: ${e.detail.intent}`;};host.addEventListener('iui:supplied-interaction',listener);return()=>host.removeEventListener('iui:supplied-interaction',listener);}
