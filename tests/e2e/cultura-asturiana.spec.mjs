// «Cultura asturiana · 1.er trimestre»: an exam unit on the shared engine with six own task types (feed, cook, wordsearch, clues,
// calendar, cascayu). Answers come from the content itself (never hardcoded texts).
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer, unitPage } from './drivers.mjs';

const SLUG = 'cultura-asturiana';
const URL = `/games/${SLUG}/`;
const ca = examPlayer('__ca');
const { startFromIntro, openIntro, allTasks, taskWhere, playOnly } = unitPage('CA_CONTENT', '__ca');
const fbTitle = (page) => page.locator('#feedback .fb-title').first();
const SOFT = '¡Bien hecho! ⚽';
// The longest task of a type (by its data), so every check runs on the biggest case.
const biggest = async (page, type, ok = () => true) =>
  (await allTasks(page)).filter((t) => t.type === type && ok(t)).sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0];

test('hub: the stations of the content, the hórreo hero, the exam card', async ({ page }) => {
  await open(page, URL);
  const n = await page.evaluate(() => CA_CONTENT.stations.length);
  await expect(page.locator('#stations .station')).toHaveCount(n);
  await expect(page.locator('#hero-art svg.ca-hero')).toHaveAttribute('data-passed', '0');
  await expect(page.locator('#hero-art svg.ca-hero .ca-part.ca-sk')).toHaveCount(8);
  await expect(page.locator('#exam-btn')).toBeVisible();
  expect(await record(page, SLUG)).toBeNull();
});

test('a station from its tile: reading, a full round to the finish, record, coins; the hero paints its first part', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const c0 = await coins(page);
  await startFromIntro(page, tap, 'gochu');
  await expect(page.locator('#read-screen')).toBeVisible();
  await tap(page.locator('#read-start'));
  await expect(page.locator('#play')).toBeVisible();
  const s = await ca.session(page);
  const n = s.tasks.length;
  expect(n).toBe(Math.min(8, await page.evaluate(() => CA_CONTENT.stations.find((x) => x.id === 'gochu').tasks.length)));
  // «always» puts the station's own showpiece types first in the draw
  expect(s.tasks.some((t) => ['feed', 'cascayu', 'wordsearch', 'clues'].includes(t.type))).toBe(true);
  await ca.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText(`${n} / ${n}`);
  expect(await page.evaluate(() => KF.gameData('cultura-asturiana').st.gochu)).toMatchObject({ best: n, max: n, stars: 3, plays: 1 });
  expect(await coins(page)).toBeGreaterThan(c0);
  await tap(page.locator('#finish .actions .btn').last());
  await expect(page.locator('#hub')).toBeVisible();
  await expect(page.locator('#hero-art svg.ca-hero')).toHaveAttribute('data-passed', '1');
  await expect(page.locator('#hero-art svg.ca-hero .ca-part.is-on')).toHaveCount(1);
});

test('feed: right first time, one slip (soft), and two wrong items (not right, the answer lists what goes in)', async ({ page, tap }) => {
  await open(page, URL);
  const t = await biggest(page, 'feed');
  const oks = t.items.filter((it) => it.ok);
  await playOnly(page, t, t, t);
  await expect(page.locator(`#work .ca-feed-target[data-who="${t.who}"] svg.ca-target`)).toHaveCount(1);
  await expect(page.locator('#work .ca-item')).toHaveCount(t.items.length);
  await expect(page.locator('#work .ca-pile-slot')).toHaveCount(oks.length);
  await ca.answerTask(page, tap);
  await expect(page.locator('#work .ca-pile-slot.is-full')).toHaveCount(oks.length);
  await expect(page.locator('#work .ca-item.is-in')).toHaveCount(oks.length);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { mistakes: 1 });
  await expect(page.locator('#work .ca-item.is-no')).toHaveCount(1);
  await expect(fbTitle(page)).toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#work .ca-item.is-no')).toHaveCount(2);
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  for (const it of oks) await expect(fbTitle(page)).toContainText(it.text);
  expect((await ca.session(page)).results).toEqual([true, true, false]);
});

test('feed: every target has its drawing', async ({ page, tap }) => {
  await open(page, URL);
  const tasks = (await allTasks(page)).filter((t) => t.type === 'feed');
  const byWho = [...new Map(tasks.map((t) => [t.who, t])).values()];
  expect(byWho.length).toBeGreaterThanOrEqual(3);
  for (const t of byWho) {
    await playOnly(page, t);
    await expect(page.locator(`#work .ca-feed-target[data-who="${t.who}"] svg.ca-target-${t.who}`)).toHaveCount(1);
    await ca.answerTask(page, tap);
    await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  }
});

test('cook: the cachopo builds up in order; a slip is soft; two misses show the right order', async ({ page, tap }) => {
  await open(page, URL);
  const t = await biggest(page, 'cook');
  const n = t.steps.length;
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .ca-dish svg.ca-dish-svg')).toHaveCount(1);
  await expect(page.locator('#work .ca-step')).toHaveCount(n + (t.extra?.length || 0));
  await expect(page.locator('#work .ca-dish')).toHaveAttribute('data-step', '0');
  await ca.answerTask(page, tap);
  await expect(page.locator('#work .ca-step.is-set')).toHaveCount(n);
  await expect(page.locator('#work .ca-step.is-fixed')).toHaveCount(0);
  await expect(page.locator('#work .ca-dish')).toHaveAttribute('data-step', String(n));
  await expect(page.locator('#work .ca-dish-svg')).toHaveClass(/is-done/);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#work .ca-step.is-fixed')).toHaveCount(1);
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(fbTitle(page)).toContainText(t.steps.map((s) => s.text).join(' → '));
  // the cards now stand in the right order
  const order = await page.locator('#work .ca-step').evaluateAll((els) => els.map((e) => e.dataset.i));
  expect(order.slice(0, n)).toEqual(t.steps.map((_, i) => String(i)));
  expect((await ca.session(page)).results).toEqual([true, true, false]);
});

test('wordsearch: taps on the first and last letter, a drag, a slip (soft), and too many wrong lines', async ({ page, tap }) => {
  await open(page, URL);
  const t = await biggest(page, 'wordsearch');
  await playOnly(page, t, t, t, t);
  await expect(page.locator('#work .ca-ws-cell')).toHaveCount(t.rows.length * [...t.rows[0]].length);
  await expect(page.locator('#work .ca-ws-word')).toHaveCount(t.words.length);
  await ca.answerTask(page, tap);
  await expect(page.locator('#work .ca-ws-word.is-found')).toHaveCount(t.words.length);
  await expect(page.locator('#work .ca-ws-bar')).toHaveCount(t.words.length);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback .fb')).toContainText('3 intentos fallidos');
  await ca.next(page, tap);
  // a drag along the first word (mouse or finger): found at once
  const g = t.rows.map((r) => [...r]);
  const w = [...t.words[0].toUpperCase()];
  let a = null;
  for (let r = 0; r < g.length && !a; r++)
    for (let c = 0; c < g[r].length && !a; c++) {
      if (w.every((ch, i) => g[r][c + i] === ch)) a = [r, c, r, c + w.length - 1];
      else if (w.every((ch, i) => g[r + i]?.[c] === ch)) a = [r, c, r + w.length - 1, c];
    }
  const box = async (r, c) => page.locator(`#work .ca-ws-cell[data-r="${r}"][data-c="${c}"]`).boundingBox();
  const from = await box(a[0], a[1]);
  const to = await box(a[2], a[3]);
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator(`#work .ca-ws-word[data-word="${t.words[0].toUpperCase()}"]`)).toHaveClass(/is-found/);
});

test('clues: one clue at a time, an answer at any clue; right and wrong', async ({ page, tap }) => {
  await open(page, URL);
  const pics = await biggest(page, 'clues', (t) => t.pics);
  const text = await biggest(page, 'clues', (t) => !t.pics);
  await playOnly(page, pics, text);
  await expect(page.locator('#work .ca-clue:visible')).toHaveCount(1);
  await expect(page.locator('#work .ca-opt.pic')).toHaveCount(pics.options.length);
  await ca.answerTask(page, tap); // one more clue, then the right one
  await expect(page.locator('#work .ca-clue:visible')).toHaveCount(pics.clues.length);
  await expect(page.locator('#work .ca-more')).toBeDisabled();
  await expect(page.locator('#work .ca-opt.right')).toHaveCount(1);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(page.locator('#feedback .fb')).toContainText('2 pistas');
  await ca.next(page, tap);
  await expect(page.locator('#work .ca-opt.pic')).toHaveCount(0);
  await ca.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#work .ca-opt.wrong')).toHaveCount(1);
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(fbTitle(page)).toContainText(text.options[text.answer]);
  expect((await ca.session(page)).results).toEqual([true, false]);
});

test('calendar: cards into month pages; a slip is soft; two misses on a card put it in its month', async ({ page, tap }) => {
  await open(page, URL);
  const t = await biggest(page, 'calendar');
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .ca-month')).toHaveCount(t.months.length);
  await expect(page.locator('#work .ca-cal-item')).toHaveCount(t.items.length);
  if (t.astur) await expect(page.locator('#work .ca-month-astur').first()).toBeVisible();
  await ca.answerTask(page, tap);
  await expect(page.locator('#work .ca-month-tag')).toHaveCount(t.items.length);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await ca.next(page, tap);
  await ca.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#work .ca-month-tag.is-fixed')).toHaveCount(1);
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  expect((await ca.session(page)).results).toEqual([true, true, false]);
});

test('cascayu: every statement right = the stone reaches the top; a wrong one = «¡Pisaste la raya!», the right answer, «Seguir»', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await biggest(page, 'cascayu');
  await playOnly(page, t, t);
  await expect(page.locator('#work .ca-sq')).toHaveCount(t.steps.length);
  await ca.answerTask(page, tap);
  await expect(page.locator('#work .ca-sq.is-ok')).toHaveCount(t.steps.length);
  await expect(page.locator('#work .ca-board-svg')).toHaveClass(/is-won/);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await ca.next(page, tap);
  // the first statement wrong, by hand: the line is stepped on, the right answer shows, «Seguir» goes on
  const first = t.steps[0];
  await tap(page.locator(`#work .ca-hop-ans[data-truth="${!first.truth}"]`));
  await expect(page.locator('#work .ca-hop-oops')).toBeVisible();
  await expect(page.locator('#work .ca-hop-oops')).toContainText('¡Pisaste la raya!');
  await expect(page.locator('#work .ca-hop-oops')).toContainText(first.truth ? 'Era verdad' : 'Era mentira');
  await expect(page.locator('#work .ca-sq.is-oops')).toHaveCount(1);
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await tap(page.locator('#work .ca-hop-next'));
  await expect(page.locator('#work .ca-hop-oops')).toBeHidden();
  await expect(page.locator('#work .ca-hop')).toHaveAttribute('data-step', '1');
  for (const [k, st] of t.steps.entries()) {
    if (k === 0) continue;
    await tap(page.locator(`#work .ca-hop-ans[data-truth="${st.truth}"]`));
  }
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback .fb')).toContainText(`${t.steps.length - 1} de ${t.steps.length}`);
  expect((await ca.session(page)).results).toEqual([true, false]);
});

test('the label scenes: the casería and the gaita', async ({ page, tap }) => {
  await open(page, URL);
  for (const scene of ['caseria', 'gaita']) {
    const t = await biggest(page, 'label', (x) => x.scene === scene);
    await playOnly(page, t);
    await expect(page.locator('#work .scene.ca-scene .slot')).toHaveCount(t.labels.length);
    await ca.answerTask(page, tap, { wrong: true });
    await expect(page.locator('#work .slot.filled')).toHaveCount(t.labels.length);
    await expect(fbTitle(page)).toHaveText(SOFT);
  }
});

test('the final exam: tasks from every station, two misses, the grade and a review button per station with misses', async ({
  page,
  tap,
}) => {
  test.setTimeout(150_000);
  await open(page, URL);
  await tap(page.locator('#exam-btn'));
  await expect(page.locator('#play-label')).toContainText(await page.evaluate(() => CA_CONTENT.exam.title || 'Examen final'));
  const s = await ca.session(page);
  const per = await page.evaluate(() => CA_CONTENT.exam.perStation);
  const n = Object.values(per).reduce((a, b) => a + b, 0);
  expect(s.mode).toBe('exam');
  expect(s.tasks).toHaveLength(n);
  expect(new Set(s.tasks.map((t) => t.station))).toEqual(new Set(Object.keys(per)));
  await expect(page.locator('#play-vocab')).toHaveCount(0);
  const misses = s.tasks.flatMap((t, i) => (t.type === 'choice' || t.type === 'tf' ? [i] : [])).slice(0, 2);
  expect(misses).toHaveLength(2);
  await ca.playSession(page, tap, { wrongAt: misses });
  const nota = ((n - 2) / n) * 10;
  const grade = nota >= 9 ? 'Sobresaliente' : nota >= 7 ? 'Notable' : nota >= 6 ? 'Bien' : nota >= 5 ? 'Suficiente' : '¡Sigue practicando!';
  await expect(page.locator('#finish .grade b')).toHaveText(grade);
  await expect(page.locator('#finish .score-pill')).toContainText(`${n - 2} / ${n}`);
  await expect(page.locator('#finish .rrow')).toHaveCount(Object.keys(per).length);
  await expect(page.locator('#finish .rrow .btn')).toHaveCount(new Set(misses.map((i) => s.tasks[i].station)).size);
  expect(await page.evaluate(() => KF.gameData('cultura-asturiana').exam)).toMatchObject({ grade });
});

test('Ukrainian site: the glossary in every station dialog and behind 📖 during a round', async ({ page, tap }) => {
  await open(page, URL);
  const vocab = await page.evaluate(() => Object.fromEntries(CA_CONTENT.stations.map((s) => [s.id, s.vocab || []])));
  for (const [id, list] of Object.entries(vocab)) {
    if (!list.length) continue;
    await openIntro(page, tap, id);
    await expect(page.locator('#intro-dlg .vocab .vocab-row'), id).toHaveCount(list.length);
    await expect(page.locator('#intro-dlg .vocab-row dt').first()).toHaveText(list[0][0]);
    await expect(page.locator('#intro-dlg .vocab-row dd').first()).toHaveText(list[0][1]);
    await tap(page.locator('#intro-back'));
  }
  const id = Object.keys(vocab).find((k) => vocab[k].length);
  await page.evaluate((s) => __ca.startStation(s), id);
  await tap(page.locator('#play-vocab'));
  await expect(page.locator('#vocab-dlg .vocab-row')).toHaveCount(vocab[id].length);
  await tap(page.locator('#vocab-close'));
  await expect(page.locator('#vocab-dlg')).toHaveCount(0);
  await ca.answerTask(page, tap);
  await expect(page.locator('#feedback .fb')).toBeVisible();
});

test('Spanish site (?lang=es): hub, dialog, reading, one task of every own type and the finish — no Cyrillic, no glossary', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL, { lang: 'es' });
  await expectNoCyrillic(page, 'on the hub');
  await startFromIntro(page, tap, 'vacas');
  await expect(page.locator('#read-screen')).toBeVisible();
  await expectNoCyrillic(page, 'on the reading');
  await tap(page.locator('#read-start'));
  await expect(page.locator('.vocab, .vocab-list, #vocab-dlg, #play-vocab')).toHaveCount(0);
  await tap(page.locator('#play-quit'));
  const tasks = [];
  for (const type of ['feed', 'cook', 'wordsearch', 'clues', 'calendar', 'cascayu']) tasks.push(await taskWhere(page, type));
  await playOnly(page, ...tasks);
  for (let i = 0; i < tasks.length; i++) {
    await expectNoCyrillic(page, `on the ${tasks[i].type} task`);
    await ca.answerTask(page, tap);
    await expectNoCyrillic(page, `after the ${tasks[i].type} answer`);
    await ca.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expectNoCyrillic(page, 'on the finish screen');
  expect(await page.evaluate(() => /[Ѐ-ӿ]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
});
