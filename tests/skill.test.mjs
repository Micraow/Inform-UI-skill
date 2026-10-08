import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { checkSkill, forbiddenPath, root } from '../scripts/check-skill.mjs';

const json = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));

test('skill metadata, local references and public distribution boundary are valid', async () => {
  assert.ok((await checkSkill()).includes('SKILL.md'));
});

test('distribution boundary rejects evidence, runtime captures and non-JS implementation files', () => {
  for (const file of ['private-evidence/a.txt', 'source/captured-lazy/asset.js', 'source/native-runtime-v1/a.js', 'figures/user-example.png', 'run.py', 'requirements.txt', 'request.har', 'factories.js', '.env.local']) assert.equal(forbiddenPath(file), true, file);
  for (const file of ['SKILL.md', 'references/support.md', 'examples/rtt-trend.json', 'scripts/check-skill.mjs']) assert.equal(forbiddenPath(file), false, file);
});

test('all example inputs are complete documents with no native or executable escape hatch', async () => {
  const files = (await readdir(path.join(root, 'examples'))).filter(file => file.endsWith('.json'));
  assert.ok(files.length >= 5);
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    assert.notEqual(value.type, 'native');
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!['html', 'css', 'script', 'onClick', 'onclick', 'function'].includes(key), key);
      visit(child);
    }
  }
  for (const file of files) {
    const document = await json(`examples/${file}`);
    assert.equal(document.version, 'iui/1');
    assert.ok(Array.isArray(document.body) && document.body.length > 0);
    visit(document);
  }
});

test('minimal prose stays usable without decorative layout or state', async () => {
  const document = await json('examples/minimal.json');
  assert.equal(document.body.length, 1);
  assert.equal(document.body[0].type, 'text');
  assert.equal(document.state, undefined);
});

test('missing observations remain null in chart and inspectable source table', async () => {
  const document = await json('examples/rtt-trend.json');
  const chart = document.body.find(node => node.type === 'chart');
  const table = document.body.find(node => node.type === 'details').children[0];
  chart.data.forEach((point, index) => {
    assert.equal(point.quiet, table.rows[index][1]);
    assert.equal(point.busy, table.rows[index][2]);
  });
  assert.equal(chart.data[2].quiet, null);
  assert.equal(chart.unit, 'ms');
});

test('support inventory names each portable node once and rejects native', async () => {
  const inventory = await json('references/node-support.json');
  assert.equal(new Set(inventory.map(item => item.type)).size, inventory.length);
  assert.equal(inventory.length, 34);
  assert.equal(inventory.find(item => item.type === 'native').status, 'rejected');
  assert.equal(inventory.find(item => item.type === 'markdown').status, 'plain-text-fallback');
  assert.ok(inventory.filter(item => !['native', 'markdown'].includes(item.type)).every(item => item.status === 'portable'));
});
