# Validate and render with the actual library

The library lives at [Micraow/Intelligent-UI](https://github.com/Micraow/Intelligent-UI). Its current local package name is `@micraow/intelligent-ui`, version `0.1.0`. This repository does **not** assume an npm release. Use the exact source revision in [library-contract.json](../library-contract.json); CI checks out that revision rather than a moving branch.

## Checkout workflow

With this skill checkout and the library in sibling directories, install and build the library first:

```sh
cd ../Intelligent-UI
npm ci
npm run build
cd ../Intelligent-UI-skill
node ../Intelligent-UI/bin/iui.mjs validate examples/hpcc-feedback.json --json
node ../Intelligent-UI/bin/iui.mjs build examples/hpcc-feedback.json --out artifacts/hpcc.html --lang zh-CN
```

Use a browser to inspect `artifacts/hpcc.html`. It is a local portable rendering, not a native ChatGPT widget. No tool in this skill installs itself, calls a model or changes an account.

To check every fixture against the real API and CLI:

```sh
npm test
npm run check:library -- --library ../Intelligent-UI
```

Use `--library` with the actual checkout path; the script also accepts `IUI_LIBRARY_DIR`. The script never downloads or silently swaps a missing dependency. Rebuild the library after changing its source. The default check verifies the checkout HEAD against the pin. Use `--allow-working-tree` only for deliberate local development; it does not establish release compatibility.

## ESM API

When the built checkout is installed as a local dependency in a host application:

```js
import { validateDocument, compileHtml } from '@micraow/intelligent-ui';

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

For browser embedding, the library exposes `mount` through its browser entrypoint and returns `update`, `dispose`, `getState` and `setState`. The skill does not implement that lifecycle. Follow the matched library's documentation and dispose the controller when the host removes the view.

## Keep compatibility honest

Change the pinned revision only after validating examples, negative cases and browser behavior. A schema version alone is not evidence that every renderer has the same features. `native` input is deliberately rejected by this portable baseline. Do not write `npx iui` or claim a released package exists until publication, ownership and the executable name are verified.

## Browser regression

The matched library checkout includes Playwright as a development dependency. Install its Chromium browser with `npx --no-install playwright install chromium` from that checkout, then run:

```sh
npm run check:browser -- --library ../Intelligent-UI
```

The script checks all five fixtures at 390/1280 px in light/dark themes, no whole-page overflow or browser errors, keyboard slider updates, reset and table disclosure. Use `--screenshots artifacts/screenshots` to inspect original rendered output locally; screenshots are not committed or uploaded by CI. `IUI_BROWSER_EXECUTABLE` can select an already-installed compatible Chromium. API checks and browser checks are separate: report a browser launch failure as unverified rendering, not a passing preview.
