'use strict';
(() => {
  const slug = 'penalty-multiply',
    total = 5;
  const { $, h } = KFG;
  const T = KF.i18n({
    uk: {
      title: 'Пенальті-множення — Keeper Fun Games',
      coins: 'Монети',
      back: '← До каталогу',
      eyebrow: 'Математика · ⚽',
      h1: 'Пенальті-множення',
      sub: 'Розв’яжи приклад і натисни правильну відповідь у воротах. Попереду 5 ударів!',
      tables: 'Які таблиці тренуємо?',
      'tables.aria': 'Таблиці множення',
      all: 'Усі',
      many: 'Можна обрати кілька чисел.',
      start: 'На поле →',
      round: 'УДАР {n} ІЗ {total}',
      'dots.aria': 'Результати ударів',
      dot: 'Удар {n}: {r}',
      'dot.goal': 'гол',
      'dot.save': 'сейв',
      'dot.next': 'ще попереду',
      pick: 'Обери відповідь',
      'goal.aria': 'Варіанти відповіді',
      option: 'Відповідь {n}',
      goal: 'ГОООЛ! ⚽ Чудовий удар!',
      saved: 'Воротар зловив! 🧤 Правильна відповідь: {n}',
      next: 'Наступний удар →',
      result: 'Результат →',
      over: 'Матч завершено!',
      'fin.perfect': 'Усі удари в ціль! Чудовий матч!',
      'fin.good': 'Класний матч! Спробуєш ще раз?',
      'fin.zero': 'Гарне тренування! Спробуй ще раз.',
      earned: 'Зароблено {n} 🪙.',
      'earned.bonus': 'Зароблено {n} 🪙 (є бонус за 5 голів!)',
      'earned.hint': 'Зароблено {n} 🪙. Додай таблицю 6, 7, 8 чи 9 — і за 5 голів буде бонус!',
      again: 'Ще раз ↗',
      catalog: 'До каталогу',
    },
    es: {
      title: 'Penaltis de multiplicar — Keeper Fun Games',
      coins: 'Monedas',
      back: '← Al catálogo',
      eyebrow: 'Mates · ⚽',
      h1: 'Penaltis de multiplicar',
      sub: 'Resuelve la multiplicación y chuta a la respuesta correcta. ¡Tienes 5 penaltis!',
      tables: '¿Qué tablas practicamos?',
      'tables.aria': 'Tablas de multiplicar',
      all: 'Todas',
      many: 'Puedes elegir varias.',
      start: '¡Al campo! →',
      round: 'PENALTI {n} DE {total}',
      'dots.aria': 'Resultados de los penaltis',
      dot: 'Penalti {n}: {r}',
      'dot.goal': 'gol',
      'dot.save': 'parada',
      'dot.next': 'falta por tirar',
      pick: 'Elige la respuesta',
      'goal.aria': 'Respuestas',
      option: 'Respuesta {n}',
      goal: '¡GOOOL! ⚽ ¡Qué golazo!',
      saved: '¡Paradón del portero! 🧤 La respuesta correcta es {n}',
      next: 'Siguiente penalti →',
      result: 'Resultado →',
      over: '¡Fin del partido!',
      'fin.perfect': '¡Todos los penaltis dentro! ¡Partidazo!',
      'fin.good': '¡Buen partido! ¿Lo intentas otra vez?',
      'fin.zero': '¡Buen entrenamiento! Inténtalo otra vez.',
      earned: 'Has ganado {n} 🪙.',
      'earned.bonus': 'Has ganado {n} 🪙 (¡con premio extra por 5 goles!)',
      'earned.hint': 'Has ganado {n} 🪙. Añade la tabla del 6, 7, 8 o 9 y con 5 goles ganarás un premio extra.',
      again: 'Otra vez ↗',
      catalog: 'Al catálogo',
    },
  });
  document.title = T('title');
  T.apply();
  const selected = new Set([2, 3, 4, 5]);
  const rand = (n) => Math.floor(Math.random() * n);
  /** @param {Event} e @param {string} selector */
  const hit = (e, selector) => /** @type {HTMLElement | null} */ (e.target instanceof Element ? e.target.closest(selector) : null);
  let screen = 'intro';
  const show = KFG.screens(['intro', 'play', 'finish'], { scroll: false, onShow: (name) => (screen = name) });
  let round = 0,
    score = 0,
    results = [],
    answer = 0,
    table = 0,
    hardRound = false,
    locked = false,
    startingCoins = 0,
    timer;
  // Tables 2, 5 and 10 are easy: a coin for every 2 goals. The +5 bonus needs a hard table (6–9) in the round.
  const EASY = [2, 5, 10],
    isHard = (n) => n >= 6 && n <= 9;
  function renderChips() {
    const chip = (/** @type {string} */ table, /** @type {boolean} */ on, /** @type {string} */ text) =>
      h('button', { type: 'button', class: table === 'all' ? 'chip all' : 'chip', 'aria-pressed': String(on), 'data-table': table, text });
    $('chips').replaceChildren(
      chip('all', selected.size === 9, T('all')),
      ...Array.from({ length: 9 }, (_, i) => i + 2).map((n) => chip(String(n), selected.has(n), String(n))),
    );
  }
  $('chips').addEventListener('click', (e) => {
    const chip = hit(e, '.chip');
    if (!chip) return;
    if (chip.dataset.table === 'all') {
      selected.clear();
      for (let n = 2; n <= 10; n++) selected.add(n);
    } else {
      const n = Number(chip.dataset.table);
      if (selected.has(n) && selected.size > 1) selected.delete(n);
      else selected.add(n);
    }
    renderChips();
  });
  function makeOptions(a, b) {
    const correct = a * b;
    const possibilities = [
      a * (b + 1),
      a * (b - 1),
      (a + 1) * b,
      (a - 1) * b,
      correct + 2,
      correct - 2,
      correct + 3,
      correct - 3,
      correct + 5,
      correct - 5,
    ].filter((n) => n > 0 && n !== correct);
    const unique = KFG.shuffle([...new Set(possibilities)]);
    return KFG.shuffle([correct, ...unique.slice(0, 2)]);
  }
  function drawDots() {
    KFG.dots($('dots'), results, round, {
      total,
      cls: { ok: 'scored', miss: 'saved', now: 'current' },
      attrs: (i, r) => ({ 'aria-label': T('dot', { n: i + 1, r: T(r === true ? 'dot.goal' : r === false ? 'dot.save' : 'dot.next') }) }),
    });
  }
  function next() {
    clearTimeout(timer);
    locked = false;
    $('ball').classList.remove('kick');
    $('ball').style.removeProperty('--ball-x');
    $('ball').style.removeProperty('--ball-y');
    $('keeper').classList.remove('dive');
    $('feedback').replaceChildren();
    const tables = [...selected];
    const a = KFG.pick(tables),
      b = 2 + rand(9);
    answer = a * b;
    table = a;
    if (isHard(a)) hardRound = true;
    $('round-label').textContent = T('round', { n: round + 1, total });
    $('question').textContent = `${a} × ${b} = ?`;
    $('goal').replaceChildren(
      ...makeOptions(a, b).map((n) =>
        h('button', { type: 'button', class: 'target', 'data-value': String(n), 'aria-label': T('option', { n }), text: String(n) }),
      ),
    );
    drawDots();
  }
  function finish() {
    show('finish');
    const result = KF.finishGame(slug, { score, max: total, bonus: hardRound ? 5 : 0 });
    const earned = KF.get().coins - startingCoins;
    $('final-score').textContent = `${score} / ${total}`;
    const fin = score === total ? 'fin.perfect' : score > 0 ? 'fin.good' : 'fin.zero';
    const tail = result.bonus ? 'earned.bonus' : result.perfect ? 'earned.hint' : 'earned';
    $('final-message').textContent = `${T(fin)} ${T(tail, { n: earned })}`;
    if (score > 0) KFUI.confetti();
  }
  function shoot(button) {
    if (locked) return;
    locked = true;
    const good = Number(button.dataset.value) === answer;
    results.push(good);
    if (good) score++;
    KF.answer(slug, good, { coin: EASY.includes(table) ? 0.5 : 1 });
    $('goal')
      .querySelectorAll('button')
      .forEach((b) => {
        b.disabled = true;
        if (Number(b.dataset.value) === answer) b.classList.add('correct');
      });
    if (!good) button.classList.add('wrong');
    const ball = $('ball').getBoundingClientRect(),
      target = button.getBoundingClientRect();
    $('ball').style.setProperty('--ball-x', `${target.left + target.width / 2 - ball.left - ball.width / 2}px`);
    $('ball').style.setProperty('--ball-y', `${target.top + target.height / 2 - ball.top - ball.height / 2}px`);
    // Force a frame between resetting the ball and kicking it.
    requestAnimationFrame(() => $('ball').classList.add('kick'));
    if (!good) {
      $('keeper').style.setProperty('--keeper-x', `${target.left + target.width / 2 - ($('keeper').getBoundingClientRect().left + 24)}px`);
      $('keeper').style.setProperty('--keeper-rotate', button === $('goal').firstElementChild ? '-25deg' : '25deg');
      $('keeper').classList.add('dive');
    }
    drawDots();
    timer = setTimeout(
      () => {
        const text = h('p', { text: good ? T('goal') : T('saved', { n: answer }) });
        const nextButton = h('button', {
          type: 'button',
          class: 'btn btn-dark',
          text: T(round === total - 1 ? 'result' : 'next'),
          onclick: () => {
            round++;
            if (round === total) finish();
            else next();
          },
        });
        KFG.feedback($('feedback'), text, nextButton, { scroll: false });
      },
      KFG.reduced() ? 100 : 720,
    );
  }
  $('goal').addEventListener('click', (e) => {
    const button = /** @type {HTMLButtonElement | null} */ (hit(e, 'button.target'));
    if (button) shoot(button);
  });
  function start() {
    clearTimeout(timer);
    round = 0;
    score = 0;
    results = [];
    hardRound = false;
    startingCoins = KF.get().coins;
    show('play');
    next();
  }
  $('start').addEventListener('click', start);
  $('again').addEventListener('click', start);
  // Keyboard: 1–3 shoot at the 1st–3rd target, Enter = start / next kick / again (a focused button keeps its own click).
  KFG.keys({
    ctrl: () => ({
      onKey: (e) => {
        if (screen === 'play') {
          const n = Number(e.key);
          if (!locked && n >= 1 && n <= 3) {
            /** @type {HTMLElement} */ ($('goal').children[n - 1])?.click();
            return true;
          }
          if (e.key === 'Enter') {
            const nextButton = /** @type {HTMLElement | null} */ ($('feedback').querySelector('button'));
            if (nextButton) nextButton.click();
            return !!nextButton;
          }
          return false;
        }
        if (e.key !== 'Enter') return false;
        $(screen === 'intro' ? 'start' : 'again').click();
        return true;
      },
    }),
    // Esc mirrors football-quiz / math-exam: back from the round to the intro without asking, from intro / finish to the catalog.
    onEscape: () => {
      if (screen === 'play') {
        clearTimeout(timer);
        show('intro');
      } else location.href = '../../';
      return true;
    },
  });
  renderChips();
})();
