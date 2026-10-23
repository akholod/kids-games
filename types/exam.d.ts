// Types of shared/exam (window.KFExam) and of exam units (games/<slug>/content.js). Ambient: no import/export.

// ---- tasks ----

interface ExamTaskBase {
  type: string;
  q: string;
  /** Illustration key for ExamMountOptions.art.art(key). */
  art?: string;
  /** One short sentence shown after the answer. */
  fact?: string;
  /** Id of the learning item the task trains (e.g. a word): one draw avoids tasks with the same key while others exist. */
  key?: string;
  /** A short text the engine shows between the question and the work area, for every task type (built-in or the unit's own):
   *  `\n` starts a new paragraph, `[x]` highlights x (a word, or a single `.` to point at a full stop). Brackets balanced,
   *  not nested; Spanish only (no Cyrillic). Keep it to a sentence or two: it takes room from the work area. */
  passage?: string;
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

/** Put the name chips on the hotspots of a drawn scene; the scene comes from ExamArt.scene(scene). Ids and texts unique, ≥ 2 labels. */
interface ExamLabelTask extends ExamTaskBase {
  type: 'label';
  scene: string;
  labels: { id: string; text: string }[];
}

/** Write one word into a sentence with letter tiles. `text` has exactly one `___`; `answer` is one lowercase Spanish word
 *  (/^[a-záéíóúüñ]{2,11}$/); `extra` = trap letters (1–4; default: a vowel and a consonant picked by the renderer). */
interface ExamFillTask extends ExamTaskBase {
  type: 'fill';
  text: string;
  answer: string;
  extra?: string;
}

/** Tap the asked words of a sentence (e.g. «Toca los nombres»). `text` is one or two sentences; every `[word]` is a right
 *  word (one word per bracket, ≥ 1), the other words are traps; punctuation is never tappable. One retry after a wrong
 *  first check (right picks lock, wrong ones go back), the second wrong check shows the answer and resolves false. */
interface ExamPickTask extends ExamTaskBase {
  type: 'pick';
  text: string;
}

/** A task of a type only the unit knows (its renderer comes from ExamMountOptions.types). */
interface ExamUnitTask extends ExamTaskBase {
  [key: string]: any;
}

type ExamTask =
  | ExamChoiceTask
  | ExamTfTask
  | ExamSortTask
  | ExamOrderTask
  | ExamPairsTask
  | ExamLabelTask
  | ExamFillTask
  | ExamPickTask
  | ExamUnitTask;

/** A task of a running session: tagged with its station. */
type ExamSessionTask = ExamTask & { station: string };

// ---- unit ----

interface ExamStation {
  id: string;
  title: string;
  icon: string;
  /** Short explanation shown in the station dialog and on the tile. */
  intro: string;
  /** Glossary [Spanish term, Ukrainian translation]. Shown only on the Ukrainian site (KF.lang === 'uk'): in the intro dialog and
   *  behind a «📖 Словничок» button during a station round (not in the exam). Not in the DOM at all on the Spanish site. */
  vocab?: [string, string][];
  /** The station's reading (e.g. a legend): a screen after the intro dialog's «Empezar» (before the first task of a station
   *  round; «Otra vez» skips it), and a «📜 Texto» button in the play head whenever the current task belongs to this station
   *  (rounds and the exam). «🔊 Escuchar» reads the paragraphs one by one with KFG.say(p, 'es') when a clip or voice exists
   *  (include shared/audio.js before kf-game.js). Spanish only (no Cyrillic). */
  text?: ExamText;
  tasks: ExamTask[];
}

interface ExamText {
  title: string;
  paragraphs: string[];
  /** Word notes shown beside the text: [word, meaning]. */
  notes?: [string, string][];
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

/** A drawing to label (ExamArt.scene): `box` = its size in viewBox units, `spots` = hotspots (x/y = slot centre, w = slot width, same units). */
interface ExamScene {
  el: Element;
  box: [number, number];
  spots: { id: string; x: number; y: number; w: number }[];
  /** Extra CSS class on the scene box (unit CSS can size it). */
  cls?: string;
}

/** What a drawn-scene unit exposes to the engine. Only art(key), hero() and scene(name) are used by the engine itself. */
interface ExamArt {
  art(key: string): Element | null;
  hero?(): Element | null;
  /** Scenes for `label` tasks; null = unknown scene (the task falls back to a plain choice). */
  scene?(name: string): ExamScene | null;
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

// ---- builder: a word built from tiles (or keys) into slots, shared by the spelling-like task types ----

interface ExamBuilderOptions {
  /** The right units, slot by slot (letters, syllables, …). */
  target: string[];
  /** A pool of tiles, each usable once (a letter / syllable set with traps). Omit for reusable keys: the caller draws its own
   *  keys (e.g. an on-screen keyboard) and calls `put(unit)`; `tilesEl` is then an empty container for them. */
  tiles?: string[];
  /** Are two units the same for the check (and for typing a tile)? Default: ===. */
  same?: (a: string, b: string) => boolean;
  /** Text of a unit in a slot. Default: the unit itself. */
  show?: (unit: string) => string;
  /** The right answer for ctx.resolve after the last miss. Default: the units joined. */
  answer?: string;
  /** Key → unit to put (typed letter), or index of a tile of the pool, or null = not ours. Enter, Backspace and Delete are the builder's own. */
  keyUnit?: (e: KeyboardEvent) => string | number | null;
  /** Shake the slots when a tile is tapped / picked by its index while all slots are full (typing always shakes). */
  shakeFull?: boolean;
  /** CSS classes of the parts (erase and check get `btn btn-light` / `btn btn-dark` in front). */
  classes: { slot: string; tile: string; slots: string; tiles: string; erase: string; check: string };
  /** Attribute that holds the unit on a tile. Default: data-unit. */
  tileAttr?: string;
  /** Content of a tile (`t` = its index in the pool). Default: the unit as text. */
  tileContent?: (unit: string, t: number) => KFGKid;
  /** `lang` of the slots / tiles containers. */
  slotsLang?: string;
  tilesLang?: string;
  /** Keys of the task's strings: fill (check before all slots are full), green (a retry with some right), again (a retry with none), erase (button). */
  strings: { fill: string; green: string; again: string; erase: string };
  /** The task is done (ok = right, also after a retry); slots and tiles are already drawn. */
  onDone?: (ok: boolean) => void;
}

interface ExamBuilder {
  slotsEl: HTMLDivElement;
  /** The tiles; empty in the reusable-keys mode (put your own keys here). */
  tilesEl: HTMLDivElement;
  slotEls: HTMLButtonElement[];
  tileEls: HTMLButtonElement[];
  eraseBtn: HTMLButtonElement;
  checkBtn: HTMLButtonElement;
  /** Lay it out after slotsEl. */
  hint: HTMLParagraphElement;
  /** Puts a unit in the next free slot (pool mode: takes the first free tile equal to it); shakes when it can't. */
  put(unit: string): void;
  /** Puts the tile of the pool with this index in the next free slot. */
  putTile(t: number): void;
  /** Back one unit: the last that is not locked. */
  erase(): void;
  /** Checks (not before all slots are full); one more try after the first miss. */
  check(): void;
  /** The units now in the slots (null = empty). */
  values(): (string | null)[];
  /** Sets the task's keys: Enter = check, Backspace / Delete = erase, then `extra`, then keyUnit. */
  setKeys(extra?: (e: KeyboardEvent) => unknown): void;
}

type ExamBuilderFactory = (ctx: ExamRendererCtx, opts: ExamBuilderOptions) => ExamBuilder;

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
  /** How likely a task is drawn into a round / the exam (≥ 0, 0 = only as a last resort). Default: all equal. */
  weight?: (task: ExamTask) => number;
  /** Called once per resolved task, right after the engine's own KF.answer. Errors in it are caught and warned. */
  onAnswer?: (task: ExamSessionTask, correct: boolean) => void;
}

interface KFExamAPI {
  /** Renders the hub, the rounds, the exam and the dialogs of the unit into the root and wires the keyboard. */
  mount(unit: ExamUnit | undefined, opts?: ExamMountOptions): void;
  /** Checks a unit for what tsc can't: answers in range, sort bins, pairs, order items, exam stations, unique ids, renderers. */
  validate(unit: ExamUnit, types?: ExamRenderers): string[];
  /** The generic renderers (choice, tf, sort, order, pairs, label, fill, pick), set by shared/exam/types.js. */
  types: ExamRenderers;
  /** The word builder (tiles / keys → slots, check, one retry), set by shared/exam/types.js. */
  builder?: ExamBuilderFactory;
}

declare var KFExam: KFExamAPI;

interface Window {
  KFExam: KFExamAPI;
}
