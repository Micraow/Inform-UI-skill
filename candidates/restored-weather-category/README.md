# Supplied weather and local category review

Original synthetic fixtures for `weather-sidebar-title` (weather-owned) and `ledger-low-confidence-category-correction` (finance-owned). Both historical restorations are now source-build tested against exact `6b49ceb620cbc4f0af1c9fffab99fb93593499e8`.

The weather header accepts0–30 supplied places, each with a supported timezone, minute-precision offset observation or null, numeric temperature or null, explicit Celsius/Fahrenheit unit and supplied condition or null. The selected display unit can differ from the source unit. Zero Celsius is32 Fahrenheit;−40 has the same value in both scales. Unknown data stays unknown. This is local conversion of supplied snapshots, with no geolocation, search or live refresh.

Category review accepts a snapshot ID,0–40 supplied categories and0–60 transactions. Each transaction supplies nullable date, exact decimal-string money, nullable original/suggested category IDs and nullable confidence0–1. Suggestions and confidence are supplied facts; neither triggers automatic selection or categorization. Decimal strings are not parsed into floating-point money. All non-null category references resolve within the supplied list.

The review/confirm event is a local intent; it performs no bank write. The included JavaScript host adapter cancels `iui:ledger-category-correction` and writes a receipt outside renderer-owned content. It performs no account mutation, persistence or external call. The same original adapter is exercised against the actual built runtime below.

Six positive/18 negative documents cover true zero/unknown, exact money precision, reference and date defects, bounded collections and unsafe URLs. Run the current host checks:

```sh
node --test tests/restored-weather-category.test.mjs
```

The runtime uses its shared lifecycle/intent/reset handling. The consumer does not reproduce that protection in the example.

## Exact source-build consumer

```sh
node candidates/restored-weather-category/verify-source.mjs --library /path/to/exact-runtime
```

The selected lock covers 22 source/build files. Six positive and eighteen negative documents pass both Node and browser validators; all 254 non-Node definitions from the prior 136 remain equal. Eight actual DOM workflows cover unit conversion, timezone, unknown observations, precise money text, draft review and frozen canceled receipts, reset cancellation, safe updates and adapter disposal. One deterministic standalone artifact includes both complete family stylesheets. The standalone script is not executed. No external request, new CDN, native geometry or pixel acceptance is claimed.
