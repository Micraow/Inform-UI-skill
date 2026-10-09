# Repair input, then validate again

Read `issues[].code`, `issues[].path` and `issues[].message`. Paths are JSON Pointers, such as `/body/2/rows/0`; array indexes are zero-based and escaped path segments use `~0`/`~1`. Fix the smallest responsible field and rerun validation. Do not rewrite valid source data to make a test pass.

| Failure | Likely cause | Repair |
| --- | --- | --- |
| `SCHEMA`: unknown property or component | A guessed widget, styling key, or newer contract | Check the matched schema. Remove decorative extras; use a supported node or readable fallback. Do not silently remove meaningful content. |
| `UNKNOWN_REFERENCE` | `{"$":"load"}` names no state or computed value | Declare the input or correct the name. Do not replace a missing observation with a fabricated number. |
| `COMPUTED_CYCLE` | Computed values refer back to themselves | Express the calculation as a directed acyclic graph. A mutable input belongs in `state`. |
| `UNKNOWN_BIND`, `INPUT_TYPE`, `INPUT_RANGE` | Wrong state type, missing value, or range mismatch | Bind to declared compatible state; choose a valid initial value, positive step and ordered bounds. |
| `OPERATOR_ARITY`, `OPERATOR_TYPE`, `DIVISION_BY_ZERO`, `NON_FINITE_RESULT` | Wrong argument count/type, division by zero, non-finite result | Use the documented operator contract and meaningful safe ranges. Check extrema and branches, not only initial state. |
| `TABLE_SOURCE`, `TABLE_SECTION`, `TABLE_WIDTH`, `TABLE_SPAN`, `TABLE_OVERLAP`, `TABLE_SCOPE` | Conflicting sources, section order, invalid merged coverage or header scope | Select rows or sections. Reconcile occupied logical columns per section; never insert null into an already spanned position. |
| Chart data mismatch | Series key absent or nonnumeric y-value | Correct the series mapping; retain missing samples as `null`. Do not silently drop observations. |
| `UNSAFE_URL`, `SVG_ATTRIBUTE` or another SVG diagnostic | An unsafe scheme, event handler, external reference, or arbitrary styling | Use a permitted source URL or simpler semantic diagram. Never encode or disguise the same unsafe value. |
| `UNSUPPORTED_NATIVE` | A private widget name or unavailable backend | Choose portable nodes and state the limitation. Do not claim the fallback is the native service. |

## After a successful validation

- Does every numeric claim have a source or a visible synthetic/derived label?
- Do units agree with the calculation, chart and surrounding prose?
- Does each control change a relevant visible result and stay valid at its minimum/maximum?
- Are null samples shown as missing rather than zero or an invented connecting measurement?
- Are long labels, Chinese text and narrow screens readable without page-wide overflow?
- Can keyboard users identify and operate controls? Does meaning survive without color?

If the JSON is valid but the renderer loses focus, clips labels, connects a missing sample or produces a wrong result, preserve the input and report a library bug. Do not inject HTML/CSS or alter data to hide the failure. If an unavailable tool prevents testing, say exactly which validation or preview is outstanding.

## Time and overlay boundaries

For `TIME_DATE` or `TIMEZONE`, use a real offset-bearing snapshot instant and recognized IANA zone; live mode must omit at. For a `SCHEMA` error on timer/stopwatch/tooltip/popover, first check that the matched runtime actually supports the new nodes. Do not downgrade meaningful fields silently or reuse the old CDN pin. Timing values are integer milliseconds, tooltip content is plain text, and popover children still need their own domain schema.
