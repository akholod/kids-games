// Shared progress feedback. Load after kf.js.
'use strict';
(() => {
  const T = KF.i18n({
    uk: {
      achievement: '🏅 {title} — нове досягнення!',
      card: '🌟 Нова картка: {name}!',
      earnCap: 'Сьогодні в цій грі монети вже йдуть повільніше. Спробуй іншу гру! 🎮',
      'sync.synced.short': 'Збережено ✓',
      'sync.synced.long': 'Усе збережено. Прогрес однаковий на всіх пристроях.',
      'sync.pending.short': 'Зберігаю',
      'sync.pending.long': 'Зберігаю прогрес… Це кілька секунд.',
      'sync.offline.short': 'Без інтернету',
      'sync.offline.long': 'Немає інтернету. Прогрес чекає тут і збережеться, коли інтернет повернеться.',
      'sync.expired.short': 'Введи PIN',
      'sync.expired.long': 'Введи PIN ще раз, щоб прогрес зберігався.',
      'test.label': '🧪 Тест-режим · прогрес не зберігається',
      'test.sync.short': 'Тест',
      'test.sync.long': 'Тест-режим: гравець і прогрес живуть лише в цій вкладці, на сервер нічого не йде.',
      'test.exit': 'Вийти',
    },
    es: {
      achievement: '🏅 {title} — ¡nuevo logro!',
      card: '🌟 ¡Carta nueva: {name}!',
      earnCap: 'Hoy en este juego las monedas ya llegan más despacio. ¡Prueba otro juego! 🎮',
      'sync.synced.short': 'Guardado ✓',
      'sync.synced.long': 'Todo guardado. Tu progreso es el mismo en todos los dispositivos.',
      'sync.pending.short': 'Guardando',
      'sync.pending.long': 'Guardando tu progreso… Son unos segundos.',
      'sync.offline.short': 'Sin internet',
      'sync.offline.long': 'No hay internet. Tu progreso espera aquí y se guardará cuando vuelva la conexión.',
      'sync.expired.short': 'Escribe tu PIN',
      'sync.expired.long': 'Escribe tu PIN otra vez para que tu progreso se guarde.',
      'test.label': '🧪 Modo de prueba · el progreso no se guarda',
      'test.exit': 'Salir',
      'test.sync.short': 'Prueba',
      'test.sync.long': 'Modo de prueba: el jugador y el progreso solo viven en esta pestaña, no se envía nada al servidor.',
    },
  });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stack = document.createElement('div');
  stack.className = 'kf-toast-stack';
  stack.setAttribute('role', 'status');
  stack.setAttribute('aria-live', 'polite');
  document.body.append(stack);
  // A modal <dialog> sits in the top layer, above anything in <body>: show feedback inside it instead.
  function host(el) {
    const modal = [...document.querySelectorAll('dialog[open]')].reverse().find((d) => {
      try {
        return d.matches(':modal');
      } catch {
        return false;
      }
    });
    const target = modal || document.body;
    if (el.parentNode !== target) target.append(el);
  }
  function toast(message, kind = '') {
    host(stack);
    const node = document.createElement('div');
    node.className = `kf-toast ${kind}`;
    node.textContent = message;
    stack.append(node);
    // Keep celebrations visible without covering the match on small screens.
    while (stack.children.length > 2) stack.firstElementChild.remove();
    setTimeout(() => {
      node.classList.add('out');
      setTimeout(() => node.remove(), 300);
    }, 2300);
  }
  function confetti() {
    if (reduced()) return;
    const layer = document.createElement('div');
    layer.className = 'kf-confetti';
    const colors = ['#c9f269', '#ffc448', '#fffdf5', '#5bc394'];
    for (let i = 0; i < 36; i++) {
      const bit = document.createElement('i');
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty('--drift', `${Math.random() * 220 - 110}px`);
      bit.style.animationDelay = `${Math.random() * 0.55}s`;
      layer.append(bit);
    }
    host(layer);
    setTimeout(() => layer.remove(), 2600);
  }
  function updateCoins() {
    document.querySelectorAll('[data-kf-coins]').forEach((el) => {
      el.textContent = String(KF.get().coins);
    });
  }
  KF.on('change', updateCoins);
  KF.on('coins', (delta) => {
    if (delta > 0) toast(`+${delta} 🪙`, 'coin');
  });
  KF.on('earn-cap', () => toast(T('earnCap')));
  KF.on('achievement', (a) => {
    toast(T('achievement', { title: a.title }));
    confetti();
  });
  KF.on('card', (x) => {
    if (x.isNew) {
      toast(T('card', { name: x.name }));
      confetti();
    }
  });
  // Sync state of the logged-in player. Any element with data-kf-sync gets data-state;
  // data-kf-sync="" shows the short label, ="long" the explanation, ="dot" only the state.
  const SYNC = Object.fromEntries(
    ['synced', 'pending', 'offline', 'expired'].map((k) => [k, { short: T(`sync.${k}.short`), long: T(`sync.${k}.long`) }]),
  );
  // ?parent: the sandbox player never syncs, so don't promise "saved on every device"
  if (KF.TEST_MODE) SYNC.synced = { short: T('test.sync.short'), long: T('test.sync.long') };

  function updateSync() {
    const status = KF.auth?.status || 'guest';
    /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-kf-sync]')).forEach((el) => {
      el.dataset.state = status;
      const mode = el.dataset.kfSync;
      if (mode !== 'dot') el.textContent = SYNC[status]?.[mode === 'long' ? 'long' : 'short'] || '';
    });
  }
  if (KF.auth) KF.on('auth', updateSync);
  function testRibbon() {
    if (!KF.TEST_MODE) return;
    const bar = document.createElement('div');
    bar.className = 'kf-test-ribbon';
    bar.setAttribute('role', 'note');
    const label = document.createElement('span');
    label.textContent = T('test.label');
    const exit = document.createElement('a');
    exit.href = `${location.pathname}?parent=off`;
    exit.textContent = T('test.exit');
    bar.append(label, exit);
    document.body.prepend(bar);
  }
  updateCoins();
  testRibbon();
  window.KFUI = { toast, confetti, updateCoins, updateSync, SYNC };
})();
