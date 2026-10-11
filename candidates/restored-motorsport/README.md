# Restored motorsport authoring examples

Original synthetic examples for the historical canonical `f1-races` and `f1-standings` readers. The restored runtime uses the existing protocol: race weekends contain supplied session schedules/statuses; standings contain supplied driver/constructor snapshots. A schedule is not a live race-result service. This work does not claim new historical components.

The exact local runtime asset is `5efdc31a952f291263846cb4320a7890f3fe4b29`, source `98c179725872492de1724943270440728b98a838`. Its safe lock checks 898 permitted source/build files before and after execution, without requiring repository instructions or original Git history. Run the consumer and its nine host-only tests:

```sh
node candidates/restored-motorsport/verify.mjs --library /absolute/path/to/ui-motorsport-restored-integration
node --test tests/restored-motorsport.test.mjs
```

`examples/supplied-motorsport.json` is finite original data. `cases.mjs` supplies 10 positive and 26 negative cases, including exact semantic issue paths. `consumer.mjs` is an executable local host adapter: it cancels the session intent and writes a receipt into a separate output element. It performs no network call, booking, navigation or provider operation. No runtime or private reference is bundled.

## Authoring contract

`f1-races` requires `label` and `races` (0–80), with optional literal `description` and boolean `disabled`. Each race needs a unique ID, label, season1900–9999, round1–1000, circuit, location and0–20 sessions. Season/round pairs must be unique. Session IDs are unique within each race, not globally. Each session requires a label, kind, supplied status and `startsAt` as an explicit offset timestamp or null. Optional `endsAt` requires a real known start and a strictly later instant after offset normalization.

Kinds: practice, qualifying, sprint, race, other. Statuses: scheduled, complete, cancelled, postponed, unknown. Do not derive a status from today's clock, insert a timezone, or infer a start for a postponed/unknown session.

`f1-standings` requires label, season and0–100 standings. Each row requires a unique ID, label, driver/constructor kind, nullable supplied rank1–1000 and nullable supplied points from−1,000,000 to1,000,000. Optional wins are integer0–10,000 or null. Optional team, note, source and observation are supplied text/data. Tied ranks, fractional/negative points and constructor totals that differ from visible drivers are preserved; no scoring or tie-break rule is inferred.

Source URLs, if supplied, must be safe absolute HTTP(S). Observation/session timestamps must be real Gregorian offset timestamps. Numeric unknowns are explicit null, distinct from zero; number precision is ordinary JavaScript precision.

## Verified local behavior at this exact asset

- Combined query/season/kind/status filters preserve supplied statuses and offsets.
- `iui:motorsport-session` carries frozen `{componentId,raceId,sessionId}`; clear uses null race/session IDs. It is cancelable and local, with no automatic external operation.
- Selection survives local filters and native form reset; cancellation does not commit selection.
- Standings retain source-order ties and missing values last when sorting; displayed rank remains supplied.
- Native reset, reentrant input getters, constructor callbacks, moved rows and current-generation retirement use the shared runtime mechanisms.
- All 213 prior schema definitions and 124 prior node references remain identical. All 133 old renderer files are checked, with only three explicit changes: entry/style registration, locale registration, and the shared reset read-boundary successor. Three motorsport family files are new.
- The 52 CDN entries pass bytes/SHA256/SRI checks. Runtime.styles, standalone and external CDN CSS contain the exact motorsport stylesheet. DOM/static checks do not establish native or pixel acceptance.

Ten positive and 26 negative cases pass through actual Node, browser-export and CDN validators; the Player 10 positive/18 negative cases are reused. Twelve actual CDN DOM flows combine Motorsport, Player and Ledger readers with zero external requests. The standalone output is deterministic and remains in memory.

The runtime author separately reports 93 focused passes and an earlier 418-check affected suite. This consumer does not claim a new full-library run or native/pixel acceptance. Current canonical status is 119 implemented (53 historical functional acceptances plus 66 pending), 132 unimplemented and 5 partial, total 256. Protocol 126 is distinct. The two motorsport IDs are restored historical work, not new historical discoveries.

## Later-discovered boundary at this historical pin

An independent activation regression subsequently found that an accessibility getter can synchronously dispatch a second session click before the busy guard is set, causing two local intents at the frozen 126 asset. The original successful cases above do not cover that getter. The original pin and lock stay preserved; the combined Boxscores consumer includes the failing scenario for the next exact runtime successor. Until that successor is tested, do not describe this 126 pin as fully interruption-safe.
