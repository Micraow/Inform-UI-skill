# Host form reset: three controlled preferences

An original paper-marker example consumes the exact source-built fix
`391e3cbe7914d0f8eeaed88ba62e8eee3df29688`. Its runtime-code commit is
`8a6ea014fef247891329aaf65df8a871e84842f8`. The small read-point has six source/test/docs
files, three dist files and one locally generated global bundle; it is not a complete CDN release.
All ten files are checked against the safe lock before and after execution.

## Verified use

Four independent JSDOM consumer groups passed against the actual browser export:

1. An external host form's `reset()` and native reset button restore Slider, Toggle
   and Select state, native control values and the slider output.
2. Capture and bubble cancellation retain edits. A newer input, same-value input
   or `setState` retains its own binding while other bindings reset.
3. Two sliders reset atomically before a reciprocal expression is recomputed.
   The original 3/7 and edited 7/3 pair would divide by zero under either sequential reset.
4. Updates and disposal retire pending old reset work. The new generation resets
   to its own supplied initial values.

Both original documents validate. Resource and service request counts are zero.
The result is in [consumer-result.json](consumer-result.json).
The first harness assertion incorrectly prohibited an existing empty error node;
the corrected assertion checks that all error nodes are empty. Runtime bytes did not change.

## Run

Use an existing installation of the runtime's `jsdom` dependency; do not copy or
rebuild runtime assets into this repository. The exact read-point may be sparse
and need not contain a package file or dependencies:

```sh
node candidates/host-form-reset/verify-source.mjs \
  --library /path/to/frozen-391e-read-point \
  --dependencies /path/to/existing-runtime-checkout
node --test tests/host-form-reset.test.mjs
```

Reset reconciliation runs after the browser's default action, followed by an atomic
commit. The consumer waits task boundaries; a Promise-only drain is insufficient.
Ordinary reader reset scheduling keeps its existing default behavior.

## Boundaries

- This consumer covers only Slider, Toggle and Select. It makes no claim about
  Input, Textarea or Radio host reset support.
- No new full-suite, native, visual, compiler or 52-asset check is claimed here.
  Independent real-browser testing is tracked separately by the runtime project.
- The failed `1b31634dba3ced3c4f8d5eba287451749c544866` predecessor remains a failed
  historical version. This lock never promotes its results.
- The public933 asset commit `d1196a06e0561bc384d94eb6ff625ea61309969d` remains the
  separately verified release. This source-build lock has `publicCommit: null`.
  The older5081 and183 locks are unchanged; implementation counts stay208/0/48,
  with213 registered protocol nodes.
- The paper settings and numeric fixture are synthetic. No bank, health, account,
  network or other service is used.
