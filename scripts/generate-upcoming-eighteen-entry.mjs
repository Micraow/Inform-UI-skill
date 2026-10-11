/** Deterministically create the single 115 candidate entry; never promote the root contract. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export async function createEntry(root,library,pin,emit){
 const candidate=path.join(root,'candidates/upcoming-eighteen'),old=JSON.parse(await readFile(path.join(root,'library-contract.json'))),contract=structuredClone(old);
 contract.revision=pin.revision;contract.cdn.baseUrl=`https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@${pin.revision}/cdn/`;
 for(const [property,file]of [['globalIntegrity','iui.global.min.js'],['styleIntegrity','iui.css']])contract.cdn[property]='sha384-'+createHash('sha384').update(await readFile(path.join(library,'cdn',file))).digest('base64');
 contract.verification={candidateOnly:true,committedBytes:true,publicHttp:'not-run',nativeBrowser:'not-run',ci:'not-run',acceptancePromotion:false};
 const names=['create-interactive-poll','mail-files','decision-cards','related-questions','local-places','flight-discovery','activity-planning','vocabulary-tools','source-citations','entity-facts'],examples=[];
 for(const name of names){const bytes=await readFile(path.join(library,'examples',name+'.json')),document=JSON.parse(bytes);examples.push({name,lang:'en',canonicalIds:document.body.map(n=>n.type),sha256:createHash('sha256').update(bytes).digest('hex')});}
 let consumer=await readFile(path.join(candidate,'consumer.source.mjs'),'utf8');consumer=consumer.replace(/export const sourceRevision = '[a-f0-9]+';/,`export const sourceRevision = '${pin.revision}';`).replace(/export const examples = Object.freeze\([^\n]*\); \/\/ Generated manifest/,`export const examples = Object.freeze(${JSON.stringify(examples)}); // Generated manifest`);await emit('consumer.source.mjs',consumer);
 await emit('consumer-manifest.json',JSON.stringify({format:'inform-upcoming-eighteen-consumers/1',sourceRevision:pin.revision,runner:'consumer.source.mjs',executionOwner:'core:scripts/run-batch-consumers.mjs',widths:[390,768,1100],themes:['light','dark'],examples,exampleCount:10,canonicalCount:18,plannedViews:60,nativeBrowserExecuted:false,systemClipboardVerified:false,acceptancePromotion:false},null,2)+'\n');
 await emit('library-contract.json',JSON.stringify(contract,null,2)+'\n');
 let common=(await readFile(path.join(candidate,'baseline107/SKILL.md.source.txt'),'utf8')).split('<!-- upcoming-three-source-authoring -->')[0].trimEnd();
 common=common.replace(/^> 本分支.*$/m,`> 115 节点独立候选入口。精确运行时 ${pin.revision}。已验组件数保持 53；55 项候选未获统一浏览器验收。公开 CDN 可用性及 HTTP 字节尚未验证；优先使用该提交的本地 API/CLI。此文完整包含常用 Base 合同，不需要拼接历史增量。`);
 common=common.replaceAll(old.revision,pin.revision).replaceAll(old.cdn.globalIntegrity,contract.cdn.globalIntegrity).replaceAll(old.cdn.styleIntegrity,contract.cdn.styleIntegrity).replaceAll('有97个注册项：96个portable节点','有115个注册项：114个portable节点');
 common=common.replace('## 7. 隔离候选：30 项本地组件指导，尚未浏览器验收','## 7. 本地组件合同（候选，尚未统一浏览器验收）').replace('## 8. 后续七项：供数航程、活动、本地选择与状态快照（候选，未验收）','## 8. 供数航程、活动、本地选择与状态快照（候选）');
 common=common.replace(/^本节仅用于显式选择冻结本地候选.*$/m,'本节合同均使用本文固定的 115 节点候选。53 个组件保持已验收；55 个 canonical 候选尚未完成统一验收。源码、构建和完整 schema 由同目录 source-pin.json 与 source-package.json 绑定；历史 37 锁不是此版本的证明。').replace(/^仅在取得同版已实现合同和示例后生成以下节点。.*$/m,'以下节点使用本文同一固定候选及其完整 schema。保持供数、本地交互和明确未知值边界，不由源码测试推断浏览器验收。');
 const guides=[];for(const cohort of ['upcoming-three','upcoming-six','upcoming-ten','upcoming-eighteen']){
 let guide=await readFile(path.join(root,'candidates',cohort,'guidance-source.md'),'utf8');
 guide=guide.replace(/^Draft for the next source cohort\..*$/m,'All following Base contracts use the exact 115 candidate runtime and generated schemas in this directory.');
 guide=guide.replace(/^## 10\. Four more Base contracts \(reviewed107 source\)\n\nThese four contracts.*\n\n/m,'');
 guides.push(guide.trim());
 }
 let authoring=common+'\n\n'+guides.join('\n\n')+'\n';
 authoring=authoring.replace(/\[([^\]]*)\]\((?!https?:|#)([^)]+)\)/g,(_,label,destination)=>`[${label}](../../${destination})`);
 authoring=authoring.replaceAll('WEB-CHAT-GUIDE.md全文','同目录完整 schema/iui.schema.json').replaceAll('```json candidate-only','```json').replaceAll('```json upcoming-only','```json').replace(/```json upcoming(?:103|107|115)-only/g,'```json');
 const localIntro=`\n本候选的完整规范：[完整 Schema](schema/iui.schema.json)；[自动领域索引](schema/fragments/index.json)；[Base 文档包](schema/fragments/base.schema.json)；[Base 节点包](schema/fragments/nodes/base.schema.json)。下方固定 CDN 壳是待验证目标，不代表已发布验收。离线交付请用该提交 CLI 生成内嵌 HTML。\n`;
 authoring=authoring.replace('\n## 1.',localIntro+'\n## 1.');
 await emit('AUTHORING.md',authoring);
 const html=authoring.match(/^```html\n([\s\S]*?)^```/m)[1];await emit('candidate-shell.html',html);
}
