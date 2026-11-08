// Types of games/penalty-multiply/engine.js (globalThis.PenaltyEngine). Ambient: no import/export.

interface PenaltyEngineApi {
  /** Easy factors (×2, ×3, ×10): rare in a round, half a coin. */
  EASY: number[];
  /** At most this many easier examples in a round. */
  MAX_EASY: number;
  isEasy(a: number, b: number): boolean;
  /** KF.answer coin for a right answer to a × b. */
  coinFor(a: number, b: number): number;
  /** The examples [a, b] of one round; a from `tables`, b from 2–10. */
  round(tables: number[], n?: number, rnd?: () => number): [number, number][];
}

declare var PenaltyEngine: PenaltyEngineApi;
