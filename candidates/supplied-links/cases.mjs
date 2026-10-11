/** Original bounded contracts for the exact source-built supplied Link family. */
export function buildCases(input) {
  const edit=fn=>{const d=structuredClone(input);fn(d.body);return d;},positives=[['original supplied link family',structuredClone(input)]],negatives=[];
  const add=(n,fn)=>positives.push([n,edit(fn)]),bad=(n,fn,code='SCHEMA',path)=>negatives.push([n,edit(fn),code,path]);
  add('pending readers without destinations',nodes=>{for(const n of nodes){n.status='pending';delete n.url;}});
  add('failed literal fallback',nodes=>{for(const n of nodes){n.status='failed';n.fallback='<b>Supplied link unavailable</b>';delete n.url;}});
  add('failed hidden without fallback',nodes=>{for(const n of nodes){n.status='failed';delete n.url;}});
  add('disabled local requests',nodes=>{for(const n of nodes)n.disabled=true;});
  add('mobile and host-owned inline modes',nodes=>{nodes[0].mobile=true;nodes[1].hostLink=true;});
  add('title defaults to supplied URL',nodes=>{for(const n of nodes)delete n.title;});
  add('legacy anchor remains an anchor',nodes=>{nodes.splice(0,nodes.length,{type:'link',value:'Original legacy guide',href:'https://example.test/teaching/legacy'});});
  add('remote images require explicit activation',nodes=>{nodes[2].faviconSrc='https://example.test/images/supplied-icon.png';nodes[3].imageSrc='https://example.test/images/supplied-picture.png';});
  add('literal supplied display copy',nodes=>{nodes[2].title='<b>Original literal title</b>';nodes[2].snippet='<script>Plain supplied snippet</script>';});
  bad('javascript destination',nodes=>{nodes[0].url='javascript:unrequested()';},'LINK_URL','/body/0/url');
  bad('html data destination',nodes=>{nodes[2].url='data:text/html,unrequested';},'LINK_URL','/body/2/url');
  bad('resolved card lacks a destination',nodes=>{delete nodes[2].url;},'LINK_URL','/body/2/url');
  bad('blank title',nodes=>{nodes[0].title=' ';},'LINK_TEXT','/body/0/title');
  bad('blank supplied source',nodes=>{nodes[2].source=' ';},'LINK_TEXT','/body/2/source');
  bad('blank snippet',nodes=>{nodes[2].snippet=' ';},'LINK_TEXT','/body/2/snippet');
  bad('blank copy control label',nodes=>{nodes[0].copyLabel=' ';},'LINK_TEXT','/body/0/copyLabel');
  bad('unsafe favicon source',nodes=>{nodes[2].faviconSrc='javascript:unrequested()';},'LINK_IMAGE','/body/2/faviconSrc');
  bad('unsafe recommendation image',nodes=>{nodes[3].imageSrc='data:text/html,unrequested';},'LINK_IMAGE','/body/3/imageSrc');
  bad('unknown phase',nodes=>{nodes[0].status='loading';});
  bad('null phase',nodes=>{nodes[2].status=null;});
  bad('state-reference disabled is not supported',nodes=>{nodes[0].disabled={$:'off'};});
  bad('mobile must be boolean',nodes=>{nodes[0].mobile='true';});
  bad('overlong URL',nodes=>{nodes[0].url='https://example.test/'+ 'x'.repeat(2049);});
  bad('overlong source title',nodes=>{nodes[2].title='x'.repeat(201);});
  bad('overlong supplied snippet',nodes=>{nodes[2].snippet='x'.repeat(2001);});
  bad('too many passive children',nodes=>{nodes[0].children=Array.from({length:33},()=>({type:'text',value:'Original passive content'}));});
  bad('automatic preview endpoint is not supported',nodes=>{nodes[0].previewEndpoint='https://example.test/unrequested';});
  bad('legacy destination cannot mix supplied URL',nodes=>{nodes[0]={type:'link',value:'Original legacy',href:'https://example.test/legacy',url:'https://example.test/new'};},'LINK_VARIANT');
  bad('legacy destination cannot mix resolution phase',nodes=>{nodes[0]={type:'link',value:'Original legacy',href:'https://example.test/legacy',status:'pending'};},'LINK_VARIANT');
  bad('interactive descendant is not passive link content',nodes=>{nodes[0].children=[{type:'button',label:'Nested action',action:{kind:'reset'}}];},'LINK_CONTENT','/body/0/children/0');
  bad('linked text cannot be nested',nodes=>{nodes[0].children=[{type:'text',runs:[{value:'Nested link',href:'https://example.test/nested'}]}];},'LINK_INTERACTIVE','/body/0/children/0/runs/0/href');
  bad('external child image requires a separate gate',nodes=>{nodes[0].children=[{type:'image',src:'https://example.test/child.png',alt:'Separate image'}];},'LINK_EXTERNAL_MEDIA','/body/0/children/0/src');
  return{positives,negatives};
}
