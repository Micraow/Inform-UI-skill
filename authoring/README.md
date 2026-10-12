# Small, complete authoring context

Use canonical `iui/1` JSON by default. Load the selected component's same-version schema closure together with its semantic constraints and a nearby complete example. Do not concatenate every historical guide or every schema group into the model input.

## Questionnaire task pack

[questionnaire.json](packs/questionnaire.json) contains all five referenced definitions, the original activity-packing document, nine semantic rules and six adjacent boundary examples. It is a complete **node** contract, not a substitute for complete-document semantic validation. Its runtime/source metadata explicitly says the tested source is not in the published214 package.

To build an equivalent pack for a known definition, use `scripts/build-authoring-pack.mjs` with the exact runtime schema, a complete original example, a reviewed semantic contract, version metadata and an output path. The script follows local references transitively, preserves recursion and rejects missing or external references. It does not fetch anything. Cross-family documents must retain every relevant dependency; a small incomplete schema is not an optimization.

Constraints that affect meaning belong beside the example: unknown versus zero, units, default behavior, hidden answers, invalid drafts, cancellation, result provenance and action side effects. A compact routing entry alone is insufficient to author a new domain correctly.

## What the byte audit found

The previous default guide is130,534 UTF-8 bytes; its separate Web Chat guide is107,997 bytes. These are independently measured files, not a claim that both were always loaded. The current full schema is751,247 bytes, while the questionnaire's five-definition closure is5,335 minified bytes. The full adjacent questionnaire pack is20,991 readable bytes, including its semantics, example and version metadata.

Across five representative documents, optional expression/table syntax reduces minified output by only269 bytes. Its new syntax guide costs2,575 bytes, giving a net **increase of2,306 bytes** when charged once to that comparison. Therefore canonical JSON remains the main interface. Formatting removal alone is not counted as a semantic compression benefit.

The optional [compact compiler](EXPERIMENTAL-SYNTAX.md) is isolated as an experiment. It expands to the existing JSON format, never evaluates code, rejects errors explicitly and passes exact roundtrip checks. Its existence does not prove it helps language models. There are no measured model-accuracy or tokenizer results; [audit.json](audit.json) reports actual UTF-8 bytes, and [EVALUATION.md](EVALUATION.md) defines the controlled comparison.

## Validation order

1. Parse JSON. If the explicit experimental envelope is present, compile it; never silently treat a failed expansion as canonical data.
2. Validate the expanded full document with its exact runtime's `validateDocument`.
3. Check the authored task's expected results, missing/invalid behavior and local interactions. Parsing or schema validity does not establish correctness.
4. Report source, package, native-browser and domain validation separately. No new provider or service is required by these tools.
