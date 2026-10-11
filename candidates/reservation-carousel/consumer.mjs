/** Cancel a supplied reservation intent and show its purpose; never make a booking. */
export function attachReservationReceipt(host,output){const listener=e=>{e.preventDefault();output.textContent=`Requested supplied reservation action: ${e.detail.intent}`;};host.addEventListener('iui:reservation-pills',listener);return()=>host.removeEventListener('iui:reservation-pills',listener);}
