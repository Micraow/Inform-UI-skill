# Source-backed progressive schemas

Start with [the small category index](index.json), choose a category, then read its complete module task pack. Each pack contains the selected structural schema, every declared semantic contract, and complete original examples. Category signatures are navigation aids; they do not replace constraints. Audit manifests remain separate from the model-facing task body.

## Two delivery paths, one schema source

- Agents with file access read only selected categories and module packs. Module selection includes declared dependencies and reports every node type it brings in.
- Web Chat uses [the complete single-file schema](webchat/iui.schema.json), automatically merged by the runtime's `--full` command from those same source modules. It is byte-identical to the canonical schema at the pinned runtime revision.

All 218 registered node types are covered by 90 source modules. The compatibility [legacy index](legacy-components.json) is empty. The foundational layout family still brings in 41 types: this is module-level selection, not an assertion that every component has its own file. The 212/256 historical functionality count is separate from schema coverage. Recognition does not prove rendering or functional parity.

The Web Chat schema is generated output, never a second manual maintenance source. The [historical Web Chat guide](../../WEB-CHAT-GUIDE.md) retains its own versioned compatibility contract. Do not edit generated catalog files manually.

## Optional precise node roots

When a complete child-type set and matching examples are known, the [explicit node adapter](../NODE-SELECTION.md) can narrow a source-module selection. Every child type must be explicit, examples must validate, and all module semantics remain. Module selection is the default. Unknown types, missing typed children and incomplete example coverage fail rather than silently expanding or falling back.

## Generate from the fixed public source

The source is [50054d2](https://github.com/Micraow/Inform-UI/commit/50054d2e436e8a0e215043ad3839f78623ecf4f8). [The publication receipt](source-public.json) records exact public Git blobs, SHA-256 hashes and byte sizes for 340 source, contract, example and generated files. The local source pin and verified public pin are the same immutable commit.

Check out that commit and install its declared dependencies. From this Skill checkout:

```sh
node scripts/generate-progressive-catalog.mjs \
  --library /path/to/Inform-UI \
  --revision 50054d2e436e8a0e215043ad3839f78623ecf4f8 \
  --publication authoring/progressive/source-public.json \
  --output authoring/progressive
```

The explicit publication receipt rechecks its file hashes before assigning public provenance. Without that receipt, the generator records publicCommit as null rather than guessing publication from a local checkout. The checkout must be clean and its HEAD must match the exact revision.

For a cross-module task, request actual component types using the same source CLI:

```sh
node scripts/progressive-source-consumer.mjs \
  --library /path/to/Inform-UI \
  --revision 50054d2e436e8a0e215043ad3839f78623ecf4f8 \
  --components text,input,questionnaire \
  --root document --output task.json
```

Selected Node unions contain exactly the module dependency closure. Every other selected definition matches the canonical full schema. Never concatenate definitions by hand. A node-root package is not a complete Document validator; final documents still require same-version `validateDocument` and relevant interaction checks.

## Semantic and version boundaries

Every module declares semanticContractPaths. The adapter loads those required sections and complete examples. Ordinary Markdown links do not silently import unrelated release notes or CDN guides. Older indexes retain their documented transitive-link behavior. External links are never fetched. Full selected documents, including their state and envelope, must satisfy their structural schema.

Preserve missing, null, invalid, zero and false separately. Questionnaire hidden drafts follow an explicit retain/clear policy and never enter active submitted answers or calculations while hidden. Invalid or required-unknown input suppresses results. Read the nearby contract for pending validation, frozen snapshots, cancellation and stale asynchronous completions.

Media packs retain required reader/Lottie dependencies; composed study and search packs retain their declared children. Native and HTML-view schema recognition is not permission for arbitrary execution. Supplied data and local cancellable intents do not schedule tasks, access accounts, navigate, or authorize external services. Read all selected safety and host-effect contracts.

The public source retains numeric-only Lottie layer types. Its existing214 CDN remains a separately pinned asset set, without the Lottie guard fix, Questionnaire, or source-module tooling. This catalog update does not publish a runtime package or change that CDN.

All 27 generated runtime schemas, declarations and validators remain byte-identical to the previous 141-node catalog source. The full Web Chat schema remains 751,247 bytes with SHA-256 c59d34b171ee7cc54e278a857688d834363bbd6ff064f9ff503abfb74bdd0c92. Module migration changes authoring organization without changing this compatibility payload.

## Measurements and verification

[The generation record](generation.json) lists every module's schema, contract, example and complete routing byte counts and every generated artifact identity. Add the current SKILL.md byte length to routeAndTaskBytes for the complete default-entry loading path. Category metadata is authoritative; it may differ from a module ID prefix.

[The consumer result](consumer-result.json) records exact-source regeneration and contract checks. [The optional-node result](../node-selection-result.json) covers explicit node selection. [Five original design workflows](../design-workflows/README.md) compare complete module and node reading paths with same-version structural and core semantic validation.

These are UTF-8 byte measurements and structural/source/core checks. They do not establish token savings, model-generation accuracy, clinical validity or browser rendering. The earlier [eight-task pilot](../pilot-v1/METHOD.md) used different fixed materials and remains separate evidence.

To reproduce the current checks:

```sh
node scripts/verify-progressive-source.mjs --library /path/to/Inform-UI --revision 50054d2e436e8a0e215043ad3839f78623ecf4f8 --generated authoring/progressive --publication authoring/progressive/source-public.json
node scripts/verify-node-source.mjs --library /path/to/Inform-UI --revision 50054d2e436e8a0e215043ad3839f78623ecf4f8 --output node-selection-result.json
node scripts/compare-design-workflows.mjs --library /path/to/Inform-UI --revision 50054d2e436e8a0e215043ad3839f78623ecf4f8 --output design-workflow-results.json
node --test --test-concurrency=1 tests/*.test.mjs
```
