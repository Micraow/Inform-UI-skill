# Maintenance

Use Node.js 22 or later. The normal checks require no dependency installation.

```sh
npm run check
```

This regenerates example HTML and runs the Node tests, complete contract audit
and Web Chat profile checks. Reports written by the optional verification scripts
belong in `.reports/`, which is ignored by Git. Keep reusable tests and fixtures;
do not commit one-off run logs or receipt copies.

## Sources and generated files

- `scripts/readme-components.mjs` regenerates the README component tables from the two profile manifests; use `--check` to detect drift.
- `source/profiles.json` is the profile-selection source of truth.
- `scripts/sync-runtime.mjs` generates full/module/View contracts and the runtime
  lock from a built Inform UI runtime. See [delivery](delivery.md) for its command.
- `scripts/generate-web-chat.mjs` generates the single-file Skills, profiles and
  `generated/build.json` from the same runtime. Use `--validation-stage local`
  until a matching public runtime has actually been observed; the script accepts
  an explicit `--http-receipt` for a verified publication.
- `generated/build.json` records the bundled snapshot and publication provenance.
  Dated HTTP observations describe that observation only, not current CDN state.
- `scripts/prompt-projection.mjs` adjusts two verified prose descriptions without
  changing component signatures. If upstream text changes, review it before
  updating the projection.

Keep runtime files, generated contracts and profile selections together. After
changing runtime bytes, regenerate the contracts instead of editing signatures or
only changing a URL. Preserve all third-party notices with copied bundles.

## Optional targeted tools

```sh
npm run check:contracts
npm run check:profiles
node --disallow-code-generation-from-strings examples/agent-integration/replay.mjs
```

`verify-contracts.mjs --runtime-dir /path/to/runtime` compares another runtime with
the saved contracts. Contract compatibility and identical bundle bytes are
separate results. The [Agent integration guide](../examples/agent-integration/)
also covers the optional TypeScript consumer check.

The separate browser command is documented in [delivery](delivery.md). A Node
check, screenshot or deterministic replay is not a live-model or full browser
acceptance result. Do not infer host-service or CDN availability from it.

## Contract limits

Constraints include numeric ranges, integers, enum values, length limits, defaults
and child combinations. Runtime cross-field rules remain authoritative. Native
Zod string lengths count UTF-16 code units; standard JSON Schema uses Unicode
code points. Boundary inputs, especially emoji, need actual runtime validation.
Some domain-level semantic checks cannot be fully expressed by the projection
and are marked in the generated contract. Do not describe the entire catalog as
semantically equivalent to JSON Schema.

## Public contribution hygiene

Use original or licensed public examples and synthetic data. Exclude credentials,
private conversations, private captures, internal instructions and working notes.
