import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createProfile, createRuntime, mount} from '../../assets/runtime/node.mjs';

// Original, neutral fixtures. No browser, remote runtime, scripts or network resources
// are loaded. DOM assertions establish composition and behavior, not pixel layout.
// JSDOM's trusted selector dependency needs Function; this isolated DOM test group
// runs without the strict group's code-generation flag. DSL evaluation is unchanged,
// and all existing contract tests retain --disallow-code-generation-from-strings.
const frames = [
  {label:'First position', x:20, color:'blue', description:'The blue marker is at x = 20.'},
  {label:'Second position', x:70, color:'orange', description:'The orange marker is at x = 70.'},
];
const introduction = 'A marker has **two positions**. Compare its `x` coordinate with the [reference](https://example.com/guide).';
const conclusion = 'Both positions belong to one example. The surrounding explanation stays in the reading flow.';
const source = [
  '$step = 0',
  'frames = ' + JSON.stringify(frames),
  'frame = frames[$step]',
  'root = Stack([' + [
    'MarkdownView({value:' + JSON.stringify(introduction) + '})',
    'SvgView({viewBox:"0 0 100 100",label:frame.label,shapes:[{tag:"circle",attrs:{cx:frame.x,cy:50,r:10,fill:frame.color}},{tag:"text",attrs:{x:10,y:90},text:frame.label}]})',
    'Text(frame.description)',
    'Row([Button("Next",@Set($step,1),"secondary",$step==1),Button("Back",@Set($step,0),"secondary",$step==0)],"sm")',
    'MarkdownView({value:' + JSON.stringify(conclusion) + '})',
  ].join(',') + '])',
].join('\n');

const accepted = result => {
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  return result.snapshot;
};

function setup(config, input = source) {
  // Scripts and external resource loading remain disabled by JSDOM's defaults.
  const dom = new JSDOM('<!doctype html><html lang="en"><body><main id="host"></main></body></html>');
  const host = dom.window.document.getElementById('host');
  let app;
  try {
    app = mount(host, {...config, source:input});
    assert.equal(app.getSnapshot()?.phase, 'ready', 'fixture must commit before DOM assertions');
    return {host, app, close() { app.dispose(); dom.window.close(); }};
  } catch (error) {
    app?.dispose();
    dom.window.close();
    throw error;
  }
}

function assertFrame({host, app}, index) {
  const frame = frames[index];
  const snapshot = app.getSnapshot();
  const children = snapshot.tree.props.children;
  assert.equal(snapshot.state.$step, index);
  assert.equal(children[1].props.data.label, frame.label);
  assert.deepEqual(children[1].props.data.shapes[0].attrs, {cx:frame.x, cy:50, r:10, fill:frame.color});
  assert.equal(children[1].props.data.shapes[1].text, frame.label);
  assert.equal(children[2].props.content, frame.description);

  const svg = host.querySelector('svg');
  assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
  assert.equal(svg.getAttribute('viewBox'), '0 0 100 100');
  assert.equal(svg.getAttribute('role'), 'img');
  assert.equal(svg.getAttribute('aria-label'), frame.label);
  assert.equal(svg.querySelector('text').textContent, frame.label);
  const circle = svg.querySelector('circle');
  for (const [attribute, value] of Object.entries({cx:frame.x, cy:50, r:10, fill:frame.color})) {
    assert.equal(circle.getAttribute(attribute), String(value), attribute);
  }
  assert.equal(host.querySelector('[data-component="Text"]').textContent, frame.description);
  const buttons = [...host.querySelectorAll('button')];
  assert.deepEqual(buttons.map(button => button.textContent), ['Next', 'Back']);
  assert.deepEqual(buttons.map(button => button.disabled), [index === 1, index === 0]);
  assert.deepEqual(children[3].props.children.map(button => button.props.disabled), [index === 1, index === 0]);
  return buttons;
}

for (const directory of ['web-chat-core', 'curated-web-chat']) {
  const config = JSON.parse(await readFile(new URL('../../profiles/' + directory + '/profile.json', import.meta.url), 'utf8'));
  const selection = {select:config.select, viewNames:config.viewNames};

  test(directory + ' composes prose, a local SVG interaction and prose using its actual profile', () => {
    assert(config.select.includes('views/content'));
    for (const name of ['MarkdownView', 'SvgView']) assert(config.viewNames.includes(name), name + ' must be explicitly selected');
    const runtime = createRuntime(createProfile(selection));
    try {
      const snapshot = accepted(runtime.commit(source));
      assert.deepEqual(snapshot.tree.props.children.map(node => node.typeName), ['MarkdownView', 'SvgView', 'Text', 'Row', 'MarkdownView']);
    } finally { runtime.dispose(); }

    const x = setup(selection);
    try {
      const stack = x.host.querySelector('[data-component="Stack"]');
      assert.deepEqual([...stack.children].map(node => node.dataset.component), ['MarkdownView', 'SvgView', 'Text', 'Row', 'MarkdownView']);
      assert.equal(x.host.querySelector('[data-component="Card"], [data-component="Alert"], [data-component$="Chart"]'), null);
      const markdown = () => [...x.host.querySelectorAll('.iui-markdown')];
      const prose = markdown().map(node => node.textContent);
      assert.equal(markdown().length, 2);
      assert.equal(markdown()[0].querySelector('strong').textContent, 'two positions');
      assert.equal(markdown()[0].querySelector('code').textContent, 'x');
      const link = markdown()[0].querySelector('a');
      assert.equal(link.getAttribute('href'), 'https://example.com/guide');
      assert.equal(link.target, '_blank');
      assert(link.relList.contains('noopener'));
      assert(link.relList.contains('noreferrer'));
      assert.equal(markdown()[1].textContent, conclusion);

      let buttons = assertFrame(x, 0);
      let revision = x.app.getSnapshot().revision;
      buttons[1].click();
      assert.equal(x.app.getSnapshot().revision, revision, 'disabled Back must not dispatch');
      assertFrame(x, 0);

      buttons[0].click();
      buttons = assertFrame(x, 1);
      assert.equal(x.app.getSnapshot().revision, revision + 1, 'one click produces one coherent state revision');
      assert.deepEqual(markdown().map(node => node.textContent), prose, 'local interaction preserves the surrounding prose');
      revision = x.app.getSnapshot().revision;
      buttons[0].click();
      assert.equal(x.app.getSnapshot().revision, revision, 'disabled Next must not dispatch');
      assertFrame(x, 1);

      buttons[1].click();
      assertFrame(x, 0);
      assert.equal(x.app.getSnapshot().revision, revision + 1);
      assert.deepEqual(markdown().map(node => node.textContent), prose);
    } finally { x.close(); }
  });

  const unsafeShapes = [
    ['event handler', {tag:'circle', attrs:{cx:20, cy:50, r:10, onclick:'alert(1)'}}, 'SVG_ATTRIBUTE', '/attrs/onclick'],
    ['inline style', {tag:'circle', attrs:{cx:20, cy:50, r:10, style:'fill:red'}}, 'SVG_ATTRIBUTE', '/attrs/style'],
    ['href', {tag:'circle', attrs:{cx:20, cy:50, r:10, href:'https://example.com/asset.svg'}}, 'SVG_ATTRIBUTE', '/attrs/href'],
    ['external paint URL', {tag:'circle', attrs:{cx:20, cy:50, r:10, fill:'url(https://example.com/asset.svg#paint)'}}, 'SVG_PAINT', '/attrs/fill'],
    ['script element', {tag:'script', text:'alert(1)'}, 'schema', '/tag'],
    ['foreignObject element', {tag:'foreignObject', text:'Unsafe embedded content'}, 'schema', '/tag'],
  ];
  for (const [name, shape, code, path] of unsafeShapes) {
    test(directory + ' rejects SVG ' + name + ' without replacing the accepted snapshot', () => {
      const runtime = createRuntime(createProfile(selection));
      try {
        const before = accepted(runtime.commit(source));
        const data = {viewBox:'0 0 100 100', label:'Untrusted shape', shapes:[shape]};
        const rejected = runtime.commit('root=Stack([SvgView(' + JSON.stringify(data) + ')])');
        assert.equal(rejected.ok, false);
        assert(rejected.issues.some(issue => issue.code === code && issue.path.endsWith(path)), JSON.stringify(rejected.issues));
        assert.deepEqual(runtime.getSnapshot(), before, 'rejected content must not replace the valid local state or tree');
      } finally { runtime.dispose(); }
    });
  }

  test(directory + ' renders dangerous Markdown HTML as literal text', () => {
    const value = '<script>alert(1)</script> <img src=x onerror=alert(1)> <svg onload=alert(1)>unsafe</svg> <iframe src="https://example.com"></iframe>';
    const x = setup(selection, 'root=Stack([MarkdownView(' + JSON.stringify({value}) + ')])');
    try {
      const markdown = x.host.querySelector('.iui-markdown');
      assert.equal(markdown.textContent, value);
      assert.equal(markdown.querySelector('script, img, svg, iframe, object, embed'), null);
      assert.equal(markdown.querySelector('[onclick], [onerror], [onload]'), null);
    } finally { x.close(); }
  });

  test(directory + ' keeps unsafe Markdown links literal while preserving safe inline formatting', () => {
    const unsafe = '[unsafe](javascript:alert(1)) and [data](data:text/html,unsafe)';
    const value = unsafe + ' plus **strong** and `code` with [safe](https://example.com).';
    const x = setup(selection, 'root=Stack([MarkdownView(' + JSON.stringify({value}) + ')])');
    try {
      const markdown = x.host.querySelector('.iui-markdown');
      assert(markdown.textContent.includes(unsafe));
      assert.equal(markdown.querySelector('strong').textContent, 'strong');
      assert.equal(markdown.querySelector('code').textContent, 'code');
      assert.deepEqual([...markdown.querySelectorAll('a')].map(link => link.getAttribute('href')), ['https://example.com']);
      assert.equal(markdown.querySelector('script, iframe, object, embed'), null);
    } finally { x.close(); }
  });
}
