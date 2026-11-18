// Ciencias de la Naturaleza 3.º (SM Matices, Asturias), Unidad 2 «Animales por aquí y por allá» — exam unit «Expedición safari».
// Source: book pp. 30–48 (+ animal items of pp. 49–53), transcribed in .pi/book-cn/unit2.md (the book is not in git). Plan: .pi/plan-naturales-animales.md.
// The sentences and the station notes are our own; only facts of the book (or what follows directly from its rules). Plain data, no logic
// (a few small builders below): window.NA_CONTENT is an ExamUnit (types/exam.d.ts, engine in shared/exam/) plus `trees` and `leaves`.
//
// Task types: choice (also `pics`), tf, sort, pairs, order, fill, pick (shared/exam/types.js); the unit's own (types.js here):
//   ficha { q, animal, name, rows:[{ id, answer, options? }], fact? }        — the explorer's card; row ids and their answers:
//     come  : herbivoro | carnivoro | omnivoro                  mueve: anda | salta | repta | nada | vuela
//     nace  : viviparo | oviparo | ovoviviparo                   grupo: mamifero | ave | pez | reptil | anfibio | invertebrado
//     `options` narrows a row to drop an alternative that would also be true (cangrejo: no «nada»; canguro: no «anda»; serpiente: no «nada»).
//   clave { q, animal, name, facts:[2–4 short features], tree, answer }      — dichotomous key: NA_CONTENT.trees[tree] = Node { q, yes, no },
//     a Node child is a Node or a string (leaf id); NA_CONTENT.leaves[leafId] = label.
//     trees: columna (→ vertebrado | invertebrado) · vertebrados (→ mamifero | ave | pez | anfibio | reptil) ·
//            invertebrados (→ insecto | aracnido | crustaceo | gusano | medusa | esponja | equinodermo | molusco)
//     the facts of a task answer every question of its path by the book's rule (the animal's name is not enough to guess).
//
// ART KEYS (the plan's «Art keys (final)»; only these are used; the optional mamut, raton, cabra, orca, sapo, sardina are NOT used):
//   vaca oveja caballo conejo leon leopardo lobo gato perro cerdo jabali zorro oso elefante canguro delfin ballena murcielago gallina buitre
//   halcon pinguino pato serpiente tortuga cocodrilo lagarto rana salamandra tiburon atun pez-payaso caballito-mar estrella-mar erizo-mar
//   lombriz medusa esponja caracol pulpo abeja mariposa hormiga mariquita arana escorpion cangrejo · craneo-herbivoro craneo-carnivoro craneo-omnivoro
//
// COVERAGE MATRIX (topic → tasks; station, task numbers in order of the file).
// comer — ¿Qué comen? (alimentación)
//   herbívoro 1, 3 pics, 6 sort, 7 tf, 9 pick, 10 ficha (vaca) · carnívoro 4 pics, 6, 8 fill · omnívoro 2, 5 pics, 6
// cazar — Rumiantes, carroñeros y dientes (alimentación)
//   rumiante 1, 2 pics · carroñero 3, 10 tf · garras, pico, pinzas, dientes 4 pairs · muelas / colmillos 5, 6, 7 (cráneos), 8 · persona = omnívoro 9
// moverse — ¿Cómo se desplazan? (desplazamiento)
//   reptar 1 · nadar (aletas, cola) 2, 5 sort, 6 pairs, 9 fill · saltar 3 pics · alas 4 · tierra/agua/aire 5 sort · cangrejo anda 7 tf · pato 8 pics · ficha 10 (canguro)
// reproduccion — Reproducción sexual y asexual (reproducción)
//   sexual 1, 4 · asexual (estrella de mar) 2 pics, 3 · mamar 5 fill · incubar 6 · eclosionar 7 · gestación 8 · «todos igual» 9 tf · palabras 10 pairs
// nacer — Vivíparos, ovíparos y ovovivíparos (reproducción)
//   vivíparo 1, 4 pics, 7 sort, 8 tf · ovíparo 2 fill, 3 pics, 7 sort · ovovivíparo (caballito de mar) 5 pics, 6, 9 pairs · ficha 10 (gallina)
// invertebrados — Vertebrados e invertebrados (clasificación)
//   invertebrado 1 · artrópodos: insecto 6 / arácnido 8 / crustáceo 10 patas 2 pics, 3 sort, 6 tf, 7 order, 5 fill · los 6 grupos 4 pairs · clave 8 columna, 9, 10 invertebrados
// vertebrados — Los cinco grupos de vertebrados (clasificación)
//   mamífero 1 pics (delfín), 4 sort, 5 pairs, 6 fill, 7 tf (delfín no es pez) · ave 2 pics (pingüino, murciélago), 8 tf, 9 clave · anfibio 3 pics, 10 clave
//   reptil 4 sort · pez 4 sort, 5 pairs
// ficha — El cuaderno de campo (repaso de los cuatro temas)
//   ficha 1–6 (tiburón, murciélago, serpiente, cangrejo, caballito de mar, pingüino) · clave 7 mamífero, 8 pez, 9 reptil, 10 equinodermo
//   (+ ficha in comer 10, moverse 10, nacer 10: 9 fichas in all; claves 9 in all)
// Not asked on purpose (book silent or ambiguous): ardilla's diet, tiburón / boa / serpiente / salamandra reproduction, pingüino / pato / cocodrilo / tortuga /
// rana movement, camaleón, the herbívoro teeth (only the skull), miriápodos (not in the book), the p.46 shortened definitions of reptil / molusco, tusks vs colmillos.
'use strict';

window.NA_CONTENT = /** @type {ExamUnit & { trees: Record<string, any>, leaves: Record<string, string> }} */ (
  (() => {
    // Picture choice: options are art keys, `labels` = what they show (one per option).
    const pics = (
      /** @type {string} */ q,
      /** @type {string[]} */ options,
      /** @type {string[]} */ labels,
      /** @type {number} */ answer,
      /** @type {string} */ fact,
    ) => ({ type: 'choice', pics: true, q, options, labels, answer, fact });
    const FICHA_Q = 'Rellena la ficha de este animal.';
    const ficha = (
      /** @type {string} */ animal,
      /** @type {string} */ name,
      /** @type {{ id: string, answer: string, options?: string[] }[]} */ rows,
      /** @type {string} */ fact,
    ) => ({ type: 'ficha', q: FICHA_Q, animal, name, rows, fact });
    const clave = (
      /** @type {string} */ animal,
      /** @type {string} */ name,
      /** @type {string[]} */ facts,
      /** @type {string} */ tree,
      /** @type {string} */ answer,
      /** @type {string} */ fact,
    ) => ({ type: 'clave', q: 'Sigue las preguntas y descubre el grupo de este animal.', animal, name, facts, tree, answer, fact });

    // Dichotomous keys (book p.40–42): every question uses the book's own characteristics of the group.
    const trees = {
      columna: { q: '¿Tiene esqueleto interno, con huesos?', yes: 'vertebrado', no: 'invertebrado' },
      vertebrados: {
        q: '¿Tiene el cuerpo cubierto de pelo?',
        yes: 'mamifero',
        no: {
          q: '¿Tiene pico, alas y el cuerpo cubierto de plumas?',
          yes: 'ave',
          no: {
            q: '¿Tiene aletas y el cuerpo cubierto de escamas?',
            yes: 'pez',
            no: { q: '¿Tiene la piel sin pelos, plumas ni escamas?', yes: 'anfibio', no: 'reptil' },
          },
        },
      },
      invertebrados: {
        q: '¿Tiene patas articuladas y una cubierta externa dura?',
        yes: {
          q: '¿Tiene seis patas?',
          yes: 'insecto',
          no: { q: '¿Tiene ocho patas?', yes: 'aracnido', no: 'crustaceo' },
        },
        no: {
          q: '¿Tiene el cuerpo blando y alargado, formado por anillos?',
          yes: 'gusano',
          no: {
            q: '¿Tiene el cuerpo gelatinoso y una boca rodeada de tentáculos?',
            yes: 'medusa',
            no: {
              q: '¿Tiene el cuerpo con poros y vive fija en el fondo del mar?',
              yes: 'esponja',
              no: { q: '¿Tiene el cuerpo cubierto de placas duras?', yes: 'equinodermo', no: 'molusco' },
            },
          },
        },
      },
    };
    const leaves = {
      vertebrado: 'Vertebrado',
      invertebrado: 'Invertebrado',
      mamifero: 'Mamífero',
      ave: 'Ave',
      pez: 'Pez',
      anfibio: 'Anfibio',
      reptil: 'Reptil',
      insecto: 'Insecto',
      aracnido: 'Arácnido',
      crustaceo: 'Crustáceo',
      gusano: 'Gusano',
      medusa: 'Medusa',
      esponja: 'Esponja',
      equinodermo: 'Equinodermo',
      molusco: 'Molusco',
    };

    /** @type {ExamStation[]} */
    const stations = [
      // ---------------- 1 ¿Qué comen? ----------------
      {
        id: 'comer',
        title: '¿Qué comen?',
        icon: '🥗',
        intro:
          'Según lo que comen, los animales son herbívoros (plantas), carnívoros (otros animales) u omnívoros (plantas y animales). ¡A observar qué hay en el plato de cada uno!',
        vocab: [
          ['el herbívoro', 'травоїдна тварина'],
          ['el carnívoro', 'м’ясоїдна тварина (хижак)'],
          ['el omnívoro', 'всеїдна тварина'],
          ['alimentarse', 'харчуватися'],
          ['la planta', 'рослина'],
          ['la semilla', 'насіння'],
          ['el fruto', 'плід'],
          ['la carne', 'м’ясо'],
        ],
        text: {
          title: '¿Qué comen los animales?',
          paragraphs: [
            'Los herbívoros comen plantas, como el caballo. Los carnívoros comen otros animales, como el leopardo. Los omnívoros comen plantas y animales, como el oso pardo y la gallina.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'Un animal que se alimenta de plantas es un…',
            options: ['herbívoro', 'carnívoro', 'omnívoro'],
            answer: 0,
            fact: 'Los herbívoros comen partes de las plantas, como los caballos o las cabras.',
          },
          {
            type: 'choice',
            q: 'El oso pardo y la gallina comen plantas y también animales. Son…',
            options: ['omnívoros', 'herbívoros', 'carnívoros'],
            answer: 0,
            fact: 'Los omnívoros comen tanto plantas, semillas y frutos como otros animales.',
          },
          pics(
            '¿Cuál de estos animales es herbívoro?',
            ['caballo', 'leon', 'zorro'],
            ['El caballo', 'El león', 'El zorro'],
            0,
            'El caballo come hierba. El león es carnívoro y el zorro, omnívoro.',
          ),
          pics(
            '¿Cuál de estos animales es carnívoro?',
            ['tiburon', 'vaca', 'gallina'],
            ['El tiburón', 'La vaca', 'La gallina'],
            0,
            'El tiburón se alimenta de otros animales.',
          ),
          pics(
            '¿Cuál de estos animales es omnívoro?',
            ['jabali', 'oveja', 'leopardo'],
            ['El jabalí', 'La oveja', 'El leopardo'],
            0,
            'El jabalí come plantas y también carne.',
          ),
          {
            type: 'sort',
            q: '¿Qué come cada animal?',
            bins: [
              { id: 'herbivoro', label: 'Herbívoros', icon: '🌿' },
              { id: 'carnivoro', label: 'Carnívoros', icon: '🥩' },
              { id: 'omnivoro', label: 'Omnívoros', icon: '🍽️' },
            ],
            items: [
              { text: 'la cabra', bin: 'herbivoro' },
              { text: 'el caballo', bin: 'herbivoro' },
              { text: 'el leopardo', bin: 'carnivoro' },
              { text: 'el tiburón', bin: 'carnivoro' },
              { text: 'el buitre', bin: 'carnivoro' },
              { text: 'el oso pardo', bin: 'omnivoro' },
              { text: 'la gallina', bin: 'omnivoro' },
              { text: 'el zorro', bin: 'omnivoro' },
            ],
          },
          {
            type: 'tf',
            q: 'Los herbívoros comen plantas y también carne.',
            truth: false,
            fix: 'Los herbívoros solo comen plantas. Los que comen plantas y animales son los omnívoros.',
          },
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'Los animales que se alimentan de otros animales son los ___.',
            answer: 'carnívoros',
            fact: 'Los carnívoros cazan a sus presas, como hace el leopardo.',
          },
          {
            type: 'pick',
            q: 'Toca los animales herbívoros.',
            text: 'La [vaca], el leopardo, la [cabra], el tiburón, el [caballo] y el zorro.',
            fact: 'La vaca, la cabra y el caballo comen plantas. El zorro es omnívoro.',
          },
          ficha(
            'vaca',
            'la vaca',
            [
              { id: 'come', answer: 'herbivoro' },
              { id: 'nace', answer: 'viviparo' },
              { id: 'grupo', answer: 'mamifero' },
            ],
            'La vaca es un herbívoro rumiante, nace del vientre de su madre y es un mamífero.',
          ),
        ],
      },

      // ---------------- 2 Rumiantes, carroñeros y dientes ----------------
      {
        id: 'cazar',
        title: 'Rumiantes, carroñeros y dientes',
        icon: '🦷',
        intro:
          'Algunos herbívoros son rumiantes y algunos carnívoros son carroñeros. Los dientes cuentan qué come un animal: muelas para triturar, colmillos para desgarrar.',
        vocab: [
          ['el rumiante', 'жуйна тварина'],
          ['el carroñero', 'падальник'],
          ['la presa', 'здобич'],
          ['la garra', 'кіготь'],
          ['el pico', 'дзьоб'],
          ['la muela', 'кутній зуб'],
          ['el colmillo', 'ікло'],
          ['el cráneo', 'череп'],
        ],
        text: {
          title: 'Rumiantes, carroñeros y dientes',
          paragraphs: [
            'Los rumiantes, como la vaca, vuelven a masticar la comida. Los carroñeros, como el buitre, comen animales muertos. Las muelas trituran las plantas y los colmillos desgarran la carne.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'Algunos herbívoros tragan la comida y luego la devuelven a la boca para masticarla otra vez. Son los…',
            options: ['rumiantes', 'carroñeros', 'omnívoros'],
            answer: 0,
            fact: 'La vaca y la oveja son rumiantes.',
          },
          pics(
            '¿Cuál de estos animales es un rumiante?',
            ['oveja', 'leon', 'gallina'],
            ['La oveja', 'El león', 'La gallina'],
            0,
            'Los rumiantes son herbívoros que vuelven a masticar la comida, como la oveja y la vaca.',
          ),
          {
            type: 'choice',
            q: 'El buitre come animales muertos que él no ha cazado. Por eso es un…',
            options: ['carroñero', 'rumiante', 'herbívoro'],
            answer: 0,
            fact: 'Los carroñeros son carnívoros que se alimentan de animales muertos.',
          },
          {
            type: 'pairs',
            q: 'Une cada animal con lo que usa para comer.',
            pairs: [
              ['el leopardo', 'Grandes colmillos y garras afiladas'],
              ['el buitre', 'Un pico fuerte'],
              ['el cangrejo', 'Pinzas'],
              ['el zorro', 'Muelas anchas y colmillos'],
            ],
          },
          pics(
            'El caballo come hierba. ¿Cuál es su cráneo?',
            ['craneo-herbivoro', 'craneo-carnivoro', 'craneo-omnivoro'],
            ['Muelas planas para triturar', 'Colmillos grandes y afilados', 'Muelas anchas y colmillos pequeños'],
            0,
            'Los herbívoros tienen muelas planas para triturar las plantas.',
          ),
          pics(
            'El leopardo caza otros animales. ¿Cuál es su cráneo?',
            ['craneo-herbivoro', 'craneo-carnivoro', 'craneo-omnivoro'],
            ['Muelas planas para triturar', 'Colmillos grandes y afilados', 'Muelas anchas y colmillos pequeños'],
            1,
            'Los leopardos tienen grandes colmillos para desgarrar la carne.',
          ),
          pics(
            'El oso pardo come plantas y animales. ¿Cuál es su cráneo?',
            ['craneo-herbivoro', 'craneo-carnivoro', 'craneo-omnivoro'],
            ['Muelas planas para triturar', 'Colmillos grandes y afilados', 'Muelas anchas y colmillos pequeños'],
            2,
            'Los omnívoros tienen muelas anchas para triturar y colmillos para desgarrar la carne.',
          ),
          {
            type: 'choice',
            q: 'Los carnívoros tienen colmillos grandes. ¿Para qué les sirven?',
            options: ['para desgarrar la carne', 'para triturar las plantas', 'para masticar dos veces'],
            answer: 0,
            fact: 'Las muelas trituran y los colmillos desgarran.',
          },
          {
            type: 'tf',
            q: 'Las personas somos omnívoras: comemos plantas y también carne.',
            truth: true,
            fact: 'Los seres humanos pertenecemos al grupo de los omnívoros.',
          },
          {
            type: 'tf',
            q: 'Todos los carnívoros comen solo animales que han cazado ellos.',
            truth: false,
            fix: 'Los carroñeros, como el buitre, comen animales muertos que no han cazado.',
          },
        ],
      },

      // ---------------- 3 ¿Cómo se desplazan? ----------------
      {
        id: 'moverse',
        title: '¿Cómo se desplazan?',
        icon: '🐾',
        intro:
          'Los animales se mueven para cazar, huir y reproducirse. Por la tierra andan, saltan o reptan; por el agua nadan; por el aire vuelan.',
        vocab: [
          ['andar', 'ходити'],
          ['saltar', 'стрибати'],
          ['reptar', 'повзати'],
          ['nadar', 'плавати'],
          ['volar', 'літати'],
          ['la pata', 'лапа'],
          ['la aleta', 'плавець'],
          ['el ala', 'крило'],
        ],
        text: {
          title: '¿Cómo se desplazan?',
          paragraphs: [
            'Los animales se mueven para cazar, huir y reproducirse. Andan o saltan los que tienen patas y reptan los que no las tienen. Nadan con aletas o cola y vuelan con alas.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'Los animales sin patas, como la serpiente, avanzan arrastrando el cuerpo por el suelo. Es decir…',
            options: ['reptan', 'andan', 'saltan'],
            answer: 0,
            fact: 'Los animales que no tienen patas reptan, como las lombrices y las serpientes.',
          },
          pics(
            '¿Cuál de estos animales nada ayudado por sus aletas y su cola?',
            ['tiburon', 'canguro', 'halcon'],
            ['El tiburón', 'El canguro', 'El halcón'],
            0,
            'El tiburón nada con sus aletas y su cola.',
          ),
          pics(
            '¿Cuál de estos animales se desplaza dando saltos?',
            ['canguro', 'tortuga', 'serpiente'],
            ['El canguro', 'La tortuga', 'La serpiente'],
            0,
            'El canguro salta. La tortuga anda y la serpiente repta.',
          ),
          {
            type: 'choice',
            q: '¿Con qué parte del cuerpo vuelan los animales?',
            options: ['con las alas', 'con las aletas', 'con las patas'],
            answer: 0,
            fact: 'Los animales que vuelan se desplazan por el aire moviendo sus alas.',
          },
          {
            type: 'sort',
            q: '¿Por dónde se desplaza cada animal?',
            bins: [
              { id: 'tierra', label: 'Por la tierra', icon: '🌍' },
              { id: 'agua', label: 'Por el agua', icon: '🌊' },
              { id: 'aire', label: 'Por el aire', icon: '☁️' },
            ],
            items: [
              { text: 'el canguro', bin: 'tierra' },
              { text: 'la serpiente', bin: 'tierra' },
              { text: 'el atún', bin: 'agua' },
              { text: 'el delfín', bin: 'agua' },
              { text: 'el halcón', bin: 'aire' },
              { text: 'la mariposa', bin: 'aire' },
              { text: 'el murciélago', bin: 'aire' },
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada animal con su forma de desplazarse.',
            pairs: [
              ['la hormiga', 'anda'],
              ['el canguro', 'salta'],
              ['la serpiente', 'repta'],
              ['el atún', 'nada'],
              ['el halcón', 'vuela'],
            ],
          },
          {
            type: 'tf',
            q: 'Los animales que viven en el agua siempre nadan.',
            truth: false,
            fix: 'Unos pocos animales del agua andan, como el cangrejo.',
          },
          pics(
            'Un animal puede andar, nadar y volar. ¿Cuál es?',
            ['pato', 'halcon', 'delfin'],
            ['El pato', 'El halcón', 'El delfín'],
            0,
            'El pato anda con sus patas, nada en el agua y vuela con sus alas.',
          ),
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'Los peces nadan moviendo sus aletas y su ___.',
            answer: 'cola',
            fact: 'Los animales nadan ayudados de sus aletas o de su cola.',
          },
          ficha(
            'canguro',
            'el canguro',
            [
              { id: 'mueve', answer: 'salta', options: ['salta', 'repta', 'nada', 'vuela'] },
              { id: 'nace', answer: 'viviparo' },
              { id: 'grupo', answer: 'mamifero' },
            ],
            'El canguro se desplaza dando saltos. Es un mamífero: nace del vientre de su madre.',
          ),
        ],
      },

      // ---------------- 4 Reproducción sexual y asexual ----------------
      {
        id: 'reproduccion',
        title: 'Reproducción sexual y asexual',
        icon: '🧬',
        intro:
          'Todos los animales se reproducen, pero no todos igual. En la reproducción sexual hay una hembra y un macho. En la asexual, un animal genera otro a partir de su cuerpo.',
        vocab: [
          ['la reproducción', 'розмноження'],
          ['la hembra', 'самка'],
          ['el macho', 'самець'],
          ['la cría', 'дитинча'],
          ['el embarazo', 'вагітність'],
          ['mamar', 'смоктати молоко'],
          ['incubar', 'висиджувати'],
          ['eclosionar', 'вилуплюватися'],
        ],
        text: {
          title: 'Reproducción sexual y asexual',
          paragraphs: [
            'Todos los animales se reproducen. En la reproducción sexual hay una hembra y un macho, como el perro. En la asexual, un animal genera otro a partir de su cuerpo, como la estrella de mar.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'El perro y la ballena tienen crías cuando intervienen una hembra y un macho. Su reproducción es…',
            options: ['sexual', 'asexual'],
            answer: 0,
            fact: 'En la reproducción sexual intervienen una hembra y un macho.',
          },
          pics(
            '¿Cuál de estos animales puede generar otra estrella a partir de uno de sus brazos?',
            ['estrella-mar', 'perro', 'gallina'],
            ['La estrella de mar', 'El perro', 'La gallina'],
            0,
            'La estrella de mar genera otra estrella a partir de uno de sus brazos.',
          ),
          {
            type: 'choice',
            q: 'Una estrella de mar genera otra a partir de uno de sus brazos. Su reproducción es…',
            options: ['asexual', 'sexual'],
            answer: 0,
            fact: 'En la reproducción asexual un animal genera otro a partir de sí mismo o de una parte de su cuerpo.',
          },
          {
            type: 'choice',
            q: 'Según su reproducción sexual, los animales pueden ser…',
            options: ['vivíparos, ovíparos u ovovivíparos', 'herbívoros, carnívoros u omnívoros', 'vertebrados o invertebrados'],
            answer: 0,
            fact: 'Los animales vivíparos, ovíparos y ovovivíparos se reproducen de forma sexual.',
          },
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'Las crías de los vivíparos ___ la leche de su madre.',
            answer: 'maman',
            fact: 'Las crías maman: se alimentan de la leche de su madre.',
          },
          {
            type: 'choice',
            q: 'La gallina da calor a sus huevos con su cuerpo hasta que nacen los pollitos. Eso se llama…',
            options: ['incubar', 'mamar', 'eclosionar'],
            answer: 0,
            fact: 'Incubar es dar calor a los huevos con el cuerpo hasta que nacen las crías.',
          },
          {
            type: 'choice',
            q: 'Cuando se rompe la envoltura del huevo y sale la cría, decimos que el huevo…',
            options: ['eclosiona', 'incuba', 'mama'],
            answer: 0,
            fact: 'Eclosionar es romper una envoltura para que nazca un animal.',
          },
          {
            type: 'choice',
            q: 'Una cría se desarrolla en el vientre de su madre. Ese proceso se llama…',
            options: ['gestación', 'incubación', 'eclosión'],
            answer: 0,
            fact: 'El embarazo o gestación es el proceso de los animales que nacen del vientre de la madre.',
          },
          {
            type: 'tf',
            q: 'Todos los animales se reproducen de la misma manera.',
            truth: false,
            fix: 'No todos se reproducen igual: hay reproducción sexual y asexual, y los animales pueden ser vivíparos, ovíparos u ovovivíparos.',
          },
          {
            type: 'pairs',
            q: 'Une cada palabra con lo que significa.',
            pairs: [
              ['la gestación', 'Crecer en el vientre de la madre'],
              ['mamar', 'Beber la leche de la madre'],
              ['incubar', 'Dar calor a los huevos con el cuerpo'],
              ['eclosionar', 'Romper el huevo y salir la cría'],
            ],
          },
        ],
      },

      // ---------------- 5 Vivíparos, ovíparos y ovovivíparos ----------------
      {
        id: 'nacer',
        title: 'Vivíparos, ovíparos y ovovivíparos',
        icon: '🐣',
        intro:
          'Según cómo nacen, los animales son vivíparos (del vientre de la madre), ovíparos (de huevos) u ovovivíparos (de huevos que eclosionan dentro de la madre).',
        vocab: [
          ['vivíparo', 'живородний'],
          ['ovíparo', 'яйцекладний'],
          ['ovovivíparo', 'яйцеживородний'],
          ['el huevo', 'яйце'],
          ['nacer', 'народжуватися'],
          ['la cría', 'дитинча'],
          ['el vientre', 'живіт, утроба'],
          ['la madre', 'мати'],
        ],
        text: {
          title: 'Vivíparos, ovíparos y ovovivíparos',
          paragraphs: [
            'Los vivíparos nacen del vientre de su madre, como el tigre. Los ovíparos nacen de huevos, como la gallina. Los ovovivíparos nacen de huevos que eclosionan en la madre, como el caballito de mar.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'Los animales que nacen del vientre de su madre son…',
            options: ['vivíparos', 'ovíparos', 'ovovivíparos'],
            answer: 0,
            fact: 'Los vivíparos nacen del vientre de su madre y las crías maman.',
          },
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'Los animales que nacen de huevos se llaman ___.',
            answer: 'ovíparos',
            fact: 'Los ovíparos se desarrollan y nacen de huevos, como la gallina y la rana.',
          },
          pics(
            '¿Cuál de estos animales nace de un huevo?',
            ['gallina', 'vaca', 'perro'],
            ['La gallina', 'La vaca', 'El perro'],
            0,
            'La gallina es ovípara: sus crías nacen de huevos.',
          ),
          pics(
            '¿Cuál de estos animales nace del vientre de su madre?',
            ['delfin', 'pinguino', 'cocodrilo'],
            ['El delfín', 'El pingüino', 'El cocodrilo'],
            0,
            'El delfín es un mamífero vivíparo. El pingüino y el cocodrilo nacen de huevos.',
          ),
          pics(
            '¿Cuál de estos animales es ovovivíparo?',
            ['caballito-mar', 'gallina', 'gato'],
            ['El caballito de mar', 'La gallina', 'El gato'],
            0,
            'Los huevos del caballito de mar eclosionan dentro del cuerpo de la madre.',
          ),
          {
            type: 'choice',
            q: 'Los huevos de los animales ovovivíparos se desarrollan y eclosionan…',
            options: ['en el cuerpo de la madre', 'en un nido de paja', 'enterrados en la arena'],
            answer: 0,
            fact: 'En los ovovivíparos las crías salen al exterior cuando los huevos eclosionan dentro de la madre.',
          },
          {
            type: 'sort',
            q: '¿Cómo nace cada animal?',
            bins: [
              { id: 'viviparo', label: 'Vivíparos (del vientre)', icon: '🤰' },
              { id: 'oviparo', label: 'Ovíparos (de huevos)', icon: '🥚' },
            ],
            items: [
              { text: 'el gato', bin: 'viviparo' },
              { text: 'el delfín', bin: 'viviparo' },
              { text: 'la vaca', bin: 'viviparo' },
              { text: 'el murciélago', bin: 'viviparo' },
              { text: 'la gallina', bin: 'oviparo' },
              { text: 'la rana', bin: 'oviparo' },
              { text: 'el cocodrilo', bin: 'oviparo' },
              { text: 'el pingüino', bin: 'oviparo' },
            ],
          },
          {
            type: 'tf',
            q: 'Las crías de los gatos nacen de huevos.',
            truth: false,
            fix: 'Los gatos son vivíparos: las crías nacen del vientre de su madre.',
          },
          {
            type: 'pairs',
            q: 'Une cada palabra con su significado.',
            pairs: [
              ['vivíparo', 'Nace del vientre de la madre'],
              ['ovíparo', 'Nace de un huevo'],
              ['ovovivíparo', 'Nace de un huevo que eclosiona dentro de la madre'],
            ],
          },
          ficha(
            'gallina',
            'la gallina',
            [
              { id: 'come', answer: 'omnivoro' },
              { id: 'nace', answer: 'oviparo' },
              { id: 'grupo', answer: 'ave' },
            ],
            'La gallina come plantas y animales, nace de huevos que ella incuba y es un ave.',
          ),
        ],
      },

      // ---------------- 6 Vertebrados e invertebrados ----------------
      {
        id: 'invertebrados',
        title: 'Vertebrados e invertebrados',
        icon: '🐌',
        intro:
          'Los vertebrados tienen esqueleto interno con huesos y los invertebrados no. Hay seis grupos de invertebrados, y los artrópodos son insectos, arácnidos o crustáceos.',
        vocab: [
          ['el esqueleto', 'скелет'],
          ['el hueso', 'кістка'],
          ['el invertebrado', 'безхребетна тварина'],
          ['el artrópodo', 'членистоноге'],
          ['la pata articulada', 'членисті ноги'],
          ['la concha', 'мушля'],
          ['el caparazón', 'панцир'],
          ['la antena', 'антена, вусик'],
        ],
        text: {
          title: 'Vertebrados e invertebrados',
          paragraphs: [
            'Los vertebrados tienen esqueleto interno con huesos. Los invertebrados no lo tienen. Hay seis grupos de invertebrados: equinodermos, gusanos, medusas, esponjas, moluscos y artrópodos, que son insectos, arácnidos o crustáceos.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'Los animales que no tienen esqueleto interno son los…',
            options: ['invertebrados', 'vertebrados', 'mamíferos'],
            answer: 0,
            fact: 'Los invertebrados no tienen esqueleto interno, como los caracoles o los gusanos.',
          },
          pics(
            '¿Cuál de estos animales es un crustáceo?',
            ['cangrejo', 'arana', 'hormiga'],
            ['El cangrejo', 'La araña', 'La hormiga'],
            0,
            'El cangrejo es un crustáceo: tiene diez patas y dos antenas.',
          ),
          {
            type: 'sort',
            q: '¿A qué grupo de artrópodos pertenece cada animal?',
            bins: [
              { id: 'insecto', label: 'Insectos', icon: '🐝' },
              { id: 'aracnido', label: 'Arácnidos', icon: '🕷️' },
              { id: 'crustaceo', label: 'Crustáceos', icon: '🦀' },
            ],
            items: [
              { text: 'la abeja', bin: 'insecto' },
              { text: 'la mariquita', bin: 'insecto' },
              { text: 'la mariposa', bin: 'insecto' },
              { text: 'la araña', bin: 'aracnido' },
              { text: 'el escorpión', bin: 'aracnido' },
              { text: 'el cangrejo', bin: 'crustaceo' },
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada grupo de invertebrados con su característica.',
            pairs: [
              ['los equinodermos', 'Cuerpo cubierto de placas duras'],
              ['las esponjas', 'Cuerpo con poros, fijas en el fondo del mar'],
              ['las medusas', 'Cuerpo gelatinoso con tentáculos'],
              ['los gusanos', 'Cuerpo blando y alargado, con anillos'],
              ['los moluscos', 'Cuerpo blando y musculoso, casi todos con concha'],
            ],
          },
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'Los invertebrados con patas articuladas y cubierta dura son los ___.',
            answer: 'artrópodos',
            fact: 'Los artrópodos son el grupo más abundante: insectos, arácnidos y crustáceos.',
          },
          {
            type: 'tf',
            q: 'Las arañas tienen seis patas, como los insectos.',
            truth: false,
            fix: 'Los insectos tienen seis patas y las arañas, que son arácnidos, tienen ocho.',
          },
          {
            type: 'order',
            q: 'Ordena los artrópodos de menos a más patas.',
            items: ['los insectos', 'los arácnidos', 'los crustáceos'],
            fact: 'Los insectos tienen seis patas, los arácnidos ocho y los crustáceos diez.',
          },
          clave(
            'pulpo',
            'el pulpo',
            ['Tiene el cuerpo blando y musculoso', 'No tiene huesos'],
            'columna',
            'invertebrado',
            'El pulpo no tiene esqueleto interno: es un invertebrado.',
          ),
          clave(
            'cangrejo',
            'el cangrejo',
            ['Tiene patas articuladas y una cubierta externa dura', 'Tiene diez patas', 'Tiene dos antenas'],
            'invertebrados',
            'crustaceo',
            'Los artrópodos con diez patas y dos antenas son crustáceos.',
          ),
          clave(
            'caracol',
            'el caracol',
            [
              'Tiene el cuerpo blando y musculoso',
              'Lleva una concha en la espalda',
              'Se arrastra por el suelo',
              'No tiene patas articuladas',
            ],
            'invertebrados',
            'molusco',
            'Los moluscos tienen el cuerpo blando y musculoso, y casi todos tienen concha.',
          ),
        ],
      },

      // ---------------- 7 Los cinco grupos de vertebrados ----------------
      {
        id: 'vertebrados',
        title: 'Los cinco grupos de vertebrados',
        icon: '🦴',
        intro:
          'Los vertebrados son mamíferos, aves, peces, reptiles y anfibios. Cada grupo tiene sus características: pelo, plumas, aletas o escamas.',
        vocab: [
          ['el mamífero', 'ссавець'],
          ['el ave', 'птах'],
          ['el pez', 'риба'],
          ['el reptil', 'рептилія, плазун'],
          ['el anfibio', 'амфібія'],
          ['la pluma', 'перо'],
          ['la escama', 'луска'],
          ['el pelo', 'шерсть, волосся'],
        ],
        text: {
          title: 'Los cinco grupos de vertebrados',
          paragraphs: [
            'Los mamíferos tienen pelo y son vivíparos. Las aves tienen plumas, pico y alas. Los peces tienen aletas y escamas. Los reptiles tienen escamas. Los anfibios tienen la piel sin pelos, plumas ni escamas.',
          ],
        },
        tasks: [
          pics(
            '¿Cuál de estos animales es un mamífero?',
            ['delfin', 'atun', 'tiburon'],
            ['El delfín', 'El atún', 'El tiburón'],
            0,
            'El delfín vive en el agua, pero es un mamífero: nace del vientre de su madre.',
          ),
          pics(
            '¿Cuál de estos animales es un ave?',
            ['pinguino', 'murcielago', 'mariposa'],
            ['El pingüino', 'El murciélago', 'La mariposa'],
            0,
            'El pingüino es un ave: tiene pico, alas y plumas, aunque no vuela.',
          ),
          pics(
            '¿Cuál de estos animales es un anfibio?',
            ['rana', 'lagarto', 'serpiente'],
            ['La rana', 'El lagarto', 'La serpiente'],
            0,
            'La rana es un anfibio: su piel no tiene pelos, plumas ni escamas.',
          ),
          {
            type: 'sort',
            q: '¿A qué grupo de vertebrados pertenece cada animal?',
            bins: [
              { id: 'mamifero', label: 'Mamíferos', icon: '🐕' },
              { id: 'ave', label: 'Aves', icon: '🐦' },
              { id: 'pez', label: 'Peces', icon: '🐟' },
              { id: 'reptil', label: 'Reptiles', icon: '🐊' },
              { id: 'anfibio', label: 'Anfibios', icon: '🐸' },
            ],
            items: [
              { text: 'el delfín', bin: 'mamifero' },
              { text: 'el murciélago', bin: 'mamifero' },
              { text: 'el pingüino', bin: 'ave' },
              { text: 'el buitre', bin: 'ave' },
              { text: 'el atún', bin: 'pez' },
              { text: 'la tortuga', bin: 'reptil' },
              { text: 'el cocodrilo', bin: 'reptil' },
              { text: 'la rana', bin: 'anfibio' },
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada grupo con su característica.',
            pairs: [
              ['los mamíferos', 'Cuerpo cubierto de pelo, vivíparos'],
              ['las aves', 'Pico, alas y plumas'],
              ['los peces', 'Aletas y se desplazan por el agua'],
              ['los reptiles', 'Escamas, y andan, nadan o reptan'],
              ['los anfibios', 'Piel sin pelos, plumas ni escamas'],
            ],
          },
          {
            type: 'fill',
            q: 'Escribe la palabra que falta.',
            text: 'Los vertebrados con pelo, cuyas crías maman, son los ___.',
            answer: 'mamíferos',
            fact: 'Los mamíferos son vivíparos y tienen el cuerpo cubierto de pelo.',
          },
          {
            type: 'tf',
            q: 'El delfín es un pez porque vive en el agua.',
            truth: false,
            fix: 'El delfín es un mamífero: es vivíparo y sus crías maman.',
          },
          {
            type: 'tf',
            q: 'El pingüino es un ave aunque no pueda volar.',
            truth: true,
            fact: 'Algunas aves no pueden volar, como el pingüino.',
          },
          clave(
            'pinguino',
            'el pingüino',
            ['Tiene el cuerpo cubierto de plumas', 'Tiene pico y alas, pero no vuela', 'Nada muy bien'],
            'vertebrados',
            'ave',
            'Las aves tienen pico, alas y plumas.',
          ),
          clave(
            'salamandra',
            'la salamandra',
            ['Su piel no tiene pelos, plumas ni escamas', 'Tiene cuatro extremidades', 'De cría vive en el agua'],
            'vertebrados',
            'anfibio',
            'Los anfibios tienen la piel sin pelos, plumas ni escamas.',
          ),
        ],
      },

      // ---------------- 8 El cuaderno de campo ----------------
      {
        id: 'ficha',
        title: 'El cuaderno de campo',
        icon: '📓',
        intro:
          'En tu cuaderno de campo rellenas la ficha de cada animal: qué come, cómo se mueve, cómo nace y a qué grupo pertenece. ¡Repasa los cuatro temas a la vez!',
        vocab: [
          ['el cuaderno de campo', 'польовий зошит'],
          ['la ficha', 'картка'],
          ['el grupo', 'група'],
          ['el esqueleto', 'скелет'],
          ['el pelo', 'шерсть, волосся'],
          ['la pluma', 'перо'],
          ['la aleta', 'плавець'],
          ['la escama', 'луска'],
        ],
        text: {
          title: 'El cuaderno de campo',
          paragraphs: [
            'En el cuaderno de campo apuntas qué come cada animal, cómo se mueve, cómo nace y su grupo. Primero mira si tiene esqueleto interno. Luego fíjate en el pelo, las plumas o las aletas.',
          ],
        },
        tasks: [
          ficha(
            'tiburon',
            'el tiburón',
            [
              { id: 'come', answer: 'carnivoro' },
              { id: 'mueve', answer: 'nada' },
            ],
            'El tiburón se alimenta de otros animales y nada con sus aletas y su cola.',
          ),
          ficha(
            'murcielago',
            'el murciélago',
            [
              { id: 'mueve', answer: 'vuela', options: ['repta', 'salta', 'nada', 'vuela'] },
              { id: 'nace', answer: 'viviparo' },
              { id: 'grupo', answer: 'mamifero' },
            ],
            'Los mamíferos andan, nadan o vuelan: el murciélago vuela, pero es un mamífero vivíparo.',
          ),
          ficha(
            'serpiente',
            'la serpiente',
            [
              { id: 'mueve', answer: 'repta', options: ['anda', 'salta', 'repta', 'vuela'] },
              { id: 'grupo', answer: 'reptil' },
            ],
            'La serpiente no tiene patas: avanza arrastrando su cuerpo. Es un reptil.',
          ),
          ficha(
            'cangrejo',
            'el cangrejo',
            [
              { id: 'mueve', answer: 'anda', options: ['anda', 'repta', 'vuela'] },
              { id: 'grupo', answer: 'invertebrado' },
            ],
            'El cangrejo vive en el agua, pero anda con sus patas. Es un invertebrado (crustáceo).',
          ),
          ficha(
            'caballito-mar',
            'el caballito de mar',
            [
              { id: 'mueve', answer: 'nada' },
              { id: 'nace', answer: 'ovoviviparo' },
            ],
            'Los huevos del caballito de mar eclosionan dentro del cuerpo de la madre: es ovovivíparo.',
          ),
          ficha(
            'pinguino',
            'el pingüino',
            [
              { id: 'nace', answer: 'oviparo' },
              { id: 'grupo', answer: 'ave' },
            ],
            'El pingüino es un ave: no vuela, pero tiene pico, alas y plumas, y nace de huevos.',
          ),
          clave(
            'perro',
            'el perro',
            ['Tiene el cuerpo cubierto de pelo', 'Tiene cuatro patas', 'Sus crías maman la leche de su madre'],
            'vertebrados',
            'mamifero',
            'Los mamíferos tienen el cuerpo cubierto de pelo.',
          ),
          clave(
            'atun',
            'el atún',
            ['Tiene aletas y el cuerpo cubierto de escamas', 'Se desplaza por el agua'],
            'vertebrados',
            'pez',
            'Los peces tienen aletas y el cuerpo cubierto de escamas.',
          ),
          clave(
            'cocodrilo',
            'el cocodrilo',
            ['Tiene cuatro patas cortas', 'Su cuerpo está cubierto de escamas', 'Nace de un huevo'],
            'vertebrados',
            'reptil',
            'Los reptiles tienen escamas, la mayoría tienen cuatro extremidades y nacen de huevos.',
          ),
          clave(
            'estrella-mar',
            'la estrella de mar',
            ['Tiene el cuerpo cubierto de placas duras', 'Se mueve por el fondo del mar', 'No tiene patas articuladas'],
            'invertebrados',
            'equinodermo',
            'Los equinodermos tienen el cuerpo cubierto de placas duras, como las estrellas y los erizos de mar.',
          ),
        ],
      },
    ];

    // Final exam: 15 tasks (2 per station, 1 of «Reproducción sexual y asexual»); the 4th mistake (a flat tyre) stops the jeep.
    const exam = {
      title: 'Expedición final',
      icon: '🏆',
      perStation: { comer: 2, cazar: 2, moverse: 2, reproduccion: 1, nacer: 2, invertebrados: 2, vertebrados: 2, ficha: 2 },
      redAfter: 4,
      sendOff: true,
      var: 2,
    };

    // Station tile colours (savanna: leaf, rust, sky, ochre, amber, violet, forest, kraft paper).
    const hues = {
      comer: '#5f9a3a',
      cazar: '#b5523b',
      moverse: '#3a8fb7',
      reproduccion: '#c28a2e',
      nacer: '#d4752e',
      invertebrados: '#7a6bb5',
      vertebrados: '#2f8a6a',
      ficha: '#a8743f',
    };

    // Round sampling: the unit's own types always present (at most twice in a round, once in an exam draw).
    const sampling = {
      caps: { ficha: 2, clave: 2, sort: 1, order: 1, pairs: 1, pick: 2, fill: 2 },
      examCaps: { ficha: 1, clave: 1, sort: 1, order: 1, pairs: 1, pick: 1, fill: 1 },
      always: ['ficha', 'clave'],
    };

    // Safari theme: every default text a player can see that talks about football or cards is overridden.
    const strings = {
      scoreIcon: '📸',
      examEyebrow: 'Expedición final',
      examTitle: 'Expedición final',
      goalsLabel: 'Fotos',
      cardsLabel: 'Baches',
      examInfo: ({ n }) => `${n} preguntas de toda la unidad, como en el cole. Cada fallo es un 🕳️ bache. ¡Tranquilidad, es para practicar!`,
      examInfoOff: ({ n, red }) =>
        `${n} preguntas de toda la unidad. Cada fallo es un 🕳️ bache y el ${red}.º es una 🛞 rueda pinchada: el jeep se para y no hay monedas. ¡Con cuidado!`,
      yellow: '¡Un bache!',
      yellowText: 'No pasa nada. ¡Sigue la ruta!',
      yellowLeft: ({ n }) => `¡Cuidado! ${n === 1 ? 'Falta 1 fallo' : `Faltan ${n} fallos`} para la rueda pinchada.`,
      red: '¡Rueda pinchada!',
      redText: 'Se pincha una rueda, pero la ruta sigue. Al final verás qué temas repasar.',
      redOff: 'El jeep se queda parado.',
      varBtn: ({ n }) => `🔧 Rueda de repuesto (${n} 🪙)`,
      varNeed: ({ n }) => `Necesitas ${n} 🪙`,
      varDone: '¡Rueda de repuesto puesta!',
      varDoneText: 'La 🛞 se cambia y el jeep sigue. ¡Con cuidado: el próximo pinchazo ya no se puede arreglar!',
      sentOffTitle: '¡Jeep parado! 🛞',
      sentOffText: ({ n }) =>
        `Con ${n} fallos el jeep se queda sin ruedas. Esta vez no hay monedas. Repasa las estaciones y vuelve a la ruta.`,
      examCards: ({ y, r }) => `Baches: ${y} 🕳️${r ? ' · 1 🛞' : ''}`,
      noCards: '¡Ruta perfecta, sin baches!',
      examMsgOk: 'Muy buena expedición. Repasa los temas en naranja y vuelve a intentarlo.',
    };

    return {
      slug: 'naturales-animales',
      lang: 'es',
      title: 'Expedición safari',
      subject: 'Ciencias de la Naturaleza · 3.º',
      unitLabel: 'Unidad 2 · Prueba de Naturales',
      intro:
        'Sal de safari en tu jeep con una cámara y rellena tu cuaderno de campo: qué comen los animales, cómo se mueven, cómo nacen y a qué grupo pertenecen. Cuando estés listo, haz la expedición final: el examen.',
      stations,
      exam,
      hues,
      sampling,
      strings,
      // «¡Golazo!» of the default cheers is football: the safari unit has its own.
      lists: { praise: ['¡Muy bien!', '¡Foto perfecta!', '¡Bien visto, explorador!', '¡Eso es!', '¡Gran captura!'] },
      testHook: '__na',
      readFirst: false,
      round: 6,
      practiceCoin: 0.5,
      trees,
      leaves,
    };
  })()
);
