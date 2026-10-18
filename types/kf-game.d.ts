// Types of shared/kf-game.js (window.KFG). Ambient: no import/export.

type KFGKid = Node | string | number | false | null | undefined | KFGKid[];
type KFGFeedbackItem = Node | false | null | undefined | { focus?: boolean; scroll?: boolean | 'animated' };

interface KFGDotsOptions {
  /** Number of dots (default results.length; results may be shorter than the task list). */
  total?: number;
  /** Class of every dot (default 'dot'). */
  base?: string;
  /** Class names of the states (defaults 'ok' / 'miss' / 'now'). */
  cls?: { ok?: string; miss?: string; now?: string };
  /** Maps a result value to a state; default true → 'ok', false → 'miss', anything else = not answered. */
  kind?: (result: any) => 'ok' | 'miss' | undefined;
  /** Extra attributes per dot (title, aria-label). */
  attrs?: (index: number, result: any) => Record<string, any>;
}

interface KFGKeysOptions {
  /** Current input controller, or null when none. */
  ctrl?: () => { onKey: (e: KeyboardEvent) => unknown } | null | undefined;
  /** Gates ctrl only (default always active). */
  active?: () => boolean;
  /** Escape; return true to preventDefault. */
  onEscape?: (e: KeyboardEvent) => unknown;
  /** Game-wide keys before the button guard and ctrl; return true to preventDefault. */
  onKey?: (e: KeyboardEvent) => unknown;
  /** Modifiers that make a key skipped (default all three). */
  ignoreMods?: ('alt' | 'ctrl' | 'meta')[];
  /** Enter/Space on such a focused element keeps its native click (default 'button,[role=button],a'); false = off. */
  nativeButtons?: string | false;
}

interface KFGAPI {
  $(id: string): HTMLElement | null;
  h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Record<string, any>, ...kids: KFGKid[]): HTMLElementTagNameMap[K];
  shuffle<T>(arr: readonly T[]): T[];
  pick<T>(arr: readonly T[]): T;
  reduced(): boolean;
  restart(el: Element, cls: string): void;
  shake(...els: (Element | null | undefined)[]): void;
  screens(
    ids: string[],
    opts?: { scroll?: 'auto' | 'smooth' | false; idOf?: (name: string) => string; onShow?: (name: string) => void },
  ): (id: string) => void;
  dots(container: Element, results: ReadonlyArray<any>, index: number, opts?: KFGDotsOptions): void;
  feedback(container: Element, content: Node, ...buttons: KFGFeedbackItem[]): void;
  keys(opts: KFGKeysOptions): () => void;
  confirm(dialog: HTMLDialogElement, opts?: { onYes?: () => void; onNo?: () => void; focus?: 'yes' | 'no' | 'none' }): void;
  /** Speaks `text` with a local voice of `lang` ('es' | 'en' | 'uk' | BCP-47 prefix); false (silent) without such a voice. */
  say(text: string, lang: string, opts?: { rate?: number }): boolean;
  /** A voice for `lang` is available (the list loads asynchronously after page load). */
  canSay(lang: string): boolean;
  /** Stops speaking. */
  hush(): void;
}

declare const KFG: KFGAPI;

interface Window {
  KFG: KFGAPI;
}
