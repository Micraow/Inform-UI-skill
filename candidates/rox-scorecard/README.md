# Explicit-unit ROX arithmetic consumer

This example is entirely fictional. It exercises a caller-supplied numerical
record through the exact original software implementation. It is not a patient
record, measurement tool or clinically validated calculator.

Use source `8834c693d1d54772fad62883f8781f064fa4107c` with the
[45-file source-build lock](runtime-lock.safe.json). Its 216 registered nodes
and 210 implemented-at-freeze inventory are separate measures. The published
214/fed5 asset is unchanged and does not contain this candidate.

## Input and interaction contract

SpO2 is a percent. FiO2 has an explicit fraction or percent unit, converted once.
Respiratory rate is per minute. The example gives 90 / 0.5 / 20 = 9.0; its independent
Reset baseline gives 95 / 1 / 40 = 2.375, displayed as 2.4. An input of 0.5 percent
means 0.005, not 0.5. Unit choice is never inferred from a value's magnitude.

Blank/null values are incomplete; true zero SpO2 remains zero. Malformed values,
zero denominators and overflow produce explicit non-calculated outcomes. The
string NT is invalid numerical input, not a replacement measurement. No previous
result remains visible after its inputs become invalid or incomplete.

An optional study comparison requires the caller's explicit context confirmation,
the selected study version and exactly 2, 6 or 12 supplied hours since HFNC initiation.
The software neither infers those conditions nor rounds time to the nearest study
point. Comparisons use the unrounded arithmetic value: 4.879 and 4.881 both display
as 4.9 but fall on opposite sides of 4.88. Display wording is a neutral numerical
comparison, without diagnosis, certainty or a treatment instruction.

The original fixture also covers literal information tabs and notes, independent
defaults, live editing, guarded RTL/IME keyboard handling, cancellation and newer
input during Reset. Copy summary dispatches a frozen local host request; it never
writes to a clipboard or contacts an external service.

## Reproduce the software check

```sh
node --max-old-space-size=768 candidates/rox-scorecard/verify-source.mjs --library /path/to/exact-source-build
node --test tests/rox-scorecard.test.mjs
```

The [actual execution receipt](consumer-result.json) records 40 arithmetic checks
(including 30 original JSON vectors), 10 accepted/12 rejected documents and five
actual DOM/compiled-standalone flows. All 45 locked files, 388 prior definitions
and the stylesheet match. Resource requests and service calls are zero. This
consumer did not run a native browser or perform clinical validation.

## Primary sources and reuse boundary

The [2019 validation abstract](https://academic.oup.com/ajrccm/article-abstract/199/11/1368/8497973)
identifies the pneumonia/HFNC study and time-specific numerical boundaries.
The [unit analysis](https://academic.oup.com/ajrccm/article/200/1/115/8496774)
and [authors' reply](https://academic.oup.com/ajrccm/article/200/1/117/8496761)
provide context for the ratio and its limitations. These are study-specific facts,
not a universal current clinical guideline.

Only original code, synthetic examples and independently expressed facts are
included. No article text, figure, captured implementation or treatment narrative
is copied. Open access is not represented as a grant to redistribute an article
under this repository's MIT license. Calling software remains responsible for its
own suitability and validation; that responsibility does not itself establish
clinical safety or third-party content rights.
