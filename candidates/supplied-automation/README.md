# Original supplied automation views

Exact source6742f8bfaef3f03cac547eab7a7ce7d3aec9bc92 passes the consumer below. This consumer teaches `display-automation`, `list-automations` and `automation-plan-summary` with original fictional notebook exercises. The schema describes supplied presentation and local requests. It does not connect an account, create a task, interpret a schedule or resolve a time zone.

## Author briefly and explicitly

- A display card needs `label` and `item: {id,title,scheduleLabel,url}`. Keep `scheduleLabel` literal. An item can have an emoji and a literal disabled flag.
- A list needs `label`, `headerLabel`, `emptyLabel` and finite `items`. The renderer displays the first five supplied records. Optional `viewAll: {label,url}` emits a separate local request; it does not fetch a second page.
- A plan needs `label`, `title`, `goalLabel`, supplied `statusLabels` and `steps`. Each step has `id`, `title` and explicit `completed`, `in_progress` or `pending` status. An empty array means no supplied steps; `null` needs `summaryErrorLabel` and means unavailable data.
- In chat mode, two completed steps create a disclosure group. Upcoming rows start at the first in-progress step, exclude completed rows and have a five-row cap, or three when `mobile:true` is explicitly supplied. `layout:'library'` preserves all supplied steps. `planType:'language_learning'` numbers unfinished rows and has no whole-plan collapse.
- Supply both `showPlanLabel` and `hidePlanLabel` to enable whole-plan collapse. `collapsed` and `completedExpanded` set initial state. Native reset restores these initial values after its cancellation/gating decision; toggle activation during pending reset is blocked.
- For unresolved content use `status:'pending'` or `status:'failed'` and omit active item/step data. A failed node can have literal `fallback`; without it the view is hidden.

The small [host adapter](consumer.mjs) cancels `iui:automation-open` and writes a local receipt. Frozen detail is `{id,automationId,url}`, with null `automationId` for the directory request. It never navigates. Optional cancellation of `iui:automation-toggle` preserves disclosure; its frozen detail is `{id,section,expanded}`. The domain uses existing lifecycle, ownership, admission and reset helpers rather than a second scheduler or resource registry.

## Run

```sh
node --input-type=module -e "import {writeFile} from 'node:fs/promises'; import {originalAutomationViews} from './candidates/supplied-automation/fixtures.mjs'; await writeFile('./candidates/supplied-automation/examples/original-automation.json',JSON.stringify(originalAutomationViews(),null,2)+'\\n')"
node --test tests/supplied-automation.test.mjs
node candidates/supplied-automation/verify-source.mjs --library /path/to/exact/source-built-runtime
```

Use the exact source and deterministic build bytes in `source-build-lock.safe.json`. This is a selected-file source/build lock, not a copied runtime, published CDN pin or claim that every repository file was recovered. Run the library's own install/generate/build commands before verifying a fresh exact checkout.

## Acceptance boundaries

The consumer checks 12 positive/22 negative Automation documents and 11/20 preceding collection documents through both Node and browser validator entries. It also checks the base selected schema, 308 unchanged historical non-Node definitions, four new definitions, 19 selected source/build file hashes and the actual embedded/standalone stylesheet order. The extra `ScheduledTaskSuggestionNode` registration in this source is recorded structurally and is not exercised by these Automation examples.

Eight DOM/compiler groups cover first-five data, canceled local requests, completed/whole-plan disclosure, mobile/library/learning layouts, reset, empty/null/phase states, disabled/atomic update, replacement/disposal and actual compiled CSS. All supplied URLs use `example.test`; a rejecting resource loader records unexpected external requests. Native Enter/Space behavior, native layout, reference pixels, standalone script execution and the older packaged CDN are separate checks.

The first `acae250` candidate had different CSS ordering between embedded and standalone outputs. `957dc3c` fixes that order but still fails a collapsed-plan reset assertion. The final6742f8b successor passes both unchanged assertions and all eight workflow groups; exact results are recorded in `validation-history.json`; neither earlier candidate is relabeled as fully passing. An initial consumer expectation that toggle input could act before reset settlement was corrected to the existing pending-reset gate contract, and was not counted as a runtime defect.
