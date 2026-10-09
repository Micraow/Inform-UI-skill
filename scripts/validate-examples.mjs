import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkSkill, readSkillShell, root } from './check-skill.mjs';

const argument = process.argv.indexOf('--library');
if (argument >= 0 && !process.argv[argument + 1]) throw new Error('--library requires a checkout path.');
const library = path.resolve(argument >= 0 ? process.argv[argument + 1] : process.env.IUI_LIBRARY_DIR || path.join(root, '../Inform-UI'));
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const contract = await readJson(path.join(root, 'library-contract.json'));
const packageJson = await readJson(path.join(library, 'package.json')).catch(error => {
  throw new Error(`Build the matched Inform-UI checkout and pass --library PATH. Cannot read ${library}: ${error.message}`);
});
assert.equal(packageJson.name, contract.packageName, 'Wrong library package');
assert.equal(packageJson.version, contract.packageVersion, 'Library version differs from the tested contract');
if (!process.argv.includes('--allow-working-tree')) {
  assert.match(contract.revision ?? '', /^[a-f0-9]{40}$/, 'Contract needs a verified library commit');
  const revision = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  assert.equal(revision.status, 0, 'Use the pinned Git checkout, or explicitly opt into --allow-working-tree for development');
  assert.equal(revision.stdout.trim(), contract.revision, 'Library checkout differs from the pinned tested revision');
}
function exportedPath(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return exportedPath(value.import ?? value.default);
  throw new Error('The library must expose an ESM import/default entrypoint.');
}
const entry = path.resolve(library, exportedPath(packageJson.exports['.']));
const api = await import(pathToFileURL(entry).href).catch(error => {
  throw new Error(`Cannot import built library ${entry}; run npm ci and npm run build in the library. ${error.message}`);
});
for (const name of contract.apiExports) assert.equal(typeof api[name], 'function', `Missing public API export ${name}`);
const schema = await readJson(path.resolve(library, exportedPath(packageJson.exports[contract.schemaExport])));
assert.equal(schema.properties.version.const, contract.schemaVersion);
const inventory = await readJson(path.join(root, 'references/node-support.json'));
assert.deepEqual(schema.$defs.Node.oneOf.map(node => { const definition = node.$ref ? schema.$defs[node.$ref.split('/').at(-1)] : node; return definition.properties.type.const; }).sort(), inventory.map(item => item.type).sort(), 'Node inventory drifted from the real library schema');
await checkSkill();
const skillSource = await readFile(path.join(root, 'SKILL.md'), 'utf8');
const shell = readSkillShell(skillSource);
const literalExamples = [...skillSource.matchAll(/^```json\r?\n([\s\S]*?)^```/gm)].map(match => JSON.parse(match[1]));
for (const value of literalExamples) {
  const checked = api.validateDocument(value.version ? value : { version: contract.schemaVersion, body: [value] });
  assert.equal(checked.ok, true, 'Root skill literal example: ' + JSON.stringify(checked.issues));
}
console.log(`PASS ${literalExamples.length} self-contained JSON contract examples`);
const shellResult = api.validateDocument(shell.document);
assert.equal(shellResult.ok, true, JSON.stringify(shellResult.issues));
for (const x of [1, 4, 10]) {
  const evaluated = api.evaluateState(shellResult.document, { x });
  assert.equal(evaluated.ok, true);
  assert.equal(evaluated.computed.twice, 2 * x);
}
console.log('PASS root SKILL.md HTML-shell JSON and bound values');

const names = (await readdir(path.join(root, 'examples'))).filter(name => name.endsWith('.json')).sort();
const directory = await mkdtemp(path.join(tmpdir(), 'inform-ui-skill-'));
function cli(args) {
  const result = spawnSync(process.execPath, [path.join(library, contract.cli), ...args], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  return result;
}
try {
  for (const name of names) {
    const file = path.join(root, 'examples', name);
    const document = await readJson(file);
    const before = JSON.stringify(document);
    const result = api.validateDocument(document);
    assert.equal(result.ok, true, `${name}: ${JSON.stringify(result.issues)}`);
    const options = { backend: 'portable', assets: 'inline', lang: ['hpcc-feedback.json', 'local-practice.json', 'supplied-weather.json', 'coordinate-scenarios.json', 'supplied-sports.json', 'local-learning.json', 'supplied-finance.json', 'supplied-heatmap.json'].includes(name) ? 'zh-CN' : 'en' };
    const html = await api.compileHtml(result.document, options);
    assert.equal(typeof html, 'string');
    assert.ok(html.toLowerCase().includes('<!doctype html>'), `${name}: no standalone HTML document`);
    assert.equal(await api.compileHtml(result.document, options), html, `${name}: nondeterministic compilation`);
    assert.equal(JSON.stringify(document), before, `${name}: validation or compilation mutated input`);
    cli(['validate', file, '--json']);
    const out = path.join(directory, name.replace(/\.json$/, '.html'));
    cli(['build', file, '--out', out, '--lang', options.lang]);
    assert.equal(await readFile(out, 'utf8'), html, `${name}: API/CLI build mismatch`);
    console.log(`PASS ${name}: validate, compile twice, CLI validate/build, input immutability`);
  }
  const feedback = await readJson(path.join(root, 'examples/hpcc-feedback.json'));
  assert.equal(typeof api.evaluateState, 'function', 'Missing public state evaluator');
  for (const [load, maximum, window] of [[1.2, 1.2, 84.16666666666666], [0.9, 0.9, 110.55555555555554], [0.4, 0.9, 110.55555555555554], [1.5, 1.5, 68.33333333333333]]) {
    const evaluated = api.evaluateState(feedback, { middleLoad: load });
    assert.equal(evaluated.ok, true, JSON.stringify(evaluated.issues));
    assert.equal(evaluated.computed.maximumLoad, maximum);
    assert.ok(Math.abs(evaluated.computed.nextWindow - window) < 1e-9, 'Feedback calculation disagrees with explanatory prose');
  }
  const stateExample = api.evaluateState(feedback, { middleLoad: 0.9 });
  assert.equal(stateExample.ok, true);
  assert.equal(stateExample.state.middleLoad, 0.9);
  assert.equal(stateExample.computed.maximumLoad, 0.9);
  assert.equal(stateExample.document, undefined, 'State evaluation returns value maps, not a document');
  assert.equal(feedback.state.middleLoad, 1.2, 'State evaluation must not mutate document state');
  assert.equal(api.evaluateState(feedback).state.middleLoad, 1.2, 'Calls start from initial state');
  for (const [patch, code] of [[{ maximumLoad: 0.9 }, 'UNKNOWN_BIND'], [{ middleLoad: '0.9' }, 'INPUT_TYPE'], [{ middleLoad: 2 }, 'INPUT_RANGE']]) {
    const failed = api.evaluateState(feedback, patch);
    assert.equal(failed.ok, false);
    assert.ok(failed.issues.some(issue => issue.code === code), JSON.stringify(failed));
    assert.equal(failed.computed, undefined);
  }
  console.log('PASS documented evaluateState success shape, errors and initial-state behavior');
  console.log('PASS feedback values at initial, changed, minimum and maximum inputs');
  const practice = await readJson(path.join(root, 'examples/local-practice.json'));
  for (const [patch, total] of [[{}, 70], [{ sessions: 4 }, 95], [{ sessions: 1, breakMinutes: 10 }, 20], [{ minutes: 45, sessions: 6, breakMinutes: 10 }, 320]]) {
    const result = api.evaluateState(practice, patch);
    assert.equal(result.ok, true, JSON.stringify(result.issues));
    assert.equal(result.computed.total, total);
  }
  const invalidDraft = structuredClone(practice);
  invalidDraft.state.plan = '';
  assert.equal(api.validateDocument(invalidDraft).ok, true, 'A form draft can be a structurally valid document');
  console.log('PASS local form derived values and structurally valid unfinished drafts');
  const weather = literalExamples.find(node => node.type === 'weather');
  assert.ok(weather, 'Self-contained weather input example is required');
  const invalidWeather = changes => ({ version: 'iui/1', body: [{ ...structuredClone(weather), ...changes }] });
  const sports = literalExamples.find(node => node.type === 'sports-scoreboard');
  const quiz = literalExamples.find(node => node.type === 'quiz');
  const finance = literalExamples.find(node => node.type === 'finance-quote');
  const heatmap = literalExamples.find(node => node.type === 'finance-heatmap');
  assert.ok(sports && quiz, 'Self-contained new domain examples are required');
  assert.ok(finance && heatmap, 'Root finance/heatmap examples are required');
  const changedNode = (node, change) => { const value = structuredClone(node); change(value); return { version: 'iui/1', body: [value] }; };
  const baseChart = { type: 'chart', kind: 'line', xScale: 'linear', xKey: 'x', data: [{ x: 0, y: 1 }, { x: 10, y: 2 }], series: [{ key: 'y', label: 'Synthetic' }] };
  const invalid = [
    ['finance negative price', changedNode(finance, n => n.instrument.price = -1)],
    ['finance invalid currency', changedNode(finance, n => n.instrument.currency = 'usd')],
    ['finance missing delay declaration', changedNode(finance, n => delete n.instrument.delayMinutes)],
    ['finance timestamp without offset', changedNode(finance, n => n.instrument.asOf = '2026-10-09T10:00:00')],
    ['finance history reversed', changedNode(finance, n => n.instrument.history.reverse())],
    ['finance history repeated', changedNode(finance, n => n.instrument.history.push(n.instrument.history.at(-1)))],
    ['finance history after snapshot', changedNode(finance, n => n.instrument.asOf = '2026-10-08T10:00:00Z')],
    ['finance initial range missing', { version: 'iui/1', body: [{ ...finance, type: 'finance-chart', ranges: [], initialRange: 'missing' }] }],
    ['finance range reversed', { version: 'iui/1', body: [{ ...finance, type: 'finance-chart', ranges: [{ id: 'bad', label: 'Bad', from: '2026-10-09T10:00:00Z', to: '2026-10-08T10:00:00Z' }] }] }],
    ['finance repeated instrument id', { version: 'iui/1', body: [{ type: 'finance-comparison', source: finance.source, instruments: [finance.instrument, finance.instrument], baselineAt: '2026-10-08T10:00:00Z', ranges: [] }] }],
    ['heatmap filter missing', changedNode(heatmap, n => n.initialSector = 'missing')],
    ['heatmap invalid timezone', changedNode(heatmap, n => n.timezone = 'Invalid/Zone')],
    ['heatmap missing area meaning', changedNode(heatmap, n => delete n.weightLabel)],
    ['heatmap missing change basis', changedNode(heatmap, n => delete n.changeBasis)],
    ['sports repeated team id', changedNode(sports, n => n.data.teams.push(n.data.teams[0]))],
    ['sports unknown opponent', changedNode(sports, n => n.data.games[0].awayTeam = 'missing')],
    ['sports identical opponents', changedNode(sports, n => n.data.games[0].awayTeam = 'north')],
    ['sports scheduled zero score', changedNode(sports, n => n.data.games[0].homeScore = 0)],
    ['sports timestamp without offset', changedNode(sports, n => n.data.games[0].startAt = '2026-10-10T19:00:00')],
    ['sports unknown selected game', changedNode(sports, n => n.gameId = 'missing')],
    ['sports live winner', changedNode(sports, n => { n.data.games[0].status = 'live'; n.data.games[0].winnerTeamId = 'north'; })],
    ['sports scheduled tiebreak', changedNode(sports, n => n.data.games[0].tieBreak = { label: 'Tie', home: 1, away: 0 })],
    ['sports impossible record', changedNode(sports, n => n.data.standings = [{ teamId: 'north', rank: 1, played: 2, won: 3, drawn: 0, lost: 0, points: 9 }])],
    ['quiz repeated question id', changedNode(quiz, n => n.questions.push(n.questions[0]))],
    ['quiz repeated choice id', changedNode(quiz, n => n.questions[0].choices.push(n.questions[0].choices[0]))],
    ['quiz unknown answer', changedNode(quiz, n => n.questions[0].correct = ['missing'])],
    ['quiz single multiple answers', changedNode(quiz, n => n.questions[0].correct = ['four', 'five'])],
    ['quiz missing explanation', changedNode(quiz, n => delete n.questions[0].explanation)],
    ['flashcards duplicate ids', { version: 'iui/1', body: [{ type: 'flashcards', title: 'Synthetic', cards: [{ id: 'a', front: 'A', back: 'B' }, { id: 'a', front: 'C', back: 'D' }] }] }],
    ['numeric input string state', { version: 'iui/1', state: { count: '2' }, body: [{ type: 'input', kind: 'number', label: 'Count', bind: 'count' }] }],
    ['disabled is not boolean', { version: 'iui/1', body: [{ type: 'field', label: 'Group', disabled: 'yes', children: [{ type: 'text', value: 'Example' }] }] }],
    ['nested form', { version: 'iui/1', body: [{ type: 'form', label: 'Outer', children: [{ type: 'form', label: 'Inner', children: [] }] }] }],
    ['form action URL', { version: 'iui/1', body: [{ type: 'form', label: 'Local', action: 'https://example.org/send', children: [] }] }],
    ['linear chart order', { version: 'iui/1', body: [{ ...baseChart, data: [{ x: 10, y: 1 }, { x: 0, y: 2 }] }] }],
    ['chart clips observation', { version: 'iui/1', body: [{ ...baseChart, xMin: 0, xMax: 1 }] }],
    ['scatter without numeric axis', { version: 'iui/1', body: [{ ...baseChart, kind: 'scatter', xScale: 'category' }] }],
    ['negative donut', { version: 'iui/1', body: [{ ...baseChart, kind: 'donut', xScale: 'category', data: [{ x: 'A', y: -1 }] }] }],
    ['weather percentage over 100', invalidWeather({ daily: [{ ...weather.daily[0], precipitationProbability: 101 }] })],
    ['weather invalid timezone', invalidWeather({ location: { name: 'Synthetic', timezone: 'Invalid/Zone' } })],
    ['weather duplicate day', invalidWeather({ daily: [weather.daily[0], weather.daily[0]] })],
    ['weather missing provenance', invalidWeather({ source: { label: 'Unmarked' } })],
    ['unknown type', { version: 'iui/1', body: [{ type: 'live-weather', city: 'Example' }] }],
    ['native runtime', { version: 'iui/1', body: [{ type: 'native', name: 'text', children: [] }] }],
    ['undefined reference', { version: 'iui/1', body: [{ type: 'metric', label: 'Missing', value: { $: 'undeclared' } }] }],
    ['invalid table shape', { version: 'iui/1', body: [{ type: 'table', columns: ['A', 'B'], rows: [[1]] }] }],
    ['unsafe link', { version: 'iui/1', body: [{ type: 'link', value: 'Unsafe', href: 'javascript:alert(1)' }] }],
    ['computed cycle', { version: 'iui/1', computed: { a: { $: 'b' }, b: { $: 'a' } }, body: [{ type: 'text', value: { $: 'a' } }] }],
    ['invalid slider binding', { version: 'iui/1', state: { value: 'not numeric' }, body: [{ type: 'slider', label: 'Input', bind: 'value', min: 0, max: 10, step: 1 }] }]
  ];
  for (const [label, document] of invalid) {
    const result = api.validateDocument(document);
    assert.equal(result.ok, false, `${label}: unsafe/invalid input accepted`);
    assert.ok(result.issues.length > 0);
    for (const issue of result.issues) {
      assert.equal(typeof issue.code, 'string');
      assert.equal(typeof issue.path, 'string');
      assert.ok(issue.path === '' || issue.path.startsWith('/'));
      assert.equal(typeof issue.message, 'string');
    }
    const invalidFile = path.join(directory, `invalid-${label.replaceAll(' ', '-')}.json`);
    await writeFile(invalidFile, JSON.stringify(document));
    const cliResult = spawnSync(process.execPath, [path.join(library, contract.cli), 'validate', invalidFile, '--json'], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(cliResult.status, 1, `${label}: CLI exit code should identify invalid input`);
    assert.deepEqual(JSON.parse(cliResult.stdout), result, `${label}: CLI/API diagnostics differ`);
    await assert.rejects(() => api.compileHtml(document, { backend: 'portable', assets: 'inline' }), `${label}: compiler accepted invalid input`);
    console.log(`PASS rejects ${label}`);
  }
  console.log(`Verified ${names.length} examples and ${invalid.length} invalid inputs against ${packageJson.name}@${packageJson.version}.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
