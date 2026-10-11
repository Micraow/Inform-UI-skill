# Original local details and file requests

Exact sourcecbba6f1903b89d3380da2761b4f8e5e7f0eaabbc passes10 positive/14 negative documents,7 DOM/compiler groups,314 unchanged historical definitions and19 selected source/build hashes. Protocol166 is a registration count; canonical scope and native/reference acceptance are separate.

## Keep the default request small

The original [paper-notebook fixture](examples/original-requests.json) contains no personal answers or real files. Both components use a nonblank `label`, optional phase/fallback, `showCTA`, and supplied capability/disabled flags.

- `ask-user-details` needs `buttonLabel`, `submitLabel` and at most20 `questions`. A question has a unique `id`, `label`, optional `kind:text|textarea|select`, required flag, maximum length and initial value. Select fields need finite unique value/label options. Explicit `enabled:true` is required; unknown capability leaves this CTA disabled.
- `ask-user-files` needs a resolved `kind:file|photo|video|media`. Supplied kind-specific button labels or `buttonLabel` control the text. Explicit `enabled:false` disables it; unknown capability still permits a local request.
- Default activation only emits deeply frozen local `iui:ask-user-details` or `iui:ask-user-files`. It does not open a picker, contact an input service or request device access. Cancellation preserves presentation.

## Optional project-owned local review

`localReview:true` enables an inline review after an accepted request. This is an original extension, not a claim to reproduce an external host input/upload service. Text/textarea/select fields have no form submission names; single-line Enter is prevented from implicitly submitting a surrounding host form.

The example [host adapter](consumer.mjs) cancels answer/metadata submissions by default. Accepted local submissions only set a local status label. Details emit copied frozen `{id,answers:[{id,value}]}`. Files emit copied frozen `{id,kind,files:[{name,size,type,lastModified}]}`. No File object or path is retained in that detail.

The test injects synthetic metadata into the file input; it does not operate a real native picker or inspect real files. It checks0-byte data, literal filenames, count/size limits, and supplied MIME-kind checks. MIME checks do not inspect content or establish file safety. Guards fail if FileReader, text/arrayBuffer/stream, object URLs or fetch are used. Measured body reads and external requests are both0.

Canceled submit retains editable state. Canceled close/reset retains edits; accepted close/reset clears metadata and restores supplied initial values. Newer input wins pending-reset reconciliation. Update during delivery retires the old review. Shared generation/reset machinery is reused; TextArea was added only to the existing control type union.

```sh
node --test tests/ask-user.test.mjs
node candidates/ask-user/verify-source.mjs --library /path/to/exact/source-built-runtime
```

The base selected schema and both Node/browser validator exports are checked. Actual compiled CSS matches the runtime style exports. The verifier parses compiled HTML but does not execute its script. No existing164 CDN lock is changed. Native picker, native keyboard/layout, pixels, remote CI and live upload/account services are outside these source-built results.
