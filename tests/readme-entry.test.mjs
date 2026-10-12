import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, lstat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('reader entry provides a real skill installation and one pinned runtime quickstart', async () => {
  const readme = await read('README.md');
  assert.ok(Buffer.byteLength(readme) < 7500, 'Keep the user-facing entry short.');
  assert.match(readme, /\.agents\/skills\/inform-ui-author/);
  assert.match(readme, /git clone --branch recovery\/consumers-126-20261011/);
  const revision = readme.match(/git -C Inform-UI checkout --detach ([a-f0-9]{40})/)?.[1];
  assert.equal(revision, '17f4ca2fed7c5cee5a2165e5a0fba190263d126a');
  assert.ok(readme.includes('https://github.com/Micraow/Inform-UI/tree/' + revision));
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
