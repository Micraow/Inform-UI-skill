# Original passive Pressable consumer

The fixture provides a single native action surface around passive Text/Box/Caption content. Its supplied count can change without making the explicit accessible action label stale. The visual subtree does not supply the accessible action name.

`actionId` is an opaque local intent identifier. A host can listen for `iui:press`, inspect the frozen `{componentId, actionId}` detail and call `preventDefault()` to decline the request. There is no implicit URL navigation, service call, persistence or submission.

`disabled` may be a boolean or a Value resolving to a boolean. The example reads `blocked`; its visible count independently reads `count`. A host can update those states through the runtime controller. It must not infer the action label from reactive visual children.

Passive content excludes nested controls, links and external-image loading gates. Base-only authoring is sufficient for this fixture. Optional passive SVG content, where supported, still belongs to the Graphics schema closure.

Five positive and ten negative cases pass the actual Node and browser validators at exact restored source/build `ae77d32314548ddb6e345051c6a9cea1cea3773b`. The original core/labels were recovered before this pin; the broad passive contract, including Caption, is retained.

```sh
node candidates/restored-pressable/verify-source.mjs --library /path/to/exact-runtime
```

The selected lock covers 17 source/build inputs. Seven DOM workflows cover accessible naming, frozen canceled/accepted intents, shared single-flight dispatch, reactive disabled/count values, form isolation, atomic invalid updates, and replacement during intent delivery. One additional workflow checks the included NetWorth successor: modifier/IME navigation does not inspect, while ordinary Home still does. The older NetWorth139 lock and its narrower recorded result remain unchanged. All 262 prior non-Node definitions are equal.

One deterministic standalone HTML artifact contains the whole Pressable stylesheet. Its script is not executed here. No new CDN, native button activation, geometry or pixel acceptance is claimed.
