# Rich text and small relationship graphics

Both default and curated profiles add the generic `MarkdownView` and `SvgView`
from `views/content` to their existing selection. The curated profile retains its
other nine selected content Views. Use the generated
profile's `select` and `viewNames` together. This does not open every content View.

Keep the answer's prose continuous. Introduce a relationship where it matters,
place a small graphic or meaningful state change beside that explanation, then
continue with what the reader should understand. This is an available composition
pattern, not a required sequence. Ordinary conclusions need neither Alert nor a
separate card. Alert is for an actual risk, limit, error or noteworthy state.

## MarkdownView

`MarkdownView({value: text})` accepts at most 12,000 characters. The bounded local
parser supports plain text, flat emphasis/strong emphasis, inline code and safe
links, plus basic paragraphs, headings, lists, quotations and code blocks.
Normal text, emphasis, code and a link can share one paragraph. `Text` remains a
literal-text component and does not interpret Markdown markers.

This is not complete CommonMark or ChatGPT Markdown compatibility. Raw HTML is
literal; images, tables and nested inline constructs are not a supported general
format. Unsafe link targets do not become active links. Do not promise that every
Markdown input will render its intended formatting.

The current parser treats contiguous Unicode letters as a word: Chinese emphasis
such as `这里**重点**继续。` can remain literal, while punctuation-delimited emphasis
is supported. Preserve the author's sentence; do not add artificial spaces to
force a visual result. When formatting is essential, use a supported expression
or the actual Text weight contract, and validate the result. This records a current
boundary, not a recommendation to restrict Chinese writing.

## SvgView

`SvgView({viewBox, shapes, label})` consumes structured, bounded shape data rather
than an SVG/HTML string. `viewBox` contains four nonnegative integer coordinates;
its width and height must be positive. Use 1–150 shapes. The allowed tags are
`rect`, `line`, `circle`, `path`, `text`, `polyline` and `polygon`. A text shape uses
its `text` field. Provide an accessible label and readable textual explanation.

The semantic validator restricts attributes beyond the JSON shape schema:
- Coordinates, dimensions, opacity and font size are finite unitless numbers.
  Dimensions cannot be negative and opacity is between 0 and 1.
- Paint is a safe literal color, `none`, `transparent` or `currentColor`; URL paint
  servers, arbitrary CSS, `style`, `href` and event attributes are rejected.
- Paths and numeric point lists use the bounded accepted character grammar.
  Transform supports only numeric translate/scale/rotate/matrix/skew operations.
- Stroke, text-anchor, baseline and font-weight choices have finite enumerations.
  Use the actual runtime to validate final source; a broad-looking `attrs` object
  in JSON Schema is not permission to supply arbitrary SVG attributes.

No script, foreignObject, external resource, arbitrary DOM, per-shape action,
automatic layout or animation API is exposed. Coordinates express the supplied
relationship; neither size nor color should imply invented measurements. Keep
text labels available and do not use color alone to identify states.

For a meaningful before/after or step change, derive shapes, graphic label and
prose from the same declared `$state` and data. Existing Button/Select controls
may update that state through supported actions. This does not add SVG event
handlers or an animation system. Static diagrams remain valid without controls.

The regression coverage uses original neutral data and Node/JSDOM. It checks
DOM structure, safe rejection and state consistency, not browser pixels or CDN
availability. Production contract tests still disallow dynamic code generation;
the separate DOM harness permits JSDOM's own selector implementation.
