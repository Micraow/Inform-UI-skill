export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(...d.body); return d; };
  const positives = [
    ['original inline image and on-demand video identifier', structuredClone(input)],
    ['missing supplied image', edit(i => { i.searchImage = null; })],
    ['pending supplied image and disabled video', edit((i, v) => { i.sourcePending = true; v.disabled = true; })],
    ['reference video defaults are explicit', edit((i, v) => { delete v.loadMode; delete v.fullscreen; delete v.startSeconds; })],
    ['bounded image presentation metadata', edit(i => { i.aspectRatio = '16:9'; i.position = '50% 50%'; i.containOutsideAspectRatio = { min: 0.5, max: 2 }; i.upgradeToFullRes = false; })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('unsafe image source', i => { i.searchImage.content_url = 'javascript:untrusted()'; }, 'UNSAFE_URL', '/body/0/searchImage/content_url'),
    negative('zero string aspect ratio', i => { i.aspectRatio = '0:1'; }, 'SEARCH_IMAGE_RATIO', '/body/0/aspectRatio'),
    negative('position above100 percent', i => { i.position = '101% 50%'; }, 'SEARCH_IMAGE_POSITION', '/body/0/position'),
    negative('unordered containment thresholds', i => { i.containOutsideAspectRatio = { min: 2, max: 2 }; }, 'SEARCH_IMAGE_RATIO', '/body/0/containOutsideAspectRatio'),
    negative('blank video label', (i, v) => { v.label = ' '; }, 'YOUTUBE_LABEL', '/body/1/label'),
    negative('nonboolean video disabled', (i, v) => { v.disabled = 'false'; }, 'INPUT_TYPE', '/body/1/disabled'),
    negative('automatic source upgrade is unsupported', i => { i.upgradeToFullRes = true; }),
    negative('search query is not supplied image data', i => { i.query = 'find pictures'; }),
    negative('invalid video identifier', (i, v) => { v.videoId = 'not a URL!!'; }),
    negative('video URL is not a field', (i, v) => { v.url = 'https://example.org/video'; }),
    negative('negative start offset', (i, v) => { v.startSeconds = -1; }),
    negative('unbounded start offset', (i, v) => { v.startSeconds = 86401; })
  ];
  return { positives, negatives };
}
