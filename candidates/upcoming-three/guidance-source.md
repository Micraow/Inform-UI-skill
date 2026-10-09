# Upcoming Base guidance: local poll composer and supplied readers

Draft for the next source cohort. Keep this material in SKILL.md because all three nodes belong to Base. The full schema remains the sole authored schema; generate closed Base/document and Base/node subsets from it. Do not hand-maintain a second schema. Current pending37 locks and acceptance remain separate.

## Choose the exact component

Use `create-interactive-poll` to edit a local prospective poll draft. Use `email-preview` for supplied plain text and metadata. Use `file-nav-list` for a supplied bounded metadata graph. These are separate canonical nodes, not aliases. Never invent polling services, mailbox access, filesystem operations, publishing, voting, downloads, bindings, or provider endpoints.

## create-interactive-poll

Required: `label` (1–200 Unicode code points), `options` (2–8 `{id,label}` rows). IDs must be unique strict ASCII keys, starting with a letter or underscore and followed by letters, digits, `_`, `.`, or `-`, maximum 80 characters. Option labels may initially be empty and are at most 200 code points. Optional `question` is at most 500 code points, `description` at most 2000, `multiple` and `disabled` booleans, and ordinary node `id`.

An incomplete draft is a valid document. Do not reject blank question/labels or initially repeated labels at authoring time. Prepare separately requires a nonblank trimmed question and option labels, and pairwise distinct trimmed labels. It preserves the exact original strings in the event. Duplicate IDs are always invalid.

Add, remove, and reorder are bounded local edits. Stable IDs follow rows. Preview is literal read-only draft text and may show incomplete placeholders; edits hide an outdated preview. Reset restores the authored draft. `multiple` describes prospective selection, not recorded votes. These controls do not bind document state or add FormData entries; an outside form reset leaves the draft intact.

Successful Prepare emits cancelable, bubbling, non-composed `iui:poll-ready` with frozen detail `{componentId,question,options,multiple}`; `options` and every `{id,label}` row are frozen too. A missing authored node ID becomes null. Cancellation leaves the draft intact with local not-accepted status. Ready is only a local event result. It does not publish, invite, persist, collect votes, or infer results.

```json upcoming-only
{"version":"iui/1","body":[{"type":"create-interactive-poll","label":"Draft a local question","question":"","options":[{"id":"first","label":""},{"id":"second","label":""}]}]}
```

Retained handlers never rewrite externally moved inputs or reclaim moved option rows. Prepare requires the question, multiple-mode input, and every current option input to remain owned and enabled, with checks repeated after event construction and dispatch. Host interruption cannot produce a stale ready status or focus an outside invalid input. Disabled/pending, hidden/inert, detached and moved-outside controls cannot initiate operations.

## email-preview

Required: `subject` (1–500 code points), `from` person, `to` (0–40 people), and `body` (0–20000). A person is `{address,name?}` with literal address 1–320 and optional name 1–200; it does not assert a verified mailbox. Optional `cc` (0–40), `sentAt`, `quotedText` (0–20000), `attachments` (0–20), `source`, and ordinary `id`.

Body and quoted text are rendered as text, including strings resembling markup. Never put HTML payloads or reply/forward/read mutations into the document. A long body has an explicit full/excerpt toggle. Native recipient and quoted-text disclosures preserve the supplied content.

Attachments use unique key `id`, `name` (1–200), optional integer `sizeBytes` (0–1e12), `mediaType` (1–200), `description` (up to 2000), and `url`. Missing size/type stays unknown; zero bytes is real zero. Local name search filters supplied rows without fetching previews. No automatic media, download, or thumbnail.

## file-nav-list

Required: `label` (1–200) and `entries` (0–120). Optional `description` (up to 2000), `initialFolderId`, `source`, and ordinary `id`.

Each entry has unique key `id`, `name` (1–200), and `kind` (`folder` or `file`). Optional `parentId` is null/omitted for a root entry, otherwise the ID of a supplied folder. Optional description is at most 2000. Folder entries cannot carry file-only fields. Files may add `category` (`document`, `image`, `audio`, `video`, `archive`, `other`), `sizeBytes`, `mediaType`, `modifiedAt`, and `url`. Do not guess category from extensions or MIME. Names and IDs, even containing slashes in names, are metadata rather than paths.

Parents must exist and be folders, ancestry must be acyclic, and each entry has at most four folder ancestors. `initialFolderId`, when present, must identify a supplied folder. Breadcrumbs and folder buttons navigate locally. Navigation clears search/category and focuses the destination heading; Reset filters keeps the current folder. Filters operate only in the current folder. Category filters retain navigable folders subject to name search. Missing category has an explicit not-supplied choice. Empty list, empty folder, and no matches are distinct.

Reader controls do not bind state or enter FormData. Unrelated state changes preserve local navigation, filters, disclosures and focus. Update replaces the document; dispose retires handlers. A non-canceled external native form reset restores reader filters while preserving folder/disclosures, unless disabled, hidden or inert. New explicit input wins a queued reset.

## Shared reader times and links

Times must be real Gregorian minute timestamps, years 1000–9999, with `Z` or an explicit offset no greater than ±14:00: `2028-02-29T09:00+01:00`. Reject impossible dates, seconds, floating local times and timezone names. Render supplied offsets literally; do not convert times or infer freshness.

`source` is `{label,url}` (label 1–200, URL 1–2048). Attachment/file URLs also have at most 2048 characters and must be allowed absolute HTTP(S), without credentials or unsafe whitespace. Links open with opener/referrer protection. They do not preload, resolve providers, or automatically download.

```json upcoming-only
{"version":"iui/1","body":[{"type":"email-preview","subject":"Synthetic note","from":{"address":"sender@example.org"},"to":[],"body":"<b>This remains literal text.</b>","attachments":[{"id":"empty","name":"Empty supplied file","sizeBytes":0},{"id":"unknown","name":"Unknown supplied size"}]},{"type":"file-nav-list","label":"Supplied metadata","entries":[{"id":"folder","name":"Example folder","kind":"folder"},{"id":"file","name":"literal/name.txt","kind":"file","parentId":"folder","sizeBytes":0}],"initialFolderId":"folder"}]}
```

## Rejection examples and their actual layer

- Poll duplicate option ID: `DUPLICATE_ID` at the later `/body/0/options/1/id`. Blank draft labels are valid; invalid Prepare is a runtime check, not a schema rejection.
- Reader `2027-02-29T09:00Z`: `READER_TIME` at `/body/0/sentAt` or the exact file `modifiedAt` path.
- Repeated attachment/entry ID: `DUPLICATE_ID` at the later ID.
- Missing parent or file used as parent: `FILE_PARENT` at the entry `parentId`.
- Cyclic parent chain: `FILE_CYCLE` at the affected entry `parentId`.
- Five folder ancestors: `FILE_DEPTH` at the affected entry `parentId`.
- Missing/file initial folder: `FILE_FOLDER` at `/body/0/initialFolderId`.
- `javascript:` or credential-bearing reader links: `UNSAFE_URL` at the exact URL path.
- Provider/action/binding extras, folder byte-size fields, oversized arrays or negative byte sizes: structural rejection. Never silently strip, coerce, or repair an invalid document.
