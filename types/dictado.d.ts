// Types of games/dictado («Dictado del míster»: Spanish spelling dictation, both sites): content.js, types.js, art.js.
// Ambient: no import/export.

/** A gap the player fills: the right text and the wrong choices ('' = "no letter": a silent h, no opening ¡). */
interface DCGap {
  right: string;
  /** Right one first; the renderer shuffles. */
  options: string[];
}

/** Hear the word, pick the letter(s) that go in the gap of the written word. */
interface DCGapTask extends ExamTaskBase {
  type: 'gap';
  key: string;
  /** What the coach says (clip). */
  say: string;
  word: string;
  /** Start and length of the gap in `word` (len 0 = a place where nothing goes, e.g. no h). */
  at: number;
  len: number;
  options: string[];
}

/** Hear the word, pick the right spelling among 2–3. */
interface DCPickTask extends ExamTaskBase {
  type: 'pick';
  key: string;
  say: string;
  /** Right one first; the renderer shuffles. */
  options: string[];
}

/** Hear the word, build it from letter tiles: its letters + `traps` (letters of the rule's typical mistakes). */
interface DCTilesTask extends ExamTaskBase {
  type: 'tiles';
  key: string;
  say: string;
  word: string;
  traps: string[];
}

/** Hear the word, type it with the on-screen keyboard (the final «Dictado del partido»). */
interface DCWriteTask extends ExamTaskBase {
  type: 'write';
  key: string;
  say: string;
  word: string;
}

/** Hear the word, tap the vowel that takes the tilde in `plain` (the word without accents), or «sin tilde». */
interface DCTildeTask extends ExamTaskBase {
  type: 'tilde';
  key: string;
  say: string;
  word: string;
  plain: string;
  /** Index in `plain` of the vowel with the tilde, -1 = no tilde. */
  answer: number;
}

/** Hear a sentence (normal and slow clips), fill its 1–3 gaps. `parts` joined with the right gaps = `say`. */
interface DCClozeTask extends ExamTaskBase {
  type: 'cloze';
  key: string;
  say: string;
  parts: (string | DCGap)[];
}

/** Read a sentence with one spelling mistake, tap the wrong word (not spoken: a reading task). */
interface DCSpotTask extends ExamTaskBase {
  type: 'spot';
  key: string;
  /** The sentence as shown, split into words (punctuation stays attached). */
  words: string[];
  /** Index of the misspelled word. */
  wrong: number;
  /** The right spelling of that word. */
  fix: string;
  /** The right sentence (shown and spoken after the answer). */
  say: string;
}

/** A rule = a station of the exam engine. */
interface DCRule {
  id: string;
  title: string;
  icon: string;
  hue: string;
  /** The rule in short (Spanish on the es site, Ukrainian on the uk site), shown after every answer. */
  tip: string;
}

/** Per-word results in KF.gameData(DCContent.store).w[key]. Numbers only (sync adds both devices' deltas). */
interface DCStat {
  ok: number;
  miss: number;
  /** Right answers in a row (0 after a miss). */
  run: number;
}

interface DCContent extends ExamUnit {
  /** gameData record of the word results (not the engine's own record, which the engine rewrites as a whole). */
  store: string;
  rules: DCRule[];
  /** Words that sound like another word (hola/ola, vaca/baca…): never dictated alone, only in a sentence. */
  homophones: string[];
}

declare var DC_CONTENT: DCContent;
declare var DC_TYPES: ExamRenderers;
declare var DCArt: ExamArt;

interface Window {
  DC_CONTENT: DCContent;
  DC_TYPES: ExamRenderers;
  DCArt: ExamArt;
}
