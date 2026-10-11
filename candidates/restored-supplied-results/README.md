# Supplied tournament and election authoring consumer

Original, entirely fictional inputs for the restored historical `basketball-tournament` and `election-results` IDs. There is no real political data, electorate, live provider, forecast, targeting or persuasion. The exact runtime asset is `d1db55e6b570ed22dacb82314eba42a369a6be1e`, implementation source `344178846d0087986507d1cb8132048b36f4394f`. The source closure is `d1db55e6b570ed22dacb82314eba42a369a6be1e`, the same fixed commit as the application assets.

The sample keeps supplied facts independent: a tournament winner has the lower supplied score; later participants remain unknown; council totals, vote shares, reporting percentage and outcomes are intentionally not reconciled. Null means unknown, while0 is known zero. Candidate IDs are local to each contest; match IDs are unique across rounds. A progression pointer must name a match in a strictly later supplied round, without automatically populating that match.

Tournament limits:0–128 teams,0–12 rounds,0–32 matches per round, exactly2 participant slots per match. A slot has a supplied team or null and integer score0–1,000,000 or null. Winner is a known participant or explicit null. Status is supplied scheduled/live/final/postponed/cancelled/unknown.

Election limits:0–40 contests,0–50 candidates per contest. Votes and totals are explicit null or safe nonnegative integers up to9,007,199,254,740,991. Supplied shares/reporting percentages are null or numbers0–100. Contest status and each candidate's outcome are independent literal fields, not inferred from the counts. Candidate IDs may repeat across different contests.

Observation/start timestamps require real Gregorian dates and explicit offsets, at minute precision (`YYYY-MM-DDTHH:MMZ` or `YYYY-MM-DDTHH:MM±HH:MM`). Seconds are outside this contract. Optional source links use safe absolute HTTP(S). No endpoint, SDK, prediction or provider operation is accepted. Filtering and sorting are local reader actions only.

The family has split subset ownership: tournament belongs to sports; election-results belongs to base. The sports fragment includes the base closure and therefore accepts both nodes. The base fragment accepts election but rejects tournament. Do not move the election definition into sports merely because the renderer is shared.

Run the exact consumer and authoring checks:

```sh
node candidates/restored-supplied-results/verify.mjs --library /absolute/path/to/ui-supplied-results-restored
node --test tests/restored-supplied-results.test.mjs
```

## Executed checks

Ten positive and35 negative cases pass through actual Node, browser-export and CDN validators. Boxscores10 positive/27 negative cases are reused. Full/sports fragments accept the mixed examples; base accepts election-only examples and rejects tournament. The initial authoring checkpoint's seconds-bearing positive and its sports-only rejection assumption were corrected as consumer fixture mistakes, not runtime defects.

Seventeen actual CDN DOM flows combine ten readers: Tournament, Election, Boxscores, Motorsport, Player and Ledger. Checks cover supplied outcomes/totals/percentages, true zero/unknown, stable tie sorting, independent local filters, native reset cancellation/newer input, reentrant getters, transferred collections, invalid replacement atomicity, safe literal text and maximum safe-integer display. Ordinary and nested-ShadowRoot same-turn removal/restoration permanently retire the previous owner; an explicit controller update creates a fresh one.

All226 predecessor definitions and128 predecessor node references remain identical. All141 prior renderer files are checked, with three explicit before/after deltas: node/style registration, locale registration, and the Player table-readability CSS successor. Three family renderer files are added. Shared ownership, generation and intent modules remain exact predecessor bytes. No local lifecycle implementation is copied into the consumer.

The safe lock checks934 permitted source/build files before and after execution;52 CDN assets pass bytes/SHA256/SRI. Runtime.styles, inline standalone and external CDN CSS include the exact supplied-results stylesheet. The deterministic standalone has3,944,781 bytes and is not stored as a preview. Zero external requests occurred.

The predecessor ca7d38c passed2435 full-suite cases but later had an independent election row-reference interruption failure. The final d1db55e source changes only `src/renderer/supplied-results.ts`, with224 other source files unchanged; `successor-source-proof.json` records that exact projection. The author reports102 domain passes and the original independent10/11 becoming11/11. This consumer does not transfer the predecessor full-suite result to the successor or claim native geometry/pixel acceptance. The inherited Player CSS readability change remains separately subject to actual geometry checks.

Current canonical inventory:123/256 implemented (53 historical functional acceptances,70 pending),128 not implemented and5 partial. Protocol130 is distinct. Both restored IDs were historical implementations; this work does not count them as first-time historical additions.
