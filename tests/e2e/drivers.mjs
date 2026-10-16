// Scripted players of the games, shared by the game, rewards and screenshot specs.
import { expect } from './helpers.mjs';

// ---------- penalty-multiply ----------

// Leaves exactly `tables` selected (the last selected chip can't be switched off, so add first).
export const chooseTables = async (page, tables) => {
  const pressed = (n) =>
    page
      .locator(`.chip[data-table="${n}"]`)
      .getAttribute('aria-pressed')
      .then((v) => v === 'true');
  for (const n of tables) if (!(await pressed(n))) await page.click(`.chip[data-table="${n}"]`);
  for (let n = 2; n <= 10; n++) if (!tables.includes(n) && (await pressed(n))) await page.click(`.chip[data-table="${n}"]`);
};

// Five kicks, every answer right. Returns when the finish screen shows.
export const playPenaltyRound = async (page, tap) => {
  await tap(page.locator('#start'));
  for (let i = 0; i < 5; i++) {
    const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
    await tap(page.locator(`#goal button[data-value="${a * b}"]`));
    await tap(page.locator('#feedback button'));
  }
  await expect(page.locator('#finish')).toBeVisible();
};

// ---------- sociales-planeta ----------

// Station tiles are in content order; `curiosidades` has only choice and true/false tasks.
export const stationIndex = (page, id) => page.evaluate((s) => SP_CONTENT.stations.findIndex((x) => x.id === s), id);

export const openStation = async (page, tap, id) => {
  await tap(page.locator('#stations .station').nth(await stationIndex(page, id)));
  await tap(page.locator('#intro-go'));
  await expect(page.locator('#play')).toBeVisible();
};

// Index of the choice button whose own text is exactly `text` (the <kbd> number is not part of it).
const choiceIndex = (page, text) =>
  page.evaluate(
    (want) =>
      [...document.querySelectorAll('#work .choice')].findIndex(
        (b) =>
          [...b.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent)
            .join('') === want,
      ),
    text,
  );

// Taps choice / true-false number `i` (tf: 0 = true, 1 = false).
const tapChoice = (page, tap, i) => tap(page.locator('#work .choice').nth(i));

// Answers the current choice / true-false task, right or deliberately wrong, reading the answer from the game's own session.
export const answerCurrentTask = async (page, tap, { wrong = false } = {}) => {
  const t = await page.evaluate(() => __sp.session.task);
  if (t.type === 'tf') return tapChoice(page, tap, t.truth !== wrong ? 0 : 1);
  if (t.type !== 'choice') throw new Error(`unsupported task type ${t.type}`);
  const text = t.options[wrong ? (t.answer + 1) % t.options.length : t.answer];
  const i = await choiceIndex(page, text);
  expect(i, `choice "${text}" on screen`).toBeGreaterThanOrEqual(0);
  return tapChoice(page, tap, i);
};

// Plays the opened station to the finish screen. `wrongAt` = task indexes to miss on purpose.
export const playStationRound = async (page, tap, { wrongAt = [] } = {}) => {
  for (let i = 0; i < 8; i++) {
    expect(await page.evaluate(() => __sp.session.index)).toBe(i);
    await answerCurrentTask(page, tap, { wrong: wrongAt.includes(i) });
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
  await expect(page.locator('#finish')).toBeVisible();
};

// ---------- math-exam ----------

const PACK_ADD = { uk: 'Додати пачку', es: 'Añadir un paquete de' };

// Solves the current task right, reading the answer from the game's session (window.__mathExam, test mode).
// keyboard: true = number keys / Enter only (no taps; the 'packs' task needs buttons and is not supported).
export const solveMathTask = async (page, tap, lang = 'uk', { keyboard = false } = {}) => {
  const { t, mode } = await page.evaluate(() => ({ t: __mathExam.session.task, mode: __mathExam.session.mode }));
  const key = (k) => page.keyboard.press(k);
  const typeNum = async (n) => {
    for (const ch of String(n)) await key(ch);
    await key('Enter');
  };
  switch (t.kind) {
    case 'choice': {
      const i = t.choices.findIndex((c) => c.value === t.answer);
      return keyboard ? key(String(i + 1)) : tap(page.locator('#work .choice').nth(i));
    }
    case 'number':
      return typeNum(t.answer);
    case 'packs':
      if (keyboard) throw new Error('packs task needs the mouse');
      for (const k of ['UM', 'C', 'D', 'U'])
        for (let i = 0; i < t.answer[k]; i++) await tap(page.getByRole('button', { name: `${PACK_ADD[lang]} ${k}`, exact: true }));
      return key('Control+Enter');
    case 'decompose':
      for (const k of ['UM', 'C', 'D', 'U']) await key(String(t.answer[k]));
      return key('Enter');
    case 'fix':
      if (t.answer.ok) return key('1');
      await key('2');
      return typeNum(t.answer.value);
    case 'column':
    case 'problema':
      if (t.kind === 'problema') await key(t.data.op);
      // The whole column answer is typed from the units up (right to left) in the exam, digit by digit in a station.
      if (mode === 'exam') {
        for (const ch of [...String(t.answer)].reverse()) await key(ch);
        return key('Enter');
      }
      for (let i = 0; i < String(t.data.result).length; i++) await key(String(t.data.steps[i].digit));
      return;
    case 'round':
      if (t.data.hideLine) return typeNum(t.answer);
      return key(t.answer === t.data.low ? 'ArrowLeft' : 'ArrowRight');
    default:
      throw new Error(`unknown math task kind ${t.kind}`);
  }
};

// Plays the running session to its finish screen, every answer right. Returns the number of tasks and their kinds.
export const playMathSession = async (page, tap, lang, opts) => {
  const kinds = new Set();
  for (let n = 0; n < 30; n++) {
    kinds.add(await page.evaluate(() => __mathExam.session.task.kind));
    await solveMathTask(page, tap, lang, opts);
    const fb = page.locator('#feedback .fb-box');
    await expect(fb, `feedback after task ${n + 1}`).toBeVisible();
    expect(await page.evaluate(() => __mathExam.session.mistakes), `no mistakes up to task ${n + 1}`).toBe(0);
    await page.keyboard.press('Enter');
    if (await page.locator('#finish').isVisible()) return { n: n + 1, kinds: [...kinds] };
  }
  throw new Error('math session did not finish');
};

// ---------- goalkeeper ----------

const gkState = (page) => page.evaluate(() => window.__goalkeeper);

// Waits until the match needs the player: a telegraphed shot, a pass / call question, a feedback button or the end screen.
const waitGoalkeeperTurn = (page) =>
  page.waitForFunction(
    () => {
      const s = window.__goalkeeper;
      return (
        s.screen === 'end' ||
        (s.phase === 'shot' && s.target) ||
        s.phase === 'pass' ||
        s.phase === 'call' ||
        !document.getElementById('feedback').hidden
      );
    },
    null,
    { timeout: 15_000 },
  );

// Plays a whole match: saves every shot (reads the target from the game's test-mode state) and answers every pass / call right.
// Starts from the start screen; takes the first-match lesson on the way.
export const playGoalkeeperMatch = async (page, tap) => {
  await tap(page.locator('#start-btn'));
  if ((await gkState(page)).screen === 'lesson') await tap(page.locator('#lesson-close'));
  await expect(page.locator('#match-screen')).toBeVisible();
  for (let step = 0; step < 80; step++) {
    await waitGoalkeeperTurn(page);
    const s = await gkState(page);
    if (s.screen === 'end') return;
    if (!(await page.locator('#feedback').isHidden())) {
      await tap(page.locator('#feedback button'));
    } else if (s.phase === 'shot') {
      await tap(page.locator(`#goal [data-zone="${s.target}"]`));
      // the save resolves when the ball arrives
      await page.waitForFunction(() => window.__goalkeeper.phase !== 'shot', null, { timeout: 15_000 });
    } else {
      const box = s.phase === 'call' ? '#shout-choices' : '#pass-choices';
      await tap(page.locator(`${box} [data-index="${s.choices.indexOf(s.answer)}"]`));
    }
  }
  throw new Error('goalkeeper match did not finish');
};
