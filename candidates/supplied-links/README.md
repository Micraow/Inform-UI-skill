# Original supplied Link-family consumer

This consumer locks source `e6b60a69aa7e889b20743589212642a12128cc18`. It covers `link`, `link-card` and `recommendation-link-card` through original fictional `example.test` destinations, original PNGs and passive Text/Box content. No private capture, fetched metadata or real personal data is included.

```sh
node candidates/supplied-links/verify-source.mjs --library /path/to/matching-library
node --test tests/supplied-links-draft.test.mjs tests/link-family-completion-draft.test.mjs
```

## Authoring and explicit host decisions

New supplied links use `url`, optional `title`, literal `status` and display fields. Resolved readers need an allowed destination; title defaults to that URL. Cards take explicitly supplied source/snippet and optional safe `faviconSrc`; recommendation cards may also take `imageSrc`. Nothing derives a favicon or summary from the URL. Remote images stay behind their separate Load supplied image control; the example instead uses original inline raster PNGs.

Inline links accept bounded passive children and keep their explicit accessible label. Nested buttons, linked text and remote consent-gated image children are rejected. `mobile:true` omits the desktop preview; `hostLink:true` omits both preview and decorative arrow. Pending and failed states are literal supplied states; failure without fallback hides the reader.

`consumer.mjs` explicitly cancels local `iui:link-open` and `iui:link-copy` requests and writes plain text. Both details are frozen `{id,url}` with null when no ID is supplied. They bubble locally and do not cross a ShadowRoot. The new supplied variants never navigate or write a clipboard themselves. Focus can reveal the exact URL, but copying still requires explicit control activation. Escape closes the preview and returns focus. Desktop pointer hover has a150ms delay; touch hover does not open it.

The existing `{type:'link',value,href}` shape remains a distinct native anchor. It cannot mix the new URL/state/display fields. The consumer checks its anchor attributes without activating it, so the legacy navigation policy is not silently replaced by local intent behavior.

## Executed evidence and limits

Both actual Node/browser validators run10 positive/23 negative Link documents plus10/20 preceding Spend documents. The selected base schema also accepts the Link fixtures. Eight DOM/compiler workflows cover passive children, labels, source images, frozen cancellation, explicit copy, Escape/focus, delayed hover/touch exclusion, mobile/host presentation, image gating/failure/source release, phase/disabled/atomic replacement, legacy compatibility and ShadowRoot locality. The observed external request count and clipboard call count are both zero. Remote image gates are inspected but not activated in this zero-network consumer.

The verifier checks23 safe file hashes before and after execution and preserves301 historical definitions. LinkNode has a declared fourteen-property addition and an explicit three-branch compatibility expansion; those exact branches and original remaining fields are checked before projection. Precisely two new Node definitions bring registrations from154 to156. Runtime CSS exports and the actual compiled standalone style body agree.

Canonical scope stays147 implemented,1 partial and108 missing while independent family review is pending. This consumer does not count three new completions. Native activation, hover geometry, image decoding and reference pixels remain unverified. The source-built artifact is distinct from the old packaged CDN; the author's schema aggregate still has its known old-CDN-byte mismatch, so no full-schema or CDN pass is claimed. Standalone HTML policy/style is inspected, not script-executed.
