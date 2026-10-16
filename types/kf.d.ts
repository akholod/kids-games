// Ambient types for the cross-file globals (classic scripts, no modules). Source of truth: shared/kf.js.
// Keep this file free of top-level import/export: it must stay a global declaration file.

type KFLang = 'uk' | 'es';

// ---- i18n ----

type KFDictValue = string | ((vars: Record<string, any>) => string);
type KFDict = Record<string, KFDictValue>;

/** T('key', { n }) — missing keys fall back to uk, then to the key itself. */
interface KFT {
  (key: string, vars?: Record<string, any>): string;
  has(key: string): boolean;
  /** Fills [data-i18n] text and [data-i18n-placeholder|-aria-label|-title] attributes. */
  apply(root?: ParentNode): void;
}

// ---- state ----

interface KFStats {
  correct: number;
  wrong: number;
  games: number;
  perfect: number;
  streak: number;
  bestStreak: number;
  packs: number;
  dayStreak: number;
  /** YYYY-MM-DD of the last played day. */
  lastDay: string;
}

interface KFGameRecord {
  plays: number;
  best: number;
  max: number;
  lastPlayed: number;
}

interface KFState {
  v: number;
  coins: number;
  /** card id -> count */
  cards: Record<string, number>;
  /** achievement id -> timestamp */
  achievements: Record<string, number>;
  /** slug -> result summary */
  games: Record<string, KFGameRecord>;
  /** slug -> game-specific saved data (see KF.gameData) */
  gameData: Record<string, any>;
  /** day -> slug -> coin units a game gave that day before the cap (only today is kept) */
  earned: Record<string, Record<string, number>>;
  stats: KFStats;
}

// ---- registry ----

type KFCategoryId = 'math' | 'english' | 'fun' | 'sociales';
type KFGameStatus = 'ready' | 'beta' | 'soon';

interface KFGame {
  slug: string;
  /** Ukrainian title (the Spanish one is in `es`; siteGames() resolves both). */
  title: string;
  emoji: string;
  category: KFCategoryId;
  desc: string;
  status: KFGameStatus;
  sites: KFLang[];
  es: { title: string; desc: string };
}

interface KFCategory {
  title: string;
  emoji: string;
}

type KFCardCat = 'common' | 'futsal' | 'rare' | 'legend';

/** Entry of window.KF_CARDS (shared/cards.js). */
interface KFCard {
  id: string;
  name: string;
  cat: KFCardCat;
  /** Ukrainian player. */
  ua?: boolean;
}

/** A card as returned by openPack()/giveCard(). */
interface KFCardGot extends KFCard {
  isNew: boolean;
}

interface KFCardCatInfo {
  label: string;
  /** chance (%) that a pack card is from this category */
  weight: number;
  /** coins for selling one duplicate */
  sell: number;
}

interface KFAchievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (s: KFState) => boolean;
}

// ---- auth ----

interface KFUser {
  id: number;
  name: string;
  avatar?: string;
  [k: string]: any;
}

type KFAuthStatus = 'guest' | 'pending' | 'synced' | 'offline' | 'expired';

interface KFAuthResult {
  ok: boolean;
  user?: KFUser;
  hasGuestProgress?: boolean;
  error?: string;
  attemptsLeft?: number;
  retryAfter?: number;
}

interface KFAuth {
  readonly user: KFUser | null;
  readonly status: KFAuthStatus;
  users(): Promise<{ ok: boolean; users?: KFUser[]; error?: string }>;
  login(userId: number, pin: string): Promise<KFAuthResult>;
  register(name: string, pin: string, avatar?: string): Promise<KFAuthResult>;
  hasGuestProgress(): boolean;
  adoptGuest(): boolean;
  logout(opts?: { force?: boolean }): Promise<{ ok: boolean; lost?: boolean }>;
}

// ---- events ----

interface KFEvents {
  change: KFState;
  /** coins delta (can be negative) */
  coins: number;
  achievement: KFAchievement;
  card: KFCardGot;
  pack: KFCardGot[];
  /** slug of the game that reached its daily cap */
  'earn-cap': string;
  auth: { user: KFUser | null; status: KFAuthStatus };
}

// ---- KF ----

interface KFAPI {
  lang: KFLang;
  i18n(dicts: { uk: KFDict } & Partial<Record<KFLang, KFDict>>): KFT;
  GAMES: KFGame[];
  CATEGORIES: Record<KFCategoryId, KFCategory>;
  CARDS: KFCard[];
  CARD_CATS: Record<KFCardCat, KFCardCatInfo>;
  ACHIEVEMENTS: KFAchievement[];
  PACK_PRICE: number;
  PACK_SIZE: number;
  TEST_MODE: boolean;
  AVATARS: string[];
  auth: KFAuth;
  /** Three-way state merge (exposed for unit tests). */
  _merge3(base: any, local: any, server: any): KFState;

  /** The live state object (mutated in place). */
  get(): KFState;
  isPlayable(game: Pick<KFGame, 'status'>): boolean;
  isListed(game: Pick<KFGame, 'status'>): boolean;
  /** Listed games of the current site, title/desc in the site language. */
  siteGames(): KFGame[];
  on<K extends keyof KFEvents>(type: K, fn: (payload: KFEvents[K]) => void): () => void;

  /** Correct answer = +1 coin; coin: 0.5 pays every 2nd, false/0 nothing. */
  answer(slug: string, correct: boolean, opts?: { coin?: number | boolean }): void;
  /** End of round. `bonus` is the perfect-round reward (default 5); the returned `bonus` is what was really paid. */
  finishGame(slug: string, opts?: { score?: number; max?: number; bonus?: number }): { perfect: boolean; bonus: number; coins: number };
  /** Coins by a game's own rule (counted in the daily budget). Returns coins paid. */
  earn(slug: string, n: number): number;
  addCoins(n: number): void;
  /** Returns false (and changes nothing) if not enough coins. */
  spendCoins(n: number): boolean;
  /** Returns null for an unknown id. Emits 'card'. */
  giveCard(id: string): KFCardGot | null;
  cardImg(id: string, thumb?: boolean): string;

  /** Game-specific persistent data (plain JSON). Read returns {} when nothing is saved. */
  gameData<T = any>(slug: string): T;
  gameData<T = any>(slug: string, value: T): T;

  canBuyPack(): boolean;
  /** PACK_SIZE cards, or null if not enough coins / no cards. Emits one 'pack' event. */
  openPack(): KFCardGot[] | null;
  duplicates(): number;
  /** Sells ONE extra copy; returns coins gained (0 if no duplicate). */
  sellDuplicate(id: string): number;
  sellAllDuplicates(): number;
  exportCode(): string;
  importCode(code: string): boolean;
  reset(): void;
}

// ---- kf-ui.js ----

interface KFUIAPI {
  toast(message: string, kind?: string): void;
  confetti(): void;
  updateCoins(): void;
  updateSync(): void;
  SYNC: Record<string, { short: string; long: string }>;
}

// ---- math-exam engine (games/math-exam/ENGINE-API.md) ----

type MathExamPlaceKey = 'UM' | 'C' | 'D' | 'U';
type MathExamTopic = 'valor' | 'columna' | 'redondeo' | 'problemas';
type MathExamKind = 'choice' | 'number' | 'packs' | 'decompose' | 'column' | 'round' | 'problema' | 'fix';

interface MathExamError {
  code: string;
  es: string;
  /** uk only */
  ua?: string;
}

interface MathExamCheck {
  correct: boolean;
  error?: MathExamError;
}

interface MathExamTask {
  id: string;
  topic: MathExamTopic;
  level: number;
  kind: MathExamKind;
  lang: KFLang;
  es: string;
  /** uk only */
  ua?: string;
  hint?: string;
  answer: any;
  choices?: { label: string; value: any }[];
  /** kind-specific payload, see ENGINE-API.md */
  data: any;
  [k: string]: any;
}

interface MathExamAPI {
  fmt(n: number): string;
  PLACES: { key: string; es: string; ua: string; value: number }[];
  TOPICS: { key: string; es: string; ua: string }[];
  LEVELS: Record<MathExamTopic, { level: number; es: string; ua: string }[]>;
  digits(n: number): Record<MathExamPlaceKey, number>;
  roundTo(n: number, place: 'D' | 'C' | 'UM'): number;
  makeTask(topic: MathExamTopic, level?: number, rng?: () => number, lang?: KFLang): MathExamTask;
  checkAnswer(task: MathExamTask, value: any): MathExamCheck;
  checkColumnStep(task: MathExamTask, stepIndex: number, digit: any, carryOrBorrow?: any): MathExamCheck;
  checkOp(task: MathExamTask, op: string): MathExamCheck;
  makeExam(opts?: {
    count?: number;
    weights?: Partial<Record<MathExamTopic, number>>;
    rng?: () => number;
    maxLevels?: Partial<Record<MathExamTopic, number>>;
    lang?: KFLang;
  }): MathExamTask[];
  weakWeights(stats?: Record<string, { right: number; total: number }>): Record<string, number>;
  solveColumn(op: '+' | '-', a: number, b: number): any;
  numberToWords(n: number): string;
}

// ---- globals ----

declare var KF: KFAPI;
declare var KFUI: KFUIAPI;
declare var KF_SITE: { lang: KFLang };
declare var KF_CARDS: KFCard[];
declare var MathExam: MathExamAPI;
// Loosely typed for now (typed by the lanes that migrate those games).
declare var SP_CONTENT: SPContent;
declare var SP_TYPES: ExamRenderers;
declare var SPArt: ExamArt;
declare var SP_MAPS: any;
declare var QUIZ_QUESTIONS: any;

interface Window {
  KF: KFAPI;
  KFUI: KFUIAPI;
  KF_SITE: { lang: KFLang };
  KF_CARDS: KFCard[];
  MathExam: MathExamAPI;
  SP_CONTENT: SPContent;
  SP_TYPES: ExamRenderers;
  SPArt: ExamArt;
  SP_MAPS: any;
  QUIZ_QUESTIONS: any;
  // test hooks
  __sp: any;
  __mathExam: any;
  __quiz: any;
  __goalkeeper: any;
  __album: any;
}
