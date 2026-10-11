# Recovered Follow Up Card Group consumer

This is an additive, local-only authoring candidate for the restored 115-node runtime plus `follow-up-card-group`. It does not replace the historical `upcoming-eighteen` contract or claim to recover the later lost 148/151 implementation.

The exact local runtime is reconstruction commit `0a35709a43648e71b7ab9e278ad4cd5602d495e0`, tree `2b0e70bf73bab1fb08903bb821e13ec5c7ddc64e`. `runtime-lock.safe.json` verifies all 808 tracked source/asset paths plus 6 generated dist files before and after execution. The historical public base is `0bda01d914fdcd73bd8a573b04e649f82c03a217`; local reconstruction identity is not recovered remote history.

- One new canonical target: `follow-up-card-group`.
- Historical accepted count stays 53. Native scenarios executed here: zero.
- Read [AUTHORING.md](AUTHORING.md) before using the supplied scene.
- Run `node candidates/recovered-card-group/verify.mjs --library /absolute/runtime/path`.
- The verifier uses the exact browser ESM, Node compiler, schema and external CSS from the lock. It exercises original positive/negative documents and local DOM interaction, and removes compiled HTML after inspecting it in memory.
- No CDN URL is published for this local candidate. No supplied intent executes navigation, model calls, service requests or persistence.

The original private captures are not part of this candidate. Its sample text, data and JavaScript are independently authored.

Final consumer checks: 9 positive documents, 16 rejections, 8 CDN DOM interaction groups, 3 recovered HPCC/RTT/Wi-Fi scenes, 194 old schema definitions conserved, and deterministic inline compilation. Native/pixel acceptance remains unexecuted. The upstream aggregate before final narrow cleanup was 1683/1685 with two missing-font failures; final scoped successor checks are separate evidence, not a full-library pass.

## Safe restore verification

The default verifier uses `runtime-lock.safe.json`, which deliberately omits repository agent-guidance metadata. The original historical lock is retained locally, unchanged, and is not required or included in the safe backup. Original commit/tree and full-source digest remain provenance records, not a claim that a sanitized checkout has that Git identity. The permitted file closure has its own digest and every included file is checked before and after runtime use. Git history and the omitted guidance file are unnecessary. `sourceCommitVerified` is false for this mode; content/asset verification remains exact.
