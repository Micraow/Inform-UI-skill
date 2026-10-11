# Original supplied Lottie examples

The included generator creates a two-second blue rounded rectangle animation and an orange PNG entirely from local JavaScript. No capture, downloaded animation, external font, or network asset is included. `source` is finite supplied data; `currentTime` is seconds, and the example starts paused with `advanceRate: 0` and `loop: false`.

Regenerate with `node candidates/restored-lottie/generate-fixture.mjs`. The examples cover static vector geometry, an inline bitmap, a bitmap layer, a data-URL animation, finite seek/rate values, and segment bounds. `cases.mjs` adds invalid references, unsupported capabilities, malformed data and numeric bounds.

Exact source `c1320b35d90ba004855109f7a0aaeffb08e37a8a` passes six positive/fifteen negative documents, seven engine/DOM/compiler workflows and 275 preserved146 definitions. The verifier checks 21 selected source/build files plus the official lottie-web5.13.0 upstream source hash.

Run `node candidates/restored-lottie/verify-source.mjs --library /path/to/ui-lottie-restored`. The complete bundled engine creates actual SVG paths and changes transforms on supplied seek. JSDOM needs a minimal canvas bootstrap adapter; bitmap decoding, native playback, standalone-script execution and pixels remain unverified. Two real compiled HTML policies are inspected, with no external requests. This fixture adds no canonical component count.
