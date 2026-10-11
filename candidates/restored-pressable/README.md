# Original passive Pressable draft

The fixture provides a single native action surface around passive Text/Box/Caption content. Its supplied count can change without making the explicit accessible action label stale. The visual subtree does not supply the accessible action name.

`actionId` is an opaque local intent identifier. A host can listen for `iui:press`, inspect the frozen `{componentId, actionId}` detail and call `preventDefault()` to decline the request. There is no implicit URL navigation, service call, persistence or submission.

`disabled` may be a boolean or a Value resolving to a boolean. The example reads `blocked`; its visible count independently reads `count`. A host can update those states through the runtime controller. It must not infer the action label from reactive visual children.

Passive content excludes nested controls, links and external-image loading gates. Base-only authoring is sufficient for this fixture. Optional passive SVG content, where supported, still belongs to the Graphics schema closure.

Five positive and ten negative cases prepare the restored component. This is an original authoring draft. No actual restored runtime, CDN, native button behavior or pixel fidelity is claimed before a precise source/build consumer is attached.
