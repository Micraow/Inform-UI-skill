import { createRequire } from 'node:module';
import { readFile, readdir, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { readSkillShell, root } from './check-skill.mjs';

function argument(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith('--')) throw new Error(`${flag} requires a value`);
  return process.argv[index + 1];
}
const library = path.resolve(argument('--library') || process.env.IUI_LIBRARY_DIR || path.join(root, '../Intelligent-UI'));
const packageJson = JSON.parse(await readFile(path.join(library, 'package.json'), 'utf8'));
const contract = JSON.parse(await readFile(path.join(root, 'library-contract.json'), 'utf8'));
assert.equal(packageJson.name, contract.packageName);
assert.equal(packageJson.version, contract.packageVersion);
const require = createRequire(path.join(library, 'package.json'));
const { chromium } = require('@playwright/test');
const entry = packageJson.exports['.'].import;
const { compileHtml } = await import(pathToFileURL(path.resolve(library, entry)).href);
const directory = await mkdtemp(path.join(tmpdir(), 'iui-skill-browser-'));
const screenshots = argument('--screenshots');
const shell = readSkillShell(await readFile(path.join(root, 'SKILL.md'), 'utf8'));
if (screenshots) await mkdir(screenshots, { recursive: true });
let browser;
let count = 0;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.IUI_BROWSER_EXECUTABLE ? { executablePath: process.env.IUI_BROWSER_EXECUTABLE } : {}) });
  const exampleNames = (await readdir(path.join(root, 'examples'))).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5)).sort();
  for (const name of exampleNames) {
    const document = JSON.parse(await readFile(path.join(root, 'examples', `${name}.json`), 'utf8'));
    for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
      const label = `${name}-${width}-${theme}`;
      const file = path.join(directory, `${label}.html`);
      const cdn = ['supplied-sports', 'local-learning'].includes(name);
      const authored = { ...document, theme };
      const html = cdn ? shell.html.replace(/(<script id="iui-spec" type="application\/json">)[\s\S]*?(<\/script>)/, (_, open, close) => open + JSON.stringify(authored).replaceAll('<', '\\u003c') + close).replace('data-theme="auto"', `data-theme="${theme}"`)
        : await compileHtml(authored, { lang: ['hpcc-feedback', 'local-practice', 'supplied-weather', 'coordinate-scenarios'].includes(name) ? 'zh-CN' : 'en' });
      await writeFile(file, html);
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
      if (cdn) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      }
      const errors = [];
      const responses = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => responses.push({ url: response.url(), status: response.status() }));
      await page.goto(pathToFileURL(file).href);
      await page.waitForSelector('.iui-root');
      const bounds = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      assert.ok(bounds.scroll <= bounds.viewport + 1, `${label}: whole-page horizontal overflow ${JSON.stringify(bounds)}`);
      assert.equal(await page.locator('.iui-math-error').count(), 0, `${label}: invalid formula`);
      if (cdn) {
        for (const asset of [contract.cdn.global, contract.cdn.style]) assert.ok(responses.some(response => response.url === contract.cdn.baseUrl + asset && response.status === 200));
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        if (theme === 'dark') assert.notEqual(bg, 'rgb(255, 255, 255)', 'Document shell left a white dark-theme canvas');
        await page.evaluate(() => document.fonts.ready);
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${label}-initial.png`), fullPage: true });
      }
      if (name === 'supplied-sports') {
        const schedule = page.locator('.iui-sports-schedule').first();
        assert.equal(await schedule.locator('details[data-game-id]').count(), 1);
        await schedule.getByRole('combobox', { name: '比赛日期', exact: true }).selectOption({ label: '全部' });
        assert.equal(await schedule.locator('details[data-game-id]').count(), 4);
        await schedule.getByRole('combobox', { name: '球队', exact: true }).selectOption({ label: '东桥队' });
        assert.equal(await schedule.locator('details[data-game-id]').count(), 2);
        const board = page.locator('.iui-sports-scoreboard').first();
        assert.equal(await board.locator('.iui-sports-score[data-raw-value="0"]').count(), 2);
        const options = await board.locator('option').allTextContents();
        const completedMatch = options.find(label => label.includes('西堤') && label.includes('北岸'));
        assert.ok(completedMatch);
        await board.getByRole('combobox').selectOption({ label: completedMatch });
        assert.ok((await board.textContent()).includes('点球'));
        assert.ok((await board.locator('.iui-sports-winner').textContent()).length > 0);
        const standings = page.locator('.iui-sports-standings').first();
        await standings.getByRole('button', { name: /排序.*积分/ }).click();
        assert.ok((await standings.textContent()).includes('-1'));
        assert.ok((await standings.textContent()).includes('缺测'));
        await standings.getByRole('combobox', { name: '球队', exact: true }).selectOption({ label: '西堤队' });
        assert.equal(await standings.locator('tbody tr').count(), 1);
        await page.getByText('空、加载和错误状态', { exact: true }).click();
        assert.ok(await page.getByText('教学错误状态；组件不会自行重试或联系数据服务。', { exact: true }).isVisible());
      }
      if (name === 'local-learning') {
        const quiz = page.locator('.iui-quiz').first();
        assert.ok(await quiz.getByRole('button', { name: '确认答案', exact: true }).isDisabled());
        await quiz.getByRole('radio', { name: '40%', exact: true }).check();
        await quiz.getByRole('button', { name: '确认答案', exact: true }).click();
        assert.ok((await quiz.locator('.iui-learning-feedback').textContent()).includes('回答正确'));
        // Submitted answers gain an accessible "参考答案" note; assert the actual lock
        // independently of that intentional label change.
        assert.equal(await quiz.locator('input:enabled').count(), 0);
        assert.equal(await quiz.locator('input:checked').inputValue(), 'four');
        await quiz.getByRole('button', { name: '下一题', exact: true }).click();
        await quiz.getByRole('checkbox', { name: '保留单位与采样口径', exact: true }).check();
        await quiz.getByRole('button', { name: '确认答案', exact: true }).click();
        assert.equal(await quiz.locator('.iui-learning-feedback').getAttribute('data-correct'), 'false', 'Partial multiple-choice set received credit');
        await quiz.getByRole('button', { name: '查看结果', exact: true }).click();
        assert.equal(await quiz.locator('.iui-learning-score').textContent(), '得分: 2 / 5');
        await quiz.getByRole('button', { name: '重新开始', exact: true }).click();
        assert.equal(await quiz.locator('input:checked').count(), 0);
        const cards = page.locator('.iui-flashcards').first();
        assert.ok(await cards.getByRole('button', { name: '已掌握', exact: true }).isDisabled());
        await cards.getByRole('button', { name: '查看答案', exact: true }).click();
        await cards.getByRole('button', { name: '已掌握', exact: true }).click();
        await cards.getByRole('button', { name: '下一张', exact: true }).click();
        assert.equal(await cards.locator('.iui-flashcard').getAttribute('data-side'), 'front');
        await cards.getByRole('button', { name: '查看答案', exact: true }).click();
        await cards.getByRole('button', { name: '再练一次', exact: true }).click();
        await cards.getByRole('button', { name: '查看结果', exact: true }).click();
        assert.equal(await cards.locator('.iui-learning-score').textContent(), '已掌握: 1 / 2');
        await cards.getByRole('button', { name: '重新开始', exact: true }).click();
        assert.equal(await cards.locator('progress').getAttribute('value'), '0');
        await page.getByText('没有题目或卡片时', { exact: true }).click();
        assert.ok(await page.getByText('内容暂不可用；没有远程批改或自动重试。', { exact: true }).isVisible());
      }
      if (name === 'hpcc-feedback') {
        await page.getByRole('slider').focus();
        for (let step = 0; step < 3; step++) await page.keyboard.press('ArrowLeft');
        assert.equal(await page.getByRole('slider').inputValue(), '0.9', `${label}: keyboard input lost focus or did not update`);
        const metrics = await page.locator('.iui-metric-value').allTextContents();
        assert.ok(metrics.some(text => text.includes('110.6')), `${label}: result did not visibly update`);
        await page.getByRole('button', { name: '恢复示例值' }).click();
        assert.equal(await page.getByRole('slider').inputValue(), '1.2', `${label}: reset failed`);
      }
      if (name === 'rtt-trend') {
        await page.getByText('Inspect the values', { exact: true }).click();
        assert.ok(await page.getByRole('table').isVisible(), `${label}: values are inaccessible`);
      }
      if (name === 'local-practice') {
        await page.evaluate(() => {
          window.__skillSubmits = [];
          document.addEventListener('iui:submit', event => window.__skillSubmits.push(event.detail));
        });
        const sessions = page.getByRole('spinbutton', { name: /练习次数/ });
        await sessions.fill('4');
        assert.ok((await page.locator('.iui-metric-value').textContent()).includes('95'));
        await page.getByRole('checkbox', { name: '锁定备注', exact: true }).check();
        assert.ok(await page.getByRole('textbox', { name: '备注', exact: true }).isDisabled());
        await page.getByRole('button', { name: '仅在本页确认', exact: true }).click();
        await page.waitForFunction(() => window.__skillSubmits.length === 1);
        const submitted = await page.evaluate(() => window.__skillSubmits[0]);
        assert.equal(submitted.id, 'practice-local');
        assert.equal(submitted.values.sessions, 4);
        for (const key of ['notes', 'internalLabel', 'total']) assert.equal(Object.hasOwn(submitted.values, key), false, `Form leaked ${key}`);
        await sessions.fill('');
        await page.getByRole('button', { name: '仅在本页确认', exact: true }).click();
        assert.equal(await sessions.getAttribute('aria-invalid'), 'true');
        assert.equal(await page.evaluate(() => window.__skillSubmits.length), 1);
        assert.ok((await page.locator('.iui-metric-value').textContent()).includes('95'), 'Invalid numeric draft changed last valid state');
        await page.getByRole('button', { name: '恢复输入', exact: true }).click();
        assert.equal(await sessions.inputValue(), '3');
        assert.ok(await page.getByRole('textbox', { name: '备注', exact: true }).isEnabled());
        assert.ok((await page.locator('.iui-metric-value').textContent()).includes('70'));
      }
      if (name === 'supplied-weather') {
        const weather = page.locator('.iui-weather').first();
        await weather.getByRole('button', { name: '华氏度', exact: true }).click();
        assert.ok((await weather.textContent()).includes('53.6'));
        await weather.getByRole('button', { name: '摄氏度', exact: true }).click();
        await weather.getByRole('tab', { name: /12月16日/ }).click();
        await weather.getByRole('button', { name: '表格', exact: true }).click();
        assert.ok(await weather.getByRole('table').isVisible());
        assert.ok((await weather.getByRole('table').textContent()).includes('缺测'));
        await page.getByText('查看空、加载和失败的明确边界', { exact: true }).click();
        assert.ok(await page.getByText('调用方尚未提供数据；本组件不会发起请求。', { exact: true }).isVisible());
        assert.ok(await page.getByText('教学错误状态；没有后台请求或自动重试。', { exact: true }).isVisible());
      }
      if (name === 'coordinate-scenarios') {
        const line = page.locator('svg[aria-label="不等距测点"]');
        const xs = await line.locator('circle[data-point]').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('cx'))));
        assert.equal(xs.length, 3);
        assert.ok(Math.abs((xs[1] - xs[0]) / (xs[2] - xs[0]) - 0.01) < 1e-8, 'Linear X was rendered as categories');
        const time = page.locator('svg[aria-label="跨年且间隔不等的时间轴"]');
        assert.ok((await time.locator('text').allTextContents()).includes('0.000001'), 'Tiny explicit-axis tick lost precision');
        await time.focus();
        await page.keyboard.press('End');
        const readout = time.locator('..').locator('.iui-chart-readout');
        const text = await readout.textContent();
        assert.ok(text.includes('2027') && text.includes('00:00:00.900') && text.includes('GMT+08:00'));
        await page.getByText('空、单点与加载/错误状态', { exact: true }).click();
        assert.ok(await page.getByText('仅为教学状态，不触发联网。', { exact: true }).isVisible());
        assert.ok(await page.getByText('教学错误状态，不会自动请求或重试。', { exact: true }).isVisible());
      }
      assert.deepEqual(errors, [], `${label}: browser error`);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${label}.png`), fullPage: true });
      await page.close();
      count++;
      console.log(`PASS ${label}`);
    }
  }
  const shellFile = path.join(directory, 'web-chat-shell.html');
  await writeFile(shellFile, shell.html);
  for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(pathToFileURL(shellFile).href);
    await page.waitForSelector('.iui-root');
    assert.deepEqual(errors, [], 'Copyable CDN shell has browser/load errors');
    await page.getByRole('slider').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('slider').inputValue(), '5');
    assert.equal((await page.locator('.iui-metric-value').textContent()).trim(), '10');
    const bounds = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    assert.ok(bounds.scroll <= bounds.viewport + 1, 'Copyable CDN shell overflows');
    if (screenshots) await page.screenshot({ path: path.join(screenshots, `web-chat-shell-${width}-${theme}.png`), fullPage: true });
    await page.close();
    count++;
    console.log(`PASS web-chat-shell-${width}-${theme} (file://, real CDN, SRI)`);
  }
  console.log(`Verified ${count} rendered views, keyboard feedback, reset and table disclosure.`);
} finally {
  await browser?.close();
  await rm(directory, { recursive: true, force: true });
}
