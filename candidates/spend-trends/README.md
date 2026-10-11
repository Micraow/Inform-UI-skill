# Original supplied monthly spending trends

This consumer locks source `7094076e383c1cd062eaefaa87601801bec4ed2c` separately from all historical CDN assets. The three teaching months, reference series and amounts are entirely fictional. The example uses the original data from `spend-series-completion-draft`; no private reference capture or real financial record is included.

```sh
node candidates/spend-trends/verify-source.mjs --library /path/to/matching-library
node --test tests/spend-trends.test.mjs
```

## Authoring contract

Keep the required legacy `label`, `periodLabel`, `totalLabel` and `categories` fields; use `categories:[]` for a trend-only view. `months` is ordered newest to oldest. Each record explicitly supplies an ID, label, numeric-or-null total, total display label, month length and ordered daily observations. A point's value and label are independent supplied data. Do not accumulate points to invent a total or infer an average.

The current teaching month displays `777 supplied credits` while its last observed point is42. The historical months display1200 and900 despite different point values. True zero, negative observations, null gaps and unequal day intervals remain distinct. Current months explicitly provide `daysElapsed`; future observations are unavailable. `selectedMonth` references a supplied ID. Previous comparison means the next supplied month, with `previousSeries` as the oldest month's fallback. Average comparison requires an explicit `averageSeries`. A month cannot compare with itself.

For the current summary, comparison uses only the reference point whose day exactly equals `daysElapsed`. Missing matching days stay unknown. Historical comparison uses the supplied reference total. The library may display the numeric difference, rounded to two decimals, but does not infer currency or recalculate supplied totals or labels. Changing either control clears point inspection.

Unmodified Left/Right/Home/End inspect daily positions; Escape restores the month summary. Modified, canceled and IME navigation remains host-owned. The pointer follows actual day spacing, including gaps. Masking hides known amounts, differences and numeric chart geometry. Canceled native reset preserves selections; accepted reset restores supplied defaults; newer local input takes precedence.

## Executed evidence

Both actual Node/browser validators run10 positive/20 negative new cases plus6/20 legacy Finance documents. The selected finance schema is checked too. Nine DOM/compiler workflows cover independent summary labels, exact-day comparisons, self-comparison exclusion, null curve breaks, true zero and negative inspection, current-day limits, modified navigation, masking, container575/576, native reset ordering, invalid-update atomicity and legacy compatibility.

The verifier locks21 safe source/build files before and after execution, preserves299 prior definitions with only the eleven declared node additions projected out, adds precisely `SpendTrendPoint`/`SpendTrendSeries`, and retains154 registered nodes. Both runtime CSS exports equal the actual standalone compiled style body. External requests are blocked and the executed count is zero.

Independent functional review subsequently confirmed this completion. The current live inventory is147 implemented,1 partial and108 missing; this source's own frozen progress file and old CDN accounting are not rewritten. Native interaction, curve rendering and reference-pixel fidelity remain pending. Synthetic SVG/DOM measurements do not establish browser geometry or visual acceptance, and the compiled HTML script itself is not executed here.
