// Lengua Castellana 3.º (Amor de Dios, primer trimestre), Tema 3 «Poemas para niños» — exam unit «La liga de las palabras».
// Source: book pp. 31, 38–55, transcribed in .pi/book-le/unit3.md (+ unit1.md p. 11 for the full stop); the book is not in git.
// The sentences are our own (football flavour); only the traditional trabalenguas are quoted.
// Plain data, no logic (a few small builders below): window.LP_CONTENT is an ExamUnit (types/exam.d.ts, engine in shared/exam/).
//
// Task types: choice, tf, sort, order, pairs, fill, pick (shared/exam/types.js); `fix` is lengua-mundo's (LE_TYPES.fix, unchanged);
// the unit's own (types.js here):
//   forge      { q, stems, suffixes, answer: [stem, suffix], word }        word factory: base + suffix (spelling changes are authored
//                                                                           as stems: 'panad' + 'ero')
//   save       { q, word, gaps, ctx?, reasons, rule }                      keeper save: b/v into the gaps + the reason (rule id)
//   substitute { q, chunks, target, options, answer, result }              change of player: a pronoun replaces a phrase
// Rule ids of `save`: aba = -aba, -abas, -ábamos, -abais, -aban · bir = verbs in -bir · exc = hervir, servir, vivir (v) ·
//   brbl = b before r or l · memo = learnt by heart (words with v, and b words without a rule).
// `vocab` = the station's key words in Ukrainian (Ukrainian site only); `text` = the short rule note (our own words, read aloud).
//
// COVERAGE MATRIX (rule / word list → tasks). Station, task numbers in order of the file.
// Palabras derivadas y sufijos (derivadas)
//   primitiva / derivada / sufijo ......... 7 (primitiva de heladería), 8 (sufijo de enfermero)
//   -ista ................................ 1 forge florista, 10 sort (florista)
//   -ero / -era .......................... 2 forge panadero, 6 forge bombera, 8 choice (enfermero), 10 sort (enfermero)
//   -or / -ora ........................... 12 choice (pintor, pintora), 10 sort (pintor)
//   -dor / -dora ......................... 4 forge lavadora, 5 forge explorador
//   -ería (lugares) ...................... 3 forge librería, 7, 9 pairs (panadería, zapatería, papelería, frutería), 10 sort, 11 fill frutería
//   oficios y lugares .................... 10 sort (oficio / lugar; trastero)
// Ortografía B (verbos-b)
//   -aba ................................. 1 jugaba · -abas 2 pensabas · -ábamos 3 saltábamos · -abais 4 comprabais · -aban 9 pick (cantaban), 8 fill (cantaba)
//   -bir ................................. 5 recibe, 6 subimos, 9 fill (escribe), 10 sort (recibir, subir, escribir)
//   excepciones hervir, servir, vivir .... 7 vivía, 10 sort (servir, hervir, vivir), 12 tf
// Ortografía B y V (bv)
//   b antes de r / l ..................... 1 brincar, 2 doblar, 3 nublado, 8 pick (establo, cabra, blanca), 10 tf
//   v y b sin regla (de memoria) ......... 4 verano, 5 botas, 6 llave, 7 sort (cabeza, caballo, nueve, cueva, nivel, invierno, rabia), 9 fill (balón)
// Pronombres personales (pronombres)
//   yo ................................... 1 choice, 10 sort · tú ... 14 choice (hablas con Pablo), 10 sort, 9 pairs · usted ... 5 choice, 9 pairs, 10 sort
//   él / ella ............................ 3 substitute (Rocky), 10 sort · ellos 2 substitute (mixto) · ellas 1 substitute, 10 sort · ella 7 substitute (la portera)
//   nosotros / nosotras .................. 4 substitute (mi hermano y yo), 5 substitute (Marta + prima), 13 pick
//   vosotros / vosotras .................. 6 substitute (Hugo y tú), 12 choice (tres amigas)
//   ustedes .............................. 9 pairs, 10 sort · quién habla / a quién / de quién ... 10 sort, 11 choice
// Literatura: prosa, verso y trabalenguas (literatura, trabalenguas)
//   literario / no literario ............. literatura 1 sort, 8 choice, 7 pairs
//   prosa / verso, líneas, versos ........ literatura 2, 3, 6, 7 · rima (a menudo, no siempre) 4, 5, 6
//   trabalenguas ......................... trabalenguas 1 def, 2 tigres, 3 coco, 4 San Roque (order), 5 pick, 6 sonido, 7 tf, 8 choice
// Tema 2: c, z, s (czs)
//   z antes de a, o, u ................... 1 fill zorro, 6 sort, 7 pick · c antes de e, i ... 2 fill cena, 3 choice cereza, 6 sort
//   s con todas las vocales .............. 6 sort · plural z→c .................... 4 pairs, 8 choice · c suena fuerte (casa) ... 5 tf
// Tema 1: el punto y la mayúscula (puntos)
//   punto y seguido / aparte / final ..... 4, 5, 6 choice · mayúscula tras punto y en nombres propios .... 1, 2, 3 fix, 7 pick
//   días y meses en minúscula ............ 1, 3 fix, 8 sort
'use strict';

window.LP_CONTENT = /** @type {ExamUnit} */ (
  (() => {
    const DOTS = ['Punto y seguido', 'Punto y aparte', 'Punto final'];
    const DOT_Q = '¿Qué punto es el que está destacado?';
    const BV_BINS = [
      { id: 'b', label: 'b', icon: '🅱️' },
      { id: 'v', label: 'v', icon: '🟢' },
    ];
    const SAVE_Q = '¿B o V? Completa la palabra y elige la regla.';
    const SUB_Q = 'Busca quién hace la acción y cámbialo por un pronombre.';

    /** Word factory: a stem and a suffix make the word. */
    const forge = (
      /** @type {string} */ q,
      /** @type {string[]} */ stems,
      /** @type {string[]} */ suffixes,
      /** @type {[string, string]} */ answer,
      /** @type {string} */ fact,
    ) => ({
      type: 'forge',
      q,
      stems,
      suffixes,
      answer,
      word: answer.join(''),
      fact,
    });
    /** Keeper save: gaps = indices of the b / v in the word. */
    const save = (
      /** @type {string} */ word,
      /** @type {number[]} */ gaps,
      /** @type {[string, string]} */ ctx,
      /** @type {string[]} */ reasons,
      /** @type {string} */ rule,
      /** @type {string} */ fact,
    ) => ({ type: 'save', q: SAVE_Q, word, gaps, ctx, reasons, rule, fact });
    /** Change of player: the chunk `target` becomes `answer`. */
    const sub = (
      /** @type {string} */ q,
      /** @type {string[]} */ chunks,
      /** @type {number} */ target,
      /** @type {string[]} */ options,
      /** @type {string} */ answer,
      /** @type {string} */ result,
      /** @type {string} */ fact,
    ) => ({ type: 'substitute', q, chunks, target, options, answer, result, fact });

    /** @type {ExamStation[]} */
    const stations = [
      // ---------------- Palabras derivadas y sufijos ----------------
      {
        id: 'derivadas',
        title: 'La fábrica de palabras',
        icon: '🏭',
        intro:
          'Una palabra primitiva más un sufijo da una palabra derivada. Con -ero, -era, -ista, -or, -ora y -dor/-dora hacemos oficios; con -ería, lugares.',
        vocab: [
          ['la palabra primitiva', 'первинне слово'],
          ['la palabra derivada', 'похідне слово'],
          ['el sufijo', 'суфікс'],
          ['la panadería', 'пекарня'],
          ['la librería', 'книгарня'],
          ['la heladería', 'морозивня'],
          ['la bombera', 'пожежниця'],
          ['el explorador', 'дослідник'],
        ],
        text: {
          title: 'La fábrica de palabras',
          paragraphs: [
            'Una palabra primitiva, como «flor», cambia si le pegamos un sufijo al final: «florista». Con -ero, -era, -ista, -or, -ora y -dor, -dora nombramos oficios; con -ería, lugares.',
          ],
        },
        tasks: [
          forge(
            'Mi tía vende flores y hace ramos. Es una…',
            ['flor', 'pan', 'libr'],
            ['ista', 'ero', 'ería'],
            ['flor', 'ista'],
            'flor + ista = florista.',
          ),
          forge(
            'Mi vecino hace el pan en el horno. Es un…',
            ['pan', 'panad', 'libr'],
            ['ero', 'ería', 'ista'],
            ['panad', 'ero'],
            'La palabra primitiva es pan; la derivada, panadero.',
          ),
          forge(
            'El lugar donde se venden libros es una…',
            ['libr', 'helad', 'frut'],
            ['ería', 'ero', 'ista'],
            ['libr', 'ería'],
            'libro → libr + ería = librería: un lugar.',
          ),
          forge(
            'La máquina que lava la ropa es la…',
            ['lava', 'seca', 'corre'],
            ['dora', 'ería'],
            ['lava', 'dora'],
            'lavar → lava + dora = lavadora.',
          ),
          forge(
            'Mi tío explora selvas y montañas. Es un…',
            ['explora', 'corre'],
            ['dor', 'ería', 'ista'],
            ['explora', 'dor'],
            'explorar → explora + dor = explorador.',
          ),
          forge(
            'Marta apaga incendios con una manguera. Es una…',
            ['bomb', 'pint', 'cocin'],
            ['era', 'ora'],
            ['bomb', 'era'],
            'bomba → bomb + era = bombera.',
          ),
          {
            type: 'choice',
            q: '¿Cuál es la palabra primitiva de «heladería»?',
            options: ['helado', 'heladero', 'hielo'],
            answer: 0,
            fact: 'helado + -ería = heladería.',
          },
          {
            type: 'choice',
            q: 'En la palabra «enfermero», ¿cuál es el sufijo?',
            options: ['-ero', '-ista', '-ería'],
            answer: 0,
            fact: 'enferm + ero: el sufijo -ero va al final.',
          },
          {
            type: 'pairs',
            q: 'Une cada palabra con el lugar donde se vende.',
            pairs: [
              ['pan', 'panadería'],
              ['zapato', 'zapatería'],
              ['papel', 'papelería'],
              ['fruta', 'frutería'],
            ],
          },
          {
            type: 'sort',
            q: '¿Es el nombre de un oficio o de un lugar?',
            bins: [
              { id: 'oficio', label: 'Oficio o profesión', icon: '🧑‍🔧' },
              { id: 'lugar', label: 'Lugar', icon: '🏪' },
            ],
            items: [
              { text: 'bombera', bin: 'oficio' },
              { text: 'florista', bin: 'oficio' },
              { text: 'pintor', bin: 'oficio' },
              { text: 'enfermero', bin: 'oficio' },
              { text: 'librería', bin: 'lugar' },
              { text: 'heladería', bin: 'lugar' },
              { text: 'trastero', bin: 'lugar' },
              { text: 'frutería', bin: 'lugar' },
            ],
          },
          {
            type: 'fill',
            q: 'Completa con una palabra derivada de «fruta».',
            text: 'En la ___ de la esquina compramos manzanas y peras.',
            answer: 'frutería',
            fact: 'fruta + -ería: el lugar donde se vende fruta.',
          },
          {
            type: 'choice',
            q: 'Mi padre pinta cuadros y mi madre también. Él es pintor y ella es…',
            options: ['pintora', 'pintera', 'pintista'],
            answer: 0,
            fact: 'Con -or / -ora: pintor, pintora.',
          },
        ],
      },

      // ---------------- Ortografía: la b en los verbos ----------------
      {
        id: 'verbos-b',
        title: 'La liga de la B',
        icon: '🅱️',
        intro:
          'Los verbos con -aba, -abas, -ábamos, -abais y -aban llevan b. También los verbos en -bir. Las excepciones, con v: hervir, servir y vivir.',
        vocab: [
          ['el verbo', 'дієслово'],
          ['la terminación', 'закінчення'],
          ['el infinitivo', 'інфінітив'],
          ['la excepción', 'виняток'],
          ['recibir', 'отримувати'],
          ['subir', 'підніматися'],
          ['hervir', 'кипіти'],
          ['servir', 'подавати; бути корисним'],
        ],
        text: {
          title: 'La liga de la B',
          paragraphs: [
            'Escribimos con b los verbos terminados en -aba, -abas, -ábamos, -abais y -aban: jugaba, cantábamos. También los verbos en -bir, como recibir y subir. Excepciones con v: hervir, servir y vivir.',
          ],
        },
        tasks: [
          save(
            'jugaba',
            [4],
            ['Ayer yo', 'al fútbol con mis primos.'],
            ['aba', 'bir', 'memo'],
            'aba',
            'Termina en -aba: se escribe con b.',
          ),
          save(
            'pensabas',
            [5],
            ['Tú siempre', 'en el siguiente pase.'],
            ['aba', 'brbl', 'exc'],
            'aba',
            'Termina en -abas: se escribe con b.',
          ),
          save('saltábamos', [5], ['Antes nosotros', 'muy alto.'], ['aba', 'bir', 'exc'], 'aba', 'Termina en -ábamos: se escribe con b.'),
          save(
            'comprabais',
            [6],
            ['Vosotros', 'las entradas en la taquilla.'],
            ['aba', 'bir', 'brbl'],
            'aba',
            'Termina en -abais: se escribe con b.',
          ),
          save(
            'recibe',
            [4],
            ['Mi equipo', 'una copa muy bonita.'],
            ['bir', 'aba', 'exc'],
            'bir',
            'Viene de recibir, un verbo en -bir: se escribe con b.',
          ),
          save(
            'subimos',
            [2],
            ['Hoy', 'todos al autobús.'],
            ['bir', 'aba', 'brbl'],
            'bir',
            'Viene de subir, un verbo en -bir: se escribe con b.',
          ),
          save(
            'vivía',
            [0, 2],
            ['Mi abuelo', 'en un pueblo pequeño.'],
            ['exc', 'bir', 'aba'],
            'exc',
            'Vivir es una excepción: se escribe con v.',
          ),
          {
            type: 'fill',
            q: 'Completa con el verbo «cantar» (yo, pasado).',
            text: 'Cuando era pequeño, siempre ___ en el coro.',
            answer: 'cantaba',
            extra: 'v',
            fact: 'cantaba termina en -aba: lleva b.',
          },
          {
            type: 'fill',
            q: 'Completa con el verbo «escribir» (él, presente).',
            text: 'Hoy mi hermano ___ una carta al capitán.',
            answer: 'escribe',
            extra: 'v',
            fact: 'escribir termina en -bir: escribe lleva b.',
          },
          {
            type: 'sort',
            q: '¿Qué letra falta: b o v?',
            bins: BV_BINS,
            items: [
              { text: 'nada_a', bin: 'b' },
              { text: 'canta_ais', bin: 'b' },
              { text: 'reci_ir', bin: 'b' },
              { text: 'su_ir', bin: 'b' },
              { text: 'escri_ir', bin: 'b' },
              { text: 'ser_ir', bin: 'v' },
              { text: 'her_ir', bin: 'v' },
              { text: 'vi_ir', bin: 'v' },
            ],
          },
          {
            type: 'pick',
            q: 'Toca las palabras que se escriben con b.',
            text: 'Ayer yo [juga_a], tú [pensa_as] y ellos [canta_an], pero Eva _i_ía en otra ciudad.',
            fact: 'Vivía no acaba en -aba: es una excepción y lleva v.',
          },
          {
            type: 'tf',
            q: 'Los verbos terminados en -bir, como subir, se escriben con v.',
            truth: false,
            fix: 'Subir y recibir se escriben con b. Solo hervir, servir y vivir llevan v.',
          },
        ],
      },

      // ---------------- Ortografía: b y v ----------------
      {
        id: 'bv',
        title: 'Paradas con B y V',
        icon: '🧤',
        intro: 'La b y la v suenan igual. Antes de r y de l va siempre b. Las demás palabras con b o con v se aprenden de memoria.',
        vocab: [
          ['suenan igual', 'звучать однаково'],
          ['antes de', 'перед'],
          ['de memoria', 'напам’ять'],
          ['el brazo', 'рука (від плеча)'],
          ['doblar', 'складати'],
          ['nublado', 'хмарно'],
          ['el verano', 'літо'],
          ['la llave', 'ключ'],
        ],
        text: {
          title: 'Paradas con B y V',
          paragraphs: [
            'La b y la v suenan igual, así que ¡ojo! Antes de r y de l siempre va b: brazo, doblar. En las demás palabras, hay que aprenderlas de memoria, como verano, llave o botas.',
          ],
        },
        tasks: [
          save('brincar', [0], ['Al conejo le gusta', 'por el campo.'], ['brbl', 'bir', 'memo'], 'brbl', 'La b va antes de r: brincar.'),
          save('doblar', [2], ['Tengo que', 'mi camiseta.'], ['brbl', 'aba', 'memo'], 'brbl', 'La b va antes de l: doblar.'),
          save('nublado', [2], ['Hoy el cielo está', 'y no hay sol.'], ['brbl', 'bir', 'exc'], 'brbl', 'La b va antes de l: nublado.'),
          save(
            'verano',
            [0],
            ['En', 'hace mucho calor.'],
            ['memo', 'aba', 'brbl'],
            'memo',
            'Verano se escribe con v: hay que aprenderlo de memoria.',
          ),
          save(
            'botas',
            [0],
            ['Me pongo las', 'para jugar.'],
            ['memo', 'bir', 'aba'],
            'memo',
            'Botas se escribe con b: hay que aprenderlo de memoria.',
          ),
          save(
            'llave',
            [3],
            ['Abro la puerta con la', 'del vestuario.'],
            ['memo', 'exc', 'bir'],
            'memo',
            'Llave se escribe con v: hay que aprenderlo de memoria.',
          ),
          {
            type: 'sort',
            q: '¿Qué letra falta: b o v?',
            bins: BV_BINS,
            items: [
              { text: 'ca_eza', bin: 'b' },
              { text: 'ca_allo', bin: 'b' },
              { text: 'ta_la', bin: 'b' },
              { text: 'ra_ia', bin: 'b' },
              { text: 'nue_e', bin: 'v' },
              { text: 'cue_a', bin: 'v' },
              { text: 'ni_el', bin: 'v' },
              { text: 'in_ierno', bin: 'v' },
            ],
          },
          {
            type: 'pick',
            q: 'Toca las palabras que se escriben con b.',
            text: 'En el [esta_lo] hay una [ca_ra] [_lanca] y una _aca negra.',
            fact: 'Establo, cabra y blanca: la b va antes de l o de r. Vaca se aprende de memoria.',
          },
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'El ___ de fútbol es redondo y rueda por el campo.',
            answer: 'balón',
            extra: 'v',
            fact: 'Balón se escribe con b: hay que aprenderlo.',
          },
          {
            type: 'tf',
            q: 'Antes de r y de l siempre se escribe b, nunca v.',
            truth: true,
          },
        ],
      },

      // ---------------- Pronombres personales ----------------
      {
        id: 'pronombres',
        title: 'El equipo de los pronombres',
        icon: '👥',
        intro: 'Los pronombres personales ocupan el lugar de un nombre. Unos hablan, otros escuchan y de otros se habla.',
        vocab: [
          ['el pronombre', 'займенник'],
          ['yo / nosotros', 'я / ми'],
          ['tú / vosotros', 'ти / ви (неформально)'],
          ['usted / ustedes', 'Ви (ввічливо)'],
          ['él / ella', 'він / вона'],
          ['ellos / ellas', 'вони'],
          ['hablar', 'говорити'],
        ],
        text: {
          title: 'El equipo de los pronombres',
          paragraphs: [
            'Los pronombres personales ocupan el lugar de un nombre. Yo y nosotros hablan; tú, usted, vosotros y ustedes escuchan; él, ella, ellos y ellas son de quienes se habla.',
          ],
        },
        tasks: [
          sub(
            SUB_Q,
            ['En el recreo,', 'Celia y Olivia', 'juegan al fútbol.'],
            1,
            ['Ella', 'Ellas', 'Ellos', 'Nosotras'],
            'Ellas',
            'En el recreo, ellas juegan al fútbol.',
            'Dos niñas de las que se habla: ellas.',
          ),
          sub(
            SUB_Q,
            ['Lucía y Marcos', 'comen', 'un bocadillo.'],
            0,
            ['Ellas', 'Ellos', 'Vosotros', 'Él'],
            'Ellos',
            'Ellos comen un bocadillo.',
            'Una niña y un niño: se usa ellos.',
          ),
          sub(
            SUB_Q,
            ['Después,', 'el perro Rocky', 'corre tras el balón.'],
            1,
            ['Él', 'Ella', 'Ellos', 'Yo'],
            'Él',
            'Después, él corre tras el balón.',
            'Los pronombres también sustituyen a los animales.',
          ),
          sub(
            `Habla Leo. ${SUB_Q}`,
            ['Hoy', 'mi hermano y yo', 'jugamos al fútbol.'],
            1,
            ['Nosotros', 'Nosotras', 'Vosotros', 'Ellos'],
            'Nosotros',
            'Hoy nosotros jugamos al fútbol.',
            'Mi hermano y yo: quien habla y un chico, nosotros.',
          ),
          sub(
            `Habla Marta, una niña. ${SUB_Q}`,
            ['En el coro,', 'mi prima Sara y yo', 'cantamos.'],
            1,
            ['Nosotras', 'Nosotros', 'Ellas', 'Vosotras'],
            'Nosotras',
            'En el coro, nosotras cantamos.',
            'Marta y su prima: quien habla y otra niña, nosotras.',
          ),
          sub(
            `Hablas con Hugo y con una amiga. ${SUB_Q}`,
            ['Mañana', 'Hugo y tú', 'vais al estadio.'],
            1,
            ['Vosotros', 'Vosotras', 'Ustedes', 'Ellos'],
            'Vosotros',
            'Mañana vosotros vais al estadio.',
            'Hugo y tú: a quienes se habla, vosotros.',
          ),
          sub(
            SUB_Q,
            ['La portera', 'para', 'todos los penaltis.'],
            0,
            ['Ella', 'Ellas', 'Él', 'Yo'],
            'Ella',
            'Ella para todos los penaltis.',
            'Una chica de la que se habla: ella.',
          ),
          {
            type: 'choice',
            q: 'El capitán dice: «___ marcaré el gol». ¿Qué pronombre falta?',
            options: ['Yo', 'Tú', 'Ellos'],
            answer: 0,
            fact: 'Quien habla de sí mismo usa yo.',
          },
          {
            type: 'pairs',
            q: 'Une cada pronombre con su plural.',
            pairs: [
              ['yo', 'nosotros'],
              ['tú', 'vosotros'],
              ['usted', 'ustedes'],
              ['él', 'ellos'],
            ],
          },
          {
            type: 'sort',
            q: '¿Quién habla, a quién se habla o de quién se habla?',
            bins: [
              { id: 'habla', label: 'Quien habla', icon: '🗣️' },
              { id: 'escucha', label: 'A quien se habla', icon: '👂' },
              { id: 'de', label: 'De quien se habla', icon: '👤' },
            ],
            items: [
              { text: 'yo', bin: 'habla' },
              { text: 'nosotras', bin: 'habla' },
              { text: 'tú', bin: 'escucha' },
              { text: 'usted', bin: 'escucha' },
              { text: 'vosotros', bin: 'escucha' },
              { text: 'ustedes', bin: 'escucha' },
              { text: 'él', bin: 'de' },
              { text: 'ella', bin: 'de' },
              { text: 'ellas', bin: 'de' },
            ],
          },
          {
            type: 'choice',
            q: 'Hablas con la directora del colegio y la tratas con respeto. ¿Qué pronombre usas?',
            options: ['Usted', 'Vosotros', 'Ellas'],
            answer: 0,
            fact: 'A una persona a la que tratamos con respeto le decimos usted.',
          },
          {
            type: 'choice',
            q: 'Hablas con tres amigas a la vez. ¿Qué pronombre usas?',
            options: ['Vosotras', 'Ellas', 'Nosotras'],
            answer: 0,
            fact: 'Con quienes hablas, en plural y todas chicas: vosotras.',
          },
          {
            type: 'pick',
            q: 'Toca los pronombres personales.',
            text: 'Eva dice: «[Nosotros] jugamos hoy y [ellos] juegan mañana.»',
            fact: 'Nosotros (quien habla) y ellos (de quienes se habla).',
          },
          {
            type: 'choice',
            q: 'Hablas con tu amigo Pablo. ¿Qué pronombre usas para hablarle a él?',
            options: ['Tú', 'Él', 'Nosotros', 'Vosotros'],
            answer: 0,
            fact: 'A una persona de confianza, a la que hablas, le dices tú.',
          },
        ],
      },

      // ---------------- Prosa y verso ----------------
      {
        id: 'literatura',
        title: 'Prosa o verso',
        icon: '📜',
        intro:
          'Un texto literario emociona o inventa mundos; uno no literario cuenta cosas reales. Los literarios pueden estar en prosa o en verso.',
        vocab: [
          ['el texto literario', 'літературний текст'],
          ['no literario', 'нелітературний'],
          ['la prosa', 'проза'],
          ['el verso', 'рядок вірша'],
          ['la rima', 'рима'],
          ['el renglón', 'рядок (на сторінці)'],
          ['el poema', 'вірш'],
          ['la fábula', 'байка'],
        ],
        text: {
          title: 'Prosa o verso',
          paragraphs: [
            'Un texto literario emociona o inventa mundos; uno no literario cuenta hechos reales con claridad. La prosa ocupa todo el renglón. El verso se escribe en líneas cortas y a menudo rima.',
          ],
        },
        tasks: [
          {
            type: 'sort',
            q: '¿Es un texto literario o no literario?',
            bins: [
              { id: 'lit', label: 'Literario', icon: '📖' },
              { id: 'nolit', label: 'No literario', icon: '📰' },
            ],
            items: [
              { text: 'Un cuento de dragones', bin: 'lit' },
              { text: 'Un poema sobre la luna', bin: 'lit' },
              { text: 'Una fábula de la zorra y el cuervo', bin: 'lit' },
              { text: 'La noticia del partido de ayer', bin: 'nolit' },
              { text: 'Una receta de tortilla', bin: 'nolit' },
              { text: 'La palabra «balón» en el diccionario', bin: 'nolit' },
            ],
          },
          {
            type: 'choice',
            q: '¿Cómo está escrito este texto?',
            passage: 'El balón rueda veloz,\nel portero da un salto,\nel público da una voz:\n¡gol en el último asalto!',
            options: ['En verso', 'En prosa', 'Es un texto no literario'],
            answer: 0,
            fact: 'Cada línea es corta y es un verso; además riman veloz con voz y salto con asalto.',
          },
          {
            type: 'choice',
            q: '¿Cómo está escrito este texto?',
            passage: 'Ayer el equipo de Leo ganó el partido. Después, todos fueron a merendar y Leo contó cómo había marcado el gol.',
            options: ['En prosa', 'En verso', 'En trabalenguas'],
            answer: 0,
            fact: 'Las líneas ocupan todo el renglón: es prosa.',
          },
          {
            type: 'choice',
            q: 'Los versos suelen rimar. ¿Qué dos palabras riman aquí?',
            passage: 'Un gato valiente\nsaltó de repente\nal techo de la torre.',
            options: ['valiente y repente', 'gato y techo', 'saltó y torre'],
            answer: 0,
            fact: 'Valiente y repente terminan igual: riman.',
          },
          {
            type: 'tf',
            q: 'Todos los versos riman: si no hay rima, no es un verso.',
            truth: false,
            fix: 'Los versos suelen rimar, pero no siempre.',
          },
          {
            type: 'choice',
            q: '¿Verso o prosa? Mira las líneas.',
            passage: 'Hoy el sol\nse ha dormido\ndentro de una nube.',
            options: [
              'Verso: las líneas son cortas aunque no rimen',
              'Prosa: porque no tiene rima',
              'Texto no literario porque es muy corto',
            ],
            answer: 0,
            fact: 'Los versos suelen rimar, pero lo importante son las líneas cortas.',
          },
          {
            type: 'pairs',
            q: 'Une cada tipo de texto con lo que lo define.',
            pairs: [
              ['Texto no literario', 'Cuenta hechos reales con un mensaje claro'],
              ['Texto literario', 'Transmite sentimientos e ideas, a veces de mundos inventados'],
              ['Prosa', 'Las líneas ocupan todo el renglón'],
              ['Verso', 'Cada línea es corta y a menudo rima'],
            ],
          },
          {
            type: 'choice',
            q: '¿Es un texto literario o no literario?',
            passage: 'Horario de entrenamiento: martes y jueves, de 5 a 6 de la tarde, en el campo del colegio.',
            options: ['No literario: informa de algo real', 'Literario: cuenta un mundo inventado', 'Literario: está escrito en verso'],
            answer: 0,
            fact: 'Un horario da información real y clara: no es literario.',
          },
        ],
      },

      // ---------------- Trabalenguas ----------------
      {
        id: 'trabalenguas',
        title: 'Trabalenguas en la grada',
        icon: '🗣️',
        intro: 'Los trabalenguas son textos breves, casi siempre en verso, que cuesta decir en voz alta porque repiten sonidos parecidos.',
        vocab: [
          ['el trabalenguas', 'скоромовка'],
          ['pronunciar', 'вимовляти'],
          ['en voz alta', 'вголос'],
          ['el sonido', 'звук'],
          ['el tigre', 'тигр'],
          ['el trigal', 'пшеничне поле'],
          ['el rabo', 'хвіст'],
          ['repetir', 'повторювати'],
        ],
        text: {
          title: 'Trabalenguas en la grada',
          paragraphs: [
            'Los trabalenguas son textos breves, casi siempre en verso, hechos para que cueste decirlos en voz alta. Repiten sonidos parecidos. ¡Despacio al principio y cada vez más rápido!',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: '¿Qué es un trabalenguas?',
            options: ['Un texto breve y difícil de decir', 'Un poema largo que cuenta una aventura', 'Una carta que se escribe a un amigo'],
            answer: 0,
          },
          {
            type: 'fill',
            q: 'Completa el trabalenguas.',
            text: 'Tres tristes tigres comían trigo en un ___.',
            answer: 'trigal',
            fact: 'Tres tristes tigres comían trigo en un trigal. En un trigal, comían trigo tres tristes tigres.',
          },
          {
            type: 'fill',
            q: 'Completa el trabalenguas.',
            text: 'Como poco coco como, poco coco ___.',
            answer: 'compro',
            fact: 'Como poco coco como, poco coco compro.',
          },
          {
            type: 'order',
            q: 'Ordena las líneas del trabalenguas.',
            listen: 'El perro de San Roque no tiene rabo, porque Ramón Rodríguez se lo ha robado.',
            items: ['El perro de San Roque', 'no tiene rabo,', 'porque Ramón Rodríguez', 'se lo ha robado.'],
          },
          {
            type: 'fill',
            q: 'Escucha y completa el trabalenguas.',
            listen: 'El perro de San Roque no tiene rabo, porque Ramón Rodríguez se lo ha robado.',
            text: 'El perro de San Roque no tiene rabo, porque Ramón Rodríguez se lo ha ___.',
            answer: 'robado',
            fact: 'En este trabalenguas se repite el sonido fuerte de la r: Roque, rabo, Ramón, Rodríguez, robado.',
          },
          {
            type: 'choice',
            q: '¿Qué sonido se repite sin parar?',
            listen: 'Como poco coco como, poco coco compro.',
            passage: 'Como poco coco como,\npoco coco compro.',
            options: ['El sonido «c», como en coco', 'El sonido «r», como en rabo', 'El sonido «t», como en tigre'],
            answer: 0,
          },
          {
            type: 'tf',
            q: 'Los trabalenguas suelen ser textos largos, como las novelas.',
            truth: false,
            fix: 'Los trabalenguas son textos breves, generalmente en verso.',
          },
          {
            type: 'choice',
            q: '¿Cuál de estos textos es un trabalenguas?',
            options: ['Como poco coco como, poco coco compro.', 'Hoy llueve y me quedo en casa.', 'Mañana tenemos partido a las cinco.'],
            answer: 0,
            fact: 'Repite sonidos parecidos y cuesta decirlo rápido.',
          },
        ],
      },

      // ---------------- Tema 2: c, z y s ----------------
      {
        id: 'czs',
        title: 'C, Z y S vuelven al campo',
        icon: '🔤',
        intro:
          'Z va delante de a, o, u. C va delante de e, i. La s va con todas las vocales. Y si una palabra acaba en z, su plural lleva c.',
        vocab: [
          ['el sonido', 'звук'],
          ['la vocal', 'голосна'],
          ['el plural', 'множина'],
          ['el zorro', 'лисиця'],
          ['el zumo', 'сік'],
          ['la cereza', 'черешня'],
          ['el cielo', 'небо'],
          ['la sopa', 'суп'],
        ],
        text: {
          title: 'C, Z y S vuelven al campo',
          paragraphs: [
            'Z delante de a, o, u (zapato); c delante de e, i (cena); s con todas las vocales (sopa). Si una palabra acaba en z, su plural lleva c: pez, peces.',
          ],
        },
        tasks: [
          {
            type: 'fill',
            q: 'Completa la palabra.',
            text: 'El ___ es un animal de cola larga y pelo rojizo que vive en el bosque.',
            answer: 'zorro',
            extra: 'cs',
            fact: 'Zorro: la z va delante de o.',
          },
          {
            type: 'fill',
            q: 'Completa la palabra.',
            text: 'Por la noche, antes de dormir, tomamos la ___.',
            answer: 'cena',
            extra: 'zs',
            fact: 'Cena: la c va delante de e.',
          },
          {
            type: 'choice',
            q: 'Es una fruta roja y pequeña, con hueso, que nace en el cerezo. ¿Cómo se escribe?',
            options: ['cereza', 'sereza', 'zereza'],
            answer: 0,
            fact: 'Cereza: la c va delante de e.',
          },
          {
            type: 'pairs',
            q: 'Une cada palabra con su plural.',
            pairs: [
              ['luz', 'luces'],
              ['nuez', 'nueces'],
              ['actriz', 'actrices'],
              ['lápiz', 'lápices'],
            ],
          },
          {
            type: 'tf',
            q: 'La c suena como la z solo delante de e y de i. Con a, o, u suena fuerte, como en «casa».',
            truth: true,
          },
          {
            type: 'sort',
            q: '¿Qué letra falta: z, c o s?',
            bins: [
              { id: 'z', label: 'z', icon: '⚡' },
              { id: 'c', label: 'c', icon: '🌙' },
              { id: 's', label: 's', icon: '🐍' },
            ],
            items: [
              { text: '_apato', bin: 'z' },
              { text: '_umo', bin: 'z' },
              { text: '_oquete', bin: 'z' },
              { text: '_ielo', bin: 'c' },
              { text: '_ena', bin: 'c' },
              { text: '_opa', bin: 's' },
              { text: '_illa', bin: 's' },
              { text: '_ueño', bin: 's' },
            ],
          },
          {
            type: 'pick',
            q: 'Toca las palabras que se escriben con z.',
            text: 'El [_orro] pisó un [_apato] en la [pla_a] y se comió una _iruela.',
            fact: 'Zorro, zapato y plaza: la z va delante de o, a. Ciruela lleva c, porque va delante de i.',
          },
          {
            type: 'choice',
            q: 'Un banco de peces nada por el mar. ¿Cuál es el plural de «pez»?',
            options: ['peces', 'pezes', 'pezs'],
            answer: 0,
            fact: 'Pez → peces: la z final cambia a c.',
          },
        ],
      },

      // ---------------- Tema 1: el punto y la mayúscula ----------------
      {
        id: 'puntos',
        title: 'El parte del partido',
        icon: '📋',
        intro: 'Las oraciones empiezan con mayúscula y acaban en punto: seguido, aparte o final. Los nombres propios llevan mayúscula.',
        vocab: [
          ['la mayúscula', 'велика літера'],
          ['la minúscula', 'мала літера'],
          ['el punto y seguido', 'крапка (далі в тому ж абзаці)'],
          ['el punto y aparte', 'крапка (новий абзац)'],
          ['el punto final', 'кінцева крапка'],
          ['el párrafo', 'абзац'],
          ['la oración', 'речення'],
          ['el nombre propio', 'власна назва'],
        ],
        text: {
          title: 'El parte del partido',
          paragraphs: [
            'La oración empieza con mayúscula y acaba en punto. Punto y seguido: sigues en el párrafo. Punto y aparte: párrafo nuevo. Punto final: acaba el texto. Días y meses, en minúscula.',
          ],
        },
        tasks: [
          {
            type: 'fix',
            q: 'Se han perdido los puntos y las mayúsculas. ¡Ponlos!',
            text: 'El domingo jugamos contra el equipo de Sevilla. Marcos marcó el primer gol.',
            fact: 'Sevilla y Marcos son nombres propios; domingo, con minúscula.',
          },
          {
            type: 'fix',
            q: 'Se han perdido los puntos y las mayúsculas. ¡Ponlos!',
            text: 'Ayer fui al campo con mi amigo Leo. Jugamos al fútbol toda la tarde.\nPor la noche cenamos en casa de Ana. Después nos fuimos a dormir.',
            fact: 'Al final de cada párrafo va un punto y aparte.',
          },
          {
            type: 'fix',
            q: 'Pon los puntos y las mayúsculas. ¡Cuidado con los meses!',
            text: 'La portera se llama Lucía y vive en Madrid. En enero empieza la liga.',
            fact: 'Lucía y Madrid son nombres propios; enero, con minúscula.',
          },
          {
            type: 'choice',
            q: DOT_Q,
            passage: 'El partido empieza a las cinco[.] Antes calentamos en el campo.\nDespués de jugar, merendamos juntos.',
            options: DOTS,
            answer: 0,
            fixed: true,
            fact: 'Separa dos oraciones del mismo párrafo: es un punto y seguido.',
          },
          {
            type: 'choice',
            q: DOT_Q,
            passage: 'El partido empieza a las cinco. Antes calentamos en el campo[.]\nDespués de jugar, merendamos juntos.',
            options: DOTS,
            answer: 1,
            fixed: true,
            fact: 'Después de ese punto empieza otro párrafo: es un punto y aparte.',
          },
          {
            type: 'choice',
            q: DOT_Q,
            passage: 'Hoy ganamos el partido. Fue muy emocionante.\nMañana jugamos otra vez[.]',
            options: DOTS,
            answer: 2,
            fixed: true,
            fact: 'Cierra el texto: es el punto final.',
          },
          {
            type: 'pick',
            q: 'Toca las palabras que deben llevar mayúscula.',
            text: '[hoy] juega [lucía] contra [valencia]. [el] martes descansa.',
            fact: 'Hoy y El empiezan oración; Lucía y Valencia son nombres propios. Martes, con minúscula.',
          },
          {
            type: 'sort',
            q: '¿Se escribe con mayúscula o con minúscula?',
            bins: [
              { id: 'may', label: 'Mayúscula', icon: '🅰️' },
              { id: 'min', label: 'Minúscula', icon: '🔡' },
            ],
            items: [
              { text: 'sevilla', bin: 'may' },
              { text: 'carlos', bin: 'may' },
              { text: 'lucía', bin: 'may' },
              { text: 'domingo', bin: 'min' },
              { text: 'marzo', bin: 'min' },
              { text: 'ele', bin: 'min' },
            ],
          },
        ],
      },
    ];

    // Final exam: 14 tasks from every station; the red card (4th mistake) sends the player off.
    const exam = {
      title: 'Partido final',
      icon: '🏆',
      perStation: { derivadas: 2, 'verbos-b': 2, bv: 2, pronombres: 2, literatura: 2, trabalenguas: 1, czs: 2, puntos: 1 },
      redAfter: 4,
      sendOff: true,
      var: 2,
    };

    // Station tile colours.
    const hues = {
      derivadas: '#c9822b',
      'verbos-b': '#c2413b',
      bv: '#2f8a6a',
      pronombres: '#3a8fb7',
      literatura: '#6d5bb5',
      trabalenguas: '#d4752e',
      czs: '#5b7c99',
      puntos: '#a8743f',
    };

    // Round sampling: the unit's own multi-step types at most twice per round and always present; one of each big built-in type.
    const sampling = {
      caps: { forge: 2, save: 2, substitute: 2, fix: 1, sort: 1, order: 1, pairs: 1, pick: 2, fill: 2 },
      examCaps: { forge: 1, save: 1, substitute: 1, fix: 1, sort: 1, order: 1, pairs: 1, pick: 1, fill: 1 },
      always: ['forge', 'save', 'substitute', 'fix'],
    };

    return {
      slug: 'lengua-poemas',
      lang: 'es',
      title: 'La liga de las palabras',
      subject: 'Lengua Castellana · 3.º',
      unitLabel: 'Tema 3 · Examen de Lengua',
      intro:
        'Entrena las palabras en ocho estaciones: sufijos, b y v, pronombres, poemas, trabalenguas, c-z-s y puntos. Cuando estés listo, juega el partido final: el examen.',
      stations,
      exam,
      hues,
      sampling,
      testHook: '__lp',
      readFirst: false,
      round: 6,
      practiceCoin: 0.5,
    };
  })()
);
