# Original supplied numeric scorecard consumer

The fictional fixture supplies already-assessed numeric component ratings for the
explicit `gcs-six-motor-levels` version and `adult` population. It contains no
patient information. This consumer checks software arithmetic and local interaction,
not assessment competence or clinical validity.

The conventional ranges are E1–4, V1–5 and M1–6. The explicit 120 numeric vectors
cover every combination and retain all three supplied components. Additional
cases separate invalid input, unsupported version/population, NT and missing data.
No unavailable component is treated as 0/1, and no non-calculated result exposes
a total. Numeric strings are not coerced into numbers. The chosen six-level motor
variant is not described as the five-level 1974 original.

The UI fixture adds original information tabs, literal notes, selected-rating help,
one segmented rating control, native selects and an independent Reset baseline.
It exercises live and explicitly on-demand results, cancelable local summary
requests, guarded keyboard navigation, phase/fallback changes and disposal.
Copy summary is a host intent: the test blocks actual clipboard writes and services.
The actual compiled offline page is executed using the same supplied example.

```sh
node --max-old-space-size=768 candidates/gcs-scorecard/verify-source.mjs --library /path/to/exact-source-build
node --test tests/gcs-scorecard.test.mjs
```

Use the exact source-build lock. Its 215 registered nodes and 209 candidate inventory
are separate measures; no new 52-asset CDN or native-browser result is claimed.
The published 214/fed5 asset lock remains unchanged.

## Verified software result

Exact source `901406db5d3a02c2dffa069c670e983076502096` passes 143 arithmetic
checks (including all 120 numeric triplets), 10 accepted/14 rejected documents,
and seven actual DOM/compiled-standalone flows. All 45 locked leaves, 386 prior
non-Node definitions and the runtime stylesheet are checked. Resource requests
and external service calls are zero. See [the execution receipt](consumer-result.json).

## Source and content boundaries

Numeric ranges/version history are checked against the [official structured
approach](https://www.glasgowcomascale.org/gcs-aid/); component/NT handling is
checked against the [official FAQ](https://www.glasgowcomascale.org/faq/).
The [permissions page](https://www.glasgowcomascale.org/permissions/) describes
clinical/research use; this consumer does not represent it as an MIT grant for
the official assessment aid or translated response descriptions.

Only original fixture prose and numeric facts are included. No official aid chart,
illustration, examination instructions or response-description table is copied.
There is no pediatric score conversion, GCS-P extension, severity classification,
prognosis, airway/treatment rule, or inference from symptoms, voice or images.
Software tests do not validate a clinical use or supply rights to third-party material.

## Verified source publication

The matching original source is public at [c138b93b](https://github.com/Micraow/Inform-UI/commit/c138b93b745990c02ec41d7b924cb615d80ed172).
[Source identity](source-public.json) verifies 41 source leaves, five actual remote
text payloads and unchanged 54 prior CDN leaves. The current source lock records
this public commit. The execution receipt retains its original pre-publication
metadata; its source and asset hashes have not changed. This is a source release;
public 214/fed5 assets do not contain this component.
