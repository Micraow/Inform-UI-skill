import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {root,checkSkill,parseSkillFrontmatter,readSkillShell} from '../scripts/check-skill.mjs';
import {historical37InputPath} from '../scripts/pending-inputs.mjs';
const read=async p=>readFile(path.join(root,p));
const json=async p=>JSON.parse(await read(p));
const hash=b=>createHash('sha256').update(b).digest('hex');

test('default entry is genuinely small, routes to complete task context and retains safety semantics',async()=>{
 const b=await read('SKILL.md'),s=b.toString();assert.ok(b.length<5000);assert.equal(parseSkillFrontmatter(s).name,'inform-ui-author');
 for(const phrase of ['canonical','固定运行版本','同版','不能只凭名称猜字段','authoring/packs/questionnaire.json','authoring/progressive/index.json','authoring/progressive/README.md','validateDocument','结构和语义','所有依赖','未知','null','无效','0','false','retain/clear','冻结快照','异步退休','不放任意 JavaScript','eval','来源不是授权','SRI','未实际编译','212/256','44'])assert.ok(s.includes(phrase),phrase);
 assert.ok(s.includes('不能只读此摘要写问卷'));assert.ok(s.includes('不默认注入'));assert.ok(!s.includes('```html'));assert.ok(!s.includes('26ec211fa529516af3b1523248f5912c45ec64c6'));
 assert.equal((await checkSkill()).includes('SKILL.7b9a332.md'),true);
});

test('all130534 original guide bytes and old relative-link locations are preserved',async()=>{
 const m=await json('authoring/entry-migration.json'),b=await read(m.preservedPath);
 assert.equal(m.originalCommit,'7b9a33252364cded5177ae6f28f5104a449c26a5');assert.equal(b.length,130534);assert.equal(b.length,m.bytes);assert.equal(hash(b),m.sha256);assert.equal(hash(b),'813d9798effe53e330cf2e58b6fe06a886a2a3778980f864434ce2c1865afd28');
 assert.equal(path.dirname(m.preservedPath),'.');assert.equal(readSkillShell(b.toString()).document.version,'iui/1');
 const rootText=(await read('SKILL.md')).toString();assert.ok(rootText.includes('('+m.preservedPath+')'));
});

test('old verifier input digests remain required rather than weakened during path migration',async()=>{
 const migration=await json('authoring/entry-migration.json'),lock=await json('candidates/pending-batch/library-candidate-lock37.json');
 assert.equal(migration.preservedHistoricalCheckInputs.length,5);
 for(const f of migration.preservedHistoricalCheckInputs){const b=await read(f.preservedPath);assert.equal(historical37InputPath(f.originalPath),f.preservedPath);assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);assert.equal(hash(b),lock.candidateFiles[f.originalPath]);}
 assert.equal(historical37InputPath('examples/minimal.json'),'examples/minimal.json');
});

test('complete task cost includes the thin entry, all closed definitions and adjacent constraints',async()=>{
 const a=await json('authoring/audit.json'),entry=await read('SKILL.md'),pack=await read('authoring/packs/questionnaire.json');
 assert.equal(a.guides.currentEntry.bytes,entry.length);assert.equal(a.guides.currentEntry.sha256,hash(entry));
 assert.equal(a.completeQuestionnaireTask.currentEntryPlusAdjacentPackBytes,entry.length+pack.length);
 assert.ok(a.completeQuestionnaireTask.currentEntryPlusAdjacentPackBytes<30000);assert.equal(a.completeQuestionnaireTask.legacyEntryPlusFullSchemaContractExampleBytes,891898);
 assert.equal(a.evidence.modelGenerationExperimentExecuted,false);assert.equal(a.evidence.tokenizerUsed,null);
});
