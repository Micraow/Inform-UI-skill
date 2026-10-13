#!/usr/bin/env node
import {readFile,copyFile,mkdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {skillRoot,loadRuntime,parseArgs,selection,validateSource,htmlDocument,save,json} from './lib.mjs';

const help=`Inform interactive answers (Node 22+, no dependency install)
  inform-answer catalog [--module views/content]
  inform-answer prompt --select base/layout,base/controls [--out prompt.txt]
  inform-answer icons --query chart [--limit 12]
  inform-answer check answer.openui [--select base/layout,base/controls]
  inform-answer build answer.openui --out answer.html [--select module,ids]
      [--views MetricView,StepsView] [--title "Answer title"] [--lang en] [--theme light]
      [--runtime-url verified-https-or-relative-path]
  Any runtime command can use --runtime-dir /path/to/verified/dist/v2.
Without --runtime-url, build copies the verified browser bundle and its license
beside the HTML. It never deploys, installs, books, pays, or calls an external tool.
`;
try {
  const [command,...args]=process.argv.slice(2);
  if(!command || ['help','--help','-h'].includes(command)){console.log(help);process.exit(0);}
  const {opts,positional}=parseArgs(args);
  const allowed={catalog:['module'],prompt:['select','views','out','runtime-dir'],icons:['query','category','limit'],check:['select','views','runtime-dir'],build:['select','views','runtime-dir','out','title','lang','theme','runtime-url']}[command];
  if(!allowed)throw Error('Unknown command '+command);
  for(const option of Object.keys(opts))if(!allowed.includes(option))throw Error('Unknown option --'+option);
  if(command==='catalog'){
    const catalog=await json(join(skillRoot,'generated/catalog.json'));
    const result=opts.module?catalog.modules.filter(module=>module.id===opts.module):catalog;
    if(opts.module&&!result.length)throw Error('Unknown module '+opts.module);
    console.log(JSON.stringify(result,null,2));
  }else if(command==='icons'){
    const catalog=await json(join(skillRoot,'generated/icons.json'));
    const query=(opts.query??'').toLowerCase(),limit=Number(opts.limit??12);
    if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('limit must be an integer from 1 to 100');
    const found=catalog.icons.filter(icon=>(!opts.category||icon.category===opts.category)&&[icon.name,...icon.aliases??[],...icon.keywords??[]].join(' ').toLowerCase().includes(query));
    console.log(JSON.stringify({total:found.length,shown:Math.min(limit,found.length),icons:found.slice(0,limit).map(({name,category,aliases})=>({name,category,aliases}))},null,2));
  }else{
    const api=await loadRuntime(opts['runtime-dir']),select=selection(opts.select),viewNames=selection(opts.views);
    if(command==='prompt'){
      if(!select)throw Error('Select needed modules explicitly; use catalog to find them');
      const prompt=api.createProfile({select,...viewNames?{viewNames}:{}}).prompt({bindings:true,builtinFunctions:true});
      if(opts.out)await save(resolve(opts.out),prompt+'\n');else console.log(prompt);
    }else{
      if(positional.length!==1)throw Error('Pass one .openui source file');
      const source=await readFile(resolve(positional[0]),'utf8');
      const {profile,snapshot}=validateSource(api,source,select,viewNames);
      if(command==='check')console.log(JSON.stringify({ok:true,root:snapshot.tree.typeName,components:Object.keys(profile.components).length,modules:profile.modules}));
      else{
        if(!opts.out)throw Error('--out answer.html is required');
        const output=resolve(opts.out);await mkdir(dirname(output),{recursive:true});
        if(!opts['runtime-url']){
          const runtimeDir=resolve(opts['runtime-dir']??join(skillRoot,'assets/runtime'));
          for(const name of ['inform-ui.global.js','THIRD_PARTY_NOTICES.txt']){
            const from=join(runtimeDir,name),to=join(dirname(output),name);
            if(from!==to)await copyFile(from,to);
          }
        }
        const html=htmlDocument({source,select,viewNames,title:opts.title,lang:opts.lang,theme:opts.theme,runtime:opts['runtime-url']});
        await save(output,html);
        console.log(JSON.stringify({ok:true,html:output,modules:profile.modules,runtime:opts['runtime-url']??'./inform-ui.global.js'}));
      }
    }
  }
}catch(error){console.error(error.message);process.exitCode=1;}
