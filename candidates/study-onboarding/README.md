# Original supplied study demonstrations

Exact successor `c6e7999128b2c4f3474bb40d27ba50958b20f3f6` passes10 positive/16 negative documents,8 DOM/standalone workflows,329 unchanged prior non-Node definitions and22 selected source/build hashes. It adds one Study definition to protocol178. Canonical completion and native/reference acceptance remain separate.

The [original example](examples/original-study.json) supplies a two-marker orbit toy, two public teaching questions and four explicit chart observations. These are invented illustrative parameters, not astronomy measurements or a scientific model. No private reference artwork or live data is bundled.

`conversational-onboarding-study` requires an accessible label and three resolved presentations: `visual`, `quiz`, and `mathGraph`. Each has its own label and question. Pending/failed stubs omit the detailed presentations; failure text is literal, or the component hides without fallback.

## Three real interactions

- Visual supplies1–8 unique orbits with positive radius/period, bounded marker size and exact RGB color. The day slider is0–3650 in increments of5. This fixture starts at10; local reset goes to0, while native form reset restores the supplied10. Marker/ring coordinates and cycle labels are derived only from supplied toy parameters.
- Quiz reuses the actual finite `QuizQuestion` contract. The fixture includes single and exact-match multiple choice, explicit correct IDs, explanations and weighted points. The consumer really answers, checks feedback, observes1/3, reviews and restarts. Answers are public document data. There is no remote grading, scoring service or persistence.
- Graph supplies strictly increasing numeric x and numeric-or-null y. The fixture keeps x gaps1 versus8, true0, a negative value and a null gap. The actual chart provides series visibility, keyboard readout and an accessible table. No fitted/interpolated values are manufactured.

Tab selection keeps quiz/chart instances mounted. Frozen local `iui:onboarding-tab` detail records the requested and previous tabs; the [host adapter](consumer.mjs) demonstrates cancellation. Tabs use roving focus, LTR/RTL arrows and Home/End. Modified/composing input is ignored. Accepted native reset rebuilds initial quiz/chart state; canceled reset and newer local input retain their current work. Replacement is atomic, and update/dispose retire old embedded controls.

The originalba79 source had a real native-form reset defect: the chart checkbox became unchecked while its3 points stayed visible. That exact consumer assertion and original source lock are retained as predecessor evidence; only the fixedc6e successor is recommended here. Its reset restores a checked legend and matching visible series. Passing unrelated predecessor flows is not treated as a full pass.

```sh
node --test tests/study-onboarding.test.mjs
node candidates/study-onboarding/verify-source.mjs --library /path/to/exact/source-built-runtime
```

Both Node/browser validators and Learning schema closure are checked. The compiled standalone script actually runs the supplied quiz and chart in JSDOM, and stylesheet bytes equal the runtime exports. External requests/service calls are0. DOM geometry does not establish native browser rendering, CSP enforcement or pixel fidelity. Existing164/CDN locks and earlier consumers remain unchanged.
