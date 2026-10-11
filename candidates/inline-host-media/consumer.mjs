/** Receipt-only host boundary. No lookup, image generation, speech or navigation call. */
export function attachMediaReceipt(host,output){const receive=e=>{e.preventDefault();output.textContent='Local supplied media request: '+e.detail.intent;};host.addEventListener('iui:inline-host-media',receive);return()=>host.removeEventListener('iui:inline-host-media',receive);}
