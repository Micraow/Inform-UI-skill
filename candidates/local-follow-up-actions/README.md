# Original local follow-up action consumer

Canonical status: **partial**. Footer and wrapped_pills modes, responsive action selection and separate new-turn/voice/composer branches are not implemented. Passing the local ID-intent checks does not complete the reference component.

Three supplied actions express local reading choices. The third is explicitly disabled. Labels and IDs are independently authored. No prompt text, generated answer, search endpoint or navigation target is embedded.

`attachActionReceipt(host, output)` cancels `iui:follow-up-action` and writes the selected ID as local text. Keep the output outside the renderer's mount host. Applications can separately decide what an accepted action means; this example makes no provider request.

This is prepared against the newly proposed finite action-bar API, not a claim to have recovered a missing historical API byte for byte. Six positive and thirteen negative documents cover 0..12 actions, unique valid IDs, bounded nonblank labels and literal disabled fields. The intent detail is frozen `{id}` and its event does not cross a shadow boundary (`composed: false`). Exact source `e2d4a0261ac0b40d1abc69e6c811b9208100efb1` passes all6 positive/13 negative documents and7 actual DOM/compiler workflows. It preserves282 earlier definitions and locks17 source/build files. Run `node candidates/local-follow-up-actions/verify-source.mjs --library /path/to/ui-follow-up-action-bar`. Cancel/accept receipts, disabled states, atomic updates, owner retirement and real ShadowDOM confinement are checked. No external requests, new CDN, standalone script or native/pixel execution is claimed.
