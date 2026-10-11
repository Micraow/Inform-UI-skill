import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { colorPng } from '../restored-learning-media/generate-fixture.mjs';
const property = k => ({ a: 0, k });
export function originalRectangle() {
  return {
    v: '5.13.0', nm: 'Original blue rectangle study', w: 120, h: 80, fr: 30, ip: 0, op: 60,
    assets: [], layers: [{
      ddd: 0, ind: 1, ty: 4, nm: 'Original moving rectangle', sr: 1, ao: 0,
      ks: { o: property(100), r: property(0), a: property([0, 0, 0]), s: property([100, 100, 100]),
        p: { a: 1, k: [{ t: 0, s: [30, 40, 0], e: [90, 40, 0], i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 } }, { t: 60, s: [90, 40, 0] }] } },
      shapes: [{ ty: 'gr', nm: 'Original rectangle and fill', it: [
        { ty: 'rc', d: 1, s: property([20, 20]), p: property([0, 0]), r: property(4), nm: 'Rounded square' },
        { ty: 'fl', c: property([33 / 255, 99 / 255, 220 / 255, 1]), o: property(100), r: 1, nm: 'Blue fill' },
        { ty: 'tr', p: property([0, 0]), a: property([0, 0]), s: property([100, 100]), r: property(0), o: property(100), sk: property(0), sa: property(0) }
      ] }], ip: 0, op: 60, st: 0, bm: 0
    }]
  };
}
export function buildFixture() {
  return { version: 'iui/1', title: 'Original supplied vector and bitmap', state: { time: 0, rate: 0 }, body: [
    { type: 'lottie', id: 'original-rectangle', alt: 'Original blue rectangle moving horizontally', source: originalRectangle(), width: 240, height: 160, fit: 'contain', loop: false, currentTime: { $: 'time' }, advanceRate: { $: 'rate' } },
    { type: 'lottie', id: 'original-bitmap', alt: 'Original orange square bitmap', source: 'data:image/png;base64,' + colorPng([224, 118, 30]).toString('base64'), width: 64, height: 64, fit: 'contain' }
  ] };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) await writeFile(new URL('examples/supplied-lottie.json', import.meta.url), JSON.stringify(buildFixture(), null, 2) + '\n');
