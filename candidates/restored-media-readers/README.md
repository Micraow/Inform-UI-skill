# Original finite HTML, image and video consumer

`search-image` renders supplied metadata; its name does not grant search capability. The original fixture uses generated inline blue/orange squares. Caller-provided HTTP(S) images may load directly, unlike LearningMedia's explicit remote-loading gate. Do not silently substitute a network URL for an offline asset.

`youtube` accepts a supplied eleven-character identifier, not a URL, provider response, discovery query or SDK. The synthetic identifier in this fixture is structurally valid only: existence, ownership, decoding and playback are not asserted. This example explicitly chooses `on-demand`, a 30-second offset and fullscreen=false. The original default remains direct loading with fullscreen allowed; omitting fields must not be described as zero-network gating. Autoplay remains off.

Five positive and twelve negative cases cover finite source metadata, unknown/pending image data, aspect-ratio and position bounds, exact video IDs and boolean disabled values. These image/video cases and the five positive/eleven negative authored HTML cases now pass both actual built validators at exact source/build `3b88d369cd0cc918d63354b2d6e9086aad41dd71`.

```sh
node candidates/restored-media-readers/verify-source.mjs --library /path/to/exact-runtime
```

Eight actual DOM/compiler workflows cover srcdoc policy/attributes, content-to-thumbnail image fallback using synthetic error events, gated and default-direct video modes, unknown/pending images, atomic updates, resource disposal, detached-host first attachment and permanent retirement after observed owner removal. The fixed shared connection successor closes the detached-start gap originally reported for142. All 266 prior non-Node definitions stay equal; the selected lock covers27 source/build/dependency-license files.

Two real compiler HTML variants retain normalized authored-script/event-handler hashes without granting host script-src unsafe-inline. A plain-document negative control keeps the restrictive old policy. Family CSS is present in actual runtime and compiler output.

The network-denying loader records two attempted fixed-origin video-frame loads and performs no network requests. No authored iframe script, standalone script, native sandbox enforcement, native image decoding, video playback or pixel comparison executes in this check. Attribute/CSP assertions are not a substitute for those browser tests.
