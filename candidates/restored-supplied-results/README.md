# Supplied tournament and election authoring checkpoint

Original, entirely fictional inputs for the restored historical `basketball-tournament` and `election-results` IDs. There is no real political data, electorate, live provider, forecast, targeting or persuasion. This is an authoring checkpoint; no new runtime lock or exact-runtime acceptance is claimed yet.

The sample keeps supplied facts independent: a tournament winner has the lower supplied score; later participants remain unknown; council totals, vote shares, reporting percentage and outcomes are intentionally not reconciled. Null means unknown, while0 is known zero. Candidate IDs are local to each contest; match IDs are unique across rounds. A progression pointer must name a match in a strictly later supplied round, without automatically populating that match.

Tournament limits:0–128 teams,0–12 rounds,0–32 matches per round, exactly2 participant slots per match. A slot has a supplied team or null and integer score0–1,000,000 or null. Winner is a known participant or explicit null. Status is supplied scheduled/live/final/postponed/cancelled/unknown.

Election limits:0–40 contests,0–50 candidates per contest. Votes and totals are explicit null or safe nonnegative integers up to9,007,199,254,740,991. Supplied shares/reporting percentages are null or numbers0–100. Contest status and each candidate's outcome are independent literal fields, not inferred from the counts. Candidate IDs may repeat across different contests.

Observation/start timestamps require real Gregorian dates and explicit offsets. Optional source links use safe absolute HTTP(S). No endpoint, SDK, prediction or provider operation is accepted. Filtering and sorting are local reader actions only.

The family has split subset ownership: tournament belongs to sports; election-results belongs to base. Do not move the election definition into sports merely because the renderer is shared. The final consumer will validate full and per-owner fragments, preserve the128 predecessor definitions, use shared exact-file/asset checks, and combine these two readers with Boxscores/Motorsport/Player/Ledger. DOM/static evidence will remain separate from native/pixel acceptance.

Run the current authoring-only checks:

```sh
node --test tests/restored-supplied-results.test.mjs
```
