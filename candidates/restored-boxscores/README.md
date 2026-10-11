# Supplied boxscore authoring checkpoint

Original finite fixtures for the restored historical IDs `nba-game-boxscore` and `cricket-match-boxscore`. This checkpoint prepares authoring data and negative cases while the runtime is being frozen. It contains no new runtime lock or runtime acceptance claim.

`examples/supplied-boxscores.json` deliberately separates source facts: a basketball team score does not equal the listed players; a period can be zero or unknown; cricket overs are text; strike rate and economy are supplied independently. These fictional values must not be rewritten to satisfy an assumed league rule.

`cases.mjs` defines 10 positive and 27 negative documents. Host-only tests check immutable fixtures and exact negative locations; the final runtime will validate these through its Node, browser-export and CDN entry points.

## Short authoring contract

Both nodes require a label, supplied status and exactly two teams. Status is scheduled, live, final, postponed, cancelled or unknown. “Live” is an input label, not evidence of a live feed. Optional observation must be a real Gregorian timestamp with an explicit offset. Optional source URLs are safe absolute HTTP(S).

Basketball requires supplied team scores, 0–40 player rows per team and 0–20 periods. Every period has exactly two score values. Player rows require unique local IDs, labels, nullable starter flags, nullable minutes text, nullable count columns and nullable integer plus/minus. Scores/counts are0–1,000,000; plus/minus is−1,000,000–1,000,000. Optional shot summaries are text, not numerator/denominator models.

Cricket requires 0–12 innings referencing one supplied team. Each innings supplies runs, wickets, overs text, extras and0–30 batting/bowling rows. Counts and supplied rate numbers use the bounded schema. Null is explicit unknown; zero is known zero. No ten-wicket assumption, overs-to-balls conversion, strike-rate/economy calculation, total reconciliation or winner inference is performed.

IDs are unique within each collection; the same player ID can occur in another team or in batting and bowling. Source order is preserved unless the reader explicitly sorts. Numeric ties retain source order and unknowns sort last. Details stay attached to their supplied row.

Use the runtime controller for snapshot replacement, and its shared reader lifecycle/reset mechanisms for implementation. These readers have local filtering/sorting only, no selection event or provider operation. Native reset interruption, transferred tables, reentrant getters and actual asset/CSS closure will be tested at the final pin. DOM checks remain distinct from native/pixel acceptance.
