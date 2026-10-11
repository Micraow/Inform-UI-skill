# Supplied net worth source consumer

This original fixture is synthetic teaching data. It connects to no bank, account, provider, live feed or currency service. It is a fresh example for a restored existing component, not a recovered historical fixture.

- `currentValue`, `change` and `changePercent` are supplied facts. The example deliberately supplies 900 while its last observation is 120. Do not recompute the header from plotted points.
- A null observation is missing data; keep the line gap. Zero and negative values remain real observations. Null summary values stay unreported, never zero-filled.
- Dates are real Gregorian calendar dates, strictly increasing within each interval. Preserve elapsed-time spacing. Do not interpolate missing observations.
- All ranges are finite, supplied arrays. Changing an interval is local reading; it does not fetch or persist financial information.
- `masked` and `disabled` have separate roles. The consumer checks header masking and disabled inspection/range controls; it does not treat a client-rendered mask as data encryption.

`cases.mjs` contains five positive and twelve negative authoring cases, checked by both actual Node and browser validators at exact source/build `b7adf9469994524366913e68e9d42ea063284885`.

```sh
node candidates/restored-net-worth/verify-source.mjs --library /path/to/exact-runtime
```

The selected lock covers 15 source/build inputs. Seven actual DOM workflows preserve supplied current/change values, null line gaps, true zero, inspection/escape, local interval selection, canceled clicks, masked/disabled controls, atomic invalid updates and literal copy. All 259 previous non-Node definitions are equal. One deterministic standalone HTML artifact includes the entire family stylesheet; its script is not executed here. No CDN, native layout or pixel acceptance is added.

Known limitation of this exact historical restoration: independent QA confirmed that Ctrl+Home still inspects an observation. Modifier/IME navigation isolation is awaiting a small runtime successor. The ordinary-key checks above do not close that separate keyboard contract.
