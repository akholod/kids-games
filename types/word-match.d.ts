// Types of games/word-match («Команда слів» / «Equipo de palabras»): content.js, types.js, art.js. Ambient: no import/export.

type WMNative = 'uk' | 'es';

/** One English word with its Spain-Spanish and Ukrainian translation. */
interface WMWord {
  /** Unique in the unit: `${theme}.${slug}` — also the task key. */
  key: string;
  en: string;
  es: string;
  uk: string;
  /** Picture: an emoji … */
  pic?: string;
  /** … or a colour swatch (CSS colour), for the colours theme. */
  color?: string;
}

interface WMTheme {
  id: string;
  icon: string;
  /** English title (the station title). */
  en: string;
  uk: string;
  es: string;
  hue: string;
  words: WMWord[];
}

/** Hear (or, without a voice, read) the English word, pick its picture. `options` include `word`. */
interface WMListenTask extends ExamTaskBase {
  type: 'listen';
  key: string;
  word: WMWord;
  options: WMWord[];
}

/** Build the English word from letter tiles; `native` = the language of the clue. */
interface WMSpellTask extends ExamTaskBase {
  type: 'spell';
  key: string;
  word: WMWord;
  native: WMNative;
}

/** Per-word results in KF.gameData(WMContent.store).w[key]. Numbers only (sync adds both devices' deltas). */
interface WMStat {
  ok: number;
  miss: number;
  /** Right answers in a row (0 after a miss). */
  run: number;
  /** > 0 once the word is in the squad (2 right in a row); it never leaves. */
  team: number;
}

interface WMContent extends ExamUnit {
  /** gameData record of the word results (not the engine's own record, which the engine rewrites as a whole). */
  store: string;
  themes: WMTheme[];
  /** Translation languages of this site: uk site ['uk', 'es'], es site ['es']. */
  natives: WMNative[];
  /** key → word (pictures for choice tasks: task.art = word key). */
  words: Record<string, WMWord>;
}

declare var WM_CONTENT: WMContent;
declare var WM_TYPES: ExamRenderers;
declare var WMArt: ExamArt;

interface Window {
  WM_CONTENT: WMContent;
  WM_TYPES: ExamRenderers;
  WMArt: ExamArt;
}
