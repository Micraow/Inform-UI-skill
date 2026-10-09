# Pending acceptance: 30 canonical contracts / 32 unique examples

This is a prepared, unaccepted branch. Asset revision `7978f23da0222ad9122bb0b40daa4f1844b5b9cd` and tree `7a8796cd9cc1ce1026ae1a225716847e1d408d62` bind root contract, HTML shells, generated 90-node inventory and source/build locks. The accepted 53-component count, prior recommendation and user demos do not change. The historical d370 contract is preserved in [accepted-library-contract.json](accepted-library-contract.json); commits 94b5cd1 and 9bf9dfa remain frozen history.

[manifest30.source.json](manifest30.source.json) adds six contracts and five original examples to the prior 24 contracts / 27 examples. Motion serves animate and celebration once. Earlier 20/24 manifests are unchanged. [category-index.json](category-index.json) derives from the full canonical schema, never a second schema. [library-candidate-lock.json](library-candidate-lock.json) binds exact source blobs, frozen runtime bytes, root fixtures, locale map, receiver and scripts. Historical 5c7f staged core evidence is 863 prior-full and 237 final-affected tests, not an invented aggregate final full suite.

## Browser preparation and ownership

[verify-browser.mjs](verify-browser.mjs) is prepared only. Future sole owner: core `scripts/run-batch-consumers.mjs`; no browser, CI or screenshot result exists from this preparation. Copy this script to core `tests/consumer/pending/verify-browser.mjs` and adjacent `examples/` unchanged to `tests/consumer/pending/examples/`. Its only arguments are `--library CLEAN_CORE --revision ACTUAL_CORE_SHA --screenshots FRESH_EMPTY_DIR`. The actual core revision may be a CI merge SHA, provided exact source/build proof succeeds.

32 examples × 3 widths (390/768/1100) × 2 themes = 192 planned inline views. Existing 15 inputs retain their original owner and 90 views. No names or byte hashes overlap; motion is one input. [consumer-plan.json](consumer-plan.json) records mappings and exact hashes. Root Skill `examples/` contains the same 32 bytes plus five previously missing enhancement fixtures, preserving all original 24 inputs. The 61-entry [language map](../../references/example-languages.json) retains the actual original 20 zh-CN / 4 en semantics; five enhancement inputs are zh-CN, new32 match their consumer entry language.

The smoke uses native keyboard/input/mouse actions, one root, overflow ≤1px, pageerror and real request listeners, full-page original PNGs, no consent for remote media. Detailed behavior belongs to canonical tests. It never labels JSDOM or compilation as browser acceptance. `RESULTS.json` adds `exampleLanguages` to revision/browser/widths/themes/localCompiledViews/publicCdn. A successful shared receipt may skip only exact-byte, exact-locale inline modes. CDN modes and four public entry shells always run.

Receiver checks committed revision/tree/schema/manifest/locale/script/JSON anchors; fixed `BUILD-EQUIVALENCE.json` digest, anchors and exact current dist trees; reports and all original PNG hashes. Missing, changed or extra runtime files and symlinks fail closed. Public discovery binds fetched index length/SHA256 to the trusted local integrity manifest, then child bundles and same-pin examples to their expected bytes.

## Source-only preparation commands

Use a clean detached 5c7f checkout with its proven frozen dist, not a working-tree override. No rebuild or browser is part of preparation.

```sh
npm test
node scripts/validate-examples.mjs --library CLEAN_ASSET
node scripts/verify-schema-index.mjs --library CLEAN_ASSET
node scripts/derive-node-support.mjs --library CLEAN_ASSET --revision 7978f23da0222ad9122bb0b40daa4f1844b5b9cd --check
node scripts/verify-next-guidance.mjs --library CLEAN_ASSET --revision 7978f23da0222ad9122bb0b40daa4f1844b5b9cd
node scripts/verify-primitive-guidance.mjs --library CLEAN_ASSET --revision 7978f23da0222ad9122bb0b40daa4f1844b5b9cd
node scripts/verify-next66-guidance.mjs --library CLEAN_ASSET --revision 7978f23da0222ad9122bb0b40daa4f1844b5b9cd
node scripts/generate-pending-lock.mjs --source-repository CLEAN_ASSET --library CLEAN_ASSET --revision 7978f23da0222ad9122bb0b40daa4f1844b5b9cd --check
node scripts/verify-pending-batch.mjs --library CLEAN_ASSET --revision 7978f23da0222ad9122bb0b40daa4f1844b5b9cd
node scripts/check-pending-browser-source.mjs --library CLEAN_ASSET
```

27 historical blind-test files retain their byte hashes and separate old green evidence. Unchanged old builds/browser runs are not repeated in this preparation. Public HTTP byte preflight is owned by the integrator; browser, full batch CI and original-image inspection remain required before accepted promotion.

## Recovery pin boundary

The immutable recovery asset is 7978f23da0222ad9122bb0b40daa4f1844b5b9cd. Its source/build bytes are bound separately by recovery-build-proof.json; original docs/local-enhancements-90.json stays unchanged historical evidence. The 863/237 prior tests are not claimed as tests of this runtime. All 311 paths are checked, and every non-dist path must match its committed Git blob; all frozen dist paths are retained in the generated Skill lock. The new public CDN pin must still be fetched and browser-verified. The agenda Escape harness regression is source-checked only. Formal accepted count remains 53, with 30 pending.
