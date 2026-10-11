/** A canceled local detail receipt. Values must already be authorized teaching data. */
export function attachCategoryReceipt(host,output){const onDetail=e=>{e.preventDefault();output.textContent=`Supplied category: ${e.detail.categoryKey} / ${e.detail.monthId}`;};host.addEventListener('iui:category-detail',onDetail);return()=>host.removeEventListener('iui:category-detail',onDetail);}
