# Versioned consumers and compatibility

Choose a runtime by its exact source or asset identity. The directory names below
are stable repository paths. Each consumer's README, lock and execution result
are the authority for that consumer's input and verified scope.

## Current public versions

- Packaged browser assets: [fed5f86f49e73f908ac9ea98966b1515a3aaa597](https://github.com/Micraow/Inform-UI/tree/fed5f86f49e73f908ac9ea98966b1515a3aaa597/cdn), protocol 214 and 209 implemented canonical components.
- GCS source: [c138b93b745990c02ec41d7b924cb615d80ed172](https://github.com/Micraow/Inform-UI/commit/c138b93b745990c02ec41d7b924cb615d80ed172), matching verified source `901406db5d3a02c2dffa069c670e983076502096`.
- ROX source: [d9b0ed410d9aa2dd7f8fa888ff44b22595239853](https://github.com/Micraow/Inform-UI/commit/d9b0ed410d9aa2dd7f8fa888ff44b22595239853), matching verified source `8834c693d1d54772fad62883f8781f064fa4107c`.
- qSOFA source: [09733658d6fff687f4255ea6dde2901772ce33c1](https://github.com/Micraow/Inform-UI/commit/09733658d6fff687f4255ea6dde2901772ce33c1), matching09475c7b and43 checked source files.
- Questionnaire source: [a97a7c13323a91662f758c5c0034e943776935a3](https://github.com/Micraow/Inform-UI/commit/a97a7c13323a91662f758c5c0034e943776935a3), matching29c6905 and43 checked source files; protocol218.
- Published capability inventory: [ba96c208c3934e89d861d8e75ec02195eede7941](https://github.com/Micraow/Inform-UI/commit/ba96c208c3934e89d861d8e75ec02195eede7941), [212/256 implemented](references/scope212-public.json):53 historical functional acceptances plus159 pending full acceptance, zero partial and44 missing. Its protocol registration is217; the later generic questionnaire adds one protocol node, not a historical canonical item.

The [original212 snapshot](references/recovery-scope212.json) and consumer locks preserve their at-test publication state. Separate source-public receipts establish the now-available exact sources without rewriting historical results. All three new source revisions are distinct from the packaged browser assets above.

The later source releases retain the earlier 214 browser package. Building source
and downloading packaged assets are separate choices: the 214 package cannot run
GCS, ROX, qSOFA or questionnaire merely because the repository also contains their newer source files.

## Recent executable consumers

The independent [declarative questionnaire](candidates/questionnaire/README.md)
adds a generic source-build contract with original nonmedical inputs. Its runtime
lock identifies protocol218; it is not part of the published214 package. The
historical212/256 inventory is unchanged. The remaining44 dedicated components
are outside the current implementation target, rather than being marked complete
by a generic form.

| Consumer | Exact verified source/asset | Actual checks |
| --- | --- | --- |
| [GCS scorecard](candidates/gcs-scorecard/README.md) | `901406db5d3a02c2dffa069c670e983076502096` | 143 arithmetic checks including 120 numeric triplets; 10 accepted/14 rejected documents; seven DOM/standalone flows |
| [ROX scorecard](candidates/rox-scorecard/README.md) | `8834c693d1d54772fad62883f8781f064fa4107c` | 40 arithmetic checks; 10 accepted/12 rejected documents; five DOM/standalone flows |
| [qSOFA consensus scorecard](candidates/qsofa-scorecard/README.md) | `09475c7b899dc1eb2e46c8f59f8ed45d2afd99b6`, public source `09733658` | 49 arithmetic checks; 10 accepted/14 rejected documents; five DOM/standalone flows |
| [214 package](candidates/recovery214/README.md) | `0e2ea9105fb362539d135a5344f60ec2cf3e8ec6`, public `fed5f86f` | 52 remote asset payloads and SRI; ESM/global each 12 accepted/8 rejected documents; eight representative flows and an actual standalone page |
| [Corrected civil-date arithmetic](candidates/corrected-age/README.md) | `371074e4e5358a0c0e4020240b7c3c4a3e98b8e3` | Eight accepted/eight rejected documents; seven DOM/standalone flows |
| [Host Reset controls](candidates/host-form-reset/README.md) | `391e3cbe7914d0f8eeaed88ba62e8eee3df29688` | Four Slider/Toggle/Select reset, cancellation and newer-input flows |
| [Host text/choice fields](candidates/host-fields-reset/README.md) | `44c0de48bd76932a0111a3be195d90411b1c7195` | Five actual DOM flows including invalid numeric draft and pointer/reset behavior |
| [Overlay and form disclosure](candidates/overlay-form-disclosure/README.md) | `3bcff1a6cd31337e896cad93562be2dcb05a1869`, public `693d0ef5` | Four resource, disclosure-focus and generation-ownership flows |

All values in these examples are synthetic. Local requests are observable and
cancelable; the tests do not access patient records, clinical services, a real
clipboard, bank accounts, recording devices or actual task schedulers. Numerical
software validation does not establish clinical effectiveness or suitability.

## Running a consumer

Use Node.js 22 or later. Build the exact source revision identified in the chosen
consumer's lock, preserving the checked source paths and generated files. There is
no automatic runtime download or fallback to a different version.

```sh
node --test tests/rox-scorecard.test.mjs
node --max-old-space-size=768 candidates/rox-scorecard/verify-source.mjs --library /path/to/exact-source-build
```

For the 214 asset package, execute entries separately against the same fixed files:

```sh
node --max-old-space-size=768 candidates/recovery214/verify-cdn.mjs --library /path/to/exact214 --entry esm
node --max-old-space-size=768 candidates/recovery214/verify-cdn.mjs --library /path/to/exact214 --entry global
node --max-old-space-size=768 candidates/recovery214/verify-cdn.mjs --library /path/to/exact214 --entry standalone
```

A file lock records safe relative paths, bytes and hashes. It does not require
repository instructions or preserve an arbitrary local Git directory. Source
commit identities record provenance; the actual file hashes verify the input.

## Other domains and older fixed releases

The [candidate directories](candidates/) contain original readers for supplied
finance, weather, sports, learning, onboarding, capability cards and local forms.
Use the matching README and fixture; contracts vary by family. A component name
alone is not sufficient to infer its fields or side effects.

The [183 package](candidates/recovery183/README.md),
[164 package](candidates/recovery164/README.md),
[154 package](candidates/recovery154/README.md) and
[older foundational guide](SKILL.7b9a332.md) remain available for reproducibility.
Their schema, runtime URLs and test results belong to their own fixed versions.
Do not run a newer example against an older package or label an earlier browser
result as coverage of a later source release.

## Evidence boundaries

Structural validation, semantic checks, actual DOM/standalone execution, native
browser tests and pixel review measure different things. The consumer receipts
state which were executed. Source-only publication does not imply a new CDN
build; `[skip ci]` publication does not imply that remote CI ran. No source here
claims clinical validation from software tests or transfers third-party rights.
