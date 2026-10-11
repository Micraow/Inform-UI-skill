/** Independent authoring examples: input is never mutated. */
export function buildCases(document) {
  const edit = fn => {const doc=structuredClone(document);fn(doc.body[0]);return doc;};
  const positives=[['supplied zero refund and unknown',structuredClone(document)]];
  const positive=(name,fn)=>positives.push([name,edit(fn)]);
  positive('pending without data',n=>{n.status='pending';delete n.data});
  positive('failed without invented fallback',n=>{n.status='failed';delete n.data});
  positive('failed with supplied fallback',n=>{n.status='failed';n.fallback='The supplied receipt is unavailable.'});
  positive('resolved absent data',n=>delete n.data);
  positive('explicit mobile and presentation mask',n=>{n.mobile=true;n.sensitiveValuesHidden=true});
  positive('empty related and omitted budget',n=>{n.data.related=[];delete n.data.budget});
  positive('bounded forty supplied records',n=>{n.data.related=Array.from({length:40},(_,i)=>({...n.data.related[0],id:'row_'+i}))});
  positive('disabled component',n=>{n.disabled=true});
  positive('disabled related record',n=>{n.data.related[0].disabled=true});
  positive('literal UUID and zero geometry',n=>{n.data.transactionId='6e06d1cb-95ee-4b02-bba7-465be0703d72';n.data.budget.progressPct=0});
  positive('full geometry and safe supplied logo',n=>{n.data.budget.progressPct=100;n.data.logo={src:'https://media.example.test/logo.png',alt:'Supplied practice logo'}});
  const negatives=[];
  const negative=(name,code,fn)=>negatives.push([name,edit(fn),code]);
  negative('blank accessible label','TRANSACTION_DETAIL_LABEL',n=>n.label='  ');
  negative('missing required reading label','SCHEMA',n=>delete n.label);
  negative('unknown lifecycle state','SCHEMA',n=>n.status='loading');
  negative('coerced mobile boolean','SCHEMA',n=>n.mobile='false');
  negative('coerced masking boolean','SCHEMA',n=>n.sensitiveValuesHidden=1);
  negative('numeric transaction ID','SCHEMA',n=>n.data.transactionId=1234);
  negative('duplicate related IDs','DUPLICATE_ID',n=>n.data.related[1].id=n.data.related[0].id);
  negative('blank related action label','TRANSACTION_DETAIL_LABEL',n=>n.data.related[0].actionLabel=' ');
  negative('pending record lacks supplied label','SCHEMA',n=>delete n.data.related[1].pendingLabel);
  negative('more than forty records','SCHEMA',n=>n.data.related=Array.from({length:41},(_,i)=>({...n.data.related[0],id:'row_'+i})));
  negative('negative budget geometry','SCHEMA',n=>n.data.budget.progressPct=-1);
  negative('overflow budget geometry','SCHEMA',n=>n.data.budget.progressPct=101);
  negative('missing unknown amount label','SCHEMA',n=>n.data.related[1].amountLabel=null);
  negative('executable logo','UNSAFE_URL',n=>n.data.logo={src:'javascript:alert(1)',alt:'Unsafe'});
  negative('relative related logo','UNSAFE_URL',n=>n.data.related[0].logo={src:'./logo.png',alt:'Unsafe'});
  negative('inline executable callback','SCHEMA',n=>n.onClick='runBusinessAction()');
  return {positives,negatives};
}
