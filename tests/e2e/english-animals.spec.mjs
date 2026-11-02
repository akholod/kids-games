// «Animals» (English, Open Up 3 Unit 1): an exam unit on the shared engine with content only (no own task types) — task texts are
// English, the engine UI is Spanish, so the page has no Cyrillic on either site. These tests assert DOM hooks and state, not the
// unit's texts. The sound is a stub (what the engine says is recorded in window.__said); the clips exist in the real manifest.
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer, unitPage } from './drivers.mjs';

const SLUG = 'english-animals';
const URL = `/games/${SLUG}/`;
const STATIONS = ['animals', 'describe', 'itis', 'questions', 'itsgot', 'story', 'helpers', 'afraid', 'listen'];
const ea = examPlayer('__ea');
const { startFromIntro, taskWhere, allTasks, playOnly } = unitPage('EA_CONTENT', '__ea');

// No sound from the speakers; canSay stays real (the manifest has every clip of the unit).
const quiet = (page) =>
  page.evaluate(() => {
    window.__said = [];
    KFG.say = (t, lang) => {
      window.__said.push([t, lang]);
      return true;
    };
    KFG.speaking = () => false;
    KFG.hush = () => {};
  });
const said = (page) => page.evaluate(() => window.__said);
const sessionTypes = async (page) => (await ea.session(page)).tasks.map((t) => t.type);

test('hub: nine stations, the jungle hero, the exam card; nothing played yet', async ({ page }) => {
  await open(page, URL);
  await expect(page.locator('#stations .station')).toHaveCount(9);
  await expect(page.locator('#hero-art svg')).toHaveCount(1);
  await expect(page.locator('#exam-btn')).toBeVisible();
  expect(await page.evaluate(() => EA_CONTENT.stations.map((s) => s.id))).toEqual(STATIONS);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  expect(await record(page, SLUG)).toBeNull();
});

test('art: every drawing the tasks use exists, every label scene has a spot for each label', async ({ page }) => {
  await open(page, URL);
  const report = await page.evaluate(() => {
    const tasks = EA_CONTENT.stations.flatMap((s) => s.tasks);
    const keys = new Set();
    for (const t of tasks) {
      if (t.art) keys.add(t.art);
      if (t.pics) for (const k of t.options) keys.add(k);
    }
    const missing = [...keys].filter((k) => !(EAArt.art(k) instanceof Element));
    const sceneErrors = [];
    for (const t of tasks.filter((x) => x.type === 'label')) {
      const sc = EAArt.scene(t.scene);
      if (!sc) {
        sceneErrors.push(`scene «${t.scene}» does not exist`);
        continue;
      }
      const spots = sc.spots.map((p) => p.id);
      for (const l of t.labels) if (!spots.includes(l.id)) sceneErrors.push(`${t.scene}: no spot for «${l.id}»`);
    }
    return { n: keys.size, missing, sceneErrors, unknown: EAArt.art('no-such-key'), unknownScene: EAArt.scene('no-such-scene') };
  });
  expect(report.n).toBeGreaterThan(20);
  expect(report.missing).toEqual([]);
  expect(report.sceneErrors).toEqual([]);
  expect(report.unknown).toBeNull();
  expect(report.unknownScene).toBeNull();
});

test('a station round (animals) to the finish: record, coins, the hub shows it', async ({ page, tap }) => {
  test.setTimeout(90_000);
  await open(page, URL);
  await quiet(page);
  const c0 = await coins(page);
  await startFromIntro(page, tap, 'animals'); // no reading in this station: straight to the questions
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#prompt')).toHaveAttribute('lang', 'en');
  expect((await ea.session(page)).station).toBe('animals');
  await ea.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 10, max: 10 });
  expect(await page.evaluate(() => KF.gameData('english-animals').st.animals)).toMatchObject({ best: 8, max: 8, stars: 3, plays: 1 });
  expect(await coins(page)).toBeGreaterThan(c0);
  await tap(page.locator('#finish .actions .btn').last());
  await expect(page.locator('#stations .station').nth(0)).toContainText('8/8');
});

test('the listening station (listen + pics, art, fill, tf) to the finish; only its own English sentences are said', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL);
  await quiet(page);
  await page.evaluate(() => __ea.startStation('listen'));
  const types = await sessionTypes(page);
  expect(types).toHaveLength(8);
  expect(await ea.playSession(page, tap)).toEqual(types);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  // autoplay waits 300 ms and a quick answer cancels it: not every task is heard, but whatever was said is a sentence of the
  // station, in English
  const heard = await said(page);
  const sentences = await page.evaluate(() => EA_CONTENT.stations.find((st) => st.id === 'listen').tasks.map((t) => t.listen));
  expect(heard.every(([text, lang]) => lang === 'en' && sentences.includes(text))).toBe(true);
});

test('the final exam: all stations are drawn, a grade, a review button per station with misses', async ({ page, tap }) => {
  test.setTimeout(120_000);
  await open(page, URL);
  await quiet(page);
  await tap(page.locator('#exam-btn'));
  const s = await ea.session(page);
  expect(s.mode).toBe('exam');
  const total = await page.evaluate(() => Object.values(EA_CONTENT.exam.perStation).reduce((a, b) => a + b, 0));
  expect(s.tasks).toHaveLength(total);
  expect(new Set(s.tasks.map((t) => t.station))).toEqual(new Set(STATIONS));
  // 📜 comes and goes with the station of the task
  const withText = new Set(await page.evaluate(() => EA_CONTENT.stations.filter((st) => st.text).map((st) => st.id)));
  expect([...withText].sort()).toEqual(['helpers', 'story']);
  const misses = s.tasks.flatMap((t, i) => (t.type === 'choice' || t.type === 'tf' ? [i] : [])).slice(0, 2);
  expect(misses).toHaveLength(2);
  for (const [i, t] of s.tasks.entries()) {
    expect((await ea.session(page)).index).toBe(i);
    await expect(page.locator('#play-text'), `task ${i + 1} (${t.station} ${t.type})`).toHaveCount(withText.has(t.station) ? 1 : 0);
    await ea.answerTask(page, tap, { wrong: misses.includes(i) });
    await ea.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .grade b')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText(`${total - 2} / ${total}`);
  await expect(page.locator('#finish .rrow')).toHaveCount(STATIONS.length);
  await expect(page.locator('#finish .rrow .btn')).toHaveCount(new Set(misses.map((i) => s.tasks[i].station)).size);
  expect(await page.evaluate(() => KF.gameData('english-animals').exam)).toMatchObject({ grade: expect.any(String) });
});

test('the exam with every answer right is a full score', async ({ page, tap }) => {
  test.setTimeout(120_000);
  await open(page, URL);
  await quiet(page);
  await tap(page.locator('#exam-btn'));
  await ea.playSession(page, tap);
  const total = await page.evaluate(() => Object.values(EA_CONTENT.exam.perStation).reduce((a, b) => a + b, 0));
  await expect(page.locator('#finish .score-pill')).toContainText(`${total} / ${total}`);
  await expect(page.locator('#finish .rrow .okmark')).toHaveCount(STATIONS.length);
});

// ---- listening ----

test('listen: the block, the button and the key R; the sentence shows after the answer', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const t = await taskWhere(page, 'choice', (x) => x.listen && !x.pics && !x.art);
  expect(t).toBeTruthy();
  await playOnly(page, t);
  await expect(page.locator('#listen')).toBeVisible();
  await expect(page.locator('#listen-btn')).toBeVisible();
  await expect(page.locator('#listen-btn kbd')).toHaveText('R');
  await expect(page.locator('#listen-said')).toBeHidden();
  await expect(page.locator('#listen-said')).toHaveAttribute('lang', 'en');
  // autoplay, then R and the button
  await expect.poll(() => said(page)).toEqual([[t.listen, 'en']]);
  await page.keyboard.press('r');
  await expect.poll(async () => (await said(page)).length).toBe(2);
  await tap(page.locator('#listen-btn'));
  await expect.poll(async () => (await said(page)).length).toBe(3);
  // the task is a normal choice: answer it, the sentence shows
  await ea.answerTask(page, tap);
  await expect(page.locator('#listen-said')).toBeVisible();
  await expect(page.locator('#listen-said')).toHaveText(`«${t.listen}»`);
  await page.keyboard.press('r'); // after the answer too, no error
  await expect.poll(async () => (await said(page)).length).toBe(4);
});

test('listen: a fill task keeps R for the letters; the button still replays', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const t = await taskWhere(page, 'fill', (x) => x.listen && x.answer.includes('r'));
  expect(t, 'a listening fill with an r in the word').toBeTruthy();
  await playOnly(page, t);
  await expect.poll(async () => (await said(page)).length).toBe(1);
  await ea.answerTask(page, tap, { keyboard: true });
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  expect((await said(page)).length).toBe(1); // typing «r» did not replay
  await tap(page.locator('#listen-btn'));
  await expect.poll(async () => (await said(page)).length).toBe(2);
});

test('listen: every listen sentence of the unit has a clip, so the button (not the reading fallback) shows', async ({ page }) => {
  await open(page, URL);
  const missing = await page.evaluate(() => {
    const texts = EA_CONTENT.stations.flatMap((s) => s.tasks.filter((t) => t.listen).map((t) => t.listen));
    return { n: texts.length, none: texts.filter((t) => !KFG.canSay('en', t) && !KFG.canSay('en')) };
  });
  expect(missing.n).toBeGreaterThan(20);
  expect(missing.none).toEqual([]);
});

// ---- pictures ----

test('pics: picture buttons with an art key each, the right one turns green', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const t = await taskWhere(page, 'choice', (x) => x.pics && !x.listen);
  expect(t).toBeTruthy();
  await playOnly(page, t);
  const btns = page.locator('#work .choices.pics .choice.pic');
  await expect(btns).toHaveCount(t.options.length);
  expect(t.options.length).toBeGreaterThanOrEqual(3);
  expect((await btns.evaluateAll((els) => els.map((e) => e.dataset.key))).sort()).toEqual([...t.options].sort());
  await expect(page.locator('#work .choice.pic .pic-art svg')).toHaveCount(t.options.length);
  for (const [i, l] of t.labels.entries())
    await expect(page.locator(`#work .choice.pic[data-key="${t.options[i]}"]`)).toHaveAttribute('aria-label', l);
  await expect(page.locator('#listen')).toBeHidden();
  await ea.answerTask(page, tap);
  await expect(page.locator('#work .choice.pic.right')).toHaveAttribute('data-key', t.options[t.answer]);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
});

test('pics + listen: listen, then choose the picture; a wrong one shows the right picture and its name', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const t = await taskWhere(page, 'choice', (x) => x.pics && x.listen);
  expect(t).toBeTruthy();
  await playOnly(page, t);
  await expect(page.locator('#listen-btn')).toBeVisible();
  await expect(page.locator('#work .choice.pic')).toHaveCount(t.options.length);
  await ea.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#work .choice.pic.right')).toHaveAttribute('data-key', t.options[t.answer]);
  await expect(page.locator('#work .choice.pic.wrong')).toHaveCount(1);
  await expect(page.locator('#feedback .fb.miss')).toContainText(t.labels[t.answer]);
  await expect(page.locator('#listen-said')).toHaveText(`«${t.listen}»`);
});

// ---- readings ----

test('the story reading: seven paragraphs in English, «Escuchar» is there (clips exist), then the questions', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  const text = await page.evaluate(() => EA_CONTENT.stations.find((s) => s.id === 'story').text);
  expect(text.paragraphs).toHaveLength(7);
  await page.evaluate(() => __ea.startStation('story', true));
  await expect(page.locator('#read-screen')).toBeVisible();
  await expect(page.locator('#play')).toBeHidden();
  await expect(page.locator('#read-title')).toHaveText(text.title);
  await expect(page.locator('#read-screen .read-p')).toHaveCount(7);
  await expect(page.locator('#read-screen .read-text')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#read-listen')).toBeVisible();
  await expect(page.locator('#read-listen')).toHaveText('🔊 Escuchar');
  await tap(page.locator('#read-listen'));
  await expect.poll(async () => (await said(page))[0]).toEqual([text.paragraphs[0], 'en']);
  await tap(page.locator('#read-start'));
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#play-text')).toBeVisible();
  // the text dialog has the same paragraphs in English
  await tap(page.locator('#play-text'));
  await expect(page.locator('#text-dlg .read-p')).toHaveCount(7);
  await expect(page.locator('#text-dlg .read-text')).toHaveAttribute('lang', 'en');
  await tap(page.locator('#text-close'));
});

test('the helpers reading is listenable too, and every reading paragraph has a clip', async ({ page }) => {
  await open(page, URL);
  const report = await page.evaluate(() => {
    const texts = EA_CONTENT.stations.flatMap((s) => s.text?.paragraphs ?? []);
    return { n: texts.length, none: texts.filter((t) => !KFG.canSay('en', t) && !KFG.canSay('en')) };
  });
  expect(report.n).toBe(13);
  expect(report.none).toEqual([]);
});

// ---- the Spanish site and the Ukrainian one: the game page has no Cyrillic on either ----

test('Spanish site (?lang=es): hub, a station, a listening task, the reading and the exam — no Cyrillic anywhere', async ({
  page,
  tap,
}) => {
  test.setTimeout(120_000);
  await open(page, URL, { lang: 'es' });
  await expect(page.locator('#stations .station')).toHaveCount(9);
  await expectNoCyrillic(page, 'on the hub');
  await quiet(page);

  await startFromIntro(page, tap, 'story');
  await expect(page.locator('#read-screen')).toBeVisible();
  await expectNoCyrillic(page, 'on the reading screen');
  await tap(page.locator('#read-start'));
  await expectNoCyrillic(page, 'on the first story task');
  await tap(page.locator('#play-text'));
  await expectNoCyrillic(page, 'in the text dialog');
  await tap(page.locator('#text-close'));
  await page.evaluate(() => __ea.toHub());

  // a task of each look: listening + pictures, listening + fill, pictures, a label scene, tf (English True / False)
  const tasks = [
    await taskWhere(page, 'choice', (t) => t.pics && t.listen),
    await taskWhere(page, 'fill', (t) => t.listen),
    await taskWhere(page, 'choice', (t) => t.pics && !t.listen),
    await taskWhere(page, 'label'),
    await taskWhere(page, 'tf', (t) => t.listen),
    await taskWhere(page, 'pick'),
  ];
  await playOnly(page, ...tasks);
  for (const [i, t] of tasks.entries()) {
    expect(t, `task ${i}`).toBeTruthy();
    await expectNoCyrillic(page, `on task ${i + 1} (${t.type})`);
    await ea.answerTask(page, tap);
    await expectNoCyrillic(page, `after the ${t.type} task`);
    await ea.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expectNoCyrillic(page, 'on the finish screen');

  // a wrong answer and the exam
  await page.evaluate(() => __ea.toHub());
  await playOnly(page, await taskWhere(page, 'choice', (t) => t.pics && t.listen));
  await ea.answerTask(page, tap, { wrong: true });
  await expectNoCyrillic(page, 'after a wrong picture');
  await page.evaluate(() => __ea.toHub());
  await tap(page.locator('#exam-btn'));
  await ea.playSession(page, tap);
  await expectNoCyrillic(page, 'on the exam result');
  expect(await page.evaluate(() => /[\u0400-\u04FF]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
});

test('Ukrainian site (default): the game page itself has no Cyrillic either (hub, intro dialog, a task)', async ({ page, tap }) => {
  await open(page, URL);
  await quiet(page);
  await expect(page.locator('#stations .station')).toHaveCount(9);
  await expectNoCyrillic(page, 'on the hub (uk)');
  await tap(page.locator('#stations .station').nth(0));
  await expect(page.locator('#intro-dlg')).toHaveJSProperty('open', true);
  await expectNoCyrillic(page, 'in the intro dialog (uk)');
  await tap(page.locator('#intro-go'));
  await expect(page.locator('#play')).toBeVisible();
  await expectNoCyrillic(page, 'on the first task (uk)');
  await expect(page.locator('#play-vocab')).toHaveCount(0); // no glossary
});

test('all tasks of the unit are the generic types the driver can play (a smoke over the whole content)', async ({ page }) => {
  await open(page, URL);
  const tasks = await allTasks(page);
  expect(tasks.length).toBeGreaterThanOrEqual(200);
  expect([...new Set(tasks.map((t) => t.type))].sort()).toEqual(['choice', 'fill', 'label', 'order', 'pairs', 'pick', 'sort', 'tf']);
});
