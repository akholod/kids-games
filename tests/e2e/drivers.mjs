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

// Twelve kicks, every answer right. Returns the examples [a, b] it saw, when the finish screen shows.
export const PENALTY_KICKS = 12;
export const playPenaltyRound = async (page, tap) => {
  await tap(page.locator('#start'));
  const seen = [];
  for (let i = 0; i < PENALTY_KICKS; i++) {
    const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
    seen.push([a, b]);
    await tap(page.locator(`#goal button[data-value="${a * b}"]`));
    await tap(page.locator('#feedback button'));
  }
  await expect(page.locator('#finish')).toBeVisible();
  return seen;
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

// ---------- exam units on the shared engine (shared/exam): generic scripted player ----------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LETTER_KEYS = 'ABCDEFGH';
const PLAIN_OF = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
// The keys of a word as a kid types it: the plain vowel for an accented one. That only gives the accent when every plain tile
// of that vowel is already used (the pool has the word's own letters), so in a word that has both «i» and «í» with a plain one
// after the accented one, the accented letter is sent as its own key (what a Spanish keyboard does). ñ / ü are always their own keys.
const typedKeys = (word, exact = false) =>
  [...word].map((c, i) => {
    const plain = PLAIN_OF[c];
    if (!plain) return { key: c, own: 'ñü'.includes(c) };
    return exact || [...word].slice(i + 1).includes(plain) ? { key: c, own: true } : { key: plain, own: false };
  });

// Texts of the buttons' own text nodes (the <kbd> hint is not part of it).
const ownTexts = (page, selector) =>
  page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)].map((b) =>
        [...b.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent)
          .join(''),
      ),
    selector,
  );

// A scripted player of a unit mounted with KFExam (test hook `window[hook]`, e.g. '__cn', '__sp', '__exam').
// answerTask(page, tap, opts) answers the running task from the engine's own session:
//   choice, tf, sort, order, pairs, label, fill (typed or tiles), filter (naturales-entorno); right, or with `wrong`:
//   choice / tf = the first wrong one; label = one wrong slot first (soft); fill = a wrong word first, then the right one (soft);
//   filter = `mistakes` wrong layers (1 = soft, 2 = the second miss on the first layer: the round says false);
//   cultura-asturiana's feed, cook, wordsearch, clues, calendar, cascayu: `wrong` = not right, `mistakes: 1` = right but soft.
// keyboard: true = keys only (`tap` is never called), else taps / clicks.
export const examPlayer = (hook) => {
  const session = (page) => page.evaluate((h) => window[h].session, hook);
  const sessionTask = (page) => page.evaluate((h) => window[h].session.task, hook);
  const answered = (page) => page.evaluate((h) => window[h].session.answered, hook);

  const choice = async (page, tap, t, { wrong, keyboard }) => {
    // Picture choice (`pics`): the buttons are `.choice.pic[data-key]` with the art key of an option; no art = text buttons of labels[i] || key.
    const picKeys = t.pics ? await page.locator('#work .choice.pic').evaluateAll((els) => els.map((e) => e.dataset.key)) : [];
    if (picKeys.length) {
      const right = picKeys.indexOf(t.options[t.answer]);
      expect(right, `picture «${t.options[t.answer]}» on screen`).toBeGreaterThanOrEqual(0);
      const i = wrong ? (right + 1) % picKeys.length : right;
      return keyboard ? page.keyboard.press(String(i + 1)) : tap(page.locator(`#work .choice.pic[data-key="${picKeys[i]}"]`));
    }
    const want = t.pics ? t.labels?.[t.answer] || t.options[t.answer] : t.options[t.answer];
    const shown = await ownTexts(page, '#work .choice');
    const right = shown.indexOf(want);
    expect(right, `choice «${want}» on screen`).toBeGreaterThanOrEqual(0);
    const i = wrong ? (right + 1) % shown.length : right;
    return keyboard ? page.keyboard.press(String(i + 1)) : tap(page.locator('#work .choice').nth(i));
  };

  // The key letters are the ones on the two kbd hints (V / F in Spanish, T / F in an English unit).
  const tf = async (page, tap, t, { wrong, keyboard }) => {
    const yes = wrong ? !t.truth : t.truth;
    if (!keyboard) return tap(page.locator('#work .choice').nth(yes ? 0 : 1));
    const letters = await page.locator('#work .choices.tf kbd').allTextContents();
    return page.keyboard.press(letters[yes ? 0 : 1].toLowerCase());
  };

  const sort = async (page, tap, t, { keyboard }) => {
    for (let i = 0; i < 12 && !(await answered(page)); i++) {
      const chip = (await page.locator('#work .chip[aria-pressed=true]').first().textContent()).trim();
      const item = t.items.find((it) => chip === it.text || chip === `${it.icon ?? ''}${it.text}`);
      expect(item, `sort chip «${chip}»`).toBeTruthy();
      const bin = t.bins.findIndex((b) => b.id === item.bin);
      if (keyboard) await page.keyboard.press(String(bin + 1));
      else await tap(page.locator('#work .bin').nth(bin));
    }
  };

  const order = async (page, tap, t, { keyboard }) => {
    const shown = await ownTexts(page, '#work .ord-card span:not(.ord-num)');
    for (const item of t.items) {
      const k = shown.indexOf(item);
      if (keyboard) await page.keyboard.press(LETTER_KEYS[k]);
      else await tap(page.locator('#work .ord-card').nth(k));
    }
    if (keyboard) await page.keyboard.press('Enter');
    else await tap(page.locator('#work .ord-actions .btn-dark'));
  };

  const pairs = async (page, tap, t, { keyboard }) => {
    const left = await ownTexts(page, '#work .pairs .col:first-child .pr');
    const right = await ownTexts(page, '#work .pairs .col:last-child .pr');
    for (const [k, l] of left.entries()) {
      const r = right.indexOf(t.pairs.find((p) => p[0] === l)[1]);
      if (keyboard) {
        await page.keyboard.press(String(k + 1));
        await page.keyboard.press(LETTER_KEYS[r]);
      } else {
        await tap(page.locator('#work .pairs .col:first-child .pr').nth(k));
        await tap(page.locator('#work .pairs .col:last-child .pr').nth(r));
      }
    }
  };

  // Chips are named by their text, slots by data-spot; chip keys 1–n are by the shuffled order, slot keys A–… by the scene's.
  const label = async (page, tap, t, { wrong, keyboard }) => {
    const chips = await ownTexts(page, '#work .chip');
    const idOf = (text) => t.labels.find((l) => l.text === text).id;
    const spots = await page.locator('#work .slot').evaluateAll((els) => els.map((e) => e.dataset.spot));
    const put = async (k, spot) => {
      if (keyboard) {
        await page.keyboard.press(String(k + 1));
        await page.keyboard.press(LETTER_KEYS[spots.indexOf(spot)]);
      } else {
        await tap(page.locator('#work .chip').filter({ hasText: new RegExp(`^\\d*${escapeRe(chips[k])}$`) }));
        await tap(page.locator(`#work .slot[data-spot="${spot}"]`));
      }
    };
    if (wrong) await put(0, spots[(spots.indexOf(idOf(chips[0])) + 1) % spots.length]);
    for (const [k, text] of chips.entries()) await put(k, idOf(text));
  };

  // Typed (keyboard) or the tiles in order; Enter / the check button at the end.
  const fill = async (page, tap, t, { wrong, keyboard }) => {
    const write = async (word, exact = false) => {
      if (keyboard) {
        // Playwright cannot press «ñ», «í»…: those are sent as the key event a Spanish keyboard would
        for (const { key, own } of typedKeys(word, exact)) {
          if (own) await page.evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), key);
          else await page.keyboard.press(key);
        }
      } else {
        for (const c of word) {
          await tap(
            page
              .locator('#work .fill-tile:not([disabled])')
              .filter({ hasText: new RegExp(`^${c}$`) })
              .first(),
          );
        }
      }
      if (keyboard) await page.keyboard.press('Enter');
      else await tap(page.locator('#work .fill-check'));
    };
    if (!wrong) return write(t.answer);
    // a word of the same length whose letters are all in the pool: swap the first two different letters
    const w = [...t.answer];
    const i = w.findIndex((c, k) => k > 0 && c !== w[0]);
    [w[0], w[i]] = [w[i], w[0]];
    await write(w.join(''));
    // the right letters stay green; fill the free slots in order with what is missing
    const have = await page.locator('#work .fill-slot').allTextContents();
    const free = have.map((c, k) => (c === '' ? k : -1)).filter((k) => k >= 0);
    await write(free.map((k) => t.answer[k]).join(''), true);
  };

  const filter = async (page, tap, t, { mistakes = 0, keyboard }) => {
    const shown = await page.locator('#work .cn-layer').evaluateAll((els) => els.map((e) => e.dataset.layer));
    const press = async (k) => (keyboard ? page.keyboard.press(String(k + 1)) : tap(page.locator('#work .cn-layer').nth(k)));
    const isOff = (k) => page.locator('#work .cn-layer').nth(k).isDisabled();
    // wrong layers first: for the very first layer (the mouth), a chip that is not the right one
    const wrongK = shown.findIndex((l) => l !== t.layers[0]);
    for (let m = 0; m < mistakes; m++) await press(wrongK);
    for (const layer of t.layers) {
      const k = shown.indexOf(layer);
      if (!(await isOff(k))) await press(k);
    }
  };

  // pick: the right words are `[bracketed]` in t.text; word buttons are the chunks with a letter or digit, in order.
  const pickWords = (text) =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((c) => (c.includes('[') ? [{ right: true }] : /[\p{L}\p{N}]/u.test(c) ? [{ right: false }] : []));
  const pick = async (page, tap, t, { wrong, keyboard }) => {
    const words = pickWords(t.text);
    // wrong: a trap too in the first check (the right picks stay, the trap goes back), then the check that is right: soft
    const trap = wrong ? words.findIndex((w) => !w.right) : -1;
    if (keyboard) {
      for (const [i, w] of words.entries()) {
        await page.keyboard.press('ArrowRight');
        if (w.right || i === trap) await page.keyboard.press(' ');
      }
      await page.keyboard.press('Enter');
      if (wrong) await page.keyboard.press('Enter');
      return;
    }
    for (const [i, w] of words.entries()) if (w.right || i === trap) await tap(page.locator('#work .pick-word').nth(i));
    await tap(page.locator('#work .pick-check'));
    if (wrong) await tap(page.locator('#work .pick-check'));
  };

  // fix (lengua-mundo «Corrige el texto»): t.text is the correct text; capitals on `.le-w[data-i]`, full stops on `.le-g[data-i]`,
  // in the unit's own tokenization (words split on spaces, punctuation around them stays).
  const fixTokens = (text) =>
    String(text)
      .split(/\n+/)
      .flatMap((line) =>
        line
          .split(/\s+/)
          .filter(Boolean)
          .map((raw) => {
            const m = raw.match(/^([¡¿«"“(—-]*)(.*?)([.,;:!?»"”)…]*)$/u) || ['', '', raw, ''];
            const letter = /\p{L}/u.test(m[2].charAt(0));
            return { letter, cap: letter && m[2].charAt(0) !== m[2].charAt(0).toLowerCase(), dot: m[3].includes('.') };
          }),
      );
  // mistakes: how many wrong things to do first (extra full stops where none belongs); then `retry`:
  //   'again' (default) = check once more as it is (with ≥ 2 mistakes the round says false), 'fix' = undo the mistakes and check again (soft).
  const fix = async (page, tap, t, { keyboard, mistakes = 0, retry = 'again' }) => {
    const toks = fixTokens(t.text);
    const steps = toks.flatMap((tk, i) => [
      ...(tk.letter ? [{ sel: `.le-w[data-i="${i}"]`, on: tk.cap }] : []),
      { sel: `.le-g[data-i="${i}"]`, on: tk.dot },
    ]);
    const flips = new Set(steps.filter((s) => !s.on).slice(0, mistakes));
    expect(flips.size, 'room for the mistakes').toBe(mistakes);
    const toggleAll = async (want) => {
      for (const st of steps) {
        if (keyboard) await page.keyboard.press('ArrowRight');
        if (want(st)) {
          if (keyboard) await page.keyboard.press(' ');
          else await tap(page.locator(`#work ${st.sel}`));
        }
      }
    };
    const check = () => (keyboard ? page.keyboard.press('Enter') : tap(page.locator('#work .le-fix-check')));
    await toggleAll((st) => st.on !== flips.has(st));
    await check();
    if (mistakes === 0 || (mistakes === 1 && retry !== 'fix')) return;
    if (retry === 'fix') {
      // the unit lets the player go on after the first check: undo the extra stops (the cursor continues from the last toggle)
      for (const st of flips) {
        if (keyboard) {
          await page.locator(`#work ${st.sel}`).focus();
          await page.keyboard.press(' ');
        } else await tap(page.locator(`#work ${st.sel}`));
      }
    }
    await check();
  };

  // chat (lengua-mundo phone call): one reply per turn by the task's own turns[i].answer; wrongTurns = turn indexes answered wrong,
  // stopAt = answer only the turns before this index.
  const chat = async (page, tap, t, { keyboard, wrong, wrongTurns = wrong ? [0, 1] : [], stopAt = Number.POSITIVE_INFINITY }) => {
    for (const [k, turn] of t.turns.entries()) {
      if (k >= stopAt) return; // stopAt: leave the call open before this turn
      await expect(page.locator(`#work .le-chat[data-turn="${k}"] .le-reply`).first(), `turn ${k + 1} replies`).toBeVisible();
      const shown = await page.evaluate(() =>
        [...document.querySelectorAll('#work .le-reply')].map((b) =>
          [...b.childNodes]
            .filter((n) => n.nodeName !== 'KBD')
            .map((n) => n.textContent)
            .join(''),
        ),
      );
      const right = shown.indexOf(turn.options[turn.answer]);
      expect(right, `turn ${k + 1}: «${turn.options[turn.answer]}» on screen`).toBeGreaterThanOrEqual(0);
      const i = wrongTurns.includes(k) ? shown.findIndex((_, j) => j !== right) : right;
      if (keyboard) await page.keyboard.press(String(i + 1));
      else await tap(page.locator('#work .le-reply').nth(i));
    }
  };

  // tone (lengua-mundo intonation): t.rising = the voice goes up
  const tone = (page, tap, t, { keyboard, wrong }) => {
    const up = wrong ? !t.rising : t.rising;
    return keyboard ? page.keyboard.press(up ? '1' : '2') : tap(page.locator(`#work .le-tone-ans[data-rising="${up}"]`));
  };

  // ---- cultura-asturiana's own types. `wrong` = the task ends not right; `mistakes: 1` = one slip, still right (soft). ----
  const pressOrTap = async (page, tap, keyboard, key, locator) => (keyboard ? page.keyboard.press(key) : tap(locator));

  // feed: items are `.ca-item[data-i]` (index into t.items), keys 1–n by position. Wrong items first (2 = not right), then every ok one.
  const feed = async (page, tap, t, { wrong, mistakes = 0, keyboard }) => {
    const ids = await page.locator('#work .ca-item').evaluateAll((els) => els.map((e) => Number(e.dataset.i)));
    const give = (k) => pressOrTap(page, tap, keyboard, String(k + 1), page.locator('#work .ca-item').nth(k));
    const bad = ids.map((i, k) => (t.items[i].ok ? -1 : k)).filter((k) => k >= 0);
    for (const k of bad.slice(0, wrong ? 2 : mistakes)) await give(k);
    for (const [k, i] of ids.entries()) if (t.items[i].ok) await give(k);
  };

  // cook: cards are `.ca-step[data-i]` (step index, or `x…` for an extra), keys 1–n by position. Wrong taps first: the extra cards,
  // then a later step (2 = the second miss puts step 1 in by itself), then the steps in order (the ones not in yet).
  const cook = async (page, tap, t, { wrong, mistakes = 0, keyboard }) => {
    const ids = await page.locator('#work .ca-step').evaluateAll((els) => els.map((e) => e.dataset.i));
    const press = (k) => pressOrTap(page, tap, keyboard, String(k + 1), page.locator('#work .ca-step').nth(k));
    const n = t.steps.length;
    const misses = [...ids.flatMap((id, k) => (id.startsWith('x') ? [k] : [])), ids.indexOf(String(n - 1)), ids.indexOf(String(n - 2))];
    for (const k of misses.slice(0, wrong ? 2 : mistakes)) await press(k);
    for (let i = 0; i < n; i++) {
      const k = ids.indexOf(String(i));
      if (!(await page.locator('#work .ca-step').nth(k).isDisabled())) await press(k);
    }
  };

  // wordsearch: the words are found in t.rows (→ or ↓); a selection = its first and its last cell. Wrong ones first: two neighbour
  // letters of a row (3 = not right). Keyboard: arrows walk the cursor (it starts at the top left), Enter marks a cell.
  const wordCells = (t, w) => {
    const g = t.rows.map((r) => [...r]);
    const L = [...w.toUpperCase()];
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < g[r].length; c++) {
        if (L.every((ch, i) => g[r][c + i] === ch))
          return [
            { r, c },
            { r, c: c + L.length - 1 },
          ];
        if (L.every((ch, i) => g[r + i]?.[c] === ch))
          return [
            { r, c },
            { r: r + L.length - 1, c },
          ];
      }
    throw new Error(`«${w}» not in the grid`);
  };
  const wordsearch = async (page, tap, t, { wrong, mistakes = 0, keyboard }) => {
    let at = { r: 0, c: 0 };
    let inGrid = false;
    const mark = async (p) => {
      if (!keyboard) return tap(page.locator(`#work .ca-ws-cell[data-r="${p.r}"][data-c="${p.c}"]`));
      if (!inGrid) {
        await page.keyboard.press('ArrowDown'); // the first arrow only puts the focus on the cursor
        inGrid = true;
      }
      for (; at.r < p.r; at.r++) await page.keyboard.press('ArrowDown');
      for (; at.r > p.r; at.r--) await page.keyboard.press('ArrowUp');
      for (; at.c < p.c; at.c++) await page.keyboard.press('ArrowRight');
      for (; at.c > p.c; at.c--) await page.keyboard.press('ArrowLeft');
      at = { ...p };
      await page.keyboard.press('Enter');
    };
    for (let m = 0; m < (wrong ? 3 : mistakes); m++) {
      await mark({ r: m, c: 0 });
      await mark({ r: m, c: 1 });
    }
    for (const w of t.words) {
      const [a, b] = wordCells(t, w);
      await mark(a);
      await mark(b);
    }
  };

  // clues: options are `.ca-opt[data-i]` (index into t.options), keys 1–n by position; one more clue first (P / the button).
  const clues = async (page, tap, t, { wrong, keyboard }) => {
    await pressOrTap(page, tap, keyboard, 'p', page.locator('#work .ca-more'));
    const ids = await page.locator('#work .ca-opt').evaluateAll((els) => els.map((e) => Number(e.dataset.i)));
    const right = ids.indexOf(t.answer);
    const k = wrong ? (right + 1) % ids.length : right;
    await pressOrTap(page, tap, keyboard, String(k + 1), page.locator('#work .ca-opt').nth(k));
  };

  // calendar: the selected chip (`.ca-cal-item[aria-pressed=true][data-i]`) goes to its month `.ca-month[data-month]` (keys 1–n);
  // misses first (2 = not right: the second miss on one card puts it in by itself).
  const calendar = async (page, tap, t, { wrong, mistakes = 0, keyboard }) => {
    let misses = wrong ? 2 : mistakes;
    for (let n = 0; n < 24 && !(await answered(page)); n++) {
      const i = Number(await page.locator('#work .ca-cal-item[aria-pressed=true]').getAttribute('data-i'));
      const right = t.months.indexOf(t.items[i].month);
      const k = misses-- > 0 ? (right + 1) % t.months.length : right;
      await pressOrTap(page, tap, keyboard, String(k + 1), page.locator(`#work .ca-month[data-month="${t.months[k]}"]`));
    }
  };

  // cascayu: `.ca-hop[data-step]` = the statement on screen; `.ca-hop-ans[data-truth]`, keys V / F; wrong = the first one wrong, then «Seguir».
  const cascayu = async (page, tap, t, { wrong, keyboard }) => {
    for (const [k, st] of t.steps.entries()) {
      await expect(page.locator('#work .ca-hop')).toHaveAttribute('data-step', String(k));
      const say = wrong && k === 0 ? !st.truth : st.truth;
      await pressOrTap(page, tap, keyboard, say ? 'v' : 'f', page.locator(`#work .ca-hop-ans[data-truth="${say}"]`));
      if (say !== st.truth && k < t.steps.length - 1) await pressOrTap(page, tap, keyboard, 'Enter', page.locator('#work .ca-hop-next'));
    }
  };

  const BY_TYPE = {
    choice,
    tf,
    sort,
    order,
    pairs,
    label,
    fill,
    filter,
    pick,
    fix,
    chat,
    tone,
    feed,
    cook,
    wordsearch,
    clues,
    calendar,
    cascayu,
  };

  const answerTask = async (page, tap, opts = {}) => {
    const t = await sessionTask(page);
    const fn = BY_TYPE[t.type];
    if (!fn) throw new Error(`unsupported task type ${t.type}`);
    await fn(page, tap, t, opts);
    return t;
  };

  // «Next» after feedback: Enter (keyboard) or the button.
  const next = async (page, tap, { keyboard } = {}) => {
    const btn = page.locator('#feedback .fb-actions .btn').first();
    await expect(btn).toBeVisible();
    if (keyboard) await page.keyboard.press('Enter');
    else await tap(btn);
  };

  // Plays the running session to its finish screen. `wrongAt` = task indexes to miss on purpose (see answerTask).
  // Returns the task types in play order.
  const playSession = async (page, tap, { wrongAt = [], keyboard = false } = {}) => {
    const n = (await session(page)).tasks.length;
    const types = [];
    for (let i = 0; i < n; i++) {
      expect((await session(page)).index).toBe(i);
      const wrong = wrongAt.includes(i);
      types.push((await answerTask(page, tap, { wrong, keyboard, mistakes: wrong ? 2 : 0 })).type);
      await next(page, tap, { keyboard });
    }
    await expect(page.locator('#finish')).toBeVisible();
    return types;
  };

  return { session, sessionTask, answerTask, next, playSession };
};

// ---------- one exam unit: stations, intro dialog, single tasks ----------

// Helpers of a unit page: `content` = the global of its content (e.g. 'LE_CONTENT'), `hook` = its test hook ('__le').
export const unitPage = (content, hook) => {
  const stationIndex = (page, id) => page.evaluate(([c, s]) => window[c].stations.findIndex((x) => x.id === s), [content, id]);
  // Taps a station tile: the intro dialog opens.
  const openIntro = async (page, tap, id) => tap(page.locator('#stations .station').nth(await stationIndex(page, id)));
  // Tile, then the dialog's «Empezar»: a round of a station without a text is playing; one with a text shows its reading first.
  const startFromIntro = async (page, tap, id) => {
    await openIntro(page, tap, id);
    await tap(page.locator('#intro-go'));
  };
  const allTasks = (page) =>
    page.evaluate((c) => window[c].stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id }))), content);
  // The first task of the content with this type (and test), tagged with its station.
  const taskWhere = async (page, type, ok = () => true) => (await allTasks(page)).find((t) => t.type === type && ok(t)) ?? null;
  // Plays exactly these tasks as one round (tagged with their station).
  const playOnly = (page, ...tasks) => page.evaluate(([h, t]) => window[h].play(t), [hook, tasks]);
  // Starts the station round (no reading) again and again until it has all the wanted types, then returns its session (the draw is random).
  const startStationWith = async (page, id, types) => {
    for (let i = 0; i < 60; i++) {
      await page.evaluate(([h, s]) => window[h].startStation(s), [hook, id]);
      const have = await page.evaluate((h) => window[h].session.tasks.map((t) => t.type), hook);
      if (types.every((t) => have.includes(t))) return have;
    }
    throw new Error(`no ${id} round with ${types.join(' + ')} in 60 draws`);
  };
  return { stationIndex, openIntro, startFromIntro, allTasks, taskWhere, playOnly, startStationWith };
};
