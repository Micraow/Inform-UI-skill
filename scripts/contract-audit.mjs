import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {webChatPrompt} from './prompt-projection.mjs';

const sorted = values => [...values].sort();
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const declarations = prompt => [...prompt.matchAll(/^([A-Z][A-Za-z0-9_]*)\(/gm)].map(match => match[1]);

export function assertProfileContract(profile, stored, projectPrompt = value => value) {
  assert.deepEqual(stored.manifest, profile.manifest(), 'Manifest differs from runtime');
  assert.deepEqual(stored.schema, profile.schema, 'Schema differs from runtime');
  assert.equal(stored.prompt, projectPrompt(profile.prompt({bindings:true,builtinFunctions:true})) + '\n', 'Prompt differs from runtime');
}

export function assertSchemaReferences(schema) {
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Object.hasOwn(value, '$ref')) {
      const match = /^#\/\$defs\/([A-Za-z0-9_]+)$/.exec(value.$ref);
      assert(match && Object.hasOwn(schema.$defs, match[1]), 'Unresolved schema reference: ' + value.$ref);
    }
    for (const item of Object.values(value)) {
      if (Array.isArray(item)) item.forEach(visit);
      else visit(item);
    }
  };
  visit(schema);
}

// Each View is compiled independently. Constructing the full profile solely to
// check its catalog needlessly expands every nested schema at once.
export async function auditContracts({root, api, runtimeDirectory = join(root, 'assets/runtime'), onProgress = () => {}}) {
  const read = path => readFile(join(root, path), 'utf8');
  const json = async path => JSON.parse(await read(path));
  const [catalog, manifest, schema, signatures, snapshot, lock, definitions] = await Promise.all([
    'generated/catalog.json', 'generated/manifest.json', 'generated/schema.json',
    'generated/signatures.json', 'generated/snapshot-status.json',
    'generated/runtime-lock.json', 'source/profiles.json',
  ].map(json));
  const byName = new Map(manifest.components.map(component => [component.name, component]));
  assert.equal(byName.size, manifest.components.length, 'Duplicate component');
  assert.equal(catalog.componentCount, byName.size);
  assert.equal(lock.componentCount, byName.size);
  assert.equal(snapshot.componentCount, byName.size);
  assert.equal(snapshot.sourceRef, lock.sourceRef);
  assert.equal(snapshot.nodeRuntimeSha256, lock.bundles['node.mjs'].sha256);
  assert.deepEqual(sorted(Object.keys(signatures)), sorted(byName.keys()));
  assert.deepEqual(sorted(Object.keys(schema.properties)), sorted(byName.keys()));
  assert.deepEqual(sorted(catalog.modules.flatMap(module => module.components.map(component => component.name))), sorted(byName.keys()));
  assert.deepEqual(catalog.dataConstructors, manifest.dataShapes);
  assert.deepEqual(catalog.externalServices, manifest.externalServices);
  assert.equal(lock.dataConstructorCount, manifest.dataShapes.length);
  assertSchemaReferences(schema);

  const fullPrompt = await read('generated/full-profile.txt');
  const fullSignatures = new Map(fullPrompt.split('\n').filter(line => /^[A-Z][A-Za-z0-9_]*\(/.test(line)).map(line => [line.slice(0, line.indexOf('(')), line]));
  const declared = new Set(declarations(fullPrompt));
  for (const item of [...manifest.components, ...manifest.dataShapes]) {
    assert(declared.has(item.name), 'Missing full-prompt declaration: ' + item.name);
    assert(Object.hasOwn(schema.$defs, item.name), 'Missing schema: ' + item.name);
  }
  for (const component of manifest.components) {
    const signature = signatures[component.name];
    for (const key of ['moduleId', 'orderedProps', 'slots', 'bindingProps', 'actionProps']) {
      assert.deepEqual(signature[key], component[key], component.name + '.' + key);
    }
  }
  for (const [path, expected] of Object.entries(snapshot.contracts)) {
    const bytes = await readFile(join(root, path));
    assert.equal(bytes.length, expected.bytes, path);
    assert.equal(digest(bytes), expected.sha256, path);
  }

  const covered = new Set();
  const dataCovered = new Set();
  let viewCount = 0;
  const verifySelection = async (select, viewNames, promptPath) => {
    onProgress(promptPath);
    const profile = api.createProfile({select, viewNames});
    const selected = profile.manifest();
    const prompt = profile.prompt({bindings:true,builtinFunctions:true});
    if (promptPath) assert.equal(await read(promptPath), prompt + '\n', promptPath);
    for (const line of prompt.split('\n').filter(line => /^[A-Z][A-Za-z0-9_]*\(/.test(line))) {
      assert.equal(line, fullSignatures.get(line.slice(0, line.indexOf('('))), 'Full-profile signature differs from selected runtime');
    }
    assert.deepEqual(sorted(selected.components.filter(component => component.moduleId.startsWith('views/')).map(component => component.name)), sorted(viewNames));
    for (const component of selected.components) {
      assert.deepEqual(component, byName.get(component.name), 'Runtime manifest: ' + component.name);
      // Child slots refer to the selected component set. Their accepted names
      // intentionally differ from the full profile; scalar/data rules do not.
      const liveSchema = {...profile.schema.$defs[component.name], properties:{...profile.schema.$defs[component.name].properties}};
      const fullSchema = {...schema.$defs[component.name], properties:{...schema.$defs[component.name].properties}};
      for (const [slot, rule] of Object.entries(component.slots)) {
        if (rule.accepts === 'all') {
          // Only the selectable-name union varies. Keep array size/type rules.
          liveSchema.properties[slot] = {...liveSchema.properties[slot],items:{selectedComponents:true}};
          fullSchema.properties[slot] = {...fullSchema.properties[slot],items:{selectedComponents:true}};
        }
      }
      assert.deepEqual(liveSchema, fullSchema, 'Runtime scalar schema: ' + component.name);
      covered.add(component.name);
    }
    for (const data of selected.dataShapes) {
      assert.deepEqual(data, manifest.dataShapes.find(item => item.name === data.name), 'Runtime data manifest: ' + data.name);
      assert.deepEqual(profile.schema.$defs[data.name], schema.$defs[data.name], 'Runtime data schema: ' + data.name);
      dataCovered.add(data.name);
    }
  };
  for (const module of catalog.modules) {
    const modulePrompt = await read(module.prompt);
    const moduleDeclarations = new Set(declarations(modulePrompt));
    for (const component of module.components) {
      assert(moduleDeclarations.has(component.name), 'Missing module declaration: ' + component.name);
      const expected = byName.get(component.name);
      assert.equal(expected.moduleId, module.id);
      for (const key of ['orderedProps', 'slots', 'bindingProps', 'actionProps', 'limitations']) {
        assert.deepEqual(component[key], expected[key], 'Catalog: ' + component.name + '.' + key);
      }
    }
    if (module.id.startsWith('views/')) {
      for (const view of module.components) {
        await verifySelection(view.select, view.viewNames, view.prompt);
        viewCount++;
      }
    } else {
      await verifySelection([...new Set(['base/layout', module.id])], [], module.prompt);
    }
  }
  assert.deepEqual(sorted(covered), sorted(byName.keys()), 'Catalog must cover every runtime component');
  assert.deepEqual(sorted(dataCovered), sorted(manifest.dataShapes.map(item => item.name)), 'Catalog must cover every runtime data constructor');
  assert.equal(viewCount, snapshot.viewPromptCount);

  const profiles = [];
  for (const definition of definitions) {
    const directory = definition.outputDirectory;
    const profile = api.createProfile({select:definition.select,viewNames:definition.viewNames});
    const [storedManifest, storedSchema, prompt, config] = await Promise.all([
      json(directory + '/manifest.json'), json(directory + '/schema.json'),
      read(directory + '/prompt.txt'), json(directory + '/profile.json'),
    ]);
    assertProfileContract(profile, {manifest:storedManifest,schema:storedSchema,prompt}, webChatPrompt);
    assert.deepEqual(config.select, definition.select);
    assert.deepEqual(config.viewNames, definition.viewNames);
    assert.equal(config.uiComponents, storedManifest.components.length);
    assert.equal(config.dataConstructors, storedManifest.dataShapes.length);
    profiles.push({id:definition.id,uiComponents:config.uiComponents,dataConstructors:config.dataConstructors});
  }
  const runtimeHashes = {};
  for (const name of Object.keys(lock.bundles)) {
    runtimeHashes[name] = digest(await readFile(join(runtimeDirectory, name)));
  }
  const bundledRuntimeMatches = Object.entries(lock.bundles).every(([name, bundle]) => runtimeHashes[name] === bundle.sha256);
  return {
    format:'inform-contract-audit/1', ok:true, componentCount:covered.size,
    viewPromptCount:viewCount, moduleCount:catalog.modules.length,
    dataConstructorCount:manifest.dataShapes.length, profiles, runtimeHashes,
    bundledRuntimeMatches, contractsMatchRuntime:true,
    scope:'Schema, manifest and prompt compatibility; no browser, host-service, CDN or publication assertion.',
  };
}
