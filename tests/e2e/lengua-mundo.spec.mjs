// «Lenguas por el mundo» (Lengua Castellana 3.º, Unidad 1): an exam unit on the shared engine with readings (baobab, midas),
// its own task types fix / chat / tone and the nota / aviso scenes. These tests assert DOM hooks and state, not the unit's UI texts
// (only the engine's cheer, which is not the unit's).
import { buildSlug } from '../unit/slug-impls.mjs';
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer, unitPage } from './drivers.mjs';

const SLUG = 'lengua-mundo';
const URL = `/games/${SLUG}/`;
const STATIONS = ['baobab', 'midas', 'sinonimos', 'punto', 'nombre', 'genero', 'conversacion', 'nota'];
const le = examPlayer('__le');
const { startFromIntro, taskWhere, allTasks, playOnly, startStationWith } = unitPage('LE_CONTENT', '__le');

// No sound from the speakers; `can` = does the page think a clip / voice exists (the real manifest has all the clips).
const quiet = (page, can) =>
  page.evaluate((can) => {
    window.__said = [];
    if (can !== undefined) KFG.canSay = () => can;
    KFG.say = (t) => {
      window.__said.push(t);
      return true;
    };
    KFG.speaking = () => false;
    KFG.hush = () => {};
  }, can);
const results = async (page) => (await le.session(page)).results;
const fb = (page) => page.locator('#feedback .fb');
const fbTitle = (page) => page.locator('#feedback .fb-title').first();
// The engine's soft cheer (right, but not at the first try).
const SOFT = '¡Bien hecho! ⚽';

test('hub: eight stations, the airport hero, the exam card', async ({ page }) => {
  await open(page, URL);
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expect(page.locator('#hero-art svg.le-hero')).toHaveCount(1);
  await expect(page.locator('#hero-art svg.le-hero')).toHaveAttribute('data-passed', '0');
  await expect(page.locator('#exam-btn')).toBeVisible();
  expect(await page.evaluate(() => LE_CONTENT.stations.map((s) => s.id))).toEqual(STATIONS);
  expect(await record(page, SLUG)).toBeNull();
});

test('a station with a reading: intro «Empezar» → reading screen → questions → finish; 📜 in the round; the hero comes alive', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  await quiet(page, true);
  const c0 = await coins(page);
  const text = await page.evaluate(() => LE_CONTENT.stations.find((s) => s.id === 'baobab').text);
  await startFromIntro(page, tap, 'baobab');
  // the reading comes first: nothing is started
  await expect(page.locator('#read-screen')).toBeVisible();
  await expect(page.locator('#play')).toBeHidden();
  expect(await le.session(page)).toBeNull();
  await expect(page.locator('#read-title')).toHaveText(text.title);
  await expect(page.locator('#read-screen .read-p')).toHaveCount(text.paragraphs.length);
  await expect(page.locator('#read-screen .read-p').first()).toHaveText(text.paragraphs[0]);
  await expect(page.locator('#read-listen')).toBeVisible();
  await tap(page.locator('#read-start'));
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#read-screen')).toBeHidden();
  expect((await le.session(page)).station).toBe('baobab');

  // 📜 in the round: the same text in a dialog, the button closes it
  await expect(page.locator('#play-text')).toBeVisible();
  await tap(page.locator('#play-text'));
  await expect(page.locator('#text-dlg .read-p')).toHaveCount(text.paragraphs.length);
  await expect(page.locator('#text-dlg h2')).toHaveText(text.title);
  await tap(page.locator('#text-close'));
  await expect(page.locator('#text-dlg')).toHaveCount(0);

  // the round, to the finish
  await le.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 10, max: 10 });
  expect(await page.evaluate(() => KF.gameData('lengua-mundo').st.baobab)).toMatchObject({ best: 8, max: 8, stars: 3, plays: 1 });
  expect(await coins(page)).toBeGreaterThan(c0);
  await tap(page.locator('#finish .actions .btn').last());
  await expect(page.locator('#stations .station').nth(0)).toContainText('8/8');
  await expect(page.locator('#hero-art svg.le-hero')).toHaveAttribute('data-passed', '1');
});

test('a station without a reading goes straight to the questions (no 📜)', async ({ page, tap }) => {
  await open(page, URL);
  await startFromIntro(page, tap, 'sinonimos');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#read-screen')).toBeHidden();
  await expect(page.locator('#play-text')).toHaveCount(0);
});

test('«punto»: a round with fix + pick played to the finish', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const types = await startStationWith(page, 'punto', ['fix', 'pick']);
  expect(types).toHaveLength(8);
  await expect(page.locator('#play-text')).toHaveCount(0);
  expect(await le.playSession(page, tap)).toEqual(types);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  expect(await page.evaluate(() => KF.gameData('lengua-mundo').st.punto)).toMatchObject({ best: 8, max: 8, plays: 1 });
});

test('«conversacion»: a round with chat + tone played to the finish (the sound is a stub: it is never needed)', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page, true);
  const types = await startStationWith(page, 'conversacion', ['chat', 'tone']);
  expect(await le.playSession(page, tap)).toEqual(types);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
});

// ---- fix ----

test('fix: right first time — a full cheer, the text corrected, no marks', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'fix'));
  await expect(page.locator('#work .le-fix-page')).toHaveAttribute('lang', 'es');
  // it starts in lowercase, with no full stops: every word button and gap is off
  await expect(page.locator('#work .le-w[aria-pressed=true], #work .le-g[aria-pressed=true]')).toHaveCount(0);
  await le.answerTask(page, tap);
  await expect(fb(page)).toHaveClass(/ok/);
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  expect(await results(page)).toEqual([true]);
  await expect(page.locator('#work .le-fix')).toHaveClass(/is-done/);
  await expect(page.locator('#work .le-fix-check')).toHaveCount(0); // the buttons are gone
  await expect(page.locator('#work .is-fixed, #work .is-wrong')).toHaveCount(0);
  // the capitals and stops stay on, as the text asks
  const t = await le.sessionTask(page);
  const on = await page.locator('#work .le-w[aria-pressed=true], #work .le-g[aria-pressed=true]').count();
  expect(on).toBeGreaterThanOrEqual(2);
  expect(t.type).toBe('fix');
});

test('fix: exactly one mistake is still right («casi»): soft, the wrong spot is marked', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'fix'));
  await le.answerTask(page, tap, { mistakes: 1 });
  await expect(fb(page)).toHaveClass(/ok/);
  await expect(fbTitle(page)).toHaveText(SOFT);
  await expect(page.locator('#feedback .fb p')).toHaveCount(2); // the title and the «casi» note
  expect(await results(page)).toEqual([true]);
  await expect(page.locator('#work .le-fix')).toHaveClass(/is-done/);
  await expect(page.locator('#work .is-fixed')).toHaveCount(1);
});

test('fix: the first check with ≥ 2 mistakes only marks them and the round stays open', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'fix'));
  // nothing done yet: a capital and a final stop at least are missing
  await tap(page.locator('#work .le-fix-check'));
  await expect(page.locator('#work .is-wrong').first()).toBeVisible();
  expect(await page.locator('#work .is-wrong').count()).toBeGreaterThanOrEqual(2);
  await expect(fb(page)).toHaveCount(0); // not resolved
  expect((await le.session(page)).answered).toBe(false);
  // tapping a marked spot clears its mark
  const marked = await page.locator('#work .is-wrong').count();
  await tap(page.locator('#work .is-wrong').first());
  await expect(page.locator('#work .is-wrong')).toHaveCount(marked - 1);
  // the round is still open and the buttons are there
  await expect(page.locator('#work .le-fix-check')).toBeEnabled();
  expect((await le.session(page)).answered).toBe(false);
});

test('fix: two mistakes, a retry with them undone — right, soft', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'fix'));
  await le.answerTask(page, tap, { mistakes: 2, retry: 'fix' });
  await expect(fb(page)).toHaveClass(/ok/);
  await expect(fbTitle(page)).toHaveText(SOFT);
  expect(await results(page)).toEqual([true]);
  await expect(page.locator('#work .is-fixed')).toHaveCount(0);
});

test('fix: two mistakes and no luck on the retry — the right text is shown, false', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'fix');
  await playOnly(page, t);
  await le.answerTask(page, tap, { mistakes: 2, retry: 'again' });
  await expect(fb(page)).toHaveClass(/miss/);
  expect(await results(page)).toEqual([false]);
  await expect(fbTitle(page)).toContainText(t.text.replace(/\.$/, '')); // «La respuesta es: <the right text>»
  await expect(page.locator('#work .le-fix')).toHaveClass(/is-done/);
  await expect(page.locator('#work .is-fixed')).toHaveCount(2);
  await expect(page.locator('#dots .dot.miss')).toHaveCount(1);
});

// ---- chat ----

test('chat: every reply right — a full cheer, the call ends', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'chat');
  await playOnly(page, t);
  await expect(page.locator('#work .le-chat')).toHaveAttribute('data-turn', '0');
  await expect(page.locator('#work .le-reply')).toHaveCount(t.turns[0].options.length);
  await le.answerTask(page, tap);
  await expect(page.locator('#work .le-chat')).toHaveClass(/is-over/);
  await expect(page.locator('#work .le-chat')).toHaveAttribute('data-turn', String(t.turns.length));
  await expect(fb(page)).toHaveClass(/ok/);
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  expect(await results(page)).toEqual([true]);
  await expect(page.locator('#work .le-why')).toHaveCount(0);
});

test('chat: one wrong turn is still right (soft) — the reason and the better reply appear', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'chat'));
  await le.answerTask(page, tap, { wrongTurns: [0] });
  await expect(fb(page)).toHaveClass(/ok/);
  await expect(fbTitle(page)).toHaveText(SOFT);
  await expect(page.locator('#work .le-why')).toHaveCount(1);
  await expect(page.locator('#work .le-me-fixed')).toHaveCount(1);
  expect(await results(page)).toEqual([true]);
});

test('chat: two wrong turns are wrong — the call is still played to its end', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'chat'));
  await le.answerTask(page, tap, { wrongTurns: [0, 1] });
  await expect(page.locator('#work .le-chat')).toHaveClass(/is-over/);
  await expect(fb(page)).toHaveClass(/miss/);
  await expect(page.locator('#work .le-why')).toHaveCount(2);
  await expect(page.locator('#work .le-me-fixed')).toHaveCount(2);
  expect(await results(page)).toEqual([false]);
  await expect(page.locator('#dots .dot.miss')).toHaveCount(1);
});

test('chat: a reply can be a stage direction in brackets, drawn as an action', async ({ page, tap }) => {
  await open(page, URL);
  const isAction = (o) => /^\(.*\)$/.test(o);
  const t = await taskWhere(page, 'chat', (c) => c.turns.some((turn) => turn.options.some(isAction)));
  expect(t).not.toBeNull();
  const k = t.turns.findIndex((turn) => turn.options.some(isAction));
  await playOnly(page, t);
  await le.answerTask(page, tap, { stopAt: k }); // the right replies up to that turn
  await expect(page.locator('#work .le-chat')).toHaveAttribute('data-turn', String(k));
  await expect(page.locator('#work .le-reply.is-action')).toHaveCount(t.turns[k].options.filter(isAction).length);
  await expect(page.locator('#work .le-reply .le-act').first()).toBeVisible();
});

// ---- tone ----

test('tone: right and wrong — the answer lights up and the sentence is shown', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page, true);
  const rising = await taskWhere(page, 'tone', (t) => t.rising);
  const falling = await taskWhere(page, 'tone', (t) => !t.rising);
  await playOnly(page, rising, falling);
  await expect(page.locator('#work .le-tone-ans')).toHaveCount(2);
  await expect(page.locator('#work .le-tone-play')).toBeVisible();
  await le.answerTask(page, tap); // right
  await expect(page.locator('#work .le-tone')).toHaveClass(/is-rising/);
  await expect(page.locator('#work .le-tone-ans.right')).toHaveAttribute('data-rising', 'true');
  await expect(page.locator('#work .le-tone-ans.wrong')).toHaveCount(0);
  await expect(page.locator('#work .le-tone-say')).toHaveClass(/is-shown/);
  await expect(fb(page)).toHaveClass(/ok/);
  await le.next(page, tap);
  await le.answerTask(page, tap, { wrong: true }); // wrong
  await expect(page.locator('#work .le-tone')).toHaveClass(/is-falling/);
  await expect(page.locator('#work .le-tone-ans.right')).toHaveAttribute('data-rising', 'false');
  await expect(page.locator('#work .le-tone-ans.wrong')).toHaveAttribute('data-rising', 'true');
  await expect(fb(page)).toHaveClass(/miss/);
  expect(await results(page)).toEqual([true, false]);
});

test('tone with the real clips: 🔊 asks for audio/es/<slug>.mp3; with nothing to say it, no button and the sentence on screen', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'tone');
  const slug = buildSlug(t.say);
  const asked = [];
  page.on('request', (r) => {
    if (/\/audio\/es\/[^/]*\.mp3$/.test(r.url())) asked.push(r.url().split('/audio/es/')[1]);
  });
  await playOnly(page, t); // the real KFG: shared/audio.js lists the clip
  await expect(page.locator('#work .le-tone-play')).toBeVisible();
  await expect.poll(() => asked).toContain(`${slug}.mp3`); // played once on its own when the task shows
  await tap(page.locator('#work .le-tone-play'));
  await expect(page.locator('#work .le-tone-play')).toHaveClass(/is-playing/);
  expect(asked.every((f) => f === `${slug}.mp3`)).toBe(true);
  await expect(page.locator('#work .le-tone-say')).not.toHaveClass(/is-shown/); // hidden until answered
  // nothing can say it
  await page.evaluate(() => {
    KFG.canSay = () => false;
  });
  await playOnly(page, t);
  await expect(page.locator('#work .le-tone-play')).toHaveCount(0);
  await expect(page.locator('#work .le-tone')).toHaveClass(/no-sound/);
  await expect(page.locator('#work .le-tone-say')).toHaveClass(/is-shown/);
  await expect(page.locator('#work .le-tone-text')).toContainText(t.say.split(' ')[0]);
});

// ---- the unit's scenes and generic types ----

test('nota / aviso label scenes, the nota sort, pick and fill all play right', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const labels = (await allTasks(page)).filter((t) => t.type === 'label');
  expect(labels.map((t) => t.scene).sort()).toEqual(['aviso', 'nota']);
  const sortNota = await taskWhere(page, 'sort', (t) => t.station === 'nota' && /nota o un aviso/.test(t.q));
  expect(sortNota).not.toBeNull();
  const tasks = [...labels, sortNota, await taskWhere(page, 'pick'), await taskWhere(page, 'fill')];
  await playOnly(page, ...tasks);
  await expect(page.locator('#work .slot')).toHaveCount(3);
  await le.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText(`${tasks.length} / ${tasks.length}`);
});

// ---- the final exam ----

test('the final exam: 12 tasks, 📜 only on the baobab / midas tasks, a grade, a review button per station with misses', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL);
  await quiet(page, true);
  await tap(page.locator('#exam-btn'));
  const s = await le.session(page);
  expect(s.mode).toBe('exam');
  expect(s.tasks).toHaveLength(12);
  expect(new Set(s.tasks.map((t) => t.station))).toEqual(new Set(STATIONS));
  const withText = new Set(await page.evaluate(() => LE_CONTENT.stations.filter((st) => st.text).map((st) => st.id)));
  expect([...withText].sort()).toEqual(['baobab', 'midas']);
  const misses = s.tasks.flatMap((t, i) => (t.type === 'choice' || t.type === 'tf' ? [i] : [])).slice(0, 2);
  expect(misses).toHaveLength(2);
  for (const [i, t] of s.tasks.entries()) {
    expect((await le.session(page)).index).toBe(i);
    await expect(page.locator('#play-text'), `task ${i + 1} (${t.station} ${t.type})`).toHaveCount(withText.has(t.station) ? 1 : 0);
    await le.answerTask(page, tap, { wrong: misses.includes(i) });
    await le.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .grade b')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText('10 / 12');
  await expect(page.locator('#finish .rrow')).toHaveCount(8);
  await expect(page.locator('#finish .rrow .btn')).toHaveCount(new Set(misses.map((i) => s.tasks[i].station)).size);
  expect(await page.evaluate(() => KF.gameData('lengua-mundo').exam)).toMatchObject({ grade: expect.any(String) });
  await expect(page.locator('#play-text')).toHaveCount(0);
});

test('the exam with every answer right is a full score', async ({ page, tap }) => {
  test.setTimeout(90_000);
  await open(page, URL);
  await quiet(page, true);
  await tap(page.locator('#exam-btn'));
  await le.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('12 / 12');
  await expect(page.locator('#finish .grade b')).toBeVisible();
  await expect(page.locator('#finish .rrow .okmark')).toHaveCount(8);
});

// ---- the Spanish site ----

test('Spanish site (?lang=es): reading, every task type of the unit, right and wrong paths — no Cyrillic anywhere', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL, { lang: 'es' });
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expectNoCyrillic(page, 'on the hub');
  await quiet(page, true);

  // the reading screen and the text dialog
  await startFromIntro(page, tap, 'midas');
  await expect(page.locator('#read-screen')).toBeVisible();
  await expectNoCyrillic(page, 'on the reading screen');
  await tap(page.locator('#read-start'));
  await expectNoCyrillic(page, 'on the first midas task');
  await tap(page.locator('#play-text'));
  await expectNoCyrillic(page, 'in the text dialog');
  await tap(page.locator('#text-close'));
  await page.evaluate(() => __le.toHub());

  // a task of every kind of the unit: look at it before and after answering
  const tasks = [];
  for (const type of ['fix', 'chat', 'tone', 'pick', 'label', 'fill']) tasks.push(await taskWhere(page, type));
  tasks.push(await taskWhere(page, 'sort', (t) => t.station === 'nota'));
  await playOnly(page, ...tasks);
  for (let i = 0; i < tasks.length; i++) {
    await expectNoCyrillic(page, `on task ${i + 1} (${tasks[i].type})`);
    await le.answerTask(page, tap);
    await expectNoCyrillic(page, `after the ${tasks[i].type} task`);
    await le.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expectNoCyrillic(page, 'on the finish screen');
  expect(await page.evaluate(() => /[Ѐ-ӿ]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);

  // the wrong paths: their hints and notes are Spanish as well
  await page.evaluate(() => __le.toHub());
  const fixTask = await taskWhere(page, 'fix');
  await playOnly(page, fixTask, fixTask, fixTask, await taskWhere(page, 'chat'), await taskWhere(page, 'tone'));
  await tap(page.locator('#work .le-fix-check')); // nothing done: the marks and their hint
  await expectNoCyrillic(page, 'after a first fix check with marks');
  await le.answerTask(page, tap); // then right (soft)
  await le.next(page, tap);
  await le.answerTask(page, tap, { mistakes: 2, retry: 'again' });
  await expectNoCyrillic(page, 'after a failed fix');
  await le.next(page, tap);
  await le.answerTask(page, tap, { mistakes: 1 });
  await expectNoCyrillic(page, 'after a fix with one mistake');
  await le.next(page, tap);
  await le.answerTask(page, tap, { wrong: true });
  await expectNoCyrillic(page, 'after a failed chat');
  await le.next(page, tap);
  await le.answerTask(page, tap, { wrong: true });
  await expectNoCyrillic(page, 'after a wrong tone');
});
