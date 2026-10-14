#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const begin = '<!-- BEGIN GENERATED PROFILE COMPONENTS -->';
export const end = '<!-- END GENERATED PROFILE COMPONENTS -->';
const modules = [
 ['base/layout','布局与容器'],['base/text','文字与表格'],['base/controls','本地控件'],
 ['base/icon','图标'],['base/media','媒体'],['base/code','代码'],['base/charts','图表'],['views/content','精选内容视图'],
];
const names = values => values.map(value => '`' + value.name + '`').join('、');
export function componentTables(core, curated) {
 const known = new Set(modules.map(([id]) => id));
 const coreNames = new Set(core.components.map(component => component.name));
 if (core.components.some(component => component.moduleId.startsWith('views/'))) throw Error('Core profile unexpectedly includes Views');
 for (const name of coreNames) if (!curated.components.some(component => component.name === name)) throw Error('Curated profile omits ' + name);
 const additions = curated.components.filter(component => !coreNames.has(component.name));
 const table = (manifest, title, path, summary) => {
  for (const component of manifest.components) if (!known.has(component.moduleId)) throw Error('Add a README label for ' + component.moduleId);
  const rows = modules.flatMap(([id,label]) => {
   const components = manifest.components.filter(component => component.moduleId === id);
   return components.length ? [`| ${label} | ${components.length} | ${names(components)} |`] : [];
  });
  return `<details>\n<summary><strong>${title}：${manifest.components.length} 个 UI 构造器</strong> · 展开完整组件表</summary>\n\n${summary} 入口：[${title}](${path})。\n\n| 模块 | 数量 | 包含组件 |\n| --- | ---: | --- |\n${rows.join('\n')}\n\n另含 ${manifest.dataShapes.length} 个数据构造器：${names(manifest.dataShapes)}。它们用于组织输入，不计入 UI 构造器数量。\n\n</details>`;
 };
 return `${begin}\n${table(core,'基础版','SKILL.md','适合解释、数据探索、图表、代码和本地交互。')}\n\n${table(curated,'精选视图版','profiles/curated-web-chat/SKILL.md',`完整包含基础版，再增加 ${additions.length} 个内容视图，适合公式、步骤、指标、引用和折叠说明。`)}\n\n数量按可调用名称统计；\`CodeView\` 是 \`Code\` 的兼容别名，\`SingleStackedBar\` 是 \`SegmentedBar\` 的兼容名称。\`Icon\` 是一个组件，可按需检索 755 个官方图标；并非额外 755 个组件。\n${end}`;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const root = new URL('../',import.meta.url);
 const manifests = await Promise.all(['web-chat-core','curated-web-chat'].map(async id => JSON.parse(await readFile(new URL('profiles/' + id + '/manifest.json',root),'utf8'))));
 const path = new URL('README.md',root), source = await readFile(path,'utf8');
 const start = source.indexOf(begin), stop = source.indexOf(end);
 if (start < 0 || stop < start) throw Error('README component markers are missing');
 const updated = source.slice(0,start) + componentTables(...manifests) + source.slice(stop + end.length);
 if (process.argv.includes('--check')) {
  if (updated !== source) throw Error('README component tables differ from actual profile manifests');
 } else await writeFile(path,updated);
}
