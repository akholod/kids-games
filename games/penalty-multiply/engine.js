// Penalty multiplication — pure round logic, no DOM: which examples a round of kicks gets and what each pays.
// Loads via <script src="engine.js"> or require('./engine.js'); either way the API lands on globalThis.PenaltyEngine.
// Types: types/penalty-multiply.d.ts.
'use strict';

(() => {
  // ×2, ×3 and ×10 are easy: at most MAX_EASY of them in a round, and they pay half a coin.
  const EASY = [2, 3, 10];
  const MAX_EASY = 2;
  const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  /** @param {number} a @param {number} b */
  const easyFactors = (a, b) => Number(EASY.includes(a)) + Number(EASY.includes(b));
  /** @param {number} a @param {number} b */
  const isEasy = (a, b) => easyFactors(a, b) > 0;
  /** KF.answer coin for a right answer. @param {number} a @param {number} b */
  const coinFor = (a, b) => (isEasy(a, b) ? 0.5 : 1);
  // 6–9 are the hard ones: twice as likely as 4 and 5.
  /** @param {number} x */
  const weight = (x) => (x >= 6 && x <= 9 ? 2 : 1);

  /**
   * The examples of one round: `a` from the chosen tables, `b` from 2–10.
   * The hardest examples the tables allow (fewest easy factors) make the round, 6–9 twice as often, no repeat
   * until they run out and never the same twice in a row; plus 0–MAX_EASY easier ones at random places.
   * @param {number[]} tables @param {number} [n] @param {() => number} [rnd]
   * @returns {[number, number][]}
   */
  const round = (tables, n = 12, rnd = Math.random) => {
    /** @type {[number, number][]} */
    const all = [];
    for (const a of tables) for (const b of FACTORS) all.push([a, b]);
    if (!all.length) return [];
    const min = Math.min(...all.map(([a, b]) => easyFactors(a, b)));
    const main = all.filter(([a, b]) => easyFactors(a, b) === min);
    const easy = all.filter(([a, b]) => easyFactors(a, b) > min);
    // shuffled easy ones, the first k of them go in
    for (let i = easy.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [easy[i], easy[j]] = [easy[j], easy[i]];
    }
    const k = Math.min(easy.length, Math.floor(rnd() * (MAX_EASY + 1)), n);
    /** @type {[number, number][]} */
    const out = [];
    /** @type {[number, number][]} */
    let bag = [];
    while (out.length < n - k) {
      if (!bag.length) bag = main.slice();
      const last = out[out.length - 1];
      const can = bag.length > 1 && last ? bag.filter((p) => p !== last) : bag;
      let r = rnd() * can.reduce((s, [a, b]) => s + weight(a) * weight(b), 0);
      let p = can[can.length - 1];
      for (const q of can) {
        r -= weight(q[0]) * weight(q[1]);
        if (r < 0) {
          p = q;
          break;
        }
      }
      bag.splice(bag.indexOf(p), 1);
      out.push(p);
    }
    for (const p of easy.slice(0, k)) out.splice(Math.floor(rnd() * (out.length + 1)), 0, p);
    return out.map(([a, b]) => [a, b]);
  };

  /** @type {PenaltyEngineApi} */
  const api = { EASY, MAX_EASY, isEasy, coinFor, round };
  /** @type {any} */ (globalThis).PenaltyEngine = api;
})();
