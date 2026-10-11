# Original offline authored HTML

The example alternates two fictional supplied labels using a local script and clears the choice with a local event handler. All HTML, CSS and JavaScript are independently authored here. It has no external assets, imports, fetches, service calls, parent messaging or persistence.

HTML View is explicitly scriptable authored content, not a text sanitizer. Use ordinary Text/Box components for literal untrusted text. The renderer's opaque-origin iframe grants scripts only; author data cannot request same-origin, popup, top-navigation or form permissions. Its fixed resource policy can permit selected external origins, so an offline fixture is not a blanket promise that every authored HTML document is offline.

The compiler must add hashes for the browser-normalized script and event-handler source only when a rendered HTML View needs them. This does not grant host `script-src 'unsafe-inline'`. Styles and the iframe resource policy remain separate from permissions.

Five positive and eleven negative authored HTML cases are included in the [exact144 combined media consumer](../restored-media-readers/README.md). It checks connected and initially detached hosts, iframe attributes, resource retirement and actual compiler CSP against source `3b88d369cd0cc918d63354b2d6e9086aad41dd71`. The shared connection successor closes the original142 detached-start gap in this later source. Actual authored-script execution and native sandbox isolation still need real-browser evidence.
