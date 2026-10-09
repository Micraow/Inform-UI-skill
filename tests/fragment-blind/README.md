# Frozen fragment-discovery blind authoring sample

The original author read only SKILL.md at d2cf1d9ef40e13cfc390b831530e6807532c54ad, the library schema index, the selected converter Document schema, learning Node schema, and the two matching examples at library commit 6797f7f7755f483db6c3be3831aa03433b7c4696. The author did not read the implementation, run the library or preview a browser before freezing the first draft. All content is original synthetic teaching material.

The HTML and JSON are immutable. Their SHA-256 values are recorded in frozen-manifest.json and independently hard-coded in scripts/verify-fragment-blind.mjs. Do not fix this fixture after acceptance findings and call it a first pass.

Run the verifier with an exact 6797f7f library checkout and built dist:

    node scripts/verify-fragment-blind.mjs --library ../library --browser --output artifacts/fragment-blind

The focused workflow runs Ubuntu, Node 22, Chromium only. It does not replace or disable the existing cross-platform workflow. Desktop and narrow 390-pixel views in light and dark schemes are checked, including original CDN/SRI loading, state math, forms, chart keyboard and missing/empty data, converters, quiz and flashcards. Results distinguish pass/fail from nonblocking observations. The standalone table's empty null cell follows the frozen contract; its contrast with the chart table's explicit missing label is a readability limitation, not an implementation-contract violation.

Reading cost: 95,523 unique UTF-8 source bytes (33,167 root + 12,811 index + 45,697 selected schemas + 3,848 examples), plus 13,633 known repeated presentation bytes. Five successful remote fetches and one failed CDN fetch. These are not measured token costs and do not establish guaranteed token savings.
