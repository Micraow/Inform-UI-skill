# Optional explicit node selection

The category and module task packs remain the default. This optional adapter is for a task whose complete node-type set and matching examples are already known. It constructs the same source-module selection, then narrows its generic `Node` union and retains the complete reachable definition closure. It never reads the full WebChat output to reverse-engineer a second schema source.

## One command, explicit types and examples

With a checkout of the verified runtime source [c060802](https://github.com/Micraow/Inform-UI/commit/c060802fe8d8f4ec2df58c9be88f2a11d409f0e9), run from this Skill checkout:

```sh
node scripts/node-source-consumer.mjs \
  --library /path/to/Inform-UI \
  --revision c060802fe8d8f4ec2df58c9be88f2a11d409f0e9 \
  --components row,text \
  --examples authoring/node-examples/row-text.json \
  --output task.json
```

Read all of `task.json`, including its semantic contracts, before authoring. The adjacent manifest records the complete source-module selection and the separate node projection. Exact public provenance is not guessed from a local checkout; source publication still follows the existing verified-identity rules.

`--root document` is the default; `--root node` produces a node-root schema. Examples are always complete, nonempty `iui/1` documents, even for a node-root package. The full Document envelope is validated in both modes; selecting a node root cannot make an invalid state entry valid. `--example-root` defaults to the working directory; example names must be relative JSON paths beneath it. One to eight unique files are allowed, each at most256000 UTF-8 bytes. Parent traversal, absolute paths, symlinks and remote URLs are rejected. No example or contract URL is fetched.

## Selection and failure contract

- List every generic child type explicitly. `row` does not implicitly permit `text`; request `row,text` for a row containing text.
- List directly typed child dependencies too. A tab group requires `tab-panel`; the included [tabs example](node-examples/tabs.json) requests `tab-group,tab-panel,text`. Omission fails rather than expanding the allowed types silently.
- Unknown, duplicate or unmigrated types fail. Definition references must be local, resolvable and supported by the adapter. The selected definitions remain exactly equal to their source definitions, except for the deliberately narrowed `Node` union and schema identity.
- Each supplied example must validate against the selected structural schema. Together, examples must contain valid instances of every requested node type at schema-declared Node positions. A lookalike object inside opaque animation metadata does not count. Unselected generic children, invalid examples or an uncovered type fail before output is written.
- All required semantic contracts from the complete selected modules remain present. Narrowing the structure does not authorize removing security rules, units, source versions, permission gates, cancellation, unknown/invalid handling or effects.
- This is a stricter subset of accepted documents, not an equivalent validator for arbitrary previous documents. If the task's node set or matching examples are uncertain, use [module selection](progressive/README.md) explicitly. There is no silent fallback.

## Output integrity

The CLI validates everything first, preflights both output targets, stages both files, and rolls back previous files on a handled publish error. A directory or symlink at either target is rejected without overwriting the old task. This protects against ordinary I/O failure; it is not a crash-atomic filesystem transaction or a concurrent-reader protocol. If an external filesystem change also prevents rollback, the error explicitly reports that preserved backups need recovery.

## Adjacent original examples

| Request | Example | Boundary |
| --- | --- | --- |
| `row,text` | [A short row](node-examples/row-text.json) | All generic child types are explicit. |
| `slider` | [A zero-valued slider](node-examples/slider.json) | Zero stays zero. |
| `row,toggle,select,text` | [False, zero and null](node-examples/false-zero-null.json) | Boolean false, numeric0 and a null text Value remain distinct. |
| `tab-group,tab-panel,text` | [A typed child panel](node-examples/tabs.json) | The tab-panel dependency is explicit. |

Preserving null does not make it valid in every field. The canonical Document `state` values accept string, number or boolean; a null state entry is rejected. A null `Value` is allowed where the existing schema permits it. Omission, null and invalid input must never be converted to zero or false by this adapter.

These examples are original, non-medical and local. They are examples of structure, not proof of runtime outcomes. Run same-version `validateDocument` and the relevant interaction checks before mounting or compiling a resulting document. The published214 CDN still has its own fixed scope.

## Evidence and limits

The [verification result](node-selection-result.json) records exact-source integration checks and pure adapter tests. It includes deterministic request order, definition closure, typed-child rejection, generic-child rejection, complete example coverage, local-path safety and both root kinds. The final local run passed16 integration cases,14 adapter unit tests and all519 Skill tests. Existing module selection remains unchanged.

The initial isolated measurement retained every module semantic contract and used identical task-specific examples on both sides. Four examples saved about62–67KB of UTF-8 input, while narrowed complete comparison envelopes still needed roughly72–79KB. Existing module-wide examples were incompatible with the narrowed schema in each case; that is why this interface requires explicit matching examples instead of reusing the family examples automatically. These are byte measurements, not tokens or model-quality results. The current adapter adds its own instructions and provenance, so use its recorded task bytes rather than treating the initial experiment as an exact prediction.

No browser, rendering, clinical or model-generation accuracy claim is made by the structural adapter tests.
