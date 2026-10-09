# Support and capability boundaries

This matrix describes the independent `iui/1` library matched in [library-contract.json](../library-contract.json). `portable` is the backend's technical name, not an edition. There is no OpenAI account/API/runtime dependency and no private/native edition to wait for. This is not a native ChatGPT component inventory. Schema membership, rendering support, host data access and scientific correctness are different claims.

## Public protocol nodes

This pending-acceptance pin contains 90 schema nodes: 89 portable nodes and rejected native input. The accepted component count remains 53; this inventory is not browser/CI acceptance. The cross-repository check compares this machine-readable [node inventory](node-support.json) with the library schema. The root retains common authoring contracts and a complete discovery map; deeper domain contracts are read from the same-pin generated index, schema bundle and example, or supplied through the complete Web Chat guide. The skill fixtures exercise the main authoring path; complete renderer coverage belongs to the library's tests.

| Status | Nodes | Authoring guidance |
| --- | --- | --- |
| Portable, exercised by skill fixtures | `text`, `title`, `caption`, `math`, `link`, `section`, `figure`, `details`, `table`, `metric`, `metric-grid`, `steps`, `callout`, `slider`, `button`, `topology`, `chart` | Start here for editorial explanations; charts support line/bar/scatter/area/donut with explicit axis rules |
| Portable library surface; not all variants exercised here | `code`, `badge`, `divider`, `spacer`, `image`, `box`, `card`, `row`, `col`, `grid`, `carousel`, `list`, `toggle`, `select`, `svg` | Use the self-contained root contracts; inspect the library schema only for extra variants. Prefer semantic defaults and licensed media |
| Local forms and supplied weather | `input`, `textarea`, `radio`, `segmented`, `field`, `form`, `weather` | Local form validation/state; supplied weather with provenance/timezone. No implicit submission service or forecast retrieval |
| Supplied sports | `sports-schedule`, `sports-scoreboard`, `sports-standings` | Local filters, match selection and sorting; supplied snapshots, no live provider or rules inference |
| Local learning | `quiz`, `flashcards` | Weighted local scoring, exact multiple-answer sets, reveal/self-rating/reset; no persistence, secret exams or spaced scheduling |
| Supplied finance | `finance-quote`, `finance-chart`, `finance-comparison`, `finance-heatmap` | Provided prices/history, exact common baseline, weighted area and supplied changes; no market retrieval, trading or currency conversion |
| Local converters | `unit-converter`, `currency-converter` | Nine unit categories, absolute versus delta temperatures, and supplied base-relative rate snapshots; no live quotes or transactions |
| Explicit loading and placeholders | `loading`, `loading-block` | Caller-supplied finite0–100 progress or explicit unknown; bounded text/card/circle placeholders; no task inference or automatic replacement |
| Supplied source references | `citation`, `web-link-cards` | Literal caller-supplied sources, safe native HTTP(S) links and ordered horizontal list; no retrieval, ranking or verification |
| Local time | `clock`, `stopwatch`, `timer` | Device/supplied time and in-page elapsed/countdown controls; no system alarm, network synchronization or persistence |
| Foundation and disclosure extensions | `blockquote`, `grid-item`, `flow`, `icon`, `pulse-indicator`, `tooltip`, `popover` | Root contracts cover bounded layouts, finite original icons, caller-supplied status and nonmodal disclosure; no arbitrary markup or service inference |
| Pending finite Markdown | `markdown` | Bounded original subset; unsupported syntax and HTML stay literal; not CommonMark or an HTML execution path |
| Pending local content and controls | `tab-group`, `tab-panel`, `checklist`, `rating`, `favicon`, `agenda`, `restaurant-menu`, `prompt-suggestions`, `label`, `person-profile`, `writing-block`, `news-article`, `entity-reviews`, `restaurant-availability`, `reddit-thread-card`, `animate`, `celebration`, `email-draft`, `task-expansion-card`, `location-choice-request`, `business-gallery` | Same-pin contracts in root section 7; supplied/local content only, no inferred external action or service |
| Pending local learning | `fill-blank`, `sentence-builder`, `vocab-card` | Original supplied answers and local practice; see the learning contract, no secret answers or persistence |
| Deliberately rejected | `native` | No private runtime is bundled or assumed; use a portable alternative |

## Observable capabilities

The following 52 items classify user-visible jobs, not 52 generator tags. “Partial” means the named portable alternative covers only the stated subset. A host feature is unavailable merely because a similar-looking card can be drawn.

| # | Capability | Portable mapping / boundary |
| --- | --- | --- |
| 1 | Headings and body | `title`, `text` |
| 2 | Supporting explanation | `caption`, figure captions |
| 3 | Inline emphasis | Explicit text runs with emphasis/code/links; whole-text styles are bounded fields, not Markdown or HTML |
| 4 | Inline code | `code` with `inline:true`, or text runs with `code:true`; no execution or editor |
| 5 | Code blocks | `code` shows text; do not assume an editor or copy service |
| 6 | Mathematics | `math`, steps with LaTeX |
| 7 | Quotations | `blockquote` with ordinary children and optional supplied attribution/cite |
| 8 | Status badges | `badge`; only documented variants |
| 9 | Input labels | Controls' `label`; metric labels and hints |
| 10 | External links | `link`; destination availability and permissions are external |
| 11 | Cards | `card`; prefer prose/sections when a boundary is unnecessary |
| 12 | Horizontal grouping | `row`; responsive behavior belongs to renderer |
| 13 | Vertical grouping | `col`, `section` |
| 14 | Grid grouping | `grid`, `grid-item`, `metric-grid`; bounded desktop/mobile spans retain DOM order |
| 15 | Masonry / fluid columns | Responsive grid or DOM-ordered wrapping `flow`; no dense reorder or masonry |
| 16 | Dividers | `divider`; headings often suffice |
| 17 | Lists | `list`, including ordered items |
| 18 | Carousels | `carousel`; do not assume remote paging |
| 19 | Clickable cards | Partial: explicit `link` or state `button`; arbitrary region handlers unsupported |
| 20 | Popovers | `popover` is a nonmodal dialog; `tooltip` is inert text; native top-layer fallback is in-flow disclosure |
| 21 | Empty space | `spacer` exists; automatic spacing is preferred |
| 22 | Data tables | `table` supports validated rows/sections, merged/grouped headers, explicit header associations and local scroll; no editing |
| 23 | Buttons | `button` supports `set`/`reset`; not arbitrary events or submissions |
| 24 | Checkboxes | Boolean `toggle` or native `input` with `kind:"checkbox"`; no invented checkbox node |
| 25 | Radio choices | `radio`; same-type options, local state and keyboard selection |
| 26 | Segmented choices | `segmented`; same-type options with explicit disabled choices |
| 27 | Dropdown choices | `select` |
| 28 | Text / numeric text fields | `input` with text/number/email; typed state, constraints and local validation |
| 29 | Multiline editing | `textarea` supports bounded plain text; rich editing remains a host/editor capability |
| 30 | Date pickers | Native local `input` with `kind:"date"` and documented bounds; weather selects supplied daily dates |
| 31 | Sliders | `slider` plus numeric state and safe expressions |
| 32 | Submitted forms | `form` validates and confirms locally; external effects require an explicitly configured and authorized host action |
| 33 | Line charts | `chart` with `kind: "line"` |
| 34 | Bar charts | `chart` with `kind: "bar"` |
| 35 | Scatterplots | `chart` with `kind: "scatter"` and explicit linear/time X |
| 36 | Pie charts | Single-series nonnegative `kind:"pie"` or `kind:"donut"`; no inferred values |
| 37 | Vector diagrams | `topology` or constrained `svg`; no raw markup |
| 38 | Statistics | `metric`, `metric-grid`; the numbers still need provenance |
| 39 | Icons | `icon` provides ten finite original glyphs, decorative or explicitly named; no arbitrary icon loader |
| 40 | Brand marks | Authorized image asset; no bundled third-party marks |
| 41 | Single images | `image` plus alt text; zoom/editor behavior not implied |
| 42 | Image collections | `grid`/`carousel` with authorized `image` nodes |
| 43 | Video | Extension or authorized external link; no current player node |
| 44 | Maps and routes | Host data/service or new renderer; schematic topology is not a map |
| 45 | Sources and citations | `citation` and `web-link-cards` retain supplied title/URL/publisher/description; retrieval and assessing evidential support remain the author/host responsibility |
| 46 | File navigation | Authorized file links; filesystem navigation requires the host |
| 47 | Linked entities | Sourced prose/images/links; live entity data requires a service |
| 48 | Follow-up suggestions | `prompt-suggestions` emits an explicit cancelable local choice; conversation effects require an authorized host |
| 49 | Live specialized widgets | `weather` renders supplied source/timezone data. Live retrieval remains a host service; sports and finance views also render supplied snapshots; `clock` can show device time; stopwatch/timer are page-local and do not imply a service; other unlisted domains remain outside this pin |
| 50 | Custom app blocks | Restricted state/AST only; no arbitrary app scripts or sandbox claim |
| 51 | Rich writing editor | `writing-block` / `email-draft` provide local plain-text drafts; no mail send or rich editor |
| 52 | Structured code with preview | Partial: `code` displays text; bounded highlighting/copy are documented local features; execution or preview is not supported |

## Choosing a fallback

Check the host and matched library before authoring. Unsupported chart features can fall back to an accurate table; a missing map service can become a list of verified locations/links; unavailable live data requires saying it is unavailable. Never relabel generated examples as retrieved facts, or infer authorization from the ability to render an interface.
