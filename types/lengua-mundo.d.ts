// Types of games/lengua-mundo («Lenguas por el mundo»: Lengua Castellana 3.º, Unidad 1 — an exam unit).

/** «Corrige el texto»: `text` is the correct text; the task shows it in lowercase without full stops. Tap a word = toggle
 *  its capital, tap a gap = toggle a full stop. Only «.» and capitals are trained (other punctuation stays as written). */
interface LEFixTask extends ExamTaskBase {
  type: 'fix';
  text: string;
}

interface LEChatTurn {
  /** What the caller says. */
  them: string;
  /** Replies to choose from (2–3; the UI shuffles). */
  options: string[];
  answer: number;
  /** Why the right reply is right — shown after a wrong pick. */
  why?: string;
}

/** A phone call: the caller speaks, the player picks a reply, turn by turn. */
interface LEChatTask extends ExamTaskBase {
  type: 'chat';
  /** Caller's name on the phone screen. */
  who: string;
  /** Caller's avatar (an emoji). */
  icon: string;
  turns: LEChatTurn[];
}

/** Hear a sentence (a pre-recorded clip of `say`) and tell the intonation at its end. */
interface LEToneTask extends ExamTaskBase {
  type: 'tone';
  say: string;
  /** true = ascendente (the voice goes up), false = descendente. */
  rising: boolean;
}

declare var LE_CONTENT: ExamUnit;
declare var LE_TYPES: ExamRenderers;
declare var LEArt: ExamArt;

interface Window {
  LE_CONTENT: ExamUnit;
  LE_TYPES: ExamRenderers;
  LEArt: ExamArt;
  __le: any;
}
