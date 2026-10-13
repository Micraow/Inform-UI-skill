import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const json = async path => JSON.parse(await readFile(path, 'utf8'));
export const save = async (path, value) => { await mkdir(dirname(path), {recursive:true}); await writeFile(path, value); };
export const saveJSON = (path, value) => save(path, JSON.stringify(value, null, 2) + '\n');
export const loadRuntime = async (runtimeDir = join(skillRoot, 'assets/runtime')) => import(pathToFileURL(join(resolve(runtimeDir), 'node.mjs')).href);
export function parseArgs(args) {
  const opts = {}, positional = [];
  for (let i=0; i<args.length; i++) {
    if (!args[i].startsWith('--')) { positional.push(args[i]); continue; }
    const key=args[i].slice(2);
    if (!key || i+1===args.length || args[i+1].startsWith('--')) throw Error('Expected value after --'+key);
    if (Object.hasOwn(opts,key)) throw Error('Duplicate option --'+key);
    opts[key]=args[++i];
  }
  return {opts,positional};
}
export function selection(value) {
  if (!value) return undefined;
  const result=value.split(',').map(x=>x.trim());
  if(result.some(x=>!x) || new Set(result).size!==result.length) throw Error('Use distinct comma-separated module IDs');
  return result;
}
export function validateSource(api, source, select, viewNames) {
  const profile=api.createProfile({...select?{select}:{},...viewNames?{viewNames}:{}}), runtime=api.createRuntime(profile);
  try {
    const result=runtime.commit(source);
    if(!result.ok) throw Error(result.issues.map(x=>`${x.code} ${x.path}: ${x.message}`).join('\n'));
    return {profile, snapshot:result.snapshot};
  } finally {runtime.dispose();}
}
export const htmlEscape = value => String(value).replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const scriptJSON = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function runtimeURL(value) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https:\/\//i.test(value)) throw Error('Runtime URL must be a relative file path or verified HTTPS URL');
  if (/^\/\//.test(value) || /[\x00-\x1f]/.test(value)) throw Error('Invalid runtime URL');
  return value;
}
export function htmlDocument({source,title='Interactive answer',lang='en',runtime='./inform-ui.global.js',select,viewNames,theme='light'}) {
  runtimeURL(runtime);
  if (!['light','dark'].includes(theme)) throw Error('theme must be light or dark');
  const config={source,...(select?{select}:{}),...(viewNames?{viewNames}:{}),theme};
  return `<!doctype html>
<html lang="${htmlEscape(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${htmlEscape(title)}</title>
<style>html{color-scheme:${theme}}body{margin:0;padding:clamp(16px,4vw,48px);background:${theme==='dark'?'#141414':'#fff'};color:${theme==='dark'?'#eee':'#171717'};font-family:system-ui,sans-serif}main{max-width:1040px;margin:auto}#inform-status{max-width:1040px;margin:16px auto;white-space:pre-wrap}</style>
</head>
<body>
<main id="answer" aria-label="${htmlEscape(title)}"></main>
<p id="inform-status" role="status">Loading interactive answer…</p>
<noscript>This answer needs JavaScript to show its content and local controls.</noscript>
<script id="inform-document" type="application/json">${scriptJSON(config)}</script>
<script src="${htmlEscape(runtime)}"></script>
<script>
(() => {
  const status=document.getElementById('inform-status');
  let failed=false;
  const fail=issues=>{failed=true;status.hidden=false;status.textContent='Could not render this answer. '+issues.map(issue=>issue.message||String(issue)).join(' ');};
  try {
    if(!globalThis.InformUI)throw Error('Inform UI bundle could not be loaded. Keep the supplied runtime beside this HTML or use the verified release URL.');
    const config=JSON.parse(document.getElementById('inform-document').textContent);
    const view=InformUI.mount(document.getElementById('answer'),{...config,onError:fail});
    if(view.getSnapshot()&&!failed){status.hidden=true;status.textContent='';}
    addEventListener('pagehide',()=>view.dispose(),{once:true});
  } catch(error) {fail([{message:error.message}]);}
})();
</script>
</body>
</html>
`;
}
