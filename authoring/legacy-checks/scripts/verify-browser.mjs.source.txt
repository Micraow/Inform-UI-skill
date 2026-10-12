import { createRequire } from 'node:module';
import { readFile, readdir, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { readSkillShell, root } from './check-skill.mjs';
import { verifyConsumerReuse, reusableInlineRecord } from './verify-consumer-reuse.mjs';
import { trustedDiscoveryInputs } from './cdn-discovery-contract.mjs';

function argument(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith('--')) throw new Error(`${flag} requires a value`);
  return process.argv[index + 1];
}
const library = path.resolve(argument('--library') || process.env.IUI_LIBRARY_DIR || path.join(root, '../Inform-UI'));
const packageJson = JSON.parse(await readFile(path.join(library, 'package.json'), 'utf8'));
const contract = JSON.parse(await readFile(path.join(root, 'library-contract.json'), 'utf8'));
const expectedNodeTypes = JSON.parse(await readFile(path.join(root, 'references/node-support.json'), 'utf8')).map(node => node.type).sort();
assert.equal(packageJson.name, contract.packageName);
assert.equal(packageJson.version, contract.packageVersion);
const require = createRequire(path.join(library, 'package.json'));
const { chromium } = require('@playwright/test');
const entry = packageJson.exports['.'].import;
const { compileHtml } = await import(pathToFileURL(path.resolve(library, entry)).href);
const directory = await mkdtemp(path.join(tmpdir(), 'iui-skill-browser-'));
const screenshots = argument('--screenshots');
const reuseFlags=['--reuse-consumer-receipt','--reuse-lock','--consumer-core','--consumer-revision'];
const reuseValues=reuseFlags.map(argument);assert.ok(reuseValues.every(Boolean)||reuseValues.every(v=>v===undefined),'Supply all four explicit reuse anchors or none');
const reuse=reuseValues.every(Boolean)?await verifyConsumerReuse({receiptPath:path.resolve(reuseValues[0]),lockPath:path.resolve(reuseValues[1]),coreRoot:path.resolve(reuseValues[2]),coreRevision:reuseValues[3],libraryRoot:library,skillRoot:root}):null;

const shell = readSkillShell(await readFile(path.join(root, 'SKILL.md'), 'utf8'));
const exampleLanguages=JSON.parse(await readFile(path.join(root,'references/example-languages.json'),'utf8'));
assert.ok(exampleLanguages&&typeof exampleLanguages==='object'&&!Array.isArray(exampleLanguages),'Explicit example language map required');
const shellLanguage=shell.html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1];
assert.ok(shellLanguage,'Pinned shell language required');
const reusedInline=[];
const trustedDiscovery=await trustedDiscoveryInputs(library,contract);
if (screenshots) await mkdir(screenshots, { recursive: true });
let browser;
let count = 0;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.IUI_BROWSER_EXECUTABLE ? { executablePath: process.env.IUI_BROWSER_EXECUTABLE } : {}) });
  const exampleNames = (await readdir(path.join(root, 'examples'))).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5)).sort();
  for (const name of exampleNames) {
    const cdn = ['supplied-sports', 'local-learning', 'supplied-finance', 'supplied-heatmap', 'local-converters', 'auxiliary-surfaces', 'foundation-explainer', 'local-time', 'local-overlays', 'local-number-draft', 'timed-local-practice', 'local-status-primitives', 'primitives-with-form-and-time', 'loading-numeric-progress', 'loading-placeholder-shapes', 'supplied-source-reading'].includes(name);
    const lang=exampleLanguages[name];assert.ok(Object.hasOwn(exampleLanguages,name),'Missing explicit example locale: '+name);assert.ok(lang==='en'||lang==='zh-CN','Only en/zh-CN example languages are supported');
    if(cdn)assert.equal(lang,shellLanguage,'CDN example locale differs from pinned shell: '+name);
    const reusedRecord=reusableInlineRecord(reuse,{name,mode:cdn?'cdn':'inline',lang});
    if(reusedRecord){reusedInline.push(reusedRecord);console.log(`REUSED inline consumer ${name}; exact source/build/Skill, locale and complete evidence checked, not CDN credit`);continue;}
    const document = JSON.parse(await readFile(path.join(root, 'examples', `${name}.json`), 'utf8'));
    for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
      const label = `${name}-${width}-${theme}`;
      const file = path.join(directory, `${label}.html`);
      const authored = { ...document, theme };
      const html = cdn ? shell.html.replace(/(<script id="iui-spec" type="application\/json">)[\s\S]*?(<\/script>)/, (_, open, close) => open + JSON.stringify(authored).replaceAll('<', '\\u003c') + close).replace('data-theme="auto"', `data-theme="${theme}"`)
        : await compileHtml(authored, { lang });
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
      if (name === 'auxiliary-surfaces') {
        assert.equal(await page.locator('.iui-code code').textContent(), 'const example = "<safe text>";\n// Display only. Never execute.');
        assert.equal(await page.locator('.iui-code safe').count(), 0);
        if(contract.revision==='d370ffb2df310fce0da9299e6e254a58509ba544') {
          assert.ok((await page.locator('.iui-markdown').textContent()).includes('**这是原样Markdown文本**'));
          assert.equal(await page.locator('.iui-markdown strong').count(),0);
        } else {
          assert.equal(contract.revision,'26ec211fa529516af3b1523248f5912c45ec64c6','Review new Markdown behavior before changing this frozen assertion');
          assert.equal(await page.locator('.iui-markdown strong').count(),1);
          assert.equal(await page.locator('.iui-markdown strong').textContent(),'这是原样Markdown文本');
          assert.equal(await page.locator('.iui-markdown').textContent(),'这是原样Markdown文本，不会变成粗体。');
        }
        assert.equal(await page.getByRole('img', { name: '原创示意：两个点由直线相连', exact: true }).count(), 1);
        assert.equal(await page.locator('svg.iui-svg circle').count(), 2);
        const rail=page.locator('.iui-carousel');
        const overflows=await rail.evaluate(node=>node.scrollWidth>node.clientWidth+1);
        if(contract.revision==='d370ffb2df310fce0da9299e6e254a58509ba544'||overflows){await rail.focus();assert.ok(await rail.evaluate(node=>node===document.activeElement));}
        else assert.equal(await rail.getAttribute('tabindex'),null,'Finite fitting collection has no redundant tab stop');
      }
      if (name === 'local-converters') {
        const converters = page.locator('.iui-converter');
        const length = converters.nth(0), temperature = converters.nth(1), data = converters.nth(2), currency = converters.nth(3);
        const result = root => root.locator('.iui-converter-result').getAttribute('data-raw-value');
        assert.equal(await result(length), '125');
        const amount = length.getByRole('textbox', { name: '数值', exact: true });
        await amount.fill('2');
        assert.equal(await result(length), '200');
        await length.getByRole('button', { name: '互换原单位与目标单位', exact: true }).click();
        assert.equal(await result(length), '0.02');
        assert.equal(await amount.inputValue(), '2');
        for (const draft of ['', '1e', '1,000', '0x10']) {
          await amount.fill(draft);
          assert.equal(await result(length), null);
          assert.equal(await amount.getAttribute('aria-invalid'), 'true');
        }
        await length.getByRole('button', { name: '恢复初始换算设置', exact: true }).click();
        assert.equal(await result(length), '125');
        assert.equal(await result(temperature), '18');
        await temperature.getByRole('combobox', { name: '温度模式', exact: true }).selectOption('absolute');
        assert.equal(await result(temperature), '50');
        await temperature.getByRole('textbox', { name: '数值', exact: true }).fill('-274');
        assert.equal(await result(temperature), null);
        assert.ok(await temperature.getByText('绝对温度不能低于绝对零度。', { exact: true }).isVisible());
        await temperature.getByRole('button', { name: '恢复初始换算设置', exact: true }).click();
        assert.equal(await result(temperature), '18');
        assert.equal(await result(data), '1048576');
        assert.equal(await result(currency), '80');
        await currency.getByRole('button', { name: '互换原币种与目标币种', exact: true }).click();
        assert.equal(await result(currency), '125');
        await currency.getByRole('combobox', { name: '目标币种', exact: true }).selectOption('GBP');
        assert.equal(await currency.getAttribute('data-result'), 'missing');
        await currency.getByRole('textbox', { name: '数值', exact: true }).fill('0');
        assert.equal(await currency.getAttribute('data-result'), 'missing', 'Zero amount must not invent a missing exchange rate');
        await currency.getByRole('combobox', { name: '原币种', exact: true }).selectOption('GBP');
        assert.equal(await result(currency), '0', 'Same currency must retain the amount');
        await currency.getByRole('button', { name: '恢复初始换算设置', exact: true }).click();
        assert.equal(await result(currency), '80');
        await currency.getByText('完整汇率快照', { exact: true }).click();
        assert.equal(await currency.locator('tbody tr').count(), 4);
        assert.ok((await currency.locator('[data-currency="GBP"]').textContent()).includes('缺测'));
        await page.getByText('供数空态与错误', { exact: true }).click();
        assert.ok(await page.getByText('尚未提供汇率快照记录。', { exact: true }).isVisible());
        assert.ok(await page.getByText('教学错误状态，不自动重试或交易。', { exact: true }).isVisible());
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
      if (name === 'supplied-finance') {
        const quote = page.locator('.iui-finance[data-kind="finance-quote"]').first();
        assert.equal(await quote.locator('.iui-finance-price').getAttribute('data-raw-value'), '110');
        assert.equal(await quote.locator('.iui-finance-change-percent').getAttribute('data-raw-value'), '10');
        assert.ok((await quote.textContent()).includes('延迟 15 分钟'));
        const history = page.locator('.iui-finance[data-kind="finance-chart"]').first();
        const xs = await history.locator('circle[data-finance-time]').evaluateAll(points => points.map(point => +point.getAttribute('cx')));
        assert.equal(xs.length, 4);
        assert.ok(Math.abs((xs[1] - xs[0]) / (xs[3] - xs[0]) - 1 / 12) < 1e-8, 'Finance X must use actual time distances');
        assert.equal(await history.locator('.iui-finance-line').count(), 2, 'Missing price must break the line');
        await history.getByText('完整数据表', { exact: true }).click();
        assert.equal(await history.locator('tbody tr').count(), 5);
        assert.ok((await history.locator('table').textContent()).includes('缺测'));
        await history.getByRole('button', { name: '后半段', exact: true }).click();
        assert.equal(await history.locator('tbody tr').count(), 2);
        await history.getByRole('button', { name: '单点', exact: true }).click();
        assert.equal(await history.locator('circle[data-finance-time]').count(), 1);
        await history.getByRole('button', { name: '无观测时段', exact: true }).click();
        assert.ok(await history.getByText('所选范围内暂无观测记录', { exact: true }).isVisible());
        await history.getByRole('button', { name: '全部时段', exact: true }).click();
        const chart = history.locator('svg.iui-finance-chart');
        await chart.focus();
        await page.keyboard.press('Home');
        assert.ok((await history.locator('.iui-finance-readout').textContent()).includes('100 USD'));
        await page.keyboard.press('End');
        assert.ok((await history.locator('.iui-finance-readout').textContent()).includes('110 USD'));
        const comparison = page.locator('.iui-finance[data-kind="finance-comparison"]').first();
        assert.equal(await comparison.locator('.iui-finance-incomparable').count(), 1);
        for (const id of ['sample_a', 'sample_b']) {
          const last = Number(await comparison.locator(`[data-finance-series="${id}"] circle`).last().getAttribute('data-value'));
          assert.ok(Math.abs(last - 10) < 1e-9, `${id}: common-baseline percentage is wrong`);
        }
        await comparison.getByText('完整数据表', { exact: true }).click();
        const before = await comparison.locator('table').textContent();
        for (const button of await comparison.locator('[data-finance-action="series"]').all()) await button.click();
        assert.ok(await comparison.getByText('所有系列已隐藏，请选择上方系列。', { exact: true }).isVisible());
        assert.equal(await comparison.locator('table').textContent(), before, 'Hiding a series must not remove records');
        await comparison.locator('[data-finance-action="series"][data-value="sample_a"]').click();
        await comparison.getByRole('button', { name: '后半段', exact: true }).click();
        assert.equal(await comparison.locator('tbody tr').count(), 2);
        const first = Number(await comparison.locator('[data-finance-series="sample_a"] circle').first().getAttribute('data-value'));
        assert.ok(Math.abs(first + 10) < 1e-9, 'Changing range must not substitute a new baseline');
        await page.getByText('零基准、空、加载和错误边界', { exact: true }).click();
        assert.ok(await page.getByText('前收盘需大于零才能计算百分比', { exact: true }).isVisible());
        assert.ok(await page.getByText('调用方供数不可用；本页没有交易、刷新或重试服务。', { exact: true }).isVisible());
      }
      if (name === 'supplied-heatmap') {
        const heatmap = page.locator('.iui-heatmap').first();
        const tiles = await heatmap.locator('rect[data-weight]').evaluateAll(items => items.map(item => ({ weight: +item.getAttribute('data-weight'), area: +item.getAttribute('width') * +item.getAttribute('height') })));
        assert.equal(tiles.length, 3);
        const total = tiles.reduce((sum, tile) => sum + tile.area, 0);
        for (const tile of tiles) assert.ok(Math.abs(tile.area / total - tile.weight / 100) < 1e-8);
        const graphic = heatmap.locator('.iui-heatmap-graphic');
        await graphic.focus();
        await page.keyboard.press('End');
        assert.ok((await heatmap.locator('.iui-heatmap-readout').textContent()).includes('MISSING'));
        await page.keyboard.press('ArrowLeft');
        assert.ok((await heatmap.locator('.iui-heatmap-readout').textContent()).includes('-100%'));
        await page.keyboard.press('Enter');
        assert.ok(await heatmap.getByRole('table').isVisible());
        assert.equal(await heatmap.locator('tbody tr').count(), 5);
        assert.ok((await heatmap.locator('[data-heatmap-row="missing"]').textContent()).includes('缺测'));
        await heatmap.getByRole('combobox', { name: '行业', exact: true }).selectOption({ label: '研究' });
        assert.equal(await heatmap.locator('rect[data-weight]').count(), 2);
        assert.equal(await heatmap.locator('tbody tr').count(), 2);
        await heatmap.getByRole('combobox', { name: '行业', exact: true }).selectOption({ label: '教学' });
        assert.equal(await heatmap.locator('rect[data-weight]').count(), 1);
        assert.equal(await heatmap.locator('tbody tr').count(), 3);
        await heatmap.getByRole('combobox', { name: '行业', exact: true }).selectOption({ label: '全部行业' });
        await heatmap.locator('[data-heatmap-cell="alpha"]').click();
        assert.ok((await heatmap.locator('.iui-heatmap-readout').textContent()).includes('+12%'));
        const selection = heatmap.locator('.iui-heatmap-selection');
        assert.equal(await selection.getAttribute('data-selected-cell'), 'alpha');
        assert.equal(await selection.getAttribute('stroke-width'), '2');
        assert.ok(await selection.evaluate(node => node === node.parentElement.lastElementChild), 'Selected frame must paint above adjacent tiles');
        assert.equal(await graphic.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
        if (screenshots) await graphic.screenshot({ path: path.join(screenshots, `${label}-selection-pointer.png`) });
        await heatmap.getByRole('combobox', { name: '行业', exact: true }).focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Home');
        assert.equal(await selection.getAttribute('stroke-width'), '3');
        assert.equal(await graphic.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
        if (screenshots) await graphic.screenshot({ path: path.join(screenshots, `${label}-selection-keyboard.png`) });
        // Stay in the same SVG: browser :focus-visible may outlive the keyboard input.
        await heatmap.locator('[data-heatmap-cell="beta"]').click();
        assert.equal(await selection.getAttribute('data-selected-cell'), 'beta');
        assert.equal(await selection.getAttribute('stroke-width'), '2');
        if (screenshots) await graphic.screenshot({ path: path.join(screenshots, `${label}-selection-pointer-return.png`) });
        await page.getByText('无正权重与供数失败', { exact: true }).click();
        assert.ok(await page.locator('.iui-heatmap').nth(1).getByText('没有可绘制的正权重记录', { exact: true }).isVisible());
        assert.ok(await page.getByText('教学错误状态；无自动重试或交易动作。', { exact: true }).isVisible());
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
    if (width === 390 && theme === 'light') {
      const discovery = await page.evaluate(async ({ baseUrl, schemaIndex, expectedNodeTypes, expectedIndex, expectedExamples }) => {
        const indexUrl = new URL(schemaIndex, baseUrl).href;
        async function get(url) {
          const response = await fetch(url, { cache: 'no-store', redirect: 'error' });
          if (response.status !== 200 || !response.headers.get('content-type')?.includes('application/json')) throw new Error(`Unexpected discovery response: ${url}`);
          const bytes = await response.arrayBuffer();
          return { bytes, json: JSON.parse(new TextDecoder().decode(bytes)) };
        }
        const { bytes:indexBytes, json: index } = await get(indexUrl);
        const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
        if(indexBytes.byteLength!==expectedIndex.bytes||await digest(indexBytes)!==expectedIndex.sha256)throw new Error('Fetched index does not match trusted pinned bytes');
        if (index.format !== 'inform-ui-schema-index/1' || JSON.stringify(Object.keys(index.nodeOwners).sort()) !== JSON.stringify(expectedNodeTypes)) throw new Error('Unexpected index contract');
        const checked = [];
        for (const id of ['base', 'forms', 'finance', 'converters', 'time']) {
          const group = index.groups.find(group => group.id === id);
          for (const metadata of [group.documentSchema, group.nodeSchema]) {
            const url = new URL(metadata.path, indexUrl).href;
            const { bytes, json } = await get(url);
            const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
            if (sha !== metadata.sha256 || bytes.byteLength !== metadata.utf8Bytes || !json.$defs) throw new Error(`Schema bytes differ: ${url}`);
          }
          const exampleUrl = new URL(group.examples[0].path, indexUrl).href;
          const expected=expectedExamples[id];
          if(group.examples[0].path!==expected.path)throw new Error('Untrusted example path');
          const { bytes:exampleBytes, json: example } = await get(exampleUrl);
          if(exampleBytes.byteLength!==expected.bytes||await digest(exampleBytes)!==expected.sha256)throw new Error('Fetched example does not match trusted pinned bytes: '+id);
          const result = window.IUI.validateDocument(example);
          if (!result.ok) throw new Error(`CDN example invalid: ${JSON.stringify(result.issues)}`);
          checked.push(id);
        }
        return checked;
      }, { ...contract.cdn, expectedNodeTypes, ...trustedDiscovery });
      assert.deepEqual(discovery, ['base', 'forms', 'finance', 'converters', 'time']);
      console.log('PASS file:// CDN discovery: trusted-hash-bound index, ten hash-matched Document/Node bundles and five exact-byte runtime-validated same-pin examples');
    }
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
  if(reuse){const reusedViews=reusedInline.reduce((n,r)=>n+r.views,0);console.log(`Reused ${reusedViews} same-locale inline consumer views; every existing CDN example, entry shell and discovery still executed here.`);if(screenshots)await writeFile(path.join(screenshots,'REUSE.json'),JSON.stringify({...reuse,names:reusedInline.map(r=>r.name),records:reusedInline,verifiedReceiptNames:[...reuse.names],exampleLanguages},null,2)+'\n');}
  console.log(`Verified ${count} rendered views, keyboard feedback, reset and table disclosure.`);
} finally {
  await browser?.close();
  await rm(directory, { recursive: true, force: true });
}
