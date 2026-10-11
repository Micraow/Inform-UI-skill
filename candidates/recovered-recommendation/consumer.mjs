/** Original local-only host: no account capability inference or external navigation. */
export function mountReadingReceipt(api,host,document,output){
 if(!output||host.contains(output))throw new TypeError('Use a separate output element.');
 const valid=api.validateDocument(document);if(!valid.ok)throw new TypeError(valid.issues.map(i=>i.code+' '+i.path).join('\n'));
 let active=true;
 const events={'iui:recommendation-card':'conversationId','iui:transaction-detail':'transactionId','iui:follow-up-card':'itemId'};
 const handler=event=>{if(!active)return;event.preventDefault();output.textContent='Selected locally: '+event.detail[events[event.type]]};
 const release=()=>{for(const name of Object.keys(events))host.removeEventListener(name,handler)};
 for(const name of Object.keys(events))host.addEventListener(name,handler);
 let controller;try{controller=api.mount(host,valid.document)}catch(error){release();throw error}
 return {update:document=>controller.update(document),dispose(){if(!active)return;active=false;release();controller.dispose()}};
}
