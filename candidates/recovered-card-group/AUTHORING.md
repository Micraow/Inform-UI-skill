# Supplied next-step cards

Use `follow-up-card-group` when the reader should choose between a few supplied next steps. Write it after the explanation it extends. Do not turn the entire explanation into a dashboard or repeat the same text inside every card. The runtime owns the vertical list, subtle border, spacing, type and hover states.

Required: `type`, a nonempty accessible `label`, and `items` (0–40).
Each item needs an `id` matching `^[A-Za-z_][A-Za-z0-9_.-]{0,79}$`, a visible `label` (1–200 characters), and exactly one intent:
- `{"kind":"query","query":"Explain these assumptions."}`
- `{"kind":"url","url":"https://example.org/reference"}`
- `{"kind":"prefill","surface":"work","query":"Draft an outline."}`

IDs must be unique within the group. Queries are supplied strings of at most 4000 characters, never executable source or a secret instruction channel. Destinations must be absolute HTTP(S), without credentials or backslashes. Do not invent a destination when none is supplied.

Optional item fields: `description` (1–1000 characters), decorative `emoji` (1–32), `iconData` (inline base64 raster only, no SVG, remote or relative URL), `disabled` (literal boolean). If both decorations are supplied, iconData wins. Avoid iconData when an emoji or no decoration is sufficient.

Optional group fields: `id`, `status:"ready"|"loading"|"error"` and `message` (1–2000). Ready is the default; an empty array remains genuinely empty. Loading/error are supplied presentation states, not network operations. Error without a message contains no invented fallback.

The component dispatches a bubbling, cancelable, non-composed `iui:follow-up-card` event with deeply frozen `{componentId,itemId,intent}`. There is no built-in action even if nobody cancels it. A host must enforce its own user authorization before doing anything consequential. Do not label the sample as a functioning chat/search/workspace service.

Use [examples/next-steps.json](examples/next-steps.json) as a complete original document. The companion `consumer.mjs` accepts the runtime API explicitly and only displays a local receipt of an intent. Its listener cancels every intent; it never opens destinations or runs supplied prompts.

Use full runtime validation before mount. A schema pass alone does not establish valid URLs or unique item IDs. An invalid update must leave the current document intact. Test cancellation, repeated activation, update/dispose inside an event, late activation of retained controls, and form embedding. The verifier records Node/JSDOM evidence separately from native browser and visual acceptance.

This addition uses the recovered runtime's shared lifecycle implementation. New renderers should reuse the actually available shared contract. The lost later `componentScope` implementation must not be described as installed until its bytes and tests have been restored.
