export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(d.body[0]); return d; };
  const positives = [
    ['three independently generated inline colors', structuredClone(input)],
    ['explicit empty grid', edit(n => { n.images = []; })],
    ['one-column supplied grid', edit(n => { n.columns = 1; })],
    ['four-column cover grid', edit(n => { n.columns = 4; n.fit = 'cover'; })],
    ['explicitly disabled grid', edit(n => { n.disabled = true; })],
    ['twenty-four finite supplied images', edit(n => { n.images = Array.from({ length: 24 }, (_, i) => ({ ...structuredClone(n.images[i % 3]), id: 'color_' + i })); })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('duplicate supplied image ID', n => { n.images[1].id = n.images[0].id; }, 'IMAGE_GRID_ID', '/body/0/images/1/id'),
    negative('blank alternative text', n => { n.images[0].alt = ' '; }, 'IMAGE_GRID_ALT', '/body/0/images/0/alt'),
    negative('unsafe supplied image source', n => { n.images[0].src = 'javascript:untrusted()'; }, 'IMAGE_GRID_SOURCE', '/body/0/images/0/src'),
    negative('images are required', n => { delete n.images; }),
    negative('image ID is required', n => { delete n.images[0].id; }),
    negative('source is required', n => { delete n.images[0].src; }),
    negative('alternative text is required', n => { delete n.images[0].alt; }),
    negative('zero columns are invalid', n => { n.columns = 0; }),
    negative('five columns exceed bound', n => { n.columns = 5; }),
    negative('unsupported fit value', n => { n.fit = 'stretch'; }),
    negative('disabled is literal boolean', n => { n.disabled = 'true'; }),
    negative('unbounded caption', n => { n.images[0].caption = 'x'.repeat(501); }),
    negative('twenty-five images exceed bound', n => { n.images = Array.from({ length: 25 }, (_, i) => ({ ...structuredClone(n.images[0]), id: 'color_' + i })); }),
    negative('default navigation is not part of grid intent', n => { n.images[0].href = 'https://example.org/image'; }),
    negative('unbounded alternative text', n => { n.images[0].alt = 'x'.repeat(201); })
  ];
  return { positives, negatives };
}
