/** Records a canceled local study-tab request, with no teaching-data service. */
export function attachStudyReceipt(host,output){const receive=e=>{e.preventDefault();output.textContent=`Requested study tab: ${e.detail.tab}`;};host.addEventListener('iui:onboarding-tab',receive);return()=>host.removeEventListener('iui:onboarding-tab',receive);}
