# Intelligent-UI-skill

A compact Agent Skill for composing editorial-style explanations from semantic JSON. It teaches **when to use a visual, what it should say, and how to verify it**. The separate [Intelligent-UI](https://github.com/Micraow/Intelligent-UI) library owns the schema, validation, deterministic HTML and browser rendering.

This is an independent implementation inspired by observable interface principles. It does not contain a proprietary runtime, captured assets, or OpenAI's internal model schema.

## Use the skill

Read [`SKILL.md`](SKILL.md) with your agent, or place this repository's skill files in the skill directory supported by your host. The entrypoint and relative `references/` and `examples/` paths must stay together. Installation is host-specific; this repository does not change your personal skill settings.

If your host cannot install skills, use this short instruction:

> Create a compact `iui/1` document with Intelligent-UI. Choose only visuals that help answer the question, integrate them with explanatory prose, label sources, units and synthetic data, and use declared state plus safe expressions for useful interaction. Leave styling to the renderer. Validate against the matched library checkout. If a capability or tool is unavailable, give a readable fallback and say what was not verified.

## Verify the examples

Use Node.js 22 or 24 and Git. No runtime dependency is needed in this repository. Clone the library beside this checkout, check out the commit in [`library-contract.json`](library-contract.json), then run `npm ci` and `npm run build` inside the library. From this repository:

```sh
npm test
npm run check:library -- --library ../Intelligent-UI
```

The second command uses the library's actual public module, schema and CLI. It validates every example, checks deliberate invalid inputs, and verifies deterministic compilation. It fails if the library is absent; a local-only test pass is not an integration pass. See [the workflow](references/library-workflow.md) for rendering a document.

No npm publication is assumed. The matching library's package name identifies its local API; do not substitute an unverified package of the same or similar name from a registry.

## Contents

- [`SKILL.md`](SKILL.md): short selection and composition workflow
- [`references/`](references/): binding, repair, actual library commands and capability boundaries
- [`examples/`](examples/): five original, explicitly labeled documents
- [`library-contract.json`](library-contract.json): exact cross-repository test target
- [`tests/`](tests/) and [`scripts/`](scripts/): JavaScript-only structural, content-boundary and integration checks

The [support matrix](references/support.md) distinguishes portable schema nodes from features requiring new renderer work or host services. All examples are original fixtures; their numbers are synthetic, not measurements or scientific benchmarks.

## License and contributions

MIT; see [LICENSE](LICENSE). Contribute original material or material with a clear compatible license. Do not add captured runtimes, HAR files, session data, private evidence or unlicensed screenshots. This repository has no renderer implementation or bundled style sheet.
