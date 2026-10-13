#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {skillRoot,json,loadRuntime,validateSource,htmlDocument,save} from './lib.mjs';
const api=await loadRuntime();
for(const example of await json(join(skillRoot,'examples/examples.json'))){
 const source=await readFile(join(skillRoot,'examples',example.id+'.openui'),'utf8');
 validateSource(api,source,example.select,example.viewNames);
 await save(join(skillRoot,'examples',example.id+'.html'),htmlDocument({...example,source,runtime:'../assets/runtime/inform-ui.global.js'}));
 console.log('Validated and built '+example.id);
}
