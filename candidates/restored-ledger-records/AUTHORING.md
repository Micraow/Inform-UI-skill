# Finite ledger snapshots

Use `ledger-accounts` with `label` and `accounts` (0–40). Each account needs `id,label,institution,kind,status`; balance, suffix, observedAt, note and source are optional. Kind: cash/credit/investment/loan/other/unknown. Status: active/closed/unknown. IDs start with a letter or underscore and contain only letters, digits, underscores, dots or hyphens. A suffix is 1–4 alphanumeric characters, never a full account number.

Use `ledger-recurring-transactions` with `label` and `records` (0–60). Each record needs `id,label,cadence,status,direction`. Cadence: weekly/monthly/yearly/other/unknown. Status: scheduled/paused/unknown. Direction: incoming/outgoing/unknown. Optional `initialReviewedIds` must be unique IDs in the supplied records. Real Gregorian `nextDate` and offset `observedAt` values are supplied facts, never calculated from the clock.

Money is exactly `{amount,currency}`: amount is null or a signed decimal string with at most 18 whole and 18 fractional digits; currency is a supplied uppercase three-letter label. Keep trailing zeros and negative zero. Do not turn it into a JavaScript number. Missing money, null amount and known zero are distinct. The renderer neither totals different currencies nor infers financial direction from the sign.

Accounts start visually concealed unless `initiallyRevealed:true`; source data is still in page memory and notes are not redacted. Never use this as a privacy barrier. Filters affect local visibility only. Reset clears filters while keeping reveal, disclosures and reviewed marks. No provider lookup, balance refresh, payment, cancellation or recurring-date engine is available.

`iui:recurring-review` provides frozen `{componentId,recordId,reviewed}`. It bubbles, is cancelable and is not composed. Without cancellation only the local reviewed mark changes; cancellation preserves it. The original host example cancels and displays a literal ID receipt. It never acknowledges a payment or forwards account data.

Both nodes are Finance-owned. Use the finance subset or full schema plus `validateDocument` for date, unique-ID and supplied-review-reference semantics. Replace supplied snapshots with `controller.update`; invalid updates preserve the current view. Dispose host listeners with the controller. The runtime uses shared generation boundaries, so authors should not duplicate renderer cleanup or scheduling machinery.
