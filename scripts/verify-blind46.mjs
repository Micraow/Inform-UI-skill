import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, readSkillShell } from './check-skill.mjs';

const arg = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined;
const library = path.resolve(arg('--library') || process.env.IUI_LIBRARY_DIR || path.join(root, '../Inform-UI'));
const frozen = path.join(root, 'tests/blind46');
const contract = JSON.parse(await readFile(path.join(frozen, 'library-contract.json')));
const revision = spawnSync('git', ['-C', library, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
assert.equal(revision.status, 0);
assert.equal(revision.stdout.trim(), contract.revision, '46-node blind acceptance requires its original library');
const pkg = JSON.parse(await readFile(path.join(library, 'package.json')));
const api = await import(pathToFileURL(path.resolve(library, pkg.exports['.'].import)).href);
const hashes = {
  'input-skill.txt': '15a6d47b737619ef257054c806f5a99e27f9fdfbaf560933bf6470178d1262ea',
  'basketball-weekly.html': '2d4df5841c54a2cb43672f557f2266b36c5643bbb487f3641c0edadb3d7fab2c',
  'basketball-weekly.json': 'd4292000b1e985d0e85e4d2ebded8dcbc91d41e6d9de0573f650530a422b4e89'
};
for (const [file, expected] of Object.entries(hashes)) {
  assert.equal(createHash('sha256').update(await readFile(path.join(frozen, file))).digest('hex'), expected, `${file}: immutable first draft changed`);
}
const html = await readFile(path.join(frozen, 'basketball-weekly.html'), 'utf8');
const raw = html.match(/<script id="iui-spec" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(raw && !raw.includes('<'), 'Embedded JSON must escape literal <');
const document = JSON.parse(await readFile(path.join(frozen, 'basketball-weekly.json')));
assert.deepEqual(JSON.parse(raw), document);
assert.equal((html.match(/<script\b/g) || []).length, 3);
assert.equal((html.match(/<link\b/g) || []).length, 1);
assert.equal(/<style\b/i.test(html), false);
assert.deepEqual(html.match(/\sstyle="[^"]*"/g), [' style="margin:0"']);
for (const asset of ['iui.global.min.js', 'iui.css']) assert.ok(html.includes(contract.cdn.baseUrl + asset));
for (const integrity of [contract.cdn.globalIntegrity, contract.cdn.styleIntegrity]) assert.ok(html.includes(integrity));
const shell = readSkillShell(await readFile(path.join(frozen, 'input-skill.txt'), 'utf8'));
assert.equal(html.match(/  <script>\n([\s\S]*?)  <\/script>/)[1], shell.html.match(/  <script>\n([\s\S]*?)  <\/script>/)[1]);
const before = JSON.stringify(document);
assert.equal(api.validateDocument(document).ok, true);
function nodes(value, type, output = []) {
  if (Array.isArray(value)) value.forEach(item => nodes(item, type, output));
  else if (value && typeof value === 'object') {
    if (value.type === type) output.push(value);
    Object.values(value).forEach(item => nodes(item, type, output));
  }
  return output;
}
const sports = ['sports-schedule', 'sports-scoreboard', 'sports-standings'].map(type => {
  assert.equal(nodes(document, type).length, 1);
  return nodes(document, type)[0];
});
const data = sports[0].data;
for (const view of sports) assert.deepEqual(view.data, data, 'Supplied sports snapshots disagree');
assert.equal(data.source.synthetic, true);
assert.equal(data.games.filter(game => game.status === 'final').length, 4);
assert.equal(data.games.filter(game => game.status === 'scheduled').length, 2);
const derived = data.teams.map(team => {
  const row = { teamId: team.id, played: 0, won: 0, lost: 0, for: 0, against: 0, points: 0 };
  for (const game of data.games.filter(game => game.status === 'final' && [game.homeTeam, game.awayTeam].includes(team.id))) {
    row.played++;
    const won = game.winnerTeamId === team.id;
    row.won += Number(won); row.lost += Number(!won); row.points += won ? 2 : 1;
    row.for += game.homeTeam === team.id ? game.homeScore : game.awayScore;
    row.against += game.homeTeam === team.id ? game.awayScore : game.homeScore;
  }
  return row;
}).sort((a, b) => b.points - a.points || (b.for - b.against) - (a.for - a.against) || b.for - a.for || a.teamId.localeCompare(b.teamId));
for (const [index, row] of derived.entries()) {
  const supplied = data.standings.find(item => item.teamId === row.teamId);
  assert.equal(supplied.rank, index + 1);
  for (const [key, value] of Object.entries(row)) assert.equal(supplied[key], value, `${row.teamId}.${key}`);
}
for (const game of data.games) {
  if (game.status === 'scheduled') assert.deepEqual([game.homeScore, game.awayScore], [null, null]);
  if (game.periodScores) for (const side of ['home', 'away']) assert.equal(game.periodScores.reduce((sum, period) => sum + period[side], 0), game[side + 'Score']);
}
const quizSpec = nodes(document, 'quiz')[0], cardSpec = nodes(document, 'flashcards')[0];
assert.equal(quizSpec.questions.length, 5);
assert.equal(quizSpec.questions.reduce((sum, q) => sum + q.points, 0), 6);
assert.equal(cardSpec.cards.length, 4);
assert.deepEqual(quizSpec.questions.map(q => q.correct), [['four'], ['difference'], ['seventy_two'], ['extra'], ['synthetic', 'null_score', 'independent']]);
const temp = await mkdtemp(path.join(tmpdir(), 'iui-blind46-'));
try {
  for (const args of [['validate', path.join(frozen, 'basketball-weekly.json'), '--json'], ['build', path.join(frozen, 'basketball-weekly.json'), '--out', path.join(temp, 'compiled.html'), '--lang', 'zh-CN']]) {
    const run = spawnSync(process.execPath, [path.join(library, contract.cli), ...args], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(run.status, 0, run.stderr + run.stdout);
  }
  const compiled = await api.compileHtml(document, { lang: 'zh-CN' });
  assert.equal(await api.compileHtml(document, { lang: 'zh-CN' }), compiled);
  assert.equal(await readFile(path.join(temp, 'compiled.html'), 'utf8'), compiled);
} finally { await rm(temp, { recursive: true, force: true }); }
assert.equal(JSON.stringify(document), before);
console.log('PASS immutable 46-node first draft: hashes, copied bootstrap, API/CLI, deterministic build, unchanged JSON, 4 independently calculated standings, all period totals, question answers');

if (process.argv.includes('--browser')) {
  const { chromium } = createRequire(path.join(library, 'package.json'))('@playwright/test');
  const screenshots = arg('--screenshots');
  if (screenshots) await mkdir(screenshots, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const observations = [];
  try {
    for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
      const label = `blind46-first-${width}-${theme}`;
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, serviceWorkers: 'block' });
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      const errors = [], responses = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', event => { if (event.type() === 'error') errors.push(event.text()); });
      page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
      page.on('response', response => { if (response.url().startsWith('https:')) responses.push({ url: response.url(), status: response.status() }); });
      await page.goto(pathToFileURL(path.join(frozen, 'basketball-weekly.html')).href);
      await page.waitForSelector('.iui-root');
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth, background: getComputedStyle(document.body).backgroundColor, metricColumns: getComputedStyle(document.querySelector('.iui-metric-grid')).gridTemplateColumns }));
      assert.ok(layout.scroll <= width + 1, JSON.stringify(layout));
      if (theme === 'dark') assert.notEqual(layout.background, 'rgb(255, 255, 255)');
      for (const file of ['iui.css', 'iui.global.min.js']) assert.ok(responses.some(r => r.url === contract.cdn.baseUrl + file && r.status === 200), `${file} not loaded from original CDN`);
      assert.deepEqual((await page.locator('.iui-metric-value').allTextContents()).map(v => v.trim()), ['4场', '4分', '16分']);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${label}-initial.png`), fullPage: true });
      const standings = page.locator('.iui-sports-standings');
      const rows = () => standings.locator('tbody tr').evaluateAll(rows => rows.map(row => ({ team: row.dataset.teamId, rank: row.cells[0].textContent })));
      assert.deepEqual(await rows(), [{ team: 'dawn', rank: '1' }, { team: 'pine', rank: '2' }, { team: 'night', rank: '3' }, { team: 'sea', rank: '4' }]);
      await standings.getByRole('button', { name: '排序: 得分', exact: true }).click();
      assert.deepEqual(await rows(), [{ team: 'dawn', rank: '1' }, { team: 'night', rank: '3' }, { team: 'sea', rank: '4' }, { team: 'pine', rank: '2' }]);
      await standings.getByRole('combobox', { name: '球队', exact: true }).selectOption({ label: '松林队' });
      assert.deepEqual(await rows(), [{ team: 'pine', rank: '2' }]);
      await standings.getByRole('combobox', { name: '球队', exact: true }).selectOption({ label: '全部' });
      const schedule = page.locator('.iui-sports-schedule');
      const gameIds = () => schedule.locator('details[data-game-id]').evaluateAll(items => items.map(item => item.dataset.gameId));
      assert.deepEqual(await gameIds(), ['round3_a', 'round3_b']);
      assert.equal(await schedule.locator('.iui-sports-score[data-missing="true"]').count(), 4);
      await schedule.getByRole('combobox', { name: '比赛日期', exact: true }).selectOption({ label: '全部' });
      assert.equal((await gameIds()).length, 6);
      await schedule.getByRole('combobox', { name: '球队', exact: true }).selectOption({ label: '晨光队' });
      assert.deepEqual(await gameIds(), ['round1_a', 'round2_b', 'round3_a']);
      const detail = schedule.locator('details[data-game-id="round2_b"]');
      await detail.locator('summary').click();
      assert.ok(await detail.getByRole('table').isVisible());
      assert.ok((await detail.textContent()).includes('最终72:64'));
      const board = page.locator('.iui-sports-scoreboard');
      assert.equal(await board.locator('.iui-sports-board').getAttribute('data-game-id'), 'round2_b', 'Schedule and scoreboard must stay independent');
      assert.deepEqual(await board.locator('.iui-sports-score').allTextContents(), ['72', '64']);
      assert.equal(await board.locator('tbody tr').count(), 4);
      const future = (await board.locator('option').allTextContents()).find(text => text.includes('晨光') && text.includes('松林'));
      await board.getByRole('combobox').selectOption({ label: future });
      assert.equal(await board.locator('.iui-sports-score[data-missing="true"]').count(), 2);
      assert.equal(await board.locator('.iui-sports-winner').count(), 0);
      const quiz = page.locator('.iui-quiz');
      const cards = page.locator('.iui-flashcards');
      assert.equal(await quiz.locator('.iui-learning-feedback').count(), 0);
      assert.ok(await quiz.getByRole('button', { name: '确认答案', exact: true }).isDisabled());
      for (const [index, question] of quizSpec.questions.entries()) {
        // Deliberately miss one single question and choose only part of the multi set.
        const selected = index === 1 ? ['head_to_head'] : index === 4 ? ['synthetic'] : question.correct;
        for (const id of selected) await quiz.locator(`input[value="${id}"]`).check();
        await quiz.getByRole('button', { name: '确认答案', exact: true }).click();
        assert.equal(await quiz.locator('input:enabled').count(), 0);
        assert.equal(await quiz.locator('.iui-learning-feedback').getAttribute('data-correct'), String(index !== 1 && index !== 4));
        assert.ok((await quiz.locator('.iui-learning-feedback').textContent()).includes(question.explanation));
        if (screenshots && index === 4) await quiz.screenshot({ path: path.join(screenshots, `${label}-partial-multiselect.png`) });
        await quiz.getByRole('button', { name: index === 4 ? '查看结果' : '下一题', exact: true }).click();
      }
      assert.equal(await quiz.locator('.iui-learning-score').textContent(), '得分: 3 / 6');
      await quiz.getByRole('button', { name: '回看内容', exact: true }).click();
      assert.equal(await quiz.locator('input:enabled').count(), 0);
      assert.equal(await quiz.locator('input:checked').inputValue(), 'four');
      // Reload demonstrates the documented lack of persistence, then take all answers correctly.
      await page.reload();
      await page.waitForSelector('.iui-root');
      assert.equal(await quiz.locator('input:checked').count(), 0);
      assert.equal(await quiz.locator('progress').getAttribute('value'), '0');
      for (const [index, question] of quizSpec.questions.entries()) {
        for (const id of question.correct) await quiz.locator(`input[value="${id}"]`).check();
        await quiz.getByRole('button', { name: '确认答案', exact: true }).click();
        assert.equal(await quiz.locator('.iui-learning-feedback').getAttribute('data-correct'), 'true');
        await quiz.getByRole('button', { name: index === 4 ? '查看结果' : '下一题', exact: true }).click();
      }
      assert.equal(await quiz.locator('.iui-learning-score').textContent(), '得分: 6 / 6');
      assert.equal(await cards.locator('progress').getAttribute('value'), '0');
      assert.ok(await cards.getByRole('button', { name: '已掌握', exact: true }).isDisabled());
      for (const [index, card] of cardSpec.cards.entries()) {
        assert.equal(await cards.locator('.iui-flashcard').getAttribute('data-side'), 'front');
        assert.equal(await cards.locator('.iui-flashcard-text').textContent(), card.front);
        await cards.getByRole('button', { name: '查看答案', exact: true }).click();
        assert.equal(await cards.locator('.iui-flashcard-text').textContent(), card.back);
        const rating = index % 2 === 0 ? '已掌握' : '再练一次';
        await cards.getByRole('button', { name: rating, exact: true }).click();
        assert.equal(await cards.getByRole('button', { name: rating, exact: true }).getAttribute('aria-pressed'), 'true');
        if (index < 3) await cards.getByRole('button', { name: '下一张', exact: true }).click();
      }
      await cards.getByRole('button', { name: '查看结果', exact: true }).click();
      assert.equal(await cards.locator('.iui-learning-score').textContent(), '已掌握: 2 / 4');
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${label}-results.png`), fullPage: true });
      await quiz.getByRole('button', { name: '重新开始', exact: true }).click();
      await cards.getByRole('button', { name: '重新开始', exact: true }).click();
      assert.equal(await quiz.locator('input:checked').count(), 0);
      for (const widget of [quiz, cards]) assert.equal(await widget.locator('progress').getAttribute('value'), '0');
      assert.deepEqual(errors, [], `${label}: browser/CDN failure`);
      assert.ok(responses.every(r => r.status === 200 && r.url.startsWith(contract.cdn.baseUrl)), 'Unexpected remote request');
      observations.push({ label, layout, responses, standings: derived, quizPartialScore: '3 / 6', quizCompleteScore: '6 / 6', flashcardScore: '2 / 4' });
      console.log(`PASS ${label}: immutable file://, fixed CDN/SRI, layout, supplied ranks/filter/details/null, strict weighted quiz/review/reload/reset, flashcards reveal/rate/reset`);
      await context.close();
    }
    if (screenshots) await writeFile(path.join(screenshots, 'blind46-observations.json'), JSON.stringify({ hashes, libraryRevision: contract.revision, observations }, null, 2) + '\n');
  } finally { await browser.close(); }
}
