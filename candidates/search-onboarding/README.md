# Original supplied Search consumer

Source/build `c900bd3599ff9ba9b268c17411fcd7f46e5dcdd3` (tree `fb0534cd02756158af64c05f6755684a0e750817`) adds `conversational-onboarding-search`, registration179. This candidate leaves every older source/CDN lock unchanged.

## Run

Use Node22 or newer and the exact Inform UI source build with its normal dependencies:

```sh
node candidates/search-onboarding/verify-source.mjs --library /path/to/exact-runtime
node --test tests/search-onboarding.test.mjs
```

The safe lock checks22 selected source/build files without copying runtime code or requiring Git metadata. It excludes internal guidance and private materials. The fixture reuses this repository's original synthetic Weather generator, adds a fictional Pattern Index and four fictional notices with an original2×2 blue/gold raster.

## Authoring

Resolved data requires all three supplied views, each with a visible label and question. `weather.snapshot` is a full Weather node; `stock.snapshot` is a full FinanceChart node. Their existing semantics still apply, including explicit offset timestamps, increasing history and valid ranges. Parent Search hides Weather sharing. Selecting another tab remounts its content; it is not a persistence container.

News has at most30 items and50 summaries. Every `{text,sourceId}` citation refers to a distinct supplied item `{id,title,url,sourceLabel,dateLabel?,imageSrc?,faviconSrc?}`. Use safe URLs and explicit media only. Inline raster media can be assigned immediately. External images require the local load control before source assignment, and that control does not open the article.

`iui:search-open` is a frozen, bubbling, cancelable, non-composed request `{id,itemId,url}`. The stock provenance link uses `itemId:"stock-source"`. The included `attachSearchReceipt` adapter records and cancels these requests; accepting the event still does not navigate or contact a provider. `iui:onboarding-tab` retains the shared cancelable tab contract. Pending/failed stubs may omit the three snapshots; a failed fallback is literal text.

All financial data here is synthetic teaching data, not personal finances or investment guidance. Current value900 is intentionally independent of the last graph point20. Prior close0 cannot define a percentage. A missing observation stays null, not0. The Weather examples retain distinct offset instants through DST.

## Verified scope

-10 positive and16 negative documents through both actual Node/browser validators and the selected Learning schema
-330 old non-Node definitions and all old node alternatives preserved; exactly one new definition/registration
-7 actual DOM/standalone groups, including weather units, finance zero/null/ranges and unequal elapsed spacing, canceled citations, image consent/release, tab keyboard behavior and reset/new-input precedence
-Window resize and nested Weather End after pending parent reset pass on this successor. The same original fixture reproduces both predecessorc979 failures; those logs remain separate.
-Actual compiled script executes all three views and a canceled citation. Its CSS equals both runtime exports and the standalone stylesheet.
-0 external requests and0 provider/location/navigation calls observed

Rail geometry in the test is explicitly supplied to JSDOM. This establishes local scroll logic, not native layout or pixels. Image decoding, real browser/CSP enforcement, current weather, live market data and external search are not claimed. The frozen164 CDN remains a separate historical asset. Canonical accounting is promoted only in the separately reviewed current-scope record.
