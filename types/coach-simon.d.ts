// Types of games/coach-simon/engine.js (globalThis.SimonEngine). Ambient: no import/export.

type SimonLevelId = 'rookie' | 'academy' | 'pro';
type SimonLang = 'es' | 'en' | 'mix';
type SimonVerdict = 'save' | 'goal' | 'held' | 'fooled';

/** A goal zone's name in each language. */
interface SimonZone {
  es: string;
  en: string;
  uk: string;
}

interface SimonLevel {
  memory: { zones: number[]; start: number; onMs: number; gapMs: number };
  commands: { zones: number[]; ballMs: number; tricks: number };
  /** KF.answer coin per right answer. */
  coin: number;
  /** Perfect-round bonus, paid until the level is done perfectly once. */
  bonus: number;
}

interface SimonCommand {
  zone: number;
  lang: 'es' | 'en';
  /** No "Simon says": the keeper must not move. */
  trick: boolean;
  /** 'Simón dice' / 'Simon says' on levels with tricks (real commands only), else ''. */
  prefix: string;
  /** The zone's name in `lang`, e.g. 'Arriba a la izquierda'. */
  words: string;
}

interface SimonEngineAPI {
  ZONES: SimonZone[];
  LEVELS: Record<SimonLevelId, SimonLevel>;
  LANGS: SimonLang[];
  /** Both modes are out of ROUND (memory: longest sequence; commands: saves). */
  ROUND: number;
  /** The real-command prefix per language: 'Simón dice' / 'Simon says'. */
  SAYS: { es: string; en: string };
  extend(seq: readonly number[], level: SimonLevelId, rand?: () => number): number[];
  firstSequence(level: SimonLevelId, rand?: () => number): number[];
  check(seq: readonly number[], pos: number, zone: number): 'next' | 'done' | 'miss';
  memoryTiming(level: SimonLevelId, len: number): { on: number; gap: number };
  makeCommands(level: SimonLevelId, lang: SimonLang, rand?: () => number): SimonCommand[];
  spoken(cmd: SimonCommand): string;
  /** zone = tapped zone, null = did not move before the ball came. */
  judge(cmd: SimonCommand, zone: number | null): SimonVerdict;
  isRight(v: SimonVerdict): boolean;
  /** Zone of a key (top-row 1–9 reading order, numpad spatial), -1 = none. */
  keyZone(key: string, code?: string): number;
}

declare const SimonEngine: SimonEngineAPI;
