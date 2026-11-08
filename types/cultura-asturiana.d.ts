// Types of games/cultura-asturiana («Cultura asturiana · 1.er trimestre» — an exam unit with six own task types).

/** Give the right things to a drawn target: tap an item (or drag it on a mouse / pen, keys 1–9). An ok item goes in with a happy
 *  reaction, a wrong one is refused and stays out (disabled). Done when every ok item is in: 0 wrong = right, 1 = right (soft),
 *  2+ = not right (the answer lists the ok items). 4–9 items, ok and not-ok ones, unique texts. */
interface CAFeedTask extends ExamTaskBase {
  type: 'feed';
  /** The target drawing: art key `t-<who>`. */
  who: 'gochu' | 'vaca' | 'cesta' | 'fardo' | 'bolsa' | 'tripa';
  items: { text: string; art?: string; ok: boolean }[];
}

/** A recipe step by step: tap the shuffled cards (steps + distractors) in order; each right one builds up the dish. 0 wrong = right,
 *  1 = right (soft), 2+ = not right; the second miss on one step puts it in (amber); after a mistake the cards line up in order. */
interface CACookTask extends ExamTaskBase {
  type: 'cook';
  /** The drawing (ExamArt.dish): only 'cachopo' for now. */
  dish: 'cachopo';
  /** In order. The art key of a step decides what it draws: filete (1st = bottom, 2nd = top), jamon (+ queso when no step has
   *  queso), queso, harina, huevo, pan-rallado, sarten (into the pan, golden at the end); any other / none = a little sparkle. */
  steps: { text: string; art?: string }[];
  /** Cards that do not belong to the recipe. steps + extra ≤ 9. */
  extra?: { text: string; art?: string }[];
}

/** Sopa de letras: ≤ 8 rows of ≤ 10 UPPERCASE letters (Ñ allowed); every word runs left → right or top → bottom. Select by tapping
 *  the first and the last letter, or by dragging; keys: arrows + Enter / Space. All found with ≤ 2 wrong selections = right
 *  (1–2 = soft), more = not right; after 3 wrong ones the first letter of a missing word glows. */
interface CAWordsearchTask extends ExamTaskBase {
  type: 'wordsearch';
  rows: string[];
  words: string[];
}

/** «¿Quién soy?»: clues come one at a time («Otra pista», key P), the player answers at any time (one answer, like a choice).
 *  With `pics` the options are art keys drawn as pictures and `labels` their names; `art` (optional) is a picture hidden behind
 *  the «?» and revealed after the answer (so it must not be a picture option on its own). */
interface CACluesTask extends ExamTaskBase {
  type: 'clues';
  /** 2–4. */
  clues: string[];
  /** 2–4. */
  options: string[];
  answer: number;
  pics?: boolean;
  labels?: string[];
}

type CAMonth =
  | 'enero'
  | 'febrero'
  | 'marzo'
  | 'abril'
  | 'mayo'
  | 'junio'
  | 'julio'
  | 'agosto'
  | 'septiembre'
  | 'octubre'
  | 'noviembre'
  | 'diciembre';

/** Put things into months (calendar pages): tap an item, then its month (or drag); keys A–J item, 1–6 month. Like sort: ≤ 1 wrong
 *  = right (1 = soft), the second miss on one item puts it in its month (amber). 2–10 items, 2–6 months. */
interface CACalendarTask extends ExamTaskBase {
  type: 'calendar';
  /** The pages, in this order. */
  months: CAMonth[];
  /** Asturian names shown under the Spanish ones: { julio: 'Xunetu' }. */
  astur?: Partial<Record<CAMonth, string>>;
  items: { text: string; art?: string; month: CAMonth }[];
}

/** A hopscotch run of 3–5 true / false statements: right = the stone hops to the next square; wrong = «¡Pisaste la raya!», the right
 *  answer shows, «Seguir» goes on. Right only when every step is right. */
interface CACascayuTask extends ExamTaskBase {
  type: 'cascayu';
  steps: { text: string; truth: boolean }[];
}

/** The hopscotch board of CAArt.board(n): viewBox coordinates of the square centres (1…n), the goal and the start. */
interface CABoard {
  el: SVGSVGElement;
  centers: { x: number; y: number }[];
  goal: { x: number; y: number };
  start: { x: number; y: number };
  size: [number, number];
}

declare var CA_CONTENT: ExamUnit;
declare var CA_TYPES: ExamRenderers;
declare var CA_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
declare var CAArt: ExamArt;

interface Window {
  CA_CONTENT: ExamUnit;
  CA_TYPES: ExamRenderers;
  CA_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
  CAArt: ExamArt;
  __ca: any;
}
