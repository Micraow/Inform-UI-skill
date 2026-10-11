# Current recovered consumers

The latest recovered consumer is [Motorsport126](candidates/restored-motorsport/README.md), pinned to local runtime asset `5efdc31a952f291263846cb4320a7890f3fe4b29`. It combines restored race-session/standing snapshots with Player and Ledger readers. Protocol 126 is distinct from the canonical inventory: 119 implemented (53 historical functional acceptances plus 66 pending), 132 not implemented, 5 partial, denominator 256.

Run its verifier against your exact rebuilt runtime:

```sh
node candidates/restored-motorsport/verify.mjs --library /absolute/path/to/ui-motorsport-restored-integration
npm test
```

The new runtime locks use permitted-file SHA256 closures. They do not require repository instructions or original Git history, and do not claim that a sanitized source tree has the original commit identity. Source commit/tree hashes remain provenance. The historical115 reuse tests additionally require fixture files in a Git index; a fresh `git init` and `git add .` is sufficient for those tests.

Original executable hosts remain local-only: the [Ledger receipt](candidates/restored-ledger-records/consumer.mjs) cancels review intent, the [guided status host](candidates/recovered-guided-status/consumer.mjs) cancels chosen prompts, and the [reading receipt](candidates/recovered-recommendation/consumer.mjs) handles supplied navigation intents without actually navigating. None connect to a provider, execute financial operations, or send model prompts. Examples are synthetic and independent JS/JSON.

Earlier immutable consumer inputs stay in recovered-card-group116, recovered-transaction-detail117, recovered-recommendation118 recovered-guided-status120 and restored-ledger-records122. Their recorded outcomes belong to their own exact pins. In particular,120's independent Prompt button-state cascade failures were fixed in the122 successor; its older DOM pass alone did not establish visual parity.

No new native browser/pixel acceptance is claimed. The original private visual references are not bundled. Current recovered status does not imply that all historical143 components have been restored; that source reconciliation continues separately.

Player124 validates 10 new positive and 18 negative cases, reuses the Ledger cases, and executes 12 actual CDN DOM flows. Four reentrant value-getter tests and combined native reset protect the shared-reader changes. Its exact upstream full run passed 2021/2021, while this focused consumer and its 6 host tests remain separately recorded. No native or pixel pass is implied.

The publication candidate `09db2e994a42bfa5c75207fd38fe4761277cdb5d` later fixes a shared reset getter boundary. Eight mixed-reader negative controls fail on b58 and pass on that exact successor. The narrow executable check is documented in Player124; its historical full-consumer lock is intentionally unchanged.

Motorsport126 adds original finite schedules and standings, explicit unknown/zero/penalty/tie cases, and a local canceled session receipt. Its exact-asset verifier checks 10 positive/26 negative cases, reuses Player validation and runs 12 mixed-reader DOM flows. It includes the public124 shared reset successor; prior fixed consumer locks and their negative controls remain unchanged.
