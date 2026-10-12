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
  const ROUND_ES = { D: 'a la decena', C: 'a la centena', UM: 'al millar' };
  const ROUND_ES_NEXT = { D: 'más próxima', C: 'más próxima', UM: 'más próximo' };
  const ROUND_UA = { D: 'десятків', C: 'сотень', UM: 'тисяч' };
  const LOWER_ES = { D: 'unidades', C: 'decenas', UM: 'centenas' };
  const ORDER = ['U', 'D', 'C', 'UM']; // right to left

  const TOPICS = [
    { key: 'valor', es: 'Taquilla', ua: 'Каса' },
    { key: 'columna', es: 'Pase a la columna', ua: 'Пас у стовпчик' },
    { key: 'redondeo', es: '¿A qué portería?', ua: 'У які ворота?' },
    { key: 'estimacion', es: 'Mercado de fichajes', ua: 'Ринок трансферів' },
  ];

  const LEVELS = {
    valor: [
      { level: 1, es: 'Lugar de la cifra', ua: 'Місце цифри' },
      { level: 2, es: 'Valor de la cifra', ua: 'Значення цифри' },
      { level: 3, es: 'Forma el número', ua: 'Склади число' },
      { level: 4, es: 'Descomposición', ua: 'Розклад числа' },
      { level: 5, es: 'Lee los paquetes', ua: 'Прочитай пачки' },
    ],
    columna: [
      { level: 1, es: 'Suma sin llevar', ua: 'Додавання без переносу' },
      { level: 2, es: 'Suma llevando una', ua: 'Додавання з одним переносом' },
      { level: 3, es: 'Suma llevando varias', ua: 'Додавання з кількома переносами' },
      { level: 4, es: 'Resta sin pedir prestado', ua: 'Віднімання без позичання' },
      { level: 5, es: 'Resta pidiendo una vez', ua: 'Віднімання з одним позичанням' },
      { level: 6, es: 'Resta pidiendo varias veces', ua: 'Віднімання з кількома позичаннями' },
      { level: 7, es: 'Resta con ceros', ua: 'Віднімання з нулями' },
    ],
    redondeo: [
      { level: 1, es: 'A la decena', ua: 'До десятків' },
      { level: 2, es: 'A la centena', ua: 'До сотень' },
      { level: 3, es: 'Al millar', ua: 'До тисяч' },
      { level: 4, es: 'Mezcla y mitades', ua: 'Мікс і «рівно половина»' },
      { level: 5, es: 'Sin recta', ua: 'Без числової прямої' },
    ],
    estimacion: [
      { level: 1, es: 'Estima la compra', ua: 'Оціни покупку' },
      { level: 2, es: 'Compra grande', ua: 'Велика покупка' },
      { level: 3, es: 'Problemas', ua: 'Задачі' },
    ],
  };

  const ITEMS = [
    'Balón de fútbol', 'Botas', 'Camiseta del equipo', 'Guantes de portero',
    'Red de portería', 'Equipación completa', 'Entradas del partido', 'Silbato y tarjetas',
  ];

  const PROBLEMS = [
    { op: '+', es: (a, b) => `En el estadio hay ${fmt(a)} aficionados. Llegan ${fmt(b)} más. ¿Cuántos aficionados hay ahora?`, ua: 'Додай: було і прийшло ще.' },
    { op: '-', es: (a, b) => `El club tiene ${fmt(a)} entradas a la venta. Ya ha vendido ${fmt(b)}. ¿Cuántas entradas quedan?`, ua: 'Відніми: було мінус продано.' },
    { op: '+', es: (a, b) => `En la tienda del club hay ${fmt(a)} camisetas y llegan ${fmt(b)} más. ¿Cuántas camisetas hay en total?`, ua: 'Додай: усього футболок.' },
    { op: '-', es: (a, b) => `El estadio tiene ${fmt(a)} asientos y hoy hay ${fmt(b)} aficionados. ¿Cuántos asientos quedan libres?`, ua: 'Відніми: місця мінус глядачі.' },
  ];

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

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

  const genColumn = (level, rng) => {
    if (level <= 3) {
      return retry(() => {
        const a = level === 1 ? int(rng, 100, 899) : int(rng, 1000, 8999);
        const b = level === 1 ? int(rng, 100, 899) : int(rng, 100, 8999);
        if (a + b > 9999) return null;
        const { carries } = solveColumn('+', a, b);
        if (level === 1 && carries === 0 && a + b <= 999) return { op: '+', a, b };
        if (level === 2 && carries === 1) return { op: '+', a, b };
        if (level === 3 && carries >= 2) return { op: '+', a, b };
        return null;
      });
    }
    return retry(() => {
      let a = level <= 5 && rng() < 0.4 ? int(rng, 300, 999) : int(rng, 1000, 9999);
      if (level === 7) {
        const zero = pick(rng, [['D'], ['C'], ['C', 'D']]);
        const d = digits(a);
        zero.forEach((k) => { d[k] = 0; });
        a = packsTotal(d);
      }
      const b = int(rng, 100, a - 1);
      if (b >= a) return null;
      const { borrows, zeroChains } = solveColumn('-', a, b);
      if (level === 4 && borrows === 0) return { op: '-', a, b };
      if (level === 5 && borrows === 1 && zeroChains === 0) return { op: '-', a, b };
      if (level === 6 && borrows >= 2 && zeroChains === 0) return { op: '-', a, b };
      if (level === 7 && zeroChains >= 1) return { op: '-', a, b };
      return null;
    });
  };

  const composeCols = (cols) => cols.reduce((s, d, i) => s + d * 10 ** i, 0);

  const COLUMN_ERRORS = {
    'forgot-carry': {
      es: 'Te has olvidado de llevar una. Cuando una columna suma 10 o más, escribe las unidades y lleva 1 a la columna de la izquierda.',
      ua: 'Не забудь перенести 1 у наступний стовпчик! Якщо в стовпчику вийшло 10 або більше, пишемо одиниці, а 1 додаємо до сусіднього зліва.',
    },
    'smaller-from-larger': {
      es: 'En cada columna has restado la cifra pequeña de la grande. Pero en una resta la cifra de arriba es la que manda: si es más pequeña, hay que pedir prestado a la de su izquierda.',
      ua: 'У кожному стовпчику віднімаємо нижню цифру від верхньої. Якщо верхня менша — позич 1 у сусіда зліва (3 стає 13).',
    },
    'forgot-decrement': {
      es: 'Has pedido prestado muy bien, pero no has quitado 1 a la cifra de la que pediste. Táchala y escribe encima una cifra menos.',
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

  // Returns an error code for a wrong whole-column answer, or null if it is correct.
  const diagnoseColumn = (data, value) => {
    const { op, a, b, result } = data;
    if (value === result) return null;
    const len = Math.max(lenOf(a), lenOf(b), lenOf(result));
    const A = digitsArr(a, len);
    const B = digitsArr(b, len);
    if (op === '+') {
      if (value === composeCols(A.map((d, i) => (d + B[i]) % 10))) return 'forgot-carry';
      if (value === a + b * 10) return 'misaligned';
    } else {
      if (value === composeCols(A.map((d, i) => Math.abs(d - B[i])))) return 'smaller-from-larger';
      const noDec = A.map((d, i) => (d < B[i] ? d + 10 - B[i] : d - B[i]));
      if (value === composeCols(noDec)) return 'forgot-decrement';
      if (value === a - b * 10) return 'misaligned';
    }
    return 'arith';
  };

  const columnError = (code) => ({ code, ...COLUMN_ERRORS[code] });

  const checkColumnStep = (task, stepIndex, digit, carryOrBorrow) => {
    const step = task.data.steps[stepIndex];
    if (!step) return { correct: false, error: { code: 'no-step', es: 'Ese paso no existe.', ua: 'Такого кроку немає.' } };
    const d = toNum(digit);
    if (task.data.op === '-') {
      if (carryOrBorrow !== undefined && carryOrBorrow !== null && Boolean(carryOrBorrow) !== step.borrowed) {
        return {
          correct: false,
          error: step.borrowed
            ? { code: 'need-borrow', es: `${step.top} es menor que ${step.bottom}: hay que pedir prestado a la cifra de la izquierda.`, ua: `${step.top} менше за ${step.bottom}: треба позичити 1 у сусіда зліва.` }
            : { code: 'no-borrow', es: `${step.top} es mayor o igual que ${step.bottom}: aquí no hace falta pedir prestado.`, ua: `${step.top} не менше за ${step.bottom}: тут позичати не треба.` },
        };
      }
      if (d === step.digit) return { correct: true };
      if (step.borrowed && d === step.bottom - step.top) return { correct: false, error: columnError('smaller-from-larger') };
      return {
        correct: false,
        error: {
          code: 'digit',
          es: `Calcula ${step.topAfter} − ${step.bottom}. Mira bien la cifra de arriba.`,
          ua: `Порахуй ${step.topAfter} − ${step.bottom}. Подивись уважно на верхню цифру.`,
        },
      };
    }
    if (carryOrBorrow !== undefined && carryOrBorrow !== null && Number(carryOrBorrow) !== step.carryOut) {
      return {
        correct: false,
        error: step.carryOut
          ? { code: 'forgot-carry', ...COLUMN_ERRORS['forgot-carry'] }
          : { code: 'no-carry', es: 'Aquí la suma es menor que 10, no hay que llevar nada.', ua: 'Тут сума менша за 10, переносити нічого не треба.' },
      };
    }
    if (d === step.digit) return { correct: true };
    const total = step.top + step.bottom + step.carryIn;
    return {
      correct: false,
      error: {
        code: 'digit',
        es: `Suma ${step.top} + ${step.bottom}${step.carryIn ? ' + 1 (la que llevabas)' : ''}. Si pasa de 9, escribe solo las unidades.`,
        ua: `Додай ${step.top} + ${step.bottom}${step.carryIn ? ' + 1 (що перенесли)' : ''}${total >= 10 ? ' і запиши лише одиниці' : ''}.`,
      },
    };
  };

  // ---- valor ---------------------------------------------------------------

  const distinctNumber = (rng, noZero) => retry(() => {
    const n = int(rng, 1000, 9999);
    const d = Object.values(digits(n));
    if (new Set(d).size !== 4) return null;
    if (noZero && d.includes(0)) return null;
    return n;
  });

  const toChoices = (rng, values) => shuffle(rng, values.map((v) => ({ label: fmt(v), value: v })));

  const genValor = (level, rng) => {
    if (level === 1) {
      const n = distinctNumber(rng, false);
      const place = pick(rng, PLACES);
      const answer = digits(n)[place.key];
      return {
        kind: 'choice',
        es: `¿Qué cifra ocupa el lugar de las ${place.es} en ${fmt(n)}?`,
        ua: `Яка цифра стоїть на місці ${UA_GEN[place.key]} у числі ${fmt(n)}?`,
        answer,
        choices: toChoices(rng, Object.values(digits(n))),
        data: { n, place: place.key },
      };
    }
    if (level === 2) {
      const n = distinctNumber(rng, true);
      const place = pick(rng, PLACES);
      const digit = digits(n)[place.key];
      return {
        kind: 'choice',
        es: `¿Cuánto vale la cifra ${digit} en ${fmt(n)}?`,
        ua: `Скільки «коштує» цифра ${digit} у числі ${fmt(n)}?`,
        answer: digit * place.value,
        choices: toChoices(rng, PLACES.map((p) => digit * p.value)),
        data: { n, digit, place: place.key },
      };
    }
    if (level === 3) {
      const target = int(rng, 100, 9999);
      return {
        kind: 'packs',
        es: `Forma el número ${fmt(target)} con unidades de millar, centenas, decenas y unidades.`,
        ua: `Склади число ${fmt(target)} з тисяч, сотень, десятків і одиниць.`,
        answer: digits(target),
        data: { target },
      };
    }
    if (level === 4) {
      const n = int(rng, 1000, 9999);
      return {
        kind: 'decompose',
        es: `Descompón el número ${fmt(n)}.`,
        ua: `Розклади число ${fmt(n)} на тисячі, сотні, десятки й одиниці.`,
        answer: digits(n),
        data: { n },
      };
    }
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
    const txt = (fn) => PLACES.filter((p) => packs[p.key] > 0).map(fn).join(', ');
    return {
      kind: 'number',
      es: `¿Qué número es? ${txt((p) => `${packs[p.key]} ${p.key}`)}`,
      ua: 'Яке це число? Перетвори пачки: 10 одиниць = 1 десяток, 10 десятків = 1 сотня…',
      answer: packsTotal(packs),
      data: { packs },
    };
  };

  // ---- redondeo --------------------------------------------------------------

  const genRound = (level, rng) => {
    const place = level === 1 ? 'D' : level === 2 ? 'C' : level === 3 ? 'UM' : pick(rng, ['D', 'C', 'UM']);
    const p = PLACE_BY_KEY[place].value;
    const midCase = level >= 4 && rng() < 0.25;
    const maxHigh = Math.floor(9999 / p) * p;
    const low = int(rng, 1, maxHigh / p - 1) * p;
    let offset = midCase ? p / 2 : int(rng, 1, p - 1);
    if (!midCase && offset === p / 2) offset = level >= 4 ? offset : offset - 1 || offset + 1;
    const n = low + offset;
    const high = low + p;
    const mid = low + p / 2;
    return {
      kind: 'round',
      es: `Redondea ${fmt(n)} ${ROUND_ES[place]} ${ROUND_ES_NEXT[place]}.`,
      ua: `Округли ${fmt(n)} до ${ROUND_UA[place]}.`,
      answer: roundTo(n, place),
      data: { n, place, low, high, mid },
    };
  };

  // ---- estimacion ------------------------------------------------------------

  const genEstimate = (level, rng) => {
    if (level === 3) {
      const prob = pick(rng, PROBLEMS);
      const { a, b } = retry(() => {
        const a = int(rng, 1000, 8999);
        const b = int(rng, 100, prob.op === '+' ? 9999 - a : a - 1);
        return b >= 100 && (prob.op === '+' || b < a) && (prob.op === '-' || a + b <= 9999) ? { a, b } : null;
      });
      return {
        kind: 'number',
        es: prob.es(a, b),
        ua: prob.ua,
        answer: prob.op === '+' ? a + b : a - b,
        data: { problema: true, op: prob.op, a, b },
      };
    }
    const place = level === 1 ? 'C' : pick(rng, ['C', 'UM']);
    const count = level === 1 ? 2 : 3;
    const p = PLACE_BY_KEY[place].value;
    const lo = place === 'UM' ? 600 : 120;
    const hi = place === 'UM' ? 3000 : level === 1 ? 2400 : 2800;
    return retry(() => {
      const names = shuffle(rng, ITEMS).slice(0, count);
      const items = names.map((name) => ({ name, price: int(rng, lo, hi) }));
      if (items.some((it) => it.price % p === 0)) return null;
      const rounded = items.map((it) => roundTo(it.price, place));
      const exact = items.reduce((s, it) => s + it.price, 0);
      const estimate = rounded.reduce((s, v) => s + v, 0);
      if (exact > 9999 || exact === estimate) return null;
      const fits = rng() < 0.5;
      const delta = int(rng, 1, 30) * 100;
      const budget = Math.round((fits ? exact + delta : exact - delta) / 100) * 100;
      if (budget <= 0 || budget > 9999) return null;
      const margin = (count * p) / 2;
      if (Math.abs(budget - exact) <= margin || Math.abs(budget - estimate) <= margin) return null;
      if ((budget >= exact) !== fits || (budget >= estimate) !== fits) return null;
      const list = items.map((it) => `${it.name.toLowerCase()} ${fmt(it.price)} €`).join(', ');
      return {
        kind: 'estimate',
        es: `Tienes ${fmt(budget)} € para el club. Quieres comprar: ${list}. Estima el total redondeando cada precio ${ROUND_ES[place]} ${ROUND_ES_NEXT[place]}. ¿Te alcanza el dinero?`,
        ua: `У тебе ${fmt(budget)} €. Округли ціни до ${ROUND_UA[place]}, оціни суму, потім порахуй точно. Чи вистачає грошей?`,
        answer: { estimate, exact, fits },
        data: { items, budget, place, rounded, estimate, exact, fits },
      };
    });
  };

  // ---- makeTask / checkAnswer ----------------------------------------------------

  const GENERATORS = {
    valor: genValor,
    columna: (level, rng) => {
      const { op, a, b } = genColumn(level, rng);
      const data = columnData(op, a, b);
      return {
        kind: 'column',
        es: `Calcula: ${fmt(a)} ${op === '+' ? '+' : '−'} ${fmt(b)}`,
        ua: op === '+' ? 'Додай у стовпчик, справа наліво.' : 'Відніми у стовпчик. Не вистачає — позич у сусіда зліва.',
        answer: data.result,
        data,
      };
    },
    redondeo: genRound,
    estimacion: genEstimate,
  };

  const makeTask = (topic, level = 1, rng = Math.random) => {
    const gen = GENERATORS[topic];
    if (!gen) throw new Error(`Unknown topic: ${topic}`);
    const lv = Math.min(Math.max(Math.round(level) || 1, 1), LEVELS[topic].length);
    const task = gen(lv, rng);
    return { id: `${topic}${lv}-${Math.floor(rng() * 1e9).toString(36)}`, topic, level: lv, ...task };
  };

  const wrong = (code, es, ua) => ({ correct: false, error: { code, es, ua } });

  const checkChoice = (task, value) => {
    const v = toNum(value && typeof value === 'object' ? value.value : value);
    if (v === task.answer) return { correct: true };
    if (task.level === 1) {
      return wrong('place', 'Esa cifra está en otro lugar. De derecha a izquierda: unidades, decenas, centenas y unidades de millar.', 'Ця цифра стоїть на іншому місці. Справа наліво: одиниці, десятки, сотні, тисячі.');
    }
    const { digit, place } = task.data;
    const pl = PLACE_BY_KEY[place];
    return wrong('value', `La cifra ${digit} está en el lugar de las ${pl.es}, así que vale ${fmt(task.answer)}.`, `Цифра ${digit} стоїть на місці ${UA_GEN[place]}, тому вона дорівнює ${fmt(task.answer)}.`);
  };

  const checkPacks = (task, value) => {
    const total = value && typeof value === 'object' ? packsTotal(value) : NaN;
    if (total === task.data.target) return { correct: true };
    return wrong('total', `Con esos paquetes sale ${fmt(total)}. Tenemos que formar ${fmt(task.data.target)}.`, `Тут виходить ${fmt(total)}, а треба ${fmt(task.data.target)}.`);
  };

  const checkDecompose = (task, value) => {
    const bad = () => wrong('decompose', 'Mira cada cifra y su lugar: 4.528 = 4 UM + 5 C + 2 D + 8 U, o 4.000 + 500 + 20 + 8.', 'Подивись на кожну цифру і її місце: 4.528 = 4.000 + 500 + 20 + 8.');
    if (Array.isArray(value)) {
      const want = PLACES.map((p) => task.answer[p.key] * p.value).filter(Boolean).sort((x, y) => x - y);
      const got = value.map(toNum).filter(Boolean).sort((x, y) => x - y);
      return want.length === got.length && want.every((v, i) => v === got[i]) ? { correct: true } : bad();
    }
    if (value && typeof value === 'object' && PLACES.every((p) => Number(value[p.key]) === task.answer[p.key])) return { correct: true };
    return bad();
  };

  const checkNumber = (task, value) => {
    const v = toNum(value);
    if (v === task.answer) return { correct: true };
    if (task.data.op) {
      const code = diagnoseColumn({ ...task.data, result: task.answer }, v);
      return { correct: false, error: columnError(code) };
    }
    return wrong('wrong', 'Convierte los paquetes: 10 U = 1 D, 10 D = 1 C, 10 C = 1 UM. Luego suma el valor de cada paquete.', 'Перетвори пачки: 10 одиниць = 1 десяток, 10 десятків = 1 сотня, 10 сотень = 1 тисяча. Потім додай.');
  };

  const checkRound = (task, value) => {
    const v = toNum(value);
    if (v === task.answer) return { correct: true };
    const { n, place, low, high } = task.data;
    const p = PLACE_BY_KEY[place].value;
    const next = Math.floor((n % p) / (p / 10));
    if (v === low || v === high) {
      return wrong('direction', `Mira la cifra de las ${LOWER_ES[place]}: es ${next}. Si es 5 o más, el número sube; si es menos de 5, se queda.`, `Подивись на наступну цифру: ${next}. Якщо вона 5 або більше — число росте вгору, якщо менше 5 — залишається.`);
    }
    return wrong('wrong', `El resultado tiene que estar entre ${fmt(low)} y ${fmt(high)}.`, `Відповідь має бути між ${fmt(low)} і ${fmt(high)}.`);
  };

  const checkEstimate = (task, value) => {
    const d = task.data;
    const ask = value && typeof value === 'object' ? value : {};
    const checks = {
      estimate: () => {
        const v = toNum(ask.value);
        if (v === d.estimate) return { correct: true };
        if (v === d.exact) return wrong('estimate-exact', 'Ese es el total exacto. Para estimar, primero redondea cada precio y luego suma.', 'Це точна сума. Щоб оцінити — спочатку округли кожну ціну, потім додай.');
        return wrong('estimate', `Redondea cada precio (${d.rounded.map(fmt).join(' + ')}) y suma los redondeados.`, `Округли кожну ціну (${d.rounded.map(fmt).join(' + ')}) і додай.`);
      },
      exact: () => {
        const v = toNum(ask.value);
        if (v === d.exact) return { correct: true };
        if (v === d.estimate) return wrong('exact-estimate', 'Ese es el total estimado. Ahora suma los precios exactos, sin redondear.', 'Це оцінка. Тепер додай точні ціни, без округлення.');
        return wrong('exact', 'Suma los precios exactos en columna, llevando cuando haga falta.', 'Додай точні ціни у стовпчик, не забувай переносити.');
      },
      fits: () => {
        const v = ask.value === 'yes' || ask.value === 'sí' ? true : ask.value === 'no' ? false : ask.value;
        if (v === d.fits) return { correct: true };
        return wrong('fits', `Compara el total (${fmt(d.exact)} €) con tu dinero (${fmt(d.budget)} €): ${d.fits ? 'el total es menor, sí te alcanza' : 'el total es mayor, no te alcanza'}.`, `Порівняй суму (${fmt(d.exact)} €) з твоїми грошима (${fmt(d.budget)} €): ${d.fits ? 'сума менша, грошей вистачає' : 'сума більша, грошей не вистачає'}.`);
      },
    };
    if (checks[ask.phase]) return checks[ask.phase]();
    const all = ['estimate', 'exact', 'fits'].every((k) => d[k] === ask[k]);
    return all ? { correct: true } : wrong('estimate', 'Revisa los tres pasos: estimar, calcular exacto y comparar con tu dinero.', 'Перевір три кроки: оцінка, точна сума, порівняння з грошима.');
  };

  const CHECKERS = {
    choice: checkChoice,
    packs: checkPacks,
    decompose: checkDecompose,
    number: checkNumber,
    round: checkRound,
    estimate: checkEstimate,
    column: (task, value) => {
      const v = toNum(value);
      const code = diagnoseColumn(task.data, v);
      return code ? { correct: false, error: columnError(code) } : { correct: true };
    },
  };

  const checkAnswer = (task, value) => CHECKERS[task.kind](task, value);

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

  const makeExam = ({ count = 12, weights, rng = Math.random, maxLevels } = {}) => {
    const topics = TOPICS.map((t) => t.key);
    const order = shuffle(rng, topics).slice(0, count);
    while (order.length < count) order.push(weightedPick(rng, weights));
    return shuffle(rng, order).map((topic) => {
      const cap = Math.min((maxLevels && maxLevels[topic]) || LEVELS[topic].length, LEVELS[topic].length);
      return makeTask(topic, int(rng, 1, cap), rng);
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
    fmt, PLACES, TOPICS, LEVELS, digits, roundTo,
    makeTask, checkAnswer, checkColumnStep, makeExam, weakWeights,
    solveColumn,
  };
})();
