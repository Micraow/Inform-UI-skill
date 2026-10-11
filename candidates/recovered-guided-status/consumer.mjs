/** Original finite host. A canceled intent is a local receipt, never a sent query. */
export function mountGuidedStatus(api, host, document, output) {
 if (!output || output === host || host.contains(output)) throw new TypeError('Use a separate output element.');
 const valid = api.validateDocument(document);
 if (!valid.ok) throw new TypeError(valid.issues.map(i=>i.code+' '+i.path).join('\n'));
 let active=true;
 const onChoice=event=>{if(!active)return;event.preventDefault();output.textContent='Chosen locally: '+event.detail.taskId+' / '+(event.detail.promptId??'own question')};
 host.addEventListener('iui:prompt-checklist',onChoice);
 const release=()=>host.removeEventListener('iui:prompt-checklist',onChoice);
 let controller;try{controller=api.mount(host,valid.document)}catch(error){release();throw error}
 return {updateSnapshot(next){controller.update(next)},dispose(){if(!active)return;active=false;release();controller.dispose()}};
}
