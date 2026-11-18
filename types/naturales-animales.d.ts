// Types of games/naturales-animales («Expedición safari»: Ciencias de la Naturaleza 3.º, Unidad 2 — an exam unit with two own task types).

/** One row of a ficha: `id` = come | mueve | nace | grupo, `answer` = an option id of that row (see NAFichaRowDef / types.js ROWS):
 *  come: herbivoro, carnivoro, omnivoro · mueve: anda, salta, repta, nada, vuela · nace: viviparo, oviparo, ovoviviparo ·
 *  grupo: mamifero, ave, pez, reptil, anfibio, invertebrado. `options` narrows the row (2+ ids, must include the answer), e.g. a
 *  penguin's «mueve» row without «anda». */
interface NAFichaRow {
  id: string;
  answer: string;
  options?: string[];
}

/** «Ficha del explorador»: the animal's photo + 2–4 rows of chips. ↑ ↓ row, ← → or 1–6 option (a digit goes on to the next empty row),
 *  Enter = Comprobar. Comprobar needs every row; right rows lock green, a wrong pick is struck out (one retry); the second miss shows
 *  the right chips. ok = all rows right (the retry counts, «soft»). */
interface NAFichaTask extends ExamTaskBase {
  type: 'ficha';
  /** NAArt key of the photo. */
  animal: string;
  /** Spanish name under the photo. */
  name: string;
  rows: NAFichaRow[];
}

/** A row's texts (types.js ROWS: the row labels and option ids live there, not in content.js). */
interface NAFichaRowDef {
  label: string;
  /** Before the right answer in the miss note: «Nace: ovíparo». */
  short: string;
  icon: string;
  options: Record<string, string>;
}

/** A node of a classification key: a yes / no question; a branch is another node or a leaf id (NA_CONTENT.leaves). */
interface NAClaveNode {
  q: string;
  yes: NAClaveNode | string;
  no: NAClaveNode | string;
}

/** «¿Quién es?»: walk the yes / no questions of `tree` down to the animal's group. Keys S / N, 1 / 2, ← → + Enter. The first wrong step
 *  gets one retry at that node; a second wrong step anywhere shows the right branch and goes on along it (then the task is a miss).
 *  ok = at most one wrong step. */
interface NAClaveTask extends ExamTaskBase {
  type: 'clave';
  animal: string;
  name: string;
  /** 2–4 short features shown under the photo (the clues the questions ask about). */
  facts?: string[];
  /** Id in NA_CONTENT.trees. */
  tree: string;
  /** Leaf id the walk must reach (once in the tree). */
  answer: string;
}

/** NA_CONTENT: an ExamUnit plus the keys of the clave (trees + leaves live in content.js). */
interface NAUnit extends ExamUnit {
  trees?: Record<string, NAClaveNode>;
  /** Leaf id → label (Spanish), e.g. mamifero: 'mamífero'. */
  leaves?: Record<string, string>;
}

declare var NA_CONTENT: NAUnit;
declare var NA_TYPES: ExamRenderers;
declare var NA_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
declare var NA_CLAVE_PATH: (unit: ExamUnit, task: NAClaveTask) => ('yes' | 'no')[] | null;
declare var NAArt: ExamArt;

interface Window {
  NA_CONTENT: NAUnit;
  NA_TYPES: ExamRenderers;
  NA_CHECK: (unit: ExamUnit, art?: ExamArt) => string[];
  NA_CLAVE_PATH: (unit: ExamUnit, task: NAClaveTask) => ('yes' | 'no')[] | null;
  NAArt: ExamArt;
  __na: any;
}
