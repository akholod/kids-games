// Laptop guard: a task screen fits a short laptop window (1366×768 minus browser UI) without page scroll,
// and after answering the "next" button is on screen. Pages open in ?parent mode, so the 48px test ribbon is included.
import { test, expect, open } from './helpers.mjs';
import {
  answerChTask,
  answerCurrentTask,
  answerDcTask,
  answerWordTask,
  examPlayer,
  unitPage,
  openStation,
  playChTasks,
  playDcTasks,
  playWordTasks,
  solveMathTask,
} from './drivers.mjs';

test.use({ viewport: { width: 1366, height: 657 } });

const overflow = (page) => page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);

const expectFits = async (page, what) => {
  await page.waitForTimeout(150); // let layout settle (fonts, sizes measured by the engine)
  expect(await overflow(page), `${what}: page scroll`).toBeLessThanOrEqual(2);
};

// The button is fully inside the window (the game may have scrolled itself to show it).
const expectOnScreen = async (page, locator, what) => {
  await expect(locator, what).toBeVisible();
  await page.waitForTimeout(400); // smooth "settle" scroll after answering
  const box = await locator.boundingBox();
  const h = await page.evaluate(() => innerHeight);
  expect(box.y, `${what}: top`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${what}: bottom`).toBeLessThanOrEqual(h);
};

test('math-exam: first task of every station and of the exam fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/math-exam/');
  const n = await page.locator('#stations .station').count();
  for (let i = 0; i < n; i++) {
    await open(page, '/games/math-exam/');
    await tap(page.locator('#stations .station').nth(i).locator('.level').first());
    await expect(page.locator('#play')).toBeVisible();
    await expectFits(page, `station ${i + 1}`);
    await solveMathTask(page, tap);
    await expectOnScreen(page, page.locator('#feedback button').first(), `station ${i + 1} next`);
  }
  await open(page, '/games/math-exam/');
  await tap(page.locator('#exam-btn'));
  await expectFits(page, 'exam');
});

test('sociales-planeta: first task of every station fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/sociales-planeta/');
  const ids = await page.evaluate(() => SP_CONTENT.stations.map((s) => s.id));
  for (const id of ids) {
    await open(page, '/games/sociales-planeta/');
    await page.evaluate((s) => __sp.startStation(s), id);
    await expect(page.locator('#play')).toBeVisible();
    await expectFits(page, id);
  }
  await open(page, '/games/sociales-planeta/');
  await openStation(page, tap, 'curiosidades');
  await answerCurrentTask(page, tap);
  await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), 'curiosidades next');
});

test('football-quiz: question fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/football-quiz/');
  await tap(page.locator('#start-btn'));
  await expect(page.locator('#choices .choice')).toHaveCount(4);
  await expectFits(page, 'question');
  await tap(page.locator('#choices .choice').first());
  await expectOnScreen(page, page.locator('#feedback button').first(), 'next');
});

test('penalty-multiply: start, kick and feedback fit', async ({ page, tap }) => {
  await open(page, '/games/penalty-multiply/');
  await expectFits(page, 'intro');
  await tap(page.locator('#start'));
  await expectFits(page, 'kick');
  const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
  await tap(page.locator(`#goal button[data-value="${a * b}"]`));
  await expectOnScreen(page, page.locator('#feedback button'), 'next');
  await expectFits(page, 'feedback');
});

test('goalkeeper: start screen fits', async ({ page }) => {
  await open(page, '/games/goalkeeper/');
  await expectFits(page, 'start');
  await expectOnScreen(page, page.locator('#start-btn'), 'start button');
});

test('coach-simon: intro, memory play, commands feedback and finish fit', async ({ page, tap }) => {
  await open(page, '/games/coach-simon/');
  await expectFits(page, 'intro memory');
  await tap(page.locator('[data-mode="commands"]'));
  await expectFits(page, 'intro commands');
  await expectOnScreen(page, page.locator('#start'), 'start button');
  await page.evaluate(() => (window.__simon.timeScale = 0.4));
  await tap(page.locator('#start'));
  await page.waitForFunction(() => __simon.phase === 'input');
  await expectFits(page, 'commands shot');
  const cmd = await page.evaluate(() => __simon.cmd);
  await tap(page.locator(`button.zone[data-zone="${cmd.zone}"]`));
  await expectOnScreen(page, page.locator('#feedback button'), 'next');
  await expectFits(page, 'commands feedback');
});

test('word-match: every task type fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/word-match/');
  const types = await playWordTasks(page, 'clothes', ['pic', 'text', 'listen', 'spell', 'pairs']);
  for (const type of types) {
    await expectFits(page, type);
    await answerWordTask(page, tap);
    await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${type} next`);
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
});

test('chytanka: every task type fits (the longest words); next button visible', async ({ page, tap }) => {
  await open(page, '/games/chytanka/');
  for (const station of ['dnipro', 'kharkiv']) {
    const types = await playChTasks(page, station, ['read', 'pic', 'hear', 'build', 'gap', 'story']);
    for (const type of types) {
      await expectFits(page, `${station} ${type}`);
      await answerChTask(page, tap);
      await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${station} ${type} next`);
      await tap(page.locator('#feedback .fb-actions .btn').first());
    }
  }
});

test('dictado: every task type fits (the longest words and sentences, the keyboard); next button visible', async ({ page, tap }) => {
  await open(page, '/games/dictado/');
  for (const [station, types] of [
    ['mp-mb', ['gap', 'pick', 'tiles', 'cloze', 'spot', 'write']],
    ['tilde', ['tilde', 'cloze']],
    ['signos', ['cloze', 'write']],
  ]) {
    await playDcTasks(page, station, types);
    for (const type of types) {
      await expectFits(page, `${station} ${type}`);
      await answerDcTask(page, tap);
      await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${station} ${type} next`);
      await tap(page.locator('#feedback .fb-actions .btn').first());
    }
  }
});

test('naturales-entorno: intro dialogs, first task of every station, label / filter / fill tasks fit; next button visible', async ({
  page,
  tap,
}) => {
  const cn = examPlayer('__cn');
  await open(page, '/games/naturales-entorno/');
  // The hub is a list of stations (it scrolls like every exam hub), but it never overflows sideways
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const ids = await page.evaluate(() => CN_CONTENT.stations.map((s) => s.id));

  // The station dialog with its Ukrainian glossary stays inside the window and shows «Empezar» without scrolling
  // (a long glossary may scroll inside the dialog: the dialog is its own scroll box)
  for (const [i, id] of ids.entries()) {
    await tap(page.locator('#stations .station').nth(i));
    await expect(page.locator('#intro-dlg .vocab')).toBeVisible();
    const m = await page.evaluate(() => {
      const d = document.getElementById('intro-dlg').getBoundingClientRect();
      const g = document.getElementById('intro-go').getBoundingClientRect();
      return { top: d.top, bottom: d.bottom, goTop: g.top, goBottom: g.bottom, h: innerHeight };
    });
    expect(m.top, `${id}: dialog top`).toBeGreaterThanOrEqual(0);
    expect(m.bottom, `${id}: dialog bottom`).toBeLessThanOrEqual(m.h);
    expect(m.goTop, `${id}: start button top`).toBeGreaterThanOrEqual(m.top);
    expect(m.goBottom, `${id}: start button bottom`).toBeLessThanOrEqual(m.bottom);
    await tap(page.locator('#intro-back'));
  }

  // First task of every station round (the glossary button is in the head)
  for (const id of ids) {
    await open(page, '/games/naturales-entorno/');
    await page.evaluate((s) => __cn.startStation(s), id);
    await expect(page.locator('#play')).toBeVisible();
    await expect(page.locator('#play-vocab')).toBeVisible();
    await expectFits(page, `${id} first task`);
  }

  // Every label scene, the filter, the longest fill words: fit, and the next button is on screen after the answer
  const tasks = await page.evaluate(() => CN_CONTENT.stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id }))));
  const fills = tasks.filter((t) => t.type === 'fill').sort((a, b) => b.answer.length - a.answer.length || b.text.length - a.text.length);
  const picks = [
    ...tasks.filter((t) => t.type === 'label'),
    ...tasks.filter((t) => t.type === 'filter'),
    ...fills.slice(0, 3),
    ...tasks.filter((t) => t.type === 'fill' && t.text.length > 90).slice(0, 2),
  ];
  expect(picks.length).toBeGreaterThanOrEqual(7);
  for (const t of picks) {
    await open(page, '/games/naturales-entorno/');
    await page.evaluate((x) => __cn.play([x]), t);
    const what = `${t.type} ${t.scene || t.answer || ''}`;
    await expectFits(page, what);
    await cn.answerTask(page, tap);
    await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${what} next`);
  }
});

test('lengua-mundo: hub, readings, the longest fix, a chat after all turns, a tone, the nota label and sort fit; next button visible', async ({
  page,
  tap,
}) => {
  const le = examPlayer('__le');
  const { startFromIntro, allTasks, playOnly } = unitPage('LE_CONTENT', '__le');
  await open(page, '/games/lengua-mundo/');
  await page.evaluate(() => {
    KFG.say = () => true; // no sound needed here
    KFG.speaking = () => false;
  });
  // The hub is a list of stations (it scrolls like every exam hub), but it never overflows sideways
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);

  // The readings: the page does not scroll (a long text scrolls inside its box), «Empezar las preguntas» is on screen
  for (const id of ['baobab', 'midas']) {
    await open(page, '/games/lengua-mundo/');
    await startFromIntro(page, tap, id);
    await expect(page.locator('#read-screen')).toBeVisible();
    await expectFits(page, `${id} reading`);
    await expectOnScreen(page, page.locator('#read-start'), `${id} start button`);
    await tap(page.locator('#read-start'));
    await expect(page.locator('#play')).toBeVisible();
    await expectFits(page, `${id} first task`);
  }

  const tasks = await allTasks(page);
  const by = (type) => tasks.filter((t) => t.type === type);
  const longest = (list, size) => [...list].sort((a, b) => size(b) - size(a))[0];
  const picks = [
    ['the longest fix', longest(by('fix'), (t) => t.text.length)],
    ['the chat with most turns and longest replies', longest(by('chat'), (t) => t.turns.length * 1000 + JSON.stringify(t.turns).length)],
    ['a tone', by('tone')[0]],
    ['the nota label', by('label').find((t) => t.scene === 'nota')],
    ['the aviso label', by('label').find((t) => t.scene === 'aviso')],
    ['the nota / aviso sort', by('sort').find((t) => t.station === 'nota' && /nota o un aviso/.test(t.q))],
    ['the longest pick', longest(by('pick'), (t) => t.text.length)],
  ];
  for (const [what, t] of picks) {
    expect(t, what).toBeTruthy();
    await open(page, '/games/lengua-mundo/');
    await page.evaluate(() => {
      KFG.say = () => true;
      KFG.speaking = () => false;
    });
    await playOnly(page, t);
    await expectFits(page, what);
    await le.answerTask(page, tap);
    // a chat is only over after all its turns: the call, the replies and the sheet are on screen together
    await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${what}: next`);
  }

  // The chat once more, looked at after every turn is answered, with the page scroll measured (the sheet may scroll a few px)
  await open(page, '/games/lengua-mundo/');
  await playOnly(page, picks[1][1]);
  await le.answerTask(page, tap, { stopAt: picks[1][1].turns.length - 1 });
  await expectFits(page, 'the chat before its last answer');
});
