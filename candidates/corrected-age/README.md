# Original corrected-date arithmetic consumer

This source-build consumer uses two fictional records with identical dates under
different explicitly supplied bases. Both produce 56 corrected days from a 96-day
chronological interval and 40-day correction. No current date is inferred.

This is a software arithmetic and UI contract check. It does not establish clinical
validity, provide a developmental assessment, choose medicine or vaccination timing,
or make a treatment recommendation. The examples contain no patient data.

## Fixed consumer result

Exact source `371074e4e5358a0c0e4020240b7c3c4a3e98b8e3` passed eight positive
and eight negative documents and seven actual DOM workflows, including the real
compiled standalone page. Its 51-file safe lock and 384 preserved definition hashes
were checked against the supplied immutable read-point.
[The result](consumer-result.json) records zero resource and service requests.

The a6 predecessor passed six ordinary workflows but failed the later-input
Reset-handler assertion. The same assertion now passes; its old lock, old consumer
result and [before/after receipt](successor.json) are retained. The earlier 508
hidden-focus issue is also covered by this final consumer. These are software
results, not clinical validation, native execution by this consumer, or a new CDN release.

## Input and output boundaries

- The protocol is `calculator-corrected-adjusted-age-of-preterm-infants`.
  Supply a label and optional initial draft. Empty/null or malformed date and unit
  values within the structural schema produce explicit unavailable/invalid outcomes.
  Unknown basis enums and wrongly typed fields are schema failures.
- Dates are strict Gregorian civil dates in the library's documented input range.
  Unit strings are explicit completed weeks plus remaining days. Blank never means zero.
- Calculated outputs use integer days and complete weeks with a remainder.
  They do not turn four weeks into a calendar month.
- Before the supplied/arithmetic due date, only that date and days remaining are
  returned. Past the product's second-anniversary window, only its end date and a
  reason are returned. Neither case exposes an age result.
- The Feb29-to-Feb28 anniversary rule is a documented software convention.
  Product bounds are not advice to stop follow-up.
- Calculate and Reset are local cancelable intents. Host event handlers control
  their own privacy obligations. No lookup, persistence or external service is used.

## Original tests

Eight accepted document structures and eight rejected document structures are
checked against the actual runtime. Accepted structure does not mean the supplied
values produce an age: missing, invalid and unsupported outcomes are deliberate cases.

The actual DOM flows exercise equivalent bases; unknown/invalid/unsupported
inputs; before-due and leap-anniversary outputs; canceled Calculate and Reset;
newer input after native reset; focused fields hidden by accepted reset; disabled
and replaced/disposed views; and input dispatched by a host intent handler.
The compiler's real offline HTML is executed for both fictional records.

The verifier checks every locked source/build file before and after execution,
the 384 previous definition hashes and prior node order, and full embedded style
equality with the actual dist CSS. The 214 registered nodes are not a completed
component count. The published933 CDN and older locks remain independent.

```sh
node candidates/corrected-age/verify-source.mjs --library /path/to/exact-runtime
node --test tests/corrected-age.test.mjs
```

No runtime build, dependency installation, bundled runtime copy or network access
is needed. Use the exact supplied read-point with its existing dependencies.

## Evidence basis

The arithmetic reference is the [AAP explanation updated2018-12-10](https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx).
The product's follow-up window is informed by [NICE NG72 recommendations](https://www.nice.org.uk/guidance/ng72/chapter/recommendations);
the preterm applicability definition is described by [WHO](https://www.who.int/news-room/fact-sheets/detail/preterm-birth).
Only bibliographic links and original explanatory wording are supplied here.
Source article text, figures, questionnaires and captured implementations are not included.
These references do not constitute clinical validation or an endorsement of this library.
