// Types of games/sociales-clima («La vuelta al mundo en globo»: Ciencias Sociales 3.º, Tema 2 — an exam unit with three own task types).

/** A token of the spainMap palette: a weather symbol (`id` = sol | nubes | sol-nubes | lluvia | nieve | tormenta | niebla | viento, or
 *  `icon` = its emoji; drawn as an SVG symbol) or a climate (`color` = #rrggbb, painted on the region). */
interface SCMapToken {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

/** Tokens onto Spain's regions: pick a token (keys 1–5), then tap a region (Tab / ← → move, Space / Enter puts, ⌫ takes off; a tap on a
 *  region that already holds the chosen token takes it off). Comprobar (Enter) once every asked region has one. One retry: right
 *  regions lock green, wrong ones empty with an orange ring; the second miss paints the right ones. Regions not in `answer` are grey. */
interface SCSpainMapTask extends ExamTaskBase {
  type: 'spainMap';
  mode: 'weather' | 'climate';
  /** 2–5, unique ids. */
  tokens: SCMapToken[];
  /** Region id (SP_MAPS.spain) → token id; 2–6 regions. Climate mode: only regions with a clear-cut climate (see types.js CLIMATE_OF). */
  answer: Record<string, string>;
  /** The forecast as text (weather mode): shown above the palette. */
  text?: string;
}

/** A climogram (bars = rain in mm 0–210 on the right axis, line = temperature in °C 0–35 on the left). tapMonth: tap / ← → a month,
 *  Comprobar (Enter); fillBar / fillTemp: ▲ ▼ (keys ↑ ↓, or a tap / drag on the missing column) set the missing bar / point in steps of
 *  15 mm / 5 °C. One retry, then the answer is shown. */
interface SCClimogramaTask extends ExamTaskBase {
  type: 'climograma';
  mode: 'tapMonth' | 'fillBar' | 'fillTemp';
  /** 12 values, °C, 0–35. */
  temp: number[];
  /** 12 values, mm, 0–210. */
  rain: number[];
  place?: string;
  /** tapMonth: the month index (0 = enero) — the unique max / min the q asks. */
  answer?: number;
  /** tapMonth: what q asks, when its words don't say it (más calor / frío / lluvia). */
  ask?: 'maxTemp' | 'minTemp' | 'maxRain' | 'minRain';
  /** fillBar / fillTemp: the month index to build (its value must be on the step grid). */
  missing?: number;
  /** fillBar / fillTemp: show the data table above the chart. Without it the q must give the value. */
  table?: boolean;
}

/** «Detective del paisaje»: tap every element of `find` in a drawn scene (Tab / ← → move, Enter / Space taps). Each tap marks ✓ or ✗
 *  with its name; done when all are found (≤ 1 wrong tap = right) or at the 3rd wrong tap (then the missing ones are shown). */
interface SCSpotTask extends ExamTaskBase {
  type: 'spot';
  /** SCArt.spotScene name: valle | costa | llanura. */
  scene: string;
  /** Element ids of the scene. */
  find: string[];
}

/** An element of a spot scene (SCArt.spotItems / spotScene): its hit circle in viewBox units (600 × 400). */
interface SCSpotItem {
  id: string;
  name: string;
  human: boolean;
  x: number;
  y: number;
  r: number;
}

declare var SC_CONTENT: ExamUnit;
declare var SC_TYPES: ExamRenderers;
declare var SC_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
declare var SCArt: ExamArt;

interface Window {
  SC_CONTENT: ExamUnit;
  SC_TYPES: ExamRenderers;
  SC_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
  SCArt: ExamArt;
  __sc: any;
}
