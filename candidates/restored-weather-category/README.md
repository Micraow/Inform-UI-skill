# Supplied weather and local category-review draft

Original synthetic fixtures for `weather-sidebar-title` (weather-owned) and `ledger-low-confidence-category-correction` (finance-owned). This prepares the next two historical restorations; no exact runtime or new asset acceptance is claimed yet.

The weather header accepts0–30 supplied places, each with a supported timezone, minute-precision offset observation or null, numeric temperature or null, explicit Celsius/Fahrenheit unit and supplied condition or null. The selected display unit can differ from the source unit. Zero Celsius is32 Fahrenheit;−40 has the same value in both scales. Unknown data stays unknown. This is local conversion of supplied snapshots, with no geolocation, search or live refresh.

Category review accepts a snapshot ID,0–40 supplied categories and0–60 transactions. Each transaction supplies nullable date, exact decimal-string money, nullable original/suggested category IDs and nullable confidence0–1. Suggestions and confidence are supplied facts; neither triggers automatic selection or categorization. Decimal strings are not parsed into floating-point money. All non-null category references resolve within the supplied list.

The eventual review/confirm event is a local intent, not a bank write. The included JavaScript host adapter cancels `iui:ledger-category-correction` and writes a receipt outside renderer-owned content. It performs no account mutation, persistence or external call. This adapter's host-only release test is not runtime acceptance.

Six positive/18 negative documents cover true zero/unknown, exact money precision, reference and date defects, bounded collections and unsafe URLs. Run the current host checks:

```sh
node --test tests/restored-weather-category.test.mjs
```

The author will attach shared lifecycle/intent/reset handling in the runtime. Consumer tests will wait for that exact source/asset and keep native geometry separate.
