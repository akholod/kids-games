'use strict';
(() => {
  const SLUG = 'football-quiz';
  const ROUND = 12;
  const PER_COIN = 5;
  const GOAL_STREAK = 3;
  const ES = KF.lang === 'es';
  const T = KF.i18n({
    uk: {
      title: 'Футбольний квіз — Keeper Fun Games',
      coins: 'Монети',
      back: '← До каталогу',
      eyebrow: 'UA · ES · EN',
      h1: 'Футбольний квіз',
      sub: 'Чемпіонати, клуби, зірки й правила. Питання українською, español та English.',
      level: 'Рівень',
      'lvl.1.name': 'Фанат', 'lvl.1.desc': 'Для тих, хто любить футбол',
      'lvl.2.name': 'Експерт', 'lvl.2.desc': 'Роки, рекорди, деталі',
      'lvl.mix.name': 'Мікс', 'lvl.mix.desc': 'Усе разом',
      count: '{n} питань',
      rule1: 'Перша помилка — жовта картка, друга — червона, і раунд починається знову.',
      rule2: 'Кожні 5 правильних відповідей — 1 монета.',
      'meter.have': 'Уже {n} з {max}.',
      'stat.plays': 'раундів', 'stat.best': 'рекорд', 'stat.goals': 'голів',
      start: 'Почати матч ▶',
      board: 'Наші',
      'board.aria': 'Рахунок: наші {n}, суперник 0',
      'pitch.title': '3 правильні поспіль — гол!',
      goal: 'ГОЛ!',
      'cards.aria': 'Картки',
      'cards.none': 'Карток немає',
      'cards.yellow': 'Картки: жовта',
      'cards.both': 'Картки: жовта і червона',
      'ua.aria': 'Переклад українською',
      'ua.title': 'Переклад українською (клавіша U)',
      'hint.ua': 'Клавіші 1–4 · U — переклад · Esc — вийти',
      'hint.plain': 'Клавіші 1–4 · Esc — вийти',
      meter: 'до монети',
      'meter.aria': 'До монети: {n} з {max}',
      'cat.wc': '🏆 Турніри', 'cat.clubs': '🏟️ Клуби', 'cat.players': '⭐ Гравці', 'cat.rules': '📏 Правила',
      question: 'Питання {n}/{max}',
      goalMsg: 'Три поспіль — це гол! ⚽🥅',
      coinMsg: '5 правильних — тримай монету! 🪙',
      red: 'Червона картка!',
      yellow: 'Жовта картка!',
      'red.text': 'Друга помилка — раунд починається знову. Ти зможеш!',
      'yellow.text': 'Ще одна помилка — і буде червона картка.',
      right: 'Правильно: ',
      restart: 'Почати знову ↺',
      result: 'Результат →',
      next: 'Далі →',
      'fin.perfect': 'Суха гра! 🧤',
      'fin.good': 'Чудовий матч! 🏆',
      'fin.end': 'Фінальний свисток!',
      'sum.goals': 'голів', 'sum.coins': 'монет', 'sum.yellow': 'жовта картка', 'sum.none': 'карток',
      'fin.bonus': 'Без жодної помилки — бонус +5 🪙!',
      'fin.almost': 'Одна жовта картка — майже ідеально!',
      'fin.toCoin': 'До наступної монети: {n} з {max} ⚽.',
      'fin.default': 'Гарна гра! Зіграємо ще?',
      again: 'Ще раунд ↺',
      catalog: 'До каталогу',
      loadFail: 'Не вдалося завантажити питання. Онови сторінку.',
    },
    es: {
      title: 'Quiz de fútbol — Keeper Fun Games',
      coins: 'Monedas',
      back: '← Al catálogo',
      eyebrow: 'ES',
      h1: 'Quiz de fútbol',
      sub: 'Mundiales, clubes, estrellas y reglas del fútbol. ¡Demuestra cuánto sabes!',
      level: 'Nivel',
      'lvl.1.name': 'Aficionado', 'lvl.1.desc': 'Para quien ama el fútbol',
      'lvl.2.name': 'Experto', 'lvl.2.desc': 'Años, récords y detalles',
      'lvl.mix.name': 'Mezcla', 'lvl.mix.desc': 'Todo junto',
      count: '{n} preguntas',
      rule1: 'El primer fallo es tarjeta amarilla, el segundo roja, y la ronda empieza de nuevo.',
      rule2: 'Cada 5 respuestas correctas, 1 moneda.',
      'meter.have': 'Ya llevas {n} de {max}.',
      'stat.plays': 'rondas', 'stat.best': 'récord', 'stat.goals': 'goles',
      start: 'Empezar partido ▶',
      board: 'Nosotros',
      'board.aria': 'Marcador: nosotros {n}, rival 0',
      'pitch.title': '¡3 aciertos seguidos: gol!',
      goal: '¡GOL!',
      'cards.aria': 'Tarjetas',
      'cards.none': 'Sin tarjetas',
      'cards.yellow': 'Tarjetas: amarilla',
      'cards.both': 'Tarjetas: amarilla y roja',
      'ua.aria': 'Traducción',
      'ua.title': 'Traducción',
      'hint.ua': 'Teclas 1–4 · Esc — salir',
      'hint.plain': 'Teclas 1–4 · Esc — salir',
      meter: 'para moneda',
      'meter.aria': 'Para la moneda: {n} de {max}',
      'cat.wc': '🏆 Torneos', 'cat.clubs': '🏟️ Clubes', 'cat.players': '⭐ Jugadores', 'cat.rules': '📏 Reglas',
      question: 'Pregunta {n}/{max}',
      goalMsg: '¡Tres seguidas, es gol! ⚽🥅',
      coinMsg: '¡5 aciertos, toma una moneda! 🪙',
      red: '¡Tarjeta roja!',
      yellow: '¡Tarjeta amarilla!',
      'red.text': 'Segundo fallo: la ronda empieza de nuevo. ¡Tú puedes!',
      'yellow.text': 'Otro fallo más y llega la tarjeta roja.',
      right: 'Correcto: ',
      restart: 'Empezar otra vez ↺',
      result: 'Resultado →',
      next: 'Siguiente →',
      'fin.perfect': '¡Portería a cero! 🧤',
      'fin.good': '¡Gran partido! 🏆',
      'fin.end': '¡Pitido final!',
      'sum.goals': 'goles', 'sum.coins': 'monedas', 'sum.yellow': 'tarjeta amarilla', 'sum.none': 'tarjetas',
      'fin.bonus': '¡Sin ningún fallo: bonus de +5 🪙!',
      'fin.almost': 'Una tarjeta amarilla: ¡casi perfecto!',
      'fin.toCoin': 'Para la próxima moneda: {n} de {max} ⚽.',
      'fin.default': '¡Buen partido! ¿Jugamos otra vez?',
      again: 'Otra ronda ↺',
      catalog: 'Al catálogo',
      loadFail: 'No se pudieron cargar las preguntas. Actualiza la página.',
    },
  });
  document.title = T('title');
  T.apply();
  const $ = (id) => document.getElementById(id);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...kids.flat().filter((x) => x !== null && x !== undefined && x !== false));
    return el;
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const restart = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  const LEVELS = [
    { id: '1', name: T('lvl.1.name'), icon: '⚽', desc: T('lvl.1.desc'), has: (q) => q.level === 1 },
    { id: '2', name: T('lvl.2.name'), icon: '🧠', desc: T('lvl.2.desc'), has: (q) => q.level === 2 },
    { id: 'mix', name: T('lvl.mix.name'), icon: '🎲', desc: T('lvl.mix.desc'), has: () => true },
  ];
  const LANG = { uk: 'UA', es: 'ES', en: 'EN' };
  const CATS = { wc: T('cat.wc'), clubs: T('cat.clubs'), players: T('cat.players'), rules: T('cat.rules') };
  const PRAISE = {
    uk: ['Так! ✅', 'Гол! ⚽', 'Точно! ✅', 'Супер! ✅'],
    es: ['¡Muy bien! ✅', '¡Golazo! ⚽', '¡Perfecto! ✅', '¡Eso es! ✅'],
    en: ['Great! ✅', 'Goal! ⚽', 'Correct! ✅', 'Well done! ✅'],
  };

  // On the Spanish site every question is shown in Spanish: uk/en questions use their `es` text
  // (same option order, so `answer` stays valid); a question without it is dropped.
  const forSite = (q) => {
    if (!ES || !q || q.lang === 'es') return q;
    const e = q.es;
    if (!e || !e.q || !Array.isArray(e.options)) return null;
    return { ...q, lang: 'es', q: e.q, options: e.options, fact: e.fact, uk: null };
  };

  // Only well-formed questions: 4 options, valid answer index, unique id.
  const BANK = (() => {
    const ids = new Set();
    return (Array.isArray(window.QUIZ_QUESTIONS) ? window.QUIZ_QUESTIONS : []).map(forSite).filter((q) => {
      const ok = q && q.id && !ids.has(q.id) && q.q && Array.isArray(q.options) && q.options.length === 4
        && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 && LANG[q.lang];
      if (ok) ids.add(q.id);
      return ok;
    });
  })();
  const poolOf = (levelId) => BANK.filter((LEVELS.find((l) => l.id === levelId) || LEVELS[2]).has);

  // ---------- Saved data: { level, seen: [ids], toCoin: 0..4, goals } ----------
  const loadData = () => {
    const d = KF.gameData(SLUG);
    return {
      level: LEVELS.some((l) => l.id === d.level) ? d.level : '1',
      seen: Array.isArray(d.seen) ? d.seen : [],
      toCoin: Math.min(PER_COIN - 1, Math.max(0, d.toCoin | 0)),
      goals: d.goals | 0,
    };
  };
  let data = loadData();
  const saveData = () => KF.gameData(SLUG, data);

  // Draw a round: unseen first; when the pool runs out, start the seen list over.
  const drawRound = (levelId) => {
    const pool = poolOf(levelId);
    const seen = new Set(data.seen);
    let list = shuffle(pool.filter((q) => !seen.has(q.id))).slice(0, ROUND);
    if (list.length < Math.min(ROUND, pool.length)) {
      const taken = new Set(list.map((q) => q.id));
      list = list.concat(shuffle(pool.filter((q) => !taken.has(q.id))).slice(0, ROUND - list.length));
      const poolIds = new Set(pool.map((q) => q.id));
      data.seen = data.seen.filter((id) => !poolIds.has(id));
      saveData();
    }
    return list;
  };
  const markSeen = (q) => {
    data.seen = data.seen.filter((id) => id !== q.id).concat(q.id);
    saveData();
  };

  // ---------- Coin meter ----------
  const meterSlots = (n) => Array.from({ length: PER_COIN }, (_, i) => h('span', { class: `slot${i < n ? '' : ' empty'}`, text: i < n ? '⚽' : '' }));
  const drawMeter = () => {
    $('meter').replaceChildren(h('span', { text: T('meter') }), h('span', { class: 'slots' }, meterSlots(data.toCoin)));
    $('meter').setAttribute('aria-label', T('meter.aria', { n: data.toCoin, max: PER_COIN }));
    $('start-meter').textContent = data.toCoin ? T('meter.have', { n: data.toCoin, max: PER_COIN }) : '';
  };

  // ---------- Start screen ----------
  let screen = 'start';
  const show = (id) => {
    screen = id;
    for (const s of ['start', 'play', 'finish']) $(s).hidden = s !== id;
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const levelButtons = () => [...$('levels').querySelectorAll('.level')];
  const setLevel = (id, focus) => {
    data.level = id;
    saveData();
    for (const b of levelButtons()) {
      const on = b.dataset.level === id;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    }
  };
  const moveLevel = (step) => {
    const open = levelButtons().filter((b) => !b.disabled);
    const i = open.findIndex((b) => b.dataset.level === data.level);
    const next = open[(i + step + open.length) % open.length];
    if (next) setLevel(next.dataset.level, true);
  };

  const renderStart = () => {
    data = loadData();
    if (!poolOf(data.level).length) data.level = 'mix';
    $('levels').replaceChildren(...LEVELS.map((l) => {
      const n = poolOf(l.id).length;
      return h('button', {
        type: 'button', class: 'level', role: 'radio', 'data-level': l.id, disabled: !n,
        onclick: () => setLevel(l.id),
        ondblclick: () => startRound(),
      }, h('b', {}, h('span', { 'aria-hidden': 'true', text: l.icon }), l.name), h('small', { text: l.desc }), h('span', { class: 'count tnum', text: T('count', { n }) }));
    }));
    setLevel(data.level);
    const g = KF.get().games[SLUG];
    const stat = (value, label) => h('div', { class: 'stat' }, h('b', { text: value }), h('span', { text: label }));
    $('stats').replaceChildren(
      stat(String(g?.plays || 0), T('stat.plays')),
      stat(g?.plays ? `${g.best}/${g.max || ROUND}` : '—', T('stat.best')),
      stat(String(data.goals), T('stat.goals')));
    $('start-btn').disabled = !BANK.length;
    drawMeter();
  };

  // ---------- Round ----------
  let round = null;
  let cur = null; // { q, options, correctIndex, answered, buttons }

  const startRound = () => {
    const list = drawRound(data.level);
    if (!list.length) return;
    round = { list, index: 0, score: 0, results: [], cards: 0, streak: 0, goals: 0, startCoins: KF.get().coins };
    drawCards();
    drawBoard();
    moveBall(0);
    drawMeter();
    show('play');
    showQuestion();
  };

  const drawCards = () => {
    $('cards').replaceChildren(...Array.from({ length: round.cards }, (_, i) => h('i', { class: i ? 'red' : 'yellow' })));
    $('cards').setAttribute('aria-label', round.cards ? T(round.cards === 1 ? 'cards.yellow' : 'cards.both') : T('cards.none'));
  };
  const drawDots = () => {
    $('dots').replaceChildren(...round.list.map((_, i) => {
      const r = round.results[i];
      return h('span', { class: `dot ${r === true ? 'ok' : r === false ? 'miss' : i === round.index ? 'now' : ''}` });
    }));
  };
  const drawBoard = () => {
    $('score-board').textContent = `${round.goals} : 0`;
    $('board').setAttribute('aria-label', T('board.aria', { n: round.goals }));
  };
  // Ball runs toward the goal with the streak: 0 → 1 → 2 → GOAL.
  const BALL_POS = ['14%', '40%', '66%', '93%'];
  const moveBall = (step) => { $('ball').style.left = BALL_POS[step]; };

  const showQuestion = () => {
    const q = round.list[round.index];
    const order = shuffle([0, 1, 2, 3]);
    const options = order.map((i) => q.options[i]);
    cur = { q, options, correctIndex: order.indexOf(q.answer), answered: false };
    markSeen(q);

    $('play-label').textContent = T('question', { n: round.index + 1, max: round.list.length });
    $('q-lang').textContent = LANG[q.lang];
    $('q-lang').className = `lang ${q.lang}`;
    $('q-lang').hidden = ES;
    $('q-cat').textContent = CATS[q.category] || '';
    $('q-text').textContent = q.q;
    $('q-text').lang = q.lang;
    $('q-text').classList.toggle('long', q.q.length > 90);
    $('q-ua').textContent = q.uk || '';
    $('ua-btn').hidden = ES || q.lang === 'uk' || !q.uk;
    setUa(false);
    $('kbd-hint').textContent = T($('ua-btn').hidden ? 'hint.plain' : 'hint.ua');

    cur.buttons = options.map((text, i) => h('button', {
      type: 'button', class: 'choice', lang: q.lang, onclick: () => choose(i),
    }, h('kbd', { text: String(i + 1) }), text));
    $('choices').classList.toggle('long', options.some((o) => String(o).length > 14));
    $('choices').replaceChildren(...cur.buttons);
    $('feedback').replaceChildren();
    drawDots();
    $('q-text').focus({ preventScroll: true });
  };

  const setUa = (on) => {
    const can = !$('ua-btn').hidden;
    $('ua-btn').setAttribute('aria-pressed', String(on && can));
    $('q-ua').hidden = !(on && can);
  };
  const toggleUa = () => setUa($('ua-btn').getAttribute('aria-pressed') !== 'true');
  $('ua-btn').addEventListener('click', toggleUa);

  const choose = (i) => {
    if (!cur || cur.answered) return;
    cur.answered = true;
    const correct = i === cur.correctIndex;
    const q = cur.q;
    cur.buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === cur.correctIndex) b.classList.add('right');
      else if (j === i) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    round.results[round.index] = correct;
    KF.answer(SLUG, correct, { coin: false });

    let goal = false;
    let coin = false;
    if (correct) {
      round.score++;
      round.streak++;
      data.toCoin++;
      if (data.toCoin >= PER_COIN) {
        data.toCoin = 0;
        coin = true;
      }
      if (round.streak >= GOAL_STREAK) {
        round.streak = 0;
        round.goals++;
        data.goals++;
        goal = true;
      }
      saveData();
      if (coin) KF.earn(SLUG, 1);
    } else {
      round.streak = 0;
      round.cards++;
      drawCards();
    }
    drawDots();
    drawMeter();
    celebrate(goal, coin);

    const red = round.cards >= 2;
    const last = round.index >= round.list.length - 1;
    const right = q.options[q.answer];
    const fact = q.fact && h('p', { class: 'fact', lang: q.lang }, !ES && h('span', { class: `lang ${q.lang}`, text: LANG[q.lang] }), h('span', { text: `💡 ${q.fact}` }));
    const box = correct
      ? h('div', { class: 'fb-box ok' },
        h('p', { class: 'fb-title', text: pick(PRAISE[ES ? 'es' : q.lang]) }),
        goal && h('p', { text: T('goalMsg') }),
        coin && h('p', { text: T('coinMsg') }),
        fact)
      : h('div', { class: 'fb-box miss' },
        h('div', { class: 'ref' },
          h('span', { class: `ref-card ${red ? 'red' : 'yellow'}`, 'aria-hidden': 'true' }),
          h('div', {},
            h('p', { class: 'fb-title', text: T(red ? 'red' : 'yellow') }),
            h('p', { text: T(red ? 'red.text' : 'yellow.text') }))),
        h('p', {}, T('right'), h('b', { lang: q.lang, text: right })),
        fact);
    const next = red
      ? h('button', { class: 'btn btn-dark', type: 'button', onclick: () => startRound() }, T('restart'))
      : h('button', { class: 'btn btn-dark', type: 'button', onclick: goNext }, T(last ? 'result' : 'next'));
    $('feedback').replaceChildren(box, next);
    next.focus({ preventScroll: true });
    $('feedback').scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  };

  const celebrate = (goal, coin) => {
    if (goal) {
      moveBall(3);
      $('pitch').classList.add('scored');
      restart($('board'), 'goal');
      drawBoard();
      setTimeout(() => { $('pitch').classList.remove('scored'); moveBall(0); }, reduced() ? 900 : 1300);
    } else {
      moveBall(round.streak);
    }
    if (coin) restart($('meter'), 'drop');
  };

  const goNext = () => {
    round.index++;
    if (round.index >= round.list.length) finish();
    else showQuestion();
  };

  const finish = () => {
    cur = null;
    const { score, list, goals, cards } = round;
    const max = list.length;
    const res = KF.finishGame(SLUG, { score, max });
    const earned = KF.get().coins - round.startCoins;
    $('finish-title').textContent = T(score === max ? 'fin.perfect' : score >= max - 2 ? 'fin.good' : 'fin.end');
    $('finish-score').textContent = `${score} / ${max}`;
    const stat = (value, label) => h('div', { class: 'stat' }, h('b', {}, value), h('span', { text: label }));
    $('finish-sum').replaceChildren(
      stat(`⚽ ${goals}`, T('sum.goals')),
      stat(`🪙 ${earned}`, T('sum.coins')),
      stat(cards ? [h('i', { class: 'yellow', 'aria-hidden': 'true' }), String(cards)] : '0', T(cards ? 'sum.yellow' : 'sum.none')));
    $('finish-text').textContent = [
      res.perfect ? T('fin.bonus') : cards ? T('fin.almost') : '',
      data.toCoin ? T('fin.toCoin', { n: data.toCoin, max: PER_COIN }) : '',
    ].filter(Boolean).join(' ') || T('fin.default');
    show('finish');
    if (score >= max - 2) KFUI.confetti();
    $('again-btn').focus({ preventScroll: true });
  };

  const toStart = () => {
    cur = null;
    round = null;
    renderStart();
    show('start');
    levelButtons().find((b) => b.dataset.level === data.level)?.focus();
  };

  $('start-btn').addEventListener('click', startRound);
  $('again-btn').addEventListener('click', startRound);

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onButton = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (screen === 'start') location.href = '../../';
      else toStart();
      return;
    }
    if (screen === 'start') {
      const n = Number(e.key);
      if (n >= 1 && n <= LEVELS.length && !levelButtons()[n - 1].disabled) { setLevel(LEVELS[n - 1].id, true); e.preventDefault(); return; }
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) { moveLevel(1); e.preventDefault(); return; }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { moveLevel(-1); e.preventDefault(); return; }
      if (e.key === 'Enter' && (!onButton || e.target.classList.contains('level'))) { startRound(); e.preventDefault(); }
      return;
    }
    if (screen !== 'play' || !cur) return;
    if (!ES && (e.key === 'u' || e.key === 'U' || e.key === 'г' || e.key === 'Г')) { toggleUa(); e.preventDefault(); return; }
    if (!cur.answered) {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) { choose(n - 1); e.preventDefault(); return; }
      const step = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
      if (step) {
        const i = cur.buttons.indexOf(document.activeElement);
        cur.buttons[i < 0 ? (step > 0 ? 0 : 3) : (i + step + 4) % 4].focus();
        e.preventDefault();
      }
      return;
    }
    // Answered: Enter = next (a focused button keeps its own native click).
    if (e.key === 'Enter' && !onButton) { $('feedback').querySelector('.btn')?.click(); e.preventDefault(); }
  });

  // Parents' test mode: expose state for automated checks.
  if (KF.TEST_MODE) {
    window.__quiz = {
      get screen() { return screen; },
      get question() { return cur?.q || null; },
      get options() { return cur?.options || null; },
      get correctIndex() { return cur ? cur.correctIndex : null; },
      get data() { return KF.gameData(SLUG); },
      get round() { return round; },
    };
  }

  if (!BANK.length) $('stats').replaceChildren(h('p', { class: 'muted', text: T('loadFail') }));
  renderStart();
})();
