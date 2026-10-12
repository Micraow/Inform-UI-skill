# Paired authoring pilot v1

Eight original nonmedical tasks cover real zero/false, optional unknown values, retained and cleared conditional answers, cross-field pending validation, named computation dependencies, independent defaults/source versions and a cancelable local action. [Questions](questions.json) are identical in both arms.

A uses the preserved full130,534-byte entry. B uses the new3,823-byte entry. Both receive the same20,991-byte complete questionnaire task pack, the same questions and the same generation requirements. Supplying the new-domain contract to both arms avoids confusing missing API knowledge with a long-entry effect. This comparison isolates the entry migration; it does not test a full751KB schema against its closure, or the experimental compact syntax.

Each arm uses one fresh context of the same inherited configured model at xhigh effort. The exact model identifier, seed and temperature were not surfaced. Each independently writes all eight canonical documents in one pass, without grading feedback, validation, repairs or seeing the other arm. The questions, reference fixtures,31 semantic vectors and grader were frozen before either generation. Outputs were hashed before grading. Complete bounded input-read ranges and hashes are in [RESULT.json](RESULT.json); neither arm had truncation.

Required output: one canonical `iui/1` document per question, body containing exactly one questionnaire, exact requested IDs/values, descriptive labels and no runtime code. Unless a task says otherwise, questionnaire version is1.0.0 and sources are exactly `[{"title":"原创非医疗软件验收规则","version":"1.0.0"}]`. Use the task pack's29c runtime contract rather than older versions mentioned in the historical full guide. Each arm is limited to the provided materials, one generation pass and15 minutes; it may not run validators or inspect expected answers.

## Grading and reproduction

Parsing, same-runtime document validation, task constraints, semantic outcomes and actual JSDOM mount interactions are separate stages. Equivalent formulas are accepted, except an explicitly requested named dependency must remain present. The supplied [reference documents](reference-documents.json) pass all stages and all31 [boundary vectors](semantic-vectors.json). Grading outputs are preserved in A-score.json and B-score.json; generated answers are unchanged under outputs/.

For a local checkout of the exact source29c6905e19d00f60ad4d945d766a6fbf516f2f9c, run from this directory:

```sh
UI_PILOT_RUNTIME=/path/to/exact-runtime node score.mjs --self-test
UI_PILOT_RUNTIME=/path/to/exact-runtime node score.mjs outputs/A
UI_PILOT_RUNTIME=/path/to/exact-runtime node score.mjs outputs/B
```

The script checks the runtime bundle against the existing Skill lock before importing it. Its portable copy changes only filesystem configuration from the frozen grader; all assertions and fixtures are preserved. This does not install or fetch a runtime: the questionnaire source remains a local tested candidate and is not in the published214 CDN.

## Result and limits

Both arms passed8/8 complete tasks, with8/8 parse,8/8 schema,8/8 task contracts,31/31 semantic vectors and8/8 actual mount flows each. No network, clipboard or external adapter service ran. The input-material budget fell from157,726 to31,015 UTF-8 bytes, about80.3%, while these tasks retained first-pass correctness. This is a useful small pilot, not evidence that the shorter path is more accurate or equally reliable in general.

Input, dispatch, answer and measurement-report bytes are listed separately. They exclude system and tool wrappers and model-internal content, so they are not token counts or complete transport costs. Raw answer output shrank, but after JSON minification B is45 bytes larger: that apparent output saving is formatting, not a demonstrated better DSL. There is one session per arm, one family, no random seed control, no native/visual test and no medical inference. Do not use the deterministic479 project tests or this pilot to claim model-wide superiority.
