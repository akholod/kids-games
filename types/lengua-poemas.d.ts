// Types of games/lengua-poemas («La liga de las palabras»: Lengua Castellana 3.º, Tema 3 — an exam unit with three own task types
// and «fix» reused from lengua-mundo).

/** The shirt press: tap a stem (keys A–C) and a suffix (keys 1–4), Comprobar (Enter); ⌫ takes the last piece back. One retry: the
 *  right piece stays green, the wrong one is crossed out; the second miss shows the word. Spelling changes are authored as stems
 *  (['pan', 'panad'] + 'ero' → only 'panad' + 'ero' = 'panadero'); exactly one pair makes `word`. */
interface LPForgeTask extends ExamTaskBase {
  type: 'forge';
  /** 2–3 unique. */
  stems: string[];
  /** 2–4 unique, without the hyphen ('ero', 'ista', 'ería'). */
  suffixes: string[];
  answer: [stem: string, suffix: string];
  /** = answer[0] + answer[1]. */
  word: string;
}

/** Rule ids of the save task (labels in types.js, window.LP_RULES). */
type LPRule = 'aba' | 'bir' | 'exc' | 'brbl' | 'memo';

/** B or V: fill the gaps of `word` with b / v (tap a gap, then B or V; keys B / V, ← →, ⌫) and pick the reason (keys 1–3);
 *  Comprobar (Enter). Right = every gap right and reason === rule: the keeper saves; one retry («¡Al palo!»: right parts lock
 *  green), the second miss is a goal and shows the word. */
interface LPSaveTask extends ExamTaskBase {
  type: 'save';
  /** One lowercase word: 'jugaba'. */
  word: string;
  /** Indices in `word`; each char there is 'b' or 'v'. */
  gaps: number[];
  /** The sentence around the word: ['Ayer', 'al fútbol.']. */
  ctx?: [before: string, after: string];
  /** 2–3 unique rule ids. */
  reasons: LPRule[];
  /** One of reasons. */
  rule: LPRule;
}

/** The substitution: tap the phrase that goes off (keys ← → / Space) and the pronoun that comes on (keys 1–4); Comprobar (Enter).
 *  Right = chunk === target and pronoun === answer; then the sentence shows `result` (the pronoun marked). One retry. */
interface LPSubstituteTask extends ExamTaskBase {
  type: 'substitute';
  /** The sentence in pieces. */
  chunks: string[];
  /** Index of the phrase the pronoun replaces. */
  target: number;
  /** 3–4 unique pronouns. */
  options: string[];
  /** One of options. */
  answer: string;
  /** The whole sentence after the change (contains `answer`): 'Ellas juegan en el patio.' */
  result: string;
}

declare var LP_CONTENT: ExamUnit;
declare var LP_TYPES: ExamRenderers;
declare var LP_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
declare var LP_RULES: Record<LPRule, string>;
declare var LPArt: ExamArt;

interface Window {
  LP_CONTENT: ExamUnit;
  LP_TYPES: ExamRenderers;
  LP_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
  LP_RULES: Record<LPRule, string>;
  LPArt: ExamArt;
  __lp: any;
}
