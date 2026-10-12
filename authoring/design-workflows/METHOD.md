# Deterministic design-workflow comparison

This is a five-case engineering comparison using original, non-medical data. It tests whether the same authored design documents remain valid under module and explicit-node selections, and measures the complete declared reading path. It does not ask a model to generate answers, measure tokens or predict model quality.

## Fixed cases and source

[cases.json](cases.json) fixes each task brief, explicit node-type set and original example before measurement. The examples cover a workshop capacity form, supplied zero/unknown cards, typed tabs, a branching questionnaire and a text-only notice. Runtime source is 5e965ee98bee2b26c351b5ecc80f3e453557be33, publicly verified as 549d7c044224b429e62d4774e44e4bad48bc4583. The generated source catalog is the same for both arms.

## Reading-path accounting

Both arms read these exact UTF-8 payloads once: SKILL.md, the complete progressive README, the category index, each relevant declared category file, the same task brief, and the same complete original task example. They then read the complete generated task JSON. The node arm additionally reads the complete NODE-SELECTION.md guide, including its extra syntax and constraints. No network resources or linked release histories are loaded.

The actual module task contains the source module's broad examples. The actual node task contains the caller-supplied matching example, so the initial example is read again inside that generated task. This difference is counted, not normalized away. It reflects these two concrete workflows, not a controlled causal test of schema size alone. Adjacent manifests are audit outputs and are not model input. Each counted item records byte count and SHA-256, and totals use the serialized task bytes rather than JSON character counts. No tokenizer is available in this experiment.

## Gates fixed before execution

For every case:

1. Both source selections must finish normally and validate the complete authored Document with strict JSON Schema.
2. Their required semantic contract arrays must be byte-for-byte equal, including safety, version, unknown/invalid and effect boundaries.
3. The explicit node task must contain exactly the requested types; every retained definition other than the narrowed Node union must equal the module definition.
4. Same-version runtime validateDocument must accept the authored output. Focused pure-state checks must preserve the specified zero, false, null and questionnaire hidden/invalid/unknown outcomes.
5. A second generation must produce the same task bytes for both arms. The original full WebChat schema must keep its fixed SHA-256.

A failed gate is reported as a failure, not repaired by dropping a field or contract from that case. Fixture mistakes may be corrected only with the prior failure retained in the test record. This run performs source compilation for the core validator, no renderer build or browser test. It establishes structural and pure-state compatibility, not visual, interaction or clinical validity.

The default stays module selection. A net reduction can justify the optional node workflow for a known complete child-type set; a net increase argues against using it for that case. Required contracts are retained even when they dominate the input size.
