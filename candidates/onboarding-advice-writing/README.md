# Original advice and writing demonstrations

Exact source `744c19b44820a951b663c9646ad011656aa65812` passes8 positive/12 negative documents,6 DOM/compiler groups,324 unchanged prior non-Node definitions and22 selected source/build hashes. Protocol174 registration is separate from functional/native acceptance.

[The original fixture](examples/original-demonstrations.json) supplies two complete three-tab demonstrations. It includes an independently drawn panel, imaginary paper shapes, a fictional recipe layout and invented writing samples. No private reference content or message to an actual recipient is used.

- `conversational-onboarding-advice` requires `stepByStep`, `recipe` and `quickFix`. Each has a label and question. The first supplies title, diagnosis, numbered steps and an optional safe image. Recipe supplies name and passive Markdown. Quick-fix supplies title, diagnostic question and next step.
- `conversational-onboarding-writing` requires `translation`, `email` and `message`. Translation preserves supplied source/translated whitespace. Email supplies subject and passive Markdown. Message supplies passive Markdown. These are supplied demonstrations: no advice generation, translation service, message sending or account registration occurs.
- `activeTab` selects a known initial presentation. Common label, disabled, pending/resolved/failed status and fallback are finite author inputs. Empty text bodies/step lists remain valid; labels and questions must be nonblank.

The [host adapter](consumer.mjs) cancels a local tab request and records its ID as text. Frozen `iui:onboarding-tab` detail is `{id,kind,tab,previousTab}`; it bubbles, is cancelable and does not cross Shadow DOM. Accepted requests change only local selection. Markdown uses the existing bounded passive renderer, producing no actionable links or external image requests.

Tabs have stable tablist/tabpanel IDs. Arrow keys follow supplied layout direction; Home/End select endpoints. Modifiers and IME input are ignored. Canceled native reset preserves selection, accepted reset restores the explicit initial tab, and newer selection wins queued reconciliation. Switching away releases supplied images; invalid update is atomic, and update/dispose retire old controls.

```sh
node --test tests/onboarding-advice-writing.test.mjs
node candidates/onboarding-advice-writing/verify-source.mjs --library /path/to/exact/source-built-runtime
```

The actual compiled stylesheet equals both Node/browser exports and includes this family. External requests are0. Compiled standalone script, native keyboard/layout, pixels and live services are not executed. This targeted consumer does not exercise the inherited Voice reset defect in the174 predecessor; that family has its own failure evidence and successor lock. Existing164 and earlier CDN locks remain unchanged. Search/Study onboarding have different contracts and are not represented here.
