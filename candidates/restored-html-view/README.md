# Original offline authored HTML draft

The example alternates two fictional supplied labels using a local script and clears the choice with a local event handler. All HTML, CSS and JavaScript are independently authored here. It has no external assets, imports, fetches, service calls, parent messaging or persistence.

HTML View is explicitly scriptable authored content, not a text sanitizer. Use ordinary Text/Box components for literal untrusted text. The renderer's opaque-origin iframe grants scripts only; author data cannot request same-origin, popup, top-navigation or form permissions. Its fixed resource policy can permit selected external origins, so an offline fixture is not a blanket promise that every authored HTML document is offline.

The compiler must add hashes for the browser-normalized script and event-handler source only when a rendered HTML View needs them. This does not grant host `script-src 'unsafe-inline'`. Styles and the iframe resource policy remain separate from permissions.

Five positive and eleven negative authoring cases are prepared. There is no runtime or actual script-execution claim yet. Connected-host source-build behavior, iframe attributes and compiler CSP will be checked against one exact pin. Detached-host first-connection behavior is a separate known pending runtime case; native execution and isolation need real-browser evidence.
