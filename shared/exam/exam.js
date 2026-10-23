// Keeper Fun Games — exam-prep engine: a school unit as stations (short practice rounds) plus a final exam with cards.
// Include after kf.js, kf-ui.js, kf-game.js; link exam.css; then types.js (generic task renderers), the unit's content/art/types, game.js.
//   KFExam.mount(unit, { art, types, root, weight, onAnswer })   renders hub / play / finish / dialogs into root (default #exam-root)
//     weight(task) ≥ 0 = how likely a task is drawn; onAnswer(task, correct) = after each resolved task; task.key = learning item (no repeats in a draw)
//   KFExam.validate(unit, types?) → string[]   content errors tsc can't see (empty = fine)
//   KFExam.types                               generic renderers {choice, tf, sort, order, pairs, label, fill, pick} (types.js)
// The unit is plain data (see types/exam.d.ts ExamUnit); its own task types come as renderers in `types`
// (task, work, ctx) → void, see ExamRendererCtx. Records live in KF.gameData(unit.slug): { v, st, exam, topics }.
// @ts-check
'use strict';

(() => {
  const ROUND = 8;
  const RED_AFTER = 3;
  // A station (or the exam) is reported to the catalog as a nota out of 10.
  const NOTA_MAX = 10;
  const PERFECT_BONUS = 5;
  const LETTERS = 'ABCDEFGH';
  const GENERIC = ['choice', 'tf', 'sort', 'order', 'pairs', 'label', 'fill', 'pick'];
  const CYRILLIC = /[\u0400-\u04FF]/;
  const FILL_WORD = /^[a-záéíóúüñ]{2,11}$/;
  const FILL_EXTRA = /^[a-záéíóúüñ]{1,4}$/;
  const DEFAULT_HUE = '#3f8fc9';
  const GRADE_COLORS = ['#e5a12a', '#9fb53a', '#5fa33a', '#2f8a52', '#1d6fb0'];
  const LIMITED = { sort: 1, order: 1, pairs: 1 };

  // Engine texts (Spanish); a unit overrides some with unit.strings. Strings or functions only: T() turns anything else into its key.
  /** @type {ExamStrings} */
  const DEFAULT_STRINGS = {
    coins: 'Monedas',
    back: '← Juegos',
    stationsTitle: 'Estaciones',
    examEyebrow: 'Partido final',
    examTitle: 'Examen final',
    examStart: 'Empezar el examen',
    examInfo: ({ n }) =>
      `${n} preguntas de toda la unidad, como en el cole. Cada fallo es una 🟨 tarjeta amarilla. ¡Tranquilidad, es para practicar!`,
    examBest: ({ grade, nota }) => `Tu mejor nota: ${grade} (${nota})`,
    cardsLabel: 'Tarjetas',
    goalsLabel: 'Goles',
    review: 'Repaso',
    backBtn: 'Volver',
    start: 'Empezar',
    quitTitle: '¿Volver a las estaciones?',
    quitText: 'Esta ronda no contará para tu récord.',
    quitYes: 'Salir',
    quitNo: 'Seguir jugando',
    tallyPassed: ({ n, total }) => `🏁 ${n}/${total} superadas`,
    tallyStars: ({ n, total }) => `⭐ ${n}/${total}`,
    best: ({ score, max }) => `Mejor: ${score}/${max}`,
    notPlayed: 'Sin jugar',
    passed: '¡Superada!',
    introMeta: ({ n }) => `${n} preguntas · unos 3 minutos`,
    stars: ({ n }) => `${n} de 3 estrellas`,
    roundLabel: ({ title, i, n }) => `${title} · <b>${i}/${n}</b>`,
    examLabel: ({ title, i, n }) => `${title} · <b>${i}/${n}</b>`,
    praiseSoft: '¡Bien hecho!',
    almost: '¡Casi!',
    answerIs: ({ a }) => `La respuesta es: ${a}.`,
    seeRight: 'Mira cómo queda bien.',
    fix: ({ text }) => `Así es correcto: ${text}`,
    next: 'Siguiente →',
    result: 'Ver resultado →',
    restart: 'Empezar de nuevo ↺',
    yellow: '¡Tarjeta amarilla!',
    yellowText: 'No pasa nada. ¡Sigue jugando!',
    red: '¡Tarjeta roja!',
    redText: 'Llevas varios fallos, pero el examen sigue. Al final verás qué temas repasar.',
    kChoice: ({ n }) => `Teclas 1–${n}`,
    kTf: 'Teclas V = verdadero, F = falso',
    true: 'Verdadero',
    false: 'Falso',
    kSort: ({ n }) => `Toca una tarjeta y después su caja. Teclado: ← → para elegir tarjeta, 1–${n} para la caja`,
    pickCard: 'Primero toca una tarjeta.',
    sortTry: 'Casi. Prueba en otra caja.',
    sortGoes: ({ item, bin }) => `«${item}» va en «${bin}».`,
    kOrder: 'Toca las tarjetas en orden: primero la 1, luego la 2… Teclado: letras A–G, ⌫ para deshacer, Enter para comprobar',
    check: 'Comprobar ✓',
    undo: '↶ Deshacer',
    orderGreen: 'Las verdes están bien. Ordena las demás.',
    orderNeedAll: 'Ordena todas las tarjetas.',
    kPairs: ({ n, l }) => `Toca una de la izquierda y su pareja de la derecha. Teclado: 1–${n} y A–${l}`,
    pairNo: 'Esas dos no van juntas. ¡Prueba otra vez!',
    pairShown: 'Te enseño esta pareja.',
    kLabel: ({ n, l }) => `Toca un nombre y después su sitio. Teclado: 1–${n} para el nombre, A–${l} para el sitio`,
    pickLabel: 'Primero toca un nombre.',
    labelTry: 'Ese no es su sitio. Prueba otro.',
    labelShown: ({ text }) => `Así: «${text}» va aquí.`,
    siteLabel: ({ l }) => `Sitio ${l}`,
    kFill: 'Teclado: escribe las letras (si lleva tilde, escribe la vocal sin tilde). ⌫ borra, Enter comprueba',
    fillNeed: 'Rellena todos los huecos antes de comprobar.',
    fillGreen: 'Las letras verdes están bien. Prueba con las demás.',
    fillAgain: 'Todavía no. ¡Prueba otra vez!',
    fillErase: '⌫ Borrar',
    kPick: 'Toca las palabras y pulsa Comprobar. Teclado: ← → para moverte, Espacio para marcar, Enter para comprobar, ⌫ para quitar todo',
    pickNeed: 'Toca primero las palabras y luego pulsa Comprobar.',
    pickGreen: 'Las verdes están bien. ¿Falta alguna o sobra otra? ¡Prueba otra vez!',
    pickAgain: 'Todavía no. ¡Prueba otra vez!',
    pickClear: '↶ Quitar todo',
    textBtn: 'Texto',
    readEyebrow: 'Lectura',
    readNotes: 'Palabras',
    readListen: '🔊 Escuchar',
    readStop: '⏹ Parar',
    readStart: 'Empezar las preguntas',
    readClose: 'Cerrar',
    stationDone: '¡Estación terminada!',
    stationPassed: '¡Estación superada!',
    stationMsg: ({ coins }) => `Has ganado ${coins} 🪙.`,
    stationKeep: ({ need, n }) => `Para superarla necesitas ${need} de ${n}. ¡Otra vez y lo consigues!`,
    stationGreat: 'Ya dominas este tema. ¡Prueba otra estación o el examen final!',
    perfectBonus: ' Y un premio extra por la ronda perfecta.',
    again: 'Otra vez',
    nextStation: 'Siguiente estación →',
    toHub: 'A las estaciones',
    examDone: 'Fin del examen',
    nota: ({ n }) => `Nota: ${n}`,
    examMsgTop: '¡Ya puedes con el examen de verdad! 💪',
    examMsgOk: 'Muy buen partido. Repasa los temas en naranja y vuelve a intentarlo.',
    examMsgLow: 'Aún hay temas por entrenar. Repasa las estaciones en naranja: ¡cada vez saldrá mejor!',
    examCards: ({ y, r }) => `Tarjetas: ${y} 🟨${r ? ' · 1 🟥' : ''}`,
    noCards: '¡Partido limpio, sin tarjetas!',
    byTopic: 'Por temas',
    review2: 'Repasar',
    loadError: 'No se han podido cargar las preguntas. Recarga la página.',
  };

  // Texts of the Ukrainian help (station glossary): they are only ever rendered on the Ukrainian site, the Spanish dictionary does not get them.
  /** @type {ExamStrings} */
  const UK_STRINGS = {
    vocabTitle: '📖 Словничок',
    vocabBtn: 'Словничок',
    vocabClose: 'Закрити',
  };

  /** @type {ExamLists} */
  const DEFAULT_LISTS = {
    praise: ['¡Muy bien!', '¡Golazo!', '¡Genial!', '¡Eso es!', '¡Perfecto!'],
    grades: ['¡Sigue practicando!', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente'],
  };

  // ---------- Content check ----------
  /**
   * What tsc can't check: ranges, references between parts of a task, counts. [] = fine.
   * `types` = the unit's renderers: when given, task types without a renderer are errors.
   * @param {ExamUnit} unit
   * @param {ExamRenderers} [types]
   * @returns {string[]}
   */
  const validate = (unit, types) => {
    /** @type {string[]} */
    const errs = [];
    /** @param {string} where @param {string} msg */
    const err = (where, msg) => errs.push(`${where}: ${msg}`);
    /** @param {any} x */
    const text = (x) => typeof x === 'string' && x.trim() !== '';
    /** @param {any} x @param {number} [min] */
    const int = (x, min = 1) => Number.isInteger(x) && x >= min;
    if (!unit || typeof unit !== 'object') return ['unit: missing'];
    if (!text(unit.slug)) err('unit', 'slug missing');
    if (!text(unit.title)) err('unit', 'title missing');
    if (unit.round !== undefined && !int(unit.round)) err('unit', 'round must be a positive integer');
    if (!Array.isArray(unit.stations) || !unit.stations.length) {
      err('unit', 'stations missing');
      return errs;
    }
    const stationIds = new Set();
    unit.stations.forEach((s, si) => {
      const sw = `station ${s?.id ?? `#${si}`}`;
      if (!text(s?.id)) err(sw, 'id missing');
      else if (stationIds.has(s.id)) err(sw, 'duplicate id');
      else stationIds.add(s.id);
      for (const k of /** @type {const} */ (['title', 'icon', 'intro'])) if (!text(s?.[k])) err(sw, `${k} missing`);
      if (s?.vocab !== undefined) checkVocab(sw, s.vocab, err, text);
      if (s?.text !== undefined) checkReading(sw, s.text, err, text);
      if (!Array.isArray(s?.tasks) || !s.tasks.length) {
        err(sw, 'tasks missing');
        return;
      }
      s.tasks.forEach((t, ti) => {
        const w = `${sw} task ${ti + 1}`;
        if (!text(t?.q)) err(w, 'q missing');
        if (!text(t?.type)) return err(w, 'type missing');
        if (types && !GENERIC.includes(t.type) && !types[t.type]) return err(w, `no renderer for type «${t.type}»`);
        if (t.passage !== undefined) checkPassage(w, t.passage, err, text);
        // A unit's own renderer of a generic type name (dictado has its own «pick») brings its own data: only the generic shape is checked here.
        // Without `types` the engine can't tell, so a «pick» without `text` is taken for the unit's own.
        const own = types ? !!types[t.type] && types[t.type] !== KFExam.types[t.type] : t.type === 'pick' && t.text === undefined;
        if (!own) checkTask(w, t, err, text, int);
      });
    });

    const ex = unit.exam;
    if (!ex || typeof ex !== 'object' || !ex.perStation || typeof ex.perStation !== 'object') err('exam', 'perStation missing');
    else {
      const entries = Object.entries(ex.perStation);
      if (!entries.length) err('exam', 'perStation is empty');
      for (const [id, n] of entries) {
        const s = unit.stations.find((x) => x.id === id);
        if (!s) err('exam', `perStation: no station «${id}»`);
        else if (!int(n)) err('exam', `perStation.${id} must be a positive integer`);
        else if (n > s.tasks.length) err('exam', `perStation.${id} = ${n}, but the station has ${s.tasks.length} tasks`);
      }
      if (ex.redAfter !== undefined && !int(ex.redAfter)) err('exam', 'redAfter must be a positive integer');
    }
    for (const id of Object.keys(unit.hues || {})) if (!stationIds.has(id)) err('hues', `no station «${id}»`);
    return errs;
  };

  /**
   * Brackets of a text: balanced and not nested. Returns what is wrong, or null.
   * @param {string} t
   * @returns {string | null}
   */
  const bracketError = (t) => {
    let open = false;
    for (const c of t) {
      if (c === '[') {
        if (open) return 'brackets are nested';
        open = true;
      } else if (c === ']') {
        if (!open) return 'a ] without its [';
        open = false;
      }
    }
    return open ? 'a [ without its ]' : null;
  };

  /**
   * A task's passage: text with \n paragraphs and [marked] parts, brackets balanced and not nested, no Cyrillic.
   * @param {string} w
   * @param {any} passage
   * @param {(where: string, msg: string) => void} err
   * @param {(x: any) => boolean} text
   */
  const checkPassage = (w, passage, err, text) => {
    if (!text(passage)) return err(w, 'passage must be a non-empty text');
    const bad = bracketError(passage);
    if (bad) err(w, `passage: ${bad}`);
    else if (/\[\s*\]/.test(passage)) err(w, 'passage: an empty [ ]');
    if (CYRILLIC.test(passage)) err(w, 'passage must be Spanish (no Cyrillic)');
  };

  /**
   * A station's reading: title, ≥ 1 paragraph, notes [word, meaning]; Spanish only.
   * @param {string} w
   * @param {any} tx
   * @param {(where: string, msg: string) => void} err
   * @param {(x: any) => boolean} text
   */
  const checkReading = (w, tx, err, text) => {
    if (!tx || typeof tx !== 'object') return err(w, 'text must be { title, paragraphs, notes? }');
    if (!text(tx.title)) err(w, 'text: title missing');
    if (!Array.isArray(tx.paragraphs) || !tx.paragraphs.length || !tx.paragraphs.every(text))
      err(w, 'text: paragraphs must be 1+ non-empty texts');
    if (tx.notes !== undefined) {
      if (!Array.isArray(tx.notes) || !tx.notes.every((n) => Array.isArray(n) && n.length === 2 && text(n[0]) && text(n[1]))) {
        err(w, 'text: notes must be [word, meaning] pairs with both texts');
      }
    }
    const all = [tx.title, ...(Array.isArray(tx.paragraphs) ? tx.paragraphs : []), ...(Array.isArray(tx.notes) ? tx.notes.flat() : [])];
    if (all.some((x) => typeof x === 'string' && CYRILLIC.test(x))) err(w, 'text must be Spanish (no Cyrillic)');
  };

  /**
   * A station glossary: [Spanish term, Ukrainian translation] pairs; Cyrillic only in the translation.
   * @param {string} w
   * @param {any} vocab
   * @param {(where: string, msg: string) => void} err
   * @param {(x: any) => boolean} text
   */
  const checkVocab = (w, vocab, err, text) => {
    if (!Array.isArray(vocab) || !vocab.length) return err(w, 'vocab must be a non-empty list of [term, translation]');
    vocab.forEach((v, i) => {
      if (!Array.isArray(v) || v.length !== 2 || !text(v[0]) || !text(v[1]))
        err(w, `vocab ${i + 1}: must be [term, translation] with both texts`);
      else if (CYRILLIC.test(v[0])) err(w, `vocab ${i + 1}: the term «${v[0]}» must be Spanish (Cyrillic only in the translation)`);
    });
  };

  /**
   * Shape of one generic task (unit types are checked by their own renderers' data, not here).
   * @param {string} w
   * @param {any} t
   * @param {(where: string, msg: string) => void} err
   * @param {(x: any) => boolean} text
   * @param {(x: any, min?: number) => boolean} int
   */
  const checkTask = (w, t, err, text, int) => {
    switch (t.type) {
      case 'choice':
        if (!Array.isArray(t.options) || t.options.length < 2 || t.options.length > 9 || !t.options.every(text)) {
          err(w, 'options must be 2–9 texts');
        } else if (!int(t.answer, 0) || t.answer >= t.options.length) err(w, `answer ${t.answer} is not an index of options`);
        break;
      case 'tf':
        if (typeof t.truth !== 'boolean') err(w, 'truth must be true or false');
        break;
      case 'sort': {
        const bins = Array.isArray(t.bins) ? t.bins : [];
        const ids = new Set(bins.map((b) => b?.id));
        if (bins.length < 2 || bins.length > 9) err(w, 'bins must be 2–9');
        if (ids.size !== bins.length || !bins.every((b) => text(b?.id) && text(b?.label))) err(w, 'bins need unique ids and labels');
        if (!Array.isArray(t.items) || !t.items.length) return err(w, 'items missing');
        t.items.forEach((it, i) => {
          if (!text(it?.text)) err(w, `item ${i + 1}: text missing`);
          if (!ids.has(it?.bin)) err(w, `item ${i + 1}: bin «${it?.bin}» does not exist`);
        });
        for (const id of ids) if (!t.items.some((it) => it?.bin === id)) err(w, `bin «${id}» has no items`);
        break;
      }
      case 'order':
        if (!Array.isArray(t.items) || t.items.length < 2 || t.items.length > LETTERS.length || !t.items.every(text)) {
          err(w, `items must be 2–${LETTERS.length} texts`);
        }
        break;
      case 'pairs':
        if (!Array.isArray(t.pairs) || t.pairs.length < 2 || t.pairs.length > LETTERS.length) {
          err(w, `pairs must be 2–${LETTERS.length}`);
        } else if (!t.pairs.every((p) => Array.isArray(p) && p.length === 2 && text(p[0]) && text(p[1]))) {
          err(w, 'every pair must be [left, right] with both texts');
        }
        break;
      case 'label': {
        const labels = Array.isArray(t.labels) ? t.labels : [];
        if (!text(t.scene)) err(w, 'scene missing');
        if (labels.length < 2 || !labels.every((l) => text(l?.id) && text(l?.text)))
          return err(w, 'labels must be 2+ with an id and a text');
        if (new Set(labels.map((l) => l.id)).size !== labels.length) err(w, 'label ids must be unique');
        if (new Set(labels.map((l) => l.text)).size !== labels.length) err(w, 'label texts must be unique');
        break;
      }
      case 'pick': {
        if (!text(t.text)) return err(w, 'text missing');
        const bad = bracketError(t.text);
        if (bad) return err(w, `text: ${bad}`);
        const marked = [...t.text.matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);
        if (!marked.length) err(w, 'text needs at least one [right word]');
        if (marked.some((m) => !/^\S+$/.test(m))) err(w, 'text: every [bracket] holds exactly one word');
        if (CYRILLIC.test(t.text)) err(w, 'text must be Spanish (no Cyrillic)');
        break;
      }
      case 'fill':
        if (!text(t.text) || t.text.split('___').length !== 2) err(w, 'text must have exactly one ___');
        if (typeof t.answer !== 'string' || !FILL_WORD.test(t.answer)) {
          err(w, `answer «${t.answer}» must be one lowercase word of 2–11 letters (a–z, á é í ó ú ü ñ)`);
        }
        if (t.extra !== undefined && (typeof t.extra !== 'string' || !FILL_EXTRA.test(t.extra))) {
          err(w, `extra «${t.extra}» must be 1–4 lowercase letters`);
        }
        break;
    }
  };

  // ---------- Mount ----------
  /**
   * @param {ExamUnit | undefined} unit
   * @param {ExamMountOptions} [opts]
   */
  const mount = (unit, opts = {}) => {
    const { $, h, shuffle, pick, reduced, shake } = KFG;
    const root = opts.root || $('exam-root');
    const dict = { ...DEFAULT_STRINGS, ...unit?.strings };
    const T = KF.i18n({ uk: { ...UK_STRINGS, ...dict }, es: dict });
    document.documentElement.lang = unit?.lang || 'es';
    if (!unit || ('art' in opts && !opts.art)) {
      root.replaceChildren(h('p', { text: T('loadError') }));
      return;
    }
    const art = opts.art;
    /** @type {ExamRenderers} */
    const types = { ...KFExam.types, ...opts.types };
    const problems = validate(unit, types);
    if (problems.length) console.error(`KFExam: invalid unit «${unit.slug}»:\n${problems.join('\n')}`);

    const SLUG = unit.slug;
    const lists = { ...DEFAULT_LISTS, ...unit.lists };
    const round = unit.round || ROUND;
    const STATIONS = unit.stations;
    const stationOf = (/** @type {string} */ id) => STATIONS.find((s) => s.id === id);
    const hueOf = (/** @type {string} */ id) => unit.hues?.[id] || DEFAULT_HUE;
    const EXAM = unit.exam;
    const EXAM_TITLE = EXAM.title || T('examTitle');
    const EXAM_N = Object.values(EXAM.perStation).reduce((a, b) => a + b, 0);
    const RED = EXAM.redAfter || RED_AFTER;
    const caps = unit.sampling?.caps || LIMITED;
    const examCaps = unit.sampling?.examCaps || LIMITED;
    const always = unit.sampling?.always || [];

    // ---------- Markup ----------
    root.replaceChildren(
      h(
        'div',
        { class: 'game-top' },
        h('a', { class: 'back-link', href: '../../', text: T('back') }),
        unit.subject && h('span', { class: 'eyebrow muted', text: unit.subject }),
      ),
      h(
        'div',
        { class: 'panel' },
        h(
          'section',
          { class: 'hub', id: 'hub' },
          h(
            'div',
            { class: 'hero' },
            h(
              'div',
              {},
              unit.unitLabel && h('p', { class: 'eyebrow', text: unit.unitLabel }),
              h('h1', { text: unit.title }),
              unit.intro && h('p', { text: unit.intro }),
              h('div', { class: 'tally', id: 'tally' }),
            ),
            h('div', { class: 'hero-art', id: 'hero-art', 'aria-hidden': 'true' }),
          ),
          h('h2', { class: 'section-label', text: T('stationsTitle') }),
          h('div', { class: 'stations', id: 'stations' }),
        ),
        h(
          'section',
          { id: 'play', hidden: true },
          h(
            'div',
            { class: 'play-head' },
            // The page's «← back» row is hidden while playing (it costs a whole row on laptops): this asks like Esc does.
            h('button', {
              class: 'play-quit',
              type: 'button',
              id: 'play-quit',
              'aria-label': T('backBtn'),
              title: T('backBtn'),
              text: '←',
              onclick: () => askQuit(),
            }),
            h('span', { class: 'label', id: 'play-label' }),
            h('div', { class: 'dots', id: 'dots', 'aria-hidden': 'true' }),
            h('span', { class: 'cards', id: 'cards', 'aria-label': T('cardsLabel') }),
            h('span', { class: 'goals', id: 'goals', 'aria-label': T('goalsLabel') }, '⚽ ', h('b', { id: 'goals-n', text: '0' })),
          ),
          h('div', { class: 'prompt' }, h('p', { class: 'prompt-text', id: 'prompt' })),
          h('div', { class: 'passage', id: 'passage', hidden: true }),
          h('div', { class: 'work', id: 'work' }),
          h('div', { class: 'feedback', id: 'feedback', role: 'status', 'aria-live': 'polite' }),
        ),
        h('section', { class: 'exam-read', id: 'read-screen', hidden: true, 'aria-labelledby': 'read-title' }),
        h('section', { class: 'finish', id: 'finish', hidden: true }),
      ),
      h(
        'dialog',
        { id: 'intro-dlg', 'aria-labelledby': 'intro-title' },
        h(
          'div',
          { class: 'dlg' },
          h(
            'div',
            { class: 'dlg-head' },
            h('span', { class: 'st-icon', id: 'intro-icon', 'aria-hidden': 'true' }),
            h('div', {}, h('p', { class: 'eyebrow', text: T('review') }), h('h2', { id: 'intro-title' })),
          ),
          h('p', { class: 'intro', id: 'intro-text' }),
          h('p', { class: 'meta', id: 'intro-meta' }),
          h(
            'div',
            { class: 'dlg-actions' },
            h('button', { class: 'btn btn-light', type: 'button', id: 'intro-back', text: T('backBtn') }),
            h('button', { class: 'btn btn-dark', type: 'button', id: 'intro-go', text: T('start') }),
          ),
        ),
      ),
      h(
        'dialog',
        { id: 'quit-dlg', 'aria-labelledby': 'quit-title' },
        h(
          'div',
          { class: 'dlg' },
          h('h2', { id: 'quit-title', text: T('quitTitle') }),
          h('p', { class: 'meta', style: 'margin-top:10px', text: T('quitText') }),
          h(
            'div',
            { class: 'dlg-actions' },
            h('button', { class: 'btn btn-light', type: 'button', id: 'quit-yes', text: T('quitYes') }),
            h('button', { class: 'btn btn-dark', type: 'button', id: 'quit-no', text: T('quitNo') }),
          ),
        ),
      ),
    );
    const examCard = h(
      'div',
      { class: 'exam-card', id: 'exam-card' },
      h(
        'div',
        {},
        h('p', { class: 'eyebrow', text: T('examEyebrow') }),
        h('h2', {}, `${EXAM.icon || '🏆'} `, h('span', { text: EXAM_TITLE })),
        h('p', { id: 'exam-info' }),
        h('div', { class: 'exam-best', id: 'exam-best', hidden: true }),
      ),
      h('button', { class: 'btn', type: 'button', id: 'exam-btn', text: T('examStart'), onclick: () => startExam() }),
    );
    // The site header (outside the root) may carry [data-i18n*] texts.
    T.apply();

    // ---------- Saved progress ----------
    // Sync merges numbers in gameData by adding the deltas of both devices (shared/kf.js mergeVal),
    // so records can come back inflated: clamp them to what a round can really give.
    const clamp = (/** @type {any} */ v, /** @type {number} */ max) => Math.min(Math.max(Number(v) || 0, 0), max);
    /** @returns {ExamRecords} */
    const loadData = () => {
      const d = KF.gameData(SLUG);
      /** @type {ExamRecords['st']} */
      const st = {};
      for (const [id, r] of Object.entries(d.st || {})) {
        const max = clamp(r.max, round) || round;
        st[id] = { ...r, max, best: clamp(r.best, max), stars: clamp(r.stars, 3) };
      }
      const exam = d.exam ? { ...d.exam, n: clamp(d.exam.n, NOTA_MAX) } : null;
      return { v: 1, st, exam, topics: { ...(d.topics || {}) } };
    };
    let data = loadData();
    const saveData = () => KF.gameData(SLUG, data);
    const starsFor = (/** @type {number} */ score, /** @type {number} */ max) => {
      const p = max ? score / max : 0;
      return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.5 ? 1 : 0;
    };
    const gradeFor = (/** @type {number} */ score, /** @type {number} */ max) => {
      const n = max ? (score / max) * NOTA_MAX : 0;
      const i = n >= 9 ? 4 : n >= 7 ? 3 : n >= 6 ? 2 : n >= 5 ? 1 : 0;
      return { i, label: lists.grades[i], nota: n.toFixed(1).replace('.', ','), n };
    };
    const starsEl = (/** @type {number} */ n) =>
      h(
        'span',
        { class: 'stars', 'aria-label': T('stars', { n }) },
        [0, 1, 2].map((i) => h('span', { class: i < n ? 'on' : '', text: '★' })),
      );

    // ---------- Hub ----------
    const renderHub = () => {
      data = loadData();
      // Redrawn on every return to the hub: a unit's hero may show live numbers.
      if (art?.hero) $('hero-art').replaceChildren(art.hero());
      const tiles = STATIONS.map((s, i) => {
        const rec = data.st[s.id];
        const meta = rec
          ? [
              starsEl(rec.stars),
              h('span', { class: 'best', text: T('best', { score: rec.best, max: rec.max }) }),
              rec.stars >= 2 && h('span', { class: 'badge', text: T('passed') }),
            ]
          : [starsEl(0), h('span', { text: T('notPlayed') })];
        return h(
          'button',
          { type: 'button', class: 'station', style: `--hue:${hueOf(s.id)}`, onclick: () => openIntro(s) },
          h('span', { class: 'st-num', 'aria-hidden': 'true', text: String(i + 1) }),
          h('span', { class: 'st-icon', 'aria-hidden': 'true', text: s.icon }),
          h('span', { class: 'st-body' }, h('strong', { text: s.title }), h('small', { text: s.intro })),
          h('span', { class: 'st-meta' }, meta),
        );
      });
      $('stations').replaceChildren(...tiles, examCard);
      const passed = STATIONS.filter((s) => (data.st[s.id]?.stars || 0) >= 2).length;
      const stars = STATIONS.reduce((n, s) => n + (data.st[s.id]?.stars || 0), 0);
      $('tally').replaceChildren(
        h('span', { text: T('tallyPassed', { n: passed, total: STATIONS.length }) }),
        h('span', { text: T('tallyStars', { n: stars, total: STATIONS.length * 3 }) }),
      );
      $('exam-info').textContent = T('examInfo', { n: EXAM_N });
      $('exam-best').hidden = !data.exam;
      if (data.exam) $('exam-best').textContent = T('examBest', { grade: data.exam.grade, nota: data.exam.nota });
    };

    // ---------- Glossary (Ukrainian help) ----------
    // A station's vocab is for the Ukrainian site only: on the Spanish one nothing of it is ever put in the DOM.
    const vocabOf = (/** @type {ExamStation | undefined} */ s) => (KF.lang === 'uk' && s?.vocab?.length ? s.vocab : null);
    const vocabList = (/** @type {[string, string][]} */ vocab) =>
      h(
        'dl',
        { class: 'vocab-list' },
        vocab.map(([es, uk]) => h('div', { class: 'vocab-row' }, h('dt', { lang: 'es', text: es }), h('dd', { lang: 'uk', text: uk }))),
      );
    /** @type {HTMLButtonElement | null} */
    let vocabBtn = null;
    /** @type {HTMLDialogElement | null} */
    let vocabDlg = null;
    const openVocab = () => {
      const vocab = vocabOf(stationOf(session?.station));
      if (!vocab || vocabDlg) return;
      const opener = document.activeElement;
      const dlg = /** @type {HTMLDialogElement} */ (
        h(
          'dialog',
          { id: 'vocab-dlg', class: 'vocab-dlg', 'aria-labelledby': 'vocab-title' },
          h(
            'div',
            { class: 'dlg' },
            h('h2', { id: 'vocab-title', text: T('vocabTitle') }),
            vocabList(vocab),
            h(
              'div',
              { class: 'dlg-actions' },
              h('button', { class: 'btn btn-dark', type: 'button', id: 'vocab-close', text: T('vocabClose'), onclick: () => dlg.close() }),
            ),
          ),
        )
      );
      dlg.addEventListener('close', () => {
        dlg.remove();
        vocabDlg = null;
        // Back to the button only when it had the focus (keyboard); a tap leaves the keys to the task.
        if (opener === vocabBtn && vocabBtn?.isConnected) vocabBtn.focus({ preventScroll: true });
      });
      vocabDlg = dlg;
      root.append(dlg);
      dlg.showModal();
      $('vocab-close').focus();
    };
    // The «📖» button lives in the play head during a station round only (never in the exam), and only when the station has a glossary.
    const syncVocabBtn = () => {
      const vocab = session?.mode === 'station' ? vocabOf(stationOf(session.station)) : null;
      if (!vocab) {
        vocabBtn?.remove();
        vocabBtn = null;
        return;
      }
      if (vocabBtn) return;
      // A tap must not move the focus onto the button: Enter would then reopen the glossary instead of going on with the task.
      vocabBtn = /** @type {HTMLButtonElement} */ (
        h(
          'button',
          {
            class: 'play-vocab',
            type: 'button',
            id: 'play-vocab',
            'aria-label': T('vocabTitle'),
            onmousedown: (/** @type {MouseEvent} */ e) => e.preventDefault(),
            onclick: openVocab,
          },
          h('span', { 'aria-hidden': 'true', text: '📖' }),
          h('span', { class: 'pv-text', text: ` ${T('vocabBtn')}` }),
        )
      );
      $('play').querySelector('.play-head').append(vocabBtn);
    };

    // ---------- Station reading ----------
    // station.text: a reading screen before a station round (after the intro dialog), and behind a «📜» button in the play head
    // whenever the current task's station has one (rounds and the exam). «🔊» reads the paragraphs one after the other.
    /** @type {{ btn: HTMLButtonElement, stop: () => void } | null} */
    let reader = null;
    const stopReader = () => {
      reader?.stop();
      reader = null;
    };
    const textLang = unit.lang || 'es';
    /**
     * The «🔊 Escuchar» / «⏹ Parar» button of a reading (hidden when nothing can say it). Reads the paragraphs one by one with
     * KFG.say, polling KFG.speaking() to chain them; the paragraph being read gets .is-reading.
     * @param {string} id
     * @param {string[]} texts
     * @param {HTMLElement[]} paras
     */
    const listenBtn = (id, texts, paras) => {
      const btn = /** @type {HTMLButtonElement} */ (
        h('button', { class: 'btn btn-light read-listen', type: 'button', id, text: T('readListen') })
      );
      btn.hidden = !KFG.canSay('es', texts[0]);
      const mark = (/** @type {number} */ k) => paras.forEach((el, j) => el.classList.toggle('is-reading', j === k));
      const play = () => {
        stopReader();
        let i = 0;
        let alive = true;
        let timer = 0;
        reader = {
          btn,
          stop: () => {
            alive = false;
            clearTimeout(timer);
            KFG.hush();
            mark(-1);
            btn.textContent = T('readListen');
            btn.classList.remove('is-on');
          },
        };
        btn.textContent = T('readStop');
        btn.classList.add('is-on');
        const step = () => {
          if (!alive) return;
          if (i >= texts.length || !KFG.say(texts[i], 'es')) return stopReader();
          mark(i);
          let started = false;
          let idle = 0;
          const poll = () => {
            if (!alive) return;
            if (KFG.speaking()) {
              started = true;
              idle = 0;
            } else if (started || ++idle > 12) {
              i++;
              return step();
            }
            timer = window.setTimeout(poll, 150);
          };
          timer = window.setTimeout(poll, 150);
        };
        step();
      };
      btn.addEventListener('click', () => (reader?.btn === btn ? stopReader() : play()));
      return btn;
    };
    /** The paragraphs and the notes box of a reading (screen and dialog share it). @param {ExamText} tx */
    const readingBody = (tx) => {
      const paras = tx.paragraphs.map((p) => h('p', { class: 'read-p', text: p }));
      const notes = tx.notes?.length
        ? h(
            'aside',
            { class: 'read-notes', 'aria-label': T('readNotes') },
            h('h3', { text: T('readNotes') }),
            h(
              'dl',
              {},
              tx.notes.map(([word, meaning]) => h('div', { class: 'read-note' }, h('dt', { text: word }), h('dd', { text: meaning }))),
            ),
          )
        : null;
      return { paras, el: h('div', { class: 'read-body' }, h('div', { class: 'read-text', lang: textLang }, paras), notes) };
    };
    // Where the reading's box starts: exam.css lets it scroll inside instead of making the page scroll (laptops).
    const fitRead = () => {
      const screen = $('read-screen');
      const box = screen.querySelector('.read-body');
      if (screen.hidden || !box) return;
      screen.style.setProperty('--read-top', `${Math.round(box.getBoundingClientRect().top + scrollY)}px`);
    };
    addEventListener('resize', fitRead);
    const openReading = (/** @type {ExamStation} */ s) => {
      const tx = /** @type {ExamText} */ (s.text);
      stopReader();
      const body = readingBody(tx);
      $('read-screen').replaceChildren(
        h(
          'div',
          { class: 'read-head' },
          h('span', { class: 'st-icon', 'aria-hidden': 'true', style: `--hue:${hueOf(s.id)}`, text: s.icon }),
          h('div', {}, h('p', { class: 'eyebrow', text: T('readEyebrow') }), h('h2', { id: 'read-title', text: tx.title })),
        ),
        body.el,
        h(
          'div',
          { class: 'read-actions' },
          listenBtn('read-listen', tx.paragraphs, body.paras),
          h('button', { class: 'btn btn-dark', type: 'button', id: 'read-start', text: T('readStart'), onclick: () => startStation(s.id) }),
        ),
      );
      show('read');
      fitRead();
      $('read-start').focus({ preventScroll: true });
    };

    /** @type {HTMLButtonElement | null} */
    let textBtn = null;
    /** @type {HTMLDialogElement | null} */
    let textDlg = null;
    const openText = (/** @type {ExamStation | undefined} */ s) => {
      const tx = s?.text;
      if (!tx || textDlg) return;
      const opener = document.activeElement;
      const body = readingBody(tx);
      const dlg = /** @type {HTMLDialogElement} */ (
        h(
          'dialog',
          { id: 'text-dlg', class: 'vocab-dlg text-dlg', 'aria-labelledby': 'text-title' },
          h(
            'div',
            { class: 'dlg' },
            h('h2', { id: 'text-title', text: tx.title }),
            body.el,
            h(
              'div',
              { class: 'dlg-actions' },
              listenBtn('text-listen', tx.paragraphs, body.paras),
              h('button', { class: 'btn btn-dark', type: 'button', id: 'text-close', text: T('readClose'), onclick: () => dlg.close() }),
            ),
          ),
        )
      );
      dlg.addEventListener('close', () => {
        stopReader();
        dlg.remove();
        textDlg = null;
        if (opener === textBtn && textBtn?.isConnected) textBtn.focus({ preventScroll: true });
      });
      textDlg = dlg;
      root.append(dlg);
      dlg.showModal();
      $('text-close').focus();
    };
    // The «📜 Texto» button: in the play head while the current task belongs to a station with a text (it comes and goes per task in the exam).
    const syncTextBtn = () => {
      if (!session?.task || !stationOf(session.task.station)?.text) {
        textBtn?.remove();
        textBtn = null;
        return;
      }
      if (textBtn) return;
      textBtn = /** @type {HTMLButtonElement} */ (
        h(
          'button',
          {
            class: 'play-text',
            type: 'button',
            id: 'play-text',
            'aria-label': T('textBtn'),
            onmousedown: (/** @type {MouseEvent} */ e) => e.preventDefault(),
            onclick: () => openText(stationOf(session?.task?.station)),
          },
          h('span', { 'aria-hidden': 'true', text: '📜' }),
          h('span', { class: 'pv-text', text: ` ${T('textBtn')}` }),
        )
      );
      $('play').querySelector('.play-head').append(textBtn);
    };

    // The passage of a task (a short text above its work area): \n = paragraph, [x] = a marked part, a lone [.] = a full stop.
    const renderPassage = (/** @type {string | undefined} */ passage) => {
      const box = $('passage');
      box.hidden = !passage;
      box.replaceChildren(
        ...(passage ? passage.split('\n') : []).map((par) => {
          /** @type {(Node | string)[]} */
          const kids = [];
          let at = 0;
          for (const m of par.matchAll(/\[([^[\]]*)\]/g)) {
            if (m.index > at) kids.push(par.slice(at, m.index));
            kids.push(h('mark', { class: `passage-mark${m[1] === '.' ? ' is-dot' : ''}`, text: m[1] }));
            at = m.index + m[0].length;
          }
          if (at < par.length) kids.push(par.slice(at));
          return h('p', {}, kids);
        }),
      );
    };

    /** @type {ExamStation | null} */
    let introStation = null;
    const intro = /** @type {HTMLDialogElement} */ ($('intro-dlg'));
    const openIntro = (/** @type {ExamStation} */ s) => {
      introStation = s;
      $('intro-icon').textContent = s.icon;
      $('intro-icon').style.setProperty('--hue', hueOf(s.id));
      $('intro-title').textContent = s.title;
      $('intro-text').textContent = s.intro;
      intro.querySelector('.vocab')?.remove();
      const vocab = vocabOf(s);
      if (vocab)
        $('intro-text').after(
          h('section', { class: 'vocab', 'aria-label': T('vocabTitle') }, h('h3', { text: T('vocabTitle') }), vocabList(vocab)),
        );
      intro.classList.toggle('has-vocab', !!vocab);
      $('intro-meta').textContent = T('introMeta', { n: Math.min(round, s.tasks.length) });
      intro.showModal();
      $('intro-go').focus();
    };
    $('intro-go').addEventListener('click', () => {
      intro.close();
      startStation(introStation.id, true);
    });
    $('intro-back').addEventListener('click', () => intro.close());

    // ---------- Task sampling ----------
    // Weighted random order (Efraimidis–Spirakis): the bigger the weight, the earlier a task tends to come; weight 0 = last.
    const weightedOrder = (/** @type {ExamTask[]} */ tasks, /** @type {(t: ExamTask) => number} */ weight) =>
      tasks
        .map((t) => {
          const w = Number(weight(t)) || 0;
          return { t, k: w > 0 ? Math.random() ** (1 / w) : -1 };
        })
        .sort((a, b) => b.k - a.k)
        .map((x) => x.t);
    const sampleTasks = (
      /** @type {ExamTask[]} */ tasks,
      /** @type {number} */ n,
      /** @type {ExamCaps} */ limits,
      /** @type {string[]} */ first = [],
    ) => {
      const pool = opts.weight ? weightedOrder(tasks, opts.weight) : shuffle(tasks);
      /** @type {ExamTask[]} */
      const out = [];
      /** @type {Set<string>} */
      const keys = new Set();
      /** @type {Record<string, number>} */
      const count = {};
      const fits = (/** @type {ExamTask} */ t) => (count[t.type] || 0) < (limits[t.type] ?? Number.POSITIVE_INFINITY);
      const take = (/** @type {ExamTask} */ t) => {
        out.push(t);
        count[t.type] = (count[t.type] || 0) + 1;
        if (t.key !== undefined) keys.add(t.key);
      };
      // Tasks that train an item already in the draw wait for the last pass.
      const fresh = (/** @type {ExamTask} */ t) => t.key === undefined || !keys.has(t.key);
      for (const t of pool) if (first.includes(t.type) && out.length < n && fits(t) && fresh(t)) take(t);
      for (const t of pool) if (out.length < n && !out.includes(t) && fits(t) && fresh(t)) take(t);
      for (const t of pool) if (out.length < n && !out.includes(t)) take(t);
      return shuffle(out);
    };
    const withStation = (/** @type {string} */ id) => (/** @type {ExamTask} */ t) => /** @type {ExamSessionTask} */ ({ ...t, station: id });

    // ---------- Session ----------
    /** @type {ExamSession | null} */
    let session = null;
    /** @type {{ onKey: (e: KeyboardEvent) => unknown } | null} */
    let ctrl = null; // current keyboard handler
    const showScreen = KFG.screens(['hub', 'read', 'play', 'finish'], { idOf: (name) => (name === 'read' ? 'read-screen' : name) });
    const show = (/** @type {string} */ name) => {
      if (name !== 'read') stopReader();
      if (name !== 'play') {
        textBtn?.remove();
        textBtn = null;
      }
      showScreen(name);
    };

    // From the intro dialog (`read`) a station with a text first shows it; «again» and the test hook go straight to the questions.
    const startStation = (/** @type {string} */ id, read = false) => {
      const s = stationOf(id);
      if (read && s.text) return openReading(s);
      const tasks = sampleTasks(s.tasks, round, caps, always).map(withStation(id));
      begin({ mode: 'station', station: id, tasks });
    };
    const startExam = () => {
      const tasks = shuffle(
        Object.entries(EXAM.perStation).flatMap(([id, n]) => {
          const s = stationOf(id);
          return s ? sampleTasks(s.tasks, n, examCaps).map(withStation(id)) : [];
        }),
      );
      begin({ mode: 'exam', tasks });
    };
    const begin = (/** @type {{ mode: 'station' | 'exam', station?: string, tasks: ExamSessionTask[] }} */ o) => {
      session = { ...o, index: 0, score: 0, results: [], cards: 0, byStation: {}, startCoins: KF.get().coins };
      syncVocabBtn();
      $('goals-n').textContent = '0';
      drawCards();
      show('play');
      nextTask();
    };
    const drawCards = () => {
      const n = session?.mode === 'exam' ? session.cards : 0;
      $('cards').replaceChildren(...Array.from({ length: Math.min(n, RED) }, (_, i) => h('i', { class: i === RED - 1 ? 'r' : 'y' })));
    };
    const drawDots = () => KFG.dots($('dots'), session.results, session.index, { total: session.tasks.length });

    const nextTask = () => {
      const task = session.tasks[session.index];
      session.task = task;
      session.answered = false;
      const n = session.tasks.length;
      $('play-label').innerHTML =
        session.mode === 'exam'
          ? T('examLabel', { title: EXAM_TITLE, i: session.index + 1, n })
          : T('roundLabel', { title: stationOf(session.station).title, i: session.index + 1, n });
      $('prompt').textContent = task.q;
      $('prompt').classList.toggle('long', task.q.length > 90);
      renderPassage(task.passage);
      syncTextBtn();
      $('feedback').replaceChildren();
      drawDots();
      renderTask(task);
      fitWork();
    };

    // Where the work area starts (the prompt may take one or two lines): exam.css sizes maps and drawings
    // to the height left below it (--avail), so a task fits a laptop screen without scrolling.
    const fitWork = () => {
      const play = $('play');
      if (play.hidden) return;
      play.style.setProperty('--work-top', `${Math.round($('work').getBoundingClientRect().top + scrollY)}px`);
    };
    addEventListener('resize', fitWork);
    const sizes = new ResizeObserver(fitWork);
    sizes.observe($('prompt'));
    sizes.observe($('passage'));

    // Called once per task.
    const resolve = (/** @type {boolean} */ correct, /** @type {ExamResolveInfo} */ info = {}) => {
      if (!session || session.answered) return;
      session.answered = true;
      const task = session.task;
      session.results[session.index] = correct;
      if (correct) session.score++;
      const bs = session.byStation[task.station] || { right: 0, total: 0 };
      bs.total++;
      if (correct) bs.right++;
      session.byStation[task.station] = bs;
      KF.answer(SLUG, correct);
      if (opts.onAnswer) {
        try {
          opts.onAnswer(task, correct);
        } catch (e) {
          console.warn('KFExam: onAnswer failed', e);
        }
      }
      const tp = data.topics[task.station] || { right: 0, total: 0 };
      tp.total++;
      if (correct) tp.right++;
      data.topics[task.station] = tp;
      saveData();
      drawDots();
      if (correct) {
        $('goals-n').textContent = String(session.score);
        const g = $('goals');
        g.classList.remove('bump');
        void g.offsetWidth;
        if (!reduced()) g.classList.add('bump');
      }
      const exam = session.mode === 'exam';
      if (exam && !correct) {
        session.cards++;
        drawCards();
      }
      const red = exam && !correct && session.cards === RED;
      const card =
        exam &&
        !correct &&
        session.cards <= RED &&
        h(
          'div',
          { class: 'ref' },
          h('span', { class: `ref-card ${red ? 'r' : 'y'}`, 'aria-hidden': 'true' }),
          h(
            'div',
            {},
            h('p', { class: 'fb-title', text: red ? T('red') : T('yellow') }),
            h('p', { text: red ? T('redText') : T('yellowText') }),
          ),
        );

      const fixText = task.type === 'tf' && task.truth === false && task.fix ? task.fix : null;
      const box = h(
        'div',
        { class: `fb ${correct ? 'ok' : 'miss'}` },
        card,
        h('p', {
          class: 'fb-title',
          text: correct
            ? `${info.soft ? T('praiseSoft') : pick(lists.praise)} ⚽`
            : `${card ? '' : `${T('almost')} `}${info.answer ? T('answerIs', { a: info.answer }) : T('seeRight')}`,
        }),
        info.note && h('p', { text: info.note }),
        fixText && h('p', { class: 'fb-fix', text: T('fix', { text: fixText }) }),
        task.fact && h('p', { class: 'fb-fact', text: `💡 ${task.fact}` }),
      );
      const last = session.index === session.tasks.length - 1;
      const next = h('button', { class: 'btn btn-dark', type: 'button', onclick: goNext }, last ? T('result') : T('next'));
      const actions = h(
        'div',
        { class: 'fb-actions' },
        next,
        red && h('button', { class: 'btn btn-light', type: 'button', onclick: startExam }, T('restart')),
      );
      ctrl = { onKey: (e) => (e.key === 'Enter' ? (next.click(), true) : false) };
      // The sheet is sticky, so it is in view at once (scrollIntoView would do nothing). When it covers the end of the task,
      // scroll down just enough to set it in its place: on a laptop that is a few lines, the prompt stays on screen.
      KFG.feedback($('feedback'), box, actions, { scroll: false });
      const hidden = document.documentElement.scrollHeight - innerHeight - scrollY;
      if (hidden > 0) scrollBy({ top: hidden, behavior: reduced() ? 'instant' : 'smooth' });
    };

    const goNext = () => {
      session.index++;
      if (session.index >= session.tasks.length) finish();
      else nextTask();
    };

    // ---------- Finish ----------
    const starSvg = (/** @type {boolean} */ on) =>
      h('span', {
        class: on ? 'on' : 'off',
        html: '<svg viewBox="0 0 48 46" aria-hidden="true"><path d="M24 2l6.5 14.3 15.5 1.6-11.6 10.4 3.3 15.3L24 35.8 10.3 43.6l3.3-15.3L2 17.9l15.5-1.6z" fill="#f2b218" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/></svg>',
      });

    const toHub = () => {
      ctrl = null;
      session = null;
      renderHub();
      show('hub');
    };
    const reviewStation = (/** @type {ExamStation} */ s) => () => {
      renderHub();
      show('hub');
      openIntro(s);
    };

    const finish = () => {
      ctrl = null;
      const { score, tasks, mode } = session;
      const max = tasks.length;
      // The perfect-round bonus is paid until the station (or the exam) is done perfectly once.
      const old = mode === 'station' ? data.st[session.station] : null;
      const done = mode === 'station' ? !!old && old.best >= old.max : data.exam?.n >= NOTA_MAX;
      // Stations and the exam have different lengths but share one catalog record: report both as a nota out of 10.
      const res = KF.finishGame(SLUG, { score: Math.round((score / max) * NOTA_MAX), max: NOTA_MAX, bonus: done ? 0 : PERFECT_BONUS });
      const coins = KF.get().coins - session.startCoins;
      const bonus = res.bonus ? T('perfectBonus') : '';
      const el = $('finish');
      if (mode === 'station') {
        const id = session.station;
        const st = stationOf(id);
        const stars = starsFor(score, max);
        const prev = data.st[id];
        const rec = {
          best: Math.max(prev?.best || 0, score),
          max,
          stars: Math.max(prev?.stars || 0, stars),
          plays: (prev?.plays || 0) + 1,
        };
        if (prev && prev.best > score) rec.max = prev.max;
        data.st[id] = rec;
        saveData();
        const passed = stars >= 2;
        const nextSt = STATIONS[STATIONS.indexOf(st) + 1];
        const buttons = [];
        if (passed && nextSt) {
          buttons.push(
            h(
              'button',
              {
                class: 'btn',
                type: 'button',
                onclick: () => {
                  renderHub();
                  show('hub');
                  openIntro(nextSt);
                },
              },
              T('nextStation'),
            ),
          );
        }
        buttons.push(
          h(
            'button',
            { class: `btn ${passed && nextSt ? 'btn-light' : 'btn-dark'}`, type: 'button', onclick: () => startStation(id) },
            T('again'),
          ),
        );
        buttons.push(h('button', { class: 'btn btn-light', type: 'button', onclick: toHub }, T('toHub')));
        const need = Math.ceil(0.7 * max);
        el.replaceChildren(
          h('p', { class: 'eyebrow', text: `${st.icon} ${st.title}` }),
          h('h1', { text: passed ? T('stationPassed') : T('stationDone') }),
          h(
            'div',
            { class: 'big-stars', 'aria-label': T('stars', { n: stars }) },
            [0, 1, 2].map((i) => starSvg(i < stars)),
          ),
          h('div', { class: 'score-pill' }, `${score} / ${max}`, h('small', { text: '⚽' })),
          h('p', {
            class: 'msg',
            text: `${passed ? T('stationGreat') : T('stationKeep', { need, n: max })} ${T('stationMsg', { coins })}${bonus}`,
          }),
          h('div', { class: 'actions' }, buttons),
        );
        if (stars >= 2) KFUI.confetti();
      } else {
        const g = gradeFor(score, max);
        if (!data.exam || g.n >= data.exam.n) data.exam = { n: g.n, grade: g.label, nota: g.nota };
        saveData();
        const rows = STATIONS.filter((s) => session.byStation[s.id]).map((s) => {
          const v = session.byStation[s.id];
          const pct = Math.round((v.right / v.total) * 100);
          return h(
            'div',
            { class: 'rrow' },
            h('span', { class: 'nm', text: `${s.icon} ${s.title}` }),
            h('span', { class: `bar${v.right < v.total ? ' low' : ''}` }, h('i', { style: `width:${Math.max(pct, 4)}%` })),
            h('b', { text: `${v.right}/${v.total}` }),
            v.right < v.total
              ? h('button', { class: 'btn btn-light', type: 'button', onclick: reviewStation(s) }, T('review2'))
              : h('span', { class: 'okmark', 'aria-hidden': 'true', text: '✓' }),
          );
        });
        const y = Math.min(session.cards, RED - 1);
        const r = session.cards >= RED ? 1 : 0;
        el.replaceChildren(
          h('p', { class: 'eyebrow', text: T('examDone') }),
          h(
            'div',
            { class: 'grade', style: `--gc:${GRADE_COLORS[g.i]}` },
            h('b', { text: g.label }),
            h('span', { text: T('nota', { n: g.nota }) }),
          ),
          h('br'),
          h('div', { class: 'score-pill' }, `${score} / ${max}`, h('small', { text: '⚽' })),
          h('p', {
            class: 'msg',
            text: `${g.i >= 4 ? T('examMsgTop') : g.i >= 2 ? T('examMsgOk') : T('examMsgLow')} ${session.cards ? T('examCards', { y, r }) : T('noCards')} ${T('stationMsg', { coins })}${bonus}`,
          }),
          h('div', { class: 'report' }, h('h2', { text: T('byTopic') }), rows),
          h(
            'div',
            { class: 'actions' },
            h('button', { class: 'btn btn-dark', type: 'button', onclick: startExam }, T('again')),
            h('button', { class: 'btn btn-light', type: 'button', onclick: toHub }, T('toHub')),
          ),
        );
        if (g.i >= 3) KFUI.confetti();
      }
      show('finish');
      /** @type {HTMLElement | null} */ (el.querySelector('.actions .btn'))?.focus({ preventScroll: true });
    };

    // ---------- Renderer context ----------
    // Mouse/pen drag as an extra to tap-tap (touch keeps native scrolling, so it uses taps only).
    /** @type {ExamRendererCtx['draggable']} */
    const draggable = (el, { onStart, targets, onDrop }) => {
      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.button !== 0 || /** @type {HTMLButtonElement} */ (el).disabled) return;
        const sx = e.clientX;
        const sy = e.clientY;
        /** @type {HTMLElement | null} */
        let ghost = null;
        /** @type {HTMLElement | null} */
        let over = null;
        const target = (/** @type {PointerEvent} */ ev) =>
          /** @type {HTMLElement | null} */ (document.elementFromPoint(ev.clientX, ev.clientY)?.closest(targets));
        const move = (/** @type {PointerEvent} */ ev) => {
          if (!ghost) {
            if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
            onStart?.();
            ghost = /** @type {HTMLElement} */ (el.cloneNode(true));
            ghost.classList.add('ghost');
            ghost.removeAttribute('id');
            document.body.append(ghost);
            el.classList.add('dragging');
          }
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
          const t = target(ev);
          if (t !== over) {
            over?.classList.remove('over');
            over = t;
            over?.classList.add('over');
          }
        };
        const up = (/** @type {PointerEvent} */ ev) => {
          removeEventListener('pointermove', move);
          removeEventListener('pointerup', up);
          if (!ghost) return;
          ghost.remove();
          el.classList.remove('dragging');
          over?.classList.remove('over');
          const t = target(ev);
          // Swallow the click that follows a drag (it fires in this same task, if at all).
          const swallow = (/** @type {Event} */ c) => {
            c.stopImmediatePropagation();
            c.preventDefault();
          };
          el.addEventListener('click', swallow, { capture: true, once: true });
          setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0);
          if (t) onDrop(t);
        };
        addEventListener('pointermove', move);
        addEventListener('pointerup', up);
      });
    };

    const artEl = (/** @type {string | undefined} */ key) => {
      const svg = key && art?.art(key);
      return svg ? h('div', { class: 'art' }, svg) : null;
    };

    /** @type {ExamRendererCtx} */
    const ctx = {
      h,
      T,
      shuffle,
      pick,
      shake,
      reduced,
      LETTERS,
      art,
      content: unit,
      resolve,
      answered: () => !session || !!session.answered,
      setKeys: (onKey) => {
        ctrl = { onKey };
      },
      hint: () => h('p', { class: 'inline-hint', role: 'status' }),
      kbdHint: (text) => h('p', { class: 'kbd-hint', text }),
      // A layout block with the task art (if any) next to / above the controls.
      withArt: (task, ...kids) => {
        const el = artEl(task.art);
        if (!el) return /** @type {(Node | string)[]} */ (kids);
        const wide = String(task.art).startsWith('world-highlight:');
        return [h('div', { class: `with-art side${wide ? ' wide' : ''}` }, el, h('div', { class: 'side-col' }, kids))];
      },
      draggable,
      fallback: (task, work, options) => types.choice(task, work, ctx, options),
    };

    const renderTask = (/** @type {ExamTask} */ task) => {
      const work = $('work');
      work.replaceChildren();
      ctrl = null;
      (types[task.type] || types.choice)(task, work, ctx);
    };

    // ---------- Keyboard ----------
    const midRound = () => session && !$('play').hidden && (session.results.length > 0 || session.index > 0);
    const askQuit = () => {
      if (!midRound()) toHub();
      else KFG.confirm(/** @type {HTMLDialogElement} */ ($('quit-dlg')), { onYes: toHub });
    };
    KFG.keys({
      ctrl: () => ctrl,
      active: () => !$('play').hidden,
      onEscape: () => {
        if (!$('read-screen').hidden) {
          toHub();
          return true;
        }
        if (!$('play').hidden) {
          askQuit();
          return true;
        }
        if (!$('finish').hidden) toHub();
        return false;
      },
    });

    // Parents' test mode: expose the session for automated checks.
    if (KF.TEST_MODE) {
      /** @type {any} */ (window)[unit.testHook || '__exam'] = {
        get session() {
          return session;
        },
        startStation: (/** @type {string} */ id, /** @type {boolean} */ read) => startStation(id, read),
        startExam,
        toHub,
        play: (/** @type {ExamSessionTask[]} */ tasks) => begin({ mode: 'station', station: tasks[0].station, tasks }),
      };
    }
    renderHub();
  };

  window.KFExam = { mount, validate, types: {} };
})();
