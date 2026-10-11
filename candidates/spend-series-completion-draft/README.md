# Original monthly spending-series teaching data

This is neutral fixture data, not a new schema or an accepted runtime API. `fixtures.mjs` supplies three fictional months, a separate average series and explicit previous-period series. These do not represent anyone's finances. The amounts, header totals and display labels are supplied independently; the fixture performs no aggregation or inference.

Current and historical periods are explicit. Observations use unequal day intervals, real zero, negative values and null gaps. Current-period future slots are separately marked and remain null. The selected month is excluded from selectable month comparisons; previous and average reference choices remain available. Average values are independently supplied rather than calculated from the three example months.

Once the runtime writer freezes its supported contract, map only these data into that contract and run actual validation and DOM/compiler consumers. The fixture tests below establish data/oracle properties only, with no source, CDN, native, curve-shape or canonical-coverage acceptance.

```sh
node --test tests/spend-series-completion-draft.test.mjs
```
