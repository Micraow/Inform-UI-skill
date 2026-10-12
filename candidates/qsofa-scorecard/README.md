# Explicit-version qSOFA software consumer

The measurements in this example are fictional. They exercise numerical software
rules and local UI behavior. They are not a patient record or a clinical assessment.

Use source `09475c7b899dc1eb2e46c8f59f8ed45d2afd99b6` with the
[47-file source-build lock](runtime-lock.safe.json). Its 217 protocol nodes and
211 implemented-at-freeze inventory are separate counts. The public 214/fed5
asset package does not contain this component.

## Rule and input contract

The explicit version is `qsofa-sepsis3-2016-consensus`, with population `adult`.
The three independently supplied criteria contribute zero or one point each:
respiratory rate at least 22 breaths/minute, systolic pressure at most 100 mmHg,
and altered mentation. The last criterion has two mutually exclusive input modes:
a caller-supplied boolean assessment, or a supplied integer GCS total from 3 to 15.
The consensus GCS criterion is below 15. GCS14 contributes one point; this is not
the derivation model's different GCS threshold of 13 or below.

No mentation mode or infection status is inferred. Unknown/null and NT GCS prevent
a complete total, and no partial total is shown. Invalid input takes precedence
over unsupported context and incomplete input. Extra properties from the other
mentation mode are invalid, even if null. Numerical GCS strings are not coerced.
Measurement inputs accept nonnegative finite values or ordinary decimal strings;
blank values are missing, while negative values, exponents, whitespace and booleans
are invalid. Mathematical handling of zero does not establish physiological plausibility.

The initial example totals 1. Its independent Reset baseline totals 2. Live edits,
explicit modes, literal information tabs and notes, canceled host requests, newer
input during reset and hidden-input focus recovery are exercised. Copy summary
emits a frozen local request. The consumer never writes to a clipboard or invokes
an external service.

## Reproduce

```sh
node --max-old-space-size=768 candidates/qsofa-scorecard/verify-source.mjs --library /path/to/exact-source-build
node --test tests/qsofa-scorecard.test.mjs
```

The [execution receipt](consumer-result.json) records 49 arithmetic checks (23
original JSON vectors), 10 accepted/14 rejected documents and five actual
DOM/compiled-standalone flows. All 47 locked files and 390 prior definitions
match; runtime styles equal the standalone stylesheet. Resource requests and
service calls are zero. This consumer did not run a native browser or validate
clinical performance.

## Sources and limits

The [2016 Sepsis-3 consensus](https://jamanetwork.com/journals/jama/fullarticle/2492881)
describes the adult suspected-infection context and distinguishes its practical
GCS criterion from the derivation model. The
[2026 Surviving Sepsis Campaign guidance](https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026)
continues to prefer other approaches over qSOFA alone for sepsis screening.
This component records explicitly supplied numerical criteria; it does not diagnose
or exclude sepsis, choose treatment, or establish applicability for a patient.

Code, fixtures and explanations here are original. Source articles and tables are
linked for verification and are not reproduced or represented as MIT-licensed.
Software test success is not clinical validation.
