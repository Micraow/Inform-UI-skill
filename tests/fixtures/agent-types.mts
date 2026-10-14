import {createAgentSession, type Generation, type AgentSession} from '../../examples/agent-integration/session.mjs';
import {consumeModelText} from '../../examples/agent-integration/consume.mjs';

const session: AgentSession = createAgentSession({select:['base/layout','base/controls'],viewNames:[]});
const token: Generation = session.beginGeneration();
session.append(token, 'root = Stack([Text("Synthetic")])');
const result = session.finish(token);
if (result.ok) result.snapshot.tree.typeName satisfies string;
else result.issues[0]?.code satisfies string | undefined;

async function* chunks(): AsyncGenerator<string> { yield 'root = Stack([Text("Synthetic")])'; }
consumeModelText(session, chunks(), new AbortController().signal);
// @ts-expect-error Model envelopes are not text deltas.
session.append(token, {source:'ignored'});
// @ts-expect-error Generation tokens cannot be structurally forged by a caller.
session.finish({});
// @ts-expect-error Capabilities remain readonly after session creation.
session.selection.select.push('views/weather');
// @ts-expect-error Snapshot access requires discriminating the result first.
result.snapshot;
