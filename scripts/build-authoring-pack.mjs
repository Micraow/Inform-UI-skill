/** Extract a dependency-closed node contract without fetching sources or loading a runtime. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { stringifyAuthoring } from './compact-authoring.mjs';
const clone = x => JSON.parse(stringifyAuthoring(x));

export function extractNodeSchema(input, definition) {
  const schema = clone(input), found = new Set();
  if (!schema.$defs || !Object.hasOwn(schema.$defs, definition)) throw Error('Unknown node definition');
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string') {
      if (!value.$ref.startsWith('#/$defs/')) throw Error('Only local definition references are supported; no network resolution');
      const key = value.$ref.slice(8);
      if (!Object.hasOwn(schema.$defs, key)) throw Error('Unresolved definition: ' + key);
      if (!found.has(key)) { found.add(key); visit(schema.$defs[key]); }
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit({ $ref: '#/$defs/' + definition });
  return { $schema: schema.$schema, $ref: '#/$defs/' + definition, $defs: Object.fromEntries([...found].sort().map(k => [k,schema.$defs[k]])) };
}

export function buildAuthoringPack({ schema, definition, example, contract, runtime }) {
  const selected = extractNodeSchema(schema, definition);
  return clone({
    format: 'inform-authoring-task/1', runtime, rootKind: 'node', definition,
    validation: 'The included schema validates one node. Place it in the canonical example document and run the same runtime validateDocument for complete structural and semantic validation.',
    contract, schema: selected, example,
    identity: { fullSchemaSha256: createHash('sha256').update(stringifyAuthoring(schema)).digest('hex'), definitions: Object.keys(selected.$defs) },
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [schemaPath, definition, examplePath, contractPath, runtimePath, output] = process.argv.slice(2);
  if (!output) throw Error('Usage: build-authoring-pack.mjs schema.json Definition example.json contract.json runtime.json output.json');
  const read = async p => JSON.parse(await readFile(p, 'utf8'));
  const result = buildAuthoringPack({ schema: await read(schemaPath), definition, example: await read(examplePath), contract: await read(contractPath), runtime: await read(runtimePath) });
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
}
