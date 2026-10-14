import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadRuntime} from '../scripts/lib.mjs';
import {assertProfileContract, assertSchemaReferences} from '../scripts/contract-audit.mjs';
import {webChatPrompt} from '../scripts/prompt-projection.mjs';

const api = await loadRuntime();
const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
for (const directory of ['web-chat-core', 'curated-web-chat']) {
  const config = await json('profiles/' + directory + '/profile.json');
  const profile = api.createProfile({select:config.select,viewNames:config.viewNames});
  const stored = {
    schema:await json('profiles/' + directory + '/schema.json'),
    manifest:await json('profiles/' + directory + '/manifest.json'),
    prompt:await readFile(new URL('../profiles/' + directory + '/prompt.txt', import.meta.url), 'utf8'),
  };
  test(directory + ' has identical generated schema, manifest and projected prompt', () => {
    assertProfileContract(profile, stored, webChatPrompt);
    assertSchemaReferences(stored.schema);
  });
  for (const target of ['schema', 'manifest', 'prompt']) {
    test(directory + ' audit rejects stale ' + target + ' independently', () => {
      const changed = structuredClone(stored);
      if (target === 'schema') changed.schema.$defs.Input.properties.value.maxLength--;
      if (target === 'manifest') changed.manifest.components.find(item => item.name === 'Input').orderedProps.reverse();
      if (target === 'prompt') changed.prompt = changed.prompt.replace('Input(label:', 'Input(staleLabel:');
      assert.throws(() => assertProfileContract(profile, changed, webChatPrompt), /differs from runtime/);
    });
  }
}

test('schema reference audit rejects dangling references at any nesting depth', () => {
  const schema = {$defs:{Known:{type:'string'}},properties:{value:{$ref:'#/$defs/Known'}}};
  assertSchemaReferences(schema);
  schema.properties.value = {anyOf:[{items:{$ref:'#/$defs/Unknown'}}]};
  assert.throws(() => assertSchemaReferences(schema), /Unresolved schema reference/);
});

test('prompt projection fails closed when upstream prose changes', () => {
  assert.throws(() => webChatPrompt('Unreviewed upstream prompt'), /Runtime prompt changed/);
});
