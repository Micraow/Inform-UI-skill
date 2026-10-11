# Three supplied match-score authoring examples

Original fictional data for `nba-scores`, `soccer-games` and `american-football-games`. All three are sports-owned. This checkpoint has no runtime lock or actual-runtime acceptance claim; it prepares the complete family while its restoration is finalized.

The shared contract requires a label, supported IANA timezone,0–100 supplied teams and0–100 supplied games. Each game provides its two different team references, competition, status, offset start time or null, score pair and explicit outcome. Scores are bounded integers0–1,000,000 or null. Status and clock are supplied labels, not a live feed or ticking timer. The timezone groups existing instants; it never invents an unknown start.

NBA periods and featured-player numbers remain separate from the game total. Soccer minutes are strings such as90+4; aggregate, penalties and event records are supplied independently. Football distinguishes quarter/overtime identifiers, possession, down/distance/ball position and scoring events. Do not assume a touchdown's supplied points, recompute a final score, or infer the winner. A quarter is numbered1–4; overtime has its own bounded numbering, and event period references must resolve within the same game.

Use explicit null for unknown data and0 for a known zero. IDs are unique within their declared collection; IDs may recur in another game. Event/leader/possession teams must be one of that game's participants. Safe source links are optional HTTP(S); no provider endpoint is accepted. No SDK, network feed, betting recommendation or external action is part of these examples.

Eight positive and21 negative documents cover the family. Current checks are host-only:

```sh
node --test tests/restored-match-scores.test.mjs
```

Exact Node/browser/CDN, shared-reader reset and local event-filter checks will be added against the author's single frozen asset. Reuse the shared consumer/lifecycle helpers, keep previous locks immutable, and report native geometry independently.
