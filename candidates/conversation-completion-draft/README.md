# Conversation completion fixture draft

Original finite teaching data for the next conversation-suggestions functional completion. This is **not yet runtime schema**. No source/CDN pin or component acceptance is attached.

The six scenario records keep pending, resolved empty and failed states distinct; supplied fallback is explicit. Three resolved choices include two independently generated 16×16 PNG icons, one text-only choice, and separate new-turn/voice requests. Labels and queries are entirely fictional. The host receipt records `performed:false`; it never submits a prompt or opens voice.

Before promotion, map these fixture fields onto the author's fixed schema and check both the existing finite API and new phase/optional-media branches. Actual functional checks should cover:

- Pending 80px loading, resolved empty group, failed fallback/hidden behavior.
- 40px pills and 24px optional icon slots, hide failed icons without stale updates.
- Distinct local new-turn and voice intent metadata, cancellation and disabled controls.
- Literal supplied text, document replacement, and exact source/asset identity.

These dimensions are functional/presentation targets, not native pixel results. Omitted/null semantics must be established by the new schema before adding runtime assertions. The existing functional partial classification remains in force.
