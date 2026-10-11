# Original finite asynchronous-image drafts

The example supplies two images to `async-image` and three to `async-image-group`. Every pixel is produced by this Skill's original solid-color PNG generator. The shared `mediaStatus` is caller-supplied phase data: pending, resolved or failed. There is no image search, model generation or automatic provider retry.

Interactive image opening emits cancelable `iui:image-open` with a deeply frozen supplied images array, selected index and component kind. A host can cancel it. The uncanceled built-in fallback is explicitly called Local image viewer and marked local-basic; it is not a claim to recreate an external host gallery. Its finite previous/next controls do not fetch new records.

Supplied external URLs may request their resource directly. This primary fixture stays inline. Pending/failed data, disabled reading, noninteractive images and empty collections have different meanings. Do not turn an unknown or failed source into a fabricated picture.

Five positive and eleven negative documents prepare this family, including twenty-item and overflow bounds. Actual renderer, viewer navigation, CDN and native image decoding remain untested until a single exact source/build consumer is attached.
