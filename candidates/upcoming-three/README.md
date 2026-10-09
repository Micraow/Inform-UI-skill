# Three later Base nodes: source-authoring package

This branch prepares `create-interactive-poll`, `email-preview`, and `file-nav-list` against corrected source `3858d0a502956d283f3d60ab8c2481f691e50522`. It does not change the pending37 consumer lock, fixture ownership or shell. Formal accepted count remains53. The runtime has100 structural nodes; that number is not an accepted component count.

## Use the right revision

The root shell/library-contract still describes the previous26ec pending37 cohort. New nodes must use the separate3858 local runtime and schema package here. Base guidance is appended to root SKILL.md with an explicit revision gate; `guidance-source.md` is its exact tested source. New literals use `upcoming-only`, keeping old pending37 literals tied to their original runtime.

- `schema/iui.schema.json` is the exact full schema from the immutable source.
- `schema/fragments/` is regenerated from that full schema and the source-owned ownership map using the pinned generator:11 document bundles,11 node lookups, and an index.
- All56 index-referenced original examples are included so local index paths resolve. Only two fixtures add these three canonical identities; the remaining examples support complete schema regression checks and are not new consumer ownership claims.
- `source-package.json` binds360 production/build input hashes, the complete134-path dist set, all generated schemas/examples, and the committed ownership repair proof. No runtime binaries or private assets are vendored.
- `rejection-examples.json` contains23 complete invalid documents. Poll incompleteness is deliberately absent because an incomplete draft is legal; Prepare readiness is separately checked with JSDOM.

## Reproduce

Run `npm run generate:upcoming -- --library /absolute/path/to/clean3858` to regenerate the package, or add `--check` for a strict no-output comparison. Run `npm run check:upcoming -- --library /absolute/path/to/clean3858` for source proof, full/domain/node schema ownership, all indexed examples, API/browser validator parity, deterministic compile/CLI bytes, negative cases and bounded JSDOM poll checks. Run `npm test` for Skill regressions.

The library must already have its declared dependencies and exact built artifacts. These commands do not install software, build or mutate the library checkout, run a native browser, push, or trigger CI. A mismatch or dirty library is rejected.

## Historical37 preservation

`baseline37/SKILL.md.source.txt` and `baseline37/tests/pending-batch.test.mjs` retain the two e286 files superseded by this branch. The old lock remains byte-identical and checks these explicit snapshots for those two paths, and live bytes for every other original locked path. New tests additionally require root SKILL.md to contain the exact baseline prefix and exact appended source guidance. This is visible historical separation, not a claim that this larger Skill still has e286's file hashes.

Run historical `check:pending` and its lock generator only in the clean e286 checkout. Their strict candidate-file checks correctly reject this later, expanded Skill as the old complete candidate. This branch has its own `check:upcoming` source gate; no new browser consumer lock or receipt exists yet.

## Evidence limits

Core ownership proof records eight failures before repair and37 final regression passes. The source gate verifies those committed proof bytes and the complete production hash map. It does not rerun or infer a full aggregate. Native browser, screenshots, public CDN bytes, final consumer receipts and CI for these later nodes remain unverified here. Source preparation must not promote accepted counts.

All fixtures and guidance are original project-owned MIT material. No private reference captures, provider runtimes, credentials, browser profiles, cache directories or downloaded unknown-license implementations belong in this package.
