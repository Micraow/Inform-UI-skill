# Original supplied weather views

Exact navigation successor `0530db4b7748dae637398f5b57840066b79a3e9d` passes11 positive/16 negative documents,8 DOM/standalone workflows and20 selected source/build hashes. Of330 prior non-Node definitions,329 are unchanged; WeatherNode differs only by the explicitly listed optional additions, whose removal exactly restores its historical definition hash. There is no new node registration: protocol178 is unchanged.

The [original fixture](examples/original-weather.json) is a fictional station with synthetic observations. It uses an actual IANA timezone to distinguish repeated DST clock times, but supplies no live weather, user location or personal data. Source provenance is explicitly synthetic.

## Preserve the original snapshot

The original required fields remain `location`, `updatedAt`, `source`, `units`, `current`, `daily` and `hourly`. Loading/error still require that snapshot structure. Missing temperature/probability values use null; true0 is valid. Source temperature units are explicit, and every conversion starts from original numbers. Omitting new presentation options preserves the former current-observation headline and chart defaults.

Optional `presentation` selects chart/table/compact. `initialUnit` and `initialMetric` choose only display state. Explicit `useCurrent` allows date selection to switch between current observation and that day's supplied forecast. Localized labels and paired Celsius/Fahrenheit text are complete supplied display strings; they never redefine numerical chart geometry. Unknown data is not replaced with0.

`chartWindow:{points,startTime?}` selects a finite1–48 sample slice at a supplied instant. It can cross midnight; the table still contains every row in the selected local date. Original offset-bearing timestamps preserve DST repeated hours and actual elapsed-time spacing. Null breaks the line. Zero precipitation remains a zero-height numeric bar.

## Local requests and reset

Share/location controls need explicit `available:true`. Capability flags allow a local request; they are not browser permission grants or evidence of a completed service. Top-level/day-specific follow-ups are supplied queries with unique IDs. Only the first3 exist; the component's own measured width shows1/2/3 at380/576 boundaries. Selecting a date replaces the question group without leaking a prior date's questions.

The [host adapter](consumer.mjs) cancels frozen `iui:weather-action` details. They identify share, request-location or follow-up plus date, displayed unit and metric. Follow-up adds its supplied ID/query. Accepted events change only a local receipt. No weather fetch, browser location, native share, clipboard, account or telemetry is called.

Visible local reset and native form reset restore initial date/unit/metric/view/headline/question state. Canceled reset retains choices; newer input wins queued reconciliation. The reset remains usable when share/location are unavailable and the date picker is hidden. Compact mode has no actionable controls. Invalid replacement is atomic, and update/dispose retire former controls and queued work.

The originalf996 source failed two retained navigation controls: date Ctrl+End changed the selected date, and chart composing-Home changed readout. Both exact assertions pass on0530. Ordinary navigation and hidden-chart input are tested separately. The previous source's passing ordinary flows were not relabeled as a complete pass.

```sh
node --test tests/weather-supplied.test.mjs
node candidates/weather-supplied/verify-source.mjs --library /path/to/exact/source-built-runtime
```

The compiled standalone script actually converts supplied units and cancels a local request in JSDOM. Both validators, the Weather closure and actual stylesheet equality are checked. External requests and location/share/clipboard/service probes are0. Synthetic geometry and JSDOM do not establish native browser/CSP/pixel acceptance. The old164/CDN locks remain immutable.
