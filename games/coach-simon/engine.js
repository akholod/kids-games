// Coach Simon — pure game logic, no DOM: goal zones and their names, levels, memory sequences, coach commands, keys.
// Loads via <script src="engine.js"> or require('./engine.js'); either way the API lands on globalThis.SimonEngine.
// Types: types/coach-simon.d.ts.
'use strict';

(() => {
  // The goal 3×3 as the keeper sees it (keeper's-eye view): 0 = top left … 8 = bottom right, reading order.
  // Left / right are the child's own left / right, the same as on the screen.
  /** @type {SimonZone[]} */
  const ZONES = [
    { es: 'Arriba a la izquierda', en: 'Top left', uk: 'Вгорі ліворуч' },
    { es: 'Arriba al centro', en: 'Top middle', uk: 'Вгорі по центру' },
    { es: 'Arriba a la derecha', en: 'Top right', uk: 'Вгорі праворуч' },
    { es: 'A la izquierda', en: 'Left', uk: 'Ліворуч' },
    { es: 'Al centro', en: 'Middle', uk: 'По центру' },
    { es: 'A la derecha', en: 'Right', uk: 'Праворуч' },
    { es: 'Abajo a la izquierda', en: 'Bottom left', uk: 'Внизу ліворуч' },
    { es: 'Abajo al centro', en: 'Bottom middle', uk: 'Внизу по центру' },
    { es: 'Abajo a la derecha', en: 'Bottom right', uk: 'Внизу праворуч' },
  ];
  const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const CORNERS = [0, 2, 6, 8];

  // Both modes are out of ROUND: memory = longest sequence repeated (the round is won at ROUND), commands = saves of ROUND shots.
  const ROUND = 10;

  // memory: zones used, first sequence length, light on / pause (ms) at that length (faster as it grows, see memoryTiming).
  // commands: zones used, ms the ball takes to reach the goal, trick commands per round (no "Simon says" = don't move).
  // coin: KF.answer coin per right answer; bonus: perfect-round coins, paid until the level is done perfectly once.
  /** @type {Record<SimonLevelId, SimonLevel>} */
  const LEVELS = {
    rookie: {
      memory: { zones: CORNERS, start: 2, onMs: 850, gapMs: 320 },
      commands: { zones: [...CORNERS, 4], ballMs: 4500, tricks: 0 },
      coin: 0.5,
      bonus: 2,
    },
    academy: {
      memory: { zones: ALL, start: 2, onMs: 700, gapMs: 260 },
      commands: { zones: ALL, ballMs: 3300, tricks: 0 },
      coin: 1,
      bonus: 4,
    },
    pro: {
      memory: { zones: ALL, start: 3, onMs: 560, gapMs: 210 },
      commands: { zones: ALL, ballMs: 2500, tricks: 3 },
      coin: 1,
      bonus: 6,
    },
  };

  /** @type {SimonLang[]} */
  const LANGS = ['es', 'en', 'mix'];
  const SAYS = { es: 'Simón dice', en: 'Simon says' };

  /** @param {readonly number[]} arr @param {() => number} rand */
  const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];

  // A random zone of `zones`, never `not` (no same zone twice in a row — a repeat looks like one long light).
  /** @param {readonly number[]} zones @param {number | undefined} not @param {() => number} rand */
  const pickZone = (zones, not, rand) => pick(zones.length > 1 ? zones.filter((z) => z !== not) : zones, rand);

  // ---------- memory ----------

  /** @param {readonly number[]} seq @param {SimonLevelId} level @param {() => number} [rand] */
  const extend = (seq, level, rand = Math.random) => [...seq, pickZone(LEVELS[level].memory.zones, seq[seq.length - 1], rand)];

  /** @param {SimonLevelId} level @param {() => number} [rand] */
  const firstSequence = (level, rand = Math.random) => {
    /** @type {number[]} */
    let seq = [];
    for (let i = 0; i < LEVELS[level].memory.start; i++) seq = extend(seq, level, rand);
    return seq;
  };

  // Tap `zone` as step `pos` of `seq`: 'next' (right, more to come), 'done' (the whole sequence is right), 'miss'.
  /** @param {readonly number[]} seq @param {number} pos @param {number} zone @returns {'next' | 'done' | 'miss'} */
  const check = (seq, pos, zone) => (seq[pos] !== zone ? 'miss' : pos === seq.length - 1 ? 'done' : 'next');

  // Light timing for a sequence of `len`: 5% faster per step above the start, down to 60% of the level's speed.
  /** @param {SimonLevelId} level @param {number} len */
  const memoryTiming = (level, len) => {
    const m = LEVELS[level].memory;
    const k = Math.max(0.6, 1 - 0.05 * Math.max(0, len - m.start));
    return { on: Math.round(m.onMs * k), gap: Math.round(m.gapMs * k) };
  };

  // ---------- commands ----------

  // `n` distinct indexes in 1..total-1 (the first command is never a trick), no two next to each other.
  /** @param {number} n @param {number} total @param {() => number} rand */
  const trickSlots = (n, total, rand) => {
    const free = Array.from({ length: total - 1 }, (_, i) => i + 1);
    /** @type {Set<number>} */
    const out = new Set();
    while (out.size < n && free.length) {
      const i = free.splice(Math.floor(rand() * free.length), 1)[0];
      if (!out.has(i - 1) && !out.has(i + 1)) out.add(i);
    }
    return out;
  };

  // The round's commands. lang 'mix' = each command Spanish or English at random.
  // With tricks (pro) every real command starts with "Simón dice" / "Simon says"; a trick has no prefix — the keeper must not move.
  /** @param {SimonLevelId} level @param {SimonLang} lang @param {() => number} [rand] @returns {SimonCommand[]} */
  const makeCommands = (level, lang, rand = Math.random) => {
    const cfg = LEVELS[level].commands;
    const tricks = trickSlots(cfg.tricks, ROUND, rand);
    /** @type {SimonCommand[]} */
    const out = [];
    for (let i = 0; i < ROUND; i++) {
      const zone = pickZone(cfg.zones, out[i - 1]?.zone, rand);
      /** @type {'es' | 'en'} */
      const l = lang === 'mix' ? (rand() < 0.5 ? 'es' : 'en') : lang;
      const trick = tricks.has(i);
      out.push({ zone, lang: l, trick, prefix: cfg.tricks && !trick ? SAYS[l] : '', words: ZONES[zone][l] });
    }
    return out;
  };

  // What the coach says aloud (and shows): "Simón dice: arriba a la izquierda" or "¡Arriba a la izquierda!".
  /** @param {SimonCommand} cmd */
  const spoken = (cmd) => {
    if (cmd.prefix) return `${cmd.prefix}: ${cmd.words.charAt(0).toLowerCase()}${cmd.words.slice(1)}`;
    return cmd.lang === 'es' ? `¡${cmd.words}!` : `${cmd.words}!`;
  };

  // The keeper's reaction to a command: tapped zone, or null = did not move before the ball came.
  // save = right zone; goal = wrong zone or too late; held = did not move on a trick (right); fooled = moved on a trick.
  /** @param {SimonCommand} cmd @param {number | null} zone @returns {SimonVerdict} */
  const judge = (cmd, zone) => {
    if (cmd.trick) return zone === null ? 'held' : 'fooled';
    return zone === cmd.zone ? 'save' : 'goal';
  };
  /** @param {SimonVerdict} v */
  const isRight = (v) => v === 'save' || v === 'held';

  // ---------- keys ----------

  // Zone of a key: top-row digits 1–9 go in reading order (1 = top left), the numpad is spatial (7 = top left, 1 = bottom left).
  // -1 = not a zone key.
  /** @param {string} key @param {string} [code] */
  const keyZone = (key, code = '') => {
    const m = /^Numpad([1-9])$/.exec(code);
    if (m) {
      const n = Number(m[1]) - 1;
      return (2 - Math.floor(n / 3)) * 3 + (n % 3);
    }
    return /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
  };

  /** @type {SimonEngineAPI} */
  const api = {
    ZONES,
    LEVELS,
    LANGS,
    ROUND,
    SAYS,
    extend,
    firstSequence,
    check,
    memoryTiming,
    makeCommands,
    spoken,
    judge,
    isRight,
    keyZone,
  };
  /** @type {any} */ (globalThis).SimonEngine = api;
})();
