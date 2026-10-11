export function buildCases(document){
 const edit=fn=>{const d=structuredClone(document);fn(d.body[0],d.body[1]);return d};const positives=[['supplied exact records',structuredClone(document)]],negatives=[];
 const add=(name,fn)=>positives.push([name,edit(fn)]),bad=(name,code,fn,path)=>negatives.push([name,edit(fn),code,path]);
 add('initially revealed snapshot',a=>a.initiallyRevealed=true);
 add('omitted balance differs from unknown',a=>delete a.accounts[0].balance);
 add('known unsigned zero',a=>a.accounts[0].balance.amount='0');
 add('real leap observation and date',(a,r)=>{a.accounts[0].observedAt='2028-02-29T12:30+14:00';r.records[0].nextDate='2028-02-29'});
 add('no accounts',a=>a.accounts=[]);
 add('no recurring records',(_,r)=>{r.records=[];r.initialReviewedIds=[]});
 add('safe supplied source',a=>a.source={label:'Synthetic source document',url:'https://example.org/supplied-records'});
 add('full supplied bounds',(a,r)=>{a.accounts=Array.from({length:40},(_,i)=>({...a.accounts[0],id:'account_'+i}));r.records=Array.from({length:60},(_,i)=>({...r.records[0],id:'record_'+i}));r.initialReviewedIds=[]});
 add('literal labels and notes',a=>{a.accounts[0].label='<img src=untrusted>';a.accounts[0].note='<script>Not executable</script>'});
 for(const [name,value]of [['numeric money',0],['exponent money','1e3'],['separator money','1,000'],['plus money','+1'],['space money',' 1'],['newline money','1\n'],['leading zero money','01'],['overlong whole money','1234567890123456789'],['overlong fractional money','0.1234567890123456789']])bad(name,'SCHEMA',a=>a.accounts[0].balance.amount=value);
 bad('invalid currency case','SCHEMA',a=>a.accounts[0].balance.currency='usd');
 bad('full account number','SCHEMA',a=>a.accounts[0].suffix='12345678');
 bad('account connection callback','SCHEMA',a=>a.connectAccount='connect()');
 bad('recurring payment callback','SCHEMA',(_,r)=>r.pay='charge()');
 bad('duplicate account ID','LEDGER_RECORD_ID',a=>a.accounts[1].id='zero','/body/0/accounts/1/id');
 bad('duplicate recurring ID','LEDGER_RECORD_ID',(_,r)=>r.records[1].id='refund','/body/1/records/1/id');
 bad('impossible supplied observation','LEDGER_OBSERVATION',a=>a.accounts[0].observedAt='2027-02-29T12:30Z','/body/0/accounts/0/observedAt');
 bad('impossible supplied next date','RECURRING_DATE',(_,r)=>r.records[0].nextDate='2027-02-29','/body/1/records/0/nextDate');
 bad('unknown initial review','RECURRING_REVIEW_ID',(_,r)=>r.initialReviewedIds=['missing'],'/body/1/initialReviewedIds/0');
 bad('duplicate initial review','LEDGER_RECORD_ID',(_,r)=>r.initialReviewedIds=['refund','refund'],'/body/1/initialReviewedIds/1');
 bad('unsafe supplied source','UNSAFE_URL',a=>a.accounts[0].source={label:'Unsafe',url:'javascript:pay()'},'/body/0/accounts/0/source/url');
 bad('relative supplied source','UNSAFE_URL',(_,r)=>r.source={label:'Relative',url:'/payments'},'/body/1/source/url');
 bad('too many accounts','SCHEMA',a=>a.accounts=Array.from({length:41},(_,i)=>({...a.accounts[0],id:'a'+i})));
 return{positives,negatives};
}
