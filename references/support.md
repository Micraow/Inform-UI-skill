# Support and capability boundaries

This matrix describes the portable `iui/1` baseline matched in [library-contract.json](../library-contract.json). It is not a native ChatGPT component inventory. Schema membership, rendering support, host data access and scientific correctness are different claims.

## Public protocol nodes

The cross-repository check compares this machine-readable [node inventory](node-support.json) with the library schema. The five skill fixtures exercise the main authoring path; complete renderer coverage belongs to the library's tests.

| Status | Nodes | Authoring guidance |
| --- | --- | --- |
| Portable, exercised by skill fixtures | `text`, `title`, `caption`, `math`, `link`, `section`, `figure`, `details`, `table`, `metric`, `metric-grid`, `steps`, `callout`, `slider`, `button`, `topology`, `chart` | Start here for editorial explanations; charts are line/bar only |
| Portable library surface; not all variants exercised here | `code`, `badge`, `divider`, `spacer`, `image`, `box`, `card`, `row`, `col`, `grid`, `carousel`, `list`, `toggle`, `select`, `svg` | Check the library's schema and renderer tests; prefer semantic defaults and licensed media |
| Explicit fallback | `markdown` | Plain text with a visible fallback label; no Markdown formatting is interpreted |
| Deliberately rejected | `native` | No private runtime is bundled or assumed; use a portable alternative |

## Observable capabilities

The following 52 items classify user-visible jobs, not 52 generator tags. “Partial” means the named portable alternative covers only the stated subset. A host feature is unavailable merely because a similar-looking card can be drawn.

| # | Capability | Portable mapping / boundary |
| --- | --- | --- |
| 1 | Headings and body | `title`, `text` |
| 2 | Supporting explanation | `caption`, figure captions |
| 3 | Inline emphasis | Partial: text weight only; Markdown is displayed as plain text; no guessed underline node |
| 4 | Inline code | Extension for inline-code semantics; `code` provides a plain block |
| 5 | Code blocks | `code` shows text; do not assume an editor or copy service |
| 6 | Mathematics | `math`, steps with LaTeX |
| 7 | Quotations | Partial: plain prose or callout; no native blockquote dependency |
| 8 | Status badges | `badge`; only documented variants |
| 9 | Input labels | Controls' `label`; metric labels and hints |
| 10 | External links | `link`; destination availability and permissions are external |
| 11 | Cards | `card`; prefer prose/sections when a boundary is unnecessary |
| 12 | Horizontal grouping | `row`; responsive behavior belongs to renderer |
| 13 | Vertical grouping | `col`, `section` |
| 14 | Grid grouping | `grid`, `metric-grid` |
| 15 | Masonry / fluid columns | Partial: responsive grid; dedicated masonry is an extension |
| 16 | Dividers | `divider`; headings often suffice |
| 17 | Lists | `list`, including ordered items |
| 18 | Carousels | `carousel`; do not assume remote paging |
| 19 | Clickable cards | Partial: explicit `link` or state `button`; arbitrary region handlers unsupported |
| 20 | Popovers | Partial: `details` for disclosure; anchored popover needs extension |
| 21 | Empty space | `spacer` exists; automatic spacing is preferred |
| 22 | Data tables | `table`; complex merged/grouped headers need extension |
| 23 | Buttons | `button` supports `set`/`reset`; not arbitrary events or submissions |
| 24 | Checkboxes | Partial: boolean `toggle`; no invented checkbox type |
| 25 | Radio choices | Partial: `select`; dedicated radio presentation needs extension |
| 26 | Segmented choices | Partial: `select`; dedicated segments need extension |
| 27 | Dropdown choices | `select` |
| 28 | Text / numeric text fields | Extension; use a slider only when a bounded numeric choice is appropriate |
| 29 | Multiline editing | Host/editor capability; static `code` or `text` is not an editor |
| 30 | Date pickers | Extension with explicit date semantics |
| 31 | Sliders | `slider` plus numeric state and safe expressions |
| 32 | Submitted forms | Host service and authorization; state controls are not form submission |
| 33 | Line charts | `chart` with `kind: "line"` |
| 34 | Bar charts | `chart` with `kind: "bar"` |
| 35 | Scatterplots | Extension; use a labeled table when unavailable |
| 36 | Pie charts | Extension; use a bar/table when it communicates the composition accurately |
| 37 | Vector diagrams | `topology` or constrained `svg`; no raw markup |
| 38 | Statistics | `metric`, `metric-grid`; the numbers still need provenance |
| 39 | Icons | Partial: original constrained SVG; icon set and semantics need deliberate selection |
| 40 | Brand marks | Authorized image asset; no bundled third-party marks |
| 41 | Single images | `image` plus alt text; zoom/editor behavior not implied |
| 42 | Image collections | `grid`/`carousel` with authorized `image` nodes |
| 43 | Video | Extension or authorized external link; no current player node |
| 44 | Maps and routes | Host data/service or new renderer; schematic topology is not a map |
| 45 | Sources and citations | Visible `link`/caption; source retrieval and native citation metadata require host support |
| 46 | File navigation | Authorized file links; filesystem navigation requires the host |
| 47 | Linked entities | Sourced prose/images/links; live entity data requires a service |
| 48 | Follow-up suggestions | Plain text/list; conversation actions require the host |
| 49 | Live specialized widgets | Host service, current data and authorization; no simulated results presented as live |
| 50 | Custom app blocks | Restricted state/AST only; no arbitrary app scripts or sandbox claim |
| 51 | Rich writing editor | Host/editor capability; a rendered document is read-only content |
| 52 | Structured code with preview | Partial: `code` displays text; execution, advanced highlighting and preview need explicit support |

## Choosing a fallback

Check the host and matched library before authoring. An unavailable scatterplot can become an accurate table; a missing map service can become a list of verified locations/links; unavailable live data requires saying it is unavailable. Never relabel generated examples as retrieved facts, or infer authorization from the ability to render an interface.
