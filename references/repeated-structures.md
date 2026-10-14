# Repeated structures with @Each

Use a data array plus one inline `@Each` template when cards, rows, grid cells or
sections share the same structure. Nest `@Each` when a group contains repeated
items. Keep genuinely different sections explicit; fewer characters alone do not
make an answer clearer.

This uses the existing DSL and the bundled foundation profile. It does not need a
new loop API, domain View, custom JavaScript or unreleased layout options.

## Small, complete example

```openui
groups = [{title:"第一组",items:["甲","乙"]},{title:"第二组",items:["丙"]}]
root = Stack(@Each(groups,"group",Card([Row(@Each(group.items,"item",Badge(item)),"sm")],group.title)),"md")
```

The outer template creates one Card per group. The inner template creates one
Badge per item. Feed the array result to a component's declared children slot;
`@Each` can also project scalar values or objects for chart labels and Table rows.

## Scope and limits

- The third argument is an inline expression, not a callback or separately
  declared template. A declaration such as `tile = Badge(item)` cannot borrow the
  loop variable from a later `@Each(items,"item",tile)` call.
- An inner template can read the outer variable. Prefer distinct names such as
  `group` and `item`. Actions may capture both, as the complete example below does.
- There is no index argument. Put an explicit sequence field in each record when
  its label needs an index. Do not invent `foreach`, `@ForEach`, `.map()` or lambdas.
- `@Each([],"item",...)` produces an empty array. Use `@Count` and a conditional
  for a meaningful empty-group message. Null removal applies to UI child slots,
  not arbitrary data arrays.
- Loops do not bypass profile selection, item/child limits or expansion budgets.
  Use only the constructors and options in the actual selected runtime contract.

## Complete original example

[repeated-groups.openui](../examples/repeated-groups.openui) uses synthetic workshop
materials, two nested templates, an empty group and selection/reset. Its buttons
capture both the group and the material. The [generated HTML](../examples/repeated-groups.html)
uses the same bundled runtime; download the repository to open it locally.

```sh
node scripts/inform-answer.mjs check examples/repeated-groups.openui --select base/layout,base/text,base/controls
```

The tests compare the small example's expanded component tree with an explicit
version, verify every captured button target and reset in the complete example,
and cover an empty outer array. They validate
this example's contract; they do not establish model-authoring success rates or
browser performance.
