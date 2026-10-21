// Player shirt avatars (shared/kit.js → globalThis.KFKit).

type KFKitColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'navy'
  | 'purple'
  | 'pink'
  | 'white'
  | 'black';

type KFKitPattern = 'plain' | 'stripes' | 'hoops' | 'halves' | 'sash';
type KFKitSpecialId = 'checker' | 'fire' | 'retro' | 'keeper' | 'lightning' | 'abc' | 'math' | 'world' | 'galaxy' | 'champion';

interface KFKitSpecial {
  id: KFKitSpecialId;
  /** Achievement id that unlocks it. */
  need: string;
}

interface KFKit {
  pattern: KFKitPattern | KFKitSpecialId;
  c1: KFKitColor;
  c2: KFKitColor;
  /** A number '1'–'99' or a picture from MARKS. */
  mark: string;
}

/** The data/parsing part (also used by the Worker). */
interface KFKitData {
  COLORS: Record<KFKitColor, string>;
  LEGACY: KFKitColor[];
  PATTERNS: KFKitPattern[];
  SPECIALS: KFKitSpecial[];
  MARKS: string[];
  valid(avatar: unknown): boolean;
  parse(avatar: unknown, user?: { id?: number | string; name?: string }): KFKit;
  format(kit: KFKit): string;
  need(pattern: string): string | null;
  unlocked(pattern: string, achievements?: Record<string, unknown>): boolean;
  legacyColor(user?: { id?: number | string; name?: string }): KFKitColor;
}

interface KFKitSvgOpts {
  /** width = height in px; omitted = sized by CSS (`.kf-kit`). */
  size?: number;
  /** Animated special art (flames flicker, stars twinkle…): only the profile's big shirts; CSS in kf.css, off with reduced motion. */
  animate?: boolean;
  /** Accessible name (role=img + <title>); omitted = aria-hidden. */
  title?: string;
  className?: string;
}

/** Drawing context of one shirt (shared/kit.js renderer). */
interface KFKitCtx {
  /** Unique id prefix for this <svg>'s defs. */
  id: string;
  defs: SVGElement;
  /** The player's colours as hex. */
  c1: string;
  c2: string;
  /** Clipped to the shirt: base colour first, the art goes on top. */
  art: SVGElement;
  /** Above collar and shading, not clipped (e.g. a lace-up collar). */
  top: SVGElement;
  /** Set by draw() to override the art's static trim / ink / edge (e.g. a gradient url or a colour picked from c1). */
  trim?: string;
  ink?: string;
  edge?: string;
}

/** One special shirt's look (`KFKit.ART[id]`). */
interface KFKitArt {
  /** Which of the player's colours it shows. */
  uses: { c1: boolean; c2: boolean };
  /** 'long' = long padded sleeves. Default 'short'. */
  shape?: 'short' | 'long';
  /** Colour behind the mark (picks its ink); default c1. */
  bg?: string;
  /** Collar + cuffs; default c2 (or a contrast of c1). */
  trim?: string;
  /** Mark colour override. */
  ink?: string;
  /** Mark outline override. */
  edge?: string;
  /** false = the art draws its own collar. */
  collar?: boolean;
  draw(ctx: KFKitCtx): void;
}

interface KFKitAPI extends KFKitData {
  /** The shirt as an <svg> (DOM needed; pages only). */
  svg(kit: KFKit, opts?: KFKitSvgOpts): SVGSVGElement;
  /** Which of the player's colours a pattern shows. */
  uses(pattern: string): { c1: boolean; c2: boolean };
  /** Special shirts' drawings by id (ids without one render as a plain shirt with a gold star). */
  ART: Record<string, KFKitArt>;
  [k: string]: any;
}

declare var KFKit: KFKitAPI;
