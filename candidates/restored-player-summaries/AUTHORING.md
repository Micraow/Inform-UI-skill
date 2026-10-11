# Author supplied player snapshots

Use `nba-player-summary` or `tennis-player-summary` when the source already supplies the player, period, scope and every numeric value. Each requires `label`, `player`, and finite `records` (0–100). Give each record a unique ID. Repeated period labels are valid. The short complete examples are in `examples/supplied-players.json`.

- NBA: supply `id`, `season`, nullable `team`, `scope`, `games`, `minutesPerGame`, `pointsPerGame`, `reboundsPerGame`, and `assistsPerGame`.
- Tennis: supply `id`, `season`, `surface`, `matches`, `wins`, `losses`, `titles`, and `rank`.
- Required numeric fields accept a supplied number or explicit `null`. Zero means supplied zero. Omitting a field does not mean unknown.
- Counts are integers0–1,000,000. Per-game values are0–10,000. Rank is1–1,000,000 or null. JavaScript number precision applies; this is not exact decimal money.
- Do not divide totals, infer a team, rank a player, reconcile tennis totals, or invent a season from a label. Separate supplied scopes can legitimately disagree.
- Optional observation timestamps require a real Gregorian date and explicit offset. Optional root/record sources use safe absolute HTTP(S) URLs and load only on activation.
- Use literal text for names, descriptions, notes and periods. Text is not executable HTML. There are no endpoint, callback, provider, media or bound-state fields.

Local search, supplied-period and scope/surface filters combine. Sorting preserves ties and unknowns last; tennis rank sorts ascending. Period-label sorting is text order, not chronology. Native details retain disclosure when rows move. Tables keep their semantic structure inside a horizontal scroller; no mobile layout or pixel fidelity is inferred from DOM tests.

Reader fields are unnamed and do not enter authored Forms values. Parent-form reset cancellation and newer edits are respected. Moved controls/rows are not reclaimed. Updates must go through the runtime controller, so invalid snapshots are rejected atomically and newer generations retire old handlers. Use the runtime's shared lifecycle/reset helpers when implementing a reader; consumer examples must not duplicate their listener or cancellation machinery.

Supply data from your own source before mounting. These original fixtures are fictional and perform no lookup, financial operation or model call. Browser/pixel acceptance remains separate from validation, source identity and actual CDN DOM behavior.
