import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { gridCompletionFixtures, drawPanel } from '../candidates/image-grid-completion-draft/fixtures.mjs';
test('Five original panels decode as finite RGB PNG data with intentionally different dimensions', () => {
  const f = gridCompletionFixtures(); assert.equal(f.images.length, 5); assert.equal(new Set(f.images.map(i => i.id)).size, 5);
  for (const image of f.images) { const png = Buffer.from(image.src.split(',')[1], 'base64'); assert.equal(png.subarray(1, 4).toString(), 'PNG'); assert.equal(png.readUInt32BE(16), image.width); assert.equal(png.readUInt32BE(20), image.height); const length = png.readUInt32BE(33); assert.equal(png.subarray(37, 41).toString(), 'IDAT'); const rows = inflateSync(png.subarray(41, 41 + length)); assert.equal(rows.length, image.height * (1 + image.width * 3)); }
});
test('Two irregular rows reference all five panels without making recommendations into network actions', () => {
  const f = gridCompletionFixtures(); assert.deepEqual(f.rows.map(r => r.tiles.length), [2, 3]); assert.deepEqual(f.rows.flatMap(r => r.tiles.map(t => t.imageId)), f.images.map(i => i.id)); assert.equal(f.recommendations.length, 4); assert.ok(f.recommendations.every(r => r.query.includes('supplied') && r.thumbnailSrc.startsWith('data:image/png;base64,')));
});
test('Fixture data is reproducible and does not share mutable collections', () => {
  const a = gridCompletionFixtures(), b = gridCompletionFixtures(); assert.deepEqual(a, b); a.rows[0].tiles.pop(); assert.equal(b.rows[0].tiles.length, 2); assert.deepEqual(drawPanel(16, 16, [10, 20, 30]), drawPanel(16, 16, [10, 20, 30])); assert.throws(() => drawPanel(257, 1, [0, 0, 0]), /Finite/); assert.throws(() => drawPanel(16, 16, [300, 0, 0]), /RGB/);
});
