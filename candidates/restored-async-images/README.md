# Original finite asynchronous-image consumers

The example supplies two images to `async-image` and three to `async-image-group`. Every pixel is produced by this Skill's original solid-color PNG generator. The shared `mediaStatus` is caller-supplied phase data: pending, resolved or failed. There is no image search, model generation or automatic provider retry.

Interactive image opening emits cancelable `iui:image-open` with a deeply frozen supplied images array, selected index and component kind. A host can cancel it. The uncanceled built-in fallback is explicitly called Local image viewer and marked local-basic; it is not a claim to recreate an external host gallery. Its finite previous/next controls do not fetch new records.

Supplied external URLs may request their resource directly. This primary fixture stays inline. Pending/failed data, disabled reading, noninteractive images and empty collections have different meanings. Do not turn an unknown or failed source into a fabricated picture.

Exact source `c1320b35d90ba004855109f7a0aaeffb08e37a8a` (protocol147) passes five positive/twelve negative documents through the actual Node and browser builds, plus seven DOM workflows. These cover frozen cancelable intents, local viewer previous/next/close, phase changes, form isolation, replacement and first connection/owner retirement. Literal null is rejected by this successor.

Run `node candidates/restored-async-images/verify-source.mjs --library /path/to/ui-lottie-restored`. The selected lock checks 19 source/build files and 273 preserved144 definitions. The compiler produces real HTML with full styles. No fresh CDN or native decoding/visual acceptance is claimed. The earlier dad1645 source passed ordinary flows but had separate literal-null and queued-retirement defects; this lock uses the corrected single147 input.
