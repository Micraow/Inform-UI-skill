import test from 'node:test';
import assert from 'node:assert/strict';
import { linkFamilyFixtures } from '../candidates/link-family-completion-draft/fixtures.mjs';
test('Three original supplied links keep a reserved teaching host and independent metadata',()=>{
  const s=linkFamilyFixtures();assert.equal(s.links.length,3);assert.equal(new Set(s.links.map(x=>x.id)).size,3);for(const item of s.links){const u=new URL(item.url);assert.equal(u.protocol,'https:');assert.equal(u.hostname,'example.test');assert.ok(item.source&&item.title&&item.snippet);assert.ok(!('faviconURL'in item));}
});
test('Original inline icon and recommendation bitmap have exact authored PNG dimensions',()=>{
  const s=linkFamilyFixtures();for(const[src,w,h]of[[s.links[0].icon,24,24],[s.links[2].image,128,96]]){assert.ok(src.startsWith('data:image/png;base64,'));const bytes=Buffer.from(src.split(',')[1],'base64');assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),w);assert.equal(bytes.readUInt32BE(20),h);}assert.equal(linkFamilyFixtures().links[2].image,s.links[2].image);
});
test('Passive teaching content stays separate from unsupported interactive and unsafe-source probes',()=>{
  const s=linkFamilyFixtures(),types=[];const walk=nodes=>{for(const node of nodes){types.push(node.type);assert.equal('bind'in node,false);if(node.children)walk(node.children);}};walk([...s.passiveText,...s.passiveBox]);assert.deepEqual(types,['text','box','text','text']);assert.equal(s.interactiveChild.type,'input');assert.equal(s.unsafeSources.length,2);s.links[0].title='changed locally';assert.notEqual(linkFamilyFixtures().links[0].title,'changed locally');
});
