import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCases } from '../candidates/restored-html-view/cases.mjs';
const input = JSON.parse(await readFile(new URL('../candidates/restored-html-view/examples/local-label-picker.json', import.meta.url)));
test('Original HTML picker has only supplied local labels and explicit local actions', () => {
  const n = input.body[0]; assert.equal(n.type, 'html-view'); assert.equal(n.title, 'Local supplied label picker');
  assert.match(n.html, /\['Cedar', 'Linen'\]/); assert.match(n.html, /onclick=/); assert.match(n.html, /addEventListener/);
  assert.doesNotMatch(n.html, /https?:|\bfetch\s*\(|\bimport\b|localStorage|postMessage/);
});
test('HTML authoring draft keeps bounded structure and no configurable sandbox', () => {
  const before = JSON.stringify(input), c = buildCases(input); assert.equal(c.positives.length, 5); assert.equal(c.negatives.length, 11); assert.equal(JSON.stringify(input), before);
  assert.ok(c.negatives.find(([n]) => n === 'sandbox permissions cannot be authored'));
});
