'use strict';
(() => {
  const SLUG = 'math-exam';
  const ROUND = 8;
  const EXAM = 12;
  const PASS = 6;
  const M = window.MathExam;
  const ES = KF.lang === 'es';
  const L = (uk, es) => (ES ? es : uk); // one-off texts: Ukrainian site keeps today's strings
  const T = KF.i18n({
    uk: {
      coins: 'Монети',
      back: '← До каталогу',
      hubIntro: 'Тренуємось до іспиту. Завдання іспанською, як у школі. Кнопка 🇺🇦 пояснить українською.',
      examInfo:
        '12 завдань з усіх тем, як справжня контрольна. Перша помилка — 🟨 жовта картка, друга — 🟥 червона, і матч починається знову.',
      examStart: 'Почати іспит',
      glossBtn: '📖 Слова для іспиту',
      reportTitle: 'Для батьків: точність за темами',
      cardsLabel: 'Картки',
      hintLabel: 'Пояснення українською',
      hintTitle: 'Пояснення українською (клавіша U)',
      hintBtn: '🇺🇦',
      again: 'Ще раз',
      toStations: 'До станцій',
      glossClose: 'Зрозуміло',
    },
    es: {
      coins: 'Monedas',
      back: '← Volver al catálogo',
      hubIntro: 'Vamos a entrenar para el examen. Los ejercicios son como los del cole. El botón 💡 te da una pista.',
      examInfo:
        '12 ejercicios de todos los temas, como un examen de verdad. El primer fallo es 🟨 tarjeta amarilla, el segundo 🟥 tarjeta roja y el partido empieza otra vez.',
      examStart: 'Empezar el examen',
      glossBtn: '📖 Palabras del examen',
      reportTitle: 'Para los padres: aciertos por tema',
      cardsLabel: 'Tarjetas',
      hintLabel: 'Pista',
      hintTitle: 'Pista (tecla A)',
      hintBtn: '💡',
      again: 'Otra vez',
      toStations: 'A las estaciones',
      glossClose: 'Entendido',
    },
  });
  T.apply();
  const { $, h, pick, reduced, restart, shake } = KFG;

  const STATIONS = [
    { topic: 'valor', name: 'Taquilla', icon: '🎟️', ua: L('Розряди: UM, C, D, U', 'Valor de las cifras: UM, C, D, U') },
    { topic: 'columna', name: 'Pase a la columna', icon: '🧮', ua: L('Додавання й віднімання в стовпчик', 'Sumas y restas en columna') },
    { topic: 'redondeo', name: '¿A qué portería?', icon: '🥅', ua: L('Округлення', 'Redondeo') },
    { topic: 'problemas', name: 'Problemas del club', icon: '📰', ua: L('Задачі з текстом', 'Problemas con texto') },
  ];
  const stationOf = (topic) => STATIONS.find((s) => s.topic === topic);
  const PLACE_KEYS = ['UM', 'C', 'D', 'U'];
  const PLACE_UA = { UM: 'одиниці тисяч', C: 'сотні', D: 'десятки', U: 'одиниці' };
  const PRAISE = ['¡Muy bien!', '¡Golazo!', '¡Perfecto!', '¡Paradón!', '¡Eso es!'];

  const GLOSSARY_ES = [
    ['UM', 'unidades de millar (1000)'],
    ['C', 'centenas (100)'],
    ['D', 'decenas (10)'],
    ['U', 'unidades (1)'],
    ['cifra', 'cada uno de los signos del 0 al 9. El 4528 tiene 4 cifras'],
    ['valor', 'lo que vale una cifra según el lugar que ocupa: el 5 de 4528 vale 500'],
    ['descomponer', '4528 = 4000 + 500 + 20 + 8'],
    ['se lee', '2327 se lee «dos mil trescientos veintisiete»'],
    ['en torre', 'un número debajo del otro'],
    ['sumandos · suma', '2135 + 1428 = 3563'],
    ['minuendo · sustraendo · diferencia', '1263 − 612 = 651'],
    ['prueba de la resta', 'diferencia + sustraendo = minuendo'],
    ['llevarse una', 'en la suma, pasamos 1 a la columna de la izquierda'],
    ['pedir prestado', 'en la resta, cogemos 1 de la cifra de la izquierda (3 → 13)'],
    ['redondear', 'cambiar un número por el más cercano en decenas, centenas o unidades de millar'],
    ['¿Cuántos hay en total?', 'es una suma'],
    ['¿Cuántos quedan?', 'es una resta'],
    ['¿Cuántos más que…?', 'es una resta'],
    ['¿Cuántos faltan?', 'es una resta'],
    ['… más que …', '¡Cuidado! «Tiene 20 más que yo» suele ser una suma'],
  ];
  const GLOSSARY = ES
    ? GLOSSARY_ES
    : [
        ['UM', 'unidades de millar', 'одиниці тисяч (1.000)'],
        ['C', 'centenas', 'сотні (100)'],
        ['D', 'decenas', 'десятки (10)'],
        ['U', 'unidades', 'одиниці (1)'],
        ['cifra', 'una de 0–9', 'цифра (4528 має 4 цифри)'],
        ['valor', '¿cuánto vale?', 'скільки вона важить: 5 у 4528 = 500'],
        ['descomponer', '4528 = 4000 + 500 + 20 + 8', 'розкласти на розряди'],
        ['se lee', 'dos mil trescientos veintisiete', 'так читається 2327'],
        ['en torre', 'un número debajo del otro', 'у стовпчик'],
        ['sumandos · suma', '2135 + 1428 = 3563', 'доданки · сума'],
        ['minuendo · sustraendo · diferencia', '1263 − 612 = 651', 'зменшуване · від’ємник · різниця'],
        ['prueba de la resta', 'diferencia + sustraendo = minuendo', 'перевірка віднімання додаванням'],
        ['llevarse una', 'en la suma', 'перенести 1 у наступний стовпчик'],
        ['pedir prestado', 'en la resta', 'позичити 1 у сусіда зліва (3 → 13)'],
        ['más cercana', 'la que está más cerca', 'найближча (при округленні)'],
        ['redondear', 'a la decena / centena / millar', 'округлити до десятків / сотень / тисяч'],
        ['más próxima', 'el número más cerca', 'найближча'],
        ['¿Cuántos hay en total?', 'suma', 'скільки всього → додаємо'],
        ['¿Cuántos quedan?', 'resta', 'скільки залишилось → віднімаємо'],
        ['¿Cuántos más que…?', 'resta', 'на скільки більше → віднімаємо'],
        ['¿Cuántos faltan?', 'resta', 'скільки бракує → віднімаємо'],
        ['… más que …', '¡cuidado!', '«на N більше, ніж» — часто додаємо'],
      ];

  // ---------- Saved progress ----------
  const DATA_VERSION = 3;
  const loadData = () => {
    const d = KF.gameData(SLUG);
    const out = {
      v: DATA_VERSION,
      topics: { ...(d.topics || {}) },
      levels: { ...(d.levels || {}) },
      passed: { ...(d.passed || {}) },
      perfect: { ...(d.perfect || {}) },
    };
    if (d.v !== DATA_VERSION) {
      // v3 reworked levels of these topics; old level numbers no longer match.
      for (const t of ['valor', 'columna', 'redondeo', 'estimacion']) {
        delete out.levels[t];
        for (const k of Object.keys(out.passed)) if (k.startsWith(`${t}:`)) delete out.passed[k];
      }
      delete out.topics.estimacion;
    }
    return out;
  };
  let data = loadData();
  const saveData = () => KF.gameData(SLUG, data);
  const unlocked = (topic) => Math.min(Math.max(1, data.levels[topic] || 1), Math.max(1, (M?.LEVELS?.[topic] || []).length));
  const levelsOf = (topic) => M.LEVELS?.[topic] || [];

  const recordTopic = (topic, correct) => {
    const t = data.topics[topic] || { right: 0, total: 0 };
    t.total++;
    if (correct) t.right++;
    data.topics[topic] = t;
    saveData();
  };

  // ---------- Formatting answers ----------
  const fmt = (n) => (typeof n === 'number' ? M.fmt(n) : String(n));
  const answerText = (task) => {
    const a = task.answer;
    if (task.choices) {
      const c = task.choices.find((x) => x.value === a);
      if (c) return c.label;
    }
    if (a && typeof a === 'object' && 'UM' in a) return PLACE_KEYS.map((k) => `${a[k]} ${k}`).join(' + ');
    if (a && typeof a === 'object' && 'ok' in a) return a.ok ? 'Está bien resuelta' : `Hay un error; el resultado es ${fmt(a.value)}`;
    return fmt(a);
  };

  // ---------- Hub ----------
  const renderHub = () => {
    data = loadData();
    const cards = STATIONS.map((s) => {
      const levels = levelsOf(s.topic);
      const open = unlocked(s.topic);
      const lvText = (lv) => (ES ? `Nivel ${lv.level}: ${lv.es}` : `Рівень ${lv.level}: ${lv.ua}`);
      const hint = h('p', { class: 'level-hint', text: levels[open - 1] ? lvText(levels[open - 1]) : '' });
      const buttons = levels.map((lv) => {
        const n = lv.level;
        const locked = n > open;
        return h(
          'button',
          {
            type: 'button',
            class: `level${data.passed[`${s.topic}:${n}`] ? ' done' : ''}`,
            disabled: locked,
            'aria-label': ES
              ? `${s.name}, nivel ${n}${locked ? ' (bloqueado)' : ''}`
              : `${s.name}, рівень ${n}${locked ? ' (закрито)' : ''}`,
            title: ES ? lv.es : `${lv.es} — ${lv.ua}`,
            onclick: () => startTraining(s.topic, n),
            onmouseenter: () => {
              hint.textContent = lvText(lv);
            },
            onfocus: () => {
              hint.textContent = lvText(lv);
            },
          },
          locked ? '🔒' : String(n),
        );
      });
      return h(
        'div',
        { class: 'station' },
        h(
          'div',
          { class: 'station-title' },
          h('span', { 'aria-hidden': 'true', text: s.icon }),
          h('div', {}, h('strong', { text: s.name }), h('small', { text: s.ua })),
        ),
        h('div', { class: 'levels' }, buttons),
        hint,
      );
    });
    $('stations').replaceChildren(...cards);
    renderReport($('report-rows'), $('report'));
  };

  const renderReport = (rowsEl, wrapEl) => {
    const rows = STATIONS.filter((s) => data.topics[s.topic]?.total).map((s) => {
      const t = data.topics[s.topic];
      const pct = Math.round((t.right / t.total) * 100);
      return h(
        'div',
        { class: 'report-row' },
        h('span', { text: s.name }),
        h('span', { class: `bar${pct < 70 ? ' low' : ''}` }, h('i', { style: `width:${pct}%` })),
        h('b', { text: `${pct}% · ${t.right}/${t.total}` }),
      );
    });
    rowsEl.replaceChildren(...rows);
    wrapEl.hidden = rows.length === 0;
  };

  // ---------- Session ----------
  let session = null;
  let ctrl = null; // current input controller: { onKey(e) => handled }

  const show = KFG.screens(['hub', 'play', 'finish'], { scroll: 'smooth' });

  const startTraining = (topic, level) => {
    const tasks = Array.from({ length: ROUND }, () => M.makeTask(topic, level, Math.random, KF.lang));
    begin({ mode: 'train', topic, level, tasks });
  };

  const startExam = () => {
    const tasks = M.makeExam({ count: EXAM, weights: M.weakWeights(data.topics), lang: KF.lang });
    begin({ mode: 'exam', tasks });
  };

  const begin = (opts) => {
    session = { ...opts, index: 0, score: 0, results: [], startCoins: KF.get().coins, byTopic: {}, cards: 0 };
    drawCards();
    show('play');
    nextTask();
  };

  // Exam only: 1st mistake = yellow card, 2nd = red card (restart).
  const drawCards = () => {
    const n = session.mode === 'exam' ? session.cards : 0;
    $('cards').replaceChildren(...Array.from({ length: n }, (_, i) => h('i', { class: i ? 'red' : 'yellow' })));
  };

  const drawDots = () => KFG.dots($('dots'), session.results, session.index, { total: session.tasks.length });

  const nextTask = () => {
    const task = session.tasks[session.index];
    session.task = task;
    session.mistakes = 0;
    const st = stationOf(task.topic);
    $('play-label').textContent =
      session.mode === 'exam'
        ? `Partido-examen · ${session.index + 1}/${session.tasks.length}`
        : `${st.name} · nivel ${task.level} · ${session.index + 1}/${session.tasks.length}`;
    $('prompt-es').textContent = task.es.replace(/(\d|__) (UM|C|D|U)\b/g, '$1\u00a0$2');
    $('prompt-es').classList.toggle('long', task.es.length > 110);
    $('prompt-ua').textContent = task.hint || '';
    setUa(false);
    $('feedback').replaceChildren();
    drawDots();
    renderTask(task);
  };

  const setUa = (on) => {
    $('ua-btn').setAttribute('aria-pressed', String(on));
    $('prompt-ua').hidden = !on || !$('prompt-ua').textContent;
  };
  $('ua-btn').addEventListener('click', () => setUa($('ua-btn').getAttribute('aria-pressed') !== 'true'));

  // Called once per task when it is resolved.
  const resolveTask = (correct, error) => {
    const task = session.task;
    session.results[session.index] = correct;
    if (correct) session.score++;
    const bt = session.byTopic[task.topic] || { right: 0, total: 0 };
    bt.total++;
    if (correct) bt.right++;
    session.byTopic[task.topic] = bt;
    KF.answer(SLUG, correct);
    recordTopic(task.topic, correct);
    drawDots();
    if (session.mode === 'exam' && !correct) {
      session.cards++;
      drawCards();
    }
    const red = session.mode === 'exam' && session.cards >= 2;
    const card =
      session.mode === 'exam' &&
      !correct &&
      h(
        'div',
        { class: 'ref' },
        h('span', { class: `ref-card ${red ? 'red' : 'yellow'}`, 'aria-hidden': 'true' }),
        h(
          'div',
          {},
          h('p', { class: 'fb-title', text: red ? L('Червона картка!', '¡Tarjeta roja!') : L('Жовта картка!', '¡Tarjeta amarilla!') }),
          h('p', {
            text: red
              ? L('Друга помилка — матч починається знову. Ти зможеш!', 'Segundo error: el partido empieza otra vez. ¡Tú puedes!')
              : L('Ще одна помилка — і буде червона картка.', 'Un error más y habrá tarjeta roja.'),
          }),
        ),
      );

    const box = correct
      ? h('div', { class: 'fb-box ok' }, h('p', { class: 'fb-title', text: `${pick(PRAISE)} ✅` }))
      : h(
          'div',
          { class: 'fb-box miss' },
          card || h('p', { class: 'fb-title', text: 'Casi… 🧤' }),
          error?.es && h('p', { text: error.es }),
          !ES && error?.ua && h('p', { class: 'fb-ua', text: `🇺🇦 ${error.ua}` }),
          h('p', { text: `Respuesta correcta: ${answerText(task)}` }),
        );
    const last = session.index === session.tasks.length - 1;
    const next = red
      ? h('button', { class: 'btn btn-dark', type: 'button', onclick: () => startExam() }, L('Почати знову ↺', 'Empezar de nuevo ↺'))
      : h(
          'button',
          { class: 'btn btn-dark', type: 'button', onclick: goNext },
          last ? L('Результат →', 'Ver resultado →') : L('Далі →', 'Siguiente →'),
        );
    ctrl = { onKey: (e) => (e.key === 'Enter' || e.key === ' ') && (next.click(), true) };
    KFG.feedback($('feedback'), box, h('br'), next, { scroll: 'animated' });
  };

  const goNext = () => {
    session.index++;
    if (session.index >= session.tasks.length) finish();
    else nextTask();
  };

  const finish = () => {
    ctrl = null;
    const { score, tasks, mode, topic, level } = session;
    const max = tasks.length;
    // The perfect-round bonus is paid until the level (or the exam) is done perfectly once.
    const key = mode === 'exam' ? 'exam' : `${topic}:${level}`;
    const res = KF.finishGame(SLUG, { score, max, bonus: data.perfect[key] ? 0 : 5 });
    if (res.perfect && !data.perfect[key]) {
      data.perfect[key] = true;
      saveData();
    }
    const earned = KF.get().coins - session.startCoins;
    let text;
    if (mode === 'train') {
      const passed = score >= PASS;
      if (passed) {
        data.passed[`${topic}:${level}`] = true;
        if (level < levelsOf(topic).length && unlocked(topic) <= level) data.levels[topic] = level + 1;
        saveData();
      }
      text = passed
        ? level < levelsOf(topic).length
          ? L(`Рівень пройдено! Відкрито рівень ${level + 1}.`, `¡Nivel superado! Has desbloqueado el nivel ${level + 1}.`)
          : L('Усі рівні цієї станції пройдено!', '¡Has superado todos los niveles de esta estación!')
        : L(
            `Для наступного рівня треба ${PASS} з ${max}. Спробуй ще раз — вийде!`,
            `Para pasar al siguiente nivel necesitas ${PASS} de ${max}. ¡Inténtalo otra vez, tú puedes!`,
          );
    } else {
      text =
        session.cards === 0
          ? L('Чиста гра, жодної картки! Ти готовий до іспиту! 💪', '¡Partido limpio, sin tarjetas! ¡Estás listo para el examen! 💪')
          : L('Іспит пройдено з однією жовтою карткою. Майже ідеально!', 'Examen superado con una tarjeta amarilla. ¡Casi perfecto!');
    }
    $('finish-title').textContent = mode === 'exam' ? 'Fin del partido' : '¡Entrenamiento terminado!';
    $('finish-score').textContent = `${score} / ${max}`;
    $('finish-text').textContent = ES
      ? `${text} Has ganado ${earned} 🪙${res.bonus ? ' (¡con bonus por ronda perfecta!)' : '.'}`
      : `${text} Зароблено ${earned} 🪙${res.bonus ? ' (з бонусом за ідеальний раунд!)' : '.'}`;
    if (mode === 'exam') {
      const rows = Object.entries(session.byTopic).map(([t, v]) =>
        h(
          'div',
          { class: 'report-row' },
          h('span', { text: stationOf(t).name }),
          h(
            'span',
            { class: `bar${v.right / v.total < 0.7 ? ' low' : ''}` },
            h('i', { style: `width:${Math.round((v.right / v.total) * 100)}%` }),
          ),
          h('b', { text: `${v.right}/${v.total}` }),
        ),
      );
      $('finish-report').replaceChildren(h('h2', { text: L('По темах', 'Por temas') }), ...rows);
      $('finish-report').hidden = false;
    } else {
      $('finish-report').hidden = true;
    }
    show('finish');
    if (score >= max - 2) KFUI.confetti();
    $('again-btn').focus({ preventScroll: true });
  };

  $('again-btn').addEventListener('click', () => (session.mode === 'exam' ? startExam() : startTraining(session.topic, session.level)));
  $('hub-btn').addEventListener('click', () => {
    ctrl = null;
    renderHub();
    show('hub');
  });
  $('exam-btn').addEventListener('click', startExam);

  // ---------- Shared widgets ----------
  const hintEl = () => h('p', { class: 'inline-hint', role: 'status' });
  const sayHint = (el, es, ua) => {
    el.replaceChildren(h('span', { text: es || '' }), ua && !ES ? h('span', { class: 'fb-ua', text: `🇺🇦 ${ua}` }) : '');
  };

  // Number entry with on-screen keypad; keyboard digits / Backspace / Enter.
  // rtl: column answers are typed from the units up, so each new digit goes to the left.
  /** @param {{ onSubmit: (v: number) => void, onInput?: (v: string) => void, unit?: string, maxLen?: number, okLabel?: string, rtl?: boolean }} opts */
  const numberInput = ({ onSubmit, onInput, unit = '', maxLen = 5, okLabel = 'OK', rtl = false }) => {
    let value = '';
    const box = h('div', { class: 'num-box empty', 'aria-live': 'polite' });
    const draw = () => {
      box.classList.toggle('empty', !value);
      // A leading 0 typed right to left is a real digit (tens of 9706), keep it visible.
      const text = rtl && /^0./.test(value) ? value : M.fmt(Number(value));
      box.replaceChildren(value ? text : '?', unit ? h('span', { class: 'unit', text: unit }) : '');
      onInput?.(value);
    };
    const press = (k) => {
      if (k === 'back') value = rtl ? value.slice(1) : value.slice(0, -1);
      else if (k === 'ok') {
        if (value) onSubmit(Number(value));
        return;
      } else if (value.length < maxLen) value = rtl ? k + value : value === '0' ? k : value + k;
      draw();
    };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'].map((k) =>
      h(
        'button',
        {
          type: 'button',
          class: `key${k === 'ok' ? ' ok' : k === 'back' ? ' back' : ''}`,
          'data-key': k,
          'aria-label': k === 'back' ? L('Стерти', 'Borrar') : k === 'ok' ? L('Перевірити', 'Comprobar') : k,
          onclick: () => press(k),
        },
        k === 'back' ? '⌫' : k === 'ok' ? okLabel : k,
      ),
    );
    const pad = h('div', { class: 'keypad' }, keys);
    draw();
    const flashKey = (k) => {
      const b = pad.querySelector(`[data-key="${k}"]`);
      if (!b) return;
      b.classList.add('pressed');
      setTimeout(() => b.classList.remove('pressed'), 120);
    };
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        press(e.key);
        flashKey(e.key);
        return true;
      }
      if (e.key === 'Backspace') {
        press('back');
        flashKey('back');
        return true;
      }
      if (e.key === 'Enter') {
        press('ok');
        flashKey('ok');
        return true;
      }
      return false;
    };
    const reset = () => {
      value = '';
      draw();
    };
    const hintText = rtl
      ? L(
          'Пиши справа наліво: спершу одиниці. Клавіатура: цифри, ⌫, Enter',
          'Escribe de derecha a izquierda: primero las unidades. Teclado: cifras, ⌫, Enter',
        )
      : L('Можна вводити з клавіатури: цифри, ⌫, Enter', 'También puedes usar el teclado: cifras, ⌫, Enter');
    return { box, pad, onKey, reset, hint: h('p', { class: 'kbd-hint', text: hintText }) };
  };

  // ---------- Renderers per kind ----------
  const renderTask = (task) => {
    const work = $('work');
    work.replaceChildren();
    ctrl = null;
    const kind = task.kind;
    if (kind === 'choice') return renderChoice(task, work);
    if (kind === 'packs') return renderPacks(task, work);
    if (kind === 'decompose') return renderDecompose(task, work);
    if (kind === 'column') return session.mode === 'exam' ? renderColumnWhole(task, work) : renderColumnSteps(task, work);
    if (kind === 'round') return renderRound(task, work);
    if (kind === 'problema') return renderProblem(task, work);
    if (kind === 'fix') return renderFix(task, work);
    return renderNumber(task, work);
  };

  const submitSimple = (task, value) => {
    const r = M.checkAnswer(task, value);
    resolveTask(r.correct, r.error);
    return r;
  };

  const renderChoice = (task, work) => {
    const buttons = task.choices.map((c, i) =>
      h(
        'button',
        {
          type: 'button',
          class: 'choice',
          onclick: () => choose(i),
        },
        h('kbd', { text: String(i + 1) }),
        c.label,
      ),
    );
    const choose = (i) => {
      if (buttons[0].disabled) return;
      buttons.forEach((b) => {
        b.disabled = true;
      });
      const r = submitSimple(task, task.choices[i].value);
      task.choices.forEach((c, j) => {
        if (c.value === task.answer) buttons[j].classList.add('right');
      });
      if (!r.correct) buttons[i].classList.add('wrong');
    };
    const words = task.choices.some((c) => String(c.label).length > 12);
    work.append(
      h('div', { class: `choices${words ? ' words' : ''}` }, buttons),
      h('p', { class: 'kbd-hint', text: L(`Клавіші 1–${buttons.length}`, `Teclas 1–${buttons.length}`) }),
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
    buttons[0].focus({ preventScroll: true });
  };

  const renderNumber = (task, work) => {
    if (task.data?.packs) work.append(packsView(task.data.packs, false).el);
    const wall = task.data?.parts ? wallView(task.data) : null;
    const blank = wall?.querySelector('.slot.active');
    const input = numberInput({
      onSubmit: (v) => {
        ctrl = null;
        submitSimple(task, v);
      },
      onInput: (v) => {
        if (blank) blank.textContent = v || '?';
      },
    });
    if (wall) {
      work.append(wall, input.pad, input.hint);
      ctrl = { onKey: input.onKey };
      return;
    }
    work.append(input.box, input.pad, input.hint);
    ctrl = { onKey: input.onKey };
  };

  // Ticket packs: UM / C / D / U piles with +/− and group/ungroup trades.
  const PACK_VALUE = { UM: 1000, C: 100, D: 10, U: 1 };
  const packsView = (initial, editable, onChange) => {
    const counts = { UM: 0, C: 0, D: 0, U: 0, ...initial };
    const cols = {};
    const total = h('b');
    const el = h('div', { class: `packs${editable ? '' : ' readonly'}` });
    const pile = (k) => {
      const n = counts[k];
      const shown = Math.min(n, k === 'UM' ? 6 : 12);
      const items = Array.from({ length: shown }, () => h('i', { class: `tk ${k}` }));
      if (n > shown) items.push(h('span', { class: 'pile-more', text: `+${n - shown}` }));
      return items;
    };
    const draw = () => {
      for (const k of PLACE_KEYS) {
        const c = cols[k];
        c.count.textContent = counts[k];
        c.pile.replaceChildren(...pile(k));
        if (c.minus) c.minus.disabled = counts[k] === 0;
        if (c.group) c.group.disabled = counts[k] < 10;
        if (c.split) c.split.disabled = counts[k] < 1;
      }
      total.textContent = M.fmt(PLACE_KEYS.reduce((s, k) => s + counts[k] * PACK_VALUE[k], 0));
      onChange?.(counts);
    };
    const flash = (k) => {
      if (reduced()) return;
      restart(cols[k].wrap, 'flash');
    };
    PLACE_KEYS.forEach((k, i) => {
      const left = PLACE_KEYS[i - 1];
      const right = PLACE_KEYS[i + 1];
      const c = { count: h('div', { class: 'pack-count' }), pile: h('div', { class: 'pile', 'aria-hidden': 'true' }) };
      const kids = [h('h3', {}, k, h('small', { text: M.fmt(PACK_VALUE[k]) })), c.pile, c.count];
      if (editable) {
        c.minus = h(
          'button',
          {
            type: 'button',
            'aria-label': L(`Забрати пачку ${k}`, `Quitar un paquete de ${k}`),
            onclick: () => {
              counts[k]--;
              draw();
            },
          },
          '−',
        );
        const plus = h(
          'button',
          {
            type: 'button',
            'aria-label': L(`Додати пачку ${k}`, `Añadir un paquete de ${k}`),
            onclick: () => {
              counts[k]++;
              draw();
            },
          },
          '+',
        );
        kids.push(h('div', { class: 'pm' }, c.minus, plus));
        if (left) {
          c.group = h(
            'button',
            {
              type: 'button',
              class: 'trade',
              title: `10 ${k} → 1 ${left}`,
              onclick: () => {
                counts[k] -= 10;
                counts[left]++;
                draw();
                flash(left);
              },
            },
            `Agrupar 10 → 1 ${left}`,
          );
          kids.push(c.group);
        }
        if (right) {
          c.split = h(
            'button',
            {
              type: 'button',
              class: 'trade',
              title: `1 ${k} → 10 ${right}`,
              onclick: () => {
                counts[k]--;
                counts[right] += 10;
                draw();
                flash(right);
              },
            },
            `Desagrupar 1 → 10 ${right}`,
          );
          kids.push(c.split);
        }
      }
      c.wrap = h('div', { class: 'pack-col' }, kids);
      cols[k] = c;
      el.append(c.wrap);
    });
    draw();
    return { el, counts, total };
  };

  const renderPacks = (task, work) => {
    const view = packsView({}, true);
    const check = h('button', { class: 'btn btn-dark', type: 'button', onclick: () => submit() }, 'Comprobar ✓');
    const submit = () => {
      if (check.disabled) return;
      check.disabled = true;
      work.querySelectorAll('.packs button').forEach((b) => {
        b.disabled = true;
      });
      ctrl = null;
      submitSimple(task, { ...view.counts });
    };
    work.append(
      view.el,
      h('div', { class: 'pack-total' }, 'Total: ', view.total),
      check,
      h('p', {
        class: 'kbd-hint',
        text: L(
          'Tab — між кнопками, Enter — натиснути. Ctrl+Enter — перевірити',
          'Tab: moverte entre botones. Enter: pulsar. Ctrl+Enter: comprobar',
        ),
      }),
    );
    ctrl = { onKey: (e) => (e.key === 'Enter' && (e.ctrlKey || e.metaKey) ? (submit(), true) : false) };
  };

  const renderDecompose = (task, work) => {
    const vals = { UM: '', C: '', D: '', U: '' };
    let active = 0;
    const slots = PLACE_KEYS.map((k, i) =>
      h('button', {
        type: 'button',
        class: 'slot',
        'aria-label': `${k}: ${ES ? M.PLACES.find((p) => p.key === k).es : PLACE_UA[k]}`,
        onclick: () => {
          active = i;
          draw();
        },
      }),
    );
    const parts = [];
    PLACE_KEYS.forEach((k, i) => {
      if (i) parts.push(h('span', { text: '+' }));
      parts.push(h('span', {}, slots[i], h('small', { text: k })));
    });
    const draw = () =>
      slots.forEach((s, i) => {
        s.textContent = vals[PLACE_KEYS[i]] || '';
        s.classList.toggle('active', i === active);
      });
    const submit = () => {
      if (PLACE_KEYS.some((k) => vals[k] === '')) {
        sayHint(hint, 'Rellena las cuatro casillas.', 'Заповни всі чотири клітинки.');
        return;
      }
      ctrl = null;
      slots.forEach((s) => {
        s.disabled = true;
      });
      submitSimple(task, Object.fromEntries(PLACE_KEYS.map((k) => [k, Number(vals[k])])));
    };
    const press = (k) => {
      if (k === 'ok') return submit();
      const key = PLACE_KEYS[active];
      if (k === 'back') {
        if (vals[key] === '' && active > 0) active--;
        else vals[key] = '';
      } else {
        vals[key] = k;
        if (active < 3) active++;
      }
      draw();
    };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'].map((k) =>
      h(
        'button',
        {
          type: 'button',
          class: `key${k === 'ok' ? ' ok' : k === 'back' ? ' back' : ''}`,
          'aria-label': k === 'back' ? L('Стерти', 'Borrar') : k === 'ok' ? L('Перевірити', 'Comprobar') : k,
          onclick: () => press(k),
        },
        k === 'back' ? '⌫' : k === 'ok' ? 'OK' : k,
      ),
    );
    const hint = hintEl();
    work.append(
      h('div', { class: 'decomp' }, parts),
      hint,
      h('div', { class: 'keypad' }, keys),
      h('p', { class: 'kbd-hint', text: L('Цифри, ⌫, ←/→ між клітинками, Enter', 'Cifras, ⌫, ←/→ entre casillas, Enter') }),
    );
    draw();
    ctrl = {
      onKey: (e) => {
        if (/^[0-9]$/.test(e.key)) {
          press(e.key);
          return true;
        }
        if (e.key === 'Backspace') {
          press('back');
          return true;
        }
        if (e.key === 'Enter') {
          press('ok');
          return true;
        }
        if (e.key === 'ArrowLeft') {
          active = Math.max(0, active - 1);
          draw();
          return true;
        }
        if (e.key === 'ArrowRight') {
          active = Math.min(3, active + 1);
          draw();
          return true;
        }
        return false;
      },
    };
  };

  // ---------- Column operations (notebook) ----------
  const digitMap = (n) => {
    const s = String(n);
    const m = {};
    PLACE_KEYS.slice()
      .reverse()
      .forEach((k, i) => {
        m[k] = i < s.length ? Number(s[s.length - 1 - i]) : null;
      });
    return m;
  };

  const notebook = (d, cols) => {
    const places = PLACE_KEYS.slice(4 - cols);
    const grid = h('div', { class: 'nb-grid', style: `--cols:${cols}` });
    const cells = { mark: {}, top: {}, bottom: {}, result: {} };
    grid.append(h('span'), ...places.map((p) => h('div', { class: 'nb-head', text: p })));
    grid.append(h('span'), ...places.map((p) => (cells.mark[p] = h('div', { class: 'nb-mark' }))));
    grid.append(h('span'), ...places.map((p) => (cells.top[p] = h('div', { class: 'nb-cell' }))));
    grid.append(
      h('div', { class: 'nb-sign', text: d.op === '-' ? '−' : '+' }),
      ...places.map((p) => (cells.bottom[p] = h('div', { class: 'nb-cell' }))),
    );
    grid.append(h('div', { class: 'nb-line' }));
    grid.append(h('span'), ...places.map((p) => (cells.result[p] = h('div', { class: 'nb-cell nb-result' }))));
    return { el: h('div', { class: 'notebook' }, grid), cells, places };
  };

  const columnCount = (d) => Math.max(String(d.a).length, String(d.b).length, String(d.result).length);

  const fillOperands = (nb, d) => {
    const A = digitMap(d.a);
    const B = digitMap(d.b);
    for (const p of nb.places) {
      nb.cells.top[p].textContent = A[p] ?? '';
      nb.cells.bottom[p].textContent = B[p] ?? '';
    }
    return { A, B };
  };

  const renderColumnWhole = (task, work) => {
    const d = task.data;
    const cols = columnCount(d);
    const nb = notebook(d, cols);
    fillOperands(nb, d);
    const order = nb.places.slice().reverse(); // U, D, C, UM
    const input = numberInput({
      rtl: true,
      maxLen: cols,
      // Typed digits also appear in the answer row, under their columns.
      onInput: (v) =>
        order.forEach((p, i) => {
          nb.cells.result[p].textContent = v[v.length - 1 - i] ?? '';
        }),
      onSubmit: (v) => {
        ctrl = null;
        const r = M.checkAnswer(task, v);
        if (d.prueba) work.append(pruebaNote(d.prueba));
        resolveTask(r.correct && session.mistakes === 0, r.correct && session.mistakes ? opError(task) : r.error);
      },
    });
    work.append(nb.el, input.box, input.pad, input.hint);
    ctrl = { onKey: input.onKey };
  };

  const renderColumnSteps = (task, work) => {
    const d = task.data;
    const cols = columnCount(d);
    const nb = notebook(d, cols);
    const { A, B } = fillOperands(nb, d);
    const order = nb.places.slice().reverse(); // U, D, C, UM
    const needed = String(d.result).length;
    const cur = { ...A }; // current top digits (after borrows)
    const crossed = {};
    const smallOne = {};
    let step = 0;
    let borrowedHere = false;
    const hint = hintEl();

    const drawTop = (p) => {
      const cell = nb.cells.top[p];
      if (A[p] === null) {
        cell.textContent = '';
        return;
      }
      const digit = h('span', { class: crossed[p] ? 'crossed' : '', text: String(A[p]) });
      cell.replaceChildren(h('span', { class: 'digit-wrap' }, smallOne[p] ? h('span', { class: 'small-one', text: '1' }) : '', digit));
      if (crossed[p]) {
        nb.cells.mark[p].textContent = String(cur[p] - (smallOne[p] ? 10 : 0));
        nb.cells.mark[p].className = 'nb-mark';
      }
    };
    const highlight = () => {
      for (const p of nb.places) {
        const on = p === order[step];
        for (const row of ['top', 'bottom', 'result']) nb.cells[row][p].classList.toggle('nb-col-on', on);
        nb.cells.result[p].classList.toggle('slot-now', on);
      }
    };

    const borrowBtn =
      d.op === '-' ? h('button', { class: 'btn btn-light', type: 'button', onclick: () => borrow() }, '🤝 Pedir prestado') : null;
    const flyBall = (from, to) => {
      if (reduced()) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const ball = h('span', { class: 'fly', text: '⚽', style: `left:${a.left + a.width / 2 - 11}px;top:${a.top}px` });
      document.body.append(ball);
      requestAnimationFrame(() => {
        ball.style.transform = `translate(${b.left - a.left}px,${b.top - a.top}px)`;
      });
      setTimeout(() => ball.remove(), 650);
    };

    const stepError = (digit, flag) => {
      const r = M.checkColumnStep ? M.checkColumnStep(task, step, digit, flag) : null;
      return r?.error ? r.error : null;
    };

    // Marks the borrow in the notebook (small 1, crossed digits to the left).
    const applyBorrow = () => {
      const p = order[step];
      borrowedHere = true;
      cur[p] += 10;
      smallOne[p] = true;
      let j = step + 1;
      while (j < order.length && cur[order[j]] === 0) {
        cur[order[j]] = 9;
        crossed[order[j]] = true;
        drawTop(order[j]);
        j++;
      }
      if (j < order.length) {
        cur[order[j]] -= 1;
        crossed[order[j]] = true;
        drawTop(order[j]);
      }
      drawTop(p);
    };

    const borrow = () => {
      const p = order[step];
      const s = d.steps[step];
      if (!s || step >= needed) return;
      if (borrowedHere) return;
      if (!s.borrowed) {
        session.mistakes++;
        sayHint(
          hint,
          `Aquí no hace falta: ${cur[p]} es mayor o igual que ${B[p] ?? 0}.`,
          'Тут позичати не треба: зверху більше або стільки ж.',
        );
        shake(nb.el);
        return;
      }
      applyBorrow();
      sayHint(hint, `Ahora: ${cur[p]} − ${B[p] ?? 0}`, `Тепер віднімай: ${cur[p]} − ${B[p] ?? 0}`);
    };

    const enter = (digit) => {
      if (step >= needed) return;
      const p = order[step];
      const s = d.steps[step];
      // Borrowed in the head and got the right digit: draw the borrow, no mistake.
      if (d.op === '-' && s.borrowed && !borrowedHere && digit === s.digit) applyBorrow();
      if (d.op === '-' && s.borrowed && !borrowedHere) {
        session.mistakes++;
        const err = stepError(digit, false);
        sayHint(
          hint,
          err?.es || `Arriba hay ${cur[p]} y abajo ${B[p]}: no se puede. Pulsa «Pedir prestado».`,
          err?.ua || `Зверху ${cur[p]}, знизу ${B[p]} — так не можна. Натисни «Pedir prestado».`,
        );
        shake(nb.el);
        return;
      }
      if (digit !== s.digit) {
        session.mistakes++;
        const err = stepError(digit, d.op === '-' ? borrowedHere : undefined);
        const carryIn = d.op === '+' && step > 0 && d.steps[step - 1].carryOut;
        const fallbackEs =
          d.op === '+'
            ? `Suma otra vez: ${A[p] ?? 0} + ${B[p] ?? 0}${carryIn ? ' + 1 (la que te llevas)' : ''}.`
            : `Resta otra vez: ${cur[p]} − ${B[p] ?? 0}.`;
        const fallbackUa = d.op === '+' ? `Додай ще раз${carryIn ? ' і не забудь 1, яку переносили' : ''}.` : 'Відніми ще раз уважно.';
        sayHint(hint, err?.es || fallbackEs, err?.ua || fallbackUa);
        shake(nb.cells.result[p]);
        return;
      }
      nb.cells.result[p].textContent = String(digit);
      hint.replaceChildren();
      if (d.op === '+' && s.carryOut && step + 1 < order.length) {
        const nextP = order[step + 1];
        flyBall(nb.cells.result[p], nb.cells.mark[nextP]);
        setTimeout(
          () => {
            nb.cells.mark[nextP].textContent = '1';
            nb.cells.mark[nextP].className = 'nb-mark carry';
          },
          reduced() ? 0 : 500,
        );
        sayHint(hint, 'Me llevo una ⚽', 'Переносимо 1 у наступний стовпчик');
      }
      step++;
      borrowedHere = false;
      if (step >= needed) return done();
      highlight();
    };

    const done = () => {
      for (const p of nb.places) for (const row of ['top', 'bottom', 'result']) nb.cells[row][p].classList.remove('nb-col-on', 'slot-now');
      if (borrowBtn) borrowBtn.disabled = true;
      pad.querySelectorAll('button').forEach((b) => {
        b.disabled = true;
      });
      ctrl = null;
      if (d.op === '-')
        work.insertBefore(h('p', { class: 'prueba', text: `Prueba: ${M.fmt(d.result)} + ${M.fmt(d.b)} = ${M.fmt(d.a)} ✓` }), hint);
      if (d.prueba) work.insertBefore(pruebaNote(d.prueba), hint);
      const clean = session.mistakes === 0;
      resolveTask(
        clean,
        clean
          ? null
          : {
              es: 'Lo has terminado. ¡La próxima vez a la primera!',
              ua: 'Готово! Наступного разу — з першої спроби.',
            },
      );
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'key',
          onclick: () => enter(Number(k)),
        },
        k,
      ),
    );
    const pad = h('div', { class: 'keypad' }, keys);
    for (const p of nb.places) drawTop(p);
    highlight();
    work.append(
      nb.el,
      hint,
      borrowBtn ? h('div', { class: 'col-actions' }, borrowBtn) : '',
      pad,
      h('p', {
        class: 'kbd-hint',
        text:
          d.op === '-'
            ? L('Цифри — відповідь у стовпчику, P — pedir prestado', 'Cifras: la respuesta de cada columna. P: pedir prestado')
            : L('Цифри — відповідь у стовпчику, справа наліво', 'Cifras: la respuesta de cada columna, de derecha a izquierda'),
      }),
    );
    ctrl = {
      onKey: (e) => {
        if (/^[0-9]$/.test(e.key)) {
          enter(Number(e.key));
          return true;
        }
        if ((e.key === 'p' || e.key === 'P') && borrowBtn) {
          borrow();
          return true;
        }
        return false;
      },
    };
  };

  // ---------- Rounding: which goal is closer ----------
  const renderRound = (task, work) => {
    const d = task.data;
    if (d.hideLine) {
      const input = numberInput({
        onSubmit: (v) => {
          ctrl = null;
          submitSimple(task, v);
          afterRound();
        },
      });
      work.append(input.box, input.pad, input.hint);
      ctrl = { onKey: input.onKey };
      return;
    }
    const pct = ((d.n - d.low) / (d.high - d.low)) * 100;
    const track = h('div', { class: 'track' }, h('div', { class: 'track-line' }));
    for (let i = 0; i <= 10; i++) track.append(h('i', { class: 'tick', style: `left:${i * 10}%` }));
    const ball = h('div', { class: 'nl-ball', style: `left:${pct}%` }, h('b', { text: M.fmt(d.n) }), h('i', { text: '⚽' }));
    track.append(ball);
    const goal = (value, side) =>
      h(
        'button',
        {
          type: 'button',
          class: 'goal-btn',
          'aria-label': L(`Ворота ${M.fmt(value)}`, `Portería ${M.fmt(value)}`),
          onclick: () => shoot(value),
        },
        h('span', { text: side === 'L' ? '← 1' : '2 →' }),
        M.fmt(value),
      );
    const left = goal(d.low, 'L');
    const right = goal(d.high, 'R');
    const shoot = (value) => {
      if (left.disabled) return;
      left.disabled = true;
      right.disabled = true;
      ctrl = null;
      const r = M.checkAnswer(task, value);
      ball.style.left = task.answer === d.low ? '-6%' : '106%';
      (task.answer === d.low ? left : right).classList.add('right');
      if (!r.correct) (value === d.low ? left : right).classList.add('wrong');
      resolveTask(r.correct, r.error);
      afterRound();
    };
    work.append(
      h('div', { class: 'nline' }, left, track, right),
      h('p', { class: 'kbd-hint', text: L('← / → або 1 / 2 — обрати ворота', '← / → o 1 / 2: elige la portería') }),
    );
    ctrl = {
      onKey: (e) => {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          shoot(d.low);
          return true;
        }
        if (e.key === 'ArrowRight' || e.key === '2') {
          shoot(d.high);
          return true;
        }
        return false;
      },
    };
  };
  const afterRound = () => {
    const d = session.task.data;
    if (d.n === d.mid) $('work').append(h('p', { class: 'rule', text: '¡Justo en el medio! El 5 sube → ' + M.fmt(d.high) }));
  };

  // Book's «muro de descomposición»: 3519 = __ C + 1 D + 9 U
  const wallView = (d) => {
    const parts = [];
    d.parts.forEach((p, i) => {
      if (i) parts.push(h('span', { text: '+' }));
      const isBlank = p.value === null || p.value === undefined;
      parts.push(
        h(
          'span',
          {},
          h('span', { class: `slot${isBlank ? ' active' : ''}`, text: isBlank ? '?' : String(p.value) }),
          h('small', { text: p.key }),
        ),
      );
    });
    return h('div', { class: 'decomp' }, h('span', { text: `${M.fmt(d.n)} =` }), parts);
  };

  // After «prueba de la resta»: does diferencia + sustraendo give the minuendo?
  const pruebaNote = (pr) =>
    h(
      'p',
      { class: 'prueba' },
      `${M.fmt(pr.diferencia)} + ${M.fmt(pr.sustraendo)} = ${M.fmt(pr.diferencia + pr.sustraendo)} `,
      pr.ok ? `= ${M.fmt(pr.minuendo)} ✓ La resta está bien.` : `≠ ${M.fmt(pr.minuendo)} ✗ No coincide: la resta está mal.`,
    );

  // ---------- Find the mistake: a solved operation, right or wrong ----------
  const renderFix = (task, work) => {
    const d = task.data;
    const nb = notebook(d, columnCount({ ...d, result: Math.max(d.result, d.shown) }));
    fillOperands(nb, d);
    const S = digitMap(d.shown);
    for (const p of nb.places) nb.cells.result[p].textContent = S[p] ?? '';
    const area = h('div', { class: 'work', style: 'padding:0' });
    const judge = (ok) => {
      if (ok) {
        ctrl = null;
        area.replaceChildren();
        submitSimple(task, { ok: true });
        return;
      }
      for (const p of nb.places) nb.cells.result[p].classList.add('crossed');
      const input = numberInput({
        onSubmit: (v) => {
          ctrl = null;
          submitSimple(task, { ok: false, value: v });
        },
      });
      area.replaceChildren(h('p', { class: 'op-q', text: 'Escribe el resultado correcto:' }), input.box, input.pad, input.hint);
      ctrl = { onKey: input.onKey };
    };
    area.append(
      h(
        'div',
        { class: 'op-choice' },
        h('button', { type: 'button', class: 'op-btn', onclick: () => judge(true) }, h('b', { text: '✓' }), 'Está bien'),
        h('button', { type: 'button', class: 'op-btn', onclick: () => judge(false) }, h('b', { text: '✗' }), 'Hay un error'),
      ),
      h('p', { class: 'kbd-hint', text: L('Клавіші 1 — правильно, 2 — є помилка', 'Teclas: 1 = está bien, 2 = hay un error') }),
    );
    work.append(nb.el, area);
    ctrl = {
      onKey: (e) => {
        if (e.key === '1') {
          judge(true);
          return true;
        }
        if (e.key === '2') {
          judge(false);
          return true;
        }
        return false;
      },
    };
  };

  // ---------- Word problems: pick the operation, then solve in a column ----------
  const opError = (task) => ({
    es: task.data.op === '+' ? 'Primero elige bien: aquí hay que sumar.' : 'Primero elige bien: aquí hay que restar.',
    ua: task.data.op === '+' ? 'Спершу треба було обрати додавання.' : 'Спершу треба було обрати віднімання.',
  });

  const renderProblem = (task, work) => {
    const hint = hintEl();
    const pickOp = (op) => {
      const r = M.checkOp ? M.checkOp(task, op) : { correct: op === task.data.op };
      if (!r.correct) {
        session.mistakes++;
        const btn = work.querySelector(`[data-op="${op}"]`);
        btn.classList.add('wrong');
        btn.disabled = true;
        sayHint(hint, r.error?.es || 'Lee otra vez la pregunta.', r.error?.ua || 'Прочитай питання ще раз.');
        shake(btn);
        return;
      }
      work.replaceChildren();
      if (session.mode === 'exam') renderColumnWhole(task, work);
      else renderColumnSteps(task, work);
    };
    const opBtn = (op, label) =>
      h(
        'button',
        { type: 'button', class: 'op-btn', 'data-op': op, onclick: () => pickOp(op) },
        h('b', { text: op === '+' ? '+' : '−' }),
        label,
      );
    work.append(
      h('p', { class: 'op-q', text: '¿Qué operación hay que hacer?' }),
      h('div', { class: 'op-choice' }, opBtn('+', 'Suma'), opBtn('-', 'Resta')),
      hint,
      h('p', { class: 'kbd-hint', text: L('Клавіші + або −', 'Teclas + o −') }),
    );
    ctrl = {
      onKey: (e) => {
        if (e.key === '+') {
          pickOp('+');
          return true;
        }
        if (e.key === '-') {
          pickOp('-');
          return true;
        }
        return false;
      },
    };
  };

  // ---------- Glossary ----------
  $('gloss-table').replaceChildren(
    ...GLOSSARY.map(([a, b, c]) =>
      h('tr', {}, h('td', { text: a }), h('td', {}, b, c ? [h('br'), h('span', { class: 'muted', text: c })] : '')),
    ),
  );
  $('gloss-btn').addEventListener('click', () => /** @type {HTMLDialogElement} */ ($('gloss')).showModal());
  $('gloss-close').addEventListener('click', () => /** @type {HTMLDialogElement} */ ($('gloss')).close());

  // ---------- Keyboard ----------
  KFG.keys({
    ctrl: () => ctrl,
    ignoreMods: ['alt'],
    nativeButtons: 'button',
    onEscape: () => {
      if ($('play').hidden) return false;
      ctrl = null;
      renderHub();
      show('hub');
      return false;
    },
    onKey: (e) => {
      if (e.key.toLowerCase() !== (ES ? 'a' : 'u') || $('play').hidden) return false;
      setUa($('ua-btn').getAttribute('aria-pressed') !== 'true');
      return true;
    },
  });
  // Mouse clicks on keypad keys must not steal focus, so a following Enter submits instead of re-pressing the key.
  document.addEventListener('mousedown', (e) => {
    if (e.target instanceof Element && e.target.closest('.key')) e.preventDefault();
  });

  if (!M) {
    $('stations').replaceChildren(
      h('p', { text: L('Не вдалося завантажити завдання. Онови сторінку.', 'No se han podido cargar los ejercicios. Recarga la página.') }),
    );
    return;
  }
  // Parents' test mode: expose the current session for automated checks.
  if (KF.TEST_MODE)
    window.__mathExam = {
      get session() {
        return session;
      },
    };
  renderHub();
})();
