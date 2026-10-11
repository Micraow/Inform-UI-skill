export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; }, positives = [['original two supplied flows', structuredClone(input)]], negatives = [];
  const add = (n,fn) => positives.push([n,edit(fn)]), bad=(n,fn,code='SCHEMA',path)=>negatives.push([n,edit(fn),code,path]);
  add('initial expanded incoming',n=>{n.expanded=true;});
  add('shorter outgoing alternative with static flow label',n=>{n.activeFlow='outgoing';n.expanded=true;n.showFlowTabs=false;});
  add('pending ignores supplied records',n=>{n.status='pending';});
  add('failed literal fallback',n=>{n.status='failed';n.fallback='<b>Supplied failure text</b>';});
  add('failed without fallback',n=>{n.status='failed';});
  add('explicit no connected account',n=>{n.hasConnectedAccounts=false;n.noAccountsLabel='No connected teaching account';});
  add('known amounts masked while supplied unknown remains',n=>{n.masked=true;n.maskedLabel='Hidden teaching amount';});
  add('empty flows',n=>{n.flows={incoming:{items:[]},outgoing:{items:[]}};});
  bad('missing required legacy array',n=>{delete n.activities;});
  bad('null phase',n=>{n.status=null;});
  bad('state reference phase',n=>{n.status={$:'phase'};});
  bad('invalid active flow',n=>{n.activeFlow='income';});
  bad('incomplete flows',n=>{delete n.flows.outgoing;});
  bad('string expansion',n=>{n.expanded='true';});
  bad('missing initial items',n=>{delete n.flows.incoming.items;});
  bad('too many alternative records',n=>{n.flows.incoming.expandedItems=Array.from({length:61},(_,i)=>({...n.flows.incoming.items[0],id:'many_'+i}));});
  bad('top duplicated in initial list',n=>{n.flows.incoming.items[0].id=n.flows.incoming.top.id;},'UPCOMING_ID','/body/0/flows/incoming/items/0/id');
  bad('duplicate alternative IDs',n=>{n.flows.incoming.expandedItems[1].id=n.flows.incoming.expandedItems[0].id;},'UPCOMING_ID','/body/0/flows/incoming/expandedItems/1/id');
  bad('blank top title',n=>{n.flows.incoming.top.title=' ';},'UPCOMING_LABEL','/body/0/flows/incoming/top/title');
  bad('blank account label',n=>{n.flows.incoming.top.accountLabel=' ';},'UPCOMING_LABEL','/body/0/flows/incoming/top/accountLabel');
  bad('unsafe decorative icon',n=>{n.flows.incoming.top.iconSrc='javascript:untrusted()';},'UPCOMING_SOURCE','/body/0/flows/incoming/top/iconSrc');
  bad('nonboolean detail permission',n=>{n.flows.incoming.top.detailEnabled=1;});
  bad('unknown flag must be boolean',n=>{n.flows.incoming.items[1].amountUnknown='true';});
  bad('account connection URL is not supported',n=>{n.connectURL='https://example.org/unrequested';});
  return {positives,negatives};
}
