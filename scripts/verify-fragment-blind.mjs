import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const arg = flag => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : undefined;
const library = path.resolve(arg('--library') || path.join(root, '../Inform-UI'));
const output = path.resolve(arg('--output') || path.join(root, 'artifacts/fragment-blind'));
const frozen = path.join(root, 'tests/fragment-blind');
await mkdir(output, {recursive:true});
const contract = JSON.parse(await readFile(path.join(frozen, 'library-contract.json')));
const json = await readFile(path.join(frozen, 'answer.json'), 'utf8');
const html = await readFile(path.join(frozen, 'answer.html'), 'utf8');
const document = JSON.parse(json);
const require = createRequire(path.join(library, 'package.json'));
const api = await import(pathToFileURL(path.join(library, 'dist/index.js')).href);
const report = {title:'Immutable fragment-discovery blind QA', library:contract.revision, hashes:{}, tests:[], findings:[], browserViews:[], scope:'Synthetic learning-budget document, converters and learning domains; no first-draft edits.'};
const sha = value => createHash('sha256').update(value).digest('hex');
async function test(name, task) { try { const detail=await task(); report.tests.push({name,ok:true,...(detail ? {detail} : {})}); console.log('PASS', name); } catch(e) {report.tests.push({name,ok:false,error:e.message}); console.error('FAIL', name, e.message);} }
const nodes = (value,type) => { const result=[]; function visit(v){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object'){if(v.type===type)result.push(v);Object.values(v).forEach(visit);}} visit(value);return result; };
await test('immutable hashes and copied CDN/SRI shell',()=>{
  for(const [name,content,hash] of [['answer.json',json,'a22fb2ff4eaf6c9311c91d8f7bee1aeb554a2c14bd9b2cb69e2d8e4b31d2dcf9'],['answer.html',html,'ee91842b8783a25e564e39f19fa1a4a557c7f704b810a661f12e4334cc29cde1']]) {report.hashes[name]=sha(content);assert.equal(sha(content),hash);}
  assert.deepEqual(JSON.parse(html.match(/<script id="iui-spec" type="application\/json">([\s\S]*?)<\/script>/)[1]),document);
  for(const [asset,integrity] of [[contract.cdn.global,contract.cdn.globalIntegrity],[contract.cdn.style,contract.cdn.styleIntegrity]]) {
    assert.ok(html.includes(contract.cdn.baseUrl+asset));assert.ok(html.includes(integrity));
  }
  assert.equal((html.match(/<script\b/g)||[]).length,3);assert.ok(!html.includes('<style'));
});
await test('full API validates without input mutation',()=>{const before=JSON.stringify(document);const result=api.validateDocument(document);assert.equal(result.ok,true,JSON.stringify(result.issues));assert.equal(JSON.stringify(document),before);});
await test('independent arithmetic and computed dependencies',()=>{
  const checks=[{patch:{},hours:24,cost:1920,left:80,over:0},{patch:{hourlyCost:0},hours:24,cost:0,left:2000,over:0},{patch:{hoursPerWeek:10,weeks:5,hourlyCost:90,budget:2000},hours:50,cost:4500,left:0,over:2500}];
  for(const c of checks){const r=api.evaluateState(document,c.patch);assert.equal(r.ok,true);assert.deepEqual([r.computed.totalHours,r.computed.totalCost,r.computed.budgetLeft,r.computed.budgetOver],[c.hours,c.cost,c.left,c.over]);}
  assert.deepEqual([api.evaluateState(document).computed.record0,api.evaluateState(document).computed.record1,api.evaluateState(document).computed.record12],[0,5,65]);
  const empty=api.evaluateState(document,{recordsReady:false});assert.deepEqual([empty.computed.record0,empty.computed.record1,empty.computed.record12],[null,null,null]);
  assert.equal(90/60,1.5);assert.equal(2**20/10**6,1.048576);assert.equal(360/7.2,50);
  const quiz=nodes(document,'quiz')[0];assert.deepEqual(quiz.questions.map(q=>q.correct),[['b'],['a','c'],['b']]);assert.equal(quiz.questions.reduce((a,q)=>a+q.points,0),4);
});
await test('closed mixed-domain schema and fragment root distinctions',async()=>{
  const full=JSON.parse(await readFile(path.join(library,'src/schema/iui.schema.json')));
  const index=JSON.parse(await readFile(path.join(library,'cdn/schema/index.json')));
  const {createSchemaSubset,assertClosedReferences}=await import(pathToFileURL(path.join(library,'scripts/schema-subsets.mjs')).href);
  const {default:Ajv2020}=require('ajv/dist/2020.js');
  const check=schema=>new Ajv2020({strict:false,allErrors:true}).compile(schema);
  const union=createSchemaSubset(full,index.nodeOwners,['base','forms','charts','learning','converters']);assertClosedReferences(union);
  assert.equal(check(full)(document),true);assert.equal(check(union)(document),true);
  const converter=JSON.parse(await readFile(path.join(library,'cdn/schema/converters.schema.json')));
  const learning=JSON.parse(await readFile(path.join(library,'cdn/schema/nodes/learning.schema.json')));
  assertClosedReferences(converter);assertClosedReferences(learning);
  assert.equal(check(converter)(document),false,'One domain bundle must not accept mixed document');
  assert.equal(learning.$ref,'#/$defs/Node');assert.equal(check(learning)(document),false);assert.equal(check(learning)(nodes(document,'quiz')[0]),true);
  assert.ok(converter.$defs.FinanceSource,'Converter helper reference must be locally closed');
  await writeFile(path.join(output,'mixed.schema.json'),JSON.stringify(union,null,2)+'\n');
  return {groups:['base','forms','charts','learning','converters'],fullSchemaBytes:Buffer.byteLength(JSON.stringify(full,null,2)+'\n'),mixedSchemaBytes:Buffer.byteLength(JSON.stringify(union,null,2)+'\n')};
});
await test('negative semantic mutations reject invalid rates and references',()=>{
  for(const mutate of [d=>{nodes(d,'currency-converter')[0].rates[1].rate=0;},d=>{nodes(d,'currency-converter')[0].rates[1].rate=-1;},d=>{nodes(d,'metric')[0].value={$:'unknownState'};}]){
    const d=structuredClone(document);mutate(d);assert.equal(api.validateDocument(d).ok,false);
  }
});
await test('reading ledger bytes and source overhead are not token savings',async()=>{
  const ledger=JSON.parse(await readFile(path.join(frozen,'reading-ledger.json')));
  assert.equal(ledger.sources.reduce((n,s)=>n+s.utf8Bytes,0),95523);
  assert.deepEqual([ledger.totals.rootBytes,ledger.totals.indexBytes,ledger.totals.necessarySchemaContractBytes,ledger.totals.examplesBytes],[33167,12811,45697,3848]);
  assert.equal(95523+12811+822,109156);assert.equal(ledger.totals.successfulRemoteFetches,5);assert.equal(ledger.totals.failedRemoteFetchAttempts,1);
  report.reading={uniqueSourceBytes:95523,knownRepeatedPresentationBytes:13633,sourceEquivalentPresentationBytes:109156,tokenSavingsClaim:false};
});
if(process.argv.includes('--browser')) {
  const {chromium}=require('@playwright/test');
  let browser;
  try {
    browser=await chromium.launch({headless:true,...(process.env.IUI_BROWSER_EXECUTABLE?{executablePath:process.env.IUI_BROWSER_EXECUTABLE}:{})});
    report.browserVersion=browser.version();
    for(const width of [390,1280]) for(const theme of ['light','dark']) {
      const view=`${width}-${theme}`;const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme});page.setDefaultTimeout(10000);
      const errors=[],requests=[],responses=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('response',r=>responses.push({url:r.url(),status:r.status()}));
      const open=async()=>{await page.goto(pathToFileURL(path.join(frozen,'answer.html')).href);await page.locator('.iui-root').waitFor();};
      const metric=()=>page.locator('.iui-metric-value > span:first-child').allTextContents();
      await test(`${view}: original HTML real CDN SRI, theme, overflow, math`,async()=>{
        await open();await page.evaluate(()=>document.fonts.ready);
        for(const asset of [contract.cdn.global,contract.cdn.style])assert.ok(responses.some(r=>r.url===contract.cdn.baseUrl+asset&&r.status===200),asset+' did not return 200');
        assert.deepEqual(errors,[]);assert.equal(await page.locator('.iui-math-error').count(),0);
        const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bg:getComputedStyle(document.body).backgroundColor}));assert.ok(bounds.scroll<=bounds.width+1,JSON.stringify(bounds));
        if(theme==='dark')assert.notEqual(bounds.bg,'rgb(255, 255, 255)');
        assert.deepEqual(await metric(),['24.0','1920.00','80.00','0.00']);
        await page.screenshot({path:path.join(output,`${view}-initial.png`),fullPage:true});
        report.browserViews.push({view,bounds});
      });
      await test(`${view}: form edit, empty/invalid input, submit, cancel and global reset`,async()=>{
        await open();const hours=page.locator('input[data-bind="hoursPerWeek"]');
        await hours.fill('10');assert.deepEqual(await metric(),['40.0','3200.00','0.00','1200.00']);
        await hours.fill('');await page.getByRole('button',{name:'本地检查方案',exact:true}).click();assert.equal(await hours.getAttribute('aria-invalid'),'true');
        assert.deepEqual(await metric(),['40.0','3200.00','0.00','1200.00']);
        assert.ok((await page.locator('.iui-field-error:not([hidden])').allTextContents()).join('').length>0);
        await hours.fill('-1');await page.getByRole('button',{name:'本地检查方案',exact:true}).click();assert.equal(await hours.getAttribute('aria-invalid'),'true');
        await page.getByRole('button',{name:'恢复本表单初值',exact:true}).click();assert.deepEqual(await metric(),['24.0','1920.00','80.00','0.00']);
        await page.getByRole('button',{name:'本地检查方案',exact:true}).click();assert.ok(await page.getByText('本地字段检查通过；没有发送或保存。',{exact:true}).isVisible());
        await page.getByRole('button',{name:'试试免费课程：单价设为 0',exact:true}).click();assert.deepEqual(await metric(),['24.0','0.00','2000.00','0.00']);
        await page.getByRole('button',{name:'恢复预算与记录开关初值',exact:true}).click();assert.deepEqual(await metric(),['24.0','1920.00','80.00','0.00']);
      });
      await test(`${view}: numeric axis, missing gap, keyboard, empty/recovery`,async()=>{
        await open();const chart=page.locator('[data-iui="chart"]');const svg=chart.locator('svg');
        const points=await svg.locator('circle[data-point]').evaluateAll(es=>es.map(e=>({x:+e.getAttribute('cx'),v:e.getAttribute('data-value')})));
        assert.deepEqual(points.map(p=>p.v),['0','5','65']);assert.ok(Math.abs((points[1].x-points[0].x)/(points[2].x-points[0].x)-1/12)<1e-8);
        assert.equal(await svg.locator('[data-series="hours"] path').count(),2,'Null must split line');
        await svg.focus();await page.keyboard.press('Home');assert.match(await chart.locator('.iui-chart-readout').textContent(),/0小时/);
        await page.keyboard.press('End');assert.match(await chart.locator('.iui-chart-readout').textContent(),/65小时/);
        await chart.getByText('查看图表数据',{exact:true}).click();assert.match(await chart.locator('tbody').textContent(),/缺测/);
        await page.getByRole('button',{name:'模拟所有记录缺测',exact:true}).click();assert.equal(await chart.locator('circle[data-point]').count(),0);assert.ok(await chart.locator('.iui-data-status').isVisible());
        assert.match(await chart.locator('.iui-data-status').textContent(),/暂无|没有|缺测|空/);
        await page.getByRole('button',{name:'恢复合成记录',exact:true}).click();assert.equal(await chart.locator('circle[data-point]').count(),3);
        await page.locator('input[data-bind="recordsReady"]').focus();await page.keyboard.press('Space');assert.equal(await chart.locator('circle[data-point]').count(),0);
        await page.getByRole('button',{name:'恢复预算与记录开关初值',exact:true}).click();assert.equal(await chart.locator('circle[data-point]').count(),3);
      });
      await test(`${view}: standalone null follows empty-cell contract (readability observation)`,async()=>{
        await open();const table=page.locator('[data-iui="table"]');const missing=await table.locator('tbody tr').nth(2).locator('td').nth(1).textContent();
        if(!missing.trim())report.findings.push({id:'TABLE_NULL_BLANK',view,attribution:'library-contract UX limitation',severity:'nonblocking',message:'Standalone table renders literal null as an empty cell under its current contract; chart data table says 缺测. Original JSON correctly preserves null. This is a readability consistency observation, not a contract violation.'});
        assert.equal(missing,'','Frozen contract uses an empty cell for null; do not fabricate zero');
      });
      await test(`${view}: converter arithmetic, invalid drafts, missing rates, zero and reset`,async()=>{
        await open();const converters=page.locator('.iui-converter');const time=converters.nth(0),data=converters.nth(1),currency=converters.nth(2);const result=x=>x.locator('.iui-converter-result').getAttribute('data-raw-value');
        assert.equal(await result(time),'1.5');assert.equal(await result(data),'1.048576');assert.equal(await result(currency),'50');
        const amount=time.getByRole('textbox',{name:'数值',exact:true});
        for(const value of ['','1e','1,000','0x10']){await amount.fill(value);assert.equal(await amount.getAttribute('aria-invalid'),'true');assert.equal(await result(time),null);}
        await time.getByRole('button',{name:'恢复初始换算设置',exact:true}).click();assert.equal(await result(time),'1.5');
        await amount.fill('0');assert.equal(await result(time),'0');await time.getByRole('button',{name:'恢复初始换算设置',exact:true}).click();
        await time.getByRole('button',{name:'互换原单位与目标单位',exact:true}).click();assert.equal(await result(time),'5400');assert.equal(await amount.inputValue(),'90');
        await currency.getByRole('combobox',{name:'目标币种',exact:true}).selectOption('EUR');assert.equal(await result(currency),'45');
        await currency.getByRole('combobox',{name:'目标币种',exact:true}).selectOption('GBP');assert.equal(await currency.getAttribute('data-result'),'missing');assert.equal(await result(currency),null);
        await currency.getByRole('textbox',{name:'数值',exact:true}).fill('0');assert.equal(await currency.getAttribute('data-result'),'missing');
        await currency.getByRole('combobox',{name:'目标币种',exact:true}).selectOption('USD');assert.equal(await result(currency),'0');
        await currency.getByRole('button',{name:'恢复初始换算设置',exact:true}).click();assert.equal(await result(currency),'50');
        await page.screenshot({path:path.join(output,`${view}-converters.png`),fullPage:true});
      });
      await test(`${view}: quiz select, confirm, explain, complete and restart`,async()=>{
        await open();const quiz=page.locator('.iui-quiz');const action=a=>quiz.locator(`[data-learning-action="${a}"]`);
        assert.ok(await action('check').isDisabled());assert.ok(await action('next').isDisabled());
        for(const choices of [['b'],['a','c'],['b']]){for(const choice of choices)await quiz.locator(`[data-learning-choice="${choice}"]`).check();await action('check').click();assert.match(await quiz.textContent(),/正确/);await action('next').click();}
        assert.match(await quiz.textContent(),/4\s*\/\s*4/);assert.ok(await action('retry').isVisible());
        await page.screenshot({path:path.join(output,`${view}-quiz-complete.png`),fullPage:true});
        await action('retry').click();assert.ok(await action('check').isDisabled());assert.equal(await quiz.locator('input:checked').count(),0);
      });
      await test(`${view}: flashcards reveal, rating, navigation and restart`,async()=>{
        await open();const cards=page.locator('.iui-flashcards');const action=a=>cards.locator(`[data-learning-action="${a}"]`);
        assert.ok(await action('mastered').isDisabled());await action('flip').click();assert.equal(await cards.locator('.iui-flashcard').getAttribute('data-side'),'back');
        await action('mastered').click();await action('next').click();assert.equal(await cards.locator('.iui-flashcard').getAttribute('data-side'),'front');
        await action('flip').click();assert.match(await cards.textContent(),/50 USD/);assert.equal(await cards.locator('.iui-math-error').count(),0);await action('again').click();
        await action('result').click();assert.ok(await action('retry').isVisible());await action('retry').click();assert.equal(await cards.locator('.iui-flashcard').getAttribute('data-side'),'front');
      });
      await test(`${view}: interaction traffic and browser error audit`,()=>{assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.method==='GET'));assert.ok(requests.every(r=>r.url.startsWith('file:')||r.url.startsWith(contract.cdn.baseUrl)),'Unexpected network target');return {requests:requests.length,externalOrigins:[...new Set(requests.filter(r=>!r.url.startsWith('file:')).map(r=>new URL(r.url).origin))]};});
      await page.close();
    }
  }catch(e){report.tests.push({name:'browser infrastructure',ok:false,error:e.message});}finally{await browser?.close();}
}
report.accepted=report.tests.every(t=>t.ok);report.passed=report.tests.filter(t=>t.ok).length;report.failed=report.tests.filter(t=>!t.ok).length;
await writeFile(path.join(output,'qa-result.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.accepted,passed:report.passed,failed:report.failed,findings:report.findings}));
if(!report.accepted)process.exitCode=1;
