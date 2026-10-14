# Strict local dialect

Inform derives its lexer, Pratt grammar, AST and library contracts from OpenUI revision cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7. Its local interpreter, state transactions and host bindings have explicit stricter behavior. This is not a full upstream-runtime compatibility claim.

## Public input

Author answers as DSL source text (`.openui`). The HTML configuration encodes this text as a JSON string; it does not accept the historical `iui/1` JSON document format. Parser AST, evaluated trees, catalogs and JSON metadata remain internal or diagnostic representations. Use the root, `/browser` or `/core` entry when integrating the Inform UI library; there is no separate legacy authoring entry.

## Expressions and declarations

Each declaration starts on a new line: name = expression. A multi-line array/component expression may continue across lines. Forward references are allowed, but duplicate declarations, unknown references and dependency cycles are rejected, even in unused declarations. Unused valid declarations do not render. The final root must evaluate to Stack.

Literals: finite numbers, double/single-quoted strings, true, false, null, arrays and objects. Prefer JSON-compatible double-quoted strings. Comments use // outside strings. Component calls use positional arguments. Data objects use key:value. Strings, numbers and booleans concatenate with +; object/array concatenation is invalid. Missing own properties and out-of-range valid indexes return null. Prototype-related keys are forbidden. Arrays support .length and member plucking (rows.score).

Arithmetic operands are finite numbers; division or remainder by zero fails. Relational comparisons require numbers. Scalar == and != use Object.is, so 5 != "5". Conditions, !, && and || require booleans; short-circuit and ternary only evaluate the chosen branch. There is no JavaScript evaluation, lambda, .map(), fetch(), dynamic import, exponent **, or custom function registration.

## Exactly 14 pure builtins

- @Count(array), @First(array), @Last(array)
- @Sum(numbers), @Avg(numbers), @Min(numbers), @Max(numbers)
- @Round(number, decimals?), @Abs(number), @Floor(number), @Ceil(number)
- @Filter(array, field, operator, value)
- @Sort(array, field, direction?)
- @Each(array, "item", inlineTemplate)

Count([]) is 0; First/Last([]) are null; Sum/Avg/Min/Max([]) are 0. Do not present an empty-sample average as a meaningful measurement: branch on Count first. Numeric inputs must be finite numbers. Round defaults to zero decimals and permits integers −12 through 12. No Map, Reduce, GroupBy, Unique or custom callback.

Filter: field is a string dot path; "" means the element itself. Operators: == != > < >= <= contains. Numeric comparisons require numbers; contains is case-sensitive substring matching between strings. Missing fields become null and can cause type rejection. Nested Filter calls express AND. No regex or callback predicate.

Sort: direction is "asc" or "desc" (default asc). All keys must be numbers or all strings. Copies the array, compares strings by deterministic UTF-16 order, and keeps equal keys stable. It does not sort text "10" as numeric 10, support multiple keys, or use locale-specific collation.

Each: the third argument is an inline expression, not a callback. It can produce data or components. Nested lexical item scopes and actions capturing an item are supported. There is no index argument. Ordinary declarations do not capture a calling Each's item. Nulls are removed only from declared UI child slots, not ordinary data arrays. All expansion is bounded by runtime budgets.

For repeated UI structure, prefer a data array plus one inline Each template; nest Each for repeated items inside groups. See [repeated structures](repeated-structures.md) for runnable foundation-only examples, nested scope and empty groups. Distinct sections do not need to be forced into one template.

Table rows must contain only keys declared by columns. When source records also contain selection IDs or other metadata, project the displayed fields before passing them to Table. For example: displayRows = @Each(visible,"row",{name:row.name,score:row.score}). Keep the original visible records for buttons that need row.id. The schema's Record signature does not override this semantic validation.

## State and local actions

Declare every state: $threshold = 60. A binding prop may receive $threshold or an assignment binding $threshold = $value + 1; $value is reserved for the incoming value in assignment bindings. Prefer direct bindings unless transformation is necessary.

Use @Set($name, expression), @Reset($name, ...), and Action([literal steps]). Reset restores that program's committed defaults. Action steps share one draft and succeed or fail as a transaction. Action([stepsVariable]) does not substitute an arbitrary action-list variable; put steps in the literal array. Events use private revision-scoped handles: never copy, forge or retain one across successful changes.

A successful complete commit starts a new program and fresh defaults. State updates preserve each non-null default's top-level JSON type. No non-JSON state, undeclared implicit state, async action or persistence service is provided.

## Boundaries and errors

Final incomplete input fails. preview is passive and cannot be shipped as an interactive complete answer. A failed commit or state transaction preserves the last good state. Use onError for visible failure, then fix the source or data rather than hiding the error.

Unsupported local executable forms: Query, Mutation, @Run, @OpenUrl, @ToAssistant, RuntimeRef, arbitrary DOM/JS/window/fetch access, dynamic module URLs, DSL-provided callbacks/renderers/validators, and legacy JSON actions. Native links in supported views are a separate, visible browser-navigation surface; they do not make DSL actions or tool calls available.

No old iui1 JSON compatibility is implied. This package does not claim upstream streaming-performance equivalence, persisted/pristine-store merging, stable statement identities or a general external-tool gateway. Framework code is bundled as an implementation detail, not something the answer author must recreate.
