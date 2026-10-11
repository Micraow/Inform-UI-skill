# Original supplied video records

The JSON includes two synthetic provider identifiers and titles, plus an independently generated inline PNG for the TikTok record. These are syntax-only examples. They do not establish that an account/video exists, is owned by anyone, or can play. No private capture is included.

Attach `attachVideoReceipt(host, output)` before interacting. It cancels `iui:video-open` and writes a local text receipt instead of navigating to the supplied provider URL. Put `output` outside the renderer's mount host. Without cancellation, the runtime's contract may open the exact supplied canonical URL. `hoverPreview: false` disables hover playback; it does not promise zero provider metadata/thumbnail requests.

Seven positive/fourteen negative cases cover finite supplied items, phase distinctions, IDs, canonical provider URL matching and thumbnails. Runtime ordinary flows must deny external resources and never invoke a real provider navigation. This draft has no fixed new runtime input or browser playback result yet. Original early143 schema provenance and reconstructed styles are separate from final historical implementation recovery.
