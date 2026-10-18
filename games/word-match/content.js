// «Команда слів» / «Equipo de palabras» — English words for an 8-year-old (3.º Primaria in Spain, British English,
// mostly Cambridge YLE Starters/Movers plus football words). Every theme is a station of the exam engine (shared/exam/);
// the tasks are generated from the word list below, in the site's languages: uk site UA↔EN and ES↔EN, es site ES↔EN.
//
// Generated task types (key = word key, so one round never asks the same word twice):
//   choice  picture → English, native → English, English → native (generic engine type; `art` = word key → picture)
//   listen  hear the word (KFG.say), pick its picture; without a voice the word is shown          (types.js)
//   spell   build the English word from letter tiles, clue = picture + native word                  (types.js)
//   pairs   4 English words ↔ their translations (no key: several words)
// window.WM_CONTENT is a WMContent (types/word-match.d.ts).
'use strict';

window.WM_CONTENT = /** @type {WMContent} */ (
  (() => {
    const ES = KF.lang === 'es';
    /** @type {WMNative[]} */
    const natives = ES ? ['es'] : ['uk', 'es'];

    // [english, spanish (Spain, with the article kids say), ukrainian, picture: emoji or #colour]
    /** @type {{ id: string, icon: string, en: string, uk: string, es: string, hue: string, words: string[][] }[]} */
    const THEMES = [
      {
        id: 'football',
        icon: '⚽',
        en: 'Football',
        uk: 'Футбол',
        es: 'Fútbol',
        hue: '#2f8a52',
        words: [
          ['ball', 'el balón', 'м’яч', '⚽'],
          ['goal', 'la portería', 'ворота', '🥅'],
          ['goalkeeper', 'el portero', 'воротар'],
          ['gloves', 'los guantes', 'рукавиці', '🧤'],
          ['boots', 'las botas', 'бутси', '👟'],
          ['pitch', 'el campo', 'поле'],
          ['referee', 'el árbitro', 'суддя'],
          ['whistle', 'el silbato', 'свисток'],
          ['team', 'el equipo', 'команда'],
          ['match', 'el partido', 'матч'],
          ['trophy', 'la copa', 'кубок', '🏆'],
          ['yellow card', 'la tarjeta amarilla', 'жовта картка', '🟨'],
        ],
      },
      {
        id: 'clothes',
        icon: '👕',
        en: 'Clothes',
        uk: 'Одяг',
        es: 'La ropa',
        hue: '#3f8fc9',
        words: [
          ['T-shirt', 'la camiseta', 'футболка', '👕'],
          ['trousers', 'los pantalones', 'штани', '👖'],
          ['shorts', 'los pantalones cortos', 'шорти', '🩳'],
          ['dress', 'el vestido', 'сукня', '👗'],
          ['shoes', 'los zapatos', 'туфлі', '👞'],
          ['trainers', 'las zapatillas', 'кросівки', '👟'],
          ['socks', 'los calcetines', 'шкарпетки', '🧦'],
          ['coat', 'el abrigo', 'пальто', '🧥'],
          ['cap', 'la gorra', 'кепка', '🧢'],
          ['hat', 'el sombrero', 'капелюх', '🎩'],
          ['scarf', 'la bufanda', 'шарф', '🧣'],
        ],
      },
      {
        id: 'colours',
        icon: '🎨',
        en: 'Colours',
        uk: 'Кольори',
        es: 'Los colores',
        hue: '#c2547a',
        words: [
          ['red', 'rojo', 'червоний', '#e53935'],
          ['blue', 'azul', 'синій', '#1e63d6'],
          ['green', 'verde', 'зелений', '#2e9e44'],
          ['yellow', 'amarillo', 'жовтий', '#ffd21f'],
          ['orange', 'naranja', 'помаранчевий', '#ff8a1c'],
          ['purple', 'morado', 'фіолетовий', '#8e44c9'],
          ['pink', 'rosa', 'рожевий', '#ff8fc4'],
          ['brown', 'marrón', 'коричневий', '#8a5a2b'],
          ['black', 'negro', 'чорний', '#1d1d1f'],
          ['white', 'blanco', 'білий', '#ffffff'],
          ['grey', 'gris', 'сірий', '#9aa3a8'],
        ],
      },
      {
        id: 'body',
        icon: '🖐️',
        en: 'My body',
        uk: 'Тіло',
        es: 'El cuerpo',
        hue: '#d9822b',
        words: [
          ['eye', 'el ojo', 'око', '👁️'],
          ['ear', 'la oreja', 'вухо', '👂'],
          ['nose', 'la nariz', 'ніс', '👃'],
          ['mouth', 'la boca', 'рот', '👄'],
          ['tooth', 'el diente', 'зуб', '🦷'],
          ['hand', 'la mano', 'долоня', '✋'],
          ['arm', 'el brazo', 'рука', '💪'],
          ['leg', 'la pierna', 'нога', '🦵'],
          ['foot', 'el pie', 'стопа', '🦶'],
          ['finger', 'el dedo', 'палець', '👆'],
          ['knee', 'la rodilla', 'коліно'],
          ['head', 'la cabeza', 'голова'],
        ],
      },
      {
        id: 'animals',
        icon: '🐾',
        en: 'Animals',
        uk: 'Тварини',
        es: 'Los animales',
        hue: '#8a6d3b',
        words: [
          ['dog', 'el perro', 'собака', '🐶'],
          ['cat', 'el gato', 'кіт', '🐱'],
          ['bird', 'el pájaro', 'птах', '🐦'],
          ['fish', 'el pez', 'риба', '🐟'],
          ['horse', 'el caballo', 'кінь', '🐴'],
          ['cow', 'la vaca', 'корова', '🐮'],
          ['sheep', 'la oveja', 'вівця', '🐑'],
          ['monkey', 'el mono', 'мавпа', '🐒'],
          ['lion', 'el león', 'лев', '🦁'],
          ['elephant', 'el elefante', 'слон', '🐘'],
          ['rabbit', 'el conejo', 'кролик', '🐰'],
          ['frog', 'la rana', 'жаба', '🐸'],
        ],
      },
      {
        id: 'food',
        icon: '🍎',
        en: 'Food',
        uk: 'Їжа',
        es: 'La comida',
        hue: '#c94b3a',
        words: [
          ['apple', 'la manzana', 'яблуко', '🍎'],
          ['banana', 'el plátano', 'банан', '🍌'],
          ['orange', 'la naranja', 'апельсин', '🍊'],
          ['carrot', 'la zanahoria', 'морква', '🥕'],
          ['tomato', 'el tomate', 'помідор', '🍅'],
          ['bread', 'el pan', 'хліб', '🍞'],
          ['cheese', 'el queso', 'сир', '🧀'],
          ['egg', 'el huevo', 'яйце', '🥚'],
          ['milk', 'la leche', 'молоко', '🥛'],
          ['cake', 'la tarta', 'торт', '🎂'],
          ['ice cream', 'el helado', 'морозиво', '🍦'],
          ['chicken', 'el pollo', 'курка', '🍗'],
        ],
      },
      {
        id: 'school',
        icon: '🎒',
        en: 'School',
        uk: 'Школа',
        es: 'El cole',
        hue: '#5a6fd6',
        words: [
          ['book', 'el libro', 'книжка', '📕'],
          ['notebook', 'el cuaderno', 'зошит', '📓'],
          ['pencil', 'el lápiz', 'олівець', '✏️'],
          ['pen', 'el boli', 'ручка', '🖊️'],
          ['rubber', 'la goma', 'гумка'],
          ['ruler', 'la regla', 'лінійка', '📏'],
          ['scissors', 'las tijeras', 'ножиці', '✂️'],
          ['schoolbag', 'la mochila', 'рюкзак', '🎒'],
          ['paintbrush', 'el pincel', 'пензлик', '🖌️'],
          ['teacher', 'el profesor', 'учитель', '🧑‍🏫'],
          ['computer', 'el ordenador', 'комп’ютер', '💻'],
          ['clock', 'el reloj', 'годинник', '🕐'],
        ],
      },
      {
        id: 'home',
        icon: '🏠',
        en: 'My home',
        uk: 'Дім',
        es: 'La casa',
        hue: '#b0703a',
        words: [
          ['house', 'la casa', 'будинок', '🏠'],
          ['kitchen', 'la cocina', 'кухня'],
          ['bedroom', 'el dormitorio', 'спальня'],
          ['bed', 'la cama', 'ліжко', '🛏️'],
          ['table', 'la mesa', 'стіл'],
          ['chair', 'la silla', 'стілець', '🪑'],
          ['door', 'la puerta', 'двері', '🚪'],
          ['window', 'la ventana', 'вікно', '🪟'],
          ['bath', 'la bañera', 'ванна', '🛁'],
          ['sofa', 'el sofá', 'диван', '🛋️'],
          ['TV', 'la tele', 'телевізор', '📺'],
          ['key', 'la llave', 'ключ', '🔑'],
        ],
      },
      {
        id: 'town',
        icon: '🚌',
        en: 'Town',
        uk: 'Місто',
        es: 'La ciudad',
        hue: '#6b7c8f',
        words: [
          ['school', 'el colegio', 'школа', '🏫'],
          ['shop', 'la tienda', 'магазин', '🏪'],
          ['hospital', 'el hospital', 'лікарня', '🏥'],
          ['park', 'el parque', 'парк'],
          ['street', 'la calle', 'вулиця'],
          ['beach', 'la playa', 'пляж', '🏖️'],
          ['bus', 'el autobús', 'автобус', '🚌'],
          ['car', 'el coche', 'машина', '🚗'],
          ['train', 'el tren', 'потяг', '🚆'],
          ['bike', 'la bici', 'велосипед', '🚲'],
          ['plane', 'el avión', 'літак', '✈️'],
          ['boat', 'el barco', 'човен', '⛵'],
        ],
      },
      {
        id: 'weather',
        icon: '🌦️',
        en: 'Weather',
        uk: 'Погода',
        es: 'El tiempo',
        hue: '#2a9fb5',
        words: [
          ['sunny', 'hace sol', 'сонячно', '☀️'],
          ['rainy', 'llueve', 'дощить', '🌧️'],
          ['cloudy', 'está nublado', 'хмарно', '☁️'],
          ['windy', 'hace viento', 'вітряно', '🌬️'],
          ['snowy', 'nieva', 'сніжить', '🌨️'],
          ['hot', 'hace calor', 'спекотно', '🥵'],
          ['cold', 'hace frío', 'холодно', '🥶'],
          ['rainbow', 'el arcoíris', 'веселка', '🌈'],
          ['spring', 'la primavera', 'весна', '🌸'],
          ['summer', 'el verano', 'літо', '🌞'],
          ['autumn', 'el otoño', 'осінь', '🍂'],
          ['winter', 'el invierno', 'зима', '⛄'],
        ],
      },
      {
        id: 'planet',
        icon: '🌍',
        en: 'Our planet',
        uk: 'Планета',
        es: 'El planeta',
        hue: '#1d6fb0',
        words: [
          ['Earth', 'la Tierra', 'Земля', '🌍'],
          ['Sun', 'el Sol', 'Сонце', '☀️'],
          ['Moon', 'la Luna', 'Місяць', '🌙'],
          ['star', 'la estrella', 'зірка', '⭐'],
          ['planet', 'el planeta', 'планета', '🪐'],
          ['sea', 'el mar', 'море', '🌊'],
          ['river', 'el río', 'річка', '🏞️'],
          ['mountain', 'la montaña', 'гора', '⛰️'],
          ['volcano', 'el volcán', 'вулкан', '🌋'],
          ['island', 'la isla', 'острів', '🏝️'],
          ['desert', 'el desierto', 'пустеля', '🏜️'],
          ['tree', 'el árbol', 'дерево', '🌳'],
        ],
      },
      {
        id: 'actions',
        icon: '🏃',
        en: 'Actions',
        uk: 'Дії',
        es: 'Acciones',
        hue: '#7b5bd0',
        words: [
          ['run', 'correr', 'бігати', '🏃'],
          ['jump', 'saltar', 'стрибати'],
          ['swim', 'nadar', 'плавати', '🏊'],
          ['climb', 'trepar', 'лазити', '🧗'],
          ['dance', 'bailar', 'танцювати', '💃'],
          ['sing', 'cantar', 'співати', '🎤'],
          ['read', 'leer', 'читати', '📖'],
          ['write', 'escribir', 'писати', '✍️'],
          ['draw', 'dibujar', 'малювати', '🖍️'],
          ['sleep', 'dormir', 'спати', '😴'],
          ['eat', 'comer', 'їсти', '🍽️'],
          ['ride a bike', 'montar en bici', 'кататися на велосипеді', '🚴'],
        ],
      },
    ];

    // ---------- texts (the site's language) ----------

    const UK_STRINGS = {
      coins: 'Монети',
      back: '← До каталогу',
      stationsTitle: 'Теми',
      examEyebrow: 'Фінальний матч',
      examTitle: 'Матч слів',
      examStart: 'Почати матч',
      examInfo: ({ n }) => `${n} слів з усіх тем. Помилка — це 🟨 жовта картка, але нічого страшного: це тренування!`,
      examBest: ({ grade, nota }) => `Найкращий матч: ${grade} (${nota})`,
      cardsLabel: 'Картки',
      goalsLabel: 'Голи',
      review: 'Повторити',
      backBtn: 'Назад',
      start: 'Почати',
      quitTitle: 'Повернутися до тем?',
      quitText: 'Цей раунд не піде в рекорд.',
      quitYes: 'Вийти',
      quitNo: 'Грати далі',
      tallyPassed: ({ n, total }) => `🏁 ${n}/${total} пройдено`,
      tallyStars: ({ n, total }) => `⭐ ${n}/${total}`,
      best: ({ score, max }) => `Рекорд: ${score}/${max}`,
      notPlayed: 'Нова тема',
      passed: 'Пройдено!',
      introMeta: ({ n }) => `${n} завдань · близько 3 хвилин`,
      stars: ({ n }) => `${n} з 3 зірок`,
      praiseSoft: 'Молодець!',
      almost: 'Майже!',
      answerIs: ({ a }) => `Правильно: ${a}.`,
      seeRight: 'Подивись, як правильно.',
      fix: ({ text }) => `Правильно так: ${text}`,
      next: 'Далі →',
      result: 'Результат →',
      restart: 'Почати знову ↺',
      yellow: 'Жовта картка!',
      yellowText: 'Нічого страшного. Грай далі!',
      red: 'Червона картка!',
      redText: 'Кілька помилок, але матч триває. Наприкінці побачиш, які теми повторити.',
      kChoice: ({ n }) => `Клавіші 1–${n}`,
      kTf: 'Клавіші V = правда, F = неправда',
      true: 'Правда',
      false: 'Неправда',
      kSort: ({ n }) => `Торкнись картки, потім її коробки. Клавіатура: ← → — картка, 1–${n} — коробка`,
      pickCard: 'Спочатку торкнись картки.',
      sortTry: 'Майже. Спробуй іншу коробку.',
      sortGoes: ({ item, bin }) => `«${item}» — у «${bin}».`,
      kOrder: 'Торкайся карток по черзі: спочатку 1, потім 2… Клавіатура: літери A–G, ⌫ — скасувати, Enter — перевірити',
      check: 'Перевірити ✓',
      undo: '↶ Скасувати',
      orderGreen: 'Зелені вже на місці. Розстав інші.',
      orderNeedAll: 'Розстав усі картки.',
      kPairs: ({ n, l }) => `Торкнись слова зліва, потім його пари справа. Клавіатура: 1–${n} і A–${l}`,
      pairNo: 'Ці два — не пара. Спробуй ще!',
      pairShown: 'Ось ця пара.',
      stationDone: 'Раунд завершено!',
      stationPassed: 'Тему пройдено!',
      stationMsg: ({ coins }) => `Монет за раунд: ${coins} 🪙.`,
      stationKeep: ({ need, n }) => `Щоб пройти тему, треба ${need} з ${n}. Ще раз — і вийде!`,
      stationGreat: 'Ці слова вже грають у твоїй команді. Спробуй іншу тему або матч!',
      perfectBonus: ' І бонус за ідеальний раунд.',
      again: 'Ще раз',
      nextStation: 'Наступна тема →',
      toHub: 'До тем',
      examDone: 'Матч завершено',
      nota: ({ n }) => `Оцінка: ${n}`,
      examMsgTop: 'Чудовий матч — слова в тебе в команді! 💪',
      examMsgOk: 'Гарний матч. Повтори помаранчеві теми і спробуй ще.',
      examMsgLow: 'Ще є що потренувати. Повтори помаранчеві теми — щоразу буде краще!',
      examCards: ({ y, r }) => `Картки: ${y} 🟨${r ? ' · 1 🟥' : ''}`,
      noCards: 'Чистий матч, без карток!',
      byTopic: 'За темами',
      review2: 'Повторити',
      loadError: 'Не вдалося завантажити завдання. Онови сторінку.',
      // own task types and the squad (types.js, art.js, game.js)
      listenPlay: '🔊 Послухати',
      listenNoVoice: 'Голосу немає — прочитай слово',
      kListen: ({ n }) => `Клавіші 1–${n}, пробіл — послухати ще`,
      kSpell: 'Набирай літери з клавіатури, ⌫ — стерти, Enter — перевірити',
      spellErase: '⌫ Стерти',
      spellFill: 'Спочатку заповни всі клітинки.',
      spellGreen: 'Зелені літери вже на місці. Допиши інші!',
      spellAgain: 'Ще не те. Спробуй ще раз!',
      squadTitle: 'Моя команда слів',
      squadCount: ({ n, total }) => `${n} з ${total} слів у команді`,
      squadNew: ({ w }) => `✍️ «${w}» — у твоїй команді!`,
    };

    const ES_STRINGS = {
      stationsTitle: 'Temas',
      examEyebrow: 'Partido final',
      examTitle: 'Partido de palabras',
      examStart: 'Empezar el partido',
      examInfo: ({ n }) => `${n} palabras de todos los temas. Cada fallo es una 🟨 tarjeta amarilla. ¡Tranquilidad, es para practicar!`,
      examBest: ({ grade, nota }) => `Tu mejor partido: ${grade} (${nota})`,
      quitTitle: '¿Volver a los temas?',
      notPlayed: 'Tema nuevo',
      stationDone: '¡Ronda terminada!',
      stationPassed: '¡Tema superado!',
      stationKeep: ({ need, n }) => `Para superarlo necesitas ${need} de ${n}. ¡Otra vez y lo consigues!`,
      stationGreat: 'Estas palabras ya juegan en tu equipo. ¡Prueba otro tema o el partido!',
      nextStation: 'Siguiente tema →',
      toHub: 'A los temas',
      examDone: 'Fin del partido',
      examMsgTop: '¡Gran partido: las palabras ya están en tu equipo! 💪',
      examMsgOk: 'Muy buen partido. Repasa los temas en naranja y vuelve a intentarlo.',
      examMsgLow: 'Aún hay temas por entrenar. Repasa los temas en naranja: ¡cada vez saldrá mejor!',
      listenPlay: '🔊 Escuchar',
      listenNoVoice: 'No hay voz: lee la palabra',
      kListen: ({ n }) => `Teclas 1–${n}, espacio = escuchar otra vez`,
      kSpell: 'Escribe con el teclado, ⌫ borra, Enter comprueba',
      spellErase: '⌫ Borrar',
      spellFill: 'Primero rellena todas las casillas.',
      spellGreen: 'Las letras verdes ya están bien. ¡Completa las demás!',
      spellAgain: 'Todavía no. ¡Prueba otra vez!',
      squadTitle: 'Mi equipo de palabras',
      squadCount: ({ n, total }) => `${n} de ${total} palabras en el equipo`,
      squadNew: ({ w }) => `✍️ ¡«${w}» ya está en tu equipo!`,
    };

    // Task prompts. native = the language of the translation in that task.
    const Q = ES
      ? {
          pic: () => '¿Cómo se dice en inglés?',
          toEn: (/** @type {string} */ w) => `¿Cómo se dice «${w}» en inglés?`,
          fromEn: (/** @type {string} */ w) => `¿Qué significa «${w}»?`,
          listen: () => 'Busca el dibujo de la palabra',
          spell: (/** @type {string} */ w) => `Escribe en inglés: «${w}»`,
          pairs: () => 'Une las parejas: inglés — español',
        }
      : {
          pic: () => 'Як це англійською?',
          toEn: (/** @type {string} */ w) => `Як англійською «${w}»?`,
          fromEn: (/** @type {string} */ w, /** @type {WMNative} */ n) => (n === 'es' ? `Як іспанською «${w}»?` : `Що означає «${w}»?`),
          listen: () => 'Знайди картинку до слова',
          spell: (/** @type {string} */ w) => `Склади англійською: «${w}»`,
          pairs: (/** @type {WMNative} */ n) => `З’єднай пари: англійська — ${n === 'es' ? 'іспанська' : 'українська'}`,
        };

    // ---------- tasks ----------

    /** @type {Record<string, WMWord>} */
    const words = {};
    const themes = THEMES.map((t) => ({
      ...t,
      words: t.words.map(([en, es, uk, p]) => {
        const key = `${t.id}.${en.toLowerCase().replace(/[^a-z]+/g, '-')}`;
        /** @type {WMWord} */
        const w = { key, en, es, uk, ...(p?.startsWith('#') ? { color: p } : p ? { pic: p } : {}) };
        words[key] = w;
        return w;
      }),
    }));

    const hasPic = (/** @type {WMWord} */ w) => Boolean(w.pic || w.color);
    // 3 other words of the theme (optionally only ones with a picture), right one first; the engine shuffles the options.
    const others = (/** @type {WMWord[]} */ list, /** @type {WMWord} */ w, pics = false) =>
      KFG.shuffle(list.filter((x) => x !== w && (!pics || hasPic(x)))).slice(0, 3);
    // After every answer: the word in all the site's languages.
    const fact = (/** @type {WMWord} */ w) => [w.en, ...natives.map((n) => w[n])].join(' = ');

    /** @param {WMTheme} t @returns {ExamTask[]} */
    const tasksOf = (t) => {
      /** @type {ExamTask[]} */
      const out = [];
      t.words.forEach((w, i) => {
        const key = w.key;
        const choice = (/** @type {string} */ q, /** @type {(x: WMWord) => string} */ text, pics = false, art = undefined) => ({
          type: 'choice',
          key,
          q,
          options: [w, ...others(t.words, w, pics)].map(text),
          answer: 0,
          fact: fact(w),
          ...(art ? { art } : {}),
        });
        if (hasPic(w)) {
          out.push(choice(Q.pic(), (x) => x.en, false, key));
          out.push({ type: 'listen', key, q: Q.listen(), word: w, options: [w, ...others(t.words, w, true)] });
        }
        for (const n of natives) {
          out.push(choice(Q.toEn(w[n]), (x) => x.en));
          out.push(choice(Q.fromEn(w.en, n), (x) => x[n]));
        }
        if (/^[a-z]{3,8}$/i.test(w.en)) {
          const native = natives[i % natives.length];
          out.push({ type: 'spell', key, q: Q.spell(w[native]), word: w, native, ...(hasPic(w) ? { art: key } : {}) });
        }
      });
      // pairs: the theme in groups of 4 words, one task per group and language
      const order = KFG.shuffle(t.words);
      for (let i = 0; i + 4 <= order.length; i += 4)
        for (const n of natives)
          out.push({
            type: 'pairs',
            q: Q.pairs(n),
            pairs: order.slice(i, i + 4).map((w) => /** @type {[string, string]} */ ([w.en, w[n]])),
          });
      return out;
    };

    /** @type {WMContent} */
    const unit = {
      slug: 'word-match',
      lang: ES ? 'es' : 'uk',
      title: ES ? 'Equipo de palabras' : 'Команда слів',
      subject: 'English',
      unitLabel: ES ? 'Inglés · 12 temas' : 'Англійська · 12 тем',
      intro: ES
        ? 'Cada palabra que aprendes es un fichaje para tu equipo. Entrena los temas y luego juega el partido con todas las palabras.'
        : 'Кожне вивчене слово — новий гравець у твоїй команді. Тренуй теми, а потім зіграй матч з усіх слів!',
      stations: themes.map((t) => ({
        id: t.id,
        title: t.en,
        icon: t.icon,
        intro: ES
          ? `${t.es}: ${t.words.length} palabras — ${t.words
              .slice(0, 3)
              .map((w) => w.en)
              .join(', ')}…`
          : `${t.uk}: ${t.words.length} слів — ${t.words
              .slice(0, 3)
              .map((w) => w.en)
              .join(', ')}…`,
        tasks: tasksOf(t),
      })),
      exam: { perStation: Object.fromEntries(themes.map((t) => [t.id, 1])), redAfter: 3 },
      round: 8,
      hues: Object.fromEntries(themes.map((t) => [t.id, t.hue])),
      sampling: { caps: { pairs: 1, listen: 2, spell: 2 } },
      strings: ES ? ES_STRINGS : UK_STRINGS,
      ...(ES
        ? {}
        : {
            lists: {
              praise: ['Чудово!', 'Гол!', 'Супер!', 'Так тримати!', 'Ідеально!'],
              grades: ['Тренуйся далі!', 'Непогано', 'Добре', 'Дуже добре', 'Відмінно'],
            },
          }),
      testHook: '__wm',
      store: 'word-match-words',
      themes,
      natives,
      words,
    };
    return unit;
  })()
);
