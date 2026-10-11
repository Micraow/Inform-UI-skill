import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { verifyFunctionalScope } from '../../scripts/verify-recovery-functional-scope.mjs';
const hash = (b, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(b).digest(encoding);
const local = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const skillRoot = path.resolve(import.meta.dirname, '../..');
export async function verify(library) {
  const root = await realpath(library), lock = await local('runtime-lock.safe.json'), fixtureIndex = await local('fixture-index.json');
  const bytesAt = async p => { assert.ok(!path.isAbsolute(p) && !p.split('/').includes('..')); const real = await realpath(path.join(root, p)); assert.ok(real.startsWith(root + path.sep)); return readFile(real); };
  const checkAssets = async () => { for (const f of lock.files) { const b = await bytesAt(f.path); assert.equal(b.length, f.bytes, f.path); assert.equal(hash(b), f.sha256, f.path); } };
  await checkAssets(); const manifest = JSON.parse(await bytesAt('cdn/integrity.json'));
  for (const [name, f] of Object.entries(manifest.files)) { const b = await bytesAt('cdn/' + name); assert.equal(b.length, f.bytes, name); assert.equal(hash(b), f.sha256, name); assert.equal('sha384-' + hash(b, 'sha384', 'base64'), f.integrity, name); }
  const scope = verifyFunctionalScope(JSON.parse(await bytesAt('docs/component-progress.json')), await local('canonical-scope.lock.json'));
  const baseline = await local('schema-baseline162.json'), schema=JSON.parse(await bytesAt('cdn/iui.schema.json')); for(const[name,digest]of Object.entries(baseline.definitions))assert.equal(hash(JSON.stringify(schema.$defs[name])),digest,name); const newRefs=new Set(baseline.newNodeRefs.map(r=>r.$ref));assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>!newRefs.has(r.$ref)),baseline.nodeRefs);assert.deepEqual(schema.$defs.Node.oneOf.filter(r=>newRefs.has(r.$ref)),baseline.newNodeRefs);assert.deepEqual(Object.keys(schema.$defs).filter(k=>k!=='Node'&&!(k in baseline.definitions)).sort(),[...baseline.newDefinitions].sort());assert.equal(schema.$defs.Node.oneOf.length,164);
  const require = createRequire(path.join(root, 'package.json')), { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
  let requests = 0; const errors = []; class Reject extends ResourceLoader { fetch() { requests++; throw Error('Unexpected external resource'); } }
  const consoleFor = () => { const c = new VirtualConsole(); c.on('jsdomError', e => errors.push(e)); return c; };
  const globalDOM = new JSDOM('', { url: 'https://local.example/', runScripts: 'outside-only', resources: new Reject(), virtualConsole: consoleFor() });
  try {
    globalDOM.window.eval((await bytesAt('cdn/iui.global.min.js')).toString() + '\n;globalThis.__IUI_CONSUMER__ = IUI;');
    const module = await import(pathToFileURL(path.join(root, 'cdn/iui.min.js'))), rawGlobal = globalDOM.window.__IUI_CONSUMER__;
    // The standalone global bundle receives JSON parsed in its own realm, as in a page.
    const inGlobal = value => globalDOM.window.JSON.parse(JSON.stringify(value));
    const global = { ...rawGlobal, validateDocument: d => rawGlobal.validateDocument(inGlobal(d)), mount: (host, d, options) => { const c = rawGlobal.mount(host, inGlobal(d), options); return { ...c, update: next => c.update(inGlobal(next)), setState: patch => c.setState(inGlobal(patch)) }; } };
    const apis = [['esm', module], ['global', global]], css = (await bytesAt('cdn/iui.css')).toString();
    // CDN CSS uses relative WOFF2 files; the export embeds those same verified bytes.
    let embeddedCss = css;
    for (const name of Object.keys(manifest.files).filter(name => name.endsWith('.woff2'))) embeddedCss = embeddedCss.replaceAll('url(' + name + ')', 'url(data:font/woff2;base64,' + (await bytesAt('cdn/' + name)).toString('base64') + ')');
    const families = [], docs = new Map(); let positive = 0, negative = 0;
    for (const fixture of fixtureIndex.fixtures) {
      const exampleBytes = await readFile(path.join(skillRoot, fixture.example)), caseBytes = await readFile(path.join(skillRoot, fixture.cases)); assert.equal(hash(exampleBytes), fixture.exampleSha256); assert.equal(hash(caseBytes), fixture.casesSha256);
      const input = JSON.parse(exampleBytes), { buildCases } = await import(pathToFileURL(path.join(skillRoot, fixture.cases))), cases = buildCases(input); docs.set(fixture.family, input);
      for (const [entry, api] of apis) {
        for (const [name, d] of cases.positives) { const v = api.validateDocument(d); assert.equal(v.ok, true, `${entry}/${fixture.family}/${name}: ${JSON.stringify(v)}`); }
        for (const [name, d, code, issuePath] of cases.negatives) { const v = api.validateDocument(d); assert.equal(v.ok, false, `${entry}/${fixture.family}/${name}`); assert.ok(v.issues.some(i => i.code === code && (!issuePath || i.path === issuePath)), `${entry}/${fixture.family}/${name}: ${JSON.stringify(v)}`); }
      }
      positive += cases.positives.length; negative += cases.negatives.length; families.push({ family: fixture.family, positive: cases.positives.length, negative: cases.negatives.length });
    }
    const combined={version:'iui/1',body:[...structuredClone(docs.get('supplied-automation').body),...structuredClone(docs.get('scheduled-suggestion').body)]},checks=[];
    for(const[entry,api]of apis){const normalized=s=>s.split('\n').filter(Boolean).join('\n');assert.equal(hash(normalized(api.styles)),hash(normalized(embeddedCss)),entry+' CSS closure');assert.equal(hash(normalized(api.styles)),hash(normalized((await bytesAt('dist/style.css')).toString())),entry+' dist CSS order');assert.equal(api.validateDocument(combined).ok,true);
      const dom=new JSDOM('<form><main></main></form>',{url:'https://local.example/',resources:new Reject(),virtualConsole:consoleFor()}),host=dom.window.document.querySelector('main'),form=host.parentElement,ctl=api.mount(host,combined,{styles:false}),tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();},q=s=>host.querySelector(s),suggestions=()=>[...host.querySelectorAll('.iui-scheduled-suggestion-button')];
      try{await tick();assert.equal(host.querySelectorAll('.iui-automation-list-item').length,5);assert.equal(q('.iui-automation-schedule').textContent,combined.body[0].item.scheduleLabel);assert.equal(suggestions().length,2);assert.equal(q('a,img,iframe,script'),null);let opens=0,submits=0;const receipts=[];form.addEventListener('submit',e=>{submits++;e.preventDefault();});host.addEventListener('iui:automation-open',e=>{assert.ok(Object.isFrozen(e.detail));assert.equal(e.composed,false);opens++;e.preventDefault();});q('.iui-automation-card').click();q('.iui-automation-view-all').click();const cancel=e=>{assert.ok(Object.isFrozen(e.detail));assert.equal(e.composed,false);receipts.push(JSON.parse(JSON.stringify(e.detail)));e.preventDefault();};host.addEventListener('iui:scheduled-task-accept',cancel);suggestions()[0].click();suggestions()[1].click();assert.equal(opens,2);assert.ok(suggestions().every(b=>!b.disabled));assert.deepEqual(receipts,[{id:'notebook_offer',action:'new-turn',creationGuidelines:combined.body[3].creationGuidelines,originSurface:'chat'},{id:'practice_opt_in',action:'task-opt-in-accept',originSurface:'work'}]);assert.equal(submits,0);assert.equal(dom.window.location.href,'https://local.example/');
        checks.push(entry+': exact opaque schedules, five supplied items and two frozen canceled suggestion branches coexist without navigation or form submission');
        host.removeEventListener('iui:scheduled-task-accept',cancel);suggestions()[0].click();assert.equal(suggestions()[0].disabled,true);q('.iui-automation-completed').click();assert.equal(q('.iui-automation-completed').getAttribute('aria-expanded'),'true');q('.iui-automation-plan-toggle').click();assert.equal(q('.iui-automation-plan-body').hidden,true);form.addEventListener('reset',e=>e.preventDefault(),{once:true});form.reset();await tick();assert.equal(q('.iui-automation-plan-body').hidden,true);form.reset();await tick();assert.equal(q('.iui-automation-plan-body').hidden,false);assert.equal(q('.iui-automation-completed').getAttribute('aria-expanded'),'false');assert.equal(suggestions()[0].disabled,true);const old=suggestions()[0];ctl.update(combined);assert.equal(suggestions()[0].disabled,false);assert.equal(old.isConnected,false);
        checks.push(entry+': canceled/accepted reset restores an initially expanded Automation plan while retaining a separate local suggestion receipt; explicit update renews the suggestion');
        const invalid=structuredClone(combined);delete invalid.body[3].creationGuidelines;const before=host.innerHTML;assert.throws(()=>ctl.update(invalid));assert.equal(host.innerHTML,before);const phases={version:'iui/1',body:[...docs.get('supplied-automation').body.map(n=>({type:n.type,label:n.label,status:'pending'})),...docs.get('scheduled-suggestion').body.map(n=>({type:n.type,label:n.label,status:'failed',fallback:'<b>Original unavailable text</b>'}))]};ctl.update(phases);assert.equal(host.querySelectorAll('[aria-busy=true]').length,3);assert.equal(q('button'),null);assert.equal(q('b'),null);assert.match(host.textContent,/<b>Original unavailable text<\/b>/);
        checks.push(entry+': invalid mixed update is atomic and pending/failed states remain literal and passive');
        ctl.update(combined);const stale=q('.iui-automation-plan-toggle');host.addEventListener('iui:automation-toggle',()=>ctl.update({version:'iui/1',body:[{type:'text',value:'New original local view'}]}),{once:true});stale.click();assert.equal(host.textContent,'New original local view');stale.click();assert.equal(host.textContent,'New original local view');ctl.dispose();assert.equal(host.childNodes.length,0);
        checks.push(entry+': replacement during disclosure retires the previous component; repeated old activation and disposal cannot restore it');
      }finally{ctl.dispose();dom.window.close();}
    }
    assert.equal(requests,0);assert.deepEqual(errors,[]);await checkAssets();
    return{format:'inform-exact-cdn-combination/1',localAssetCommit:lock.localAssetCommit,publicCommit:lock.publicCommit,protocolNodes:164,manifestAssets:Object.keys(manifest.files).length,lockedFiles:lock.files.length,historicalDefinitions:Object.keys(baseline.definitions).length,newDefinitions:baseline.newDefinitions,originalDocuments:families.length,positive,negative,entries:apis.map(([n])=>n),families,checks,scope,externalRequests:requests,nativeExecuted:false,pixelAcceptance:false,remoteCiAcceptance:false,completePublicSourceVerified:false,boundary:'Two original supplied families and four representative mixed workflows per ESM/global export. All52 manifest assets and3 dist hashes checked; Entity definitions are conserved/registered but their UI is not exercised here. No real scheduling, account, navigation or network request. Native/CI are separate.'};
  }finally{globalDOM.window.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){const i=process.argv.indexOf('--library');assert.ok(i>=0&&process.argv[i+1]);console.log(JSON.stringify(await verify(process.argv[i+1]),null,2));}
