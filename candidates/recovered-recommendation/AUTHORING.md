# A short recommendation schema

Use one Base-owned `recommendation-card`: required `label` and explicit `status`. For `resolved`, supply `canOpenConversation:boolean` and `data` containing `conversationId`, `title` and `description`. Description may be empty. Optional emoji is literal text; optional `iconData` accepts inline raster only, never a remote or SVG source.

`pending` and `failed` are separate strict envelopes: omit data and capability fields. Pending reserves the original 88px loading block. Failed shows only optional supplied `fallback`, otherwise hidden. Do not synthesize a retry action.

Keep the original full-width card arrangement: 40px image/emoji slot, 16px row padding/gap, title above description with 4px text gap. Use the supplied scene directly rather than adding a generic dashboard wrapper. Host variants and native rendering remain separate from verified standard-web static roles.

Activation emits frozen cancelable `iui:recommendation-card` with `{componentId,conversationId}`. Capability false disables the action. The example host only records the ID; a real host must provide any authorized navigation itself.

Use Base schema closure for the card, and the full schema or appropriate Base+Finance union when combining TransactionDetail. Always finish with `validateDocument`, since whitespace-only names and unsafe icon data are semantic errors beyond the structural schema.

For CopyWords, busy progress uses `aria-busy` plus a local single-flight lock. Empty activation gives selection guidance. Explicit host `aria-disabled="true"` still blocks activation and is preserved through paints; never set it merely to indicate an operation's own progress and then expect the same guarded operation to continue.

For renderer work, use the restored `RendererContext.lifecycle`: `during` checks a synchronous boundary; `acquire` also compensates a resource obtained after reentrant retirement. Hold the local intent lock before invoking replaceable event constructors. The shared `docs/render-generation-contract.md` has executable boundary examples. A permanent ancestor observer or the lost componentScope scaffold must not be advertised as restored.
