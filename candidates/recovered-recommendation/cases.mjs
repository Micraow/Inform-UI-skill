export function buildCases(document){
 const edit=fn=>{const d=structuredClone(document);fn(d.body[0]);return d};
 const positives=[['supplied conversation',structuredClone(document)]];
 const add=(name,fn)=>positives.push([name,edit(fn)]);
 add('explicit unavailable capability',n=>n.canOpenConversation=false);
 add('pending envelope',n=>{n.status='pending';delete n.data;delete n.canOpenConversation});
 add('failed no fabricated fallback',n=>{n.status='failed';delete n.data;delete n.canOpenConversation});
 add('failed supplied fallback',n=>{n.status='failed';delete n.data;delete n.canOpenConversation;n.fallback='No supplied conversation is available.'});
 add('empty description and optional glyph',n=>{n.data.description='';delete n.data.emoji});
 add('literal zero-prefixed conversation ID',n=>n.data.conversationId='000042');
 const negatives=[];const bad=(name,code,fn)=>negatives.push([name,edit(fn),code]);
 bad('blank accessible label','RECOMMENDATION_LABEL',n=>n.label=' ');
 bad('blank title','RECOMMENDATION_TITLE',n=>n.data.title=' ');
 bad('missing explicit status','SCHEMA',n=>delete n.status);
 bad('missing capability','SCHEMA',n=>delete n.canOpenConversation);
 bad('coerced capability','SCHEMA',n=>n.canOpenConversation='true');
 bad('pending carries resolved data','SCHEMA',n=>n.status='pending');
 bad('numeric conversation ID','SCHEMA',n=>n.data.conversationId=42);
 bad('remote icon source','UNSAFE_URL',n=>n.data.iconData='https://remote.example.test/icon.png');
 bad('SVG source','UNSAFE_URL',n=>n.data.iconData='data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
 bad('executable callback','SCHEMA',n=>n.onClick='openConversation()');
 return{positives,negatives};
}
