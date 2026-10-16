'use strict';
(() => {
  const SLUG = 'sociales-planeta';
  const ROUND = 8;
  const C = window.SP_CONTENT;
  const A = window.SPArt;
  // The whole game is in Spanish on both sites: one dictionary for uk and es.
  const ES = {
    coins: 'Monedas',
    back: '← Juegos',
    subject: 'Ciencias Sociales · 3.º',
    unit: 'Unidad 1 · Examen de Sociales',
    hubIntro: 'Elige una estación para practicar. Cuando te sientas con fuerza, haz el examen final.',
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
    roundLabel: ({ title, i, n }) => `${title} · <b>${i}/${n}</b>`,
    examLabel: ({ i, n }) => `Examen final · <b>${i}/${n}</b>`,
    praise: ['¡Muy bien!', '¡Golazo!', '¡Genial!', '¡Eso es!', '¡Perfecto!'],
    praiseSoft: '¡Bien hecho!',
    almost: '¡Casi!',
    answerIs: ({ a }) => `La respuesta es: ${a}.`,
    seeRight: 'Mira cómo queda bien.',
    youTapped: ({ name }) => `Has tocado: ${name}.`,
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
    kMap: 'Toca en el mapa. Teclado: Tab para moverte, Enter para elegir',
    kLabel: ({ n, l }) => `Toca un nombre y después su sitio. Teclado: 1–${n} para el nombre, A–${l} para el sitio`,
    pickLabel: 'Primero toca un nombre.',
    labelTry: 'Ese no es su sitio. Prueba otro.',
    labelShown: ({ text }) => `Así: «${text}» va aquí.`,
    paletteTitle: 'Leyenda',
    kPaint: 'Elige un color y toca una zona del dibujo. Teclado: 1–6 para el color, Tab y Enter para pintar',
    pickColor: 'Primero elige un color de la leyenda.',
    paintHint: ({ name }) => `Esto es: ${name}. Busca su color en la leyenda.`,
    paintOk: ({ name }) => `¡Sí! ${name}.`,
    dirs: { norte: 'Norte', sur: 'Sur', este: 'Este', oeste: 'Oeste' },
    kDir: 'Teclado: flechas o N, S, E, O',
    kPath: 'Muévete con las flechas o con N, S, E, O. ⌫ para deshacer',
    step: ({ n, dir }) => `${n} ${n === 1 ? 'paso' : 'pasos'} al ${dir}`,
    noSteps: 'Aún no te has movido',
    edge: '¡Ahí se acaba el mapa!',
    arrived: ({ name }) => `¡Has llegado ${name.startsWith('el ') ? `al ${name.slice(3)}` : `a ${name}`}!`,
    youHere: 'Estás aquí',
    walkPlan: 'Sigue los pasos con el dedo:',
    stationDone: '¡Estación terminada!',
    stationPassed: '¡Estación superada!',
    stationMsg: ({ coins }) => `Has ganado ${coins} 🪙.`,
    stationKeep: 'Para superarla necesitas 6 de 8. ¡Otra vez y lo consigues!',
    stationGreat: 'Ya dominas este tema. ¡Prueba otra estación o el examen final!',
    perfectBonus: ' Y un premio extra por la ronda perfecta.',
    again: 'Otra vez',
    nextStation: 'Siguiente estación →',
    toHub: 'A las estaciones',
    examDone: 'Fin del examen',
    nota: ({ n }) => `Nota: ${n}`,
    grades: ['¡Sigue practicando!', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente'],
    examMsgTop: '¡Ya puedes con el examen de verdad! 💪',
    examMsgOk: 'Muy buen partido. Repasa los temas en naranja y vuelve a intentarlo.',
    examMsgLow: 'Aún hay temas por entrenar. Repasa las estaciones en naranja: ¡cada vez saldrá mejor!',
    examCards: ({ y, r }) => `Tarjetas: ${y} 🟨${r ? ' · 1 🟥' : ''}`,
    noCards: '¡Partido limpio, sin tarjetas!',
    byTopic: 'Por temas',
    review2: 'Repasar',
    loadError: 'No se han podido cargar las preguntas. Recarga la página.',
  };
  const T = KF.i18n({ uk: ES, es: ES });
  const L = (k) => ES[k];
  document.documentElement.lang = 'es';
  T.apply();

  const $ = (id) => document.getElementById(id);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
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
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const LETTERS = 'ABCDEFGH';
  const shake = (...els) =>
    els.forEach((el) => {
      if (!el || reduced()) return;
      el.classList.remove('shake');
      void el.getBoundingClientRect();
      el.classList.add('shake');
    });

  if (!C || !A) {
    $('stations').replaceChildren(h('p', { text: L('loadError') }));
    return;
  }

  const HUES = {
    capas: '#3f8fc9',
    agua: '#22a6bf',
    rocas: '#a8743f',
    mundo: '#4f9a4a',
    globo: '#2f6fb0',
    mapas: '#c8962a',
    pinta: '#e0703c',
    brujula: '#d9473b',
    eco: '#2f9a7a',
    curiosidades: '#8b5bb8',
  };
  const STATIONS = C.stations;
  const stationOf = (id) => STATIONS.find((s) => s.id === id);
  const EXAM_N = Object.values(C.exam.perStation).reduce((a, b) => a + b, 0);
  const RED_AFTER = C.exam.redAfter || 3;

  // ---------- Saved progress ----------
  // Sync merges numbers in gameData by adding the deltas of both devices (shared/kf.js mergeVal),
  // so records can come back inflated: clamp them to what a round can really give.
  const clamp = (v, max) => Math.min(Math.max(Number(v) || 0, 0), max);
  const loadData = () => {
    const d = KF.gameData(SLUG);
    const st = {};
    for (const [id, r] of Object.entries(d.st || {})) {
      const max = clamp(r.max, ROUND) || ROUND;
      st[id] = { ...r, max, best: clamp(r.best, max), stars: clamp(r.stars, 3) };
    }
    const exam = d.exam ? { ...d.exam, n: clamp(d.exam.n, 10) } : null;
    return { v: 1, st, exam, topics: { ...(d.topics || {}) } };
  };
  let data = loadData();
  const saveData = () => KF.gameData(SLUG, data);
  const starsFor = (score, max) => {
    const p = max ? score / max : 0;
    return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.5 ? 1 : 0;
  };
  const gradeFor = (score, max) => {
    const n = max ? (score / max) * 10 : 0;
    const i = n >= 9 ? 4 : n >= 7 ? 3 : n >= 6 ? 2 : n >= 5 ? 1 : 0;
    return { i, label: L('grades')[i], nota: n.toFixed(1).replace('.', ','), n };
  };
  const GRADE_COLORS = ['#e5a12a', '#9fb53a', '#5fa33a', '#2f8a52', '#1d6fb0'];
  const starsEl = (n) =>
    h(
      'span',
      { class: 'stars', 'aria-label': `${n} de 3 estrellas` },
      [0, 1, 2].map((i) => h('span', { class: i < n ? 'on' : '', text: '★' })),
    );

  // ---------- Hub ----------
  const renderHub = () => {
    data = loadData();
    const tiles = STATIONS.map((s, i) => {
      const rec = data.st[s.id];
      const meta = rec
        ? [
            starsEl(rec.stars),
            h('span', { class: 'best', text: T('best', { score: rec.best, max: rec.max }) }),
            rec.stars >= 2 && h('span', { class: 'badge', text: L('passed') }),
          ]
        : [starsEl(0), h('span', { text: L('notPlayed') })];
      return h(
        'button',
        { type: 'button', class: 'station', style: `--hue:${HUES[s.id] || '#3f8fc9'}`, onclick: () => openIntro(s) },
        h('span', { class: 'st-num', 'aria-hidden': 'true', text: String(i + 1) }),
        h('span', { class: 'st-icon', 'aria-hidden': 'true', text: s.icon }),
        h('span', { class: 'st-body' }, h('strong', { text: s.title }), h('small', { text: s.intro })),
        h('span', { class: 'st-meta' }, meta),
      );
    });
    $('stations').replaceChildren(...tiles, $('exam-card'));
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

  let introStation = null;
  const openIntro = (s) => {
    introStation = s;
    $('intro-icon').textContent = s.icon;
    $('intro-icon').style.setProperty('--hue', HUES[s.id]);
    $('intro-title').textContent = s.title;
    $('intro-text').textContent = s.intro;
    $('intro-meta').textContent = T('introMeta', { n: Math.min(ROUND, s.tasks.length) });
    $('intro-dlg').showModal();
    $('intro-go').focus();
  };
  $('intro-go').addEventListener('click', () => {
    $('intro-dlg').close();
    startStation(introStation.id);
  });
  $('intro-back').addEventListener('click', () => $('intro-dlg').close());

  // ---------- Task sampling ----------
  const CAPS = { mapTap: 3, walk: 3, sort: 1, label: 1, paint: 1, order: 1, pairs: 1 };
  const EXAM_CAPS = { mapTap: 1, walk: 1, sort: 1, label: 1, paint: 1, order: 1, pairs: 1 };
  const sampleTasks = (tasks, n, caps, always = []) => {
    const pool = shuffle(tasks);
    const out = [];
    const count = {};
    const fits = (t) => (count[t.type] || 0) < (caps[t.type] ?? Infinity);
    const take = (t) => {
      out.push(t);
      count[t.type] = (count[t.type] || 0) + 1;
    };
    for (const t of pool) if (always.includes(t.type) && out.length < n && fits(t)) take(t);
    for (const t of pool) if (out.length < n && !out.includes(t) && fits(t)) take(t);
    for (const t of pool) if (out.length < n && !out.includes(t)) take(t);
    return shuffle(out);
  };
  const withStation = (id) => (t) => ({ ...t, station: id });

  // ---------- Session ----------
  let session = null;
  let ctrl = null; // current keyboard handler: { onKey(e) → handled }

  const show = (id) => {
    for (const s of ['hub', 'play', 'finish']) $(s).hidden = s !== id;
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const startStation = (id) => {
    const s = stationOf(id);
    const tasks = sampleTasks(s.tasks, ROUND, CAPS, ['label', 'paint']).map(withStation(id));
    begin({ mode: 'station', station: id, tasks });
  };
  const startExam = () => {
    const tasks = shuffle(
      Object.entries(C.exam.perStation).flatMap(([id, n]) => {
        const s = stationOf(id);
        return s ? sampleTasks(s.tasks, n, EXAM_CAPS).map(withStation(id)) : [];
      }),
    );
    begin({ mode: 'exam', tasks });
  };
  const begin = (opts) => {
    session = { ...opts, index: 0, score: 0, results: [], cards: 0, byStation: {}, startCoins: KF.get().coins };
    $('goals-n').textContent = '0';
    drawCards();
    show('play');
    nextTask();
  };
  const drawCards = () => {
    const n = session?.mode === 'exam' ? session.cards : 0;
    $('cards').replaceChildren(
      ...Array.from({ length: Math.min(n, RED_AFTER) }, (_, i) => h('i', { class: i === RED_AFTER - 1 ? 'r' : 'y' })),
    );
  };
  const drawDots = () => {
    $('dots').replaceChildren(
      ...session.tasks.map((_, i) => {
        const r = session.results[i];
        return h('span', { class: `dot ${r === true ? 'ok' : r === false ? 'miss' : i === session.index ? 'now' : ''}` });
      }),
    );
  };

  const nextTask = () => {
    const task = session.tasks[session.index];
    session.task = task;
    session.answered = false;
    const n = session.tasks.length;
    $('play-label').innerHTML =
      session.mode === 'exam'
        ? T('examLabel', { i: session.index + 1, n })
        : T('roundLabel', { title: stationOf(session.station).title, i: session.index + 1, n });
    $('prompt').textContent = task.q;
    $('prompt').classList.toggle('long', task.q.length > 90);
    $('feedback').replaceChildren();
    drawDots();
    renderTask(task);
  };

  const praise = () => pick(L('praise'));

  // Called once per task. info: { answer, note, soft }
  const resolve = (correct, info = {}) => {
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
    const red = exam && !correct && session.cards === RED_AFTER;
    const card =
      exam &&
      !correct &&
      session.cards <= RED_AFTER &&
      h(
        'div',
        { class: 'ref' },
        h('span', { class: `ref-card ${red ? 'r' : 'y'}`, 'aria-hidden': 'true' }),
        h(
          'div',
          {},
          h('p', { class: 'fb-title', text: red ? L('red') : L('yellow') }),
          h('p', { text: red ? L('redText') : L('yellowText') }),
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
          ? `${info.soft ? L('praiseSoft') : praise()} ⚽`
          : `${card ? '' : `${L('almost')} `}${info.answer ? T('answerIs', { a: info.answer }) : L('seeRight')}`,
      }),
      info.note && h('p', { text: info.note }),
      fixText && h('p', { class: 'fb-fix', text: T('fix', { text: fixText }) }),
      task.fact && h('p', { class: 'fb-fact', text: `💡 ${task.fact}` }),
    );
    const last = session.index === session.tasks.length - 1;
    const next = h('button', { class: 'btn btn-dark', type: 'button', onclick: goNext }, last ? L('result') : L('next'));
    const actions = h(
      'div',
      { class: 'fb-actions' },
      next,
      red && h('button', { class: 'btn btn-light', type: 'button', onclick: startExam }, L('restart')),
    );
    $('feedback').replaceChildren(box, actions);
    ctrl = { onKey: (e) => (e.key === 'Enter' ? (next.click(), true) : false) };
    next.focus({ preventScroll: true });
    if (!reduced()) $('feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    else $('feedback').scrollIntoView({ block: 'nearest' });
  };

  const goNext = () => {
    session.index++;
    if (session.index >= session.tasks.length) finish();
    else nextTask();
  };

  // ---------- Finish ----------
  const starSvg = (on) =>
    h('span', {
      class: on ? 'on' : 'off',
      html: '<svg viewBox="0 0 48 46" aria-hidden="true"><path d="M24 2l6.5 14.3 15.5 1.6-11.6 10.4 3.3 15.3L24 35.8 10.3 43.6l3.3-15.3L2 17.9l15.5-1.6z" fill="#f2b218" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/></svg>',
    });

  const finish = () => {
    ctrl = null;
    const { score, tasks, mode } = session;
    const max = tasks.length;
    // The perfect-round bonus is paid until the station (or the exam) is done perfectly once.
    const old = mode === 'station' ? data.st[session.station] : null;
    const done = mode === 'station' ? !!old && old.best >= old.max : data.exam?.n >= 10;
    // Stations (8 tasks) and the exam (16) share one catalog record: report both as a nota out of 10.
    const res = KF.finishGame(SLUG, { score: Math.round((score / max) * 10), max: 10, bonus: done ? 0 : 5 });
    const coins = KF.get().coins - session.startCoins;
    const bonus = res.bonus ? L('perfectBonus') : '';
    const el = $('finish');
    const buttons = [];
    if (mode === 'station') {
      const id = session.station;
      const stars = starsFor(score, max);
      const prev = data.st[id];
      const rec = { best: Math.max(prev?.best || 0, score), max, stars: Math.max(prev?.stars || 0, stars), plays: (prev?.plays || 0) + 1 };
      if (prev && prev.best > score) rec.max = prev.max;
      data.st[id] = rec;
      saveData();
      const passed = stars >= 2;
      const idx = STATIONS.findIndex((s) => s.id === id);
      const nextSt = STATIONS[idx + 1];
      if (passed && nextSt)
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
            L('nextStation'),
          ),
        );
      buttons.push(
        h(
          'button',
          { class: `btn ${passed && nextSt ? 'btn-light' : 'btn-dark'}`, type: 'button', onclick: () => startStation(id) },
          L('again'),
        ),
      );
      buttons.push(h('button', { class: 'btn btn-light', type: 'button', onclick: toHub }, L('toHub')));
      el.replaceChildren(
        h('p', { class: 'eyebrow', text: `${stationOf(id).icon} ${stationOf(id).title}` }),
        h('h1', { text: passed ? L('stationPassed') : L('stationDone') }),
        h(
          'div',
          { class: 'big-stars', 'aria-label': `${stars} de 3 estrellas` },
          [0, 1, 2].map((i) => starSvg(i < stars)),
        ),
        h('div', { class: 'score-pill' }, `${score} / ${max}`, h('small', { text: '⚽' })),
        h('p', { class: 'msg', text: `${passed ? L('stationGreat') : L('stationKeep')} ${T('stationMsg', { coins })}${bonus}` }),
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
            ? h(
                'button',
                {
                  class: 'btn btn-light',
                  type: 'button',
                  onclick: () => {
                    renderHub();
                    show('hub');
                    openIntro(s);
                  },
                },
                L('review2'),
              )
            : h('span', { class: 'okmark', 'aria-hidden': 'true', text: '✓' }),
        );
      });
      const y = Math.min(session.cards, RED_AFTER - 1);
      const r = session.cards >= RED_AFTER ? 1 : 0;
      el.replaceChildren(
        h('p', { class: 'eyebrow', text: L('examDone') }),
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
          text: `${g.i >= 4 ? L('examMsgTop') : g.i >= 2 ? L('examMsgOk') : L('examMsgLow')} ${session.cards ? T('examCards', { y, r }) : L('noCards')} ${T('stationMsg', { coins })}${bonus}`,
        }),
        h('div', { class: 'report' }, h('h2', { text: L('byTopic') }), rows),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn btn-dark', type: 'button', onclick: startExam }, L('again')),
          h('button', { class: 'btn btn-light', type: 'button', onclick: toHub }, L('toHub')),
        ),
      );
      if (g.i >= 3) KFUI.confetti();
    }
    show('finish');
    el.querySelector('.actions .btn')?.focus({ preventScroll: true });
  };

  const toHub = () => {
    ctrl = null;
    session = null;
    renderHub();
    show('hub');
  };
  $('exam-btn').addEventListener('click', startExam);

  // ---------- Shared bits ----------
  const hintEl = () => h('p', { class: 'inline-hint', role: 'status' });
  const kbdHint = (text) => h('p', { class: 'kbd-hint', text });
  const artEl = (key) => {
    const svg = A.art(key);
    return svg ? h('div', { class: 'art' }, svg) : null;
  };
  // A layout block with the task art (if any) next to / above the controls.
  const withArt = (task, ...kids) => {
    const art = artEl(task.art);
    if (!art) return kids;
    const wide = String(task.art).startsWith('world-highlight:');
    return [
      h(
        'div',
        { class: `with-art${wide ? '' : ' side'}` },
        art,
        h('div', { class: 'side-col', style: 'display:grid;gap:14px;justify-items:center' }, kids),
      ),
    ];
  };
  // Mouse/pen drag as an extra to tap-tap (touch keeps native scrolling, so it uses taps only).
  const draggable = (el, { onStart, targets, onDrop }) => {
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || el.disabled) return;
      const sx = e.clientX;
      const sy = e.clientY;
      let ghost = null;
      let over = null;
      const move = (ev) => {
        if (!ghost) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
          onStart?.();
          ghost = el.cloneNode(true);
          ghost.classList.add('ghost');
          ghost.removeAttribute('id');
          document.body.append(ghost);
          el.classList.add('dragging');
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(targets);
        if (t !== over) {
          over?.classList.remove('over');
          over = t;
          over?.classList.add('over');
        }
      };
      const up = (ev) => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', up);
        if (!ghost) return;
        ghost.remove();
        el.classList.remove('dragging');
        over?.classList.remove('over');
        const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(targets);
        // Swallow the click that follows a drag (it fires in this same task, if at all).
        const swallow = (c) => {
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

  // ---------- Renderers ----------
  const RENDER = {};
  const renderTask = (task) => {
    const work = $('work');
    work.replaceChildren();
    ctrl = null;
    (RENDER[task.type] || RENDER.choice)(task, work);
  };

  // Multiple choice. keys 1–4.
  RENDER.choice = (task, work, preset) => {
    const opts = preset || (task.options || []).map((text, i) => ({ text, ok: i === task.answer }));
    const list = preset || task.fixed ? opts : shuffle(opts);
    const words = list.some((o) => String(o.text).length > 14);
    let done = false;
    const buttons = list.map((o, i) =>
      h('button', { type: 'button', class: 'choice', onclick: () => choose(i) }, h('kbd', { text: String(i + 1) }), o.text),
    );
    const choose = (i) => {
      if (done) return;
      done = true;
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (list[j].ok) b.classList.add('right');
        else if (j !== i) b.classList.add('dim');
      });
      if (!list[i].ok) buttons[i].classList.add('wrong');
      resolve(list[i].ok, { answer: list.find((o) => o.ok)?.text });
    };
    work.append(
      ...withArt(task, h('div', { class: `choices${words ? ' words' : ''}` }, buttons), kbdHint(T('kChoice', { n: buttons.length }))),
    );
    ctrl = {
      onKey: (e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= buttons.length) {
          choose(n - 1);
          return true;
        }
        return false;
      },
    };
  };

  // True / false. keys V/F, 1/2.
  RENDER.tf = (task, work) => {
    let done = false;
    const mk = (val, icon, label, key) =>
      h(
        'button',
        { type: 'button', class: 'choice', onclick: () => choose(val) },
        h('kbd', { text: key }),
        h('b', { 'aria-hidden': 'true', text: icon }),
        label,
      );
    const yes = mk(true, '✓', L('true'), 'V');
    const no = mk(false, '✗', L('false'), 'F');
    const choose = (val) => {
      if (done) return;
      done = true;
      const ok = val === task.truth;
      yes.disabled = true;
      no.disabled = true;
      (task.truth ? yes : no).classList.add('right');
      if (!ok) (val ? yes : no).classList.add('wrong');
      resolve(ok, { answer: task.truth ? L('true') : L('false') });
    };
    work.append(...withArt(task, h('div', { class: 'choices tf' }, yes, no), kbdHint(L('kTf'))));
    ctrl = {
      onKey: (e) => {
        const k = e.key.toLowerCase();
        if (k === 'v' || k === '1') {
          choose(true);
          return true;
        }
        if (k === 'f' || k === '2') {
          choose(false);
          return true;
        }
        return false;
      },
    };
  };

  // Sort into bins: tap a card, then a bin (or bin number). ≤1 mistake = correct.
  const sampleItems = (task, n) => {
    const byBin = task.bins.map((b) => shuffle(task.items.filter((it) => it.bin === b.id)));
    const out = byBin.map((list) => list[0]).filter(Boolean);
    const rest = shuffle(byBin.flatMap((list) => list.slice(1)));
    while (out.length < n && rest.length) out.push(rest.pop());
    return shuffle(out);
  };
  RENDER.sort = (task, work) => {
    const items = sampleItems(task, 6);
    const bins = task.bins;
    const placed = new Set();
    const tries = new Map();
    let mistakes = 0;
    let sel = 0;
    const hint = hintEl();
    const binLists = [];
    const chips = items.map((it, i) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => select(i) },
        it.icon && h('span', { class: 'ico', 'aria-hidden': 'true', text: it.icon }),
        it.text,
      );
      draggable(b, { onStart: () => select(i), targets: '.bin', onDrop: (t) => drop(Number(t.dataset.i)) });
      return b;
    });
    const binEls = bins.map((b, i) => {
      const list = h('div', { class: 'bin-items' });
      binLists.push(list);
      return h(
        'button',
        { type: 'button', class: 'bin', 'data-i': String(i), onclick: () => drop(i) },
        h(
          'span',
          { class: 'bin-head' },
          h('span', { class: 'ico', 'aria-hidden': 'true', text: b.icon }),
          b.label,
          h('kbd', { text: String(i + 1) }),
        ),
        list,
      );
    });
    const select = (i) => {
      if (placed.has(i)) return;
      sel = i;
      chips.forEach((c, j) => c.setAttribute('aria-pressed', String(j === i)));
    };
    const remaining = () => items.map((_, i) => i).filter((i) => !placed.has(i));
    const place = (i, binIdx, fixed) => {
      placed.add(i);
      chips[i].remove();
      binLists[binIdx].append(
        h('span', { class: fixed ? 'fixed' : '', text: `${items[i].icon ? `${items[i].icon} ` : ''}${items[i].text}` }),
      );
      const el = binEls[binIdx];
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 500);
      const rest = remaining();
      if (!rest.length) {
        resolve(mistakes <= 1, { soft: mistakes === 1 });
        return;
      }
      select(rest[0]);
    };
    const drop = (binIdx) => {
      if (session.answered || !bins[binIdx]) return;
      if (!remaining().includes(sel)) {
        hint.textContent = L('pickCard');
        return;
      }
      const it = items[sel];
      if (it.bin === bins[binIdx].id) {
        hint.textContent = '';
        place(sel, binIdx, false);
        return;
      }
      mistakes++;
      const t = (tries.get(sel) || 0) + 1;
      tries.set(sel, t);
      shake(chips[sel], binEls[binIdx]);
      if (t >= 2) {
        const right = bins.findIndex((b) => b.id === it.bin);
        hint.textContent = T('sortGoes', { item: it.text, bin: bins[right].label });
        place(sel, right, true);
      } else {
        hint.textContent = L('sortTry');
      }
    };
    select(0);
    work.append(
      h('div', { class: 'tray' }, chips),
      hint,
      h('div', { class: 'bins', style: `--n:${bins.length}` }, binEls),
      kbdHint(T('kSort', { n: bins.length })),
    );
    ctrl = {
      onKey: (e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= bins.length) {
          drop(n - 1);
          return true;
        }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          const rest = remaining();
          if (!rest.length) return true;
          const at = Math.max(0, rest.indexOf(sel));
          const d = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
          select(rest[(at + d + rest.length) % rest.length]);
          chips[sel].focus({ preventScroll: true });
          return true;
        }
        return false;
      },
    };
  };

  // Order: tap cards in order, each gets the next free number. Two checks allowed.
  RENDER.order = (task, work) => {
    const n = task.items.length;
    const cards = shuffle(task.items.map((text, i) => ({ text, i })));
    const num = new Map(); // card index → number (1-based)
    const good = new Set();
    let checks = 0;
    const hint = hintEl();
    const els = cards.map((c, k) =>
      h(
        'button',
        { type: 'button', class: 'ord-card', onclick: () => tap(k) },
        h('span', { class: 'ord-num', 'aria-hidden': 'true' }),
        h('span', { text: c.text }),
        h('kbd', { text: LETTERS[k] }),
      ),
    );
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark', disabled: true, onclick: () => check() }, L('check'));
    const undoBtn = h('button', { type: 'button', class: 'btn btn-light', onclick: () => undo() }, L('undo'));
    const draw = () => {
      els.forEach((el, k) => {
        const v = num.get(k);
        el.querySelector('.ord-num').textContent = v ? String(v) : '';
        el.classList.toggle('set', !!v);
        el.classList.toggle('good', good.has(k));
        el.setAttribute('aria-label', `${cards[k].text}${v ? ` — ${v}` : ''}`);
      });
      checkBtn.disabled = num.size < n;
      undoBtn.disabled = [...num.keys()].every((k) => good.has(k));
    };
    const tap = (k) => {
      if (session.answered || good.has(k)) return;
      if (num.has(k)) num.delete(k);
      else {
        const used = new Set(num.values());
        let v = 1;
        while (used.has(v)) v++;
        num.set(k, v);
      }
      hint.textContent = '';
      draw();
      if (num.size === n) checkBtn.focus({ preventScroll: true });
    };
    const undo = () => {
      let last = null;
      for (const [k, v] of num) if (!good.has(k) && (last === null || v > num.get(last))) last = k;
      if (last !== null) {
        num.delete(last);
        draw();
      }
    };
    const reveal = () => {
      const order = cards.map((c, k) => k).sort((a, b) => cards[a].i - cards[b].i);
      els.forEach((el, k) => {
        el.disabled = true;
        const ok = num.get(k) === cards[k].i + 1;
        el.classList.toggle('good', ok);
        el.classList.toggle('bad', !ok);
        el.querySelector('.ord-num').textContent = String(cards[k].i + 1);
      });
      list.replaceChildren(...order.map((k) => els[k]));
      actions.remove();
    };
    const check = () => {
      if (session.answered) return;
      if (num.size < n) {
        hint.textContent = L('orderNeedAll');
        return;
      }
      checks++;
      const wrong = cards.map((c, k) => k).filter((k) => num.get(k) !== cards[k].i + 1);
      if (!wrong.length) {
        reveal();
        resolve(true, { soft: checks > 1 });
        return;
      }
      if (checks >= 2) {
        reveal();
        resolve(false);
        return;
      }
      cards.forEach((c, k) => {
        if (!wrong.includes(k)) good.add(k);
      });
      wrong.forEach((k) => num.delete(k));
      shake(...wrong.map((k) => els[k]));
      hint.textContent = L('orderGreen');
      draw();
    };
    const list = h('div', { class: 'order' }, els);
    const actions = h('div', { class: 'ord-actions' }, undoBtn, checkBtn);
    draw();
    work.append(...withArt(task, list, hint, actions, kbdHint(L('kOrder'))));
    ctrl = {
      onKey: (e) => {
        const k = LETTERS.indexOf(e.key.toUpperCase());
        if (e.key.length === 1 && k >= 0 && k < n) {
          tap(k);
          return true;
        }
        if (e.key === 'Backspace') {
          undo();
          return true;
        }
        if (e.key === 'Enter') {
          check();
          return true;
        }
        return false;
      },
    };
  };

  // Pairs: tap left then right (any order). ≤1 mistake = correct.
  const PAIR_COLORS = ['#c9f269', '#bfe3ff', '#ffd9a8', '#f3c6ef', '#c8f0dc'];
  RENDER.pairs = (task, work) => {
    const pairs = task.pairs;
    const left = shuffle(pairs.map((p, i) => ({ text: p[0], i })));
    const right = shuffle(pairs.map((p, i) => ({ text: p[1], i })));
    let selL = null;
    let selR = null;
    let mistakes = 0;
    let matched = 0;
    const tries = new Map();
    const hint = hintEl();
    const mk = (item, side, k) =>
      h(
        'button',
        { type: 'button', class: 'pr', 'aria-pressed': 'false', onclick: () => tap(side, k) },
        h('kbd', { text: side === 'L' ? String(k + 1) : LETTERS[k] }),
        item.text,
      );
    const lEls = left.map((it, k) => mk(it, 'L', k));
    const rEls = right.map((it, k) => mk(it, 'R', k));
    const mark = () => {
      lEls.forEach((el, k) => el.setAttribute('aria-pressed', String(k === selL)));
      rEls.forEach((el, k) => el.setAttribute('aria-pressed', String(k === selR)));
    };
    const lock = (l, r) => {
      const color = PAIR_COLORS[matched % PAIR_COLORS.length];
      matched++;
      for (const el of [lEls[l], rEls[r]]) {
        el.classList.add('matched');
        el.style.setProperty('--pc', color);
        el.disabled = true;
        el.prepend(h('span', { class: 'tag', 'aria-hidden': 'true', text: String(matched) }));
      }
    };
    const tap = (side, k) => {
      if (session.answered) return;
      const els = side === 'L' ? lEls : rEls;
      if (!els[k] || els[k].disabled) return;
      if (side === 'L') selL = selL === k ? null : k;
      else selR = selR === k ? null : k;
      mark();
      if (selL === null || selR === null) return;
      const l = selL;
      const r = selR;
      selL = null;
      selR = null;
      if (left[l].i === right[r].i) {
        hint.textContent = '';
        lock(l, r);
      } else {
        mistakes++;
        shake(lEls[l], rEls[r]);
        const t = (tries.get(l) || 0) + 1;
        tries.set(l, t);
        if (t >= 2) {
          lock(
            l,
            right.findIndex((x) => x.i === left[l].i),
          );
          hint.textContent = L('pairShown');
        } else {
          hint.textContent = L('pairNo');
        }
      }
      mark();
      if (matched === pairs.length) resolve(mistakes <= 1, { soft: mistakes === 1 });
    };
    work.append(
      h('div', { class: 'pairs' }, h('div', { class: 'col' }, lEls), h('div', { class: 'col' }, rEls)),
      hint,
      kbdHint(T('kPairs', { n: pairs.length, l: LETTERS[pairs.length - 1] })),
    );
    ctrl = {
      onKey: (e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= pairs.length) {
          tap('L', n - 1);
          return true;
        }
        const k = LETTERS.indexOf(e.key.toUpperCase());
        if (e.key.length === 1 && k >= 0 && k < pairs.length) {
          tap('R', k);
          return true;
        }
        return false;
      },
    };
  };

  // Map tap on the world map: Tab through regions, Enter to choose.
  RENDER.mapTap = (task, work) => {
    const m = A.worldMap({ interactive: true });
    const W = window.SP_MAPS?.world;
    if (!m || !W) return RENDER.choice(task, work, [{ text: cap(task.target), ok: true }]); // no map data
    const pickRegion = (id) => {
      if (session.answered) return;
      const ok = id === task.target;
      const t = m.regions.get(task.target);
      const p = m.regions.get(id);
      m.el.classList.add('is-done');
      m.regions.forEach((r) => r.el.removeAttribute('tabindex'));
      t.el.classList.add('is-right');
      m.showLabel(task.target);
      if (!ok) {
        p.el.classList.add('is-wrong');
        m.showLabel(id, 'is-wrong');
        if (!reduced()) t.el.classList.add('is-pulse');
      }
      resolve(ok, { answer: t.name, note: ok ? null : T('youTapped', { name: p.name }) });
    };
    m.regions.forEach((r, id) => {
      r.el.addEventListener('click', () => pickRegion(id));
      r.el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pickRegion(id);
        }
      });
    });
    work.append(h('div', { class: 'map-wrap' }, m.el), kbdHint(L('kMap')));
  };

  // Label a drawn scene: tap a name chip then a slot (or slot then chip). ≤1 mistake = correct.
  RENDER.label = (task, work) => {
    const sc = A.scene(task.scene);
    if (!sc) return RENDER.choice(task, work, [{ text: task.labels[0].text, ok: true }]);
    const labels = shuffle(task.labels);
    const spots = sc.spots.filter((s) => labels.some((l) => l.id === s.id));
    const [bw, bh] = sc.box;
    const hint = hintEl();
    let selChip = null;
    let selSlot = null;
    let mistakes = 0;
    let placedN = 0;
    const tries = new Map();
    const chipEls = labels.map((l, k) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => tapChip(k) },
        h('kbd', { text: String(k + 1) }),
        l.text,
      );
      draggable(b, {
        onStart: () => {
          selChip = k;
          mark();
        },
        targets: '.slot',
        onDrop: (t) => tapSlot(Number(t.dataset.i)),
      });
      return b;
    });
    const slotEls = spots.map((s, k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'slot',
          'data-i': String(k),
          'data-spot': s.id,
          'aria-label': `Sitio ${LETTERS[k]}`,
          'aria-pressed': 'false',
          style: `left:${(s.x / bw) * 100}%;top:${(s.y / bh) * 100}%;width:${(s.w / bw) * 100}%`,
          onclick: () => tapSlot(k),
        },
        h('span', { class: 'q', 'aria-hidden': 'true', text: '?' }),
        h('kbd', { text: LETTERS[k] }),
      ),
    );
    const mark = () => {
      chipEls.forEach((c, k) => c.setAttribute('aria-pressed', String(k === selChip)));
      slotEls.forEach((s, k) => s.setAttribute('aria-pressed', String(k === selSlot)));
    };
    const fill = (chipK, slotK, fixed) => {
      const el = slotEls[slotK];
      el.replaceChildren(labels[chipK].text);
      el.classList.add('filled');
      if (fixed) el.classList.add('fixed');
      el.disabled = true;
      el.setAttribute('aria-label', labels[chipK].text);
      chipEls[chipK].remove();
      chipEls[chipK].disabled = true;
      placedN++;
      selChip = null;
      selSlot = null;
      const nextChip = chipEls.findIndex((c) => !c.disabled);
      if (nextChip >= 0) selChip = nextChip;
      mark();
      if (placedN === spots.length) resolve(mistakes <= 1, { soft: mistakes === 1 });
    };
    const attempt = () => {
      if (selChip === null || selSlot === null) return;
      const chipK = selChip;
      const slotK = selSlot;
      if (labels[chipK].id === spots[slotK].id) {
        hint.textContent = '';
        fill(chipK, slotK, false);
        return;
      }
      mistakes++;
      shake(chipEls[chipK], slotEls[slotK]);
      const t = (tries.get(chipK) || 0) + 1;
      tries.set(chipK, t);
      selSlot = null;
      if (t >= 2) {
        hint.textContent = T('labelShown', { text: labels[chipK].text });
        fill(
          chipK,
          spots.findIndex((s) => s.id === labels[chipK].id),
          true,
        );
      } else {
        hint.textContent = L('labelTry');
        mark();
      }
    };
    const tapChip = (k) => {
      if (session.answered || !chipEls[k] || chipEls[k].disabled) return;
      selChip = k;
      mark();
      attempt();
    };
    const tapSlot = (k) => {
      if (session.answered || !slotEls[k] || slotEls[k].disabled) return;
      selSlot = k;
      mark();
      if (selChip === null) {
        hint.textContent = L('pickLabel');
        return;
      }
      attempt();
    };
    selChip = 0;
    mark();
    const scene = h('div', { class: `scene${task.scene === 'compass-rose' ? ' compass' : ''}` }, sc.el, slotEls);
    work.append(
      h('div', { class: 'tray' }, chipEls),
      hint,
      scene,
      kbdHint(T('kLabel', { n: labels.length, l: LETTERS[spots.length - 1] })),
    );
    ctrl = {
      onKey: (e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= labels.length) {
          tapChip(n - 1);
          return true;
        }
        const k = LETTERS.indexOf(e.key.toUpperCase());
        if (e.key.length === 1 && k >= 0 && k < spots.length) {
          tapSlot(k);
          return true;
        }
        return false;
      },
    };
  };

  // Paint the aerial view with the legend colours. ≤2 mistakes = correct (6 zones).
  const COLORS = { rojo: '#e2453c', morado: '#8b4fc4', marron: '#9a6236', verde: '#3f9a4a', amarillo: '#f2c53d', azul: '#2f86d6' };
  const COLOR_NAMES = { rojo: 'Rojo', morado: 'Morado', marron: 'Marrón', verde: 'Verde', amarillo: 'Amarillo', azul: 'Azul' };
  RENDER.paint = (task, work) => {
    const ae = A.aerial();
    const zones = task.zones;
    let color = null;
    let mistakes = 0;
    const painted = new Set();
    const hint = hintEl();
    const sw = zones.map((z, k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'swatch',
          style: `--c:${COLORS[z.color] || '#999'}`,
          'aria-pressed': 'false',
          onclick: () => pickColor(k),
        },
        h('i', { 'aria-hidden': 'true' }),
        h('span', {}, COLOR_NAMES[z.color] || z.color, h('small', { text: z.name })),
        h('kbd', { text: String(k + 1) }),
      ),
    );
    const pickColor = (k) => {
      if (session.answered) return;
      color = zones[k].color;
      sw.forEach((s, j) => s.setAttribute('aria-pressed', String(j === k)));
      hint.textContent = '';
    };
    const paintZone = (id) => {
      if (session.answered || painted.has(id)) return;
      const z = zones.find((x) => x.id === id);
      if (!z) return;
      if (!color) {
        hint.textContent = L('pickColor');
        shake(...sw);
        return;
      }
      if (z.color === color) {
        painted.add(id);
        ae.paint(id, color);
        ae.zones.get(id).removeAttribute('tabindex');
        sw[zones.indexOf(z)].classList.add('done');
        hint.textContent = T('paintOk', { name: z.name });
        if (painted.size === zones.length) resolve(mistakes <= 2, { soft: mistakes > 0 });
      } else {
        mistakes++;
        hint.textContent = T('paintHint', { name: z.name });
        shake(ae.zones.get(id));
      }
    };
    ae.zones.forEach((g, id) => {
      const z = zones.find((x) => x.id === id);
      g.setAttribute('aria-label', z ? z.name : id);
      g.addEventListener('click', () => paintZone(id));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          paintZone(id);
        }
      });
    });
    work.append(
      h(
        'div',
        { class: 'paint' },
        h('div', { class: 'aerial-wrap' }, ae.el),
        h('div', { class: 'palette' }, h('h3', { text: L('paletteTitle') }), sw),
      ),
      hint,
      kbdHint(L('kPaint')),
    );
    ctrl = {
      onKey: (e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= zones.length) {
          pickColor(n - 1);
          return true;
        }
        return false;
      },
    };
  };

  // Walk on the grid map (north up).
  const DIRS = { norte: [0, -1], sur: [0, 1], este: [1, 0], oeste: [-1, 0] };
  const KEY_DIR = {
    ArrowUp: 'norte',
    ArrowDown: 'sur',
    ArrowRight: 'este',
    ArrowLeft: 'oeste',
    n: 'norte',
    s: 'sur',
    e: 'este',
    o: 'oeste',
  };
  const keyDir = (e) => KEY_DIR[e.key] || KEY_DIR[e.key.toLowerCase()];
  const groupSteps = (steps) =>
    steps.reduce((acc, d) => {
      const last = acc[acc.length - 1];
      if (last && last.dir === d) last.n++;
      else acc.push({ dir: d, n: 1 });
      return acc;
    }, []);
  const stepChips = (steps, cls = '') =>
    groupSteps(steps).map((g) =>
      h('span', { class: cls, text: `${{ norte: '↑', sur: '↓', este: '→', oeste: '←' }[g.dir]} ${T('step', { n: g.n, dir: g.dir })}` }),
    );
  const roseSvg =
    '<svg viewBox="-30 -34 60 64" class="board-rose" aria-hidden="true"><circle r="17" fill="#fffdf5" stroke="#2c4a3e" stroke-width="2"/><path d="M0-24L5 0 0 24-5 0Z" fill="#2c4a3e"/><path d="M-24 0L0 5 24 0 0-5Z" fill="#2c4a3e" opacity=".55"/><path d="M0-24L5 0-5 0Z" fill="#d9473b"/><text y="-25" text-anchor="middle" font-size="13" font-weight="900" fill="#2c4a3e">N</text></svg>';

  const board = (grid, { from, target }) => {
    const [nx, ny] = grid.size;
    const at = {};
    for (const [id, p] of Object.entries(grid.places)) at[`${p.at[0]},${p.at[1]}`] = id;
    const el = h('div', { class: 'board', style: `--n:${nx}` });
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const id = at[`${x},${y}`];
        const p = id && grid.places[id];
        el.append(
          h(
            'div',
            { class: `cell${x === 0 ? ' left' : x === nx - 1 ? ' right' : ''}` },
            p &&
              h(
                'div',
                { class: `place${id === target ? ' target' : ''}`, 'data-id': id },
                h('span', { class: 'ico', 'aria-hidden': 'true', text: p.icon }),
                h('span', { class: 'nm', text: cap(p.name) }),
              ),
          ),
        );
      }
    }
    const trail = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trail.setAttribute('class', 'trail');
    trail.setAttribute('viewBox', `0 0 ${nx} ${ny}`);
    trail.setAttribute('preserveAspectRatio', 'none');
    const token = h('div', { class: 'token' }, h('span', { title: L('youHere'), text: 'Tú' }));
    el.append(trail, token);
    const pos = [...grid.places[from].at];
    const moveToken = ([x, y]) => {
      token.style.left = `${(x / nx) * 100}%`;
      token.style.top = `${(y / ny) * 100}%`;
    };
    moveToken(pos);
    const drawTrail = (pts) => {
      trail.innerHTML = pts.length > 1 ? `<polyline points="${pts.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(' ')}"/>` : '';
    };
    const wrap = h('div', { class: 'board-wrap', html: roseSvg });
    wrap.append(el);
    // Cell width for name labels.
    const ro = new ResizeObserver(() => el.style.setProperty('--cw', `${el.clientWidth / nx}px`));
    ro.observe(el);
    return { wrap, el, pos, moveToken, drawTrail, trail, nx, ny, at };
  };

  const dpad = (onDir) => {
    const btn = (d, arrow) =>
      h(
        'button',
        { type: 'button', class: `dir ${d[0]}`, 'data-dir': d, onclick: () => onDir(d) },
        h('b', { 'aria-hidden': 'true', text: arrow }),
        L('dirs')[d],
      );
    const btns = { norte: btn('norte', '↑'), oeste: btn('oeste', '←'), este: btn('este', '→'), sur: btn('sur', '↓') };
    return {
      el: h('div', { class: 'dpad' }, Object.values(btns), h('span', { class: 'hub-dot', 'aria-hidden': 'true', text: '🧭' })),
      btns,
    };
  };

  RENDER.walk = (task, work) => {
    const grid = C.grids[task.grid];
    if (!grid?.places[task.from]) return RENDER.choice(task, work, [{ text: String(task.answer), ok: true }]);
    const cardinal = C.CARDINALS.includes(task.answer);
    const isPath = task.answer === 'path';
    const b = board(grid, { from: task.from, target: cardinal || isPath ? task.to : null });
    const hint = hintEl();
    const fromAt = grid.places[task.from].at;

    if (cardinal) {
      const toAt = grid.places[task.to].at;
      const pad = dpad((d) => choose(d));
      const choose = (d) => {
        if (session.answered) return;
        Object.values(pad.btns).forEach((x) => {
          x.disabled = true;
        });
        pad.btns[task.answer].classList.add('right');
        if (d !== task.answer) pad.btns[d].classList.add('wrong');
        b.trail.innerHTML = `<line class="arrow" x1="${fromAt[0] + 0.5}" y1="${fromAt[1] + 0.5}" x2="${toAt[0] + 0.5}" y2="${toAt[1] + 0.5}"/>`;
        resolve(d === task.answer, { answer: L('dirs')[task.answer].toLowerCase() });
      };
      work.append(h('div', { class: 'walk' }, b.wrap, h('div', { class: 'side' }, pad.el, kbdHint(L('kDir')))));
      ctrl = {
        onKey: (e) => {
          const d = keyDir(e);
          if (d) {
            choose(d);
            return true;
          }
          return false;
        },
      };
      return;
    }

    if (isPath) {
      const target = grid.places[task.to];
      const path = [[...fromAt]];
      const steps = [];
      const list = h('div', { class: 'steps', 'aria-live': 'polite' });
      const drawList = () =>
        list.replaceChildren(...(steps.length ? stepChips(steps) : [h('span', { class: 'empty', text: L('noSteps') })]));
      const undoBtn = h('button', { type: 'button', class: 'btn btn-light', onclick: () => undo() }, L('undo'));
      const move = (d) => {
        if (session.answered) return;
        const [x, y] = path[path.length - 1];
        const nx = x + DIRS[d][0];
        const ny = y + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= b.nx || ny >= b.ny) {
          hint.textContent = L('edge');
          shake(b.el);
          return;
        }
        hint.textContent = '';
        path.push([nx, ny]);
        steps.push(d);
        b.moveToken([nx, ny]);
        b.drawTrail(path);
        drawList();
        if (nx === target.at[0] && ny === target.at[1]) {
          Object.values(pad.btns).forEach((x2) => {
            x2.disabled = true;
          });
          undoBtn.disabled = true;
          hint.textContent = T('arrived', { name: target.name });
          resolve(true);
        }
      };
      const undo = () => {
        if (session.answered || !steps.length) return;
        path.pop();
        steps.pop();
        b.moveToken(path[path.length - 1]);
        b.drawTrail(path);
        drawList();
        hint.textContent = '';
      };
      const pad = dpad(move);
      drawList();
      work.append(h('div', { class: 'walk' }, b.wrap, h('div', { class: 'side' }, pad.el, list, undoBtn, hint, kbdHint(L('kPath')))));
      ctrl = {
        onKey: (e) => {
          const d = keyDir(e);
          if (d) {
            move(d);
            return true;
          }
          if (e.key === 'Backspace') {
            undo();
            return true;
          }
          return false;
        },
      };
      return;
    }

    // Follow the given steps in your head, then pick the place.
    const answerId = task.answer;
    const others = shuffle(Object.keys(grid.places).filter((id) => id !== answerId && id !== task.from)).slice(0, 3);
    const opts = shuffle([answerId, ...others]);
    let done = false;
    const buttons = opts.map((id, i) =>
      h(
        'button',
        { type: 'button', class: 'choice', onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { class: 'pi', 'aria-hidden': 'true', text: grid.places[id].icon }),
        cap(grid.places[id].name),
      ),
    );
    const choose = (i) => {
      if (done) return;
      done = true;
      buttons.forEach((x, j) => {
        x.disabled = true;
        if (opts[j] === answerId) x.classList.add('right');
        else if (j !== i) x.classList.add('dim');
      });
      if (opts[i] !== answerId) buttons[i].classList.add('wrong');
      // Show the walk.
      const path = [[...fromAt]];
      for (const d of task.steps) {
        const [x, y] = path[path.length - 1];
        path.push([x + DIRS[d][0], y + DIRS[d][1]]);
      }
      let k = 0;
      const tick = () => {
        k++;
        b.moveToken(path[k]);
        b.drawTrail(path.slice(0, k + 1));
        if (k < path.length - 1) setTimeout(tick, 230);
      };
      if (reduced()) {
        b.moveToken(path[path.length - 1]);
        b.drawTrail(path);
      } else setTimeout(tick, 150);
      resolve(opts[i] === answerId, { answer: cap(grid.places[answerId].name) });
    };
    work.append(
      h(
        'div',
        { class: 'walk' },
        b.wrap,
        h(
          'div',
          { class: 'side' },
          h('p', { class: 'kbd-hint', style: 'display:block', text: L('walkPlan') }),
          h('div', { class: 'steps' }, stepChips(task.steps, 'plan')),
          h('div', { class: 'places' }, buttons),
          kbdHint(T('kChoice', { n: buttons.length })),
        ),
      ),
    );
    ctrl = {
      onKey: (e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= buttons.length) {
          choose(n - 1);
          return true;
        }
        return false;
      },
    };
  };

  // ---------- Keyboard ----------
  const midRound = () => session && !$('play').hidden && (session.results.length > 0 || session.index > 0);
  const askQuit = () => {
    if (!midRound()) {
      toHub();
      return;
    }
    $('quit-dlg').showModal();
    $('quit-no').focus();
  };
  $('quit-no').addEventListener('click', () => $('quit-dlg').close());
  $('quit-yes').addEventListener('click', () => {
    $('quit-dlg').close();
    toHub();
  });

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') {
      if (!$('play').hidden) {
        e.preventDefault();
        askQuit();
        return;
      }
      if (!$('finish').hidden) {
        toHub();
        return;
      }
      return;
    }
    // Enter/Space on a focused control keeps its own action (Tab users).
    const t = e.target instanceof Element ? e.target : null;
    if ((e.key === 'Enter' || e.key === ' ') && t?.closest('button,[role=button],a')) return;
    if (ctrl && $('play').hidden === false && ctrl.onKey(e)) e.preventDefault();
  });

  $('hero-art').append(A.hero());
  // Parents' test mode: expose the session for automated checks.
  if (KF.TEST_MODE) {
    window.__sp = {
      get session() {
        return session;
      },
      startStation,
      startExam,
      toHub,
      play: (tasks) => begin({ mode: 'station', station: tasks[0].station, tasks }),
    };
  }
  renderHub();
})();
