# More Base authoring: supplied jobs, product choice and related questions

Use these exact distinct nodes: `jobs`, `product-card`, `sidebar-people-also-ask`. Every record, answer, price and status is supplied by the author. No live data, ranking, applications, purchases, answer generation or model-provider binding is implied. All three belong to Base, so keep their practical usage here in SKILL.md; domain-specific schemas remain generated subsets of the single full schema.

## jobs: show supplied opportunities and a local shortlist

Choose `jobs` when the reader needs to compare supplied job records and keep a local shortlist. Required `label` (1–200 code points) and `jobs` (0–40 records); optional `description` (up to2000), source and ordinary node ID. Each job requires unique key `id`, `title`, `organization`, `location`, `workplace`, and `employment`. Workplace is `remote`, `hybrid`, `onsite`, or `unknown`; employment is `full-time`, `part-time`, `contract`, `internship`, or `unknown`. Preserve unknown classifications instead of guessing from prose.

Optional job description is plain text. Salary is `{minimum,maximum,currency,period}` with 0≤minimum≤maximum≤1e12, supplied uppercase three-letter currency label, and hour/month/year period. No conversion occurs. Optional `postedDate` and `deadlineDate` are real Gregorian YYYY-MM-DD dates, years1000–9999, and deadline cannot precede posting. These are supplied dates, not proof that an opening is live, expired, suitable or recommended. Optional job URL and source URL must be allowed absolute HTTP(S).

Search matches title/organization/location; workplace/employment filters combine. A shortlist click emits frozen, bubbling, cancelable, non-composed `iui:job-shortlist` detail `{componentId,jobId,shortlisted}`. Accepted clicks toggle only local state; cancellation keeps prior state. Shortlist-only filtering may hide a removed row and intentionally relocates focus. Reset clears filters but preserves the shortlist. No application, message, upload, account or persistence follows.

```json upcoming103-only
{"version":"iui/1","body":[{"type":"jobs","label":"Supplied examples, not live openings","jobs":[{"id":"role_one","title":"Example engineer","organization":"Example studio","location":"Region as supplied","workplace":"remote","employment":"full-time","salary":{"minimum":80000,"maximum":100000,"currency":"USD","period":"year"},"postedDate":"2028-02-29","deadlineDate":"2028-03-15"},{"id":"role_two","title":"Example researcher","organization":"Example lab","location":"Not specified by source","workplace":"unknown","employment":"unknown"}]}]}
```

## product-card: review a supplied local choice

Choose `product-card` for a product snapshot whose supplied variants and quantity need a local review step. Required `productId` (local key), `name` (1–200), and `availability` (`available`, `unavailable`, `unknown`). Optional brand/seller (1–200), description (up to5000), price, 0–12 variants, initialVariantId, initialQuantity, disabled, source, embedded image and ordinary node ID.

A price is `{amount,currency}` with finite amount0–1e12 and uppercase three-letter supplied currency label. A variant has unique key `id`, label1–200, availability, and optional price. Selected variant price overrides base price; otherwise it inherits the base price. No price anywhere remains unknown, while amount0 is a real zero. When variants exist, require an explicit selection or valid initialVariantId; never auto-select a guessed preference.

Initial quantity is an integer1–20. Runtime quantity text accepts ordinary decimal notation, optional leading zeros and trailing `.0` digits, capped at64 characters. Exponents and nonzero fractional tails are rejected, not rounded. The UI computes an exact decimal item subtotal only. Do not label it a checkout total or invent fees, tax, shipping, discounts, stock or exchange rates.

Review emits frozen cancelable `iui:product-choice` detail `{componentId,productId,variantId,quantity,availability,unitPrice,itemSubtotal}`, including a frozen nested price. Supplied unavailable status, missing required variant or invalid quantity blocks review. Unknown availability may be reviewed locally and remains unknown in the detail. Cancellation retains the draft; explicit review may be repeated and synchronous reentry is blocked. Reset restores the authored draft. No cart, purchase, reservation or payment is made.

Optional image is `{src,alt}`: bounded embedded base64 PNG/JPEG/WebP only, src up to300000 characters and alt1–2000. Remote URLs, SVG and animated GIF are rejected. Decode failure shows a local fallback. Prefer omitting an image over inventing or fetching one.

```json upcoming103-only
{"version":"iui/1","body":[{"type":"product-card","productId":"sample_notebook","name":"Supplied notebook example","availability":"unknown","price":{"amount":12.5,"currency":"USD"},"variants":[{"id":"plain","label":"Plain cover","availability":"available"},{"id":"grid","label":"Grid cover","availability":"unknown","price":{"amount":13.75,"currency":"USD"}}],"initialVariantId":"plain","initialQuantity":2,"description":"Local review only. Availability is supplied, not checked."}]}
```

## sidebar-people-also-ask: read supplied questions and provenance

Choose this node for supplied questions with explicit answer/missing-answer semantics and per-answer sources. It does not discover popular questions, rank relevance, search externally, generate answers, verify truth or infer authority. It is not a generic accordion alias.

Required `label` (1–200) and `items` (0–40). Optional description up to2000 and initially `expanded` supplied IDs (0–40, unique). Each item requires a unique key ID, question1–500, and answer either null or a string0–10000 code points. Null means no answer supplied. Empty string is an exactly empty answer and must not be rewritten as missing. Optional sources has at most5 `{label,url}` records, with label1–200 and allowed absolute HTTP(S) URL.

Native disclosures preserve order and may stay open together. Local case-insensitive substring search covers question and literal answer text; max200 UTF-16 units, rejecting oversized forged input without replacing the accepted query. Clear and external native reset clear only search, preserving reading state. Distinguish empty collection, no matches, no supplied answer and no supplied source.

```json upcoming103-only
{"version":"iui/1","body":[{"type":"sidebar-people-also-ask","label":"Questions about this supplied sample","expanded":["scope"],"items":[{"id":"scope","question":"What is supplied here?","answer":"An original local example. No external search or answer generation occurs.","sources":[{"label":"Illustrative source","url":"https://example.org/reference"}]},{"id":"unverified","question":"Was the source independently verified?","answer":null},{"id":"empty","question":"What is the exactly empty supplied response?","answer":""}]}]}
```

## Local controls, safe links and rejection examples

All text is literal. HTTP(S) links open separately with opener/referrer protection and never preload. Controls use no binding or payload name and do not enter host FormData/action snapshots. Unrelated state updates preserve local draft/filter/disclosure state. Update replaces authored content; disposal retires handlers. Disabled/pending, hidden/inert, detached and outside-owned controls cannot activate or be rewritten; event construction and dispatch are interruption boundaries.

Reject duplicate job/variant/question IDs with `DUPLICATE_ID` at the later ID. Reject impossible job dates with `JOB_DATE`, reversed dates with `JOB_DATE_ORDER` at deadlineDate, and reversed pay with `JOB_PAY_RANGE` at salary.maximum. Unknown initial variant is `PRODUCT_VARIANT`; remote/unsupported image is `PRODUCT_IMAGE`; unsafe links are `UNSAFE_URL`. Unknown expanded question is `QUESTION_REFERENCE`; duplicate expansion is `DUPLICATE_ID`. Forbidden provider/HTML/binding fields, fractional initial quantity and excess arrays are structural errors. Do not strip bad fields, silently round or repair invalid documents.
