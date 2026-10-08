import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
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
if (screenshots) await mkdir(screenshots, { recursive: true });
let browser;
let count = 0;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.IUI_BROWSER_EXECUTABLE ? { executablePath: process.env.IUI_BROWSER_EXECUTABLE } : {}) });
  for (const name of ['hpcc-feedback', 'minimal', 'rtt-trend', 'wifi-status', 'resource-shortlist']) {
    const document = JSON.parse(await readFile(path.join(root, 'examples', `${name}.json`), 'utf8'));
    for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
      const label = `${name}-${width}-${theme}`;
      const file = path.join(directory, `${label}.html`);
      await writeFile(file, await compileHtml({ ...document, theme }, { lang: name === 'hpcc-feedback' ? 'zh-CN' : 'en' }));
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(pathToFileURL(file).href);
      await page.waitForSelector('.iui-root');
      const bounds = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      assert.ok(bounds.scroll <= bounds.viewport + 1, `${label}: whole-page horizontal overflow ${JSON.stringify(bounds)}`);
      assert.equal(await page.locator('.iui-math-error').count(), 0, `${label}: invalid formula`);
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
      assert.deepEqual(errors, [], `${label}: browser error`);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${label}.png`), fullPage: true });
      await page.close();
      count++;
      console.log(`PASS ${label}`);
    }
  }
  const shell = readSkillShell(await readFile(path.join(root, 'SKILL.md'), 'utf8'));
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
