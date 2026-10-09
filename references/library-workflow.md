# Validate and render with the actual library

For web chat without a terminal, copy the complete [root SKILL.md](../SKILL.md): it contains the CDN HTML shell and a self-contained authoring subset. Deep domains follow the root discovery index → same-pin Document schema → example. Web Chat without external retrieval can receive the [complete guide](../WEB-CHAT-GUIDE.md) or full schema. This page is optional guidance for agents with a local checkout.

The library lives at [Micraow/Inform-UI](https://github.com/Micraow/Inform-UI). Its current local package name is `@micraow/inform-ui`, version `0.1.0`. This repository does **not** assume an npm release. Use the exact source revision in [library-contract.json](../library-contract.json); CI checks out that revision rather than a moving branch.

## Checkout workflow

With this skill checkout and the library in sibling directories, install and build the library first:

```sh
cd ../Inform-UI
npm ci
npm run build
cd ../Inform-UI-skill
node ../Inform-UI/bin/iui.mjs validate examples/hpcc-feedback.json --json
node ../Inform-UI/bin/iui.mjs build examples/hpcc-feedback.json --out artifacts/hpcc.html --lang zh-CN
```

Use a browser to inspect `artifacts/hpcc.html`. It is the independent library's standalone HTML output. The same library can also be embedded in a webpage; these are delivery options, not different editions. No tool in this skill installs itself, calls a model or changes an account.

To check every fixture against the real API and CLI:

```sh
npm test
npm run check:library -- --library ../Inform-UI
npm run check:schema -- --library ../Inform-UI
npm run check:inventory -- --library ../Inform-UI
npm run check:components -- --library ../Inform-UI
npm run check:primitives -- --library ../Inform-UI
```

Use `--library` with the actual checkout path; the script also accepts `IUI_LIBRARY_DIR`. The script never downloads or silently swaps a missing dependency. Rebuild the library after changing its source. The default check verifies the checkout HEAD against the pin. Use `--allow-working-tree` only for deliberate local development; it does not establish release compatibility.

## Schema discovery

`library-contract.json` pins the runtime, full schema and `cdn.schemaIndex` together. Resolve every metadata and example path against that index URL, not against the repository root. Use `documentSchema` for authoring (base plus the selected domain); `nodeSchema` is field lookup only, with a Node root and domain-restricted recursive children. The complete schema remains authoritative. For mixed domains, run `node scripts/schema-subset.mjs --groups base,forms,charts,finance --out union.schema.json` in the exact library checkout. Structural validation never replaces `validateDocument` semantic checks. Index token estimates are only Unicode code points / 4 rounded up, not measured model token counts.

`check:schema` checks all 11 groups, 23 schema files and 17 examples, local reference closure, hashes, metadata, unique node ownership, native rejection boundaries and a real cross-domain union. The browser suite additionally reads the real CDN index and selected bundles/examples from a file:// page with cache disabled.

## ESM API

When the built checkout is installed as a local dependency in a host application:

```js
import { validateDocument, compileHtml } from '@micraow/inform-ui';

const result = validateDocument(document);
if (!result.ok) {
  // Each issue has a code, JSON-pointer path and message.
  throw new Error(JSON.stringify(result.issues));
}
const html = await compileHtml(result.document, {
  backend: 'portable',
  assets: 'inline'
});
```

The integration script resolves the checkout's actual package exports to exercise these functions without needing a registry publication. `compileHtml` validates its input too; keep the explicit first pass for actionable diagnostics.

### Evaluate a state change

For `examples/hpcc-feedback.json` validated as `result` above, inspect one input change without rendering:

```js
import { evaluateState } from '@micraow/inform-ui';
const next = evaluateState(result.document, { middleLoad: 0.9 });
if (!next.ok) throw new Error(JSON.stringify(next.issues));
console.log(next.state.middleLoad, next.computed.maximumLoad); // 0.9 0.9
```

Success is `{ ok: true, state, computed }`, with read-only value maps. Failure is `{ ok: false, issues: [{ code, path, message }] }`; check `ok` before accessing results. Computed values are in `computed`, not `state` or a returned `document`.

The second argument overrides declared initial state. Each call starts from the document's initial state, so pass current state explicitly when continuing a sequence. Unknown keys, including computed names, return `UNKNOWN_BIND`; changing a primitive type returns `INPUT_TYPE`; an out-of-range slider value returns `INPUT_RANGE`. This function evaluates data only; use the mounted controller's `setState` to update a visible UI.

For browser embedding, the library exposes `mount` through its browser entrypoint and returns `update`, `dispose`, `getState` and `setState`. The skill does not implement that lifecycle. Follow the matched library's documentation and dispose the controller when the host removes the view.

## Keep compatibility honest

Change the pinned revision only after validating examples, negative cases and browser behavior. A schema version alone is not evidence that every renderer has the same features. `portable` names the independent library's backend. Historical `native` input is recognized only to return an explicit unsupported diagnostic; a private/native edition is not a prerequisite or planned dependency. Do not write `npx iui` or claim a released package exists until publication, ownership and the executable name are verified.

## Browser regression

The matched library checkout includes Playwright as a development dependency. Install its Chromium browser with `npx --no-install playwright install chromium` from that checkout, then run:

```sh
npm run check:browser -- --library ../Inform-UI
```

The script checks all twenty-one fixtures at 390/1280 px in light/dark themes, no whole-page overflow or browser errors, keyboard slider updates, form submit/cancel and invalid drafts, weather unit/date/table controls, true-coordinate geometry and timestamp readout, reset and table disclosure, supplied sports filters/selection/sorting, and complete local quiz/flashcard flows, financial missing values/range/common-baseline comparison, heatmap weight ratios/filter/keyboard/full table, same-SVG keyboard-to-pointer switching, converter drafts/units/modes/swaps/resets, and auxiliary renderer boundaries. Foundation, time, overlay, numeric-draft, primitives, auxiliary, converter, sports, learning, finance and heatmap fixtures use the current root HTML shell and its real fixed CDN. Use `--screenshots artifacts/screenshots` to inspect original rendered output locally; screenshots are not committed; CI may retain only original generated fixture screenshots as short-lived artifacts. Historical 41-node and 46-node blind acceptance each use their own frozen library checkouts from tests/blind/library-contract.json and tests/blind46/library-contract.json. `IUI_BROWSER_EXECUTABLE` can select an already-installed compatible Chromium. API checks and browser checks are separate: report a browser launch failure as unverified rendering, not a passing preview.

The additional `npm run check:components:browser -- --library ../Inform-UI --screenshots artifacts/components` runs seven current-component documents at 390/768/1100 px in both themes (42 views), with actual keyboard/pointer actions, timer controls, nested overlays, number draft/host-state rules, flow/icon/pulse semantics and reduced-motion checks. It consumes the frozen library inline build; the main browser suite separately exercises the real pinned CDN HTML shell. Prepared checks are not passed results; see the [current acceptance record](schema-discovery.md).
