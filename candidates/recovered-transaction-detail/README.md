# Recovered TransactionDetail authoring candidate

Use the local runtime fixed in `runtime-lock.safe.json`. This is recovered protocol 117, adding only canonical `ledger-transaction-detail` to the independently fixed 116 input. It does not restore the lost 148/151 branches. No public CDN deployment is asserted.

Run from the Skill root:

```sh
node candidates/recovered-transaction-detail/verify.mjs --library /absolute/path/to/ui-transaction-detail-integration
npm test
```

The check seals the permitted source-file closure and built assets before/after testing. It validates positive and negative authoring cases against browser, Node and actual CDN APIs, verifies Finance schema closure, mounts original local examples in JSDOM, and compiles standalone HTML in memory. Generated pages are not retained. The 116 candidate remains independently reproducible at its own lock.

The lock's `sourceCommit` is the checked-out frozen asset commit; `implementationSourceCommit` names its preceding source-only commit. Neither is a public upstream release. Missing/altered bytes fail before any runtime import.

`consumer.mjs` takes a caller-loaded runtime, a mount element, the JSON document and a separate output element. It cancels the component's intent and writes only a literal selected ID. It does not perform navigation, account access or a transaction.

Reference validation remains DOM/static. No native screenshot, font, pointer or pixel acceptance has been performed. The exact upstream 29 independent checks and 52 manifest hashes pass; no 117 aggregate was run. The shared ancestor retains two missing-font gates. Immediate-parent checks are available, but permanent composed-ancestor or same-turn remove/restore retirement still needs the shared owner observer.

A later unified 118 aggregate reproduced 13 older CopyWords failures: its own busy `aria-disabled` canceled copy continuation. The separate three-file source correction `00d70f19dffbb250858a0470026f2b61fc772d20` restores 50 focused and 150 affected checks without changing the common reader guard. It is not backported into this frozen 117 runtime; use the subsequent unified consumer for that correction. The TransactionDetail consumer does not certify every older component.

## Safe restore verification

The default verifier uses `runtime-lock.safe.json`, which deliberately omits repository agent-guidance metadata. The original historical lock is retained locally, unchanged, and is not required or included in the safe backup. Original commit/tree and full-source digest remain provenance records, not a claim that a sanitized checkout has that Git identity. The permitted file closure has its own digest and every included file is checked before and after runtime use. Git history and the omitted guidance file are unnecessary. `sourceCommitVerified` is false for this mode; content/asset verification remains exact.
