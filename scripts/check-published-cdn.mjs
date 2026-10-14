#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {assertPublicationEvidence, mainRuntimeURL} from './publication-evidence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const build = await readJSON('generated/build.json');
const lock = await readJSON('generated/runtime-lock.json');
assertPublicationEvidence(build);
assert.equal(build.publicationReady, true);
assert.equal(new URL(build.runtimeURL).search, '');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const observations = [];
for (const name of ['inform-ui.global.js', 'THIRD_PARTY_NOTICES.txt']) {
  const url = new URL(name, mainRuntimeURL).href;
  const response = await fetch(url, {redirect:'error', signal:AbortSignal.timeout(60000)});
  assert.equal(response.status, 200, url);
  assert.equal(response.headers.get('access-control-allow-origin'), '*', url);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, lock.bundles[name].bytes, url);
  assert.equal(hash(bytes), lock.bundles[name].sha256, url);
  observations.push({url, bytes:bytes.length, sha256:hash(bytes)});
}
const index = process.argv.indexOf('--playwright');
assert(index >= 0 && process.argv[index + 1], 'Pass --playwright /path/to/@playwright/test/index.mjs');
const {chromium} = await import(pathToFileURL(resolve(process.argv[index + 1])).href);
const browser = await chromium.launch({headless:true});
const results = [];
try {
  for (const width of [320, 760]) {
    for (const directory of ['web-chat-core', 'curated-web-chat']) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const responsePromise = page.waitForResponse(response => response.url() === mainRuntimeURL);
      await page.goto(pathToFileURL(join(root, 'profiles', directory, 'minimal.html')).href);
      const loaded = await responsePromise;
      assert.equal(loaded.status(), 200);
      assert.equal(hash(await loaded.body()), lock.bundles['inform-ui.global.js'].sha256);
      await page.locator('.if-root[data-phase="ready"]').waitFor();
      assert.equal(await page.locator('#status').isVisible(), false);
      assert.equal(await page.getByRole('heading', {level:1}).count(), 1);
      await page.locator('pre').first().waitFor({state:'visible'});
      if (directory === 'web-chat-core') {
        const slider = page.getByRole('slider', {name:'最低反馈分',exact:true});
        await slider.focus(); await slider.press('End');
        await page.getByText('当前没有匹配结果', {exact:true}).waitFor({state:'visible'});
        await page.getByRole('button', {name:'恢复 60 分',exact:true}).click();
        await page.getByRole('table').first().waitFor({state:'visible'});
      } else {
        const slider = page.getByRole('slider', {name:'第四个数',exact:true});
        await slider.focus(); await slider.press('End');
        await page.getByText('24.5', {exact:true}).waitFor({state:'visible'});
        await page.locator('.katex').first().waitFor({state:'visible'});
        await page.getByRole('switch', {name:'展开计算过程',exact:true}).click();
        await page.getByText('计算过程已收起；图表与统计值仍会随滑块更新。', {exact:true}).waitFor({state:'visible'});
      }
      const geometry = await page.evaluate(() => ({viewport:innerWidth, scroll:document.documentElement.scrollWidth}));
      assert(geometry.scroll <= geometry.viewport + 1, JSON.stringify(geometry));
      assert.deepEqual(errors, []);
      results.push({profile:directory,width,canonicalCDN:true,stateTransitions:true,geometry});
      await page.close();
    }
    const page = await browser.newPage({viewport:{width,height:900}});
    await page.goto(pathToFileURL(join(root,'profiles/web-chat-core/minimal.html')).href);
    await page.locator('.if-root[data-phase="ready"]').waitFor();
    const source = await readFile(join(root,'tests/fixtures/foundation-layered-work.openui'),'utf8');
    const layout = await page.evaluate(source => {
      document.querySelector('#answer').remove();
      const target = document.createElement('main'); document.body.append(target);
      const issues = [];
      const view = InformUI.mount(target,{source,select:['base/layout','base/text'],viewNames:[],onError:items=>issues.push(...items)});
      const grids = [...target.querySelectorAll('.if-grid')].map(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);
      const result = {ready:!!view.getSnapshot(),issues,grids,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
      view.dispose(); return result;
    }, source);
    assert.equal(layout.ready, true); assert.deepEqual(layout.issues, []);
    assert.deepEqual(layout.grids, [1,2,4,8]);
    assert(layout.scroll <= layout.viewport + 1, JSON.stringify(layout));
    results.push({fixture:'nested-Each-grid',width,...layout});
    const originalCode = 'const int count = 7; // original sample\nstd::string name = "demo";\n';
    const highlighted = await page.evaluate(codeText => {
      const target = document.querySelector('main'); target.replaceChildren();
      const issues = [];
      const source = 'root = Stack([Code({value:' + JSON.stringify(codeText) + ',language:"cpp"})])';
      const view = InformUI.mount(target,{source,select:['base/layout','base/code'],viewNames:[],onError:items=>issues.push(...items)});
      const code = target.querySelector('code');
      const result = {ready:!!view.getSnapshot(),issues,text:code?.textContent,baseColor:code?getComputedStyle(code).color:null,
        tokens:[...target.querySelectorAll('[class*="iui-code-token-"]')].map(token=>({className:token.className,text:token.textContent,color:getComputedStyle(token).color}))};
      view.dispose(); return result;
    }, originalCode);
    assert.equal(highlighted.ready, true); assert.deepEqual(highlighted.issues, []);
    assert.equal(highlighted.text, originalCode);
    for (const [type,text] of [['type','const'],['type','int'],['number','7'],['comment','original sample'],['string','"demo"']]) {
      assert(highlighted.tokens.some(token=>token.className.includes('iui-code-token-'+type)&&token.text.includes(text)&&token.color!==highlighted.baseColor), 'Missing visible C++ token '+type+': '+text);
    }
    results.push({fixture:'original-cpp-highlighting',width,textPreserved:true,visibleTokenTypes:true});
    await page.close();
  }
  console.log(JSON.stringify({ok:true,engine:'Chromium',observedAt:new Date().toISOString(),observations,results},null,2));
} finally { await browser.close(); }
