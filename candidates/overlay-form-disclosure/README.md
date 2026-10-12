# Original overlay and form-disclosure consumer

This source consumer fixes `3bcff1a6cd31337e896cad93562be2dcb05a1869`, which
includes overlay ownership source `3123488036197f5910b3084706a73f53cfd448f4`.
The original fictional paper-model fixture contains two local explanatory overlays
and a required text field behind two disclosure levels. It sends no service request.

Four actual public-mount flows pass against the fixed local
`test-dist/iui.global.min.js`:

1. Tooltip and Popover open, update, dismiss and reopen without retaining session resources.
2. A host frame callback or observer constructor replacing/disposing the view before
   returning its resource cannot leave the old resource active.
3. Invalid form submission expands only the required field's owned disclosure path
   and moves focus to that input. Unrelated and external host disclosures remain
   closed; a valid local submission does not expand them.
4. A synchronous host update/dispose during disclosure opening cannot focus an old field.

Twelve source/build leaves and the embedded stylesheet are checked before/after
execution. Host popover, frame and observer APIs are explicit test shims; these
JSDOM assertions do not establish actual browser positioning or pixel geometry.
No build, compiler, new browser or full-library suite is run here.

```sh
node --max-old-space-size=768 candidates/overlay-form-disclosure/verify-source.mjs --library /path/to/exact-source-build
node --test tests/overlay-form-disclosure.test.mjs
```

The published214 CDN at `fed5f86f49e73f908ac9ea98966b1515a3aaa597` does not include
these source-only fixes. The tracked `cdn/` directory in this read-point is the
older package; the consumer deliberately reads `test-dist/` and does not claim a
new52-asset release. Current accounting remains209 implemented/214 registrations.

## Verified source publication

The final source is [693d0ef5](https://github.com/Micraow/Inform-UI/commit/693d0ef543ab1b842b09e223c03f3d1fff539dfb), including overlay predecessor61a9795d. [source-public.json](source-public.json) records the exact1374-leaf tree, all7 changed source/test/doc payloads independently fetched and SHA-checked, and54 CDN leaves unchanged fromfed5. Both public commits have0 Actions runs. The original consumer execution receipt retains its then-unpublishednull identity. Localdist/test-dist are not distributed by this source-only commit; build this exact source to use the fix.
