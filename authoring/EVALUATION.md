# Evaluation protocol

## Separate the claims

1. Measure UTF-8 bytes for the complete input: routing instructions, selected schema closure, semantic constraints, examples, the task and any new syntax guide. Also measure generated output bytes. Record tokenizer name/version and actual token counts only when that tokenizer is available; bytes are not tokens.
2. Record raw JSON parse rate, optional authoring expansion rate, canonical structural/schema pass rate, runtime semantic validation rate, task-specific behavior pass rate and native interaction/visual results separately. Valid JSON alone is not a successful task.
3. Measure exact canonical equality for representation-only transformations. For open-ended generation, exact equality is a conservative diagnostic, not a complete semantic correctness metric; independently specified behavior assertions decide correctness.

## Fixed, original task set

Use nonmedical synthetic tasks only: a short explanation, a bottleneck formula, a chart with real zero and missing observations, a local form with disabled/reset behavior, and the packing questionnaire with hidden answers and unknown/invalid drafts. Use the five published representative documents as reproducible seeds. Add held-out wording and boundary cases without changing their units, field identity, result rules or safety requirements. Keep those expected behaviors out of the model-facing task.

For the questionnaire, score missing versus zero/false, branch activation, retain/clear, cross-field pending, invalid draft result suppression, source/version preservation, cancelable immutable snapshots and stale async completion. A compact result must compile before the same tests are run. Never repair model output before recording first-attempt results; measure repairs separately.

## Conditions and controls

- A: canonical JSON with the versioned full guide and full same-version schema.
- B: canonical JSON with the thin entry and task-specific dependency closure, adjacent semantic constraints and examples.
- C: optional compact authoring with the same task pack plus its complete syntax instructions. Charge all added grammar/escape rules to the input budget.
- D: canonical JSON with an input budget matched to C where feasible. This helps distinguish representation changes from shorter context. Byte matching is only a proxy if a model tokenizer is unavailable.

Hold model/version, sampling settings, task order policy, tool access and maximum completion budget constant; use paired tasks and multiple predeclared seeds. Report the number of cases, failures by category, uncertainty and any excluded runs. Do not tune on held-out cases or change the comparison model midway without reporting it.

## Privacy and execution

The benchmark contains original synthetic JSON and public product contracts. No private captures, user conversations, credentials, patient data or internal work records may enter prompts or reports. The local compiler and pack builder require no model provider, API key or new service. Any external model experiment requires an explicitly selected authorized endpoint and data scope; this repository does not initiate one.

Current evidence is deterministic parser/roundtrip, schema-closure, byte accounting and representative runtime checks. Model-generated accuracy, token savings and performance improvements remain unmeasured. Native browser and screenshot evidence retains its own exact runtime scope.
