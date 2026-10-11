# Supplied status and guided reading

Use `ledger-finance-status-banner` for a finite status notice: `label` and optional resolved `data:{title,description}`. Status defaults to `resolved`. `pending` and `failed` forbid `data`; without supplied content/fallback the resolved/failed wrapper is hidden. Missing financial values remain unknown, and the component does not refresh accounts.

Use `prompt-checklist` for explicit supplied task state: `label`, literal `status`, and resolved `data`. Supply title, full/compact mode, tasks, completedTaskIds, expansion labels, and completion copy. Each task has id/title/prompts/tryOwnPromptText; each prompt has id/label/promptText. Keep IDs stable and refer to the same supplied task set. Use `validateDocument`, since JSON Schema alone does not reject blank text or duplicate task/prompt IDs.

Opening a task is local reading state. Only the first three prompt choices are shown. Completed IDs are caller data; clicking a choice does not alter them. Compact mode needs the supplied latest-completed context to show its compact list. Fully completed nonempty compact data shows the supplied completion screen; an empty task set never becomes completed.

Listen for `iui:prompt-checklist`, cancel it when handling locally, and read frozen `{componentId,taskId,promptId,query}`. The own-question button uses promptId:null. The example host writes a local receipt only. No query is sent, no navigation occurs, and no account action is inferred. Do not place secrets in prompt text. Images must be inline raster data; no remote images or captured private icon sources.

For a fresh supplied snapshot call the controller's `update`; do not mutate the mounted input object. Invalid updates preserve the current view. Dispose the host listener along with the controller. The runtime's shared generation boundaries handle construction/update/disposal; author hosts do not need a second component lifecycle implementation.

The Finance node belongs to the finance schema subset; PromptChecklist belongs to base. Use the finance subset (which already includes the base closure) or the full schema for this composition. The base-only subset rejects the Finance notice. Completion transitions, animation/native layout, and account connectivity are separate from schema validation. This consumer does not certify native visual fidelity.
