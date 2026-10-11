/** Cancel a local request; supplied capability flags do not authorize device services. */
export function attachWeatherReceipt(host,output){const receive=e=>{e.preventDefault();output.textContent=`Local weather request: ${e.detail.intent}`;};host.addEventListener('iui:weather-action',receive);return()=>host.removeEventListener('iui:weather-action',receive);}
