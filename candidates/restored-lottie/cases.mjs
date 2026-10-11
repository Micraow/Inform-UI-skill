export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(...d.body); return d; };
  const positives = [
    ['original paused vector and inline bitmap', structuredClone(input)],
    ['static vector frame', edit(vector => { vector.source.layers[0].ks.p = { a: 0, k: [60, 40, 0] }; })],
    ['explicit finite seek and reverse rate', edit(vector => { vector.currentTime = 1; vector.advanceRate = -1; })],
    ['loop and finite segment', edit(vector => { vector.loop = true; vector.animationStartTime = 0.25; vector.animationEndTime = 1.75; })],
    ['inline JSON data URL', edit(vector => { vector.source = 'data:application/json,' + encodeURIComponent(JSON.stringify(vector.source)); })],
    ['embedded original raster asset', edit((vector, bitmap) => { const transform = structuredClone(vector.source.layers[0].ks); vector.source.assets = [{ id: 'original-square', w: 16, h: 16, p: bitmap.source, u: '', e: 1 }]; vector.source.layers = [{ ind: 1, ty: 2, refId: 'original-square', nm: 'Original raster layer', ks: transform, sr: 1, ip: 0, op: 60, st: 0 }]; })]
  ];
  const negative = (name, fn, code = 'LOTTIE_DATA', path = '/body/0/source') => [name, edit(fn), code, path];
  const negatives = [
    negative('zero-duration animation', v => { v.source.op = v.source.ip; }),
    negative('missing image asset reference', v => { v.source.layers[0].ty = 2; v.source.layers[0].refId = 'missing'; }),
    negative('duplicate layer index', v => { v.source.layers.push(structuredClone(v.source.layers[0])); }),
    negative('unknown parent layer', v => { v.source.layers[0].parent = 99; }),
    negative('external animation segment', v => { v.source.segments = [{ time: 0, path: 'https://example.org/segment.json' }]; }),
    negative('external font resource', v => { v.source.fonts = { list: [{ fName: 'Unloaded', fPath: 'https://example.org/font.woff2' }] }; }),
    negative('executable expression', v => { v.source.layers[0].ks.o.x = 'untrusted()'; }),
    negative('unsupported audio layer', v => { v.source.layers[0].ty = 6; }),
    negative('excessive repeater', v => { v.source.layers[0].shapes[0].it.push({ ty: 'rp', c: { a: 0, k: 101 } }); }),
    negative('unsafe animation source', v => { v.source = 'javascript:untrusted()'; }, 'UNSAFE_URL'),
    negative('invalid inline JSON', v => { v.source = 'data:application/json,%7B'; }, 'LOTTIE_SOURCE'),
    negative('rate exceeds finite bound', v => { v.advanceRate = 17; }, 'LOTTIE_TIME', '/body/0/advanceRate'),
    negative('time must be numeric', v => { v.currentTime = 'one'; }, 'LOTTIE_TIME', '/body/0/currentTime'),
    negative('null is not playback time', v => { v.currentTime = null; }, 'LOTTIE_TIME', '/body/0/currentTime'),
    negative('unbounded width', v => { v.width = 4097; }, 'SCHEMA', '/body/0/width')
  ];
  return { positives, negatives };
}
