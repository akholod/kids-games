// Types of shared/exam (window.KFExam) and of exam units (games/<slug>/content.js). Ambient: no import/export.

// ---- tasks ----

interface ExamTaskBase {
  type: string;
  q: string;
  /** Illustration key for ExamMountOptions.art.art(key). */
  art?: string;
  /** One short sentence shown after the answer. */
  fact?: string;
}

/** One correct option; the UI shuffles unless `fixed`. */
interface ExamChoiceTask extends ExamTaskBase {
  type: 'choice';
  options: string[];
  answer: number;
  fixed?: boolean;
}

interface ExamTfTask extends ExamTaskBase {
  type: 'tf';
  truth: boolean;
  /** The correct sentence, shown after a false statement. */
  fix?: string;
}

interface ExamSortTask extends ExamTaskBase {
  type: 'sort';
  bins: { id: string; label: string; icon: string }[];
  items: { text: string; icon?: string; bin: string }[];
}

/** `items` in the right order (the UI shuffles). */
interface ExamOrderTask extends ExamTaskBase {
  type: 'order';
  items: string[];
}

interface ExamPairsTask extends ExamTaskBase {
  type: 'pairs';
  pairs: [string, string][];
}

/** A task of a type only the unit knows (its renderer comes from ExamMountOptions.types). */
interface ExamUnitTask extends ExamTaskBase {
  [key: string]: any;
}

type ExamTask = ExamChoiceTask | ExamTfTask | ExamSortTask | ExamOrderTask | ExamPairsTask | ExamUnitTask;

/** A task of a running session: tagged with its station. */
type ExamSessionTask = ExamTask & { station: string };

// ---- unit ----

interface ExamStation {
  id: string;
  title: string;
  icon: string;
  /** Short explanation shown in the station dialog and on the tile. */
  intro: string;
  tasks: ExamTask[];
}

interface ExamConfig {
  /** Exam title (hub card, play label); default: strings.examTitle. */
  title?: string;
  /** Default 🏆. */
  icon?: string;
  /** How many tasks to draw from each station (sum = exam length). */
  perStation: Record<string, number>;
  /** Red card after this many mistakes (default 3). */
  redAfter?: number;
}

/** Per task type: at most N of it in one round (types not listed: no limit). */
type ExamCaps = Record<string, number>;

interface ExamSampling {
  /** Station round caps (default: sort, order, pairs = 1). */
  caps?: ExamCaps;
  /** Exam caps per station draw (default: sort, order, pairs = 1). */
  examCaps?: ExamCaps;
  /** Task types taken first when a station round is sampled (default none). */
  always?: string[];
}

/** Texts: strings with {var} placeholders or functions (vars) => string. See DEFAULT_STRINGS in shared/exam/exam.js. */
type ExamStrings = Record<string, string | ((vars: Record<string, any>) => string)>;

/** Non-string text data (kept out of T, which turns non-strings into the key). */
interface ExamLists {
  /** Cheers after a right answer (one is picked at random). */
  praise: string[];
  /** Five exam grades, worst to best. */
  grades: string[];
}

interface ExamUnit {
  /** = folder name = KF.GAMES slug = KF.gameData key. */
  slug: string;
  /** UI language of the whole unit, sets <html lang> (default 'es'). */
  lang?: string;
  title: string;
  /** Top-right line next to the back link, e.g. the subject. */
  subject?: string;
  /** Hub eyebrow, e.g. «Unidad 1 · Examen de Sociales». */
  unitLabel?: string;
  /** Hub intro paragraph. */
  intro?: string;
  stations: ExamStation[];
  exam: ExamConfig;
  /** Tasks per station round (default 8). */
  round?: number;
  /** Station id → tile colour. */
  hues?: Record<string, string>;
  sampling?: ExamSampling;
  /** Overrides of the engine texts (partial). */
  strings?: ExamStrings;
  lists?: Partial<ExamLists>;
  /** Name of the window test hook in ?parent mode (default '__exam'). */
  testHook?: string;
}

// ---- renderers ----

/** What a drawn-scene unit exposes to the engine. Only art(key) and hero() are used by the engine itself. */
interface ExamArt {
  art(key: string): Element | null;
  hero?(): Element | null;
  [key: string]: any;
}

interface ExamResolveInfo {
  /** The right answer, shown after a mistake. */
  answer?: string;
  /** Extra line in the feedback. */
  note?: string | null;
  /** Right, but not at the first try: «Bien hecho» instead of a cheer. */
  soft?: boolean;
}

interface ExamDragOptions {
  onStart?: () => void;
  /** CSS selector of the drop targets. */
  targets: string;
  onDrop: (target: HTMLElement) => void;
}

interface ExamChoiceOption {
  text: string;
  ok: boolean;
}

interface ExamRendererCtx {
  h: KFGAPI['h'];
  T: KFT;
  shuffle: KFGAPI['shuffle'];
  pick: KFGAPI['pick'];
  shake: KFGAPI['shake'];
  reduced: KFGAPI['reduced'];
  /** 'ABCDEFGH' — letter keys. */
  LETTERS: string;
  art: ExamArt | undefined;
  /** The unit (extra unit-level data, like grids, lives on it). */
  content: ExamUnit;
  /** Report the answer; once per task (the engine ignores repeats). */
  resolve(correct: boolean, info?: ExamResolveInfo): void;
  /** True once the task is resolved (or no round runs). */
  answered(): boolean;
  /** Sets the keyboard handler of the task: onKey(e) → handled. */
  setKeys(onKey: (e: KeyboardEvent) => unknown): void;
  /** <p class="inline-hint" role="status">. */
  hint(): HTMLParagraphElement;
  /** <p class="kbd-hint">. */
  kbdHint(text: string): HTMLParagraphElement;
  /** Task art (if any) next to / above the given blocks; returns the kids to append. */
  withArt(task: ExamTask, ...kids: KFGKid[]): (Node | string)[];
  /** Mouse/pen drag as an extra to tap-tap. */
  draggable(el: HTMLElement, opts: ExamDragOptions): void;
  /** Plays the task as a plain multiple choice with these options (when the unit's art or data is missing). */
  fallback(task: ExamTask, work: HTMLElement, options: ExamChoiceOption[]): void;
}

/** Draws the task into `work`, sets its keys with ctx.setKeys and reports with ctx.resolve. */
/** `preset` is only for the choice renderer (ctx.fallback): ready-made options, shown in the given order. */
type ExamRenderer<T = ExamTask> = (task: T, work: HTMLElement, ctx: ExamRendererCtx, preset?: ExamChoiceOption[]) => void;

type ExamRenderers = Record<string, ExamRenderer<any>>;

// ---- session, records ----

interface ExamSession {
  mode: 'station' | 'exam';
  /** Station id (mode 'station' only). */
  station?: string;
  tasks: ExamSessionTask[];
  index: number;
  score: number;
  results: boolean[];
  /** Mistakes made in the exam. */
  cards: number;
  byStation: Record<string, { right: number; total: number }>;
  startCoins: number;
  task?: ExamSessionTask;
  answered?: boolean;
}

/** KF.gameData(slug): sync merges numbers by adding deltas, so the engine clamps them on load. */
interface ExamRecords {
  v: 1;
  /** Station id → record. */
  st: Record<string, { best: number; max: number; stars: number; plays: number }>;
  exam: { n: number; grade: string; nota: string } | null;
  /** Station id → answers over all rounds. */
  topics: Record<string, { right: number; total: number }>;
}

// ---- API ----

interface ExamMountOptions {
  /** Drawings (art(key), hero()). Present but falsy = it failed to load: the load error is shown. */
  art?: ExamArt;
  /** Renderers of the unit's own task types (and overrides of the generic ones). */
  types?: ExamRenderers;
  /** Default: #exam-root. */
  root?: HTMLElement;
}

interface KFExamAPI {
  /** Renders the hub, the rounds, the exam and the dialogs of the unit into the root and wires the keyboard. */
  mount(unit: ExamUnit | undefined, opts?: ExamMountOptions): void;
  /** Checks a unit for what tsc can't: answers in range, sort bins, pairs, order items, exam stations, unique ids, renderers. */
  validate(unit: ExamUnit, types?: ExamRenderers): string[];
  /** The generic renderers (choice, tf, sort, order, pairs), set by shared/exam/types.js. */
  types: ExamRenderers;
}

declare var KFExam: KFExamAPI;

interface Window {
  KFExam: KFExamAPI;
}
