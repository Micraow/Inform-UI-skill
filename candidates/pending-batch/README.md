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
