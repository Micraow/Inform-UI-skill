/** A local receipt that cancels review changes; it cannot acknowledge a payment. */
export function mountLedgerReviewReceipt(api,host,document,output){
 if(!output||output===host||host.contains(output))throw new TypeError('Use a separate output element.');
 const checked=api.validateDocument(document);if(!checked.ok)throw new TypeError(checked.issues.map(i=>i.code+' '+i.path).join('\n'));
 let active=true;const handler=event=>{if(!active)return;event.preventDefault();output.textContent='Review intent kept local: '+event.detail.recordId};
 host.addEventListener('iui:recurring-review',handler);let controller;
 const release=()=>host.removeEventListener('iui:recurring-review',handler);
 try{controller=api.mount(host,checked.document)}catch(error){release();throw error}
 return{updateSnapshot(next){controller.update(next)},dispose(){if(!active)return;active=false;release();controller.dispose()}};
}
