# Functional subset boundaries

The corrected154 inventory is **142 complete implementations**:53 historical functional acceptances and89 awaiting verification. Another6 IDs are partial and108 are not implemented. Protocol154 is a separate schema-node count. The five limited APIs below, plus the existing weather partial, must not be counted as complete canonical implementations.

- **Follow-up action bar:** local labels and ID receipts work. Footer versus wrapped-pill modes, responsive item selection and separate new-turn/voice/composer branches remain missing. A flat button list does not replace those functions.
- **Conversation suggestions:** local supplied prompts work. Pending/resolved/failed phases, optional icon/image content and reference input variants and distinct voice/new-turn intent branches are missing.
- **Image grid:** the finite square grid works. Authored row geometry/flex growth, recommendations with More/Fewer, live-activity mode and viewer navigation are missing.
- **Upcoming activity:** supplied labels and a kind filter work. Incoming/outgoing flow selection, expansion state and conditional expandedItems replacement are missing. The current kind filter is not that workflow.
- **Spend so far this month:** opaque totals and independent category-share bars work. A monthly temporal series, month/comparison controls, trend curve and point inspection are missing. Category shares are not a substitute for the temporal chart.

Each candidate keeps its immutable source/build lock and positive/negative tests. These are compatibility checks for the implemented subset. Promotion requires restoring and testing the missing functional contracts on an exact input. Native interaction and visual fidelity remain separate evidence. Earlier Skill progress text that counted these five as implemented was incorrect; the correction does not roll back their working subset code or tests.

Machine-readable counts and missing features: [recovery-functional-subsets.json](recovery-functional-subsets.json).

Check a supplied inventory before reporting progress:

```sh
node scripts/verify-recovery-functional-scope.mjs /path/to/component-progress.json
```

The command recomputes counts from all256 unique rows, checks the exact six partial IDs and reports the inventory SHA-256. Mismatched summaries or promotions fail. It is an accounting check, not a runtime acceptance or a replacement for the canonical source inventory. Tests use synthetic ID rows solely to exercise the verifier.
