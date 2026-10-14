import assert from 'node:assert/strict';
import {createAgentSession} from '../examples/agent-integration/session.mjs';

// Run against the compiled TypeScript consumer, not a duplicated JS mock.
export async function checkAgentConsumer(consumeModelText) {
  const selection = {select:['base/layout','base/controls'],viewNames:[]};
  const source = 'root = Stack([Text("Synthetic transport")])';
  const sessions = [];
  const create = () => { const session = createAgentSession(selection); sessions.push(session); return session; };
  async function* chunks(text) { for (let index = 0; index < text.length; index += 5) yield text.slice(index, index + 5); }
  const checks = [];
  try {
    const session = create();
    assert((await consumeModelText(session, chunks(source))).ok);
    assert.equal(session.getDocument().source, source);
    checks.push('async text chunks commit a complete answer');

    const before = session.getSnapshot();
    async function* broken() { yield 'root = '; throw new Error('Synthetic transport interrupted'); }
    await assert.rejects(consumeModelText(session, broken()), /transport interrupted/);
    assert.equal(session.getSnapshot(), before);
    assert.equal(session.getDocument().source, source);
    checks.push('transport failures keep the previous accepted answer');

    const controller = new AbortController();
    async function* cancelled() { yield 'root = '; controller.abort(); yield 'Stack([])'; }
    await assert.rejects(consumeModelText(session, cancelled(), controller.signal), /Generation cancelled/);
    assert.equal(session.getSnapshot(), before);
    checks.push('abort signals reject a generation without replacing accepted state');

    let release;
    const wait = new Promise(resolve => { release = resolve; });
    async function* slow() { await wait; yield 'root = Stack([Text("stale")])'; }
    const older = consumeModelText(session, slow());
    const current = 'root = Stack([Text("newer")])';
    assert((await consumeModelText(session, chunks(current))).ok);
    release();
    const stale = await older;
    assert.equal(stale.ok, false);
    assert(stale.issues.some(issue => issue.code === 'STALE_GENERATION'));
    assert.equal(session.getDocument().source, current);
    checks.push('late responses and cleanup cannot overwrite the newer answer');
    return checks;
  } finally { for (const session of sessions) session.dispose(); }
}
