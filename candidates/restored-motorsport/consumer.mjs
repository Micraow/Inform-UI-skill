/** Read supplied session intents locally. This neither books nor opens a race feed. */
export function mountSessionReceipt(api,host,document,output) {
  if(!output||output===host||host.contains(output))throw new TypeError('Use a separate output element.');
  const checked=api.validateDocument(document);
  if(!checked.ok)throw new TypeError(checked.issues.map(i=>i.code+' '+i.path).join('\n'));
  let active=true,controller;
  const handler=event=>{
    if(!active)return;
    event.preventDefault();
    const {raceId,sessionId}=event.detail;
    output.textContent=raceId===null&&sessionId===null?'Clear intent kept local':'Session intent kept local: '+raceId+' / '+sessionId;
  };
  host.addEventListener('iui:motorsport-session',handler);
  const release=()=>host.removeEventListener('iui:motorsport-session',handler);
  try {controller=api.mount(host,checked.document);} catch(error) {release();throw error;}
  return {
    updateSnapshot(next){controller.update(next);},
    dispose(){if(!active)return;active=false;release();controller.dispose();}
  };
}
