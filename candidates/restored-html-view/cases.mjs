export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['original offline authored script and handler', structuredClone(input)],
    ['explicit empty authored document', edit(n => { n.html = ''; })],
    ['small bounded dimensions', edit(n => { n.height = 40; n.width = 40; })],
    ['large bounded dimensions', edit(n => { n.height = 4096; n.width = '1%'; })],
    ['no authored executable code', edit(n => { n.html = '<p>Only supplied local text.</p>'; delete n.title; delete n.height; delete n.width; })]
  ];
  const negative = (name, fn) => [name, edit(fn), 'SCHEMA'];
  const negatives = [
    negative('HTML must be a literal string', n => { n.html = { $: 'html' }; }),
    negative('empty accessible frame title', n => { n.title = ''; }),
    negative('height below40', n => { n.height = 39; }),
    negative('height above4096', n => { n.height = 4097; }),
    negative('noninteger height', n => { n.height = 40.5; }),
    negative('zero percent width', n => { n.width = '0%'; }),
    negative('percent width above100', n => { n.width = '101%'; }),
    negative('CSS expression width', n => { n.width = 'calc(100% - 1px)'; }),
    negative('authored HTML bound', n => { n.html = 'x'.repeat(200001); }),
    negative('sandbox permissions cannot be authored', n => { n.sandbox = 'allow-same-origin allow-scripts'; }),
    negative('message bridge is unsupported', n => { n.messenger = true; })
  ];
  return { positives, negatives };
}
