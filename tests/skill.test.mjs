import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { checkSkill, forbiddenPath, parseSkillFrontmatter, readSkillShell, root } from '../scripts/check-skill.mjs';

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
  assert.equal(inventory.length, 50);
  assert.equal(inventory.find(item => item.type === 'native').status, 'rejected');
  assert.equal(inventory.find(item => item.type === 'markdown').status, 'plain-text-fallback');
  assert.ok(inventory.filter(item => !['native', 'markdown'].includes(item.type)).every(item => item.status === 'portable'));
});

test('metadata parsing accepts Windows line endings and a UTF-8 BOM', async () => {
  const source = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const normalized = source.replace(/\r\n?/g, '\n');
  const expected = parseSkillFrontmatter(normalized);
  assert.deepEqual(parseSkillFrontmatter(normalized.replaceAll('\n', '\r\n')), expected);
  assert.deepEqual(parseSkillFrontmatter('\uFEFF' + normalized), expected);
  assert.throws(() => parseSkillFrontmatter('No frontmatter'), /frontmatter/);
});

test('the copyable entrypoint contains a complete JSON-backed shell and pinned CDN integrity', async () => {
  const source = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const { html, document } = readSkillShell(source);
  const contract = await json('library-contract.json');
  assert.equal(document.version, contract.schemaVersion);
  assert.ok(Array.isArray(document.body) && document.body.length > 0);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('</html>'));
  assert.ok(html.includes('src="' + contract.cdn.baseUrl + contract.cdn.global + '"'));
  assert.ok(html.includes('href="' + contract.cdn.baseUrl + contract.cdn.style + '"'));
  assert.ok(html.includes('integrity="' + contract.cdn.globalIntegrity + '"'));
  assert.ok(html.includes('integrity="' + contract.cdn.styleIntegrity + '"'));
  assert.ok(contract.cdn.baseUrl.includes('@' + contract.revision + '/cdn/'));
  assert.equal(new URL(contract.cdn.baseUrl).hostname, 'cdn.jsdelivr.net');
  assert.equal(source.includes('__IUI_'), false, 'Unresolved draft CDN data');
  assert.equal(html.includes('compileHtml'), false, 'Node-only compiler must not appear in the browser shell');
});

test('46-node blind input and first outputs remain byte-for-byte immutable', async () => {
  const { createHash } = await import('node:crypto');
  const hashes = {
    'input-skill.txt': '15a6d47b737619ef257054c806f5a99e27f9fdfbaf560933bf6470178d1262ea',
    'basketball-weekly.html': '2d4df5841c54a2cb43672f557f2266b36c5643bbb487f3641c0edadb3d7fab2c',
    'basketball-weekly.json': 'd4292000b1e985d0e85e4d2ebded8dcbc91d41e6d9de0573f650530a422b4e89'
  };
  for (const [file, expected] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(await readFile(path.join(root, 'tests/blind46', file))).digest('hex'), expected, file);
  }
  assert.equal((await json('tests/blind46/library-contract.json')).revision, 'f372c71d31633be85bb228f57fdb07da9e8f2112');
});

test('current branding uses Inform UI while the reference and immutable historical records stay explicit', async () => {
  const skill = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  assert.equal(parseSkillFrontmatter(skill).name, 'inform-ui-author');
  assert.equal((await json('package.json')).name, 'inform-ui-skill');
  assert.equal((await json('library-contract.json')).repository, 'Micraow/Inform-UI');
  assert.equal((await json('library-contract.json')).packageName, '@micraow/inform-ui');
  assert.ok(readme.includes('OpenAI Intelligent UI'), 'Do not rename the reference product');
  for (const phrase of ['独立、非官方', '并非由 OpenAI 开发、维护、赞助或认可', '不暗示官方关联', '许可证和知识产权', '不能替代', 'independent, unofficial community', 'not developed, maintained, sponsored, or endorsed by OpenAI', 'do not replace any permission']) assert.ok(readme.includes(phrase), phrase);
  for (const file of ['README.md', 'SKILL.md', 'references/library-workflow.md', 'references/finance.md', 'examples/resource-shortlist.json']) {
    const source = await readFile(path.join(root, file), 'utf8');
    assert.equal(source.includes('https://github.com/Micraow/Intelligent-UI'), false, `${file}: old current repository URL`);
    assert.equal(source.includes('https://cdn.jsdelivr.net/gh/Micraow/Intelligent-UI@'), false, `${file}: old current CDN URL`);
  }
  const { html, document } = readSkillShell(skill);
  assert.equal(document.version, 'iui/1');
  assert.ok(html.includes('window.IUI'));
  for (const directory of ['tests/blind', 'tests/blind46']) assert.equal((await json(`${directory}/library-contract.json`)).repository, 'Micraow/Intelligent-UI');
});
