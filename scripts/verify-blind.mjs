import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, readSkillShell } from './check-skill.mjs';

const arg = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined;
const library = path.resolve(arg('--library') || process.env.IUI_LIBRARY_DIR || path.join(root, '../Intelligent-UI'));
const contract = JSON.parse(await readFile(path.join(root, 'library-contract.json')));
const revision = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(revision.status, 0);
assert.equal(revision.stdout.trim(), contract.revision, 'Blind acceptance must use the exact fixed library');
const pkg = JSON.parse(await readFile(path.join(library, 'package.json')));
const api = await import(pathToFileURL(path.resolve(library, pkg.exports['.'].import)).href);
const frozen = path.join(root, 'tests/blind');
const hashes = {
  'weekend-plan.html': 'aea207da253b08ea313235d2aeac43db35cfba0587676b473d343b41e0bc8e47',
  'weekend-plan.json': '37b9256ab4c41ff5521e2b409c8f7a34d17869c2aba5ff4617f45e4b44c1a704'
};
for (const [file, expected] of Object.entries(hashes)) {
  assert.equal(createHash('sha256').update(await readFile(path.join(frozen, file))).digest('hex'), expected, `${file}: immutable first output changed`);
}
const html = await readFile(path.join(frozen, 'weekend-plan.html'), 'utf8');
const raw = html.match(/<script id="iui-spec" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(raw && !raw.includes('<'), 'Embedded JSON must escape every literal <');
const document = JSON.parse(await readFile(path.join(frozen, 'weekend-plan.json')));
assert.deepEqual(JSON.parse(raw), document, 'HTML data block differs from first JSON');
assert.equal((html.match(/<script\b/g) || []).length, 3);
assert.equal((html.match(/<link\b/g) || []).length, 1);
assert.equal(/<style\b|\sstyle=/i.test(html), false);
for (const asset of ['iui.global.min.js', 'iui.css']) assert.ok(html.includes(contract.cdn.baseUrl + asset));
for (const integrity of [contract.cdn.globalIntegrity, contract.cdn.styleIntegrity]) assert.ok(html.includes(integrity));
// The executable bootstrap was copied exactly; the model authored data, not a renderer.
const shell = readSkillShell(await readFile(path.join(root, 'SKILL.md'), 'utf8'));
assert.equal(html.match(/  <script>\n([\s\S]*?)  <\/script>/)[1], shell.html.match(/  <script>\n([\s\S]*?)  <\/script>/)[1]);
const before = JSON.stringify(document);
const valid = api.validateDocument(document);
assert.equal(valid.ok, true, JSON.stringify(valid.issues));
function nodes(value, type, output = []) {
  if (Array.isArray(value)) value.forEach(item => nodes(item, type, output));
  else if (value && typeof value === 'object') {
    if (value.type === type) output.push(value);
    Object.values(value).forEach(item => nodes(item, type, output));
  }
  return output;
}
const chart = nodes(document, 'chart')[0];
assert.deepEqual(chart.data.map(row => row.distance), [0, 1, 3, 6, 9]);
assert.equal(chart.xScale, 'linear');
assert.equal(nodes(document, 'form')[0].action, undefined);
assert.equal(nodes(document, 'weather')[0].source.synthetic, true);
let combinations = 0;
for (const day of ['saturday', 'sunday']) for (const activity of ['walk', 'hike']) {
  for (let halfHours = 1; halfHours <= 16; halfHours++) for (let rest = 0; rest <= 90; rest += 15) {
    const hours = halfHours / 2;
    const result = api.evaluateState(document, { day, activity, hours, breakMinutes: rest });
    assert.equal(result.ok, true, JSON.stringify(result.issues));
    const speed = activity === 'walk' ? 3 : 4.5;
    const movingMinutes = Math.max(0, hours * 60 - rest);
    assert.equal(result.computed.speed, speed);
    assert.equal(result.computed.movingMinutes, movingMinutes);
    assert.ok(Math.abs(result.computed.distance - movingMinutes / 60 * speed) < 1e-10);
    assert.ok(result.computed.dayLabel.includes(day === 'saturday' ? '周六' : '周日'));
    for (const row of chart.data) {
      assert.ok(Math.abs(api.evaluateValue(row.minutes, result.state, document.computed) - row.distance / speed * 60) < 1e-10);
    }
    combinations++;
  }
}
const temp = await mkdtemp(path.join(tmpdir(), 'iui-blind-'));
try {
  for (const args of [ ['validate', path.join(frozen, 'weekend-plan.json'), '--json'], ['build', path.join(frozen, 'weekend-plan.json'), '--out', path.join(temp, 'compiled.html'), '--lang', 'zh-CN'] ]) {
    const run = spawnSync(process.execPath, [path.join(library, contract.cli), ...args], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(run.status, 0, run.stderr + run.stdout);
  }
  assert.equal(await readFile(path.join(temp, 'compiled.html'), 'utf8'), await api.compileHtml(document, { lang: 'zh-CN' }));
} finally { await rm(temp, { recursive: true, force: true }); }
assert.equal(JSON.stringify(document), before);
console.log(`PASS immutable blind first output: API/CLI validate/build, unchanged JSON, exact bootstrap, escaping, ${combinations} independent numerical combinations`);

if (process.argv.includes('--browser')) {
  const { chromium } = createRequire(path.join(library, 'package.json'))('@playwright/test');
  const screenshots = arg('--screenshots');
  if (screenshots) await mkdir(screenshots, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const observations = [];
  try {
    for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, serviceWorkers: 'block' });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      const errors = [], responses = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', event => { if (event.type() === 'error') errors.push(event.text()); });
      page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
      page.on('response', response => { if (response.url().startsWith('https:')) responses.push({ url: response.url(), status: response.status() }); });
      await page.goto(pathToFileURL(path.join(frozen, 'weekend-plan.html')).href);
      await page.waitForSelector('.iui-root');
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth, metricColumns: getComputedStyle(document.querySelector('.iui-metric-grid')).gridTemplateColumns }));
      assert.ok(layout.scroll <= width + 1, JSON.stringify(layout));
      for (const file of ['iui.css', 'iui.global.min.js']) assert.ok(responses.some(r => r.url === contract.cdn.baseUrl + file && r.status === 200), `${file} not loaded from fixed CDN`);
      const metricValues = () => page.locator('.iui-metric-value').allTextContents();
      assert.deepEqual((await metricValues()).map(value => value.trim()), ['3.0', '150', '7.5']);
      const label = `blind-first-${width}-${theme}`;
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${label}.png`), fullPage: true });
      const graph = page.locator('svg[aria-label="距离越远，需要多少步行时间？"]');
      const xs = await graph.locator('circle[data-point]').evaluateAll(points => points.map(point => +point.getAttribute('cx')));
      assert.equal(xs.length, 5);
      assert.ok(Math.abs((xs[1] - xs[0]) / (xs[4] - xs[0]) - 1 / 9) < 1e-8);
      const weather = page.locator('.iui-weather');
      await weather.getByRole('button', { name: '华氏度', exact: true }).click();
      assert.ok((await weather.textContent()).includes('64.4'));
      await weather.getByRole('button', { name: '摄氏度', exact: true }).click();
      await weather.getByRole('button', { name: '表格', exact: true }).click();
      const firstWeatherTable = await weather.getByRole('table').textContent();
      await weather.getByRole('tab', { name: /10月11日/ }).click();
      const secondWeatherTable = await weather.getByRole('table').textContent();
      assert.notEqual(firstWeatherTable, secondWeatherTable, 'Selected date did not filter supplied hourly samples');
      await page.evaluate(() => { window.__blindSubmits = []; document.addEventListener('iui:submit', event => window.__blindSubmits.push(event.detail)); });
      await page.getByRole('radio', { name: '平缓步道健走', exact: true }).check();
      assert.deepEqual((await metricValues()).map(value => value.trim()), ['4.5', '150', '11.3']);
      const hours = page.getByRole('spinbutton', { name: /现场活动总时长/ });
      await hours.fill('4');
      assert.deepEqual((await metricValues()).map(value => value.trim()), ['4.5', '210', '15.8']);
      await page.getByRole('radio', { name: '周日 10/11', exact: true }).check();
      await page.getByRole('textbox', { name: '随行备忘', exact: true }).fill('仅供这次浏览器验收的合成备注');
      await page.getByRole('button', { name: '确认本地计划', exact: true }).click();
      await page.waitForFunction(() => window.__blindSubmits.length === 1);
      const submitted = await page.evaluate(() => window.__blindSubmits[0]);
      assert.equal(submitted.id, 'weekend-preferences');
      assert.deepEqual(Object.keys(submitted.values).sort(), ['activity', 'breakMinutes', 'day', 'hours', 'note']);
      assert.equal(submitted.values.hours, 4);
      assert.equal(submitted.values.day, 'sunday');
      await hours.fill('');
      await page.getByRole('button', { name: '确认本地计划', exact: true }).click();
      assert.equal(await hours.getAttribute('aria-invalid'), 'true');
      assert.equal(await page.evaluate(() => window.__blindSubmits.length), 1);
      assert.deepEqual((await metricValues()).map(value => value.trim()), ['4.5', '210', '15.8']);
      await page.getByRole('button', { name: '恢复本表单初值', exact: true }).click();
      assert.equal(await hours.inputValue(), '3');
      assert.deepEqual((await metricValues()).map(value => value.trim()), ['3.0', '150', '7.5']);
      assert.deepEqual(errors, [], `${label}: load/runtime error`);
      assert.ok(responses.every(r => r.status === 200 && r.url.startsWith(contract.cdn.baseUrl)), 'Unexpected remote request');
      observations.push({ label, layout, firstWeatherTable, secondWeatherTable, responses });
      console.log(`PASS ${label}: raw authored file:// CDN/SRI, layout, form draft/submit/reset, weather units/date, proportional X`);
      await context.close();
    }
    if (screenshots) await writeFile(path.join(screenshots, 'blind-observations.json'), JSON.stringify({ hashes, observations }, null, 2) + '\n');
  } finally { await browser.close(); }
}
