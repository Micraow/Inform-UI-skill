# The compact authoring contract

The matched library's exported schema and semantic validator are authoritative. This reference is a working subset, not a second schema. `iui/1` is project-defined; native registry names are not valid portable node names.

## Document and common nodes

A document has `version: "iui/1"` and a nonempty `body` array. Optional `title`, `description`, `theme` (`auto`, `light`, `dark`), `state` and `computed` belong at the document root. Unknown properties are errors.

- Text: `{ "type": "text", "value": "Explanation" }`
- Heading: `{ "type": "title", "value": "A conclusion", "level": 2 }`
- Caption: `{ "type": "caption", "value": "Synthetic data; latency in ms." }`
- Math: `{ "type": "math", "latex": "U_{\\max}=\\max_j U_j", "block": true }`
- Metric: `{ "type": "metric", "label": "Latency", "value": 18, "unit": "ms" }`
- Link: `{ "type": "link", "value": "Source", "href": "https://example.org/source" }`
- Container: `section`/`figure` use `children`; `section` can add `heading`, `figure` can add `caption`. Prefer these semantic containers before decorative cards.
- Table: string `columns` plus `rows` of values. Every row must match the column count.
- Chart: `kind` is `line`, `bar`, `scatter`, `area` or `donut`; specify `xKey`, `data` and `series` (`key`, `label`, optional named color). Supply `unit` and `note` when needed. `null` denotes a missing observation. Use explicit `xScale: "linear"`/`"time"` for true coordinates; scatter requires one of these, while donut is category-only with one nonnegative series. Empty data and ready/loading/error views are supported; see the self-contained root skill for complete axis constraints.
- Topology: nodes use unique `id` and `label`; links use valid `from`/`to`, optional `load`; `highlight: "max-load"` highlights the maximum.

See the complete [examples](examples.md) rather than inferring additional properties. Put provenance in visible captions/notes or a source link; do not invent an unsupported `source` property.

## Values and calculations

Use literals, a reference `{ "$": "name" }`, or `{ "op": "operator", "args": [...] }`. Declare mutable inputs in `state`; declare derived expressions in `computed`. Names share one reference namespace: keep them distinct and references acyclic.

Example: `state: { "load": 1.2 }` and `computed: { "window": { "op": "div", "args": [100, { "$": "load" }] } }`. A metric can use `value: { "$": "window" }`. Keep the slider range strictly above zero if it is a denominator.

Supported operator names are `add`, `sub`, `mul`, `div`, `min`, `max`, `round`, `abs`, `clamp`, `gt`, `lt`, `eq`, `if`, `format`. They are data, not JavaScript expressions. `add`/`mul`/`min`/`max` take 1–12 numbers; `sub`/`div`/`gt`/`lt` take two; `abs` takes one; `clamp` takes value, lower and upper bounds. `round`/`format` take a number and optional precision (integer 0–6); `format` returns a string. `eq` compares two values; `if` takes a boolean condition, then-value and else-value. Prefer a small numeric AST over formatting tricks.

A `slider` needs `label`, a numeric-state `bind`, `min`, `max` and positive `step`. A `toggle` binds boolean state. A `select` has labeled options and a compatible initial state value. A `button` supports state `set` or `reset`, not arbitrary network requests or functions. Calculations must remain valid throughout the allowed input range, not just initially.

Do not place expressions in fields that require strings, such as `math.latex`, `chart.title` or a section heading. Render changing numeric values in supported value fields near a stable explanatory formula.

## Renderer-owned decisions

The protocol has some bounded layout knobs for compatibility. Usually omit `gap`, `padding`, `width`, `radius`, and `spacer`: content grouping is the useful model decision. Defaults should handle whitespace and mobile flow. Semantic colors may indicate information, warning or a series identity; do not use color as the only label.

## Forms and supplied weather

The root [SKILL.md](../SKILL.md) is authoritative for the self-contained field shapes and limits of input/textarea/radio/segmented/field/form/weather. Plain web chat should omit form.action and use local confirmation; weather requires provenance, explicit timestamps/timezone and supplied data. The browser wrapper does not fetch a forecast or register a submission service. These nodes do not expand the attributes of the older slider/toggle/select nodes.

## Local-state lifecycle

The root keeps common time/overlay and foundation fields in [SKILL.md](../SKILL.md). These additions are not supported by the historical 6797f7f CDN wrapper. See [time-and-overlays.md](time-and-overlays.md) for domain-union selection and local-state lifetime. A popover does not turn its children into base-domain nodes.

For numeric inputs, empty/incomplete, nonfinite and min/max/step-invalid input remains a DOM draft; unrelated state changes preserve it, while an explicit host assignment to that binding replaces it even when the state value is unchanged. Text/email/textarea still bind strings immediately; do not generalize numeric last-accepted-value behavior to all fields. Closing a popover hides its children without resetting timers or aborting form actions.

The numeric draft gate applies to user typing. Explicit host setState remains authoritative and can write a finite number outside a form field's min/max/step when global state constraints permit it. The field can then be invalid on blur/submit; form constraints are not a replacement for host-data validation.
