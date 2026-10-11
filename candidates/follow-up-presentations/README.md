# Supplied follow-up presentations

Exact source-build input: `7b5e55be730ef10decf750e443c528259a04b82b`, tree `d97e108601739ebd51ee4a854ed3c19e8810b656`. This extends the existing FollowUp API without adding a protocol node. Its canonical row has since passed independent functional confirmation and is implemented pending native/reference-pixel verification.

```sh
node candidates/follow-up-presentations/verify-source.mjs --library /absolute/path/to/ui-follow-up-presentations
```

The original document provides four Footer queries and three wrapped-pill requests. `presentation` is `flat` by default for legacy compatibility, or explicit `footer`/`wrapped_pills`. Both explicit layouts require nonblank `query`; Footer permits only new-turn. Wrapped requests distinguish new-turn, start-voice and open-image-composer. Two PNG icons are independently generated teaching images. `status` is literal pending/resolved/failed; omission means resolved, while null and state references are rejected.

The local host cancels every intent and displays a plain-text receipt. New frozen detail is `{id,query,intent}`; the old flat API without new request fields keeps exact `{id}`. No message, voice session, image service or navigation is performed.

Actual source-build checks:

- 8 positive/16 negative new documents and 6 positive/13 negative legacy documents through Node/browser exports.
- 8 DOM/compiler workflow contracts, including synthetic container widths379/380/575/576 with a1000px window, all wrapped actions, shared resize reuse and delayed first connection, three canceled intent branches, legacy detail, distinct phases, icon failure, disabled state and replacement.
- 292 prior non-Node definitions preserved after removing only the declared three additions from FollowUpAction and three from its Node. Node registrations unchanged.
- 21 selected file hashes checked before/after execution; base schema and actual standalone CSS closure pass; external resource requests0.

The geometry/ResizeObserver adapters are explicit JSDOM fixtures. They are not native layout, icon decoding or pixel evidence. No new CDN or remote CI was executed. The original finite consumer and exact CDN154 locks remain unchanged historical inputs; this test does not promote the canonical row automatically.
