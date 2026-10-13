# Current 219-node authoring catalog

Use the [category index](index.json), then the complete selected module task pack. This version has 219 registered protocol nodes in 91 source modules, including the additive `rating-summary`. The 218-node [previous catalog](../progressive/index.json), its [entry snapshot](../../SKILL.cd1c545.md), source locks, schema bytes and measured results remain unchanged. The [version selector](../catalog-versions.json) identifies both versions explicitly.

219 is schema coverage, not 219 completed source/visual acceptances. The original 212/256 capability inventory is a separate historical measure. The `native` node remains a compatibility rejection boundary. Only the reviewed controls have this batch's specific alignment scope; the rest still need individual visual and behavior review.

## Read-only rating display or editable input

Read the entire [rating-summary task](modules/content/rating-summary.json) before authoring. It provides the exact closed schema, adjacent semantics and original examples.

- `rating-summary` is supplied text: required `ratingLabel`, optional `reviewCountLabel`, and optional `provider` with both `label` and `url`. The labels are literal strings of 1–200 Unicode code points. URLs are literal strings of 1–2,048 Unicode code points and must pass the same-version absolute HTTP(S) safe-URL validation.
- A single decorative solid star precedes the labels. With a provider, the whole row is a native same-tab link. Labels remain text; there is no logo, editable value, rounding, lookup or verification service.
- Omit an unavailable review count or supply an explicit unknown label. Do not invent zero, ratings, endorsements or provider identity. Hosts supply localization and punctuation.
- Existing `rating` is the separate project-local state-bound radio input. Do not substitute it for a supplied average. Existing `toggle` is a native checkbox extension with no established canonical source mapping.
- Slider and segmented-control changes are presentation corrections. Their value, keyboard and reset contracts remain. Do not infer a stepped/dotted slider mode from numeric `step`.

[The original current example](examples/rating-summary.json) includes omitted and unknown counts, literal markup-looking text and a synthetic source. It is nonmedical, unverified supplied data. Run full validation before mounting: structural schema success alone does not establish URL safety.

## Pin source, schema and renderer together

The fixed source is [5849d9ba6352da8f3fe32dcf3525d0418129e3f8](https://github.com/Micraow/Inform-UI/commit/5849d9ba6352da8f3fe32dcf3525d0418129e3f8). [The publication receipt](source-public.json) binds its source files, module contracts, examples and canonical schema to exact public Git blobs and SHA-256 hashes. Install that source's declared dependencies, and build that exact checkout. A local source commit is not a verified public release until the receipt establishes it.

```sh
git clone https://github.com/Micraow/Inform-UI.git Inform-UI
git -C Inform-UI checkout --detach 5849d9ba6352da8f3fe32dcf3525d0418129e3f8
npm --prefix Inform-UI ci
npm --prefix Inform-UI run build
node Inform-UI/bin/iui.mjs validate authoring/current219/examples/rating-summary.json --json
node Inform-UI/bin/iui.mjs build authoring/current219/examples/rating-summary.json --out rating-summary.html --lang zh-CN
```

The Node compiler produces self-contained HTML using the matching renderer. It is not a browser API. Do not mix an old 214/218 CDN schema or renderer with this 219-node source contract. The receipt and source catalog do not claim that an independently pinned CDN package was updated.

## Complete selected contracts

The default selection is a source module plus declared dependencies, not arbitrary individual definitions. The foundational layout module still includes 41 nodes. The new `content/rating-summary` module includes only its display node and shared document dependencies; it does not import `rating` input semantics or require input state.

```sh
node scripts/progressive-source-consumer.mjs \
  --library /path/to/Inform-UI --revision 5849d9ba6352da8f3fe32dcf3525d0418129e3f8 \
  --components text,rating-summary --root document --output rating-task.json
```

Read the complete returned schema, all semantic contracts and examples. A node root is not a complete document validator. Never concatenate `$defs` manually. Cross-module documents and Web Chat can use the [full generated schema](webchat/iui.schema.json), byte-identical to the canonical schema at this source pin. Run same-version `validateDocument` and the actual task's keyboard, reset, cancellation and lifecycle checks.

## Reproduce and inspect evidence

```sh
node scripts/generate-progressive-catalog.mjs \
  --library /path/to/Inform-UI --revision 5849d9ba6352da8f3fe32dcf3525d0418129e3f8 \
  --publication authoring/current219/source-public.json \
  --catalog-version current219 --output authoring/current219
node scripts/verify-progressive-source.mjs \
  --library /path/to/Inform-UI --revision 5849d9ba6352da8f3fe32dcf3525d0418129e3f8 \
  --publication authoring/current219/source-public.json \
  --catalog-version current219 --generated authoring/current219
node scripts/verify-current-authoring.mjs --library /path/to/Inform-UI
node --test --test-concurrency=1 tests/current-authoring.test.mjs
```

[Generation identities](generation.json) account for each complete module reading path in UTF-8 bytes. [Entry migration](entry-migration.json) binds the preserved 218 materials and new entry. The recorded checks cover source discovery, complete structural contracts and the actual current CLI. They do not establish token savings, model quality, all-component visual parity, human screen-reader acceptance or full WCAG compliance. Historical measurements remain attached to their exact old entry and source.
