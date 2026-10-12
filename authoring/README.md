# Small, complete authoring context

Use canonical `iui/1` JSON by default. Load the selected component's same-version schema closure together with its semantic constraints and a nearby complete example. Do not concatenate every historical guide or every schema group into the model input.

## Source-backed category selection

The [category index](progressive/index.json) is the progressive starting point for the 120-node source catalog. Read its category and complete module pack, not a signature alone. Packs are generated from the runtime source registry and carry local semantic links and examples; the [complete WebChat schema](progressive/webchat/iui.schema.json) is generated from those same modules plus explicit legacy source. See [generation and version rules](progressive/README.md). The remaining98 registered node types have not been migrated into these pilot modules. This is separate from the212/256 historical functionality count.

## Questionnaire task pack

[questionnaire.json](packs/questionnaire.json) contains all five referenced definitions, the original activity-packing document, nine semantic rules and six adjacent boundary examples. It is a complete **node** contract, not a substitute for complete-document semantic validation. Its runtime/source metadata explicitly says the tested source is not in the published214 package.

To build an equivalent pack for a known definition, use `scripts/build-authoring-pack.mjs` with the exact runtime schema, a complete original example, a reviewed semantic contract, version metadata and an output path. The script follows local references transitively, preserves recursion and rejects missing or external references. It does not fetch anything. Cross-family documents must retain every relevant dependency; a small incomplete schema is not an optimization.

Constraints that affect meaning belong beside the example: unknown versus zero, units, default behavior, hidden answers, invalid drafts, cancellation, result provenance and action side effects. A compact routing entry alone is insufficient to author a new domain correctly.

## What the byte audit found

The previous default guide is130,534 UTF-8 bytes; its separate Web Chat guide is107,997 bytes. At the first migration, the new default entry was3,823 bytes, with the original full guide preserved byte-for-byte in a versioned reference. These are independently measured files, not a claim that both full guides were always loaded. The current full schema is751,247 bytes, while the questionnaire's five-definition closure is5,335 minified bytes. That first adjacent questionnaire pack was20,991 readable bytes, including its semantics, example and version metadata.

At that migration the complete questionnaire input was24,814 bytes (thin entry plus adjacent pack), compared with891,898 bytes for the explicitly defined full-guide + full-schema + domain-contract + example bundle. This measures the loading paths and bytes of those two bundles. It does not establish equivalent model attention or model accuracy; those require the separate experiment.

Across five representative documents, optional expression/table syntax reduces minified output by only269 bytes. Its new syntax guide costs2,575 bytes, giving a net **increase of2,306 bytes** when charged once to that comparison. Therefore canonical JSON remains the main interface. Formatting removal alone is not counted as a semantic compression benefit.

The optional [compact compiler](EXPERIMENTAL-SYNTAX.md) is isolated as an experiment. It expands to the existing JSON format, never evaluates code, rejects errors explicitly and passes exact roundtrip checks. Its existence does not prove it helps language models. The original [audit.json](audit.json) reports deterministic UTF-8 measurements; its historical experiment-not-run field is unchanged. A later [eight-task paired pilot](pilot-v1/METHOD.md) now records first-pass model generation: both full and thin entries passed8/8 tasks, while input material fell from157,726 to31,015 bytes. That small, single-family result does not establish better accuracy or token savings. [EVALUATION.md](EVALUATION.md) defines the broader controlled comparison.

## Validation order

1. Parse JSON. If the explicit experimental envelope is present, compile it; never silently treat a failed expansion as canonical data.
2. Validate the expanded full document with its exact runtime's `validateDocument`.
3. Check the authored task's expected results, missing/invalid behavior and local interactions. Parsing or schema validity does not establish correctness.
4. Report source, package, native-browser and domain validation separately. No new provider or service is required by these tools.

## Source publication identity update

The exact questionnaire source is now public at a97a7c13323a91662f758c5c0034e943776935a3; the214 CDN still does not contain it. At that publication update the entry was3856 UTF-8 bytes and the adjacent pack was21102 bytes, together24958. Current routing measurements are recorded in audit.json and the progressive generation report. These small metadata changes are included in the refreshed audit. The original pilot inputs remain fixed at238c and in [questionnaire.238c.json](packs/questionnaire.238c.json); its results are not silently reattributed to later inputs.
