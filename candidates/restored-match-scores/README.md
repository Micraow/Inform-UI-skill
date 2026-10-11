# Three supplied match-score authoring examples

Original fictional data for `nba-scores`, `soccer-games` and `american-football-games`. All three are sports-owned. Source-build consumer checks are now fixed to `f4942414cbd5769b218daf08ea9343383967dd41`. This source-only133 checkpoint has no new CDN, standalone or full-library acceptance claim.

The shared contract requires a label, supported IANA timezone,0–100 supplied teams and0–100 supplied games. Each game provides its two different team references, competition, status, offset start time or null, score pair and explicit outcome. Scores are bounded integers0–1,000,000 or null. Status and clock are supplied labels, not a live feed or ticking timer. The timezone groups existing instants; it never invents an unknown start.

NBA periods and featured-player numbers remain separate from the game total. Soccer minutes are strings such as90+4; aggregate, penalties and event records are supplied independently. Football distinguishes quarter/overtime identifiers, possession, down/distance/ball position and scoring events. Do not assume a touchdown's supplied points, recompute a final score, or infer the winner. A quarter is numbered1–4; overtime has its own bounded numbering, and event period references must resolve within the same game.

Use explicit null for unknown data and0 for a known zero. IDs are unique within their declared collection; IDs may recur in another game. Event/leader/possession teams must be one of that game's participants. Safe source links are optional HTTP(S); no provider endpoint is accepted. No SDK, network feed, betting recommendation or external action is part of these examples.

Eight positive and21 negative documents pass through both exact Node and browser-export builds. Run the selected16-file source/build closure and host checks:

```sh
node candidates/restored-match-scores/verify-source.mjs --library /absolute/path/to/ui-match-scores-restored
node --test tests/restored-match-scores.test.mjs
```

Seven actual browser-export DOM checks cover all three score boards, supplied timezone grouping, soccer event filtering, football independent points/null possession, canceled reset/newer input, atomic invalid replacement/literal text and disposal. All234 predecessor definitions and130 node references remain unchanged. Full/sports schema validation and exact runtime.styles/dist CSS closure pass. No external request occurred.

`source-build-lock.safe.json` deliberately identifies a selected16-file source/build closure, not a complete source archive or CDN package. Original commit/tree are provenance; the verifier checks permitted local file bytes. The author separately reports35 focused checks and independent QA13; these do not imply native geometry or full-suite acceptance.

The historical130 CDN consumer lock stays unchanged. The next unified runtime asset can consume these same fixtures once, without producing an intermediate CDN copy just for this source checkpoint. Canonical implementation progress at133 is126/256 (historical functional acceptance remains53); the three IDs restore previously implemented work.
