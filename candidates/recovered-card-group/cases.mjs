export function buildCases(document) {
  const make = change => { const d = structuredClone(document); change(d.body.find(n => n.type === 'follow-up-card-group')); return d; };
  const positives = [
    ['original three intents', make(() => {})],
    ['genuine empty list', make(n => {n.items = []})],
    ['loading without invented message', make(n => {n.status = 'loading';n.items = []})],
    ['supplied error message', make(n => {n.status = 'error';n.message = 'The supplied list is unavailable.'})],
    ['error without fallback', make(n => {n.status = 'error';n.items = []})],
    ['40 unique actions', make(n => {n.items = Array.from({length:40}, (_,i) => ({id:'item_'+i,label:'Supplied choice '+i,intent:{kind:'query',query:'Explain item '+i}}))})],
    ['4000-character query', make(n => {n.items[0].intent.query = 'a'.repeat(4000)})],
    ['disabled literal item', make(n => {n.items[0].disabled = true})],
    ['literal hostile-looking label', make(n => {n.items[0].label = '<script>not executable</script>'})]
  ];
  const negatives = [
    ['duplicate IDs', make(n => {n.items[1].id=n.items[0].id}), 'DUPLICATE_ID'],
    ['mixed intent fields', make(n => {n.items[0].intent.url='https://example.org'}), 'SCHEMA'],
    ['missing intent', make(n => {delete n.items[0].intent}), 'SCHEMA'],
    ['41 actions', make(n => {n.items=Array.from({length:41},(_,i)=>({...n.items[0],id:'item_'+i}))}), 'SCHEMA'],
    ['4001-character query', make(n => {n.items[0].intent.query='a'.repeat(4001)}), 'SCHEMA'],
    ['numeric query', make(n => {n.items[0].intent.query=0}), 'SCHEMA'],
    ['unsupported prefill surface', make(n => {n.items[2].intent.surface='chat'}), 'SCHEMA'],
    ['handler injection', make(n => {n.items[0].onClick='alert(1)'}), 'SCHEMA'],
    ['unknown loading state', make(n => {n.status='pending'}), 'SCHEMA'],
    ['nonboolean disabled', make(n => {n.items[0].disabled='false'}), 'SCHEMA'],
    ['blank visible label', make(n => {n.items[0].label=''}), 'SCHEMA'],
    ['relative destination', make(n => {n.items[1].intent.url='/reference'}), 'UNSAFE_URL'],
    ['script destination', make(n => {n.items[1].intent.url='javascript:alert(1)'}), 'UNSAFE_URL'],
    ['credentialed destination', make(n => {n.items[1].intent.url='https://user:pass@example.org'}), 'UNSAFE_URL'],
    ['remote icon', make(n => {n.items[0].iconData='https://example.org/icon.png'}), 'UNSAFE_URL'],
    ['SVG icon', make(n => {n.items[0].iconData='data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='}), 'UNSAFE_URL']
  ];
  return {positives, negatives};
}
