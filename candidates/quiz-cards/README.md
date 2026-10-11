# Original supplied Quiz-card consumers

Exact source/build `21a85df79ba7c0f9b2c1d15af4866c79920d4cf3`, tree `1125364ae8aee457900697e41e207f43b3d218ba`, registration182. The three additions are `follow-up-quiz`, `multiple-choice-block-v2` and `personality-quiz`. None replaces the older `quiz` contract.

```sh
node candidates/quiz-cards/verify-source.mjs --library /path/to/exact-runtime
node --test tests/quiz-cards.test.mjs
```

Use Node22+ and the runtime's normal dependencies. The safe lock verifies19 selected files; it contains hashes, not a runtime copy or internal instructions. The original five-instance fixture uses fictional paper/stencil choices, the repository's original blue/gold swatch and explicitly authored result text. There is no personal profile or inferred personality.

## Distinct authoring contracts

- Follow-up questions use stable IDs and text choices. Selecting records once and advances; reviewed answers stay locked. Skip does not invent an answer. Submit can use a partial answer set and composes the supplied prefix plus answered prompts/labels in question order. All response data is public supplied content.
- Multiple-choice with `correctChoiceId` performs local exact matching. Cancellation keeps prior selection/feedback; acceptance clears prior hint/error. An ungraded option instead requires `query`, emits `submit-query` and does not invent correctness or change the supplied selection. Open error text takes precedence over hint text; reset restores supplied feedback.
- PersonalityQuiz is a compatibility identifier for an informal questionnaire. The renderer never derives personality, scores or traits. Start/answers/navigation use local progress revisions. Results require completion, supplied content, `savedRevision` covering current progress and exactly matching `resultRevision`. Retake or changed answers cannot display an older result. A new authoritative document may acknowledge progress and supply its result.

`available:true` explicitly enables questionnaire interaction. Generation, save and result phases are supplied facts; retries emit requests and do not fabricate acknowledgments. Empty questions cannot complete. Ready media requires an explicit safe source; pending/failed media can omit it. Failed-media retry requires explicit capability. Copy/create need supplied text/prompts; share and result requests remain local. Masking or hidden DOM is never a confidentiality boundary for answer/result data.

All `iui:quiz-action` details are frozen, including answer arrays and each answer. They bubble, are cancelable and do not cross shadow boundaries. The included receipt adapter records and cancels them. It does not implement saving, grading, inference, system sharing, clipboard writes or generation.

The visible local Reset button and native form reset restore initial data. Cancellation and newer local input take precedence over queued resets. Update/dispose release prior controls and image ownership. The fixture deliberately tests saved/result revision7 followed by retake/reanswer revision11 before a matching supplied update.

## Evidence

12 positive and20 negative documents pass both actual Node/browser validators and the selected Base schema. All331 prior definitions and node alternatives remain unchanged; exactly three definitions/nodes are added. Seven DOM/actual-standalone groups cover the three distinct workflows, cancellation, stale-result gating, explicit retry/error phases, reset/new-input priority, atomic updates and media cleanup. Actual compiled script runs follow-up advance, exact-answer feedback and questionnaire start with the supplied acknowledged result. Runtime exports and standalone CSS match exactly.

Observed external requests and service calls:0. JSDOM execution is not native browser, media decoding, CSP enforcement or pixel acceptance. The164 CDN and all prior locks remain historical. Current canonical accounting requires separately reviewed functional confirmation;182 is only the schema-registration count.
