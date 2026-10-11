# Original supplied upcoming flows

This consumer locks source `8446e162e9ffd405f80c42345173b3a979bb8bd4` independently of the historical CDN. All records are fictional teaching labels. No account lookup, financial computation, date prediction, connection request or transaction is performed.

```sh
node candidates/upcoming-flows/verify-source.mjs --library /path/to/matching-library
node --test tests/upcoming-flows.test.mjs
```

The example keeps the required legacy `activities:[]` and supplies both `flows.incoming` and `flows.outgoing`. Incoming has a fixed top record plus two initial items and four alternative items. Expanding replaces those two items with the four alternatives. Outgoing has two initial items but only one alternative, so it cannot expand. Reusing IDs between alternative lists is allowed; each visible list must remain unique, including its top record.

`activeFlow` chooses the initial flow. A same-flow selection retains expansion; changing flow collapses it. `expanded` chooses initial expansion, `showFlowTabs:false` uses a static label, and a document update resets to supplied initial state. Native form reset shares the library reset contract: canceled reset preserves state, accepted reset restores defaults, and newer local input wins over a pending older reset.

Amounts, dates and account labels are opaque text. Known zero stays distinct from unknown null; `amountUnknown:true` preserves an explicitly supplied unknown label under masking. This example contains no real account or personal financial information. Flow details are passive unless `detailEnabled:true`; the example enables only its top incoming item. `consumer.mjs` cancels the local frozen `{id,flow}` request and records plain text, opening no account service. Legacy finite activity details still emit `{id}`.

The verifier checks22 safe source/build files before and after execution. It preserves297 previous schema definitions after projecting out four record additions and twelve node additions, adds exactly `UpcomingFlow` and `UpcomingFlows`, and retains154 node registrations. Both Node/browser validators run9 positive/16 negative new documents and6/20 legacy Finance documents; the selected finance schema is also checked. Eight DOM/compiler workflows cover flow replacement, the576px synthetic container boundary, passive/detail requests, native reset ordering, masking, phases/no-account state, atomic invalid updates and old API compatibility. Runtime CSS exports match the standalone compiled style body. All external requests are rejected.

This is source-build evidence, not a packaged CDN run. JSDOM does not establish native layout, decoded images or reference-pixel fidelity. This consumer does not itself promote the canonical row; independent functional review and native verification remain separate. The old finite source locks and fixed8e21 CDN accounting are unchanged.
