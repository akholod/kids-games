// Math exam prep (3º Primaria) — pure task engine, no DOM.
// Contract: ENGINE-API.md. Loads via <script src="engine.js"> or require('./engine.js'),
// either way the API lands on globalThis.MathExam.
'use strict';

(() => {
  const PLACES = [
    { key: 'UM', es: 'unidades de millar', ua: 'одиниці тисяч', value: 1000 },
    { key: 'C', es: 'centenas', ua: 'сотні', value: 100 },
    { key: 'D', es: 'decenas', ua: 'десятки', value: 10 },
    { key: 'U', es: 'unidades', ua: 'одиниці', value: 1 },
  ];
  const PLACE_BY_KEY = Object.fromEntries(PLACES.map((p) => [p.key, p]));
  const UA_GEN = { UM: 'тисяч', C: 'сотень', D: 'десятків', U: 'одиниць' };
  const ROUND_ES = { D: 'a las decenas', C: 'a las centenas', UM: 'a las unidades de millar' };
  const ROUND_UA = { D: 'десятків', C: 'сотень', UM: 'тисяч' };
  const LOWER_ES = { D: 'unidades', C: 'decenas', UM: 'centenas' };
  const ORDER = ['U', 'D', 'C', 'UM']; // right to left

  // Text language while a task is built or checked. Numbers/answers never depend on it.
  // 'uk': Spanish task + Ukrainian explanation in `ua` (also copied to `hint`).
  // 'es': Spanish only — no `ua`, the optional explanation of the task is `hint`, error objects have no explanation.
  let lang = 'uk';
  const withLang = (l, fn) => {
    const prev = lang;
    lang = l === 'es' ? 'es' : 'uk';
    try {
      return fn();
    } finally {
      lang = prev;
    }
  };
  const H = (ua, hs) => (lang === 'es' ? hs : ua);
  const err = (code, es, ua) => (lang === 'es' ? { code, es } : { code, es, ua });

  const TOPICS = [
    { key: 'valor', es: 'Taquilla', ua: 'Каса' },
    { key: 'columna', es: 'Pase a la columna', ua: 'Пас у стовпчик' },
    { key: 'redondeo', es: '¿A qué portería?', ua: 'У які ворота?' },
    { key: 'problemas', es: 'Problemas del club', ua: 'Задачі клубу' },
  ];

  const LEVELS = {
    valor: [
      { level: 1, es: 'Lugar de la cifra', ua: 'Місце цифри' },
      { level: 2, es: 'Valor de la cifra', ua: 'Значення цифри' },
      { level: 3, es: 'Mayor y menor valor', ua: 'Більше і менше значення' },
      { level: 4, es: 'Forma el número', ua: 'Склади число' },
      { level: 5, es: 'Descomposición', ua: 'Розклад числа' },
      { level: 6, es: 'Muro de descomposición', ua: 'Стіна розкладу' },
      { level: 7, es: 'Lee los paquetes', ua: 'Прочитай пачки' },
      { level: 8, es: 'Se lee', ua: 'Як читається' },
      { level: 9, es: 'Añade, quita y series', ua: 'Додай, відніми, послідовності' },
    ],
    columna: [
      { level: 1, es: 'Llevando una vez', ua: 'Один перенос / одне позичання' },
      { level: 2, es: 'Llevando varias veces', ua: 'Кілька переносів / позичань' },
      { level: 3, es: 'Con ceros', ua: 'З нулями' },
      { level: 4, es: 'Busca el error', ua: 'Знайди помилку' },
      { level: 5, es: 'Prueba de la resta', ua: 'Перевірка віднімання' },
      { level: 6, es: 'Número que falta', ua: 'Яке число пропущено' },
    ],
    redondeo: [
      { level: 1, es: 'Con la recta', ua: 'З числовою прямою' },
      { level: 2, es: 'Sin recta', ua: 'Без прямої' },
    ],
    problemas: [
      { level: 1, es: 'Juntar y quitar', ua: 'Додати чи відняти' },
      { level: 2, es: 'Comparar y completar', ua: 'Порівняти і доповнити' },
    ],
  };

  // Word problems: one operation each; templates return the Spanish text for (a, b).
  const PROBLEM_TEMPLATES = {
    1: {
      '+': [
        (a, b) => `En el estadio hay ${fmt(a)} aficionados. Llegan ${fmt(b)} más. ¿Cuántos aficionados hay ahora?`,
        (a, b) => `El club vendió ${fmt(a)} entradas el sábado y ${fmt(b)} el domingo. ¿Cuántas entradas vendió en total?`,
        (a, b) => `En la tienda del club hay ${fmt(a)} camisetas. Llegan ${fmt(b)} camisetas más. ¿Cuántas camisetas hay ahora?`,
        (a, b) => `Leo tiene ${fmt(a)} puntos en un videojuego de fútbol y gana ${fmt(b)} más. ¿Cuántos puntos tiene ahora?`,
        (a, b) =>
          `El club ha recaudado ${fmt(a)} euros con las entradas y ${fmt(b)} euros con las camisetas. ¿Cuántos euros ha recaudado en total?`,
        (a, b) => `En el almacén hay ${fmt(a)} balones azules y ${fmt(b)} balones blancos. ¿Cuántos balones hay en total?`,
        (a, b) =>
          `El lunes visitaron el museo del club ${fmt(a)} personas y el martes ${fmt(b)} personas. ¿Cuántas personas lo visitaron en los dos días?`,
        (a, b) => `El campo tiene ${fmt(a)} asientos en la grada norte y ${fmt(b)} en la grada sur. ¿Cuántos asientos hay en total?`,
      ],
      '-': [
        (a, b) => `La tienda del club tenía ${fmt(a)} balones. Vende ${fmt(b)}. ¿Cuántos balones le quedan?`,
        (a, b) => `El estadio tiene ${fmt(a)} entradas a la venta. Ya se han vendido ${fmt(b)}. ¿Cuántas entradas quedan?`,
        (a, b) => `En el estadio había ${fmt(a)} aficionados. Se marchan ${fmt(b)}. ¿Cuántos aficionados quedan?`,
        (a, b) => `El club tenía ${fmt(a)} euros en la caja y gasta ${fmt(b)} euros en equipaciones. ¿Cuántos euros le quedan?`,
        (a, b) => `Leo tenía ${fmt(a)} puntos en el videojuego y pierde ${fmt(b)}. ¿Cuántos puntos le quedan?`,
        (a, b) => `En el almacén había ${fmt(a)} camisetas. Se han vendido ${fmt(b)}. ¿Cuántas camisetas quedan?`,
        (a, b) => `Una caja de la tienda tenía ${fmt(a)} pegatinas de futbolistas. Se regalan ${fmt(b)}. ¿Cuántas pegatinas quedan?`,
        (a, b) => `El campo tiene ${fmt(a)} asientos y ${fmt(b)} están ocupados. ¿Cuántos asientos están libres?`,
      ],
    },
    2: {
      '+': [
        (a, b) => `Hugo tenía ${fmt(a)} cromos de futbolistas y le regalan ${fmt(b)}. ¿Cuántos cromos tiene ahora?`,
        (a, b) => `El club tenía ${fmt(a)} euros y recibe ${fmt(b)} euros de un patrocinador. ¿Cuántos euros tiene ahora?`,
        (a, b) => `Un equipo tenía ${fmt(a)} seguidores en las redes y se suman ${fmt(b)} más. ¿Cuántos seguidores tiene ahora?`,
        (a, b) => `La tienda tenía ${fmt(a)} bufandas y le llegan ${fmt(b)}. ¿Cuántas bufandas tiene ahora?`,
        (a, b) =>
          `Un jugador ha corrido ${fmt(a)} metros en el entrenamiento y ${fmt(b)} metros en el partido. ¿Cuántos metros ha corrido entre los dos?`,
        (a, b) => `El club tenía ${fmt(a)} entradas y imprime ${fmt(b)} más. ¿Cuántas entradas tiene ahora?`,
        (a, b) => `Para la final se han vendido ${fmt(a)} entradas y se han reservado ${fmt(b)} más. ¿Cuántas entradas están ocupadas?`,
        (a, b) =>
          `El equipo juvenil tiene ${fmt(a)} puntos en el torneo y el infantil tiene ${fmt(b)}. ¿Cuántos puntos tienen entre los dos?`,
        (a, b) => `En un humedal viven ${fmt(a)} patos y hay ${fmt(b)} ranas más que patos. ¿Cuántas ranas viven?`,
        (a, b) => `En la grada hay ${fmt(a)} aficionados locales y ${fmt(b)} visitantes más que locales. ¿Cuántos visitantes hay?`,
        (a, b) =>
          `Mateo tiene ${fmt(a)} cromos de futbolistas y su primo tiene ${fmt(b)} cromos más que él. ¿Cuántos cromos tiene su primo?`,
      ],
      '-': [
        (a, b) => `El club tiene ${fmt(a)} socios y el club vecino tiene ${fmt(b)}. ¿Cuántos socios más tiene el primer club?`,
        (a, b) => `Para llenar el estadio hacen falta ${fmt(a)} aficionados. Ya han llegado ${fmt(b)}. ¿Cuántos faltan para llenarlo?`,
        (a, b) => `El club quiere reunir ${fmt(a)} euros para un campo nuevo. Ya tiene ${fmt(b)} euros. ¿Cuántos euros le faltan?`,
        (a, b) => `El sábado hubo ${fmt(a)} aficionados en el estadio y el domingo ${fmt(b)}. ¿Cuántos aficionados más hubo el sábado?`,
        (a, b) =>
          `La tienda tiene ${fmt(a)} balones y el almacén tiene ${fmt(b)}. ¿Cuántos balones menos hay en el almacén que en la tienda?`,
        (a, b) => `Para ganar el premio hacen falta ${fmt(a)} puntos. El equipo tiene ${fmt(b)}. ¿Cuántos puntos le faltan?`,
        (a, b) => `Un equipo hizo ${fmt(a)} pases en la temporada y otro equipo hizo ${fmt(b)}. ¿Cuántos pases más hizo el primero?`,
        (a, b) =>
          `Un estadio tiene capacidad para ${fmt(a)} personas. Hoy hay ${fmt(b)} aficionados. ¿Cuántas personas faltan para llenarlo?`,
        (a, b) => `En un contenedor había ${fmt(b)} pilas. Los alumnos echan algunas más y ahora hay ${fmt(a)}. ¿Cuántas pilas echaron?`,
        (a, b) => `El club tenía ${fmt(b)} balones. Compra algunos más y ahora tiene ${fmt(a)}. ¿Cuántos balones compró?`,
      ],
    },
  };

  // Years: a = later year, b = earlier year.
  const YEAR_TEMPLATES = [
    (a, b) => `La primera vacuna se descubrió en ${fmt(b)}. En ${fmt(a)} la enfermedad desapareció. ¿Cuántos años pasaron?`,
    (a, b) => `El club se fundó en ${fmt(b)} y el estadio nuevo se inauguró en ${fmt(a)}. ¿Cuántos años pasaron?`,
  ];

  const PROBLEM_HINT = {
    1: ['Прочитай уважно. Подумай: стало більше чи менше?', 'Lee con atención. Piensa: ¿hay más o hay menos que al principio?'],
    2: [
      'Прочитай уважно. Подумай: що треба знайти — скільки разом чи яка різниця?',
      'Lee con atención. Piensa: ¿qué te preguntan? ¿Cuántos hay juntos o cuál es la diferencia?',
    ],
  };

  // Like the textbook: no separator up to 4 digits, point from 5 digits.
  function fmt(n) {
    const s = String(n);
    return s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s;
  }

  const WORDS_UNITS = [
    'cero',
    'uno',
    'dos',
    'tres',
    'cuatro',
    'cinco',
    'seis',
    'siete',
    'ocho',
    'nueve',
    'diez',
    'once',
    'doce',
    'trece',
    'catorce',
    'quince',
    'dieciséis',
    'diecisiete',
    'dieciocho',
    'diecinueve',
    'veinte',
    'veintiuno',
    'veintidós',
    'veintitrés',
    'veinticuatro',
    'veinticinco',
    'veintiséis',
    'veintisiete',
    'veintiocho',
    'veintinueve',
  ];
  const WORDS_TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const WORDS_HUNDREDS = [
    '',
    'ciento',
    'doscientos',
    'trescientos',
    'cuatrocientos',
    'quinientos',
    'seiscientos',
    'setecientos',
    'ochocientos',
    'novecientos',
  ];

  const wordsBelow100 = (n) => {
    if (n < 30) return WORDS_UNITS[n];
    return WORDS_TENS[Math.floor(n / 10)] + (n % 10 ? ` y ${WORDS_UNITS[n % 10]}` : '');
  };

  const wordsBelow1000 = (n) => {
    if (n === 100) return 'cien';
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return [h ? WORDS_HUNDREDS[h] : '', rest || !h ? wordsBelow100(rest) : ''].filter(Boolean).join(' ');
  };

  // Spanish words for 0..9999.
  const numberToWords = (n) => {
    const t = Math.floor(n / 1000);
    const rest = n % 1000;
    const head = t ? (t === 1 ? 'mil' : `${WORDS_UNITS[t]} mil`) : '';
    return [head, rest || !t ? wordsBelow1000(rest) : ''].filter(Boolean).join(' ');
  };

  const digits = (n) => ({
    UM: Math.floor(n / 1000) % 10,
    C: Math.floor(n / 100) % 10,
    D: Math.floor(n / 10) % 10,
    U: n % 10,
  });

  const roundTo = (n, place) => {
    const p = PLACE_BY_KEY[place].value;
    return Math.floor((n + p / 2) / p) * p;
  };

  const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const shuffle = (rng, arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const retry = (fn) => {
    for (let i = 0; i < 20000; i++) {
      const r = fn();
      if (r) return r;
    }
    throw new Error('generator failed');
  };

  const toNum = (v) => {
    if (typeof v === 'string') return Number(v.replace(/[.\s]/g, ''));
    return typeof v === 'number' ? v : NaN;
  };

  const packsTotal = (p) => p.UM * 1000 + p.C * 100 + p.D * 10 + p.U;
  const digitsArr = (n, len) => ORDER.slice(0, len).map((k) => digits(n)[k]);
  const lenOf = (n) => String(n).length;

  // ---- column arithmetic ------------------------------------------------

  const solveColumn = (op, a, b) => {
    const result = op === '+' ? a + b : a - b;
    const len = Math.max(lenOf(a), lenOf(b), lenOf(result));
    const A = digitsArr(a, len);
    const B = digitsArr(b, len);
    const steps = [];
    const marks = op === '+' ? { carry: {} } : { crossed: {}, newTop: {}, smallOne: {} };
    let carries = 0;
    let borrows = 0;
    let zeroChains = 0;

    if (op === '+') {
      let carryIn = 0;
      for (let i = 0; i < len; i++) {
        const s = A[i] + B[i] + carryIn;
        const carryOut = s >= 10 ? 1 : 0;
        steps.push({ place: ORDER[i], top: A[i], bottom: B[i], carryIn, digit: s % 10, carryOut });
        if (carryOut) {
          carries++;
          if (i + 1 < len) marks.carry[ORDER[i + 1]] = 1;
        }
        carryIn = carryOut;
      }
    } else {
      const cur = [...A];
      for (let i = 0; i < len; i++) {
        const top = cur[i];
        const borrowed = top < B[i];
        let lentFrom = null;
        if (borrowed) {
          let j = i + 1;
          while (j < len && cur[j] === 0) j++;
          for (let k = i + 1; k < j; k++) {
            cur[k] = 9;
            marks.crossed[ORDER[k]] = true;
            marks.newTop[ORDER[k]] = 9;
            zeroChains++;
          }
          cur[j] -= 1;
          marks.crossed[ORDER[j]] = true;
          marks.newTop[ORDER[j]] = cur[j];
          marks.smallOne[ORDER[i]] = true;
          lentFrom = ORDER[i + 1];
          borrows++;
        }
        const topAfter = borrowed ? top + 10 : top;
        steps.push({ place: ORDER[i], top, bottom: B[i], digit: topAfter - B[i], borrowed, topAfter, lentFrom });
      }
    }
    return { op, a, b, result, steps, marks, carries, borrows, zeroChains };
  };

  const columnData = (op, a, b) => {
    const { steps, marks, result } = solveColumn(op, a, b);
    return { op, a, b, result, steps, marks };
  };

  const hasZeroDigit = (n) => String(n).includes('0');

  const genColumn = (level, rng) => {
    const op = rng() < 0.5 ? '+' : '-';
    if (op === '+') {
      return retry(() => {
        const a = int(rng, 1000, 8999);
        const b = int(rng, 1000, 8999);
        if (a + b > 9999) return null;
        const { carries } = solveColumn('+', a, b);
        if (level === 1 && carries === 1) return { op, a, b };
        if (level === 2 && carries >= 2) return { op, a, b };
        if (level === 3 && carries >= 2 && (hasZeroDigit(a) || hasZeroDigit(b) || hasZeroDigit(a + b))) return { op, a, b };
        return null;
      });
    }
    return retry(() => {
      let a = int(rng, 1001, 9999);
      if (level === 3) {
        const zero = pick(rng, [['D'], ['C'], ['C', 'D']]);
        const d = digits(a);
        zero.forEach((k) => {
          d[k] = 0;
        });
        a = packsTotal(d);
      }
      if (a <= 1000) return null;
      const b = int(rng, 1000, a - 1);
      const { borrows, zeroChains } = solveColumn('-', a, b);
      if (level === 1 && borrows === 1 && zeroChains === 0) return { op, a, b };
      if (level === 2 && borrows >= 2 && zeroChains === 0) return { op, a, b };
      if (level === 3 && zeroChains >= 1) return { op, a, b };
      return null;
    });
  };

  const composeCols = (cols) => cols.reduce((s, d, i) => s + d * 10 ** i, 0);

  const COLUMN_ERRORS = {
    'forgot-carry': {
      es: 'Te has olvidado de llevar una. Cuando los sumandos de una columna suman 10 o más, escribe las unidades y lleva 1 a la columna de la izquierda.',
      ua: 'Не забудь перенести 1 у наступний стовпчик! Якщо в стовпчику вийшло 10 або більше, пишемо одиниці, а 1 додаємо до сусіднього зліва.',
    },
    'smaller-from-larger': {
      es: 'En cada columna has restado la cifra pequeña de la grande. Pero en una resta manda la cifra del minuendo (la de arriba): si es más pequeña que la del sustraendo, hay que pedir prestado a la de su izquierda.',
      ua: 'У кожному стовпчику віднімаємо нижню цифру від верхньої. Якщо верхня менша — позич 1 у сусіда зліва (3 стає 13).',
    },
    'forgot-decrement': {
      es: 'Has pedido prestado muy bien, pero no has quitado 1 a la cifra del minuendo de la que pediste. Táchala y escribe encima una cifra menos.',
      ua: 'Позичити — правильно! Але в цифри, у якої позичили, треба забрати 1. Закресли її і напиши зверху на 1 менше.',
    },
    misaligned: {
      es: 'Las cifras no están bien alineadas. Unidades debajo de unidades, decenas debajo de decenas, centenas debajo de centenas…',
      ua: 'Цифри написані не рівно. Одиниці під одиницями, десятки під десятками, сотні під сотнями…',
    },
    arith: {
      es: 'Casi lo tienes. Hay un pequeño error de cálculo en alguna columna. Revisa columna por columna, de derecha a izquierda.',
      ua: 'Майже! Десь у стовпчику маленька помилка в рахунку. Перевір кожен стовпчик справа наліво.',
    },
  };

  // Typical wrong results, column by column (also used to build "find the error" tasks).
  const MISTAKES = {
    'forgot-carry': (A, B) => composeCols(A.map((d, i) => (d + B[i]) % 10)),
    'smaller-from-larger': (A, B) => composeCols(A.map((d, i) => Math.abs(d - B[i]))),
    'forgot-decrement': (A, B) => composeCols(A.map((d, i) => (d < B[i] ? d + 10 - B[i] : d - B[i]))),
  };

  const columnCols = (a, b, result) => {
    const len = Math.max(lenOf(a), lenOf(b), lenOf(result));
    return [digitsArr(a, len), digitsArr(b, len)];
  };

  // Returns an error code for a wrong whole-column answer, or null if it is correct.
  const diagnoseColumn = (data, value) => {
    const { op, a, b, result } = data;
    if (value === result) return null;
    const [A, B] = columnCols(a, b, result);
    if (op === '+') {
      if (value === MISTAKES['forgot-carry'](A, B)) return 'forgot-carry';
      if (value === a + b * 10) return 'misaligned';
    } else {
      if (value === MISTAKES['smaller-from-larger'](A, B)) return 'smaller-from-larger';
      if (value === MISTAKES['forgot-decrement'](A, B)) return 'forgot-decrement';
      if (value === a - b * 10) return 'misaligned';
    }
    return 'arith';
  };

  const columnError = (code) => err(code, COLUMN_ERRORS[code].es, COLUMN_ERRORS[code].ua);

  const checkColumnStepIn = (task, stepIndex, digit, carryOrBorrow) => {
    const step = task.data.steps[stepIndex];
    if (!step) return { correct: false, error: err('no-step', 'Ese paso no existe.', 'Такого кроку немає.') };
    const d = toNum(digit);
    if (task.data.op === '-') {
      if (carryOrBorrow !== undefined && carryOrBorrow !== null && Boolean(carryOrBorrow) !== step.borrowed) {
        return {
          correct: false,
          error: step.borrowed
            ? err(
                'need-borrow',
                `${step.top} es menor que ${step.bottom}: hay que pedir prestado a la cifra de la izquierda.`,
                `${step.top} менше за ${step.bottom}: треба позичити 1 у сусіда зліва.`,
              )
            : err(
                'no-borrow',
                `${step.top} es mayor o igual que ${step.bottom}: aquí no hace falta pedir prestado.`,
                `${step.top} не менше за ${step.bottom}: тут позичати не треба.`,
              ),
        };
      }
      if (d === step.digit) return { correct: true };
      if (step.borrowed && d === step.bottom - step.top) return { correct: false, error: columnError('smaller-from-larger') };
      return {
        correct: false,
        error: err(
          'digit',
          `Calcula ${step.topAfter} − ${step.bottom}. Mira bien la cifra de arriba.`,
          `Порахуй ${step.topAfter} − ${step.bottom}. Подивись уважно на верхню цифру.`,
        ),
      };
    }
    if (carryOrBorrow !== undefined && carryOrBorrow !== null && Number(carryOrBorrow) !== step.carryOut) {
      return {
        correct: false,
        error: step.carryOut
          ? columnError('forgot-carry')
          : err('no-carry', 'Aquí la suma es menor que 10, no hay que llevar nada.', 'Тут сума менша за 10, переносити нічого не треба.'),
      };
    }
    if (d === step.digit) return { correct: true };
    const total = step.top + step.bottom + step.carryIn;
    return {
      correct: false,
      error: err(
        'digit',
        `Suma ${step.top} + ${step.bottom}${step.carryIn ? ' + 1 (la que llevabas)' : ''}. Si pasa de 9, escribe solo las unidades.`,
        `Додай ${step.top} + ${step.bottom}${step.carryIn ? ' + 1 (що перенесли)' : ''}${total >= 10 ? ' і запиши лише одиниці' : ''}.`,
      ),
    };
  };

  // ---- valor ---------------------------------------------------------------

  const distinctNumber = (rng, noZero) =>
    retry(() => {
      const n = int(rng, 1000, 9999);
      const d = Object.values(digits(n));
      if (new Set(d).size !== 4) return null;
      if (noZero && d.includes(0)) return null;
      return n;
    });

  const toChoices = (rng, values) =>
    shuffle(
      rng,
      values.map((v) => ({ label: fmt(v), value: v })),
    );

  const genMayorMenor = (rng) => {
    const digit = int(rng, 1, 9);
    const which = rng() < 0.5 ? 'menor' : 'mayor';
    const places = shuffle(rng, PLACES).slice(0, 3);
    const nums = places.map((pl) =>
      retry(() => {
        const d = {};
        PLACES.forEach((p) => {
          d[p.key] = p.key === pl.key ? digit : int(rng, 0, 9);
        });
        if (PLACES.some((p) => p.key !== pl.key && d[p.key] === digit) || d.UM === 0) return null;
        return packsTotal(d);
      }),
    );
    const vals = places.map((p) => p.value);
    const best = which === 'menor' ? Math.min(...vals) : Math.max(...vals);
    return {
      kind: 'choice',
      es: `¿En qué número tiene la cifra ${digit} el ${which} valor?`,
      ua: H(
        `У якому числі цифра ${digit} має ${which === 'menor' ? 'найменше' : 'найбільше'} значення?`,
        `Cuanto más a la izquierda está la cifra ${digit}, más vale. Mira dónde está en cada número.`,
      ),
      answer: nums[vals.indexOf(best)],
      choices: toChoices(rng, nums),
      data: { digit, which },
    };
  };

  const genMuro = (rng) => {
    const n = retry(() => {
      const x = int(rng, 1000, 9999);
      return Object.values(digits(x)).every(Boolean) ? x : null;
    });
    const d = digits(n);
    const form = pick(rng, [
      [
        ['UM', d.UM],
        ['C', d.C],
        ['D', d.D],
        ['U', d.U],
      ],
      [
        ['C', d.UM * 10 + d.C],
        ['D', d.D],
        ['U', d.U],
      ],
      [
        ['D', Math.floor(n / 10)],
        ['U', d.U],
      ],
      [
        ['UM', d.UM],
        ['D', d.C * 10 + d.D],
        ['U', d.U],
      ],
      [
        ['C', d.UM * 10 + d.C],
        ['U', d.D * 10 + d.U],
      ],
    ]);
    const blank = int(rng, 0, form.length - 1);
    const parts = form.map(([key, value], i) => ({ value: i === blank ? null : value, key }));
    return {
      kind: 'number',
      es: `Completa: ${n} = ${parts.map((p) => `${p.value === null ? '__' : p.value} ${p.key}`).join(' + ')}`,
      ua: H(
        'Заповни пропуск: 10 одиниць = 1 десяток, 10 десятків = 1 сотня, 10 сотень = 1 тисяча.',
        'Completa el hueco. Recuerda: 10 U = 1 D, 10 D = 1 C y 10 C = 1 UM.',
      ),
      answer: form[blank][1],
      data: { sub: 'muro', n, parts },
    };
  };

  const genSe = (rng) => {
    const n = int(rng, 1000, 9999);
    const words = numberToWords(n);
    if (rng() < 0.5) {
      const d = String(n).split('');
      const cands = new Set();
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          const x = [...d];
          [x[i], x[j]] = [x[j], x[i]];
          cands.add(Number(x.join('')));
        }
        const y = [...d];
        y[i] = String((Number(d[i]) + 1) % 10);
        cands.add(Number(y.join('')));
      }
      const fake = shuffle(
        rng,
        [...cands].filter((v) => v !== n && v >= 1000),
      );
      const nums = [n, ...fake.slice(0, 2)];
      return {
        kind: 'choice',
        es: `¿Cómo se lee ${n}?`,
        ua: H(
          `Як читається число ${n}?`,
          'Lee el número por partes: primero las unidades de millar, luego las centenas, las decenas y las unidades.',
        ),
        answer: n,
        choices: shuffle(
          rng,
          nums.map((v) => ({ label: numberToWords(v), value: v })),
        ),
        data: { sub: 'read', n, words },
      };
    }
    return {
      kind: 'number',
      es: `Escribe con cifras: ${words}`,
      ua: H('Запиши число цифрами.', 'Escribe cada parte con cifras y júntalas en un solo número.'),
      answer: n,
      data: { sub: 'write', n, words },
    };
  };

  const SERIE_STEPS = [1, 10, 100, 1000, 5];

  const genAnade = (rng) => {
    const type = pick(rng, ['add', 'sub', 'serie']);
    if (type === 'serie') {
      const step = pick(rng, SERIE_STEPS);
      const sign = rng() < 0.5 ? 1 : -1;
      const start = retry(() => {
        const x = int(rng, 1000, 9999);
        const last = x + sign * step * 3;
        return last >= 1000 && last <= 9999 ? x : null;
      });
      const terms = [0, 1, 2, 3].map((i) => start + sign * step * i);
      return {
        kind: 'number',
        es: `Continúa la serie: ${terms.slice(0, 3).join(', ')}, …`,
        ua: H(
          'Подивись, на скільки змінюється число, і продовж послідовність.',
          'Fíjate en cuánto cambia el número de un término al siguiente y sigue igual.',
        ),
        answer: terms[3],
        data: { sub: 'serie', terms, step: sign * step },
      };
    }
    const sign = type === 'add' ? 1 : -1;
    const { n, place, k } = retry(() => {
      const n = int(rng, 1000, 9999);
      const place = pick(rng, ['UM', 'C', 'D']);
      const k = int(rng, 1, 9);
      const r = n + sign * k * PLACE_BY_KEY[place].value;
      return r >= 1000 && r <= 9999 ? { n, place, k } : null;
    });
    return {
      kind: 'number',
      es: `¿Qué número obtienes si ${sign > 0 ? 'añades' : 'quitas'} ${k} ${place} a ${n}?`,
      ua: H(
        `Яке число вийде, якщо ${sign > 0 ? 'додати' : 'відняти'} ${k} ${UA_GEN[place]} ${sign > 0 ? 'до' : 'від'} ${n}?`,
        `Recuerda lo que vale cada lugar: 1 UM = 1000, 1 C = 100, 1 D = 10. ${k} ${place} son ${k * PLACE_BY_KEY[place].value}.`,
      ),
      answer: n + sign * k * PLACE_BY_KEY[place].value,
      data: { sub: type, n, place, k },
    };
  };

  const genValor = (level, rng) => {
    if (level === 1) {
      const n = distinctNumber(rng, false);
      const place = pick(rng, PLACES);
      const answer = digits(n)[place.key];
      return {
        kind: 'choice',
        es: `¿Qué cifra ocupa el lugar de las ${place.es} en ${fmt(n)}?`,
        ua: H(
          `Яка цифра стоїть на місці ${UA_GEN[place.key]} у числі ${fmt(n)}?`,
          'De derecha a izquierda van: unidades, decenas, centenas y unidades de millar.',
        ),
        answer,
        choices: toChoices(rng, Object.values(digits(n))),
        data: { n, place: place.key },
      };
    }
    if (level === 3) return genMayorMenor(rng);
    if (level === 2) {
      const n = distinctNumber(rng, true);
      const place = pick(rng, PLACES);
      const digit = digits(n)[place.key];
      return {
        kind: 'choice',
        es: `¿Cuánto vale la cifra ${digit} en ${fmt(n)}?`,
        ua: H(`Скільки «коштує» цифра ${digit} у числі ${fmt(n)}?`, 'Mira en qué lugar está la cifra. Ese lugar vale 1, 10, 100 o 1000.'),
        answer: digit * place.value,
        choices: toChoices(
          rng,
          PLACES.map((p) => digit * p.value),
        ),
        data: { n, digit, place: place.key },
      };
    }
    if (level === 4) {
      const target = int(rng, 100, 9999);
      return {
        kind: 'packs',
        es: `Forma el número ${fmt(target)} con unidades de millar, centenas, decenas y unidades.`,
        ua: H(
          `Склади число ${fmt(target)} з тисяч, сотень, десятків і одиниць.`,
          `Forma ${fmt(target)} con paquetes de 1000, 100, 10 y 1. Si tienes 10 paquetes iguales, agrúpalos en uno mayor.`,
        ),
        answer: digits(target),
        data: { target },
      };
    }
    if (level === 5) {
      const n = int(rng, 1000, 9999);
      return {
        kind: 'decompose',
        es: `Descompón el número ${fmt(n)} según el valor de sus cifras y la posición que ocupan.`,
        ua: H(
          `Розклади число ${fmt(n)} на тисячі, сотні, десятки й одиниці.`,
          'Mira cada cifra y el lugar que ocupa: unidades de millar, centenas, decenas y unidades.',
        ),
        answer: digits(n),
        data: { n },
      };
    }
    if (level === 6) return genMuro(rng);
    if (level === 8) return genSe(rng);
    if (level === 9) return genAnade(rng);
    const n = int(rng, 1000, 9999);
    const packs = digits(n);
    const moves = int(rng, 1, 2);
    for (let m = 0; m < moves; m++) {
      const ups = ['UM', 'C', 'D'].filter((k) => packs[k] > 0);
      if (!ups.length) break;
      const k = pick(rng, ups);
      packs[k] -= 1;
      packs[ORDER[ORDER.indexOf(k) - 1]] += 10;
    }
    const txt = (fn) =>
      PLACES.filter((p) => packs[p.key] > 0)
        .map(fn)
        .join(', ');
    return {
      kind: 'number',
      es: `¿Qué número es? ${txt((p) => `${packs[p.key]} ${p.key}`)}`,
      ua: H(
        'Яке це число? Перетвори пачки: 10 одиниць = 1 десяток, 10 десятків = 1 сотня…',
        '¿Qué número es? Convierte los paquetes: 10 U = 1 D, 10 D = 1 C, 10 C = 1 UM. Luego suma lo que vale cada uno.',
      ),
      answer: packsTotal(packs),
      data: { packs },
    };
  };

  // ---- redondeo --------------------------------------------------------------

  const genRound = (level, rng) => {
    const place = pick(rng, ['D', 'C', 'UM']);
    const p = PLACE_BY_KEY[place].value;
    const threeDigit = place !== 'UM' && rng() < 0.15;
    const minLow = threeDigit ? 100 : 1000;
    const maxLow = threeDigit ? 1000 - p : 9999 - p;
    const low = int(rng, minLow / p, Math.floor(maxLow / p)) * p;
    const midCase = rng() < 0.2;
    const offset = midCase
      ? p / 2
      : pick(
          rng,
          Array.from({ length: p - 1 }, (_, i) => i + 1).filter((o) => o !== p / 2),
        );
    const n = low + offset;
    const high = low + p;
    const mid = low + p / 2;
    const data = { n, place, low, high, mid };
    if (level === 2) data.hideLine = true;
    return {
      kind: 'round',
      es: `Redondea ${fmt(n)} ${ROUND_ES[place]}.`,
      ua: H(
        `Округли ${fmt(n)} до ${ROUND_UA[place]}.`,
        `Mira la cifra de las ${LOWER_ES[place]}: si es 5 o más, sube; si es menos de 5, se queda igual.`,
      ),
      answer: roundTo(n, place),
      data,
    };
  };

  // ---- problemas ---------------------------------------------------------------

  const genYears = (rng) => {
    const { a, b } = retry(() => {
      const a = int(rng, 1900, 2026);
      const b = int(rng, 1500, a - 1);
      return solveColumn('-', a, b).borrows >= 1 ? { a, b } : null;
    });
    const data = columnData('-', a, b);
    return { kind: 'problema', es: pick(rng, YEAR_TEMPLATES)(a, b), ua: H(...PROBLEM_HINT[2]), answer: data.result, data };
  };

  const genProblem = (level, rng) => {
    const op = rng() < 0.5 ? '+' : '-';
    if (level === 2 && op === '-' && rng() < 0.25) return genYears(rng);
    const { a, b } = retry(() => {
      const a = int(rng, 1000, op === '+' ? 8999 : 9999);
      const b = int(rng, 1000, op === '+' ? 8999 : a - 1);
      if (b >= a && op === '-') return null;
      if (op === '+' && a + b > 9999) return null;
      const s = solveColumn(op, a, b);
      return (op === '+' ? s.carries : s.borrows) >= 1 ? { a, b } : null;
    });
    const data = columnData(op, a, b);
    return {
      kind: 'problema',
      es: pick(rng, PROBLEM_TEMPLATES[level][op])(a, b),
      ua: H(...PROBLEM_HINT[level]),
      answer: data.result,
      data,
    };
  };

  const COLUMN_SYMBOL = { '+': '+', '-': '−' };

  const genFix = (rng) => {
    const wrongTask = rng() < 0.5;
    const op = rng() < 0.5 ? '+' : '-';
    const errorCode = wrongTask ? (op === '+' ? 'forgot-carry' : pick(rng, ['smaller-from-larger', 'forgot-decrement'])) : null;
    return retry(() => {
      const a = int(rng, 1001, op === '+' ? 8999 : 9999);
      const b = int(rng, 1000, op === '+' ? 8999 : a - 1);
      if (op === '+' ? a + b > 9999 : b >= a) return null;
      const s = solveColumn(op, a, b);
      if ((op === '+' ? s.carries : s.borrows) < 1 || s.zeroChains) return null;
      const [A, B] = columnCols(a, b, s.result);
      const shown = errorCode ? MISTAKES[errorCode](A, B) : s.result;
      const data = { op, a, b, shown, result: s.result, errorCode, steps: s.steps, marks: s.marks };
      if (errorCode && diagnoseColumn(data, shown) !== errorCode) return null;
      return {
        kind: 'fix',
        es: 'Comprueba si está bien resuelta. Si hay un error, corrígelo.',
        ua: H(
          'Перевір, чи правильно розв’язано. Якщо є помилка — виправ її.',
          'Revisa columna por columna, de derecha a izquierda. Si ves un error, escribe el resultado correcto.',
        ),
        answer: { ok: !errorCode, value: s.result },
        data,
      };
    });
  };

  const genPrueba = (rng) => {
    const bad = rng() < 0.3;
    const { M, S, shown } = retry(() => {
      const S = int(rng, 1000, 8999);
      const D = int(rng, 1000, 8999);
      const shown = bad ? D + pick(rng, [1, -1, 10, -10, 100, -100, 1000, -1000]) : D;
      if (D + S > 9999 || shown < 1000 || shown + S > 9999) return null;
      return solveColumn('+', shown, S).carries >= 1 ? { M: D + S, S, shown } : null;
    });
    const data = { ...columnData('+', shown, S), prueba: { minuendo: M, sustraendo: S, diferencia: shown, ok: shown + S === M } };
    return {
      kind: 'column',
      es: `Haz la prueba de la resta ${fmt(M)} − ${fmt(S)} = ${fmt(shown)}: suma la diferencia y el sustraendo.`,
      ua: H(
        'Перевірка віднімання: додай різницю і від’ємник. Якщо вийде зменшуване — все правильно.',
        'Suma la diferencia y el sustraendo. Si te da el minuendo, la resta está bien.',
      ),
      answer: data.result,
      data,
    };
  };

  const genFalta = (rng) => {
    const sub = pick(rng, ['minuendo', 'sumando', 'faltan', 'diferencia']);
    const withBorrow = (gen) =>
      retry(() => {
        const r = gen();
        return r && solveColumn(r.op, r.a, r.b).borrows >= 1 ? r : null;
      });
    let r;
    if (sub === 'minuendo') {
      r = retry(() => {
        const D = int(rng, 1000, 8999);
        const S = int(rng, 100, 8999);
        return D + S <= 9999 && solveColumn('+', D, S).carries >= 1 ? { op: '+', a: D, b: S, wrong: Math.abs(D - S) } : null;
      });
      r.es = `Halla el número que falta: __ − ${fmt(r.b)} = ${fmt(r.a)}`;
      r.ua = H('Знайди пропущене зменшуване.', 'Piensa: ¿qué número, al quitarle esa cantidad, deja esa diferencia?');
    } else if (sub === 'sumando') {
      r = withBorrow(() => {
        const T = rng() < 0.5 ? int(rng, 2, 9) * 1000 : int(rng, 20, 99) * 100;
        const A = int(rng, 1000, T - 100);
        return { op: '-', a: T, b: A, wrong: T + A };
      });
      r.es = `Halla el número que falta: ${fmt(r.b)} + __ = ${fmt(r.a)}`;
      r.ua = H('Знайди пропущений доданок.', 'Piensa: ¿cuánto hay que añadir para llegar al total?');
    } else if (sub === 'faltan') {
      r = withBorrow(() => {
        const from = int(rng, 1000, 8999);
        const to = int(rng, from + 100, 9999);
        return { op: '-', a: to, b: from, wrong: from + to };
      });
      r.es = `¿Cuántas unidades le faltan a ${fmt(r.b)} para ser ${fmt(r.a)}?`;
      r.ua = H('Скільки одиниць не вистачає?', 'Piensa: ¿cuánto le falta al número pequeño para llegar al grande?');
    } else {
      r = withBorrow(() => {
        const x = int(rng, 1000, 9999);
        const y = int(rng, 1000, 9999);
        return x === y ? null : { op: '-', a: Math.max(x, y), b: Math.min(x, y), wrong: x + y, x, y };
      });
      r.es = `Calcula la diferencia entre ${fmt(r.x)} y ${fmt(r.y)}.`;
      r.ua = H('Знайди різницю між двома числами.', 'La diferencia es lo que le sobra al número mayor respecto al menor.');
    }
    const data = { sub, ...columnData(r.op, r.a, r.b), wrongValue: r.wrong };
    return { kind: 'number', es: r.es, ua: r.ua, answer: data.result, data };
  };

  // ---- makeTask / checkAnswer ----------------------------------------------------

  const GENERATORS = {
    valor: genValor,
    columna: (level, rng) => {
      if (level === 4) return genFix(rng);
      if (level === 5) return genPrueba(rng);
      if (level === 6) return genFalta(rng);
      const { op, a, b } = genColumn(level, rng);
      const data = columnData(op, a, b);
      return {
        kind: 'column',
        es: `Coloca en torre y ${op === '+' ? 'calcula' : 'resta'}: ${fmt(a)} ${COLUMN_SYMBOL[op]} ${fmt(b)}`,
        ua:
          op === '+'
            ? H('Додай у стовпчик, справа наліво.', 'Suma en columna, de derecha a izquierda. Si te pasas de 9, te llevas una.')
            : H(
                'Відніми у стовпчик. Не вистачає — позич у сусіда зліва.',
                'Resta en columna, de derecha a izquierda. Si arriba hay menos, pide prestado a la cifra de la izquierda.',
              ),
        answer: data.result,
        data,
      };
    },
    redondeo: genRound,
    problemas: genProblem,
  };

  // `language`: 'uk' (default) or 'es'. Same rng → same numbers and answers in both.
  const makeTask = (topic, level = 1, rng = Math.random, language = 'uk') => {
    const gen = GENERATORS[topic];
    if (!gen) throw new Error(`Unknown topic: ${topic}`);
    const lv = Math.min(Math.max(Math.round(level) || 1, 1), LEVELS[topic].length);
    return withLang(language, () => {
      const { ua, ...task } = gen(lv, rng);
      const id = `${topic}${lv}-${Math.floor(rng() * 1e9).toString(36)}`;
      return { id, topic, level: lv, lang, ...task, ...(lang === 'uk' && { ua }), hint: ua };
    });
  };

  const wrong = (code, es, ua) => ({ correct: false, error: err(code, es, ua) });

  const checkChoice = (task, value) => {
    const v = toNum(value && typeof value === 'object' ? value.value : value);
    if (v === task.answer) return { correct: true };
    if (task.level === 3) {
      const { digit, which } = task.data;
      return wrong(
        'mayor-menor',
        `Cuanto más a la izquierda está una cifra, más vale. El ${which} valor de la cifra ${digit} es el del número en que está ${which === 'menor' ? 'más a la derecha' : 'más a la izquierda'}.`,
        `Чим лівіше цифра, тим більше вона значить. ${which === 'menor' ? 'Найменше' : 'Найбільше'} значення — там, де цифра ${digit} стоїть ${which === 'menor' ? 'правіше' : 'лівіше'} за всіх.`,
      );
    }
    if (task.level === 8) {
      return wrong(
        'read',
        `${fmt(task.answer)} se lee «${task.data.words}». Lee con calma: unidades de millar, centenas, decenas y unidades.`,
        `Число ${fmt(task.answer)} читається «${task.data.words}». Читай спокійно: тисячі, сотні, десятки, одиниці.`,
      );
    }
    if (task.level === 1) {
      return wrong(
        'place',
        'Esa cifra está en otro lugar. De derecha a izquierda: unidades, decenas, centenas y unidades de millar.',
        'Ця цифра стоїть на іншому місці. Справа наліво: одиниці, десятки, сотні, тисячі.',
      );
    }
    const { digit, place } = task.data;
    const pl = PLACE_BY_KEY[place];
    return wrong(
      'value',
      `La cifra ${digit} está en el lugar de las ${pl.es}, así que vale ${fmt(task.answer)}.`,
      `Цифра ${digit} стоїть на місці ${UA_GEN[place]}, тому вона дорівнює ${fmt(task.answer)}.`,
    );
  };

  const checkPacks = (task, value) => {
    const total = value && typeof value === 'object' ? packsTotal(value) : NaN;
    if (total === task.data.target) return { correct: true };
    return wrong(
      'total',
      `Con esos paquetes sale ${fmt(total)}. Tenemos que formar ${fmt(task.data.target)}.`,
      `Тут виходить ${fmt(total)}, а треба ${fmt(task.data.target)}.`,
    );
  };

  const checkDecompose = (task, value) => {
    const bad = () =>
      wrong(
        'decompose',
        'Mira cada cifra y su lugar: 4528 = 4 UM + 5 C + 2 D + 8 U, o 4000 + 500 + 20 + 8.',
        'Подивись на кожну цифру і її місце: 4528 = 4000 + 500 + 20 + 8.',
      );
    if (Array.isArray(value)) {
      const want = PLACES.map((p) => task.answer[p.key] * p.value)
        .filter(Boolean)
        .sort((x, y) => x - y);
      const got = value
        .map(toNum)
        .filter(Boolean)
        .sort((x, y) => x - y);
      return want.length === got.length && want.every((v, i) => v === got[i]) ? { correct: true } : bad();
    }
    if (value && typeof value === 'object' && PLACES.every((p) => Number(value[p.key]) === task.answer[p.key])) return { correct: true };
    return bad();
  };

  const FALTA_HINTS = {
    minuendo: ['El minuendo se halla sumando: diferencia + sustraendo.', 'Зменшуване знаходимо додаванням: різниця + від’ємник.'],
    sumando: [
      'Para hallar el sumando que falta, resta: suma total − sumando conocido.',
      'Невідомий доданок: від суми віднімаємо відомий доданок.',
    ],
    faltan: [
      'Para saber cuánto falta, resta: el número al que quieres llegar − el que tienes.',
      'Щоб дізнатись, скільки не вистачає: від потрібного числа віднімаємо те, що є.',
    ],
    diferencia: ['La diferencia es una resta: el número mayor − el menor.', 'Різниця — це віднімання: більше число мінус менше.'],
  };

  const numberError = (task) => {
    const { sub } = task.data;
    const ans = task.answer;
    if (FALTA_HINTS[sub]) return ['wrong', ...FALTA_HINTS[sub]];
    if (sub === 'muro') {
      return [
        'muro',
        'Fíjate en el valor de cada paquete: 1 UM = 10 C, 1 C = 10 D, 1 D = 10 U. Convierte para completar el muro.',
        'Дивись на значення кожної пачки: 1 тисяча = 10 сотень, 1 сотня = 10 десятків, 1 десяток = 10 одиниць.',
      ];
    }
    if (sub === 'write') {
      const { n, words } = task.data;
      const d = digits(n);
      const sum = [d.UM * 1000, d.C * 100, n % 100].filter(Boolean).join(' + ');
      return ['write', `«${words}» se escribe con cifras así: ${sum} = ${n}.`, `Запиши кожну частину цифрами й додай: ${sum} = ${n}.`];
    }
    if (sub === 'add' || sub === 'sub') {
      const { n, place, k } = task.data;
      const amount = k * PLACE_BY_KEY[place].value;
      return [
        'shift',
        `${sub === 'add' ? 'Añadir' : 'Quitar'} ${k} ${place} es ${sub === 'add' ? 'sumar' : 'restar'} ${amount}: ${n} ${sub === 'add' ? '+' : '−'} ${amount} = ${ans}.`,
        `${k} ${UA_GEN[place]} — це ${amount}: ${n} ${sub === 'add' ? '+' : '−'} ${amount} = ${ans}.`,
      ];
    }
    if (sub === 'serie') {
      const { terms, step } = task.data;
      return [
        'serie',
        `Mira cuánto cambia de un número al siguiente: de ${terms[0]} a ${terms[1]} hay ${step > 0 ? '+' : '−'}${Math.abs(step)}. Sigue igual.`,
        `Подивись, на скільки змінюється число: від ${terms[0]} до ${terms[1]} це ${step > 0 ? '+' : '−'}${Math.abs(step)}. Продовжуй так само.`,
      ];
    }
    return [
      'wrong',
      'Convierte los paquetes: 10 U = 1 D, 10 D = 1 C, 10 C = 1 UM. Luego suma el valor de cada paquete.',
      'Перетвори пачки: 10 одиниць = 1 десяток, 10 десятків = 1 сотня, 10 сотень = 1 тисяча. Потім додай.',
    ];
  };

  const checkNumber = (task, value) => {
    const v = toNum(value);
    if (v === task.answer) return { correct: true };
    const [code, es, ua] = numberError(task);
    if (FALTA_HINTS[task.data.sub] && v === task.data.wrongValue) {
      return wrong('wrong-op', `Has usado la operación contraria. ${es}`, `Тут інша дія. ${ua}`);
    }
    return wrong(code, es, ua);
  };

  const checkRound = (task, value) => {
    const v = toNum(value);
    if (v === task.answer) return { correct: true };
    const { n, place, low, high } = task.data;
    const p = PLACE_BY_KEY[place].value;
    const next = Math.floor((n % p) / (p / 10));
    if (v === low || v === high) {
      const mid = n === low + p / 2;
      const near = n - low < high - n ? low : high;
      return wrong(
        'direction',
        `${fmt(n)} está entre ${fmt(low)} y ${fmt(high)}. ${mid ? `Está justo en el medio: redondeamos hacia arriba, a ${fmt(high)}.` : `Está más cerca de ${fmt(near)}.`} (Mira la cifra de las ${LOWER_ES[place]}: es ${next}.)`,
        `${fmt(n)} між ${fmt(low)} і ${fmt(high)}. ${mid ? `Рівно посередині: округлюємо вгору, до ${fmt(high)}.` : `Ближче до ${fmt(near)}.`} Наступна цифра: ${next}.`,
      );
    }
    return wrong(
      'wrong',
      `El resultado tiene que estar entre ${fmt(low)} y ${fmt(high)}.`,
      `Відповідь має бути між ${fmt(low)} і ${fmt(high)}.`,
    );
  };

  const checkProblema = (task, value) => {
    const v = toNum(value);
    const { op, a, b, result } = task.data;
    if (v === result) return { correct: true };
    if (op === '-' && v === a + b) {
      return wrong(
        'wrong-op',
        'Has sumado, pero en este problema hay que restar: se quita, se compara o se busca lo que falta.',
        'Тут виконано додавання, а треба відняти: щось забрали, порівнюємо або шукаємо, скільки не вистачає.',
      );
    }
    if (op === '+' && v === Math.abs(a - b)) {
      return wrong(
        'wrong-op',
        'Has restado, pero en este problema hay que sumar: se juntan o se añaden cantidades.',
        'Тут виконано віднімання, а треба додати: кількості об’єднуються або додаються.',
      );
    }
    return { correct: false, error: columnError(diagnoseColumn(task.data, v)) };
  };

  // First step of a problem: "¿Qué operación?" op is '+' or '-' ('−' also accepted).
  const checkOp = (task, op) => withLang(task.lang, () => checkOpIn(task, op));
  const checkOpIn = (task, op) => {
    const chosen = op === '+' ? '+' : op === '-' || op === '−' ? '-' : null;
    if (chosen === task.data.op) return { correct: true };
    return task.data.op === '-'
      ? wrong(
          'wrong-op',
          'No es una suma. En este problema se quita, se compara o se busca lo que falta: eso es restar.',
          'Це не додавання. Тут щось забрали, порівнюємо або шукаємо, скільки не вистачає — це віднімання.',
        )
      : wrong(
          'wrong-op',
          'No es una resta. En este problema se juntan o se añaden cantidades: eso es sumar.',
          'Це не віднімання. Тут кількості об’єднуються або додаються — це додавання.',
        );
  };

  const FIX_SLIPS = {
    'forgot-carry': (data) => {
      const i = data.steps.findIndex((st) => st.carryOut);
      const place = ORDER[i + 1];
      return [
        `Se ha olvidado de llevar una en las ${PLACE_BY_KEY[place].es}: en la columna anterior los sumandos pasan de 9.`,
        `Забули перенести 1 у ${UA_GEN[place]}: у попередньому стовпчику сума більша за 9.`,
      ];
    },
    'smaller-from-larger': (data) => {
      const st = data.steps.find((x) => x.borrowed);
      return [
        `Se ha restado la cifra pequeña de la grande en las ${PLACE_BY_KEY[st.place].es}: ${st.top} es menor que ${st.bottom}, hay que pedir prestado.`,
        `У ${UA_GEN[st.place]} від меншої цифри відняли більшу: ${st.top} менше за ${st.bottom}, треба позичити.`,
      ];
    },
    'forgot-decrement': (data) => {
      const st = data.steps.find((x) => x.borrowed);
      return [
        `Se pidió prestado en las ${PLACE_BY_KEY[st.place].es}, pero no se quitó 1 a la cifra del minuendo en las ${PLACE_BY_KEY[st.lentFrom].es}.`,
        `У ${UA_GEN[st.place]} позичили, але в ${UA_GEN[st.lentFrom]} зменшуваного не забрали 1.`,
      ];
    },
  };

  const checkFix = (task, value) => {
    const { errorCode, result, shown } = task.data;
    const ok = value && typeof value === 'object' ? value.ok : undefined;
    if (ok === true) {
      if (!errorCode) return { correct: true };
      const [es, ua] = FIX_SLIPS[errorCode](task.data);
      return wrong('missed-error', `Hay un error. ${es}`, `Тут є помилка. ${ua}`);
    }
    if (ok !== false) return wrong('no-judgement', 'Decide primero si está bien o mal resuelta.', 'Спочатку вирішь: правильно чи ні.');
    if (!errorCode) {
      return wrong(
        'no-error',
        `Está bien resuelta: el resultado es ${fmt(result)}. Revisa columna por columna antes de decir que hay un error.`,
        `Тут усе правильно: результат ${fmt(result)}. Перевір стовпчик за стовпчиком.`,
      );
    }
    const v = toNum(value.value);
    if (v === result) return { correct: true };
    const [es, ua] = FIX_SLIPS[errorCode](task.data);
    return wrong(
      v === shown ? 'same-as-shown' : 'fix',
      `Sí, hay un error: ${es} El resultado correcto es ${fmt(result)}.`,
      `Так, помилка є: ${ua} Правильний результат: ${fmt(result)}.`,
    );
  };

  const CHECKERS = {
    fix: checkFix,
    choice: checkChoice,
    packs: checkPacks,
    decompose: checkDecompose,
    number: checkNumber,
    round: checkRound,
    problema: checkProblema,
    column: (task, value) => {
      const v = toNum(value);
      const code = diagnoseColumn(task.data, v);
      return code ? { correct: false, error: columnError(code) } : { correct: true };
    },
  };

  const checkAnswer = (task, value) => withLang(task.lang, () => CHECKERS[task.kind](task, value));
  const checkColumnStep = (task, stepIndex, digit, carryOrBorrow) =>
    withLang(task.lang, () => checkColumnStepIn(task, stepIndex, digit, carryOrBorrow));

  // ---- exam ----------------------------------------------------------------------

  const weightedPick = (rng, weights) => {
    const keys = TOPICS.map((t) => t.key);
    const w = keys.map((k) => (weights && weights[k] > 0 ? weights[k] : weights ? 0.05 : 1));
    let r = rng() * w.reduce((s, x) => s + x, 0);
    for (let i = 0; i < keys.length; i++) {
      r -= w[i];
      if (r < 0) return keys[i];
    }
    return keys[keys.length - 1];
  };

  const makeExam = ({ count = 12, weights, rng = Math.random, maxLevels, lang: language = 'uk' } = {}) => {
    const topics = TOPICS.map((t) => t.key);
    const order = shuffle(rng, topics).slice(0, count);
    while (order.length < count) order.push(weightedPick(rng, weights));
    return shuffle(rng, order).map((topic) => {
      const cap = Math.min((maxLevels && maxLevels[topic]) || LEVELS[topic].length, LEVELS[topic].length);
      return makeTask(topic, int(rng, 1, cap), rng, language);
    });
  };

  const weakWeights = (stats = {}) => {
    const out = {};
    TOPICS.forEach(({ key }) => {
      const s = stats[key];
      const acc = s && s.total > 0 ? s.right / s.total : 0.5;
      out[key] = 0.1 + (1 - acc);
    });
    return out;
  };

  globalThis.MathExam = {
    fmt,
    PLACES,
    TOPICS,
    LEVELS,
    digits,
    roundTo,
    makeTask,
    checkAnswer,
    checkColumnStep,
    checkOp,
    makeExam,
    weakWeights,
    solveColumn,
    numberToWords,
  };
})();
