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

// ---------- coach-simon ----------

// Picks mode / level / (commands) language on the intro and starts a round with the game timings sped up:
// memory 20× (light shows), commands 2.5× (the ball must not beat the test's tap: pro 2.5 s → 1 s).
export const startSimon = async (page, tap, { mode, level, lang } = {}) => {
  await page.evaluate((k) => (window.__simon.timeScale = k), mode === 'commands' ? 0.4 : 0.05);
  if (mode) await tap(page.locator(`[data-mode="${mode}"]`));
  if (level) await tap(page.locator(`[data-level="${level}"]`));
  if (lang) await tap(page.locator(`[data-lang="${lang}"]`));
  await tap(page.locator('#start'));
  await expect(page.locator('#play')).toBeVisible();
};

const simonInput = (page) =>
  page.waitForFunction(() => window.__simon.phase === 'input' || window.__simon.screen === 'finish', null, { timeout: 15_000 });

// Memory: repeats every sequence right; `missAt` = sequence lengths at which the first tap is wrong on purpose (once per entry).
// Returns when the finish screen shows. `press` = (zone) => Promise, default taps the zone.
export const playSimonMemory = async (page, tap, { missAt = [], press } = {}) => {
  const hitZone = press || ((z) => tap(page.locator(`button.zone[data-zone="${z}"]`)));
  const misses = [...missAt];
  for (let step = 0; step < 40; step++) {
    await simonInput(page);
    // `wrong` = a zone of this level (unused zones are switched off) that is not the first of the sequence
    const s = await page.evaluate(() => ({
      screen: __simon.screen,
      seq: __simon.seq,
      wrong: SimonEngine.LEVELS[__simon.level].memory.zones.find((z) => z !== __simon.seq[0]),
    }));
    if (s.screen === 'finish') return;
    const miss = misses.indexOf(s.seq.length);
    if (miss >= 0) {
      misses.splice(miss, 1);
      await hitZone(s.wrong);
    } else for (const z of s.seq) await hitZone(z);
    await page.waitForFunction(() => window.__simon.phase !== 'input' || window.__simon.screen === 'finish', null, { timeout: 15_000 });
  }
  throw new Error('simon memory round did not finish');
};

// Commands: catches every real command, stands still on tricks; Next after each of `shots` shots (the rest of the round).
// Returns the verdicts.
export const playSimonCommands = async (page, tap, { press, next, shots = 10 } = {}) => {
  const hitZone = press || ((z) => tap(page.locator(`button.zone[data-zone="${z}"]`)));
  const goNext = next || (() => tap(page.locator('#feedback button')));
  for (let i = 0; i < shots; i++) {
    await simonInput(page);
    const cmd = await page.evaluate(() => __simon.cmd);
    if (!cmd.trick) await hitZone(cmd.zone);
    await page.waitForFunction(() => window.__simon.phase === 'feedback', null, { timeout: 15_000 });
    await goNext();
  }
  await expect(page.locator('#finish')).toBeVisible();
  return page.evaluate(() => __simon.results);
};

// ---------- word-match ----------

// Index of the pair button with own text `text` in column `col` (0 = English, 1 = translation) of the pairs task.
const pairIndex = (page, col, text) =>
  page.evaluate(
    ([c, want]) =>
      [...document.querySelectorAll(`#work .pairs .col:nth-child(${c + 1}) .pr`)].findIndex(
        (b) =>
          [...b.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent)
            .join('') === want,
      ),
    [col, text],
  );

// A round of the chosen tasks of one station (window.__wm.play, test mode). pickers: (tasks) => task, in order.
export const playWordTasks = (page, station, types) =>
  page.evaluate(
    ([id, want]) => {
      const s = WM_CONTENT.stations.find((x) => x.id === id);
      const used = new Set();
      const tasks = want.map((w) => {
        const t = s.tasks.find(
          (x) =>
            !used.has(x) &&
            (w === 'pic' ? x.type === 'choice' && x.art : w === 'text' ? x.type === 'choice' && !x.art : x.type === w) &&
            (!x.key || ![...used].some((u) => u.key === x.key)),
        );
        used.add(t);
        return { ...t, station: id };
      });
      __wm.play(tasks);
      return tasks.map((t) => t.type);
    },
    [station, types],
  );

// Answers the current word-match task right. spell: `wrongFirst` checks the letters reversed once (a retry), then right.
export const answerWordTask = async (page, tap, { wrongFirst = false } = {}) => {
  const t = await page.evaluate(() => __wm.session.task);
  if (t.type === 'choice') {
    const i = await choiceIndex(page, t.options[t.answer]);
    expect(i, `choice "${t.options[t.answer]}" on screen`).toBeGreaterThanOrEqual(0);
    return tapChoice(page, tap, i);
  }
  if (t.type === 'listen') return tap(page.locator(`.wm-opt[data-key="${t.word.key}"]`));
  if (t.type === 'spell') {
    const fill = async (letters) => {
      for (const ch of letters) await tap(page.locator(`.wm-tile[data-ch="${ch}"]:not(:disabled)`).first());
      await tap(page.locator('.wm-check'));
    };
    if (wrongFirst) {
      await fill([...t.word.en].reverse());
      await expect(page.locator('.wm-spell')).not.toHaveClass(/is-done/);
      // the right letters stay (green), the rest go back to the tiles: fill the free slots in order
      const free = await page.evaluate(() => [...document.querySelectorAll('.wm-slot')].map((s) => !s.classList.contains('good')));
      return fill([...t.word.en].filter((_, i) => free[i]));
    }
    return fill([...t.word.en]);
  }
  if (t.type === 'pairs') {
    for (const [en, tr] of t.pairs) {
      await tap(page.locator('#work .pairs .col:nth-child(1) .pr').nth(await pairIndex(page, 0, en)));
      await tap(page.locator('#work .pairs .col:nth-child(2) .pr').nth(await pairIndex(page, 1, tr)));
    }
    return;
  }
  throw new Error(`unsupported word-match task ${t.type}`);
};

// Plays the running word-match session to its finish screen, every answer right. Returns the task types and keys seen.
export const playWordSession = async (page, tap, opts) => {
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const t = await page.evaluate(() => __wm.session.task);
    seen.push({ type: t.type, key: t.key });
    await answerWordTask(page, tap, opts);
    await tap(page.locator('#feedback .fb-actions .btn').first());
    if (await page.locator('#finish').isVisible()) return seen;
  }
  throw new Error('word-match session did not finish');
};

// ---------- chytanka ----------

// A round of the chosen task types of one stop (window.__ch.play, test mode); 'pic' = picture → word choice.
export const playChTasks = (page, station, types) =>
  page.evaluate(
    ([id, want]) => {
      const s = CH_CONTENT.stations.find((x) => x.id === id);
      const used = new Set();
      const tasks = want.map((w) => {
        const t = s.tasks.find(
          (x) => !used.has(x) && (w === 'pic' ? x.type === 'choice' : x.type === w) && (!x.key || ![...used].some((u) => u.key === x.key)),
        );
        used.add(t);
        return { ...t, station: id };
      });
      __ch.play(tasks);
      return tasks.map((t) => t.type);
    },
    [station, types],
  );

// Answers the current chytanka task right. build: `wrongFirst` checks the syllables reversed once (a retry), then right.
export const answerChTask = async (page, tap, { wrongFirst = false } = {}) => {
  const t = await page.evaluate(() => __ch.session.task);
  if (t.type === 'choice') {
    const i = await choiceIndex(page, t.options[t.answer]);
    expect(i, `choice "${t.options[t.answer]}" on screen`).toBeGreaterThanOrEqual(0);
    return tapChoice(page, tap, i);
  }
  if (t.type === 'read') return tap(page.locator(`.ch-opt[data-key="${t.word.key}"]`));
  if (t.type === 'hear') return tap(page.locator(`.ch-wopt[data-word="${t.word.word}"]`));
  if (t.type === 'gap') return tap(page.locator(`.ch-letter[data-letter="${t.options[0]}"]`));
  if (t.type === 'story') return tap(page.locator(`.ch-ans[data-answer="${t.options[0]}"]`));
  if (t.type === 'build') {
    const fill = async (syls) => {
      for (const s of syls) await tap(page.locator(`.ch-tile[data-syl="${s}"]:not(:disabled)`).first());
      await tap(page.locator('.ch-check'));
    };
    if (wrongFirst) {
      await fill([...t.word.syl].reverse());
      await expect(page.locator('.ch-build')).not.toHaveClass(/is-done/);
      // the right syllables stay (green), the rest go back to the tiles: fill the free slots in order
      const free = await page.evaluate(() => [...document.querySelectorAll('.ch-bslot')].map((s) => !s.classList.contains('good')));
      return fill(t.word.syl.filter((_, i) => free[i]));
    }
    return fill(t.word.syl);
  }
  throw new Error(`unsupported chytanka task ${t.type}`);
};

// Plays the running chytanka session to its finish screen, every answer right. Returns the task types and keys seen.
export const playChSession = async (page, tap) => {
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const t = await page.evaluate(() => __ch.session.task);
    seen.push({ type: t.type, key: t.key });
    await answerChTask(page, tap);
    await tap(page.locator('#feedback .fb-actions .btn').first());
    if (await page.locator('#finish').isVisible()) return seen;
  }
  throw new Error('chytanka session did not finish');
};

// ---------- dictado ----------

// A round of the chosen task types of one rule (window.__dc.play, test mode).
export const playDcTasks = (page, station, types) =>
  page.evaluate(
    ([id, want]) => {
      const s = DC_CONTENT.stations.find((x) => x.id === id);
      const used = new Set();
      const tasks = want.map((w) => {
        const t = s.tasks.find((x) => !used.has(x) && x.type === w && ![...used].some((u) => u.key === x.key));
        used.add(t);
        return { ...t, station: id };
      });
      __dc.play(tasks);
      return tasks.map((t) => t.type);
    },
    [station, types],
  );

// Types `text` on the dictado on-screen keyboard: ⇧ for a capital, ´ / ¨ before an accented vowel; spaces fill themselves.
const ACCENT = { á: ['´', 'a'], é: ['´', 'e'], í: ['´', 'i'], ó: ['´', 'o'], ú: ['´', 'u'], ü: ['¨', 'u'] };
export const typeDcKeys = async (page, tap, text) => {
  for (const ch of text) {
    if (ch === ' ') continue;
    const low = ch.toLowerCase();
    if (ch !== low) await tap(page.locator('.dc-key[data-k="shift"]'));
    const [acc, base] = ACCENT[low] || [null, low];
    if (acc) await tap(page.locator(`.dc-key[data-k="${acc}"]`));
    await tap(page.locator(`.dc-key[data-k="${base}"]`));
  }
};

// Answers the current dictado task right. tiles / write: `wrongFirst` checks a wrong spelling once (a retry), then right.
export const answerDcTask = async (page, tap, { wrongFirst = false } = {}) => {
  const t = await page.evaluate(() => __dc.session.task);
  const opt = (sel, value) => tap(page.locator(`${sel}[data-opt="${value}"]`));
  if (t.type === 'gap') return opt('#work .dc-opt', t.options[0]);
  if (t.type === 'pick') return opt('#work .dc-opt', t.options[0]);
  if (t.type === 'tilde') return tap(t.answer < 0 ? page.locator('#dc-notilde') : page.locator(`.dc-tv[data-i="${t.answer}"]`));
  if (t.type === 'spot') return tap(page.locator(`.dc-chip[data-i="${t.wrong}"]`));
  if (t.type === 'cloze') {
    const gaps = t.parts.filter((p) => typeof p !== 'string');
    for (let i = 0; i < gaps.length; i++) {
      await tap(page.locator(`.dc-cgap[data-i="${i}"]`));
      await opt('#dc-chooser .dc-opt', gaps[i].right);
    }
    return;
  }
  if (t.type === 'tiles' || t.type === 'write') {
    const letters = [...t.word];
    const fill = async (chars) => {
      if (t.type === 'write') await typeDcKeys(page, tap, chars.join(''));
      else for (const c of chars) await tap(page.locator(`.dc-tile[data-ch="${c}"]:not(:disabled)`).first());
      await tap(page.locator('.dc-check'));
    };
    if (wrongFirst) {
      // the first two letters swapped (same tiles / keys, a wrong spelling)
      const [a, b, ...rest] = letters.filter((c) => c !== ' ');
      expect(a, 'two different first letters').not.toBe(b);
      await fill([b, a, ...rest]);
      await expect(page.locator('#feedback .fb-actions .btn')).toHaveCount(0);
      const free = await page.evaluate(() => [...document.querySelectorAll('.dc-slot')].map((s) => !s.classList.contains('good')));
      return fill(letters.filter((c, i) => free[i] && c !== ' '));
    }
    return fill(letters.filter((c) => c !== ' '));
  }
  throw new Error(`unsupported dictado task ${t.type}`);
};

// Plays the running dictado session to its finish screen, every answer right. Returns the task types and keys seen.
export const playDcSession = async (page, tap) => {
  const seen = [];
  for (let i = 0; i < 30; i++) {
    const t = await page.evaluate(() => __dc.session.task);
    seen.push({ type: t.type, key: t.key });
    await answerDcTask(page, tap);
    await tap(page.locator('#feedback .fb-actions .btn').first());
    if (await page.locator('#finish').isVisible()) return seen;
  }
  throw new Error('dictado session did not finish');
};
