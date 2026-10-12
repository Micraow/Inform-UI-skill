import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { compactAuthorDocument, compileAuthorDocument, stringifyAuthoring } from './compact-authoring.mjs';
import assert from 'node:assert/strict';
export const representativeExamples = ['examples/minimal.json','examples/hpcc-feedback.json','examples/rtt-trend.json','examples/primitives-with-form-and-time.json','candidates/questionnaire/examples/event-packing.json'];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = b => createHash('sha256').update(b).digest('hex');
const bytes = x => Buffer.byteLength(stringifyAuthoring(x));

export async function auditAuthoring(library) {
  const examples=[];
  for(const p of representativeExamples) {
    const raw=await readFile(path.join(root,p)), document=JSON.parse(raw), compact=compactAuthorDocument(document);
    assert.deepEqual(compileAuthorDocument(JSON.parse(stringifyAuthoring(compact))),document);
    const keyCounts={},keyBytes={};
    function visit(x){if(!x||typeof x!=='object')return;if(!Array.isArray(x))for(const k of Object.keys(x)){keyCounts[k]=(keyCounts[k]??0)+1;keyBytes[k]=(keyBytes[k]??0)+Buffer.byteLength(JSON.stringify(k))+1;}for(const v of Object.values(x))visit(v);}
    visit(document);
    examples.push({path:p,sha256:sha(raw),prettyBytes:raw.length,canonicalMinifiedBytes:bytes(document),compactMinifiedBytes:bytes(compact),savedBytes:bytes(document)-bytes(compact),envelopeSelected:compact.format==='iui-author/1',repeatedKeys:keyCounts,keyBytes:Object.values(keyBytes).reduce((a,b)=>a+b,0),opArgsKeyBytes:(keyBytes.op??0)+(keyBytes.args??0)});
  }
  const legacyFile=await access(path.join(root,'SKILL.7b9a332.md')).then(()=> 'SKILL.7b9a332.md',()=> 'SKILL.md');
  const legacy=await readFile(path.join(root,legacyFile)),entry=await readFile(path.join(root,'SKILL.md')),web=await readFile(path.join(root,'WEB-CHAT-GUIDE.md'));
  const schemaRaw=await readFile(path.join(library,'src/schema/iui.schema.json')),schema=JSON.parse(schemaRaw);
  const packRaw=await readFile(path.join(root,'authoring/packs/questionnaire.json')),pack=JSON.parse(packRaw);
  const guide=await readFile(path.join(root,'authoring/EXPERIMENTAL-SYNTAX.md'));
  const contract=await readFile(path.join(library,'docs/questionnaire-contract.md')),fixture=await readFile(path.join(root,representativeExamples.at(-1)));
  const savings=examples.reduce((n,x)=>n+x.savedBytes,0);
  return {
    format:'inform-authoring-byte-audit/1',runtimeSource:pack.runtime.source,measurement:'UTF-8 bytes; no tokenizer available or invoked; token counts and model accuracy are unmeasured',
    examples,
    guides:{legacyEntry:{path:legacyFile,bytes:legacy.length,sha256:sha(legacy)},currentEntry:{path:'SKILL.md',bytes:entry.length,sha256:sha(entry)},webGuideBytes:web.length},
    schema:{fileBytes:schemaRaw.length,minifiedBytes:bytes(schema),definitions:Object.keys(schema.$defs).length,selectedDefinitions:pack.identity.definitions,selectedSchemaMinifiedBytes:bytes(pack.schema)},
    completeQuestionnaireTask:{legacyEntryPlusFullSchemaContractExampleBytes:legacy.length+schemaRaw.length+contract.length+fixture.length,currentEntryPlusAdjacentPackBytes:entry.length+packRaw.length,packPrettyBytes:packRaw.length,packMinifiedBytes:bytes(pack),note:'Compared bundles include instructions, schema, semantic constraints and the original example. Full guides are not assumed to be read together.'},
    optionalSyntax:{guideBytes:guide.length,fiveOutputDocumentsSavedBytes:savings,netAdditionalBytesIncludingGuide:guide.length-savings,decision:'Canonical JSON is the default. Optional compact syntax has a net input cost on these five examples and is not promoted as the primary interface.'},
    evidence:{roundtripExamples:examples.length,modelGenerationExperimentExecuted:false,tokenizerUsed:null,nativeOrPixelExperimentExecuted:false},
  };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [library,output]=process.argv.slice(2);if(!output)throw Error('Usage: audit-authoring.mjs exact-runtime-root output.json');
  await writeFile(output,JSON.stringify(await auditAuthoring(library),null,2)+'\n');
}
