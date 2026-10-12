# Host reset for text and choice fields

Original paper-model fields consume the exact source-only checkpoint
`44c0de48bd76932a0111a3be195d90411b1c7195`. This follows the separate391e
Slider/Toggle/Select checkpoint and adds coverage for existing Input, Textarea,
Radio and Segmented controls. No protocol or canonical count changes.

## Actual consumer results

Five independent JSDOM groups passed using the real local global browser bundle:

1. Text, multiline text, number, checkbox, radio and segmented values restore
   together through a host `reset()` and its native reset button. A disabled first
   choice does not suppress reset of the enabled group.
2. Cancellation and a disabled control preserve an out-of-range numeric draft
   and its last accepted state. Accepted reset clears the draft, including when
   state already equals its initial value. A newer draft survives the pending reset.
3. New text, a supplied textarea state update and a same-value radio change win
   their own bindings while siblings reset.
4. Replacement and disposal retire pending old work. A replacement uses its own defaults.
5. Real DOM focus transfer during a host Reset pointer gesture keeps error feedback
   hidden until click. The first dispatched click fires one reset; pointer cancellation
   releases deferred validation. This checks visibility sequencing, not pixel geometry.

Ten source/build files match their locked sizes and SHA256 before and after
execution. [consumer-result.json](consumer-result.json) records five passes,
zero resource/service requests and no native, compiler or full-suite execution.
The sparse Node build initially lacked a resolvable `katex` dependency, so the
consumer uses the locked self-contained global bundle rather than changing dependencies.

## Run

```sh
node candidates/host-fields-reset/verify-source.mjs \
  --library /path/to/frozen-44c0-read-point \
  --dependencies /path/to/existing-runtime-checkout
node --test tests/host-fields-reset.test.mjs tests/host-form-reset.test.mjs
```

The dependency checkout supplies the already installed `jsdom`. No build or
dependency copy is needed. Reconciliation waits task boundaries after the host's
default action, using the small shared consumer helper from the391e example.

## Retained negative control

The23dc predecessor passed the four original DOM groups but failed the added
pointer-focus visibility assertion. The identical assertion passes on44c0.
[The before/after receipt](pointer-successor.json), predecessor lock and predecessor
consumer result are retained. Independent native testing had located the23dc
first-click failure in blur-driven layout movement. The consumer does not borrow
its DOM result as proof of actual pointer geometry; independent local Chromium154 replay subsequently passed all12 focused cases
(original8 plus4 field flows). Its [sanitized receipt](independent-native.json) is
separate from the five consumer DOM groups and is not remote CI or broad pixel acceptance.

## Publication and scope

- This local source/build read-point is not a complete52-asset release.
  The matching source-only public commit is
  `3d99c5511619ac2bef0e2773728f08f5ec7fabfa`. Seven remote source files were actually
  fetched and hashed against the44c lock;54 asset leaves remain933.
  See [source-public.json](source-public.json). The consumer execution receipt
  keeps its original publication-time null field. Corrected builds are local read-point
  bytes, so do not load the older remote CDN and expect this reset fix.
- The preceding391e source-only release is verified separately at
  `cf2ed1e8d5df2fb5d0d44872ce0d9ca62434ac84`. Six actual remote source files match,
  and54 remote asset leaves remain unchanged from933. Its corrected local builds
  must not be confused with the older CDN bytes still present in that source commit.
- [Published933](../recovery213-readable-headers/README.md) remains the separately
  locked asset release. Older183 and5081 locks are unchanged.
- All paper-model values are synthetic. These checks use no account, medical,
  personal or network data and do not perform services or clinical calculations.
- Native browser evidence belongs to the independent runtime QA receipt; this
  consumer does not claim native or visual acceptance.
