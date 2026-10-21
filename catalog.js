'use strict';
const plural = (n, one, few, many) =>
  n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && !(n % 100 >= 12 && n % 100 <= 14) ? few : many;
const es2 = (n, one, many) => (n === 1 ? one : many);
// Catalog texts. Ukrainian = the main site as it always was; Spanish (Spain, «tú») for the Spanish site.
const T = KF.i18n({
  uk: {
    title: 'Keeper Fun Games — грай і збирай картки',
    brand: 'Keeper Fun Games, головна',
    coins: 'Монети',
    nCoins: ({ n }) => `${n} ${plural(n, 'монета', 'монети', 'монет')}`,
    nCards: ({ n }) => `${n} ${plural(n, 'картка', 'картки', 'карток')}`,
    close: 'Закрити',
    no: 'Ні',
    back: '← Назад',
    'hero.eyebrow': '⚡ Виходь на поле',
    'hero.eyebrowName': '⚡ {name}, виходь на поле',
    'hero.title1': 'Грай. Забивай.',
    'hero.title2': 'Збирай команду.',
    'hero.text': 'Короткі ігри, голи й картки футболістів. Обирай гру та починай матч!',
    'hero.tag1': '+1 🪙 за гол',
    'hero.tag2': '🏆 Твоя команда',
    tabs: 'Розділи',
    'tab.games': '⚽ Ігри',
    'tab.album': '📒 Альбом',
    'tab.awards': '🏅 Досягнення',
    'games.title': 'Обери матч',
    'games.text': 'Одна гра — кілька хвилин.',
    'game.beta': 'Бета',
    'game.record': ({ best, max, plays }) => `Рекорд ${best}/${max} · ${plays} ${plural(plays, 'матч', 'матчі', 'матчів')}`,
    'game.first': 'Твій перший матч чекає',
    'game.wip': 'Ще готуємо',
    'game.play': 'Грати →',
    'game.soon': '🔒 Скоро',
    'album.title': 'Альбом карток',
    'album.text': 'Відкривай пакунки й збирай футболістів.',
    'album.of': 'з {n}',
    'album.total': 'Зібрано {got} з {all} карток',
    'pack.title': 'Пакунок карток',
    'pack.text': 'У ньому 3 картки. Може випасти легенда!',
    'pack.open': 'Відкрити',
    'pack.need': ({ n }) => `Ще ${T('nCoins', { n })} — і пакунок твій! Монети дають за правильні відповіді в іграх.`,
    filter: 'Які картки показати',
    own: 'Мої чи ні',
    'own.all': 'Усі картки',
    'own.mine': 'Мої',
    'own.missing': 'Бракує',
    'chip.all': 'Усі',
    'chip.ua': 'Україна',
    'chip.futsal': 'Футзал',
    'group.common': 'Звичайні',
    'group.futsal': 'Футзал',
    'group.rare': 'Рідкісні',
    'group.legend': 'Легенди',
    'sell.all': '🔁 Обміняти повторки ({n}) · +{coins} 🪙',
    'tile.new': 'НОВА',
    'tile.secret': 'Таємна легенда: ще не знайдена',
    'tile.missing': '{name}: ще не знайдена',
    'tile.have': ({ name, cat, n }) => `${name}, ${cat}${n > 1 ? `, у тебе ${n}` : ''}`,
    'empty.mine': 'Тут поки порожньо. Відкрий пакунок — і тут зʼявляться твої картки!',
    'empty.done': 'Ти зібрав тут усі картки! 🏆',
    'sell.title': 'Обміняти всі повторки?',
    'sell.text': 'Повторок: {n}. За них ти отримаєш +{coins} 🪙. По одній картці кожного футболіста залишиться в альбомі.',
    'sell.yes': 'Так, +{coins} 🪙',
    'detail.dups': ({ n }) =>
      `У тебе ${T('nCards', { n })}: одна в альбомі і ${n - 1} ${plural(n - 1, 'повторка', 'повторки', 'повторок')}.`,
    'detail.one': 'Ця картка вже у твоєму альбомі.',
    'detail.sell': 'Обміняти повторку · +{coins} 🪙',
    'detail.note': 'Одна картка завжди залишається в альбомі.',
    'card.pos': 'Картка {i} / {n}',
    'card.prev': 'Попередня картка',
    'card.next': 'Наступна картка',
    'pack.word': 'КАРТКИ',
    'pack.new': 'Новий пакунок',
    'pack.skip': 'Показати всі',
    'pack.done': 'До альбому',
    'pack.mine': 'Твій пакунок',
    'tease.futsal': '🥅 Футзал!',
    'tease.rare': '💎 Ого, щось рідкісне!',
    'tease.legend': '🌟 Невже… ЛЕГЕНДА?!',
    'hit.open': 'Відкрити пакунок',
    'hit.flip': 'Перевернути картку',
    'hit.all': 'Показати всі картки',
    'tip.open': 'Торкнись пакунка або натисни <kbd>Enter</kbd>',
    'tip.flip': 'Торкнись, щоб перевернути',
    'tip.all': 'Торкнись, щоб побачити всі три',
    'tip.next': 'Торкнись — наступна картка',
    'tag.new': 'НОВА!',
    'tag.dup': 'Повторка ×{n} · +{coins} 🪙',
    'sum.new': 'нова',
    'sum.dup': 'повторка',
    'sum.allNew': 'Усі картки нові! 🎉',
    'sum.someNew': 'Нових карток: {n} 🎉',
    'sum.noNew': 'Цього разу — повторки',
    'sum.dupText': 'Повторки можна обміняти на монети в альбомі.',
    'sum.newText': 'Вони вже у твоєму альбомі.',
    'pack.again': 'Ще пакунок · {price} 🪙',
    'pack.againNeed': ({ n }) => `Для нового пакунка треба ще ${T('nCoins', { n })}.`,
    'awards.title': 'Досягнення',
    'awards.text': 'Кожен матч наближає до нової нагороди.',
    'awards.got': 'Отримано ✓',
    parents: '⚙️ Для батьків',
    'test.title': 'Тест-режим',
    'test.text': 'Можна грати без зарахування прогресу. Дитячий прогрес не зміниться.',
    'test.on': '🧪 Увімкнути тест-режим',
    'test.onText':
      'Зараз увімкнено: статистика, код і скидання нижче стосуються тільки тестового прогресу. Вхід у профіль і синхронізація в тест-режимі вимкнені.',
    'test.off': 'Вимкнути тест-режим',
    'test.pinHint': '🧪 Тест: PIN демо-гравця — 1234',
    'sync.local': 'Прогрес зберігається лише в цьому браузері. Щоб перенести його на інший пристрій, скопіюйте код.',
    'sync.user': 'Профіль «{name}»: прогрес зберігається на сервері й сам переходить на інші пристрої. Код нижче — запасний варіант.',
    'sync.guest':
      'Прогрес гостя зберігається лише в цьому браузері. Щоб він був на всіх пристроях, увійдіть у профіль («Увійти» вгорі) або перенесіть кодом.',
    'stat.games': 'Матчі',
    'stat.correct': 'Правильні відповіді',
    'stat.packs': 'Пакунки',
    'stat.cards': 'Картки',
    'code.box': '🔑 Код прогресу',
    'code.show': 'Показати',
    'code.hide': 'Сховати',
    'code.save': 'Зберегти прогрес',
    'code.saveLabel': 'Код для збереження прогресу',
    'code.copy': 'Скопіювати код',
    'code.copied': 'Код скопійовано!',
    'code.copyByHand': 'Виділений код можна скопіювати вручну.',
    'code.restore': 'Відновити прогрес',
    'code.restoreText': 'Вставте код з іншого пристрою. Це замінить поточний прогрес.',
    'code.restoreLabel': 'Код для відновлення прогресу',
    'code.paste': 'Вставте код сюди',
    'code.restoreBtn': 'Відновити',
    'code.confirm': 'Замінити поточний прогрес збереженим кодом?',
    'code.restored': 'Прогрес відновлено!',
    'code.bad': 'Код не підходить. Перевірте його й спробуйте ще раз.',
    reset: 'Скинути весь прогрес',
    'reset.confirm': 'Скинути ВЕСЬ прогрес? Це не можна скасувати.',
    'reset.done': 'Прогрес скинуто.',
    'who.login': 'Увійти',
    'who.now': 'Зараз грає',
    'who.logout': '👋 Вийти',
    'who.profile': '👕 Мій профіль',
    'who.saving': 'Зберігаю…',
    'unsaved.title': 'Ще не все збережено',
    'unsaved.text':
      'Частина прогресу ще не долетіла до сервера. Якщо вийти зараз, її можна загубити. Краще зачекати, поки зʼявиться інтернет.',
    'unsaved.stay': 'Залишитись',
    'unsaved.leave': 'Вийти все одно',
    'logout.fail': 'Поки не вийшло вийти. Спробуй, коли зʼявиться інтернет.',
    'logout.done': 'Тепер граємо як гість 👋',
    'login.eyebrow': '⚽ Роздягальня',
    'pick.title': 'Хто грає?',
    'pick.text': 'Натисни на своє імʼя.',
    'pick.retry': 'Спробувати ще',
    'pick.guest': 'Грати як гість',
    'pick.offline': '📶 Немає інтернету, тому список гравців не завантажився. Можна грати як гість!',
    'pick.fail': '📶 Не вдалося завантажити гравців. Спробуй ще раз або грай як гість.',
    'pick.empty': 'Тут ще нікого немає.',
    'pick.emptyAdd': 'Тут ще нікого немає. Створи свого гравця!',
    'pick.add': 'Новий гравець',
    'pin.hi': 'Привіт!',
    'pin.hiName': 'Привіт, {name}!',
    'pin.text': 'Введи свій PIN: 4 цифри.',
    'pin.other': '← Інший гравець',
    'pin.again': 'Введи PIN ще раз, щоб прогрес зберігався.',
    'pin.dots0': 'PIN: введено 0 з 4',
    'pin.dots': 'PIN: введено {n} з 4',
    'pin.erase': 'Стерти',
    'pin.checking': 'Перевіряю…',
    'pin.bad': 'Не той PIN, спробуй ще 🙂',
    'pin.left': ' Залишилось спроб: {n}.',
    'pin.noUser': 'Цього гравця вже немає. Обери ще раз.',
    'pin.offline': '📶 Немає інтернету. Перевір Wi‑Fi і спробуй ще раз.',
    'pin.fail': '📶 Не вдалося зʼєднатися. Спробуй ще раз трохи згодом.',
    'pin.unlocked': 'Можна пробувати знову 🙂',
    'pin.locked': 'Багато спроб підряд. Зачекай {min} хв і спробуй ще ⏳',
    'new.title': 'Як тебе звати?',
    'new.placeholder': 'Твоє імʼя',
    'new.avatar': 'Обери картинку на футболку',
    'new.color': 'Колір футболки',
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
    'new.next': 'Далі →',
    'new.step': 'Крок {n} з 3',
    'new.empty': 'Напиши своє імʼя 🙂',
    'new.taken': 'Таке імʼя вже є. Додай першу літеру прізвища або обери інше.',
    'new.badName': 'Тільки літери, пробіл, дефіс або апостроф',
    'new.create': 'Придумай PIN',
    'new.createText': '4 цифри. Запиши або запамʼятай PIN — його попросять на іншому пристрої.',
    'new.repeat': 'Повтори PIN',
    'new.repeatText': 'Набери ті самі 4 цифри ще раз.',
    'new.mismatch': 'PIN не збігся, придумай ще раз 🙂',
    'new.busy': 'Створюю гравця…',
    'new.tooMany': 'Сьогодні вже створили кілька гравців. Спробуй завтра або попроси батьків.',
    'new.full': 'Місць для нових гравців немає. Попроси батьків.',
    'new.testMode': 'У тест-режимі нових гравців не створюють.',
    'new.offline': '📶 Немає інтернету. Перевір Wi‑Fi і набери PIN ще раз.',
    'new.fail': '📶 Не вдалося зʼєднатися. Набери PIN ще раз трохи згодом.',
    'new.done': 'Гравця створено! ⚽',
    'new.welcome': 'Вітаємо в команді, {name}! 🎉',
    'login.done': 'Готово! ⚽',
    'login.hello': 'Привіт, {name}! ⚽',
    'merge.title': 'Знайшли прогрес гостя',
    'merge.text': ({ parts, name }) => `На цьому пристрої є прогрес гостя${parts ? ` (${parts})` : ''}. Додати його в профіль ${name}?`,
    'merge.yes': 'Так, додати',
    'merge.done': 'Готово! Прогрес гостя тепер у профілі {name} 🎉',
    'merge.fail': 'Не вийшло додати. Спробуй ще раз пізніше.',
  },
  es: {
    title: 'Keeper Fun Games — juega y colecciona cartas',
    brand: 'Keeper Fun Games, inicio',
    coins: 'Monedas',
    nCoins: ({ n }) => `${n} ${es2(n, 'moneda', 'monedas')}`,
    nCards: ({ n }) => `${n} ${es2(n, 'carta', 'cartas')}`,
    close: 'Cerrar',
    no: 'No',
    back: '← Atrás',
    'hero.eyebrow': '⚡ ¡Sal al campo!',
    'hero.eyebrowName': '⚡ ¡{name}, sal al campo!',
    'hero.title1': 'Juega. Marca.',
    'hero.title2': 'Forma tu equipo.',
    'hero.text': 'Juegos cortos, goles y cartas de futbolistas. ¡Elige un juego y empieza el partido!',
    'hero.tag1': '+1 🪙 por gol',
    'hero.tag2': '🏆 Tu equipo',
    tabs: 'Secciones',
    'tab.games': '⚽ Juegos',
    'tab.album': '📒 Álbum',
    'tab.awards': '🏅 Logros',
    'games.title': 'Elige tu partido',
    'games.text': 'Cada juego dura unos minutos.',
    'game.beta': 'Beta',
    'game.record': ({ best, max, plays }) => `Récord ${best}/${max} · ${plays} ${es2(plays, 'partido', 'partidos')}`,
    'game.first': 'Tu primer partido te espera',
    'game.wip': 'Lo estamos preparando',
    'game.play': 'Jugar →',
    'game.soon': '🔒 Pronto',
    'album.title': 'Álbum de cartas',
    'album.text': 'Abre sobres y colecciona futbolistas.',
    'album.of': 'de {n}',
    'album.total': 'Tienes {got} de {all} cartas',
    'pack.title': 'Sobre de cartas',
    'pack.text': 'Trae 3 cartas. ¡Te puede salir una leyenda!',
    'pack.open': 'Abrir',
    'pack.need': ({ n }) =>
      `${es2(n, 'Te falta', 'Te faltan')} ${T('nCoins', { n })} para el sobre. Ganas monedas acertando en los juegos.`,
    filter: 'Qué cartas ver',
    own: 'Mías o no',
    'own.all': 'Todas',
    'own.mine': 'Mías',
    'own.missing': 'Me faltan',
    'chip.all': 'Todas',
    'chip.ua': 'Ucrania',
    'chip.futsal': 'Futsal',
    'group.common': 'Comunes',
    'group.futsal': 'Fútbol sala',
    'group.rare': 'Raras',
    'group.legend': 'Leyendas',
    'sell.all': '🔁 Cambiar repetidas ({n}) · +{coins} 🪙',
    'tile.new': 'NUEVA',
    'tile.secret': 'Leyenda secreta: aún no la tienes',
    'tile.missing': '{name}: aún no la tienes',
    'tile.have': ({ name, cat, n }) => `${name}, ${cat}${n > 1 ? `, tienes ${n}` : ''}`,
    'empty.mine': 'Aquí aún no hay nada. ¡Abre un sobre y aquí saldrán tus cartas!',
    'empty.done': '¡Ya tienes todas las cartas de aquí! 🏆',
    'sell.title': '¿Cambiar todas las repetidas?',
    'sell.text': 'Repetidas: {n}. Te dan +{coins} 🪙. Una carta de cada futbolista se queda en el álbum.',
    'sell.yes': 'Sí, +{coins} 🪙',
    'detail.dups': ({ n }) => `Tienes ${T('nCards', { n })}: una en el álbum y ${n - 1} ${es2(n - 1, 'repetida', 'repetidas')}.`,
    'detail.one': 'Esta carta ya está en tu álbum.',
    'detail.sell': 'Cambiar repetida · +{coins} 🪙',
    'detail.note': 'Una carta siempre se queda en el álbum.',
    'card.pos': 'Carta {i} / {n}',
    'card.prev': 'Carta anterior',
    'card.next': 'Carta siguiente',
    'pack.word': 'CARTAS',
    'pack.new': 'Sobre nuevo',
    'pack.skip': 'Ver todas',
    'pack.done': 'Al álbum',
    'pack.mine': 'Tu sobre',
    'tease.futsal': '🥅 ¡Fútbol sala!',
    'tease.rare': '💎 ¡Hala, una carta rara!',
    'tease.legend': '🌟 ¿Será… una LEYENDA?',
    'hit.open': 'Abrir el sobre',
    'hit.flip': 'Dar la vuelta a la carta',
    'hit.all': 'Ver todas las cartas',
    'tip.open': 'Toca el sobre o pulsa <kbd>Enter</kbd>',
    'tip.flip': 'Toca para darle la vuelta',
    'tip.all': 'Toca para ver las tres',
    'tip.next': 'Toca para ver la siguiente',
    'tag.new': '¡NUEVA!',
    'tag.dup': 'Repetida ×{n} · +{coins} 🪙',
    'sum.new': 'nueva',
    'sum.dup': 'repetida',
    'sum.allNew': '¡Todas son nuevas! 🎉',
    'sum.someNew': ({ n }) => `${es2(n, 'Carta nueva', 'Cartas nuevas')}: ${n} 🎉`,
    'sum.noNew': 'Esta vez, repetidas',
    'sum.dupText': 'Puedes cambiar las repetidas por monedas en el álbum.',
    'sum.newText': 'Ya están en tu álbum.',
    'pack.again': 'Otro sobre · {price} 🪙',
    'pack.againNeed': ({ n }) => `Para otro sobre ${es2(n, 'te falta', 'te faltan')} ${T('nCoins', { n })}.`,
    'awards.title': 'Logros',
    'awards.text': 'Cada partido te acerca a un premio nuevo.',
    'awards.got': 'Conseguido ✓',
    parents: '⚙️ Para las familias',
    'test.title': 'Modo de prueba',
    'test.text': 'Puedes jugar sin que cuente el progreso. El progreso real no cambia.',
    'test.on': '🧪 Activar el modo de prueba',
    'test.onText':
      'Está activado: las estadísticas, el código y el borrado de abajo solo afectan al progreso de prueba. En el modo de prueba no se puede entrar en un perfil ni sincronizar.',
    'test.off': 'Desactivar el modo de prueba',
    'test.pinHint': '🧪 Prueba: el PIN del jugador de prueba es 1234',
    'sync.local': 'El progreso se guarda solo en este navegador. Para pasarlo a otro dispositivo, copia el código.',
    'sync.user':
      'Perfil «{name}»: el progreso se guarda en el servidor y pasa solo a otros dispositivos. El código de abajo es una copia de reserva.',
    'sync.guest':
      'El progreso de invitado se guarda solo en este navegador. Para tenerlo en todos los dispositivos, entra en un perfil («Entrar», arriba) o pásalo con el código.',
    'stat.games': 'Partidos',
    'stat.correct': 'Respuestas correctas',
    'stat.packs': 'Sobres',
    'stat.cards': 'Cartas',
    'code.box': '🔑 Código de progreso',
    'code.show': 'Mostrar',
    'code.hide': 'Ocultar',
    'code.save': 'Guardar el progreso',
    'code.saveLabel': 'Código para guardar el progreso',
    'code.copy': 'Copiar el código',
    'code.copied': '¡Código copiado!',
    'code.copyByHand': 'El código está seleccionado: cópialo a mano.',
    'code.restore': 'Recuperar el progreso',
    'code.restoreText': 'Pega el código de otro dispositivo. Sustituirá el progreso de ahora.',
    'code.restoreLabel': 'Código para recuperar el progreso',
    'code.paste': 'Pega el código aquí',
    'code.restoreBtn': 'Recuperar',
    'code.confirm': '¿Cambiar el progreso de ahora por el del código?',
    'code.restored': '¡Progreso recuperado!',
    'code.bad': 'Este código no vale. Revísalo y prueba otra vez.',
    reset: 'Borrar todo el progreso',
    'reset.confirm': '¿Borrar TODO el progreso? No se puede deshacer.',
    'reset.done': 'Progreso borrado.',
    'who.login': 'Entrar',
    'who.now': 'Está jugando',
    'who.logout': '👋 Salir',
    'who.profile': '👕 Mi perfil',
    'who.saving': 'Guardando…',
    'unsaved.title': 'Aún no está todo guardado',
    'unsaved.text':
      'Una parte del progreso aún no ha llegado al servidor. Si sales ahora, se puede perder. Mejor espera a que vuelva internet.',
    'unsaved.stay': 'Me quedo',
    'unsaved.leave': 'Salir igualmente',
    'logout.fail': 'No se ha podido salir. Prueba cuando vuelva internet.',
    'logout.done': 'Ahora juegas como invitado 👋',
    'login.eyebrow': '⚽ Vestuario',
    'pick.title': '¿Quién juega?',
    'pick.text': 'Toca tu nombre.',
    'pick.retry': 'Probar otra vez',
    'pick.guest': 'Jugar como invitado',
    'pick.offline': '📶 No hay internet, así que no se ha cargado la lista de jugadores. ¡Puedes jugar como invitado!',
    'pick.fail': '📶 No se han podido cargar los jugadores. Prueba otra vez o juega como invitado.',
    'pick.empty': 'Aquí aún no hay nadie.',
    'pick.emptyAdd': 'Aquí aún no hay nadie. ¡Crea tu jugador!',
    'pick.add': 'Nuevo jugador',
    'pin.hi': '¡Hola!',
    'pin.hiName': '¡Hola, {name}!',
    'pin.text': 'Escribe tu PIN: 4 números.',
    'pin.other': '← Otro jugador',
    'pin.again': 'Escribe tu PIN otra vez para que se guarde tu progreso.',
    'pin.dots0': 'PIN: 0 de 4',
    'pin.dots': 'PIN: {n} de 4',
    'pin.erase': 'Borrar',
    'pin.checking': 'Comprobando…',
    'pin.bad': 'Ese PIN no es, prueba otra vez 🙂',
    'pin.left': ({ n }) => ` ${es2(n, 'Te queda 1 intento', `Te quedan ${n} intentos`)}.`,
    'pin.noUser': 'Este jugador ya no está. Elige otra vez.',
    'pin.offline': '📶 No hay internet. Mira el wifi y prueba otra vez.',
    'pin.fail': '📶 No se ha podido conectar. Prueba otra vez dentro de un rato.',
    'pin.unlocked': 'Ya puedes probar otra vez 🙂',
    'pin.locked': 'Muchos intentos seguidos. Espera {min} min y prueba otra vez ⏳',
    'new.title': '¿Cómo te llamas?',
    'new.placeholder': 'Tu nombre',
    'new.avatar': 'Elige un dibujo para tu camiseta',
    'new.color': 'Color de la camiseta',
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
    'new.next': 'Siguiente →',
    'new.step': 'Paso {n} de 3',
    'new.empty': 'Escribe tu nombre 🙂',
    'new.taken': 'Ese nombre ya existe. Añade la primera letra de tu apellido o elige otro.',
    'new.badName': 'Solo letras, espacios, guiones o apóstrofos',
    'new.create': 'Crea tu PIN',
    'new.createText': '4 números. Apúntalo o apréndetelo: te lo pedirán en otro dispositivo.',
    'new.repeat': 'Repite el PIN',
    'new.repeatText': 'Escribe otra vez los mismos 4 números.',
    'new.mismatch': 'Los PIN no son iguales. Crea uno nuevo 🙂',
    'new.busy': 'Creando tu jugador…',
    'new.tooMany': 'Hoy ya se han creado varios jugadores. Prueba mañana o pide ayuda en casa.',
    'new.full': 'Ya no hay sitio para más jugadores. Pide ayuda en casa.',
    'new.testMode': 'En el modo de prueba no se crean jugadores nuevos.',
    'new.offline': '📶 No hay internet. Mira el wifi y escribe el PIN otra vez.',
    'new.fail': '📶 No se ha podido conectar. Escribe el PIN otra vez dentro de un rato.',
    'new.done': '¡Jugador creado! ⚽',
    'new.welcome': '¡Ya estás en el equipo, {name}! 🎉',
    'login.done': '¡Listo! ⚽',
    'login.hello': '¡Hola, {name}! ⚽',
    'merge.title': 'Hay progreso de invitado',
    'merge.text': ({ parts, name }) =>
      `En este dispositivo hay progreso de invitado${parts ? ` (${parts})` : ''}. ¿Lo añadimos al perfil de ${name}?`,
    'merge.yes': 'Sí, añadir',
    'merge.done': '¡Listo! El progreso de invitado ya está en el perfil de {name} 🎉',
    'merge.fail': 'No se ha podido añadir. Prueba otra vez más tarde.',
  },
});
// Static markup and the pack template, before anything is drawn; CSS labels come in as custom properties.
T.apply();
T.apply(/** @type {HTMLTemplateElement} */ (document.getElementById('pack-tpl')).content);
document.title = T('title');
for (const [prop, key] of [
  ['--t-new', 'tile.new'],
  ['--t-show', 'code.show'],
  ['--t-hide', 'code.hide'],
])
  document.documentElement.style.setProperty(prop, JSON.stringify(T(key)));
// Small question dialog (sell duplicates, guest merge, logout warning). Resolves 'primary' | 'secondary' | null (Esc).
function askDialog({ icon, title, text, primary, secondary }) {
  const d = /** @type {HTMLDialogElement} */ (document.getElementById('ask-dialog'));
  for (const [id, value] of [
    ['ask-icon', icon],
    ['ask-title', title],
    ['ask-text', text],
    ['ask-yes', primary],
    ['ask-no', secondary],
  ])
    document.getElementById(id).textContent = value;
  d.returnValue = '';
  d.showModal();
  document.getElementById('ask-yes').focus();
  return new Promise((resolve) => d.addEventListener('close', () => resolve(d.returnValue || null), { once: true }));
}
(() => {
  /** Elements are looked up by id and used as HTMLInputElement / HTMLDialogElement / ... as needed. @returns {any} */
  const $ = (id) => document.getElementById(id);
  // Markup here is built only from KF constants and safeCount() numbers.
  const setMarkup = (el, html) => el.replaceChildren(document.createRange().createContextualFragment(html));
  const tabs = [.../** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[role="tab"]'))];
  function showTab(name) {
    document.body.classList.toggle('games-view', name === 'games');
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
    tab.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = tabs[(index + step + tabs.length) % tabs.length];
      showTab(next.dataset.tab);
      next.focus();
    });
  });
  const safeCount = (n) => (Number.isFinite(Number(n)) ? Math.max(0, Number(n)) : 0);
  function renderGames() {
    const state = KF.get();
    const siteGames = KF.siteGames ? KF.siteGames() : KF.GAMES.filter((g) => KF.isListed(g));
    setMarkup(
      $('games-list'),
      Object.entries(KF.CATEGORIES)
        .map(([key, category]) => {
          const games = siteGames.filter((g) => g.category === key);
          if (!games.length) return '';
          return `<div class="category"><h3>${category.emoji} ${category.title}</h3><div class="game-grid">${games
            .map((g) => {
              const record = state.games?.[g.slug];
              const ready = KF.isPlayable(g);
              const beta = g.status === 'beta' ? `<span class="beta-tag">${T('game.beta')}</span>` : '';
              return `<${ready ? 'a href="games/' + g.slug + '/"' : 'div'} class="game-card ${ready ? 'ready' : 'soon'}"><span class="game-icon" aria-hidden="true">${g.emoji}</span><strong>${g.title}${beta}</strong><p>${g.desc}</p><span class="game-bottom"><span>${record ? T('game.record', { best: safeCount(record.best), max: safeCount(record.max), plays: safeCount(record.plays) }) : T(ready ? 'game.first' : 'game.wip')}</span><span class="${ready ? 'game-go' : 'soon-label'}">${T(ready ? 'game.play' : 'game.soon')}</span></span></${ready ? 'a' : 'div'}>`;
            })
            .join('')}</div></div>`;
        })
        .join(''),
    );
  }
  function renderAwards() {
    const earned = KF.get().achievements || {};
    $('award-progress').textContent = `${KF.ACHIEVEMENTS.filter((a) => earned[a.id]).length} / ${KF.ACHIEVEMENTS.length}`;
    setMarkup(
      $('achievement-grid'),
      KF.ACHIEVEMENTS.map(
        (a) =>
          `<div class="badge card ${earned[a.id] ? '' : 'locked'}"><span class="badge-icon" aria-hidden="true">${earned[a.id] ? a.icon : '🔒'}</span><span><strong>${a.title}</strong><p>${a.desc}</p>${earned[a.id] ? `<small>${T('awards.got')}</small>` : ''}</span></div>`,
      ).join(''),
    );
  }
  function renderParents() {
    const s = KF.get().stats;
    setMarkup(
      $('stats'),
      `<div class="stat">${T('stat.games')}: <b>${safeCount(s.games)}</b></div><div class="stat">${T('stat.correct')}: <b>${safeCount(s.correct)}</b></div><div class="stat">${T('stat.packs')}: <b>${safeCount(s.packs)}</b></div><div class="stat">${T('stat.cards')}: <b>${KF.CARDS.filter((c) => KF.get().cards?.[c.id] > 0).length} / ${KF.CARDS.length}</b></div>`,
    );
    $('export-code').value = KF.exportCode();
  }
  if (KF.TEST_MODE) {
    $('test-mode-text').className = 'test-note';
    $('test-mode-text').textContent = T('test.onText');
    $('test-mode-link').href = './?parent=off';
    $('test-mode-link').textContent = T('test.off');
  }
  function render() {
    renderGames();
    renderAwards();
    renderParents();
  }
  $('copy-code').addEventListener('click', async () => {
    $('export-code').select();
    try {
      await navigator.clipboard.writeText($('export-code').value);
      KFUI.toast(T('code.copied'));
    } catch {
      KFUI.toast(T('code.copyByHand'));
    }
  });
  $('import-btn').addEventListener('click', () => {
    if (!confirm(T('code.confirm'))) return;
    const ok = KF.importCode($('import-code').value);
    $('import-status').textContent = T(ok ? 'code.restored' : 'code.bad');
    if (ok) $('import-code').value = '';
  });
  $('reset-btn').addEventListener('click', () => {
    if (confirm(T('reset.confirm'))) {
      KF.reset();
      $('import-status').textContent = T('reset.done');
    }
  });
  KF.on('change', render);
  render();
})();

// Card album, pack opening and the big card view. The album grid is built once; KF changes only
// update tiles in place, so hundreds of images are not re-created on every coin change.
(() => {
  /** Elements are looked up by id and used as HTMLInputElement / HTMLDialogElement / ... as needed. @returns {any} */
  const $ = (id) => document.getElementById(id);
  const h = (tag, props = {}, ...kids) => {
    const el = Object.assign(document.createElement(tag), props);
    el.append(...kids);
    return el;
  };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 60) : ms));
  const CATS = KF.CARD_CATS;
  const GROUP = { common: T('group.common'), futsal: T('group.futsal'), rare: T('group.rare'), legend: T('group.legend') };
  const BY_ID = new Map(KF.CARDS.map((c) => [c.id, c]));
  const have = (id) => Math.max(0, Math.floor(Number(KF.get().cards?.[id]) || 0));
  const catClass = (cat) => `kf-cat-${CATS[cat] ? cat : 'common'}`;
  const catLabel = (cat) => (CATS[cat] || CATS.common).label;
  const sellOf = (cat) => (CATS[cat] || CATS.common).sell;
  const pct = (a, b) => `${b ? Math.round((a / b) * 100) : 0}%`;
  const packArt = () => $('pack-tpl').content.firstElementChild.cloneNode(true);
  document.querySelectorAll('[data-pack-art]').forEach((el) => el.replaceWith(packArt()));

  // Card picture with a styled fallback (offline / missing image). full = big image, thumb shown underneath while it loads.
  function face(card, { full = false, lazy = false, missing = false } = {}) {
    const el = h('span', { className: `kf-cardface ${catClass(card.cat)}${missing ? ' is-missing' : ''}` });
    const secret = missing && card.cat === 'legend';
    const alt = h(
      'span',
      { className: 'kf-cardface-alt' },
      h('span', { className: 'kf-cardface-who', textContent: missing ? '?' : '⚽' }),
      h(
        'span',
        { className: 'kf-cardface-plate' },
        h('span', { className: 'kf-cardface-name', textContent: secret ? '???' : card.name }),
        h('span', { className: 'kf-cardface-cat', textContent: catLabel(card.cat) }),
      ),
    );
    alt.setAttribute('aria-hidden', 'true');
    if (!missing) {
      const img = h('img', { alt: '', decoding: 'async', width: 256, height: 512, draggable: false });
      if (lazy) img.loading = 'lazy';
      if (full) el.style.setProperty('--thumb', `url("${KF.cardImg(card.id, true)}")`);
      img.addEventListener('error', () => {
        if (full && !img.dataset.thumb) {
          img.dataset.thumb = '1';
          img.src = KF.cardImg(card.id, true);
          return;
        }
        el.classList.add('is-broken');
        el.style.removeProperty('--thumb');
      });
      img.src = KF.cardImg(card.id, !full);
      el.append(img);
    }
    el.append(alt);
    return el;
  }

  // ---- Album ----
  const tiles = new Map(); // id -> { card, el, owned, n }
  const secs = {};
  const chips = {};
  let catFilter = 'all',
    ownFilter = 'all',
    built = false;
  const meter = () => {
    const i = h('i');
    return [h('span', { className: 'meter' }, i), i];
  };

  for (const cat of Object.keys(CATS)) {
    const list = KF.CARDS.filter((c) => c.cat === cat);
    if (!list.length) continue;
    const count = h('small'),
      [bar, fill] = meter();
    bar.setAttribute('aria-hidden', 'true');
    const grid = h('div', { className: 'card-grid' });
    for (const card of list) {
      const el = h('div');
      grid.append(el);
      tiles.set(card.id, { card, el, owned: null, n: 0 });
    }
    const sec = h(
      'section',
      { className: `album-sec ${catClass(cat)}` },
      h('div', { className: 'sec-head' }, h('h3', { textContent: GROUP[cat] }), count, bar),
      grid,
    );
    secs[cat] = { list, sec, count, fill };
    $('album').append(sec);
  }
  // Ukrainian players (ua: true) are a cross-category chip: their tiles stay in the common / futsal sections.
  const UA = KF.CARDS.filter((c) => c.ua);
  for (const key of ['all', ...Object.keys(secs), ...(UA.length ? ['ua'] : [])]) {
    const n = h('small'),
      [bar, fill] = meter();
    const cls = key === 'all' ? '' : key === 'ua' ? ' cat-ua' : ` ${catClass(key)}`;
    const b = h(
      'button',
      { type: 'button', className: `cat-chip${cls}` },
      h('b', { textContent: T.has(`chip.${key}`) ? T(`chip.${key}`) : GROUP[key] }),
      n,
      bar,
    );
    b.dataset.cat = key;
    b.addEventListener('click', () => {
      catFilter = key;
      applyFilter();
    });
    chips[key] = { b, n, fill };
    $('cat-filter').append(b);
  }
  $('cat-filter').addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const list = Object.values(chips).map((c) => c.b),
      i = list.indexOf(e.target);
    if (!step || i < 0) return;
    e.preventDefault();
    const next = list[(i + step + list.length) % list.length];
    next.focus();
    next.click();
  });
  $('own-filter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-own]');
    if (b) {
      ownFilter = b.dataset.own;
      applyFilter();
    }
  });

  function updateTile(t) {
    const n = have(t.card.id),
      owned = n > 0;
    if (owned !== t.owned) {
      let el;
      if (owned) {
        el = h('button', { type: 'button', className: 'tile', tabIndex: -1 }, face(t.card, { lazy: true }));
        el.dataset.id = t.card.id;
        if (built) el.classList.add('fresh');
      } else {
        el = h('div', { className: 'tile' }, face(t.card, { missing: true }));
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', t.card.cat === 'legend' ? T('tile.secret') : T('tile.missing', { name: t.card.name }));
      }
      el.hidden = t.el.hidden;
      t.el.replaceWith(el);
      Object.assign(t, { el, owned, n: 0 });
    }
    if (owned && n !== t.n) {
      t.n = n;
      t.el.querySelector('.dup')?.remove();
      if (n > 1) t.el.append(h('span', { className: 'dup', textContent: `×${n}` }));
      t.el.setAttribute('aria-label', T('tile.have', { name: t.card.name, cat: catLabel(t.card.cat).toLowerCase(), n }));
    }
  }

  // Sum of coins for every extra copy.
  const dupValue = () => KF.CARDS.reduce((sum, c) => sum + Math.max(0, have(c.id) - 1) * sellOf(c.cat), 0);

  function renderAlbum() {
    let changed = !built;
    for (const t of tiles.values()) {
      const was = t.owned;
      updateTile(t);
      if (was !== t.owned) changed = true;
    }
    built = true;
    let total = 0;
    for (const [cat, s] of Object.entries(secs)) {
      const got = s.list.filter((c) => tiles.get(c.id).owned).length;
      total += got;
      chips[cat].fill.style.width = pct(got, s.list.length);
      chips[cat].n.textContent = `${got}/${s.list.length}`;
    }
    updateHeads();
    if (chips.ua) {
      const got = UA.filter((c) => tiles.get(c.id)?.owned).length;
      chips.ua.n.textContent = `${got}/${UA.length}`;
      chips.ua.fill.style.width = pct(got, UA.length);
    }
    const all = KF.CARDS.length;
    chips.all.n.textContent = `${total}/${all}`;
    chips.all.fill.style.width = $('album-bar').style.width = pct(total, all);
    $('album-count').textContent = total;
    $('album-of').textContent = T('album.of', { n: all });
    $('album-total').setAttribute('aria-label', T('album.total', { got: total, all }));
    const coins = KF.get().coins,
      need = KF.PACK_PRICE - coins;
    $('open-pack').disabled = !KF.canBuyPack();
    $('pack-hint').hidden = KF.canBuyPack();
    $('pack-hint').textContent = T('pack.need', { n: need });
    const d = KF.duplicates();
    $('sell-all').hidden = !d;
    $('sell-all').textContent = T('sell.all', { n: d, coins: dupValue() });
    if (changed) applyFilter();
  }

  // Section headers count the whole category, or only its Ukrainian players while «Україна» is on.
  function updateHeads() {
    for (const s of Object.values(secs)) {
      const list = catFilter === 'ua' ? s.list.filter((c) => c.ua) : s.list;
      const got = list.filter((c) => tiles.get(c.id).owned).length;
      s.count.textContent = `${got} / ${list.length}`;
      s.fill.style.width = pct(got, list.length);
    }
  }

  const shownOwned = () => [...$('album').querySelectorAll('button.tile:not([hidden])')];
  function rove(target) {
    for (const b of $('album').querySelectorAll('button.tile')) b.tabIndex = b === target ? 0 : -1;
  }

  function applyFilter() {
    let shown = 0;
    for (const [cat, s] of Object.entries(secs)) {
      let any = 0;
      for (const c of s.list) {
        const t = tiles.get(c.id);
        const ok =
          (catFilter === 'all' || catFilter === cat || (catFilter === 'ua' && c.ua)) &&
          (ownFilter === 'all' || (ownFilter === 'mine') === t.owned);
        t.el.hidden = !ok;
        if (ok) any++;
      }
      s.sec.hidden = !any;
      shown += any;
    }
    for (const [key, c] of Object.entries(chips)) c.b.setAttribute('aria-pressed', key === catFilter);
    updateHeads();
    for (const b of $('own-filter').querySelectorAll('[data-own]')) b.setAttribute('aria-pressed', b.dataset.own === ownFilter);
    $('album-empty').hidden = !!shown;
    $('album-empty').textContent = T(ownFilter === 'mine' ? 'empty.mine' : 'empty.done');
    const list = shownOwned();
    rove(list.find((b) => b.tabIndex === 0) || list[0]);
  }

  // Keyboard: Tab enters the grid once, arrows move between your cards, Enter opens one.
  $('album').addEventListener('keydown', (e) => {
    const cur = e.target.closest?.('button.tile');
    if (!cur) return;
    const list = shownOwned();
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') next = list[list.indexOf(cur) + (e.key === 'ArrowRight' ? 1 : -1)];
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const r = cur.getBoundingClientRect(),
        down = e.key === 'ArrowDown';
      let best = Infinity;
      for (const b of list) {
        const q = b.getBoundingClientRect(),
          dy = down ? q.top - r.top : r.top - q.top;
        if (dy < 8) continue;
        const score = dy * 10 + Math.abs(q.left - r.left); // nearest row first, then nearest column
        if (score < best) {
          best = score;
          next = b;
        }
      }
    } else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list.at(-1);
    else return;
    e.preventDefault();
    if (next) {
      rove(next);
      next.focus();
    }
  });
  $('album').addEventListener('focusin', (e) => {
    const b = e.target.closest('button.tile');
    if (b && b.tabIndex !== 0) rove(b);
  });
  $('album').addEventListener('click', (e) => {
    const b = e.target.closest('button.tile');
    if (!b) return;
    b.classList.remove('fresh');
    rove(b);
    openDetail(b.dataset.id);
  });

  $('sell-all').addEventListener('click', async () => {
    const d = KF.duplicates(),
      value = dupValue();
    if (!d) return;
    const choice = await askDialog({
      icon: '🔁',
      title: T('sell.title'),
      text: T('sell.text', { n: d, coins: value }),
      primary: T('sell.yes', { coins: value }),
      secondary: T('no'),
    });
    if (choice === 'primary' && KF.sellAllDuplicates()) {
      (shownOwned()[0] || $('open-pack')).focus();
      return;
    }
    $('sell-all').focus();
  });

  // ---- Big card view ----
  const dd = $('card-dialog');
  let viewId = null;
  function drawDetail(dir) {
    const card = BY_ID.get(viewId);
    if (!card) return;
    const n = have(card.id),
      list = shownOwned().map((b) => b.dataset.id),
      at = list.indexOf(card.id);
    if (dir !== undefined) {
      dd.className = `stage detail-stage ${catClass(card.cat)}`;
      dd.dataset.glow = card.cat;
      const f = face(card, { full: true });
      if (dir) f.classList.add(dir > 0 ? 'from-right' : 'from-left');
      $('detail-card').replaceChildren(f);
      $('detail-card').setAttribute('aria-label', card.name);
      $('detail-name').textContent = card.name;
      $('detail-cat').className = `cat-tag ${catClass(card.cat)}`;
      $('detail-cat').textContent = catLabel(card.cat);
    }
    $('detail-count').textContent = n > 1 ? T('detail.dups', { n }) : T('detail.one');
    $('detail-sell').hidden = $('detail-note').hidden = n < 2;
    $('detail-sell').textContent = T('detail.sell', { coins: sellOf(card.cat) });
    $('detail-pos').textContent = at >= 0 ? T('card.pos', { i: at + 1, n: list.length }) : '';
    $('detail-prev').disabled = $('detail-next').disabled = list.length < 2;
    // the focused sell button may have just been hidden: keep focus (and the arrow keys) inside the dialog
    if (dd.open && !dd.contains(document.activeElement)) $('detail-card').focus();
  }
  function openDetail(id) {
    viewId = id;
    drawDetail(0);
    if (!dd.open) dd.showModal();
    $('detail-card').focus();
  }
  function step(d) {
    const list = shownOwned().map((b) => b.dataset.id);
    if (list.length < 2) return;
    viewId = list[(list.indexOf(viewId) + d + list.length) % list.length];
    drawDetail(d);
  }
  $('detail-prev').addEventListener('click', () => step(-1));
  $('detail-next').addEventListener('click', () => step(1));
  $('detail-close').addEventListener('click', () => dd.close());
  $('detail-sell').addEventListener('click', () => {
    if (KF.sellDuplicate(viewId)) drawDetail();
  });
  dd.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  dd.addEventListener('close', () => {
    if (dd.open) return;
    const t = tiles.get(viewId);
    if (t?.owned && !t.el.hidden) {
      rove(t.el);
      t.el.focus();
      t.el.scrollIntoView({ block: 'nearest' });
    }
  });

  // ---- Pack opening ----
  // pack -> (special cards wait face down and glow) -> flip -> next ... -> summary
  const pd = $('pack-dialog');
  const TEASE = { futsal: T('tease.futsal'), rare: T('tease.rare'), legend: T('tease.legend') };
  const CHARGE = { futsal: 350, rare: 700, legend: 1400 }; // build-up before the flip, ms
  const special = (card) => card.cat !== 'common';
  let P = null;
  const live = (p) => P === p && p.phase !== 'summary' && pd.open;

  function setGlow(cat) {
    pd.dataset.glow = cat || '';
    pd.className = `stage${cat ? ` ${catClass(cat)}` : ''}`;
  }
  function tip(html) {
    $('pack-tip').replaceChildren(document.createRange().createContextualFragment(html));
  }
  function hit(label) {
    $('pack-hit').setAttribute('aria-label', label);
  }

  function buyPack() {
    if (P?.busy) return;
    const got = KF.openPack();
    if (!got) return;
    // count shown on each card = final count minus copies that come later in this same pack
    const counts = got.map((c, i) => have(c.id) - got.slice(i + 1).filter((x) => x.id === c.id).length);
    got.forEach((c) => {
      new Image().src = KF.cardImg(c.id);
    });
    P = { got, counts, i: -1, phase: 'pack', busy: false };
    setGlow(null);
    $('pack-summary').hidden = true;
    $('pack-play').hidden = false;
    $('pack-skip').hidden = false;
    $('pack-step').textContent = T('pack.new');
    $('pack-tease').textContent = '';
    $('pack-info').classList.remove('show');
    $('pack-info').replaceChildren();
    $('pack-tray').replaceChildren(...got.map(() => h('i')));
    $('pack-hit').replaceChildren(packArt());
    hit(T('hit.open'));
    tip(T('tip.open'));
    if (!pd.open) pd.showModal();
    $('pack-hit').focus();
  }

  async function advance() {
    const p = P;
    if (!p || p.busy) return;
    if (p.phase === 'pack') {
      p.busy = true;
      $('pack-hit').querySelector('.pack').classList.add('tearing');
      await wait(620);
      if (!live(p)) return;
      p.busy = false;
      return show(0);
    }
    if (p.phase === 'back') return flip();
    if (p.phase === 'front') return p.i < p.got.length - 1 ? show(p.i + 1) : summary();
  }

  async function show(i) {
    const p = P,
      card = p.got[i];
    p.i = i;
    p.busy = true;
    const el = h(
      'div',
      { className: `flip ${catClass(card.cat)}${special(card) ? ' special' : ''}` },
      h(
        'div',
        { className: 'flip-inner' },
        h(
          'div',
          { className: 'face face-back' },
          h(
            'span',
            { className: 'card-back' },
            h('span', { className: 'card-back-ball', textContent: '⚽' }),
            h('span', { className: 'card-back-word', textContent: 'KEEPER FUN' }),
          ),
        ),
        h('div', { className: 'face face-front' }, face(card, { full: true })),
      ),
    );
    pd.classList.remove('revealed');
    setGlow(special(card) ? card.cat : null);
    $('pack-hit').replaceChildren(el);
    $('pack-step').textContent = T('card.pos', { i: i + 1, n: p.got.length });
    $('pack-tease').textContent = TEASE[card.cat] || '';
    $('pack-info').classList.remove('show');
    [...$('pack-tray').children].forEach((slot, k) => slot.classList.toggle('now', k === i));
    p.phase = 'back';
    if (special(card)) {
      el.classList.add('waiting');
      hit(T('hit.flip'));
      tip(T('tip.flip'));
      await wait(300);
      if (live(p)) p.busy = false;
      return;
    }
    await wait(260);
    if (!live(p)) return;
    p.busy = false;
    return flip();
  }

  async function flip() {
    const p = P,
      card = p.got[p.i],
      el = $('pack-hit').querySelector('.flip');
    p.busy = true;
    el.classList.remove('waiting');
    if (CHARGE[card.cat]) {
      pd.classList.add('charging');
      await wait(CHARGE[card.cat]);
      pd.classList.remove('charging');
      if (!live(p)) return;
    }
    el.classList.add('is-flipped');
    await wait(220); // card is edge-on: switch the scene
    if (!live(p)) return;
    setGlow(card.cat === 'common' ? null : card.cat);
    pd.classList.add('revealed');
    if (card.cat === 'legend') {
      pd.classList.add('flash');
      KFUI.confetti();
      setTimeout(() => P === p && KFUI.confetti(), 500);
    } else if (card.cat === 'rare') KFUI.confetti();
    await wait(380);
    pd.classList.remove('flash');
    if (!live(p)) return;
    showInfo(p);
    p.phase = 'front';
    p.busy = false;
    const last = p.i === p.got.length - 1;
    hit(T(last ? 'hit.all' : 'card.next'));
    tip(T(last ? 'tip.all' : 'tip.next'));
  }

  function statusTag(card, n) {
    return card.isNew
      ? h('span', { className: 'new-tag', textContent: T('tag.new') })
      : h('span', { className: 'dup-tag', textContent: T('tag.dup', { n, coins: sellOf(card.cat) }) });
  }
  function showInfo(p) {
    const card = p.got[p.i];
    $('pack-tease').textContent = '';
    $('pack-info').replaceChildren(
      h('h2', { textContent: card.name }),
      h(
        'div',
        { className: 'tags' },
        h('span', { className: `cat-tag ${catClass(card.cat)}`, textContent: catLabel(card.cat) }),
        statusTag(card, p.counts[p.i]),
      ),
    );
    $('pack-info').classList.add('show');
    const slot = $('pack-tray').children[p.i];
    slot.className = 'done';
    slot.replaceChildren(face(card));
  }

  function summary() {
    const p = P;
    if (!p) return;
    p.phase = 'summary';
    p.busy = false;
    pd.classList.remove('charging', 'flash', 'revealed');
    const order = Object.keys(CATS);
    const best = p.got.reduce((a, c) => (order.indexOf(c.cat) > order.indexOf(a) ? c.cat : a), 'common');
    setGlow(best === 'common' ? null : best);
    $('pack-play').hidden = true;
    $('pack-skip').hidden = true;
    $('pack-summary').hidden = false;
    $('pack-step').textContent = T('pack.mine');
    $('sum-cards').replaceChildren(
      ...p.got.map((c, i) => {
        const el = h(
          'div',
          { className: `sum-card ${catClass(c.cat)}${special(c) ? ' special' : ''}` },
          face(c),
          statusTag(c, p.counts[i]),
        );
        el.style.setProperty('--i', i);
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', `${c.name}, ${catLabel(c.cat).toLowerCase()}, ${T(c.isNew ? 'sum.new' : 'sum.dup')}`);
        return el;
      }),
    );
    const fresh = p.got.filter((c) => c.isNew).length,
      dups = p.got.length - fresh;
    $('sum-title').textContent = fresh === p.got.length ? T('sum.allNew') : fresh ? T('sum.someNew', { n: fresh }) : T('sum.noNew');
    $('sum-text').textContent = T(dups ? 'sum.dupText' : 'sum.newText');
    drawAgain();
    $('pack-done').focus();
  }
  function drawAgain() {
    const can = KF.canBuyPack(),
      need = KF.PACK_PRICE - KF.get().coins;
    $('pack-again').disabled = !can;
    $('pack-again').textContent = T('pack.again', { price: KF.PACK_PRICE });
    $('again-hint').hidden = can;
    $('again-hint').textContent = T('pack.againNeed', { n: need });
  }

  $('pack-price').textContent = KF.PACK_PRICE;
  $('open-pack').addEventListener('click', buyPack);
  $('pack-again').addEventListener('click', buyPack);
  $('pack-hit').addEventListener('click', advance);
  $('pack-skip').addEventListener('click', summary);
  $('pack-done').addEventListener('click', () => pd.close());
  // Esc: first show all three cards, then close.
  pd.addEventListener('cancel', (e) => {
    if (P && P.phase !== 'summary') {
      e.preventDefault();
      summary();
    }
  });
  pd.addEventListener('close', () => {
    if (pd.open) return; // reopened (Esc, then Enter quickly) before this queued event arrived
    P = null;
    pd.className = 'stage';
    (KF.canBuyPack() ? $('open-pack') : shownOwned()[0] || $('tab-album')).focus();
  });

  KF.on('change', () => {
    renderAlbum();
    if (P?.phase === 'summary') drawAgain();
    if (dd.open) drawDetail();
  });
  renderAlbum();
  if (KF.TEST_MODE)
    window.__album = {
      buyPack,
      openDetail,
      get pack() {
        return P && { phase: P.phase, i: P.i, busy: P.busy, cats: P.got.map((c) => c.cat) };
      },
    };
})();

// Who is playing: header chip, login (player cards + PIN), guest progress merge, logout.
// Talks only to KF.auth (contract at the end of BACKEND.md). In test mode KF.auth is a per-tab sandbox (no network).
(() => {
  const auth = KF.auth;
  if (!auth) return;
  /** Elements are looked up by id and used as HTMLInputElement / HTMLDialogElement / ... as needed. @returns {any} */
  const $ = (id) => document.getElementById(id);
  const h = (tag, props = {}, ...kids) => {
    const el = Object.assign(document.createElement(tag), props);
    el.append(...kids);
    return el;
  };
  const count = (n) => (Number.isFinite(Number(n)) ? Math.max(0, Number(n)) : 0);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Names and avatars come from the server: always set them as text, never as markup (KFKit.svg draws the mark as text).
  const shirt = (u) => KFKit.svg(KFKit.parse(u.avatar, u));
  function avatar(u, size = '') {
    const el = h('span', { className: `kf-avatar ${size}` }, shirt(u));
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  // ---- Header chip + menu ----
  const who = $('who');
  let shownId;
  function renderWho() {
    const user = auth.user;
    who.hidden = false;
    $('hero-eyebrow').textContent = user ? T('hero.eyebrowName', { name: user.name }) : T('hero.eyebrow');
    $('sync-text').textContent = user ? T('sync.user', { name: user.name }) : T('sync.guest');
    const id = user ? user.id : null;
    if (id !== shownId || !who.childElementCount) {
      shownId = id;
      $('code-box').open = !user; // logged in: progress syncs itself, the code is only a backup
      const btn = user
        ? h(
            'button',
            { type: 'button', className: 'who-btn', id: 'who-btn' },
            (() => {
              const a = avatar(user);
              a.append(h('i', { className: 'kf-sync-dot' }));
              a.lastChild.dataset.kfSync = 'dot';
              return a;
            })(),
            h(
              'span',
              { className: 'who-text' },
              h('b', { textContent: user.name }),
              (() => {
                const s = h('small');
                s.dataset.kfSync = '';
                return s;
              })(),
            ),
          )
        : h(
            'button',
            { type: 'button', className: 'who-btn who-login', id: 'who-btn' },
            h('span', { className: 'who-icon', textContent: '👤' }),
            T('who.login'),
          );
      btn.addEventListener('click', onWhoClick);
      who.replaceChildren(btn);
      if (user) {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'who-menu');
        const status = h('p');
        status.dataset.kfSync = 'long';
        const logout = h('button', {
          type: 'button',
          className: 'btn btn-light who-logout',
          id: 'logout-btn',
          textContent: T('who.logout'),
        });
        logout.addEventListener('click', doLogout);
        const profile = h('a', {
          className: 'btn btn-dark who-profile',
          id: 'profile-link',
          href: 'profile/',
          textContent: T('who.profile'),
        });
        who.append(
          h(
            'div',
            { className: 'who-menu', id: 'who-menu', hidden: true },
            h(
              'div',
              { className: 'who-menu-head' },
              avatar(user, 'lg'),
              h('div', {}, h('strong', { textContent: user.name }), h('span', { textContent: T('who.now') })),
            ),
            status,
            profile,
            logout,
          ),
        );
      }
    }
    KFUI.updateSync();
  }
  function onWhoClick(e) {
    if (!auth.user) openLogin();
    else if (auth.status === 'expired') openLogin(auth.user);
    else toggleMenu(!menuOpen(), true, e.detail === 0); // detail 0 = opened from the keyboard
  }
  const menuOpen = () => $('who-menu') && !$('who-menu').hidden;
  function toggleMenu(open, refocus = true, fromKeyboard = false) {
    const menu = $('who-menu');
    if (!menu || menu.hidden === !open) return;
    menu.hidden = !open;
    $('who-btn').setAttribute('aria-expanded', open);
    if (open && fromKeyboard) $('profile-link').focus();
    else if (refocus) $('who-btn').focus();
  }
  document.addEventListener('pointerdown', (e) => {
    if (menuOpen() && !who.contains(e.target)) toggleMenu(false, false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen()) toggleMenu(false);
  });
  who.addEventListener('focusout', (e) => {
    if (menuOpen() && e.relatedTarget && !who.contains(e.relatedTarget)) toggleMenu(false, false);
  });

  async function doLogout() {
    const btn = $('logout-btn');
    btn.disabled = true;
    btn.textContent = T('who.saving');
    let r;
    try {
      r = await auth.logout();
    } catch {
      r = { ok: false };
    }
    if (r && r.ok === false) {
      btn.disabled = false;
      btn.textContent = T('who.logout');
      toggleMenu(false, false);
      const choice = await ask({
        icon: '☁️',
        title: T('unsaved.title'),
        text: T('unsaved.text'),
        primary: T('unsaved.stay'),
        secondary: T('unsaved.leave'),
      });
      if (choice !== 'secondary') {
        $('who-btn').focus();
        return;
      }
      try {
        await auth.logout({ force: true });
      } catch {
        /* checked below */
      }
      if (auth.user) {
        KFUI.toast(T('logout.fail'));
        $('who-btn').focus();
        return;
      }
    }
    renderWho();
    if (!auth.user) KFUI.toast(T('logout.done'));
    $('who-btn').focus();
  }

  const ask = askDialog;

  // ---- Login dialog ----
  const dlg = $('login-dialog');
  const dots = $('pin-dots');
  const keys = [...$('keypad').querySelectorAll('button')];
  const lockedUntil = {};
  // mode: which PIN the keypad is for — 'login', or a new player's 'create' / 'confirm'
  let users = [],
    current = null,
    pin = '',
    busy = false,
    direct = false,
    lockTimer = 0,
    loadToken = 0,
    mode = 'login';
  const onPin = () => !$('step-pin').hidden;
  const onNew = () => !$('step-new').hidden;
  function showStep(id) {
    for (const s of ['step-pick', 'step-new', 'step-pin']) $(s).hidden = s !== id;
  }

  function openLogin(user) {
    toggleMenu(false, false);
    direct = !!user;
    draft.name = '';
    draft.mark = MARKS[0];
    draft.color = '';
    signupClosed = '';
    if (!dlg.open) dlg.showModal();
    if (user) showPin(user);
    else showPick();
  }
  function closeLogin() {
    stopLock();
    current = null;
    mode = 'login';
    regToken++;
    dlg.close();
    $('who-btn')?.focus();
  }
  function goBack() {
    if (onPin() && mode === 'confirm') {
      if (!busy) showNewPin(false);
    } // busy: the player is being created
    else if (onPin() && mode === 'create') showNew();
    else if (onNew() || (onPin() && !direct)) showPick();
    else closeLogin();
  }

  async function showPick(message = '') {
    stopLock();
    current = null;
    direct = false;
    mode = 'login';
    showStep('step-pick');
    dlg.setAttribute('aria-labelledby', 'pick-title');
    $('pick-retry').hidden = true;
    $('pick-test-hint').hidden = !KF.TEST_MODE;
    $('pick-text').textContent = T('pick.text');
    $('pick-msg').dataset.kind = message ? 'net' : '';
    $('pick-msg').textContent = message;
    $('players').replaceChildren(
      ...[0, 1].map(() => {
        const s = h('div', { className: 'player skeleton' }, h('i'), h('u'));
        s.setAttribute('aria-hidden', 'true');
        return s;
      }),
    );
    $('play-guest').focus();
    const token = ++loadToken;
    let list;
    try {
      list = await auth.users();
    } catch {
      list = null;
    }
    if (token !== loadToken || !dlg.open || $('step-pick').hidden) return;
    list = Array.isArray(list) ? list : list?.users;
    if (!Array.isArray(list)) {
      $('players').replaceChildren();
      $('pick-msg').dataset.kind = 'net';
      $('pick-msg').textContent = navigator.onLine === false ? T('pick.offline') : T('pick.fail');
      $('pick-retry').hidden = false;
      return;
    }
    users = list;
    if (!users.length && signupClosed) {
      $('players').replaceChildren();
      $('pick-text').textContent = T('pick.empty');
      return;
    }
    if (!users.length) $('pick-text').textContent = T('pick.emptyAdd');
    $('players').replaceChildren(
      ...users.map((u, i) => {
        const kit = h('span', { className: 'kit' }, shirt(u));
        const card = h(
          'button',
          { type: 'button', className: 'player' },
          ...(i < 9 ? [h('kbd', { textContent: i + 1 })] : []),
          kit,
          h('b', { textContent: u.name }),
        );
        kit.setAttribute('aria-hidden', 'true');
        card.addEventListener('click', () => showPin(u));
        return card;
      }),
      ...(signupClosed ? [] : [addTile()]),
    );
    $('players').firstElementChild.focus();
  }
  function addTile() {
    const plus = h('span', { className: 'add-plus', textContent: '+' });
    plus.setAttribute('aria-hidden', 'true');
    const tile = h(
      'button',
      { type: 'button', className: 'player player-add', id: 'add-player' },
      plus,
      h('b', { textContent: T('pick.add') }),
    );
    tile.addEventListener('click', () => showNew());
    return tile;
  }

  function showPin(u) {
    mode = 'login';
    current = u;
    pinStep(u, T('pin.hiName', { name: u.name }), T('pin.text'), T(direct ? 'pin.other' : 'back'));
    setMsg(direct ? T('pin.again') : '');
    if (lockLeft() > 0) startLock();
    else {
      stopLock();
      setKeys(true);
    }
  }
  // The PIN screen is shared by login and by a new player's "make up a PIN" / "repeat it".
  function pinStep(u, title, text, back, face = avatar(u, 'xl')) {
    pin = '';
    busy = false;
    showStep('step-pin');
    dlg.setAttribute('aria-labelledby', 'pin-title');
    $('pin-face').replaceChildren(face);
    $('pin-title').textContent = title;
    $('pin-text').textContent = text;
    $('pin-back').textContent = back;
    $('pin-steps').hidden = mode === 'login';
    $('pin-test-hint').hidden = !KF.TEST_MODE || mode !== 'login'; // the demo PIN helps only to log in
    drawSteps($('pin-steps'), mode === 'confirm' ? 3 : 2);
    dots.className = 'pin-dots';
    drawDots();
    dots.focus();
  }
  function setMsg(text, kind = '') {
    $('pin-msg').textContent = text;
    $('pin-msg').dataset.kind = kind;
  }
  function drawDots() {
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i < pin.length));
    dots.setAttribute('aria-label', T('pin.dots', { n: pin.length }));
  }
  function setKeys(on) {
    keys.forEach((k) => {
      k.disabled = !on;
    });
  }

  function press(d) {
    if (busy || lockLeft() || pin.length >= 4) return;
    if (dots.classList.contains('is-bad') || $('pin-msg').dataset.kind === 'net') {
      dots.classList.remove('is-bad');
      setMsg('');
    }
    pin += d;
    drawDots();
    if (pin.length === 4) setTimeout(submit, 160); // let the 4th dot show first
  }
  function erase() {
    if (busy || lockLeft()) return;
    pin = pin.slice(0, -1);
    drawDots();
  }

  async function submit() {
    if (mode !== 'login') return submitNew();
    if (busy || pin.length < 4 || lockLeft() || !current) return;
    const user = current;
    busy = true;
    setKeys(false);
    dots.classList.add('is-busy');
    setMsg(T('pin.checking'));
    let r;
    try {
      r = await auth.login(user.id, pin);
    } catch {
      r = { ok: false, error: 'network' };
    }
    if (current !== user) return; // dialog closed or another player chosen meanwhile
    busy = false;
    dots.classList.remove('is-busy');
    pin = '';
    if (r && !r.error && r.ok !== false) return loggedIn(r.user || auth.user || user, r.hasGuestProgress);
    setKeys(true);
    drawDots();
    const err = r?.error;
    if (err === 'bad_pin') {
      dots.classList.remove('is-bad');
      void dots.offsetWidth; // restart the shake
      dots.classList.add('is-bad');
      const left = Number(r.attemptsLeft);
      setMsg(T('pin.bad') + (left > 0 && left <= 2 ? T('pin.left', { n: left }) : ''), 'bad');
    } else if (err === 'locked') {
      lockedUntil[user.id] = Date.now() + (count(r.retryAfter) || 300) * 1000;
      startLock();
    } else if (err === 'no_user') {
      showPick(T('pin.noUser'));
    } else {
      setMsg(navigator.onLine === false ? T('pin.offline') : T('pin.fail'), 'net');
    }
  }

  const lockLeft = () => (current ? Math.max(0, Math.ceil(((lockedUntil[current.id] || 0) - Date.now()) / 1000)) : 0);
  function startLock() {
    stopLock();
    setKeys(false);
    pin = '';
    drawDots();
    const clock = $('pin-clock');
    clock.hidden = false;
    const tick = () => {
      const s = lockLeft();
      if (!s) {
        stopLock();
        setKeys(true);
        setMsg(T('pin.unlocked'));
        return;
      }
      clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const text = T('pin.locked', { min: Math.ceil(s / 60) });
      if ($('pin-msg').textContent !== text) setMsg(text, 'wait'); // once a minute, so screen readers are not flooded
    };
    tick();
    lockTimer = setInterval(tick, 1000);
  }
  function stopLock() {
    clearInterval(lockTimer);
    $('pin-clock').hidden = true;
  }

  // ---- New player: name + shirt (colour + picture) → make up a PIN → repeat it → KF.auth.register ----
  // The full shirt editor is on the profile page; here a plain shirt in one colour.
  const MARKS = KFKit.MARKS;
  const COLORS = /** @type {KFKitColor[]} */ (Object.keys(KFKit.COLORS));
  const draft = { name: '', mark: MARKS[0], color: /** @type {KFKitColor | ''} */ ('') };
  const draftKit = () =>
    /** @type {KFKit} */ ({ pattern: 'plain', c1: draft.color || 'blue', c2: draft.color || 'blue', mark: draft.mark });
  const draftUser = () => ({ name: draft.name, avatar: KFKit.format(draftKit()) });
  let firstPin = '',
    regToken = 0,
    signupClosed = '';
  const TAKEN = T('new.taken');
  const BAD_NAME = T('new.badName');
  // Same rule as the server: letters, spaces, hyphens and apostrophes (Мар'яна), at least one letter.
  const cleanName = (s) => s.normalize('NFC').replace(/['’]/g, 'ʼ').replace(/\s+/g, ' ').trim(); // same as the server
  const nameOk = (s) => /^[\p{L} '’ʼ-]{1,30}$/u.test(s) && /\p{L}/u.test(s);
  const sameName = (a, b) => cleanName(String(a)).toLocaleLowerCase('uk') === b.toLocaleLowerCase('uk');
  // First colour = the one an old-style avatar of the next id would get (SQLite: max + 1), as before shirts.
  const firstColor = () => KFKit.legacyColor({ id: users.reduce((m, u) => Math.max(m, parseInt(u.id, 10) || 0), 0) + 1 });
  const nameInput = $('new-name');
  const avatarBtns = MARKS.map((a, i) => {
    const b = h('button', { type: 'button', textContent: a });
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => pickAvatar(i));
    return b;
  });
  $('new-avatars').append(...avatarBtns);
  const colorBtns = COLORS.map((c, i) => {
    const b = h('button', { type: 'button', className: 'swatch' });
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', T(`color.${c}`));
    b.dataset.color = c;
    b.style.setProperty('--sw', KFKit.COLORS[c]);
    b.addEventListener('click', () => pickColor(i));
    return b;
  });
  $('new-colors').append(...colorBtns);

  function drawSteps(el, at) {
    el.replaceChildren(...[1, 2, 3].map((n) => h('i', { className: n <= at ? 'on' : '' })));
    el.setAttribute('aria-label', T('new.step', { n: at }));
  }
  function showNew(hint = '') {
    mode = 'login';
    current = null;
    firstPin = '';
    busy = false;
    stopLock();
    showStep('step-new');
    dlg.setAttribute('aria-labelledby', 'new-title');
    drawSteps($('step-new').querySelector('.new-steps'), 1);
    nameInput.value = draft.name;
    if (!draft.color) draft.color = firstColor();
    drawAvatars();
    drawPreview();
    setHint(hint);
    nameInput.focus();
    nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length); // caret at the end: «додай першу літеру прізвища»
  }
  function setHint(text) {
    $('new-hint').textContent = text;
    nameInput.setAttribute('aria-invalid', String(!!text));
  }
  function drawPreview(pop = false) {
    const name = cleanName(nameInput.value);
    const card = $('new-card');
    $('new-kit').replaceChildren(KFKit.svg(draftKit()));
    $('new-card-name').textContent = name || T('new.placeholder');
    $('new-card-name').classList.toggle('empty', !name);
    if (pop) {
      card.classList.remove('pop');
      void card.offsetWidth;
      card.classList.add('pop');
    }
  }
  function drawAvatars() {
    const check = (b, on) => {
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    };
    avatarBtns.forEach((b) => check(b, b.textContent === draft.mark));
    colorBtns.forEach((b) => check(b, b.dataset.color === draft.color));
  }
  function pickAvatar(i, focus = false) {
    draft.mark = MARKS[i];
    drawAvatars();
    drawPreview(true);
    if (focus) avatarBtns[i].focus();
  }
  function pickColor(i, focus = false) {
    draft.color = COLORS[i];
    drawAvatars();
    drawPreview(true);
    if (focus) colorBtns[i].focus();
  }
  function nameNext() {
    const name = cleanName(nameInput.value);
    nameInput.value = draft.name = name;
    drawPreview();
    if (!name) return showNew(T('new.empty'));
    if (!nameOk(name)) return showNew(BAD_NAME);
    if (users.some((u) => sameName(u.name, name))) return showNew(TAKEN); // save typing two PINs for nothing
    showNewPin(false);
  }
  function showNewPin(confirm, msg = '') {
    mode = confirm ? 'confirm' : 'create';
    if (!confirm) firstPin = '';
    const face = avatar(draftUser(), 'xl');
    pinStep(draft, T(confirm ? 'new.repeat' : 'new.create'), T(confirm ? 'new.repeatText' : 'new.createText'), T('back'), face);
    stopLock();
    setKeys(true);
    setMsg(msg, msg ? 'bad' : '');
  }

  async function submitNew() {
    if (busy || pin.length < 4) return;
    if (mode === 'create') {
      firstPin = pin;
      return showNewPin(true);
    }
    if (pin !== firstPin) {
      showNewPin(false, T('new.mismatch'));
      dots.classList.add('is-bad');
      return;
    }
    busy = true;
    setKeys(false);
    dots.classList.add('is-busy');
    setMsg(T('new.busy'));
    const token = ++regToken;
    let r;
    try {
      r = typeof auth.register === 'function' ? await auth.register(draft.name, pin, draftUser().avatar) : { ok: false, error: 'network' };
    } catch {
      r = { ok: false, error: 'network' };
    }
    const ok = r && !r.error && r.ok !== false;
    if (token !== regToken) {
      if (ok) KFUI.toast(T('new.welcome', { name: draft.name }));
      return;
    } // dialog was closed meanwhile
    busy = false;
    dots.classList.remove('is-busy');
    pin = '';
    if (ok) return loggedIn(r.user || auth.user || draft, r.hasGuestProgress, true);
    const err = r?.error;
    if (err === 'name_taken') return showNew(TAKEN);
    if (err === 'bad_name') return showNew(BAD_NAME);
    const stop = {
      too_many: T('new.tooMany'),
      full: T('new.full'),
      test_mode: T('new.testMode'),
    }[err];
    if (stop) {
      signupClosed = err;
      return showPick(stop);
    }
    // Network: stay on "repeat the PIN" — typing it again is the retry.
    setKeys(true);
    drawDots();
    setMsg(navigator.onLine === false ? T('new.offline') : T('new.fail'), 'net');
  }

  async function loggedIn(user, guestHint, isNew = false) {
    dots.classList.add('is-ok');
    [...dots.children].forEach((d) => d.classList.add('on'));
    setMsg(T(isNew ? 'new.done' : 'login.done'), 'ok');
    await wait(isNew ? 700 : 500);
    current = null;
    mode = 'login';
    dlg.close();
    renderWho();
    $('who-btn').focus();
    if (isNew) {
      KFUI.toast(T('new.welcome', { name: user.name }));
      KFUI.confetti();
    } else KFUI.toast(T('login.hello', { name: user.name }));
    await offerGuestMerge(user, guestHint);
  }

  async function offerGuestMerge(user, guestHint) {
    let has = guestHint;
    if (has === undefined)
      try {
        has = await auth.hasGuestProgress();
      } catch {
        return;
      }
    if (!has) return;
    let g = typeof has === 'object' ? has : null;
    if (!g)
      try {
        g = JSON.parse(localStorage.getItem('kf-progress-v1'));
      } catch {
        g = null;
      }
    const coins = count(g?.coins);
    // older guest data may still carry emoji stickers (kf.js converts them to cards on load)
    const cards =
      Object.keys(g?.cards || {}).length || (typeof g?.stickers === 'number' ? count(g.stickers) : Object.keys(g?.stickers || {}).length);
    const parts = [coins && T('nCoins', { n: coins }), cards && T('nCards', { n: cards })].filter(Boolean);
    const choice = await ask({
      icon: '🎒',
      title: T('merge.title'),
      text: T('merge.text', { parts: parts.join(', '), name: user.name }),
      primary: T('merge.yes'),
      secondary: T('no'),
    });
    $('who-btn').focus();
    if (choice !== 'primary') return;
    try {
      if ((await auth.adoptGuest()) === false) throw new Error('not adopted');
      KFUI.toast(T('merge.done', { name: user.name }));
      KFUI.confetti();
    } catch {
      KFUI.toast(T('merge.fail'));
    }
  }

  keys.forEach((k) => k.addEventListener('click', () => (k.dataset.digit ? press(k.dataset.digit) : erase())));
  $('pin-back').addEventListener('click', () => (mode === 'login' ? showPick() : goBack()));
  $('pin-close').addEventListener('click', closeLogin);
  $('login-close').addEventListener('click', closeLogin);
  $('new-back').addEventListener('click', () => showPick());
  $('new-close').addEventListener('click', closeLogin);
  $('new-next').addEventListener('click', nameNext);
  nameInput.addEventListener('input', () => {
    const name = cleanName(nameInput.value);
    draft.name = name;
    setHint(name && !nameOk(name) ? BAD_NAME : '');
    drawPreview();
  });
  // Arrow keys in the two radio grids (pictures, colours).
  const gridKeys = (id, n, at, pick) =>
    $(id).addEventListener('keydown', (e) => {
      const cols = getComputedStyle($(id)).gridTemplateColumns.split(' ').length;
      const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      if (!step) return;
      e.preventDefault();
      pick((at() + step + n) % n, true);
    });
  gridKeys('new-avatars', MARKS.length, () => MARKS.indexOf(draft.mark), pickAvatar);
  gridKeys('new-colors', COLORS.length, () => COLORS.indexOf(/** @type {KFKitColor} */ (draft.color)), pickColor);
  $('play-guest').addEventListener('click', closeLogin);
  $('retry-users').addEventListener('click', () => showPick());
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    goBack();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      goBack();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (onPin()) {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        erase();
      } else if (e.key === 'Enter' && !e.target.matches('.login-top button')) {
        e.preventDefault();
        submit();
      }
      return;
    }
    if (onNew()) {
      if (e.key === 'Enter' && !e.target.matches('.login-top button')) {
        e.preventDefault();
        nameNext();
      }
      return;
    }
    const cards = [...$('players').querySelectorAll('.player:not(.skeleton)')];
    const players = cards.filter((c) => c.id !== 'add-player');
    if (/^[1-9]$/.test(e.key) && players[e.key - 1]) {
      e.preventDefault();
      players[e.key - 1].click();
      return;
    }
    if ((e.key === '+' || e.code === 'NumpadAdd' || e.code === 'KeyN') && $('add-player')) {
      e.preventDefault();
      showNew();
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const at = cards.indexOf(document.activeElement);
    if (step && cards.length) {
      e.preventDefault();
      cards[at < 0 ? 0 : (at + step + cards.length) % cards.length].focus();
    }
  });

  KF.on('auth', renderWho);
  renderWho();
  // ../#login (the profile page's «sign in» button): open the login dialog once.
  if (location.hash === '#login') {
    history.replaceState(null, '', location.pathname + location.search);
    if (!auth.user) openLogin();
    else if (auth.status === 'expired') openLogin(auth.user);
  }
})();
