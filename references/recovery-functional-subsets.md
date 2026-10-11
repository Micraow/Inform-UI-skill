# Functional completion and remaining subsets

The current source inventory is **144 implemented**:53 historical functional acceptances and91 pending verification. Another4 IDs are partial and108 are not implemented. Protocol154 is a separate schema-node count.

FollowUpActionBar and ConversationSuggestions have now passed independent functional confirmation:

- [FollowUp presentations](../candidates/follow-up-presentations/README.md), source7b5e55b: Footer/wrapped modes, renderer-container selection, phases, optional icons and distinct local new-turn/voice/composer requests, with old ID-only compatibility.
- [Conversation presentations](../candidates/conversation-presentations/README.md), source342bc8f: distinct phases, optional icons, local new-turn/voice requests and old prompt-only compatibility.

Both remain pending native/reference-pixel verification. Neither executes a host service. This promotion does not rewrite their earlier finite source locks.

## Remaining partial functionality

- **Image grid:** the earlier finite square grid is tested. Authored row geometry/flex growth, recommendations with More/Fewer, live-activity mode and viewer workflow need confirmation on the new exact candidate before promotion.
- **Upcoming activity:** supplied labels and a kind filter work. Incoming/outgoing flow selection, expansion state and conditional expandedItems replacement remain missing from the consumed finite contract.
- **Spend so far this month:** opaque totals and independent category-share bars work. A monthly temporal series, month/comparison controls, trend curve and point inspection remain missing from the consumed finite contract.
- The pre-existing **weather** row also remains partial in the source inventory.

Each candidate keeps its immutable source/build lock and positive/negative tests. Promotion requires implementing and checking the missing functional contracts on exact input. Native interaction and visual fidelity are separate evidence. The earlier five finite APIs were incorrectly counted as complete implementations; that accounting was corrected before these two genuine functional completions.

## Current versus historical accounting

The current machine-readable declaration is [recovery-functional-subsets.json](recovery-functional-subsets.json). The exact8e21 CDN consumer instead keeps its historical142/6/108 declaration in its own [frozen scope](../candidates/recovery154/canonical-scope.lock.json). Future promotions must not change that old result.

Check a supplied current inventory before reporting progress:

```sh
node scripts/verify-recovery-functional-scope.mjs /path/to/component-progress.json
```

The command recomputes counts from256 unique rows, checks the exact remaining partial IDs and reports the inventory SHA-256. Mismatched summaries or promotions fail. It checks accounting, not runtime or browser acceptance; synthetic test IDs only exercise the verifier.
