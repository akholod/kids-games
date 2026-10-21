'use strict';
// Player profile: FIFA-style card with stats, shirt editor (KFKit), rename and PIN change (KF.auth).
// Guests see their card and a «sign in» button (../#login opens the catalog's login dialog).
(() => {
  const plural = (n, one, few, many) =>
    n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && !(n % 100 >= 12 && n % 100 <= 14) ? few : many;
  const es2 = (n, one, many) => (n === 1 ? one : many);
  const T = KF.i18n({
    uk: {
      title: 'Мій профіль — Keeper Fun Games',
      brand: 'Keeper Fun Games, головна',
      coins: 'Монети',
      back: '← До ігор',
      h1: 'Мій профіль',
      pos: 'ВОР',
      'tier.bronze': 'Бронза',
      'tier.silver': 'Срібло',
      'tier.gold': 'Золото',
      guest: 'Гість',
      card: ({ name, ovr }) => `Картка гравця ${name}, рейтинг ${ovr}`,
      'abbr.math': 'МАТ',
      'abbr.english': 'АНГ',
      'abbr.fun': 'ФУТ',
      'abbr.sociales': 'СВІТ',
      'abbr.ukrainian': 'УКР',
      'abbr.lengua': 'ІСП',
      'stat.games': 'Матчі',
      'stat.goals': 'Голи',
      'stat.best': 'Найкраща серія',
      'stat.days': 'Днів поспіль',
      'stat.coins': 'Монети',
      'stat.album': 'Альбом',
      'stat.awards': 'Досягнення',
      tip: 'Рейтинг росте з кожним матчем 📈',
      'test.unlock': '🔓 Тест: відкрити всі особливі футболки',
      tabs: 'Що змінити',
      'tab.kit': '👕 Футболка',
      'tab.name': '✏️ Імʼя',
      'tab.pin': '🔑 PIN',
      'ed.pattern': 'Візерунок',
      'ed.specials': 'Особливі футболки',
      'ed.specialsCount': 'відкрито {n} з {total}',
      'ed.c1': 'Основний колір',
      'ed.c2': 'Другий колір',
      'ed.c2.plain': 'Комір і рукави',
      'ed.c2.stripes': 'Колір смуг',
      'ed.c2.hoops': 'Колір смуг',
      'ed.c2.halves': 'Друга половина',
      'ed.c2.sash': 'Колір стрічки',
      'ed.c2.checker': 'Колір клітинок',
      'ed.c2.retro': 'Комір і смужки',
      'ed.fixed': 'У цієї футболки свої кольори ✨',
      'ed.chest': 'На грудях',
      'ed.picture': 'Картинка',
      'ed.number': 'Номер',
      'ed.numLabel': 'Номер на футболці',
      'ed.less': 'Менше',
      'ed.more': 'Більше',
      'ed.numTip': 'Набери 1 або 2 цифри: від 1 до 99',
      'ed.save': 'Зберегти футболку',
      'ed.undo': 'Скасувати',
      'ed.saving': 'Зберігаю…',
      'ed.saved': 'Готово! Нова футболка вже на тобі ⚽',
      'ed.unsaved': 'Футболку ще не збережено. Натисни «Зберегти футболку» або Esc ще раз, щоб вийти.',
      'pat.plain': 'Однотонна',
      'pat.stripes': 'Смуги',
      'pat.hoops': 'Поперечні смуги',
      'pat.halves': 'Половинки',
      'pat.sash': 'Стрічка',
      'pat.checker': 'Шахівниця',
      'pat.fire': 'Вогонь',
      'pat.retro': 'Ретро',
      'pat.keeper': 'Стіна',
      'pat.lightning': 'Блискавка',
      'pat.abc': 'ABC',
      'pat.math': 'Математик',
      'pat.world': 'Планета',
      'pat.galaxy': 'Галактика',
      'pat.champion': 'Чемпіон',
      'pat.new': 'Нова футболка',
      'lock.soon': 'Скоро',
      'lock.aria': '{name}: закрито. Відкриє досягнення «{title}»',
      'lock.ariaSoon': '{name}: закрито',
      'lock.text': '🔒 «{name}»: отримай досягнення {icon} «{title}» ({desc}).',
      'lock.unknown': '🔒 «{name}» відкриється за нове досягнення. Скоро!',
      'color.red': 'Червоний',
      'color.orange': 'Помаранчевий',
      'color.yellow': 'Жовтий',
      'color.green': 'Зелений',
      'color.teal': 'Бірюзовий',
      'color.sky': 'Блакитний',
      'color.blue': 'Синій',
      'color.navy': 'Темно-синій',
      'color.purple': 'Фіолетовий',
      'color.pink': 'Рожевий',
      'color.white': 'Білий',
      'color.black': 'Чорний',
      'name.title': 'Змінити імʼя',
      'name.now': 'Зараз тебе звати {name}.',
      'name.label': 'Нове імʼя',
      'name.placeholder': 'Твоє нове імʼя',
      'name.rules': 'Тільки літери, пробіл, дефіс або апостроф, до 30 знаків.',
      'name.pin': 'Твій PIN',
      'name.save': 'Змінити імʼя',
      'name.empty': 'Напиши нове імʼя 🙂',
      'name.bad': 'Тільки літери, пробіл, дефіс або апостроф, до 30 знаків.',
      'name.same': 'Це вже твоє імʼя 🙂',
      'name.taken': 'Таке імʼя вже є. Додай першу літеру прізвища або обери інше.',
      'name.done': 'Готово! Тепер тебе звати {name} ⚽',
      'pin.title': 'Змінити PIN',
      'pin.text': 'Інші пристрої залишаться в грі.',
      'pin.old': 'Старий PIN',
      'pin.new': 'Новий PIN',
      'pin.again': 'Новий ще раз',
      'pin.save': 'Змінити PIN',
      'pin.erase': 'Стерти',
      'pin.box': '{label}: введено {n} з 4',
      'pin.needOld': 'Спершу введи старий PIN: 4 цифри 🙂',
      'pin.needNew': 'Придумай новий PIN: 4 цифри 🙂',
      'pin.needAgain': 'Набери новий PIN ще раз 🙂',
      'pin.mismatch': 'Новий PIN і повтор не збігаються. Набери ще раз 🙂',
      'pin.sameAsOld': 'Новий PIN такий самий, як старий. Придумай інший 🙂',
      'pin.done': 'PIN змінено! Запамʼятай новий 🔑 На інших пристроях ти й далі в грі.',
      busy: 'Зберігаю…',
      'err.badPin': 'Не той PIN, спробуй ще 🙂',
      'err.left': ' Залишилось спроб: {n}.',
      'err.locked': 'Багато спроб підряд. Зачекай {min} хв і спробуй ще ⏳',
      'err.pinFormat': 'PIN — це 4 цифри.',
      'err.auth': 'Щоб зберегти, треба знову ввести PIN.',
      'err.authLink': 'Увійти',
      'err.offline': '📶 Немає інтернету. Перевір Wi‑Fi і спробуй ще раз.',
      'err.net': '📶 Не вдалося зʼєднатися. Спробуй ще раз трохи згодом.',
      'err.avatar': 'Таку футболку не вдалося зберегти. Обери іншу 🙂',
      'err.test': 'У тест-режимі це не зберігається.',
      'guest.title': 'Створи свою футболку!',
      'guest.text': 'Увійди або створи гравця, і зможеш обрати візерунок, кольори та номер.',
      'guest.btn': '⚽ Увійди або створи гравця',
      nGames: ({ n }) => `${n} ${plural(n, 'матч', 'матчі', 'матчів')}`,
    },
    es: {
      title: 'Mi perfil — Keeper Fun Games',
      brand: 'Keeper Fun Games, inicio',
      coins: 'Monedas',
      back: '← A los juegos',
      h1: 'Mi perfil',
      pos: 'POR',
      'tier.bronze': 'Bronce',
      'tier.silver': 'Plata',
      'tier.gold': 'Oro',
      guest: 'Invitado',
      card: ({ name, ovr }) => `Carta de ${name}, media ${ovr}`,
      'abbr.math': 'MAT',
      'abbr.english': 'ING',
      'abbr.fun': 'FÚT',
      'abbr.sociales': 'SOC',
      'abbr.ukrainian': 'UCR',
      'abbr.lengua': 'LEN',
      'stat.games': 'Partidos',
      'stat.goals': 'Goles',
      'stat.best': 'Mejor racha',
      'stat.days': 'Días seguidos',
      'stat.coins': 'Monedas',
      'stat.album': 'Álbum',
      'stat.awards': 'Logros',
      tip: 'Tu media sube con cada partido 📈',
      'test.unlock': '🔓 Prueba: desbloquear todas las camisetas especiales',
      tabs: 'Qué cambiar',
      'tab.kit': '👕 Camiseta',
      'tab.name': '✏️ Nombre',
      'tab.pin': '🔑 PIN',
      'ed.pattern': 'Diseño',
      'ed.specials': 'Camisetas especiales',
      'ed.specialsCount': 'tienes {n} de {total}',
      'ed.c1': 'Color principal',
      'ed.c2': 'Segundo color',
      'ed.c2.plain': 'Cuello y mangas',
      'ed.c2.stripes': 'Color de las rayas',
      'ed.c2.hoops': 'Color de las franjas',
      'ed.c2.halves': 'La otra mitad',
      'ed.c2.sash': 'Color de la banda',
      'ed.c2.checker': 'Color de los cuadros',
      'ed.c2.retro': 'Cuello y rayitas',
      'ed.fixed': 'Esta camiseta tiene sus propios colores ✨',
      'ed.chest': 'En el pecho',
      'ed.picture': 'Dibujo',
      'ed.number': 'Número',
      'ed.numLabel': 'Número de la camiseta',
      'ed.less': 'Menos',
      'ed.more': 'Más',
      'ed.numTip': 'Escribe 1 o 2 cifras: del 1 al 99',
      'ed.save': 'Guardar camiseta',
      'ed.undo': 'Cancelar',
      'ed.saving': 'Guardando…',
      'ed.saved': '¡Listo! Ya llevas tu camiseta nueva ⚽',
      'ed.unsaved': 'La camiseta aún no está guardada. Pulsa «Guardar camiseta» o Esc otra vez para salir.',
      'pat.plain': 'Lisa',
      'pat.stripes': 'Rayas',
      'pat.hoops': 'Franjas',
      'pat.halves': 'Mitades',
      'pat.sash': 'Banda',
      'pat.checker': 'Cuadros',
      'pat.fire': 'Fuego',
      'pat.retro': 'Retro',
      'pat.keeper': 'Muro',
      'pat.lightning': 'Rayo',
      'pat.abc': 'ABC',
      'pat.math': 'Mates',
      'pat.world': 'Planeta',
      'pat.galaxy': 'Galaxia',
      'pat.champion': 'Campeón',
      'pat.new': 'Camiseta nueva',
      'lock.soon': 'Pronto',
      'lock.aria': '{name}: cerrada. Se abre con el logro «{title}»',
      'lock.ariaSoon': '{name}: cerrada',
      'lock.text': '🔒 «{name}»: consigue el logro {icon} «{title}» ({desc}).',
      'lock.unknown': '🔒 «{name}» se abrirá con un logro nuevo. ¡Pronto!',
      'color.red': 'Rojo',
      'color.orange': 'Naranja',
      'color.yellow': 'Amarillo',
      'color.green': 'Verde',
      'color.teal': 'Turquesa',
      'color.sky': 'Celeste',
      'color.blue': 'Azul',
      'color.navy': 'Azul marino',
      'color.purple': 'Morado',
      'color.pink': 'Rosa',
      'color.white': 'Blanco',
      'color.black': 'Negro',
      'name.title': 'Cambiar el nombre',
      'name.now': 'Ahora te llamas {name}.',
      'name.label': 'Nombre nuevo',
      'name.placeholder': 'Tu nombre nuevo',
      'name.rules': 'Solo letras, espacios, guiones o apóstrofos, hasta 30.',
      'name.pin': 'Tu PIN',
      'name.save': 'Cambiar el nombre',
      'name.empty': 'Escribe tu nombre nuevo 🙂',
      'name.bad': 'Solo letras, espacios, guiones o apóstrofos, hasta 30.',
      'name.same': 'Ya te llamas así 🙂',
      'name.taken': 'Ese nombre ya existe. Añade la primera letra de tu apellido o elige otro.',
      'name.done': '¡Listo! Ahora te llamas {name} ⚽',
      'pin.title': 'Cambiar el PIN',
      'pin.text': 'En tus otros dispositivos seguirás dentro.',
      'pin.old': 'PIN actual',
      'pin.new': 'PIN nuevo',
      'pin.again': 'PIN nuevo otra vez',
      'pin.save': 'Cambiar el PIN',
      'pin.erase': 'Borrar',
      'pin.box': '{label}: {n} de 4',
      'pin.needOld': 'Primero escribe tu PIN actual: 4 números 🙂',
      'pin.needNew': 'Inventa un PIN nuevo: 4 números 🙂',
      'pin.needAgain': 'Escribe el PIN nuevo otra vez 🙂',
      'pin.mismatch': 'El PIN nuevo y la repetición no son iguales. Escríbelos otra vez 🙂',
      'pin.sameAsOld': 'El PIN nuevo es igual que el actual. Inventa otro 🙂',
      'pin.done': '¡PIN cambiado! Apréndete el nuevo 🔑 En tus otros dispositivos sigues dentro.',
      busy: 'Guardando…',
      'err.badPin': 'Ese PIN no es, prueba otra vez 🙂',
      'err.left': ({ n }) => ` ${es2(n, 'Te queda 1 intento', `Te quedan ${n} intentos`)}.`,
      'err.locked': 'Muchos intentos seguidos. Espera {min} min y prueba otra vez ⏳',
      'err.pinFormat': 'El PIN son 4 números.',
      'err.auth': 'Para guardar, tienes que escribir tu PIN otra vez.',
      'err.authLink': 'Entrar',
      'err.offline': '📶 No hay internet. Mira el wifi y prueba otra vez.',
      'err.net': '📶 No se ha podido conectar. Prueba otra vez dentro de un rato.',
      'err.avatar': 'Esta camiseta no se ha podido guardar. Elige otra 🙂',
      'err.test': 'En el modo de prueba esto no se guarda.',
      'guest.title': '¡Diseña tu camiseta!',
      'guest.text': 'Entra o crea tu jugador y podrás elegir el diseño, los colores y el número.',
      'guest.btn': '⚽ Entra o crea tu jugador',
      nGames: ({ n }) => `${n} ${es2(n, 'partido', 'partidos')}`,
    },
  });
  document.title = T('title');
  T.apply();

  /** @returns {any} */
  const $ = (id) => document.getElementById(id);
  const h = (tag, props = {}, ...kids) => {
    const el = Object.assign(document.createElement(tag), props);
    el.append(...kids);
    return el;
  };
  const auth = KF.auth;
  const MARKS = KFKit.MARKS;
  const COLORS = /** @type {KFKitColor[]} */ (Object.keys(KFKit.COLORS));
  const PATTERNS = [...KFKit.PATTERNS, ...KFKit.SPECIALS.map((x) => x.id)];
  const isNumber = (m) => /^[1-9][0-9]?$/.test(String(m));
  const patName = (p) => (T.has(`pat.${p}`) ? T(`pat.${p}`) : T('pat.new'));
  const achievement = (pattern) => {
    const id = KFKit.need(pattern);
    return id ? KF.ACHIEVEMENTS.find((a) => a.id === id) || null : null;
  };
  // Test mode only: a parent switch opens every special (per tab, like the sandbox).
  const UNLOCK_KEY = 'kf-test-unlock';
  let unlockAll = false;
  try {
    unlockAll = KF.TEST_MODE && sessionStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    // storage disabled: the switch works for this page only
  }
  const isUnlocked = (p) => unlockAll || KFKit.unlocked(p, KF.get().achievements);
  const netError = () => T(navigator.onLine === false ? 'err.offline' : 'err.net');

  // ---- Player card + stats ----
  /** Category attributes of this site's games: 40 + 3 per match played, up to 99. */
  function attributes() {
    const games = KF.get().games || {};
    const cats = [];
    for (const g of KF.siteGames()) if (!cats.includes(g.category)) cats.push(g.category);
    const order = Object.keys(KF.CATEGORIES);
    cats.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return cats.map((cat) => {
      const plays = KF.siteGames()
        .filter((g) => g.category === cat)
        .reduce((sum, g) => sum + (Number(games[g.slug]?.plays) || 0), 0);
      return { cat, value: Math.min(99, 40 + 3 * plays) };
    });
  }

  let cardKitKey = '';
  function drawCard() {
    const user = auth?.user;
    const name = user ? String(user.name) : T('guest');
    const attrs = attributes();
    const ovr = attrs.length ? Math.round(attrs.reduce((s, a) => s + a.value, 0) / attrs.length) : 40;
    const tier = ovr >= 80 ? 'gold' : ovr >= 60 ? 'silver' : 'bronze';
    const card = $('player-card');
    card.dataset.tier = tier;
    card.setAttribute('aria-label', T('card', { name, ovr }));
    $('pc-ovr').textContent = String(ovr);
    $('pc-tier').textContent = T(`tier.${tier}`);
    $('pc-name').textContent = name;
    $('pc-attrs').replaceChildren(
      ...attrs.map((a) => {
        const row = h('div', {}, h('dd', { textContent: String(a.value) }), h('dt', { textContent: T(`abbr.${a.cat}`) }));
        row.title = KF.CATEGORIES[a.cat]?.title || '';
        return row;
      }),
    );
    drawCardKit();
    const s = KF.get();
    const owned = KF.CARDS.filter((c) => (s.cards[c.id] || 0) > 0).length;
    const awards = KF.ACHIEVEMENTS.filter((a) => s.achievements[a.id]).length;
    const stat = (icon, key, value, wide = false) =>
      h(
        'div',
        { className: wide ? 'wide' : '' },
        h('i', { textContent: icon, ariaHidden: 'true' }),
        h('dt', { textContent: T(key) }),
        h('dd', { textContent: String(value) }),
      );
    $('pf-stats').replaceChildren(
      stat('⚽', 'stat.games', s.stats.games),
      stat('🥅', 'stat.goals', s.stats.correct),
      stat('🔥', 'stat.best', s.stats.bestStreak),
      stat('📅', 'stat.days', s.stats.dayStreak),
      stat('🪙', 'stat.coins', s.coins),
      stat('📒', 'stat.album', `${owned} / ${KF.CARDS.length}`),
      stat('🏅', 'stat.awards', `${awards} / ${KF.ACHIEVEMENTS.length}`, true),
    );
  }
  /** The big shirt: the one being edited (live preview), else the saved one. */
  function drawCardKit(pop = false) {
    const k = editing ? kit : savedKit();
    const key = KFKit.format(k);
    if (key !== cardKitKey) {
      cardKitKey = key;
      $('pc-kit').replaceChildren(KFKit.svg(k, { animate: true }));
    }
    if (pop) {
      $('pc-kit').classList.remove('pop');
      void $('pc-kit').offsetWidth;
      $('pc-kit').classList.add('pop');
    }
  }
  const savedKit = () => {
    const user = auth?.user;
    return KFKit.parse(user?.avatar, user || { name: T('guest') });
  };

  // ---- Shirt editor ----
  let editing = false;
  /** @type {KFKit} */
  let kit = savedKit();
  let saving = false;
  let lastPicture = MARKS[0];
  let lastNumber = '1';
  let escArmed = 0;
  const dirty = () => editing && KFKit.format(kit) !== KFKit.format(savedKit());

  /** A roving-tabindex radio group: arrows move (Up/Down by grid rows when cols > 1), Home/End. */
  function radioKeys(container, items, choose, { grid = false } = {}) {
    container.addEventListener('keydown', (e) => {
      const list = items();
      const at = list.indexOf(document.activeElement);
      if (at < 0) return;
      const cols = grid ? getComputedStyle(e.target.parentElement).gridTemplateColumns.split(' ').length : 1;
      const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: grid ? cols : 1, ArrowUp: grid ? -cols : -1 }[e.key];
      let to = -1;
      if (step) to = Math.min(list.length - 1, Math.max(0, at + step));
      if (e.key === 'Home') to = 0;
      if (e.key === 'End') to = list.length - 1;
      if (to < 0) return;
      e.preventDefault();
      choose(list[to], true);
    });
  }
  const setChecked = (btn, on) => {
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  };

  // patterns
  const patternBtns = PATTERNS.map((p) => {
    const special = !KFKit.PATTERNS.some((x) => x === p);
    const b = h('button', { type: 'button', className: 'pt' });
    b.setAttribute('role', 'radio');
    b.dataset.pattern = p;
    b.addEventListener('click', () => choosePattern(b, false));
    (special ? $('kit-specials') : $('kit-basic')).append(b);
    return b;
  });
  function drawPatterns() {
    const opened = KFKit.SPECIALS.filter((x) => isUnlocked(x.id)).length;
    $('spec-count').textContent = T('ed.specialsCount', { n: opened, total: KFKit.SPECIALS.length });
    for (const b of patternBtns) {
      const p = b.dataset.pattern;
      const locked = !isUnlocked(p);
      const a = achievement(p);
      b.classList.toggle('is-locked', locked);
      b.setAttribute('aria-disabled', String(locked));
      const name = patName(p);
      const kids = [
        KFKit.svg({ pattern: /** @type {KFKit['pattern']} */ (p), c1: kit.c1, c2: kit.c2, mark: '' }),
        h('b', { textContent: name }),
      ];
      if (locked) kids.push(h('small', { textContent: a ? `${a.icon} ${a.title}` : T('lock.soon') }));
      b.replaceChildren(...kids);
      if (locked) b.setAttribute('aria-label', a ? T('lock.aria', { name, title: a.title }) : T('lock.ariaSoon', { name }));
      else b.removeAttribute('aria-label');
      setChecked(b, kit.pattern === p);
    }
    if (!patternBtns.some((b) => b.tabIndex === 0)) patternBtns[0].tabIndex = 0;
  }
  function choosePattern(b, focus) {
    if (focus) b.focus();
    const p = b.dataset.pattern;
    if (!isUnlocked(p)) {
      tellLock(b);
      return;
    }
    tellLock(null);
    if (kit.pattern === p) return;
    kit = { ...kit, pattern: p };
    // a second colour that differs, so stripes & co. show at once
    if (p !== 'plain' && KFKit.uses(p).c2 && kit.c2 === kit.c1) kit.c2 = kit.c1 === 'white' ? 'navy' : 'white';
    changed();
  }
  function tellLock(b) {
    for (const x of patternBtns) x.classList.toggle('is-told', x === b);
    const box = $('kit-lock');
    box.classList.toggle('on', !!b);
    if (!b) {
      box.textContent = '';
      return;
    }
    const p = b.dataset.pattern;
    const a = achievement(p);
    const name = patName(p);
    box.textContent = a ? T('lock.text', { name, icon: a.icon, title: a.title, desc: a.desc }) : T('lock.unknown', { name });
  }
  radioKeys(
    $('kit-patterns'),
    () => patternBtns,
    (b) => {
      b.focus();
      choosePattern(b, false);
    },
  );

  const unlockBtn = $('pf-unlock-all');
  unlockBtn.hidden = !KF.TEST_MODE;
  unlockBtn.setAttribute('aria-pressed', String(unlockAll));
  unlockBtn.addEventListener('click', () => {
    unlockAll = !unlockAll;
    try {
      if (unlockAll) sessionStorage.setItem(UNLOCK_KEY, '1');
      else sessionStorage.removeItem(UNLOCK_KEY);
    } catch {
      // memory only
    }
    unlockBtn.setAttribute('aria-pressed', String(unlockAll));
    tellLock(null);
    // switched off on an unsaved special that is locked again: back to the saved pattern
    const saved = savedKit();
    if (!isUnlocked(kit.pattern) && kit.pattern !== saved.pattern) {
      kit = { ...kit, pattern: saved.pattern };
      changed();
    } else drawPatterns();
  });

  // colours
  const colorBtns = { c1: [], c2: [] };
  for (const slot of /** @type {('c1' | 'c2')[]} */ (['c1', 'c2'])) {
    colorBtns[slot] = COLORS.map((c) => {
      const b = h('button', { type: 'button', className: 'swatch' });
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', T(`color.${c}`));
      b.dataset.color = c;
      b.style.setProperty('--sw', KFKit.COLORS[c]);
      b.addEventListener('click', () => chooseColor(slot, c));
      return b;
    });
    $(`kit-${slot}`).append(...colorBtns[slot]);
    radioKeys(
      $(`kit-${slot}`),
      () => colorBtns[slot],
      (b) => {
        b.focus();
        chooseColor(slot, b.dataset.color);
      },
      { grid: true },
    );
  }
  function chooseColor(slot, c) {
    if (kit[slot] === c) return;
    kit = { ...kit, [slot]: c };
    changed();
  }
  function drawColors() {
    const uses = KFKit.uses(kit.pattern);
    $('sec-c1').hidden = !uses.c1;
    $('sec-c2').hidden = !uses.c2;
    $('kit-fixed').hidden = uses.c1 || uses.c2;
    $('c2-label').textContent = T.has(`ed.c2.${kit.pattern}`) ? T(`ed.c2.${kit.pattern}`) : T('ed.c2');
    for (const slot of /** @type {('c1' | 'c2')[]} */ (['c1', 'c2']))
      for (const b of colorBtns[slot]) setChecked(b, b.dataset.color === kit[slot]);
  }

  // chest: picture or number
  const kindBtns = [...$('mark-kind').querySelectorAll('button')];
  kindBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const number = b.dataset.kind === 'number';
      if (number === isNumber(kit.mark)) return;
      kit = { ...kit, mark: number ? lastNumber : lastPicture };
      changed();
    }),
  );
  const markBtns = MARKS.map((m) => {
    const b = h('button', { type: 'button', textContent: m });
    b.setAttribute('role', 'radio');
    b.dataset.mark = m;
    b.addEventListener('click', () => chooseMark(m));
    return b;
  });
  $('kit-marks').append(...markBtns);
  radioKeys(
    $('kit-marks'),
    () => markBtns,
    (b) => {
      b.focus();
      chooseMark(b.dataset.mark);
    },
    { grid: true },
  );
  function chooseMark(m) {
    if (kit.mark === m) return;
    if (isNumber(m)) lastNumber = m;
    else lastPicture = m;
    kit = { ...kit, mark: m };
    changed();
  }
  function drawChest() {
    const number = isNumber(kit.mark);
    kindBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.kind === 'number') === number)));
    $('kit-marks').hidden = number;
    $('kit-number').hidden = !number;
    for (const b of markBtns) setChecked(b, b.dataset.mark === kit.mark);
    const n = number ? Number(kit.mark) : Number(lastNumber);
    $('num-val').textContent = String(n);
    $('num-val').setAttribute('aria-valuenow', String(n));
    $('num-minus').disabled = n <= 1;
    $('num-plus').disabled = n >= 99;
  }
  // number: −/+ (hold to repeat), arrows on the spinbutton, digits typed like a scoreboard (1 → 1, then 0 → 10)
  let typed = '';
  let typedAt = 0;
  const setNumber = (n) => chooseMark(String(Math.min(99, Math.max(1, n))));
  function typeDigit(d) {
    if (Date.now() - typedAt > 2000) typed = '';
    typedAt = Date.now();
    let next = typed + d;
    if (Number(next) > 99) next = d;
    if (Number(next) < 1) {
      typed = '';
      return;
    }
    typed = next.length >= 2 ? '' : next;
    setNumber(Number(next));
  }
  $('num-pad').append(
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => {
      const b = h('button', { type: 'button', textContent: String(d) });
      b.addEventListener('click', () => typeDigit(String(d)));
      return b;
    }),
  );
  for (const [id, delta] of /** @type {[string, number][]} */ ([
    ['num-minus', -1],
    ['num-plus', 1],
  ])) {
    const b = $(id);
    let hold = 0;
    let repeated = false;
    const stop = () => {
      clearTimeout(hold);
      clearInterval(hold);
    };
    b.addEventListener('pointerdown', () => {
      repeated = false;
      stop();
      hold = setTimeout(() => {
        repeated = true;
        hold = setInterval(() => setNumber(Number(lastNumber) + delta), 90);
      }, 450);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
    b.addEventListener('click', () => {
      typed = '';
      if (!repeated) setNumber(Number(lastNumber) + delta);
      repeated = false;
    });
  }
  $('num-val').addEventListener('keydown', (e) => {
    const n = Number(lastNumber);
    const to = {
      ArrowUp: n + 1,
      ArrowRight: n + 1,
      ArrowDown: n - 1,
      ArrowLeft: n - 1,
      PageUp: n + 10,
      PageDown: n - 10,
      Home: 1,
      End: 99,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    typed = '';
    setNumber(to);
  });

  // save / undo
  function changed() {
    $('kit-msg').textContent = '';
    escArmed = 0;
    drawEditor();
    drawCardKit(true);
  }
  function drawEditor() {
    drawPatterns();
    drawColors();
    drawChest();
    const d = dirty();
    $('kit-bar').hidden = !d && !saving;
    if (d) $('bar-kit').replaceChildren(KFKit.svg(kit));
  }
  function setMsg(id, text, kind = '', link = null) {
    const el = $(id);
    el.dataset.kind = kind;
    el.replaceChildren(text);
    if (link) el.append(' ', h('a', { href: link.href, textContent: link.text }));
  }
  /** KFAuthResult error → kind words for a message area. */
  function errorText(r) {
    const err = r?.error;
    if (err === 'bad_pin') {
      const left = Number(r.attemptsLeft);
      return T('err.badPin') + (left > 0 && left <= 3 ? T('err.left', { n: left }) : '');
    }
    if (err === 'locked') return T('err.locked', { min: Math.max(1, Math.ceil((Number(r.retryAfter) || 300) / 60)) });
    if (err === 'bad_pin_format') return T('err.pinFormat');
    if (err === 'bad_avatar') return T('err.avatar');
    if (err === 'test_mode') return T('err.test');
    return netError();
  }
  const authLink = () => ({ href: '../#login', text: T('err.authLink') });

  async function saveKit() {
    if (saving || !dirty()) return;
    const value = KFKit.format(kit);
    saving = true;
    $('kit-save').disabled = true;
    $('kit-save').textContent = T('ed.saving');
    let r;
    try {
      r = await auth.setAvatar(value);
    } catch {
      r = { ok: false, error: 'network' };
    }
    saving = false;
    $('kit-save').disabled = false;
    $('kit-save').textContent = T('ed.save');
    if (r?.ok) {
      kit = savedKit();
      setMsg('kit-msg', T('ed.saved'), 'ok');
      drawEditor();
      drawCardKit(true);
      KFUI.confetti();
      return;
    }
    if (r?.error === 'auth') setMsg('kit-msg', T('err.auth'), 'bad', authLink());
    else setMsg('kit-msg', errorText(r), r?.error === 'bad_avatar' ? 'bad' : 'net');
    drawEditor();
  }
  $('kit-save').addEventListener('click', saveKit);
  $('kit-undo').addEventListener('click', () => {
    kit = savedKit();
    syncMarkMemory();
    tellLock(null);
    changed();
    $('tab-kit').focus();
  });
  function syncMarkMemory() {
    if (isNumber(kit.mark)) lastNumber = kit.mark;
    else lastPicture = kit.mark;
  }

  // ---- PIN boxes + keypads (shared by the rename and PIN forms) ----
  /** @typedef {{ el: HTMLButtonElement, label: string, value: string }} PinBox */
  function pinForm(boxesId, keypadId, labels) {
    /** @type {PinBox[]} */
    const boxes = labels.map((label) => {
      const el = /** @type {HTMLButtonElement} */ (
        h('button', { type: 'button', className: 'pin-box' }, h('span', { textContent: label }), h('i'), h('i'), h('i'), h('i'))
      );
      return { el, label, value: '' };
    });
    let active = 0;
    const draw = () =>
      boxes.forEach((b, i) => {
        [...b.el.querySelectorAll('i')].forEach((dot, j) => dot.classList.toggle('on', j < b.value.length));
        b.el.setAttribute('aria-current', String(i === active));
        b.el.setAttribute('aria-label', T('pin.box', { label: b.label, n: b.value.length }));
      });
    boxes.forEach((b, i) =>
      b.el.addEventListener('click', () => {
        active = i;
        b.el.classList.remove('is-bad');
        draw();
      }),
    );
    $(boxesId).append(...boxes.map((b) => b.el));
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d) => {
      if (d === '') return h('span');
      const k = h('button', { type: 'button', textContent: String(d) });
      if (d === '⌫') {
        k.className = 'key-erase';
        k.setAttribute('aria-label', T('pin.erase'));
        k.addEventListener('click', () => api.erase());
      } else k.addEventListener('click', () => api.digit(String(d)));
      return k;
    });
    $(keypadId).append(...keys);
    const api = {
      boxes,
      get active() {
        return active;
      },
      focus(i) {
        active = i;
        draw();
      },
      digit(d) {
        if (api.disabled) return;
        const b = boxes[active];
        b.el.classList.remove('is-bad');
        if (b.value.length >= 4) return;
        b.value += d;
        if (b.value.length === 4 && active < boxes.length - 1) active++;
        draw();
        api.onInput?.();
      },
      erase() {
        if (api.disabled) return;
        let b = boxes[active];
        if (!b.value && active > 0) b = boxes[--active];
        b.value = b.value.slice(0, -1);
        draw();
        api.onInput?.();
      },
      clear(i) {
        boxes[i].value = '';
        draw();
      },
      bad(i) {
        const el = boxes[i].el;
        el.classList.remove('is-bad');
        void el.offsetWidth;
        el.classList.add('is-bad');
      },
      disabled: false,
      setDisabled(on) {
        api.disabled = on;
        for (const k of keys) if (k instanceof HTMLButtonElement) k.disabled = on;
      },
      /** @type {(() => void) | null} */
      onInput: null,
    };
    draw();
    return api;
  }

  // Lockout after too many wrong PINs (both forms; the server counts them with the logins).
  let lockUntil = 0;
  let lockTimer = 0;
  function startLock(seconds, forms) {
    lockUntil = Date.now() + (Number(seconds) || 300) * 1000;
    clearInterval(lockTimer);
    const tick = () => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      for (const f of forms) {
        f.pins.setDisabled(left > 0);
        $(f.submit).disabled = left > 0;
      }
      if (left <= 0) {
        clearInterval(lockTimer);
        for (const f of forms) if ($(f.msg).dataset.kind === 'wait') setMsg(f.msg, '');
        return;
      }
      const text = T('err.locked', { min: Math.ceil(left / 60) });
      for (const f of forms) if ($(f.msg).textContent !== text) setMsg(f.msg, text, 'wait');
    };
    tick();
    lockTimer = setInterval(tick, 1000);
  }

  // rename
  const namePins = pinForm('name-boxes', 'name-keypad', [T('name.pin')]);
  const pinPins = pinForm('pin-boxes', 'pin-keypad', [T('pin.old'), T('pin.new'), T('pin.again')]);
  const FORMS = [
    { pins: namePins, submit: 'name-save', msg: 'name-msg' },
    { pins: pinPins, submit: 'pin-save', msg: 'pin-msg' },
  ];
  // Same rule as the server and the sign-up step: letters, spaces, hyphens, apostrophes; at least one letter; ≤ 30.
  const cleanName = (s) => s.normalize('NFC').replace(/['’]/g, 'ʼ').replace(/\s+/g, ' ').trim();
  const nameOk = (s) => /^[\p{L} '’ʼ-]{1,30}$/u.test(s) && /\p{L}/u.test(s);
  const nameInput = $('name-new');
  nameInput.addEventListener('input', () => {
    const name = cleanName(nameInput.value);
    const bad = !!name && !nameOk(name);
    nameInput.setAttribute('aria-invalid', String(bad));
    if (bad) setMsg('name-msg', T('name.bad'), 'bad');
    else if ($('name-msg').dataset.kind === 'bad') setMsg('name-msg', '');
  });
  namePins.onInput = () => {
    if ($('name-msg').dataset.kind === 'bad' && !nameInput.getAttribute('aria-invalid')) setMsg('name-msg', '');
  };
  let busy = false;
  $('name-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || Date.now() < lockUntil) return;
    const name = cleanName(nameInput.value);
    const pin = namePins.boxes[0].value;
    if (!name) return setMsg('name-msg', T('name.empty'), 'bad'), nameInput.focus();
    if (!nameOk(name)) return setMsg('name-msg', T('name.bad'), 'bad'), nameInput.focus();
    if (cleanName(String(auth.user?.name || '')).toLocaleLowerCase(KF.lang) === name.toLocaleLowerCase(KF.lang))
      return setMsg('name-msg', T('name.same'), 'bad');
    if (pin.length < 4) {
      namePins.focus(0);
      namePins.bad(0);
      return setMsg('name-msg', T('pin.needOld'), 'bad');
    }
    busy = true;
    $('name-save').disabled = true;
    setMsg('name-msg', T('busy'));
    let r;
    try {
      r = await auth.rename(name, pin);
    } catch {
      r = { ok: false, error: 'network' };
    }
    busy = false;
    $('name-save').disabled = false;
    namePins.clear(0);
    namePins.focus(0);
    if (r?.ok) {
      nameInput.value = '';
      setMsg('name-msg', T('name.done', { name: auth.user?.name || name }), 'ok');
      KFUI.confetti();
      return;
    }
    const err = r?.error;
    if (err === 'name_taken') return setMsg('name-msg', T('name.taken'), 'bad'), nameInput.focus();
    if (err === 'bad_name') return setMsg('name-msg', T('name.bad'), 'bad'), nameInput.focus();
    if (err === 'auth') return setMsg('name-msg', T('err.auth'), 'bad', authLink());
    if (err === 'locked') return startLock(r.retryAfter, FORMS);
    if (err === 'bad_pin') namePins.bad(0);
    setMsg('name-msg', errorText(r), err === 'bad_pin' || err === 'bad_pin_format' ? 'bad' : 'net');
  });

  // PIN change
  pinPins.onInput = () => {
    if ($('pin-msg').dataset.kind === 'bad') setMsg('pin-msg', '');
  };
  $('pin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || Date.now() < lockUntil) return;
    const [old, next, again] = pinPins.boxes.map((b) => b.value);
    const need = (i, key) => {
      pinPins.focus(i);
      pinPins.bad(i);
      setMsg('pin-msg', T(key), 'bad');
    };
    if (old.length < 4) return need(0, 'pin.needOld');
    if (next.length < 4) return need(1, 'pin.needNew');
    if (again.length < 4) return need(2, 'pin.needAgain');
    if (next !== again) {
      pinPins.clear(1);
      pinPins.clear(2);
      return need(1, 'pin.mismatch');
    }
    if (next === old) {
      pinPins.clear(1);
      pinPins.clear(2);
      return need(1, 'pin.sameAsOld');
    }
    busy = true;
    $('pin-save').disabled = true;
    setMsg('pin-msg', T('busy'));
    let r;
    try {
      r = await auth.changePin(old, next);
    } catch {
      r = { ok: false, error: 'network' };
    }
    busy = false;
    $('pin-save').disabled = false;
    if (r?.ok) {
      [0, 1, 2].forEach((i) => pinPins.clear(i));
      pinPins.focus(0);
      setMsg('pin-msg', T('pin.done'), 'ok');
      return;
    }
    const err = r?.error;
    if (err === 'auth') return setMsg('pin-msg', T('err.auth'), 'bad', authLink());
    if (err === 'locked') {
      pinPins.clear(0);
      return startLock(r.retryAfter, FORMS);
    }
    if (err === 'bad_pin') {
      pinPins.clear(0);
      pinPins.focus(0);
      pinPins.bad(0);
    } else if (err === 'bad_pin_format') {
      pinPins.clear(1);
      pinPins.clear(2);
      pinPins.focus(1);
    }
    setMsg('pin-msg', errorText(r), err === 'bad_pin' || err === 'bad_pin_format' ? 'bad' : 'net');
  });

  // ---- Tabs ----
  const tabs = ['kit', 'name', 'pin'];
  let tab = 'kit';
  function showTab(id, focus = false) {
    tab = id;
    for (const t of tabs) {
      const btn = $(`tab-${t}`);
      btn.setAttribute('aria-selected', String(t === id));
      btn.tabIndex = t === id ? 0 : -1;
      $(`panel-${t}`).hidden = t !== id;
    }
    if (focus) $(`tab-${id}`).focus();
  }
  for (const t of tabs) $(`tab-${t}`).addEventListener('click', () => showTab(t));
  $('pf-account')
    .querySelector('[role=tablist]')
    .addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      showTab(tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length], true);
    });

  // ---- Keyboard: Esc = back to the catalog; digits/Backspace go to the PIN pad or the number ----
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = /** @type {HTMLElement} */ (e.target);
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (dirty() && Date.now() - escArmed > 4000) {
        escArmed = Date.now();
        showTab('kit');
        setMsg('kit-msg', T('ed.unsaved'), 'net');
        $('kit-save').focus();
        return;
      }
      location.href = '../';
      return;
    }
    if (!editing || typing) return;
    const pins = tab === 'name' ? namePins : tab === 'pin' ? pinPins : null;
    if (/^[0-9]$/.test(e.key)) {
      if (pins) pins.digit(e.key);
      else if (isNumber(kit.mark)) typeDigit(e.key);
      else return;
      e.preventDefault();
    } else if (e.key === 'Backspace' && pins) {
      e.preventDefault();
      pins.erase();
    } else if (e.key === 'Enter' && pins && !target.closest('a, [type=submit]')) {
      // Enter = submit, also with the focus on a tab, a PIN box or a keypad key (typed PINs end with Enter)
      e.preventDefault();
      $(tab === 'name' ? 'name-form' : 'pin-form').requestSubmit();
    }
  });

  // ---- Who is here: player (editor + account forms) or guest (card + sign-in button) ----
  function render() {
    const user = auth?.user;
    const wasEditing = editing;
    editing = !!user;
    $('pf-account').hidden = !user;
    $('pf-guest').hidden = !!user;
    if (user) {
      // a change saved on another device: take it unless the player is in the middle of editing
      if (!wasEditing || !dirty()) {
        kit = savedKit();
        syncMarkMemory();
      }
      $('name-now').textContent = T('name.now', { name: user.name });
      drawEditor();
    } else {
      const c = savedKit().c1;
      $('guest-kits').replaceChildren(
        KFKit.svg({ pattern: 'stripes', c1: 'red', c2: 'white', mark: '7' }),
        KFKit.svg({ ...savedKit(), c2: c, mark: '1' }),
        KFKit.svg({ pattern: 'hoops', c1: 'navy', c2: 'sky', mark: '⚽' }),
      );
    }
    drawCard();
  }
  KF.on('auth', render);
  KF.on('change', () => {
    drawCard();
    if (editing) drawPatterns();
  });
  render();
})();
