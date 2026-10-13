import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, lstat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('reader entry provides a real skill installation and one pinned runtime quickstart', async () => {
  const readme = await read('README.md');
  assert.ok(Buffer.byteLength(readme) < 9500, 'Keep the user-facing entry short.');
  assert.match(readme, /\.agents\/skills\/inform-ui-author/);
  assert.match(readme, /git clone \\\n  https:\/\/github\.com\/Micraow\/Inform-UI-skill\.git/);
  const revision = readme.match(/git -C Inform-UI checkout --detach ([a-f0-9]{40})/)?.[1];
  assert.equal(revision, '5849d9ba6352da8f3fe32dcf3525d0418129e3f8');
  assert.ok(readme.includes('https://github.com/Micraow/Inform-UI/tree/' + revision));
  assert.ok(readme.includes('https://github.com/Micraow/Inform-UI/blob/' + revision + '/docs/showcase.md'));
  assert.match(readme, /npm --prefix Inform-UI run showcase/);
  assert.match(readme, /http:\/\/127\.0\.0\.1:4175/);
  assert.match(readme, /218 个可渲染示例/);
  assert.match(readme, /`native` 拒绝边界/);
  assert.match(readme, /iui\.mjs validate \.agents\/skills\/inform-ui-author\/getting-started\/capacity\.json --json/);
  assert.match(readme, /iui\.mjs build \.agents\/skills\/inform-ui-author\/getting-started\/capacity\.json --out answer\.html --lang zh-CN/);
  assert.match(readme, /不依赖 OpenAI SDK、账号或 API/);
  assert.doesNotMatch(readme, /你负责|始终保留的语义|默认注入|待完整验收|npm install @micraow/);
  for (const match of readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(match[1])) continue;
    assert.ok(await lstat(new URL(match[1].split('#')[0], root)), match[1]);
  }
});

test('quickstart stays an original local capacity example with explicit bounds', async () => {
  const document = JSON.parse(await read('getting-started/capacity.json'));
  assert.equal(document.version, 'iui/1');
  assert.deepEqual(document.state, { attendees: 12 });
  assert.deepEqual(document.computed.remaining, { op: 'sub', args: [30, { $: 'attendees' }] });
  assert.match(document.body[0].value, /原创合成示例/);
  const form = document.body[1];
  assert.equal(form.type, 'form');
  assert.deepEqual(form.children[0], { type: 'slider', label: '参加人数', bind: 'attendees', min: 0, max: 30, step: 1 });
  assert.deepEqual(form.children[1], { type: 'metric', label: '剩余名额', value: { $: 'remaining' }, unit: '个' });
  assert.match(form.children[2].value, /不提交报名/);
  assert.doesNotMatch(JSON.stringify(document), /https?:|"action"|"onClick"|"script"|"native"/);
});

test('readme illustration is original, static and clearly labeled as a concept', async () => {
  const svg = await read('assets/overview.svg');
  assert.match(svg, /Original conceptual illustration/);
  assert.match(svg, /Not a screenshot/);
  assert.match(svg, /<title id="title">Inform UI Skill<\/title>/);
  assert.doesNotMatch(svg, /<script|<foreignObject|<image|\bon\w+=|href=/i);
});

test('README gallery images are real landscape PNGs with a three-page panorama', async () => {
  const readme = await read('README.md');
  for (const name of ['create', 'explore', 'compose', 'panorama']) {
    const path = `assets/gallery-${name}.png`;
    assert.ok(readme.includes(path));
    const image = await readFile(new URL(path, root));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(image.readUInt32BE(16), name === 'panorama' ? 6480 : 2160);
    assert.equal(image.readUInt32BE(20), 1440);
  }
  assert.match(readme, /http:\/\/127\.0\.0\.1:4175\/gallery\.html/);
});
