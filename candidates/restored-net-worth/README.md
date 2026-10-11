# Supplied net worth authoring draft

This original fixture is synthetic teaching data. It connects to no bank, account, provider, live feed or currency service. It is a fresh example for a restored existing component, not a recovered historical fixture.

- `currentValue`, `change` and `changePercent` are supplied facts. The example deliberately supplies 900 while its last observation is 120. Do not recompute the header from plotted points.
- A null observation is missing data; keep the line gap. Zero and negative values remain real observations. Null summary values stay unreported, never zero-filled.
- Dates are real Gregorian calendar dates, strictly increasing within each interval. Preserve elapsed-time spacing. Do not interpolate missing observations.
- All ranges are finite, supplied arrays. Changing an interval is local reading; it does not fetch or persist financial information.
- `masked` and `disabled` have separate roles. Do not promise keyboard or pointer behavior until the fixed renderer is actually tested.

`cases.mjs` contains five positive and twelve negative authoring cases. Draft-only: no runtime, CDN, standalone or native-browser acceptance is asserted here. The next consumer will lock one exact restored source/build before testing it.
