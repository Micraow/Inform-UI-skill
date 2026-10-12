# Optional compact syntax, not the default

Canonical `iui/1` JSON remains the default authoring format. This experiment saves some repeated syntax but introduces a parser and additional instructions. Reduced bytes do not establish reduced tokens or better model accuracy.

Only an explicit `{ "format": "iui-author/1", "document": { ... } }` envelope activates the following markers. The document still declares `"version": "iui/1"`, full descriptive field names, versions, units, sources and safety settings.

- `{ "$expr": "mul($participants,$packsEach)" }` expands to `{ "op": "mul", "args": [{ "$": "participants" }, { "$": "packsEach" }] }`. Calls accept the canonical operators add, sub, mul, div, min, max, round, abs, clamp, gt, lt, eq, if and format. References start with `$`; constants use JSON scalar syntax. There is no infix precedence, property access, JavaScript evaluation or callback.
- `{ "$table": { "columns": ["name", "value"], "rows": [["zero",0],["unknown",null]] } }` expands to an array of records in row order. Every row must have exactly one value per column. Null is a value, not a missing property. Heterogeneous records should remain ordinary JSON objects.
- `{ "$literal": { "$expr": "ordinary caller data" } }` preserves the enclosed JSON exactly and does not expand markers within it. Marker objects must have exactly one property.

The compiler rejects malformed syntax, unsafe object keys, accessors, cycles, nonfinite values, oversized input and unknown operators. It does not silently fall back after an error. Old canonical documents pass through without interpreting markers. Bounds, expression types, URLs, applicability and application semantics still require the exact runtime's `validateDocument`; this compiler is not an alternative validator.

`node scripts/compact-authoring.mjs compact canonical.json authored.json` chooses compact output only when its minified UTF-8 representation is smaller. `compile authored.json canonical.json` expands it. Neither command runs a build or requests a service. The serializer preserves negative zero, null, false, zero, empty strings and explicit empty collections. No defaults or missing fields are inferred.

Tests require `compile(compact(document))` to equal the original canonical JSON, including after serialization. Five representative examples save only269 bytes in total before these instructions are added. The measured full-input comparison in `audit.json` is the reason this syntax is optional rather than the primary interface. A model-generation comparison has not been run.
