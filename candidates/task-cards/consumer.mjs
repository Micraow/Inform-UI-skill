/** Cancel and display a local request; never change a task or notification setting. */
export function attachTaskReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Local ${e.detail.component}: ${e.detail.intent}`;};host.addEventListener('iui:task-card',listener);return()=>host.removeEventListener('iui:task-card',listener);}
