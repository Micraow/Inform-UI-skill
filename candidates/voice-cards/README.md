# Original supplied voice requests

Exact source `37c30c2327def539b50278c3beded9fcf04d6da9` passes15 positive/17 negative documents,8 DOM/compiler groups,321 unchanged prior non-Node definitions and21 selected source/build hashes. Protocol172 is separate from canonical functional acceptance.

The [original fixture](examples/original-voice.json) contains invented shape sentences, an opaque fictional session reference and one independently drawn inline PNG. No recordings, private conversations, credentials or real voice session data are included.

## Three short contracts

- `learning-voice-mode-launcher-card` requires a resolved title, description, start label and `voiceSession:{id}`. The ID is an opaque reference, never a credential.
- `offer-voice-conversation` requires a resolved button label. Its optional card description and safe decorative image share one native button. This example uses inline imagery and makes no external image request.
- `learning-speak-card` requires1–30 finite exercises with unique IDs and supplied target text. Optional phases are idle, starting, listening, success, failure and error. Repeat displays its target; recall requires source text and masks unmatched segments until supplied success/failure. Supplied segments must reconstruct the target exactly. This display performs no recognition or scoring.

All three use a nonblank accessible label and supplied pending/resolved/failed status. A failed presentation without fallback is hidden. Explicit `available:true` enables the primary request; omission is unavailable. Root disabled overrides capability. Exercise playback additionally requires `playbackAvailable:true` and an appropriate supplied phase. No device or permission probing is performed.

The [host receipt](consumer.mjs) cancels both local events and writes a plain text receipt. Launcher/offer emit frozen `iui:voice` detail with source, intent and optional supplied session reference. Speaking emits frozen `iui:speak` detail with exercise, target text and start/stop/play/stop-playback/finish intent. Finish includes a frozen ordered exercise-ID snapshot. Events bubble and are cancelable without crossing a shadow boundary.

A local accepted request changes only the receipt. It never creates listening, playback or success. Next needs the current supplied success. Explicit `doneLabel` exposes Finish on the final exercise, enabled only when every supplied phase is success. Canceled Finish can retry; accepted Finish is single-flight until reset/update.

Native form reset clears selection, receipt and accepted-finish state while preserving supplied phases. Canceled reset retains the local state. Newer navigation wins over queued reset. Update/dispose retire old controls, and invalid replacement is atomic. Masked target text is still public document data and part of a speak intent; this is not a secret-answer boundary.

```sh
node --test tests/voice-cards.test.mjs
node candidates/voice-cards/verify-source.mjs --library /path/to/exact/source-built-runtime
```

The verifier checks both Node/browser validators, selected Base/Learning schema closures and actual compiled stylesheet equality. Resource and device/service guards measure0 external requests and0 voice-service/device probes. It does not execute the compiled standalone script, use a microphone, synthesize speech, recognize a transcript, contact an account service or establish native/pixel acceptance. Existing164 and earlier CDN locks remain unchanged.

The initialb40d source passed the original13/17 and7 common workflows but failed two added reset regressions: a disabled primary speaking control prevented resetting selection and accepted Finish. Both exact assertions pass on37c30c. The successor adds a visible project-owned Reset practice button (`resetLabel` optional), also serving as the native reset anchor; it respects canceled clicks and component disablement. This is a local adaptation, not a voice service action.
