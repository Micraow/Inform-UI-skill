---
name: intelligent-ui-author
description: Author compact iui/1 JSON for explanatory prose, charts, diagrams, metrics and state-bound controls using the Intelligent-UI JavaScript library. Use when a structured visual answer or Intelligent-UI document is requested; ordinary prose needs no UI.
---

# Intelligent UI Author

Produce accurate, readable explanations with the smallest useful visual. The model chooses content, evidence, reading order and interaction; the library validates JSON and owns HTML, styling, spacing and responsive behavior. This is an independent project protocol, not OpenAI's internal schema or native runtime.

## Compose an answer

1. Identify what the reader needs to understand or decide. Start with the conclusion or the question the visual answers. If a sentence is enough, keep prose; do not invent a chart or dashboard.
2. Choose a component by its job:
   - Change over ordered observations → line `chart`; category comparison → bar `chart`.
   - Connections and bottlenecks → `topology`; an algorithm's sequence → `steps` with `math` when needed.
   - A few meaningful measurements → `metric-grid`; exact comparisons → `table`.
   - Recommendations → a short `list` or `section` containing text and links, with images only when informative and permitted.
   - A real what-if question → a labeled `slider`, `toggle` or `select` bound to declared state and visible results. Avoid controls that change nothing.
3. Keep prose, figures, formulas and interpretation in one reading sequence. Use a card for a coherent interactive example, not around every paragraph. Let renderer defaults establish the width, type hierarchy, whitespace and mobile layout; do not generate CSS.
4. Distinguish observations, derivations and synthetic data in visible captions. Preserve units, source links, measurement time and assumptions when available. Missing values are not zero. Never invent live readings, retrieved media or service results.
5. Emit a JSON document with `version: "iui/1"` and `body`. Use only fields from the matched library contract. For details read [schema-and-binding.md](references/schema-and-binding.md); adapt the nearest [example](references/examples.md), not a large boilerplate page.

## Validate and repair

Use [library-workflow.md](references/library-workflow.md) for the actual checkout commands and supported API. There is no required cloud service and no published package assumed. Run the library validator, repair the reported JSON-pointer path and rerun. Read [repair.md](references/repair.md) for common structural and semantic fixes. Do not patch generated HTML to hide invalid input.

When a browser is available, inspect the rendered result at desktop and 390 px, in light and dark themes. Check long text, labels, units, keyboard control and visible feedback. Explain one consequence immediately after the visual. Validation proves contract conformance; it does not prove scientific correctness or visual quality.

For unsupported requests, consult [support.md](references/support.md). Prefer a supported static explanation or a clearly labeled link. Host-only services and native widgets require a verified host capability, real data and authorization; do not invent a widget type. Arbitrary HTML, script strings, event handlers, CSS and model-provided functions are outside this authoring contract. Safe calculations use the library's expression AST.

## Deliver

When asked for machine-readable output, return JSON only. Otherwise provide the requested explanation or render plus its JSON when useful. If validation or preview could not run, label that specific limitation; never claim a build or a native service worked without evidence.
