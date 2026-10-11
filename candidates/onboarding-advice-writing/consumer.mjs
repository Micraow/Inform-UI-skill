/** Cancel a presentation switch and record only the requested tab locally. */
export function attachOnboardingReceipt(host,output){const receive=event=>{event.preventDefault();output.textContent=`Requested supplied tab: ${event.detail.tab}`;};host.addEventListener('iui:onboarding-tab',receive);return()=>host.removeEventListener('iui:onboarding-tab',receive);}
