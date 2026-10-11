# Original supplied reservation-card consumer

Exact source/build `37e4ba7af5e0b39f80a80513b145c300757ba21e`, tree `69fdd72ba268c57cffe113ed7abea5facc8c72b5`, registration185. This consumer exercises only `reservation-time-pills-ref-carousel`. The reusable ordinary `ReservationPillsData` grouped-reader structure is not a second registered/canonical node.

```sh
node candidates/reservation-carousel/verify-source.mjs --library /path/to/exact-runtime
node --test tests/reservation-carousel.test.mjs
```

Use Node22+ and the runtime's normal dependencies. The20-file safe lock records exact source/build identities without bundling runtime or private material. All rooms, dates, guests, provider/entity IDs and requests here are fictional. Images reuse the original blue/gold swatch; URLs use example.test. No booking is attempted.

## Canonical card contract

Resolved input requires `label` and up to16 `items`. Items without `voiceCard` are omitted. A card uses only its first supplied group and the first five `mobileSlots`. There is no desktop/times fallback, provider menu, seating picker or inherited provider action in this presentation. Unavailable slots are passive. Missing capability stays disabled.

Three or more photos produce a three-image mosaic and a frozen full descriptor snapshot for image requests. One or two photos do not become thumbnails in this canonical view, although the separate ordinary reader has different behavior. The fixture intentionally includes both cases and a card with no groups.

Card titles use their explicit prompt/URL/provider/entity action. Entity/provider actions require `available:true`. A slot prefers its own nonblank booking query, then its own launcher, then URL. An explicitly unavailable launcher is not silently replaced by a URL. The party/date heading uses the first change option's launcher or URL and ignores its booking query. More times needs over five mobile slots and an eligible purpose-specific/ordinary launcher. Empty mobile slots show the supplied empty message and eligible retry request, even if desktop/times data exists.

`iui:reservation-pills` bubbles, is cancelable and is non-composed. Detail and normalized action are frozen; image arrays and descriptors are frozen. Intents include `book`, `change-party`, `more-times`, `retry`, `open-card` and `view-image`, with supplied item/reference/group/slot IDs. The included adapter records and cancels them. Acceptance is merely a local receipt, never a reservation confirmation. Provider, entity, navigation and location services are not called.

Images use the existing passive SearchImage loader. Explicit external sources retain that primitive's activation policy; this fixture is wholly inline. The local/native reset restores rail position and clears local receipt, preserving cancellation and pending-reset barriers. Update/dispose retires old controls and image sources.

## Verified scope

10 positive/16 negative documents pass both actual validators and selected Base schema.336 old definitions and alternatives are unchanged; nine reusable definitions include exactly one new Node. Six DOM/actual-standalone groups verify canonical omissions/fallback differences, distinct targets, cancellation, source capability gates, image cleanup, reset/scroll, atomic update and disposal. The actual compiled script emits the canceled canonical request with matching CSS.

External requests and provider/navigation/location calls observed:0. Rail rectangles are explicitly supplied to JSDOM, so this proves local scroll behavior rather than native geometry or pixels. Ordinary grouped-reader/provider-menu/seating behavior is not exercised by this canonical consumer; its separate upstream tests are not counted here. Source185 remains outside the frozen183 and164 asset locks.
