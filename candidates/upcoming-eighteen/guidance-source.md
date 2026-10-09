# More Base authoring: planning, vocabulary, citations and supplied facts

For one complete 115 candidate entry, use candidates/upcoming-eighteen/AUTHORING.md, with its own exact runtime pin, full schema and generated Base/domain bundles. The historical top-level CDN shell does not support these eight nodes. Browser/CDN acceptance remains pending.

Use the exact distinct Base types below. Keep these common contracts in SKILL.md. The full schema is the canonical definition and Base/domain bundles are generated from it. All examples are original synthetic material. No model service, private runtime, lookup, invitation, calendar write or inferred verification is implied. The copy-words control is the explicit exception to purely local reading: after a user-triggered, non-canceled intent, it attempts an actual clipboard write.

## shared-activity-planner and event-sidebar

A planner requires label (1–200 code points), participants (1–12 unique `{id,label}` records) and options (0–20). Participant labels are 1–200; IDs are strict local keys, not identity verification. An option requires unique id, label (1–200), startsAt, endsAt and availability (0–12 `{participantId,status}` records). Status is available/unavailable/unknown; references must name supplied participants and cannot repeat within an option. Missing availability remains unknown. Optional location is 1–200, description up to 3000 and source is a safe supplied link. Planner description is up to 2000; disabled is optional.

All time intervals use real Gregorian minute timestamps, years 1000–9999, with explicit Z or offsets up to ±14:00. End must follow start as an offset-adjusted instant. Candidate activities may overlap. Never substitute system time or infer attendance, consent, replies, rankings or a winning option.

The participant selector edits only that person's local unset/yes/maybe/no preference. Supplied availability is never changed. No option is preselected. Explicit reset clears preferences and selection; outside native form reset preserves the local draft. Review emits bubbling, cancelable, non-composed iui:activity-plan with frozen `{componentId,optionId,preferences}`. The frozen array contains frozen `{participantId,value}` entries in source order for the selected option only. Cancellation retains edits; repeated explicit review is allowed and synchronous reentry is blocked. Nothing is invited or booked.

An event sidebar requires eventId, label (1–200), startsAt, endsAt and agenda (0–40). Optional organizer/location are 1–200, description up to 5000, and source remains supplied. Each agenda entry requires unique id, label, category (1–200 each), startsAt and endsAt; optional speaker is 1–200 and description up to 3000. Entries must fit inside the overall interval. Concurrent entries are legal and retain source order. Category filtering preserves native disclosures. Frozen local iui:event-review detail is `{componentId,eventId}`; it bubbles and is cancelable/non-composed, without calendar export, RSVP, registration or reservation.

```json upcoming115-only
{"version":"iui/1","body":[{"type":"shared-activity-planner","label":"Compare supplied possibilities","participants":[{"id":"person","label":"Example participant"}],"options":[{"id":"walk","label":"Example walk","startsAt":"2028-02-29T10:00Z","endsAt":"2028-02-29T11:00Z","availability":[]}]},{"type":"event-sidebar","eventId":"example_event","label":"Supplied event","startsAt":"2028-02-29T09:00Z","endsAt":"2028-02-29T17:00Z","agenda":[]}]}
```

## word-card and copy-words

A word card requires wordId, term (1–200) and literal definition (1–5000). Optional pronunciation and partOfSpeech are supplied labels (1–200), translation up to 2000, examples (0–8 `{text,translation?}` records; text 1–1000, translation up to 1000), initiallyRevealed, disabled and source. Reveal is reversible. Known/review/unset is a local self-mark, not a mastery score or inferred assessment. Frozen cancelable, bubbling, non-composed iui:word-mark detail is `{componentId,wordId,mark}`. Cancellation preserves the current mark; no external progress, speech or dictionary lookup occurs.

Copy words requires label (1–200) and words (0–80 unique `{id,text,note?}` records). Text is literal 1–200, note up to 1000; duplicate text with different IDs is allowed and retained. Optional initialSelectedIds must be unique supplied IDs. Omitted means all selected; an empty array means none. Optional separator is lines/comma/space, default lines. Description is up to 2000 and disabled is optional. Preview preserves source order and exact text; no trimming, normalization, sorting or deduplication.

Explicit Copy emits frozen, bubbling, cancelable, non-composed iui:words-copy detail `{componentId,wordIds,separator,text}`, with frozen IDs. Cancellation prevents even clipboard access. Otherwise the owned document's navigator.clipboard.writeText receives the exact preview. Only its fulfilled promise earns success status. Missing, denied, throwing or rejected clipboard access gives visible manual-copy instructions, without automatic retry or hidden fallback. Pending writes block duplicate operations and edits. An issued request cannot be revoked, but replacement/disposal/moved controls suppress stale UI updates and never reclaim external focus. Manual selection rechecks ownership, pending state and draft revision after focus. Clipboard permissions and actual system results require real browser verification.

```json upcoming115-only
{"version":"iui/1","body":[{"type":"word-card","wordId":"curiosity","term":"curiosity","definition":"An interest in learning or discovering something.","translation":"好奇心","examples":[{"text":"Curiosity led us to ask another question."}]},{"type":"copy-words","label":"Select supplied words","words":[{"id":"first","text":"curiosity"},{"id":"second","text":"curiosity"},{"id":"third","text":"明亮"}],"initialSelectedIds":[],"separator":"lines"}]}
```

## code-cite and file-cite

Code citation requires label and fileName (1–200), startLine (integer 1–10,000,000) and lines (1–120 literal strings, each up to 2000). Blank lines remain blank. Optional language is only a label (1–200), not a syntax plugin. Optional citedStart/citedEnd must appear together, be ordered and lie in the supplied window; its last absolute line cannot exceed 10,000,000. Without a range, all supplied lines are cited.

Context reveal changes only visibility of supplied surrounding lines, keeping absolute numbering and row identity. Manual selection exposes exactly the cited lines joined by newline, with no line numbers or extra characters. It selects an owned readonly textarea for the user's system Copy command. There is no code execution, clipboard API or file access.

File citation requires label/fileName (1–200) and pages (1–30 unique records). Each page has number (integer 1–10,000,000), text (1–6000), optional label (1–200) and source. Optional totalPages has the same integer bounds and cannot be below any supplied page. InitialPage must have an excerpt; otherwise the first supplied record is shown. Preserve source order, including noncontiguous page numbers. Optional mediaType is a label (1–200), not a loader. No missing page, OCR, PDF preview, download or filesystem path resolution is generated.

Page navigation keeps retained panels and hides/clears the manual preview to prevent stale selection. Native reset restores the initial supplied page. A focus listener changing page, moving controls or making the preview hidden/inert cancels subsequent selection. Both citation readers use safe optional sources and literal content.

```json upcoming115-only
{"version":"iui/1","body":[{"type":"code-cite","label":"Supplied code excerpt","fileName":"example.ts · label only","startLine":10,"lines":["// Supplied context","return value;",""],"citedStart":11,"citedEnd":12},{"type":"file-cite","label":"Supplied page excerpts","fileName":"example.pdf · label only","totalPages":12,"initialPage":9,"pages":[{"number":2,"text":"Original supplied overview excerpt."},{"number":9,"text":"Original supplied notes excerpt. No other page is fabricated."}]}]}
```

## sidebar-fact-table and entity-thumbnail-list

A fact table requires label (1–200) and facts (0–80 unique `{id,label,value}` records). Fact label is 1–200 and value is a literal string up to 2000 or null. Null means not supplied; empty string means an explicitly empty supplied value. Numeric/date-looking text is not parsed, reformatted or computed. Use "0" for a literal zero, not numeric 0. Optional unit/group are 1–200; note up to 3000, observedAt a valid explicit-offset Gregorian minute timestamp, and source a supplied attribution link. Table description is up to 2000.

Text search covers field/value/unit/group and combines with exact group filtering. Ungrouped has an explicit choice; internal encoded option values must not be authored as group labels. Headers/caption retain semantics, note disclosures retain identity, and Reset clears filters. No source is verified or refreshed.

An entity list requires label (1–200) and entities (0–24 unique `{id,label,category}` records; label/category 1–200). Optional description up to 3000, fields (0–8 literal `{label,value}` pairs; label 1–200 and value string up to 2000), source and image. Image is bounded embedded base64 PNG/JPEG/WebP only, src up to 140000 and alt 1–2000. Remote images, SVG and GIF are rejected. Omitted or failed images show neutral local fallback. Do not infer identity from an image. The original fixture checker swatch is project-owned, not a reference-product capture.

Text/category filters combine without silently clearing selection. Optional initialSelectedId must exist. Frozen cancelable, bubbling, non-composed iui:entity-select detail is `{componentId,entityId}`; explicit Clear uses null. Cancellation keeps prior selection. Filtering a selected entity outside the visible list leaves its detail visible with an explicit explanatory note. Reset clears filters while retaining selection; Clear changes selection. Optional disabled suppresses interactions while ordinary source links remain reading links.

```json upcoming115-only
{"version":"iui/1","body":[{"type":"sidebar-fact-table","label":"Supplied literal facts","facts":[{"id":"zero","label":"Literal zero","value":"0","unit":"items"},{"id":"unknown","label":"Missing value","value":null},{"id":"blank","label":"Explicit blank","value":""}]},{"type":"entity-thumbnail-list","label":"Supplied entities","entities":[{"id":"sample","label":"Example entity","category":"Illustrative","fields":[{"label":"Literal label","value":"As supplied"}]}]}]}
```

## Shared ownership and rejection rules

Safe sources are absolute HTTP(S), without credentials or executable/relative URLs, using opener/referrer protection and no prefetch. Controls have no payload names/bindings. Native resets follow each contract, respecting cancellation, newer edits and lifecycle. The reviewed guard follows observable assignedSlot, parent and shadow-host ancestry and preserves native disabled-fieldset rules. It does not claim arbitrary computed-CSS visibility or private closed-shadow slot internals. No moved-outside control, row, preview or image is reclaimed or rewritten. Focus and event construction/dispatch are interruption boundaries. Replacement/disposal retires listeners and pending UI work.

Planner duplicate IDs → DUPLICATE_ID; unknown availability participant → ACTIVITY_PARTICIPANT; invalid instants → ACTIVITY_TIME; non-increasing intervals → ACTIVITY_ORDER; agenda outside event → EVENT_AGENDA_RANGE. Copy duplicate IDs/selection → DUPLICATE_ID; unknown selected word → COPY_WORD_ID. Citation half-ranges, reversed/outside ranges and overflowing windows → CITE_LINE_RANGE; duplicate pages → DUPLICATE_PAGE; unavailable initial page or page above total → CITE_PAGE_RANGE. Duplicate facts/entities → DUPLICATE_ID; invalid observedAt → FACT_TIME; unknown initial entity → ENTITY_SELECTION; unsupported/remote image → ENTITY_IMAGE. Unsafe links → UNSAFE_URL. Missing required fields, numeric facts, excess arrays and provider/HTML/execution extras are structural errors. Reject rather than silently repair, drop, coerce or invent content.
