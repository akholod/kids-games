// «Читанка-мандрівка» — Ukrainian reading for an 8-year-old who reads slowly, by syllables (he goes to a Spanish school).
// A journey across Ukraine: every city is a station of the exam engine (shared/exam/) with 12 words of a theme; the words
// get longer along the route. Syllables follow the school rule for reading (a cluster goes to the next syllable, a
// sonorant before a noisy consonant stays: мор-ква, сон-це), the stressed vowel is marked (U+0301) like in a primer.
//
// Generated task types (key = word key, so one round never asks the same word twice):
//   read    read the word (by syllables on the first stops), pick its picture        (types.js)
//   choice  picture → the written word (generic engine type; `art` = word key → picture)
//   hear    hear the word (clip), pick how it is written                             (types.js)
//   build   build the word from syllable tiles                                       (types.js)
//   gap     a lost letter: и/і/ї, є, щ, ь, apostrophe                                (types.js)
//   story   read 1–2 sentences, answer a question (no key)                           (types.js)
// window.CH_CONTENT is a CHContent (types/chytanka.d.ts).
'use strict';

window.CH_CONTENT = /** @type {CHContent} */ (
  (() => {
    // 'syllables picture': syllables joined by '-', the stressed vowel followed by U+0301.
    /** @type {{ id: string, city: string, cityName: string, theme: string, icon: string, hue: string, words: string[], stories: string[][] }[]} */
    const ROUTE = [
      {
        id: 'kyiv',
        city: 'kyiv',
        cityName: 'Київ',
        theme: 'Мій дім',
        icon: '🏡',
        hue: '#2f6fd0',
        words: [
          'ма́-ма 👩',
          'та́-то 👨',
          'се-стра́ 👧',
          'брат 👦',
          'ба-бу́-ся 👵',
          'ді-ду́сь 👴',
          'ха́-та 🏡',
          'ві-кно́ 🪟',
          'две́-рі 🚪',
          'лі́-жко 🛏️',
          'кіт 🐈',
          'пес 🐕',
        ],
        stories: [
          ['У Марка є кіт. Кота звуть Мурчик.', 'Хто такий Мурчик?', 'кіт', 'пес', 'брат', 'тато'],
          ['Сестра спить у ліжку.', 'Де спить сестра?', 'у ліжку', 'у школі', 'у лісі', 'на столі'],
          ['Бабуся відчиняє вікно, а дідусь — двері.', 'Що відчиняє бабуся?', 'вікно', 'двері', 'шафу', 'книжку'],
        ],
      },
      {
        id: 'chernihiv',
        city: 'chernihiv',
        cityName: 'Чернігів',
        theme: 'Ліс',
        icon: '🌲',
        hue: '#2e8a4e',
        words: [
          'ліс 🌳',
          'вовк 🐺',
          'лис 🦊',
          'за́-єць 🐇',
          'ї-жа́к 🦔',
          'вед-мі́дь 🐻',
          'бі́л-ка 🐿️',
          'со-ва́ 🦉',
          'гриб 🍄',
          'ли́-стя 🍂',
          'я-ли́н-ка 🌲',
          'ме-те́-лик 🦋',
        ],
        stories: [
          ['У лісі живе їжак. Він любить гриби.', 'Що любить їжак?', 'гриби', 'мед', 'рибу', 'листя'],
          ['Білка стрибає на ялинку.', 'Хто стрибає на ялинку?', 'білка', 'лис', 'вовк', 'сова'],
          ['Удень сова спить, а вночі полює.', 'Коли сова спить?', 'удень', 'уночі', 'увечері', 'завжди'],
        ],
      },
      {
        id: 'poltava',
        city: 'poltava',
        cityName: 'Полтава',
        theme: 'Смаколики',
        icon: '🍲',
        hue: '#d0702f',
        words: [
          'борщ 🍲',
          'хліб 🍞',
          'сир 🧀',
          'ка́-ша 🥣',
          'ва-ре́-ни-ки 🥟',
          'я́-блу-ко 🍎',
          'гру́-ша 🍐',
          'ви́-шня 🍒',
          'мо-ло-ко́ 🥛',
          'мед 🍯',
          'пи-рі́г 🥧',
          'яй-це́ 🥚',
        ],
        stories: [
          ['Мама варить борщ. Тато ріже хліб.', 'Що варить мама?', 'борщ', 'кашу', 'вареники', 'молоко'],
          ['Оля їсть вареники з вишнями.', 'З чим вареники?', 'з вишнями', 'з медом', 'з сиром', 'з грушами'],
          ['Кіт п’є молоко з миски.', 'Що п’є кіт?', 'молоко', 'сік', 'чай', 'воду'],
        ],
      },
      {
        id: 'kharkiv',
        city: 'kharkiv',
        cityName: 'Харків',
        theme: 'Школа',
        icon: '🎒',
        hue: '#7a4fc4',
        words: [
          'шко́-ла 🏫',
          'кни́-жка 📕',
          'ру́-чка 🖊️',
          'о-лі-ве́ць ✏️',
          'зо́-шит 📓',
          'лі-ні́й-ка 📏',
          'фа́р-би 🎨',
          'ра́-нець 🎒',
          'гло́-бус 🌍',
          'ка-лен-да́р 📅',
          'но́-жи-ці ✂️',
          'дзво́-ник 🔔',
        ],
        stories: [
          ['У ранці є книжка і зошит.', 'Що є в ранці?', 'книжка і зошит', 'м’яч і бутси', 'хліб і сир', 'лижі'],
          ['Дзвоник дзвенить. Урок починається.', 'Що починається?', 'урок', 'обід', 'матч', 'дощ'],
          ['Петрик малює фарбами сонце.', 'Що малює Петрик?', 'сонце', 'кота', 'хату', 'море'],
        ],
      },
      {
        id: 'dnipro',
        city: 'dnipro',
        cityName: 'Дніпро',
        theme: 'Транспорт',
        icon: '🚀',
        hue: '#1f8fa8',
        words: [
          'ма-ши́-на 🚗',
          'ав-то́-бус 🚌',
          'тро-ле́й-бус 🚎',
          'трам-ва́й 🚋',
          'по́-тяг 🚆',
          'лі-та́к ✈️',
          'ра-ке́-та 🚀',
          'ве-ло-си-пе́д 🚲',
          'чо́-вен 🛶',
          'ко-ра-бе́ль 🚢',
          'ван-та-жі́в-ка 🚚',
          'вер-то-лі́т 🚁',
        ],
        stories: [
          ['Ракета летить до зірок.', 'Куди летить ракета?', 'до зірок', 'до моря', 'до школи', 'до лісу'],
          ['Ми їдемо до бабусі потягом.', 'Чим ми їдемо?', 'потягом', 'літаком', 'човном', 'автобусом'],
          ['Тато їде на роботу трамваєм.', 'Чим їде тато?', 'трамваєм', 'велосипедом', 'машиною', 'кораблем'],
        ],
      },
      {
        id: 'zaporizhzhia',
        city: 'zaporizhzhia',
        cityName: 'Запоріжжя',
        theme: 'На фермі',
        icon: '🐎',
        hue: '#b0892a',
        words: [
          'кінь 🐎',
          'ко-ро́-ва 🐄',
          'ко-за́ 🐐',
          'вів-ця́ 🐑',
          'сви-ня́ 🐖',
          'ку́р-ка 🐔',
          'пі́-вень 🐓',
          'ка́-чка 🦆',
          'кро́-лик 🐇',
          'ін-ди́к 🦃',
          'ми́-шка 🐭',
          'бджо-ла́ 🐝',
        ],
        stories: [
          ['Півень співає рано-вранці.', 'Хто співає вранці?', 'півень', 'корова', 'кінь', 'качка'],
          ['Корова дає молоко.', 'Що дає корова?', 'молоко', 'мед', 'яйця', 'сир'],
          ['Козак сідає на коня.', 'На кого сідає козак?', 'на коня', 'на корову', 'на козу', 'на свиню'],
        ],
      },
      {
        id: 'kherson',
        city: 'kherson',
        cityName: 'Херсон',
        theme: 'Город',
        icon: '🍉',
        hue: '#c2413b',
        words: [
          'ка-ву́н 🍉',
          'ди́-ня 🍈',
          'по-мі-до́р 🍅',
          'о-гі-ро́к 🥒',
          'мо́р-ква 🥕',
          'кар-то́-пля 🥔',
          'ци-бу́-ля 🧅',
          'ча-сни́к 🧄',
          'пе́-рець 🌶️',
          'ка-пу́-ста 🥬',
          'ку-ку-ру́-дза 🌽',
          'со́-ня-шник 🌻',
        ],
        stories: [
          ['Кавун великий і солодкий.', 'Який кавун?', 'великий і солодкий', 'малий і кислий', 'синій', 'гіркий'],
          ['Бабуся садить картоплю.', 'Що садить бабуся?', 'картоплю', 'кавун', 'моркву', 'цибулю'],
          ['Соняшник дивиться на сонце.', 'На що дивиться соняшник?', 'на сонце', 'на хмару', 'на дощ', 'на море'],
        ],
      },
      {
        id: 'odesa',
        city: 'odesa',
        cityName: 'Одеса',
        theme: 'Море',
        icon: '🌊',
        hue: '#1f6fb8',
        words: [
          'мо́-ре 🌊',
          'пляж 🏖️',
          'ри́-ба 🐟',
          'кит 🐋',
          'дель-фі́н 🐬',
          'краб 🦀',
          'му́-шля 🐚',
          'во-сьми-ні́г 🐙',
          'а-ку́-ла 🦈',
          'че-ре-па́-ха 🐢',
          'па-ра-со́-ля ⛱️',
          'о́-стрів 🏝️',
        ],
        stories: [
          ['Кит — найбільший звір у морі.', 'Хто найбільший у морі?', 'кит', 'краб', 'дельфін', 'риба'],
          ['Діти шукають мушлі на пляжі.', 'Де діти шукають мушлі?', 'на пляжі', 'у лісі', 'у школі', 'у горах'],
          ['Черепаха пливе повільно, а дельфін — швидко.', 'Хто пливе повільно?', 'черепаха', 'дельфін', 'акула', 'кит'],
        ],
      },
      {
        id: 'karpaty',
        city: 'karpaty',
        cityName: 'Карпати',
        theme: 'Гори й погода',
        icon: '⛰️',
        hue: '#4f7d3a',
        words: [
          'го-ра́ ⛰️',
          'со́н-це ☀️',
          'хма́-ра ☁️',
          'дощ 🌧️',
          'сніг ❄️',
          'ві́-тер 🌬️',
          'ве-се́л-ка 🌈',
          'бли́-скав-ка ⚡',
          'сні-го-ви́к ☃️',
          'ли́-жі 🎿',
          'ту-ма́н 🌫️',
          'на-ме́т ⛺',
        ],
        stories: [
          ['Після дощу на небі веселка.', 'Що на небі після дощу?', 'веселка', 'сніг', 'місяць', 'туман'],
          ['Взимку діти ліплять сніговика.', 'Кого ліплять діти?', 'сніговика', 'кота', 'зайця', 'ведмедя'],
          ['У горах ми спимо в наметі.', 'Де ми спимо в горах?', 'у наметі', 'у човні', 'у школі', 'в автобусі'],
        ],
      },
      {
        id: 'lviv',
        city: 'lviv',
        cityName: 'Львів',
        theme: 'Футбол і місто',
        icon: '⚽',
        hue: '#1f5f3f',
        words: [
          'м’яч ⚽',
          'во-ро́-та 🥅',
          'ку́-бок 🏆',
          'бу́-тси 👟',
          'во-ро-та́р 🧤',
          'ста-ді-о́н 🏟️',
          'ме-да́ль 🥇',
          'пра́-пор 🚩',
          'ка́р-тка 🟨',
          'лев 🦁',
          'за́-мок 🏰',
          'шо-ко-ла́д 🍫',
        ],
        stories: [
          ['Воротар ловить м’яч. Ворота сухі!', 'Хто ловить м’яч?', 'воротар', 'суддя', 'тренер', 'лев'],
          ['Наша команда виграла кубок.', 'Що виграла команда?', 'кубок', 'медаль', 'м’яч', 'прапор'],
          ['На вежі старого замку є прапор.', 'Що є на вежі?', 'прапор', 'лев', 'м’яч', 'кубок'],
        ],
      },
    ];

    const STRINGS = {
      coins: 'Монети',
      back: '← До каталогу',
      stationsTitle: 'Маршрут',
      examEyebrow: 'Фінал мандрівки',
      examTitle: 'Велика мандрівка',
      examStart: 'Вирушити',
      examInfo: ({ n }) => `${n} завдань з усіх міст. Помилка — це 🟨 жовта картка, але нічого страшного: це тренування!`,
      examBest: ({ grade, nota }) => `Найкраща мандрівка: ${grade} (${nota})`,
      cardsLabel: 'Картки',
      goalsLabel: 'Бали',
      review: 'Повторити',
      backBtn: 'Назад',
      start: 'Почати',
      quitTitle: 'Повернутися до маршруту?',
      quitText: 'Цей раунд не піде в рекорд.',
      quitYes: 'Вийти',
      quitNo: 'Читати далі',
      tallyPassed: ({ n, total }) => `🏁 ${n}/${total} міст`,
      tallyStars: ({ n, total }) => `⭐ ${n}/${total}`,
      best: ({ score, max }) => `Рекорд: ${score}/${max}`,
      notPlayed: 'Ще не був тут',
      passed: 'Печатка є!',
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
      yellowText: 'Нічого страшного. Читай далі!',
      red: 'Червона картка!',
      redText: 'Кілька помилок, але мандрівка триває. Наприкінці побачиш, які міста повторити.',
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
      stationPassed: 'Місто пройдено — тримай печатку!',
      stationMsg: ({ coins }) => `Монет за раунд: ${coins} 🪙.`,
      stationKeep: ({ need, n }) => `Щоб отримати печатку, треба ${need} з ${n}. Ще раз — і вийде!`,
      stationGreat: 'Ти чудово читаєш! Вирушай у наступне місто.',
      perfectBonus: ' І бонус за ідеальний раунд.',
      again: 'Ще раз',
      nextStation: 'Наступне місто →',
      toHub: 'До маршруту',
      examDone: 'Мандрівку завершено',
      nota: ({ n }) => `Оцінка: ${n}`,
      examMsgTop: 'Чудова мандрівка — ти справжній читач! 📚',
      examMsgOk: 'Гарна мандрівка. Повтори помаранчеві міста і спробуй ще.',
      examMsgLow: 'Ще є що потренувати. Повтори помаранчеві міста — щоразу буде краще!',
      examCards: ({ y, r }) => `Картки: ${y} 🟨${r ? ' · 1 🟥' : ''}`,
      noCards: 'Без жодної картки!',
      byTopic: 'За містами',
      review2: 'Повторити',
      loadError: 'Не вдалося завантажити завдання. Онови сторінку.',
      // own task types and the journey (types.js, art.js)
      readSplit: 'По складах',
      readWhole: 'Ціле слово',
      kRead: ({ n }) => `Клавіші 1–${n}, пробіл — по складах`,
      hearPlay: '🔊 Послухати',
      hearNoVoice: 'Голосу немає — подивись на малюнок',
      kHear: ({ n }) => `Клавіші 1–${n}, пробіл — послухати ще`,
      kBuild: ({ n }) => `Торкайся складів по черзі. Клавіші 1–${n} — склад, ⌫ — стерти, Enter — перевірити`,
      buildErase: '⌫ Стерти',
      buildFill: 'Спочатку склади все слово.',
      buildGreen: 'Зелені склади вже на місці. Допиши інші!',
      buildAgain: 'Ще не те. Спробуй ще раз!',
      kGap: ({ n }) => `Клавіші 1–${n}`,
      gapApos: 'апостроф',
      gapSoft: 'м’який знак',
      kStory: ({ n }) => `Клавіші 1–${n}`,
      storyListen: '🔊 Послухати текст',
      passportTitle: 'Паспорт мандрівника',
      passportStamps: ({ n, total }) => `Печаток: ${n} з ${total}`,
      passportWords: ({ n, total }) => `Прочитано слів: ${n} з ${total}`,
      passportNext: ({ city }) => `Далі — ${city}`,
      passportDone: 'Усю Україну пройдено! 🇺🇦',
    };

    const Q = {
      read: 'Прочитай слово і знайди малюнок',
      pic: 'Яке слово до малюнка?',
      hear: 'Послухай і знайди, як пишеться',
      build: 'Склади слово зі складів',
      gap: 'Яка буква загубилася?',
      story: 'Прочитай і дай відповідь',
    };

    // Look-alike words to tell apart by ear (only as wrong options; they need not be in the word list).
    /** @type {Record<string, string[]>} */
    const NEAR = { кит: ['кіт'], кіт: ['кит'], лис: ['ліс'], ліс: ['лис'], сир: ['сік'], мед: ['мій'], лев: ['ліс'] };
    // A lost letter: [the letter, the letters it gets confused with]. The first group found in a word wins.
    const GAPS = [
      ['’', 'ь'],
      ['ь', '’'],
      ['щ', 'ш', 'ч'],
      ['є', 'е'],
      ['ї', 'і', 'и'],
      ['и', 'і', 'е'],
      ['і', 'и', 'ї'],
    ];
    const STRESS = /\u0301/g;

    // ---------- words ----------

    /** @type {Record<string, CHWord>} */
    const words = {};
    /** @type {CHStation[]} */
    const route = ROUTE.map((r) => ({
      id: r.id,
      city: r.city,
      cityName: r.cityName,
      theme: r.theme,
      icon: r.icon,
      hue: r.hue,
      words: r.words.map((entry) => {
        const [s, pic] = entry.split(' ');
        const syl = s.split('-');
        const word = syl.join('').replace(STRESS, '');
        /** @type {CHWord} */
        const w = { key: `${r.id}.${word}`, word, syl, ...(pic ? { pic } : {}) };
        words[w.key] = w;
        return w;
      }),
    }));
    const all = Object.values(words);

    // 3 wrong options that look like `w`: its look-alikes first, then words of the stop with the same first letter or
    // length, then any other word of the stop.
    const near = (/** @type {CHWord[]} */ list, /** @type {CHWord} */ w) => {
      const like = (/** @type {CHWord} */ x) =>
        (x.word[0] === w.word[0] ? 2 : 0) + (Math.abs(x.word.length - w.word.length) <= 1 ? 1 : 0) + Math.random();
      const pool = KFG.shuffle(list.filter((x) => x !== w)).sort((a, b) => like(b) - like(a));
      return [...new Set([...(NEAR[w.word] || []), ...pool.map((x) => x.word)])].filter((x) => x !== w.word).slice(0, 3);
    };
    // 3 other words of the stop with a picture (picture options: all different).
    const others = (/** @type {CHWord[]} */ list, /** @type {CHWord} */ w) =>
      KFG.shuffle(list.filter((x) => x !== w && x.pic && x.pic !== w.pic)).slice(0, 3);
    // Distractor syllables for build: from other words of the unit, not equal to one of the word's own.
    const extraFor = (/** @type {CHWord} */ w) => {
      const own = new Set(w.syl.map((s) => s.replace(STRESS, '')));
      const pool = KFG.shuffle(all.flatMap((x) => (x === w ? [] : x.syl)).filter((s) => !own.has(s.replace(STRESS, ''))));
      return [...new Set(pool)].slice(0, w.syl.length >= 4 ? 2 : 1);
    };
    const gapFor = (/** @type {CHWord} */ w) => {
      for (const [letter, ...rest] of GAPS) {
        const at = w.word.indexOf(letter);
        if (at >= 0) return { at, options: [letter, ...rest] };
      }
      return null;
    };
    // After every answer: the word by syllables, with the stress.
    const fact = (/** @type {CHWord} */ w) => w.syl.join('-');

    /** @param {CHStation} st @param {number} i @param {string[][]} stories @returns {ExamTask[]} */
    const tasksOf = (st, i, stories) => {
      const split = i < 6; // the first six stops show every word by syllables
      /** @type {ExamTask[]} */
      const out = [];
      for (const w of st.words) {
        const key = w.key;
        if (w.pic) {
          out.push({ type: 'read', key, q: Q.read, word: w, options: [w, ...others(st.words, w)], split, fact: fact(w) });
          out.push({ type: 'choice', key, q: Q.pic, options: [w.word, ...near(st.words, w)], answer: 0, art: key, fact: fact(w) });
          if (w.syl.length >= 2) out.push({ type: 'build', key, q: Q.build, word: w, extra: extraFor(w) });
        }
        out.push({ type: 'hear', key, q: Q.hear, word: w, options: [w.word, ...near(st.words, w)], fact: fact(w) });
        const gap = gapFor(w);
        if (gap) out.push({ type: 'gap', key, q: Q.gap, word: w, at: gap.at, options: gap.options, fact: fact(w) });
      }
      for (const [text, ask, ...options] of stories) out.push({ type: 'story', q: Q.story, text, ask, options });
      return out;
    };

    /** @type {CHContent} */
    const unit = {
      slug: 'chytanka',
      lang: 'uk',
      title: 'Читанка-мандрівка',
      subject: 'Українська мова',
      unitLabel: 'Українська · 10 міст',
      intro: 'Мандруй Україною і читай! У кожному місті — нові слова, а за кожне пройдене місто — печатка в паспорті мандрівника.',
      stations: route.map((st, i) => ({
        id: st.id,
        title: st.cityName,
        icon: st.icon,
        intro: `${st.theme}: ${st.words
          .slice(0, 3)
          .map((w) => w.word)
          .join(', ')}…`,
        tasks: tasksOf(st, i, ROUTE[i].stories),
      })),
      exam: { perStation: Object.fromEntries(route.map((st) => [st.id, 1])), redAfter: 3 },
      round: 6,
      hues: Object.fromEntries(route.map((st) => [st.id, st.hue])),
      sampling: { caps: { story: 1, build: 2, gap: 1, hear: 2 } },
      strings: STRINGS,
      lists: {
        praise: ['Чудово!', 'Супер!', 'Так тримати!', 'Молодець!', 'Ідеально!'],
        grades: ['Тренуйся далі!', 'Непогано', 'Добре', 'Дуже добре', 'Відмінно'],
      },
      testHook: '__ch',
      store: 'chytanka-words',
      route,
      words,
    };
    return unit;
  })()
);
