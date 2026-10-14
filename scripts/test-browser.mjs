#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {skillRoot,parseArgs,json} from './lib.mjs';
const {opts}=parseArgs(process.argv.slice(2));
if(!opts.playwright)throw Error('Pass --playwright /path/to/node_modules/@playwright/test/index.mjs [--executable /path/to/chromium]');
const {chromium}=await import(pathToFileURL(resolve(opts.playwright)).href);
const browser=await chromium.launch({headless:true,...opts.executable?{executablePath:resolve(opts.executable),args:['--no-sandbox']}:{}});const results=[];
try{
 for(const example of await json(join(skillRoot,'examples/examples.json'))){
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(join(skillRoot,'examples',example.id+'.html')).href);
  await page.locator('.if-root[data-phase="ready"]').waitFor();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#inform-status').isVisible(),false);
  assert.equal(await page.getByRole('heading',{level:1}).count(),1);
  if(example.id==='budget-choice'){
   await page.getByRole('button',{name:'选择舒适组合',exact:true}).click();
   assert(await page.getByText('已选：舒适组合',{exact:true}).isVisible());
   await page.getByRole('button',{name:'重置选择与预算',exact:true}).click();
   assert(await page.getByText('还没有选择。请在下方选一个组合。',{exact:true}).isVisible());
  }else if(example.id==='filter-sort-chart'){
   const slider=page.getByRole('slider',{name:'最低反馈分数'});await slider.focus();await slider.press('End');
   assert(await page.getByText('没有活动达到这个阈值',{exact:true}).isVisible());
   await page.getByRole('button',{name:'恢复初始条件',exact:true}).click();
   assert(await page.getByRole('table').count()>0);
  }else if(example.id==='repeated-groups'){
   assert(await page.getByText('这组暂无材料。',{exact:true}).isVisible());
   for(const pair of ['绘画桌 / 纸张','绘画桌 / 画笔','手作桌 / 剪刀']){
    await page.getByRole('button',{name:'选择 '+pair,exact:true}).click();
    assert(await page.getByText('当前选择：'+pair,{exact:true}).isVisible());
   }
   await page.getByRole('button',{name:'清空选择',exact:true}).click();
   assert(await page.getByText('尚未选择材料。',{exact:true}).isVisible());
   assert(await page.getByRole('button',{name:'清空选择',exact:true}).isDisabled());
  }else if(example.id==='composed-explanation'){
   const slider=page.getByRole('slider',{name:'第四个数'});await slider.focus();await slider.press('End');
   assert(await page.getByText('24.5',{exact:true}).isVisible());
   assert(await page.locator('.katex').count()>0);
   await page.getByRole('switch',{name:'展开计算过程'}).click();
   assert(await page.getByText('计算过程已收起；图表与统计值仍会随滑块更新。',{exact:true}).isVisible());
   assert(await page.getByRole('link',{name:/NIST/}).count()>0);
  }
  else throw Error('Missing browser interaction scenario for '+example.id);
  await page.waitForTimeout(200);
  const geometry=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(geometry.scroll<=geometry.viewport+1,JSON.stringify(geometry));assert.deepEqual(errors,[]);
  results.push({example:example.id,fileOpen:true,interaction:true,narrowLayout:geometry,pageErrors:errors});await page.close();
 }
 const report={ok:true,engine:'Chromium',results};if(opts.out)await writeFile(resolve(opts.out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
