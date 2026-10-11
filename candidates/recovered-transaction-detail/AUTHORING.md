# Write a short supplied transaction detail

Use one Finance-owned `ledger-transaction-detail` node. Keep the surface as name/amount → merchant/date/account/category → optional budget → related receipts. Do not wrap it in a generic dashboard card or invent extra summaries. The original host's mobile choice is explicit `mobile:true`; viewport width does not silently select it.

Start with `examples/receipt-detail.json`. Its data are synthetic. All displayed money, dates and account labels are supplied strings. Preserve zero, refund signs and unknown labels exactly. Do not derive budget progress from the displayed strings. IDs remain literal strings, including leading zeroes.

- Supply the accessible node `label` and each related `actionLabel`.
- `status` is `pending`, `resolved` (default), or `failed`. Pending uses the 360px loader. Missing data/failed status shows only an optional supplied `fallback`; otherwise the wrapper is hidden.
- Data includes `transactionId`, `name`, `amountLabel`, `maskedAmountLabel`, `merchant`, `dateLabel`, `account`, `category`, all eight `labels`, and `related` (0–40).
- Each related item includes unique `id`, name/date/amount/masked amount and action label. `pending:true` additionally requires `pendingLabel`.
- An optional budget includes `limitLabel`, finite `progressPct` 0–100 and a supported semantic color.
- Optional logos use safe supplied HTTP(S) or inline raster sources. Remote logos may make requests when mounted. Omit them for a strictly offline scene.
- Masking is display-only. It keeps progress geometry and the original document still contains raw labels. Omit secrets entirely when they must not be present.

Load `finance.schema.json` for structural authoring closure, then call the full runtime's `validateDocument`. Structural schema alone does not catch duplicate IDs, unsafe URLs or whitespace-only accessible labels. The executable negative cases demonstrate these boundaries.

Related-row activation emits cancelable `iui:transaction-detail`, with frozen `{componentId,transactionId}` only. The local consumer cancels it and displays its ID. Any real host operation needs its own authorization and implementation.

Renderer contributions must use the available common `RendererContext.lifecycle` resource/registration primitives, not private cleanup arrays. The current source deliberately does not advertise the lost `componentScope` or permanent ancestor observer as restored. Test the actual standalone/CDN CSS, event-constructor reentry, update/dispose and late resource acquisition; a source-only style assertion is insufficient.
