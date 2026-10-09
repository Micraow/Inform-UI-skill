# Source-only 24-component candidate

This directory is an isolated authoring candidate, not a released Skill or accepted asset pin. The accepted root HTML shell and library-contract.json remain at d370ffb2df310fce0da9299e6e254a58509ba544. Common/base candidate guidance stays in the root [SKILL.md](../../SKILL.md); [learning guidance](../../references/pending-learning.md) holds the deeper learning contracts.

## Provenance

- Prior isolated Skill candidate: ae3dad015e0b361c7b4abdf738060acb26e8a04d; this handoff adds only four new canonical contracts and refreshes their source locks.
- Skill base: 8f52c9f260d06326da03b962fb344924898c4b4c.
- Exact UI source: 75fd165f20ee6cca9beb2c172c19dbac98136b88, tree 1903e14fc97ee4dc50ed62e1fe0414706094a38e.
- 24 pending canonical components, 84 registered protocol nodes. Counts are not interchangeable. No canonical acceptance increment is claimed.
- 27 JSON examples are byte-for-byte copies of the frozen project's original examples; no private reference capture is included. Source files are project-owned MIT-licensed code/content; the unchanged upstream LICENSE and THIRD_PARTY_NOTICES hashes are recorded.
- manifest.source.json preserves the prior twenty-component supplied manifest bytes, including its pre-freeze wording. manifest24.source.json extends those identities by four and records the exact new freeze. library-candidate-lock.json supplies the actual fixed revision and every source/built-input digest.
- category-index.json is metadata derived from the frozen generated index. Paths inside it are source-repository paths, not candidate-local CDN URLs. It contains no hand-written schema. The source's full Schema remains canonical; generated document/node fragments must match regeneration from that Schema.
- Source docs/local-enhancements-84.json records the 807/808 full Node attempt and the later 16/16 focused test-only correction; the prior 737/738 plus 8/8 record remains pinned too. This candidate neither rewrites that history nor calls it a clean full rerun.

## Local checks

Build the exact source in an isolated checkout/archive using its normal npm build command. Then, from the Skill candidate:

```sh
node scripts/generate-pending-lock.mjs --source-repository /absolute/path/to/core-git-repo --library /absolute/path/to/frozen-library --revision 75fd165f20ee6cca9beb2c172c19dbac98136b88 --check
npm test
node scripts/verify-pending-batch.mjs --library /absolute/path/to/frozen-library --revision 75fd165f20ee6cca9beb2c172c19dbac98136b88
```

The deterministic lock generator verifies source blobs against the exact existing Git object and runtime artifacts against the frozen core evidence. It also hashes the candidate guidance, scripts, fixtures and examples. Omit --check only to regenerate the lock/category metadata from those same inputs; it does not build, fetch or publish.

The verifier checks source and built hashes before and after tests; canonical full Schema and regenerated closed category fragments; 27 candidate and all existing examples; root, guide and candidate JSON literals; exact public semantic errors; safe literal rendering; missing-domain rejection; deterministic inline compilation; real public CLI; accepted-contract and historical bytes. Its result is written only under ignored artifacts/pending-batch/. JSDOM is explicitly not browser execution.

Neither this directory nor its checker changes workflows, triggers CI, pushes, opens a browser or creates an accepted asset pin. Real browser/visual/clipboard/CDN/cross-platform CI and aggregate canonical acceptance remain unrun here. Final asset/Skill lock creation belongs to the integration owner after the whole batch freezes.

The consumer-reuse draft reviewed separately requires exact committed asset/Skill/core identities and currently maps Skill input under examples/. These isolated candidates are intentionally not silently enrolled: a later promoted batch must explicitly choose the copy/mapping, exact script and example hashes, and run its actual consumer evidence. This candidate's source-only evidence cannot substitute for that browser receipt.

## Prepared shared Chromium consumer (not run)

`verify-browser.mjs` prepares the 27 exact original candidate inputs for the single future core batch entrypoint `scripts/run-batch-consumers.mjs`. The adjacent `consumer-plan.json` records all source hashes, ownership and paths. Against the frozen core24 `tests/consumer` inventory, none of the 27 inputs shares a name or identical bytes with its 15 existing consumer examples. The earlier 15 remain owned by their existing scripts; this adds 162 planned views, not 162 passing views.

Copy the self-contained `candidates/pending-batch/verify-browser.mjs` to core `tests/consumer/pending/verify-browser.mjs`, and copy its `examples/*.json` unchanged to core `tests/consumer/pending/examples/*.json`. No companion runtime helper or workflow edit is needed. At final approximately-30 acceptance, the owner separately copies the same candidate JSON bytes to `examples/{name}.json` in a newly frozen pending Skill acceptance commit, so the shared producer/receiver's existing root-example path contract remains unchanged. This preparation does not perform that promotion or move the formal d370 asset contract.

The final batch owner supplies a clean actual core checkout SHA (including a PR merge SHA when applicable), whose source/build and asset equivalence are proven by the producer. The informational core24 source revision in this plan does not override `--revision`. The source-only Skill lock still deliberately checks frozen core24; refresh it separately when a later candidate is integrated.

Prepared invocation, only in the authorized future batch:

```sh
node tests/consumer/pending/verify-browser.mjs --library /absolute/core --revision ACTUAL_FULL_SHA --screenshots /absolute/fresh-evidence/pending
```

The script reuses the supplied core's locked Playwright installation and public `validateDocument` / `compileHtml` API. It checks exact fixture hashes before launch, compiles fresh light/dark variants without modifying JSON, and prepares native example interactions at 390/768/1100 pixels. These include disabled boundaries, repeated actions, keyboard focus, cancellation/reset and retained drafts/disclosures. It verifies one hydrated root, no page errors, zero unsolicited request attempts, and page-wide overflow of at most one pixel before and after interaction. Local code/table overflow is permitted. Remote favicon consent is never activated; links never navigate; the OS clipboard is never touched. No network interception, artificial DOM clicks or page-wide overflow masking substitute for browser input.

Each future passing view saves the original full-page PNG as `{name}-{theme}-{width}.png`. Only after all 162 views pass does the script write `RESULTS.json` with exactly `revision`, `browser: "chromium"`, `widths`, `themes`, `localCompiledViews`, and `publicCdn: "not-run"`. Output directories must be empty; failed executions retain completed screenshots plus `FAILURE.json` and never write a success report. The producer validates PNG/report hashes and exact Skill/core/asset provenance before creating any shared receipt. This script neither writes nor fabricates a receipt.

Scope is compiled-example smoke. Canonical core specs remain the owner of exhaustive lifecycle/disposal, async host cancellation and stale completion, real touch, forced colors, accessibility and detailed component acceptance. Counts and screenshots do not establish manual visual review, screen-reader behavior, public CDN delivery or CI success. Browser, screenshots, shared receipt, CI and release/promotion are all still **not run** for this preparation.
