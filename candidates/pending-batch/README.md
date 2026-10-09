# Source-only 20-component candidate

This directory is an isolated authoring candidate, not a released Skill or accepted asset pin. The accepted root HTML shell and library-contract.json remain at d370ffb2df310fce0da9299e6e254a58509ba544. Common/base candidate guidance stays in the root [SKILL.md](../../SKILL.md); [learning guidance](../../references/pending-learning.md) holds the deeper learning contracts.

## Provenance

- Skill base: 8f52c9f260d06326da03b962fb344924898c4b4c.
- Exact UI source: c58eeb56961f921b063c8423b799b9bcab9658c0, tree a153b84dcd28e9edbd441c9d6491e479a510cbd4.
- 20 pending canonical components, 80 registered protocol nodes. Counts are not interchangeable. No canonical acceptance increment is claimed.
- 23 JSON examples are byte-for-byte copies of the frozen project's original examples; no private reference capture is included. Source files are project-owned MIT-licensed code/content; the unchanged upstream LICENSE and THIRD_PARTY_NOTICES hashes are recorded.
- manifest.source.json preserves the supplied manifest bytes, including its pre-freeze wording. library-candidate-lock.json supplies the actual fixed revision and every source/built-input digest.
- category-index.json is metadata derived from the frozen generated index. Paths inside it are source-repository paths, not candidate-local CDN URLs. It contains no hand-written schema. The source's full Schema remains canonical; generated document/node fragments must match regeneration from that Schema.
- Source docs/local-enhancements-80.json records the original 737/738 full Node attempt and the later 8/8 metadata-only subset correction. This candidate neither rewrites that history nor calls it a clean full rerun.

## Local checks

Build the exact source in an isolated checkout/archive using its normal npm build command. Then, from the Skill candidate:

```sh
npm test
node scripts/verify-pending-batch.mjs --library /absolute/path/to/frozen-library --revision c58eeb56961f921b063c8423b799b9bcab9658c0
```

The verifier checks source and built hashes before and after tests; canonical full Schema and regenerated closed category fragments; 23 new and all existing examples; root, guide and candidate JSON literals; exact public semantic errors; safe literal rendering; missing-domain rejection; deterministic inline compilation; real public CLI; accepted-contract and historical bytes. Its result is written only under ignored artifacts/pending-batch/. JSDOM is explicitly not browser execution.

Neither this directory nor its checker changes workflows, triggers CI, pushes, opens a browser or creates an accepted asset pin. Real browser/visual/clipboard/CDN/cross-platform CI and aggregate canonical acceptance remain unrun here. Final asset/Skill lock creation belongs to the integration owner after the whole batch freezes.

The consumer-reuse draft reviewed separately requires exact committed asset/Skill/core identities and currently maps Skill input under examples/. These isolated candidates are intentionally not silently enrolled: a later promoted batch must explicitly choose the copy/mapping, exact script and example hashes, and run its actual consumer evidence. This candidate's source-only evidence cannot substitute for that browser receipt.
