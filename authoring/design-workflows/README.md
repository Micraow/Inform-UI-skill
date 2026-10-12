# Choose a loading path for a real design

Use module packs by default. Use the optional node adapter when a design has a known, complete set of node types and a matching example. The five original examples here are complete `iui/1` documents you can validate and adapt. Their task briefs are in [cases.json](cases.json).

## Pick an example

| Design | Explicit types | Complete original document |
| --- | --- | --- |
| Workshop capacity form | form, input, row, metric, text | [Capacity](examples/workshop-capacity.json) |
| Supplied zero/unknown cards | row, card, metric, text | [Status](examples/supplied-status.json) |
| Two-panel agenda | tab-group, tab-panel, text | [Agenda](examples/workshop-agenda.json) |
| Conditional packing questionnaire | questionnaire | [Packing](examples/branching-packing.json) |
| One static notice | text | [Notice](examples/short-notice.json) |

The form starts at zero attendees and computes remaining capacity. The cards distinguish a true zero from an unknown null Value. The agenda names its typed panel children explicitly. The packing example includes a versioned original rule, explicit retain policy, a hidden distance draft, required numeric zero and boolean false; invalid or required-unknown active input suppresses all computed results. These examples do not call external services.

## Get the whole contract before editing

Check out runtime [549d7c0](https://github.com/Micraow/Inform-UI/commit/549d7c044224b429e62d4774e44e4bad48bc4583) and install its declared dependencies. From this Skill checkout, generate the capacity example's default module task:

```sh
node scripts/progressive-source-consumer.mjs \
  --library /path/to/Inform-UI \
  --revision 549d7c044224b429e62d4774e44e4bad48bc4583 \
  --components form,input,row,metric,text --output capacity-module.json
```

For its known, complete type set, the optional narrower task is:

```sh
node scripts/node-source-consumer.mjs \
  --library /path/to/Inform-UI \
  --revision 549d7c044224b429e62d4774e44e4bad48bc4583 \
  --components form,input,row,metric,text \
  --examples authoring/design-workflows/examples/workshop-capacity.json \
  --output capacity-node.json
```

Read the entire resulting task, including required contracts and examples, and run same-version `validateDocument` on the completed design. Test its actual interactions before deployment. For tabs, include `tab-panel`; for containers, include every child type. If you do not know the complete child set or lack a matching example, stay with module selection. The optional adapter refuses those omissions rather than expanding scope silently. The existing214 CDN has separate fixed assets; source selection does not update them.

## What the complete reading paths cost

The [frozen method](METHOD.md) counts the entry, full loading guide, category navigation, original task brief and example, and generated task body. The node path also counts its complete extra guide. Every required module contract stays byte-identical. The [result](results.json) records each counted item and hash. These are UTF-8 bytes, not tokens.

| Design | Module path | Node path | Bytes saved by node |
| --- | ---: | ---: | ---: |
| Capacity form | 210,649 | 142,850 | 67,799 |
| Supplied status cards | 180,179 | 121,447 | 58,732 |
| Two-panel agenda | 180,248 | 117,838 | 62,410 |
| Branching questionnaire | 55,649 | 59,383 | -3,734 |
| Short notice | 49,547 | 52,754 | -3,207 |

Three container-heavy designs benefit from explicit roots. The questionnaire is already a one-node source module, and the short text module is small; the extra node workflow costs more than it saves in those two cases. Use the simpler module path there. This is why the default has not changed.

All five authored documents pass module, node and full structural validation plus the same-version core validator. Pure-state checks cover capacity arithmetic, hidden answers, zero/false/null, incomplete/invalid suppression and immutable versioned questionnaire snapshots. Each task is generated twice with identical bytes. No browser or model-generation experiment is part of this comparison, so these results do not establish rendering quality or generation accuracy.

The earlier optional-interface result remains tied to its original128-node source. This five-case comparison uses the newer141-node source above. The initial combined process ended after one successful case; the final run isolates each case in a serial process and uses the same generated full validator and unchanged assertions.

## Reproduce

```sh
node --max-old-space-size=256 scripts/compare-design-workflows.mjs \
  --library /path/to/Inform-UI \
  --revision 549d7c044224b429e62d4774e44e4bad48bc4583 \
  --output design-workflow-results.json
```

The script checks that the revision matches the recorded local proof or verified public source. Exact task hashes include that revision; checking out the public commit records its public SHA while preserving schema/contract bytes and input lengths. It runs cases serially and produces no runtime bundle or browser assets on disk.
