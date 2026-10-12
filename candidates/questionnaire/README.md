# Declarative questionnaire consumer

The original `examples/event-packing.json` defines a nonmedical activity-packing questionnaire entirely in `iui/1` JSON. It asks for a participant count, packets per person, a yes/no answer, and seats only when the user chooses travel. No real event or personal data is included.

## Authoring contract

- Give the definition a `questionnaireId`, a version, and a title. Optional sources record titles, versions, and safe URLs; this metadata does not verify the accuracy or permission status of an authored rule.
- Declare bounded text, number, choice, or boolean fields. A required boolean `false` is an answer, and numeric `0` is distinct from unknown.
- Use `visibleWhen` to refer to earlier fields. Use `validWhen` for explicit cross-field checks. A check waiting for an active unknown dependency is pending.
- Choose `hiddenValuePolicy` explicitly. `retain` preserves the raw draft for later revalidation; `clear` removes it when hidden. Neither policy includes hidden answers in the calculation or submitted answers.
- Declare computations with the bounded expression grammar. Named computations can depend on other computations, but cycles and arbitrary JavaScript are rejected. Use a lazy `if` to handle optional null values deliberately.
- An incomplete or invalid questionnaire exposes no computed results. Clearing or invalidating a numeric draft removes the previous result instead of continuing to show the last accepted number.

The example computes participant count times packets per person. Its second result subtracts participants from seats only in the travel branch. These are original demonstration rules, not advice or externally certified calculations.

## Local integration

Listen for `iui:questionnaire`. Its deeply frozen detail contains `intent` (`submit` or `reset`) and a snapshot with the definition ID/version, status, active answers, field validity, computed values, and sources. Call `preventDefault()` to cancel. Events do not cross a Shadow DOM boundary.

Invalid and unknown active answers are null in the snapshot. Hidden answers are absent from `answers`; their validity entries explicitly say hidden. Raw invalid text and retained hidden drafts are local editing state and are not submitted.

To handle a named `action`, supply a function under `mount(..., { questionnaireActions: { name: handler } })`. The function receives `{ snapshot, signal }` and may return a promise. Editing, replacing, or disposing the questionnaire aborts that signal and prevents its old completion from updating the view. The adapter owns any application-side persistence; the component itself does not send network requests.

The existing Form API and its events are separate. A questionnaire snapshot should not be reconstructed by assuming a Form success event contains validation, computations, and definition metadata.

## Verification

Use `verify-source.mjs --library /path/to/the/exact/pinned/source-build`. The verifier first checks every file in `runtime-lock.safe.json`, then exercises the original document cases, answer vectors, local DOM flows, and compiled offline standalone output. It performs no build and makes no service requests.

The lock and `consumer-result.json` identify the actual runtime used. Historical component coverage remains a separate inventory; adding a general questionnaire does not mark the remaining dedicated components implemented.

Verified source: `29c6905e19d00f60ad4d945d766a6fbf516f2f9c`, protocol218. The consumer checked 47 pinned files, 26 expression/answer checks, 10 accepted and 20 rejected documents, and seven actual DOM/standalone flows. All requests and external service calls remained zero. This source-build candidate has no public runtime commit recorded yet; the existing public214 CDN does not contain this node. These results do not claim a new full-library, native-browser, or domain-specific validation pass.
