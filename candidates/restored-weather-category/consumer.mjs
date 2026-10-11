/** Original local receipt adapter. It never calls an account/category provider. */
export function mountCategoryReceipt(runtime,host,document,output){
 if(host.contains(output))throw new Error('Keep the receipt outside renderer-owned content.');
 const receive=event=>{event.preventDefault();output.textContent=JSON.stringify(event.detail);};
 host.addEventListener('iui:ledger-category-correction',receive);let controller;
 try{controller=runtime.mount(host,document);}catch(error){host.removeEventListener('iui:ledger-category-correction',receive);throw error;}
 let disposed=false;return{controller,dispose(){if(disposed)return;disposed=true;host.removeEventListener('iui:ledger-category-correction',receive);controller.dispose();}};
}
