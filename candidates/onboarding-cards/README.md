# Original finite onboarding cards

Exact runtime source `7a324cae9eb31e0e8d24597bf959009d32e445f2` passes10 positive/16 negative documents,8 DOM/standalone workflows and22 selected source/build hashes. Of326 prior non-Node definitions,325 are unchanged; the sole declared existing change is the exact37c30c `LearningSpeakCardNode.resetLabel` addition. Three onboarding definitions are new. Protocol177 is separate from canonical completion.

[The original five-instance fixture](examples/original-onboarding-cards.json) contains fictional apps/tasks and two independently drawn24px panels. It supplies every state explicitly and has no account data, private reference artwork or actual service destination.

## Feature collection

`onboarding-feature-card` requires a title, up to12 features and up to20 benefits. Features have unique IDs, feature IDs, title and description. Artwork/tooltip are optional. The finite carousel keeps native scrolling and stable child nodes. Welcome Markdown is bounded and passive; links render as text.

Featured intelligence/images request `set-thinking-effort` / `open-image-composer`; other features and actionable benefits request `open-feature`. Benefits without feature IDs are passive. Frozen local `iui:onboarding-feature` detail identifies the target, item and feature. These names do not call a host API.

## Plugin suggestions

`onboarding-plugin-suggestions` requires title and up to30 finite entries with unique IDs, labels and available/connected/unavailable status. Only the first4 are displayed. Unknown capabilities hide Browse/Connect; `canBrowse:true` requires a browse label, and `canConnect:true` exposes Connect for available entries only. Disabled entries remain disabled.

Frozen `iui:onboarding-plugin` detail requests browse or connect. Connect contains the supplied plugin ID and one-based visible position. Acceptance produces only a local receipt: available does not become connected. No app is installed, authenticated or connected.

## Starter tasks

`onboarding-starter-tasks` requires a heading and up to20 unique tasks. Pills and cards require supplied prompt text. Cards additionally show descriptions/artwork and a separate action button. Preview-dependent prompts require explicit `canRequestSitePreview:true`; supplied completion styling does not by itself disable a prompt.

Selection is a separate pressed-choice variant. It accepts a known initial task ID and no prompt/preview payload. A canceled choice retains the former selection. Accepted choice changes only local pressed state. The visible local reset restores the initial choice; native form reset also clears receipts. Canceled reset preserves state, and newer selection wins queued reconciliation.

The [host adapter](consumer.mjs) cancels all three local intent families. Event details are frozen, bubbling, cancelable and non-composed. Prompt data is an explicit local request, never an actual submitted conversation turn or created task. Invalid replacement is atomic; update/dispose release old controls, carousel resources and image sources.

```sh
node --test tests/onboarding-cards.test.mjs
node candidates/onboarding-cards/verify-source.mjs --library /path/to/exact/source-built-runtime
```

Both validators, the Base schema closure and actual style equality are checked. The compiled standalone script really runs in JSDOM and mounts all5 instances; an actual local Browse event is canceled there. External requests and service calls are0. Synthetic carousel geometry is not a native layout test, and JSDOM does not establish browser CSP enforcement or pixel fidelity. No old164/CDN lock is changed.
