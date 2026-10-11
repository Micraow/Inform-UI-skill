# Supplied boxscore authoring and exact consumer

Original finite fixtures for the restored historical IDs `nba-game-boxscore` and `cricket-match-boxscore`. The exact runtime asset is `2a36d9012b70feca5e3d371cbac20c4cca7b2d5f`, implementation source `6f7140a53226f606d5744280c5f7ab14b296a04e`. The safe source closure is fixed at `73bfbeffd408cd10722900caee37425f8e9a234c`, a tests-only successor with identical application assets. These two components restore historical work; they are not new historical discoveries.

```sh
node candidates/restored-boxscores/verify.mjs --library /absolute/path/to/ui-integrated128-final
node --test tests/restored-boxscores.test.mjs
```

`examples/supplied-boxscores.json` deliberately separates source facts: a basketball team score does not equal the listed players; a period can be zero or unknown; cricket overs are text; strike rate and economy are supplied independently. These fictional values must not be rewritten to satisfy an assumed league rule.

`cases.mjs` defines 10 positive and 27 negative documents, verified through the exact Node, browser-export and CDN entry points. The previous Motorsport 10 positive/26 negative cases are reused at this same asset.

## Short authoring contract

Both nodes require a label, supplied status and exactly two teams. Status is scheduled, live, final, postponed, cancelled or unknown. “Live” is an input label, not evidence of a live feed. Optional observation must be a real Gregorian timestamp with an explicit offset. Optional source URLs are safe absolute HTTP(S).

Basketball requires supplied team scores, 0–40 player rows per team and 0–20 periods. Every period has exactly two score values. Player rows require unique local IDs, labels, nullable starter flags, nullable minutes text, nullable count columns and nullable integer plus/minus. Scores/counts are0–1,000,000; plus/minus is−1,000,000–1,000,000. Optional shot summaries are text, not numerator/denominator models.

Cricket requires 0–12 innings referencing one supplied team. Each innings supplies runs, wickets, overs text, extras and0–30 batting/bowling rows. Counts and supplied rate numbers use the bounded schema. Null is explicit unknown; zero is known zero. No ten-wicket assumption, overs-to-balls conversion, strike-rate/economy calculation, total reconciliation or winner inference is performed.

IDs are unique within each collection; the same player ID can occur in another team or in batting and bowling. Source order is preserved unless the reader explicitly sorts. Numeric ties retain source order and unknowns sort last. Details stay attached to their supplied row.

Use the runtime controller for snapshot replacement. These readers have local filtering/sorting only, no selection event or provider operation. A supplied reader removed from its connected composed ancestry is permanently retired even if restored in the same turn; call `controller.update(document)` to establish a fresh owner. Do not reuse retired DOM controls.

## Executed evidence and boundaries

Seventeen actual CDN DOM flows combine eight Boxscores, Motorsport, Player and Ledger readers. They cover independent totals/unknowns, local filtering and stable sorting, disclosure identity, canceled parent reset and newer edits, reentrant getters, transferred table bodies, atomic invalid replacement, literal text, and ordinary/nested-ShadowRoot same-turn removal/restoration. The Motorsport accessibility-getter duplicate-intent failure discovered at the old126 pin passes at this successor.

All218 prior definitions and126 prior node references remain identical. All136 prior renderer files are checked; nine explicit changes are recorded with before/after hashes in `runtime-delta-126.json`. Five added renderer files include the shared ownership and synchronous intent helpers, not only this component family. The safe lock covers920 permitted source/build files without requiring original Git history or repository instruction files.

All52 CDN entries pass bytes/SHA256/SRI checks. Runtime.styles, inline standalone HTML and external CDN CSS include the exact Boxscores stylesheet. The3,854,996-byte standalone is deterministic and only held in memory. No runtime copy, private capture or generated preview is bundled; external requests were zero.

The runtime author reports581 focused checks and31 admission checks; independent QA reports100 distinct passing cases. Those counts are separate from this consumer. The predecessor's full run does not become a full run of this exact asset. Native scenarios and pixel acceptance remain zero here.

Current inventory:121/256 implemented, comprising53 historical functional acceptances and68 pending;130 not implemented and5 partial. Protocol128 is a different count.

For renderer extensions, reuse the runtime's `suppliedReaderContext`/paint/input/reset helpers rather than duplicating resource arrays or ancestry observers. Use shared `intentGate` before any reentrant host read when adding a synchronous local intent. It does not serialize Promise continuations. Boxscores itself emits no intent; the combined test checks the existing Motorsport gate.
