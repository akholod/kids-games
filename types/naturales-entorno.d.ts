// Types of games/naturales-entorno («Conozco mi entorno»: Ciencias de la Naturaleza 3.º, Unidad 1 — an exam unit).

/** Build the water filter of «Ciencia en acción»: put the layers in the bottle, from its mouth (bottom) up. */
interface CNFilterTask extends ExamTaskBase {
  type: 'filter';
  /** Bottom (the bottle's mouth, with the cotton plug) → top. */
  layers: string[];
}

declare var CN_CONTENT: ExamUnit;
declare var CN_TYPES: ExamRenderers;
declare var CNArt: ExamArt;

interface Window {
  CN_CONTENT: ExamUnit;
  CN_TYPES: ExamRenderers;
  CNArt: ExamArt;
  __cn: any;
}
