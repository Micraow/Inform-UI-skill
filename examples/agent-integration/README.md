# Provider-neutral Agent integration

This example feeds synthetic recorded text through the actual bundled Inform
runtime. It does not call a model API, require an OpenAI SDK, fetch data, or
perform a host action. The session adapter is a small integration example, not
an independently versioned SDK.

## Run the reproducible checks

From the Skill root, with Node 22 or later and no dependency installation:

```sh
node --disallow-code-generation-from-strings examples/agent-integration/replay.mjs
node --disallow-code-generation-from-strings --test tests/agent-integration.test.mjs
```

The replay splits `workshop-plan.openui` into 22 synthetic text chunks. Its JSON
report records the source commit, exact Node-runtime SHA-256, fixture SHA-256,
selection, passive-preview result, final commit, and eight named rejections.
Those hashes come from the files actually executed. It is a deterministic
integration replay, not a live-model reliability benchmark or browser test.

## Connect a model transport

1. The trusted application creates a session with explicit `select` and
   `viewNames`. The same fixed profile supplies `session.prompt`, preview and
   final validation. Model output supplies DSL text only. Do not accept a model
   response's requested modules, callbacks, JavaScript or runtime URLs.
2. Send the task and `session.prompt` to your chosen model. Instruct it to return
   only a complete DSL program, without Markdown fences. The application owns
   authentication, transport, retries and any provider-specific response format.
3. Call `beginGeneration()`, then `append(token, text)` for each text delta.
   Preview is optional and always non-interactive. Batch or throttle preview
   updates; parsing on every character is unnecessary. Only `finish(token)` can
   commit the completed program. Always inspect its `ok` result and issues.
4. After success, `getDocument()` supplies the accepted source and exactly the
   same selection for `InformUI.mount`. Copying the selection avoids prompt vs.
   rendering-capability mismatches. Wire browser `onError` and check the actual
   render separately. `getDocument()` exports the committed source/defaults;
   it does not serialize subsequent local state changes.
5. Dispose the session when replacing its owner. A new generation supersedes the
   old token. Cancelled, finished, foreign or copied tokens cannot append or
   replace an answer. A rejected final program keeps the last accepted answer.

```js
import {createAgentSession} from './session.mjs';

const session = createAgentSession({
  select:['base/layout','base/controls','views/content'],
  viewNames:['MetricView'],
});
const token = session.beginGeneration();
session.append(token, 'root = Stack([MetricView({label:"Synthetic count",value:3})])');
const result = session.finish(token);
if (!result.ok) console.error(result.issues);
else console.log(session.getDocument());
session.dispose();
```

## TypeScript consumer

`session.d.mts` declares the adapter's result unions and opaque generation token.
`consume.mts` accepts any `AsyncIterable<string>` plus an optional AbortSignal;
it has no provider dependency. Validation errors return an `ok:false` result.
Transport failures and cancellation throw, while cleanup cannot cancel a newer
generation. Pass the signal to the transport too: this helper cannot interrupt
a provider stalled before its next text chunk.

If TypeScript is already installed, use its compiler explicitly:

```sh
node --disallow-code-generation-from-strings scripts/test-agent-types.mjs --typescript /path/to/typescript/lib/tsc.js
```

This optional command checks strict positive/negative types, compiles the actual
consumer into a temporary directory, and exercises successful chunks,
interruption, cancellation and overlapping responses. It downloads nothing and
does not change the runtime. The normal JavaScript suite needs no TypeScript.

## What the fixtures establish

- One dataset drives a chart and a projected table without hidden row metadata.
- Local selection, budget changes, retained-choice warning, empty state and reset
  are tested. Forged or stale runtime action/binding handles remain invalid.
- Runtime rejection cases cover incomplete output, unselected Views, disabled
  host actions, duplicate declarations, prototype-related keys, data constructors
  used as children, chart-length mismatch and undeclared table columns.
- The adapter limits generated source to 64,000 UTF-16 code units by default;
  a cap violation cancels that generation without committing a truncated answer.
  Runtime budgets still apply independently.

All workshop names, scores and cost points are synthetic. No private captures,
model conversations or credentials are included. Current runtime and publication
provenance remain in `generated/runtime-lock.json` and `generated/build.json`; running this
example does not publish or verify a rolling/CDN release.
