# Generate and deliver an answer

## Webchat workflow without tools

Provide SKILL.md, the relevant generated/modules/*.txt or generated/views/*.txt file(s), and a verified runtime URL or the supplied local bundle. The AI writes a complete HTML answer from that contract. It does not need React, JSX, npm, a build system, or a backend. If the chat environment cannot read attachments or render HTML, deliver the HTML and required runtime file(s) for opening in a browser; do not claim an in-chat renderer exists.

Use the same module and optional viewNames selection in the prompt and mount configuration. Each selected profile includes its declared dependency closure. All answer profiles need base/layout because their root is Stack. The complete directory is generated; do not infer constructor signatures from old JSON component names.

## CLI workflow

Run from this Skill directory with Node 22 or later. No npm install is necessary.

    node scripts/inform-answer.mjs catalog
    node scripts/inform-answer.mjs prompt --select base/layout,base/controls,base/charts --out prompt.txt
    node scripts/inform-answer.mjs icons --query chart --limit 8
    node scripts/inform-answer.mjs check examples/filter-sort-chart.openui --select base/layout,base/controls,base/charts
    node scripts/inform-answer.mjs build examples/filter-sort-chart.openui --out output/answer.html --title "Activity feedback" --lang zh-CN --select base/layout,base/controls,base/charts

Build validates with the actual strict parser and runtime, then writes HTML and copies inform-ui.global.js plus THIRD_PARTY_NOTICES.txt next to it. Keep these three files together. Opening answer.html loads its sibling JS directly, including from file://. Charts and UI frameworks are already bundled. External images, fonts, links or host services can have additional network requirements; do not call those offline.

For a verified release URL, pass --runtime-url with the exact HTTPS URL. The CLI does not verify network availability or matching content for that URL: verify its bytes/version separately against generated/runtime-lock.json. Web Chat profiles use the project-maintained `web-chat-latest` branch by default; it is mutable and may be cached. For reproducible local output, keep the bundled runtime. Do not substitute a guessed CDN URL or jsDelivr’s reserved `@latest` selector. --runtime-dir permits validation and copying from another verified dist/v2; regenerate Skill contracts when switching versions.

## Actual browser API

Global bundle: InformUI.mount(element, {source, select?, viewNames?, theme?, allowImageURL?, allowMediaURL?, onError?}). theme is light or dark. allowImageURL and allowMediaURL are trusted host predicates, not DSL code. Video is a supplied-source player, not a media search or generation service. Do not weaken the default image policy just to make an untrusted URL render. onError receives issue objects.

InformUI.createProfile({select?, viewNames?}) provides manifest(), schema, components, componentRules, dataShapeRules and prompt({bindings:true,builtinFunctions:true}). createDefaultProfile() includes all registered modules. viewNames is an optional list of exact View constructor names; it filters actual definitions, data shapes and their prompt, not just text. Required restricted child slots add their declared View dependencies: TabGroupView also includes TabPanelView. The generated catalog records each per-View selection and its dependency closure. Use it with the corresponding views/* modules in select. Selecting a smaller profile limits the available language contract; the eager browser file itself stays the same size.

mount returns element, runtime, profile, commit(source), preview(source), getSnapshot(), setTheme(theme), and dispose(). Dispose when removing the answer. Successful commit resets that program's state. preview disables interactions and must be followed by a successful final commit. Do not treat getSnapshot() as proof of successful DOM rendering if onError has reported a renderer failure.

The generated HTML has no eval, Function constructor, or module loader supplied by DSL. Its fixed bootstrap does use an inline script and styles; a deployed CSP must authorize those via hashes/nonces or split them into trusted static files. A no-eval Node test is not proof that an arbitrary production CSP or embedding sandbox permits the HTML.

## Three complete examples

- budget-choice: an actual recommendation, budget shortlist, sorting, local choice, reset, and warning when a retained choice exceeds the new budget. All prices and options are explicitly fictional.
- filter-sort-chart: one derived dataset drives the summary, chart and accessible table; includes threshold, sorting, arithmetic and empty-state handling.
- composed-explanation: a complete explanation of mean and median using base controls/charts plus MetricView, FigureView, SectionView, StepsView, MathView, DetailsView and CitationView. A verified NIST source supports the definitions; the numbers are original synthetic data.

Run npm run check to regenerate all example HTML and run the strict runtime, generation and CLI tests. The browser suite is separate: node scripts/test-browser.mjs --playwright /path/to/node_modules/@playwright/test/index.mjs. It checks file:// opening, state interactions and narrow-layout overflow with an installed Playwright/Chromium. For an explicitly supplied system Chromium in an isolated test container, add --executable /usr/bin/chromium; that path uses --no-sandbox. The script never downloads a browser. Record browser checks separately from parser/runtime checks.

## Maintaining the generated contract

    node --max-old-space-size=512 scripts/sync-runtime.mjs --runtime-dir /verified/repo/dist/v2 --icons /verified/repo/src/icons/catalog.json --chart-coverage /verified/repo/packages/chart-extension/generated/upstream-prop-coverage.json --expect-components 233 --source-ref FULL_COMMIT_SHA
    npm run check

Use only a built, integrated runtime. sync-runtime generates the component directory, per-module prompts, signatures, JSON schema and glyph index from that runtime and its machine catalog, then records bundle hashes. It refuses an accidental full-glyph prompt or a prompt recommending disabled action capabilities. The sync script does not deploy or publish. Never claim a complete set of real components using a contract-only/mock renderer package; the owner must separately verify actual DOM adapters and browser behavior.

Keep vendor notices with copied browser assets. Do not include private captures, credentials, user conversations or internal project notes in a public Skill or example.
