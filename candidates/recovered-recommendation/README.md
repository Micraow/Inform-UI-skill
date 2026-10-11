# Unified recovered 118 consumer

This is the latest single consumer for the recovered branch. The local runtime is pinned in `runtime-lock.safe.json`; its 118 protocol nodes are not an acceptance count. Canonical status is 53 historical functional acceptances, 58 implemented/pending, 140 unimplemented and 5 partial (256). Only `recommendation-card` is newly added relative to 117. The CopyWords repair changes no component count.

```sh
node candidates/recovered-recommendation/verify.mjs --library /absolute/path/to/ui-recommendation-integration
npm test
```

The original `examples/recommendation.json` uses supplied literal text and an explicitly supplied opening capability. It cannot detect accounts or fetch a conversation. `consumer.mjs` receives a caller-loaded pinned runtime, cancels all three reading intents and writes the chosen identifier as literal text to a separate output. No navigation, account connection or financial operation occurs.

The verifier checks actual built Node/browser/CDN APIs, exact file locks and 52 manifest entries, all old 117 schema definitions, Base/Finance ownership, standalone/CDN CSS closure and deterministic inline compilation. Original TransactionDetail, CardGroup and scientific fixtures are reused. Clipboard tests use a named Promise stub; no system clipboard permission or contents are tested. Generated HTML stays in memory.

The former 118 negative controls remain recorded: 13 CopyWords failures, an external Recommendation CSS omission and an over-broad tracker test. Their successor passes are bound to the final exact asset. Native/pixel acceptance is still 0. Permanent composed-ancestor/same-turn remove-and-restore retirement remains an explicit limitation; the font-only successor below closes both missing-resource gates.

Exact final aggregate at `3c57878df3f290cd0a34d96be0577d5c9ff64fff`: 1769/1771, exit 1. The two remaining failures are the unavailable test-font owner hash and test-font module. The prior 13 CopyWords and one tracker-scope failure are closed in this aggregate; the external Recommendation CSS is separately verified in the actual asset. This is not an all-green full-library claim.

The current source lock is the font-only successor `4c6f52e3f14adb9eca4095f7e2f7485eead467dd`. All 837 prior locked files are byte-identical, including the 3c57878 runtime assets; one exact pinned Noto CJK font is added. Its 14 targeted font/browser-plan gates pass. The earlier 1769/1771 full result is preserved with its original asset commit; no new full or native run is implied. The historical full lock covers 838 files; the safe default checks 837 permitted files. Its CopyWords comparison uses the integrated ancestor commit, so no side-branch Git object is needed.

## Safe restore verification

The default verifier uses `runtime-lock.safe.json`, which deliberately omits repository agent-guidance metadata. The original historical lock is retained locally, unchanged, and is not required or included in the safe backup. Original commit/tree and full-source digest remain provenance records, not a claim that a sanitized checkout has that Git identity. The permitted file closure has its own digest and every included file is checked before and after runtime use. Git history and the omitted guidance file are unnecessary. `sourceCommitVerified` is false for this mode; content/asset verification remains exact.
