// Shared progress feedback. Load after kf.js.
'use strict';
(() => {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stack = document.createElement('div');
  stack.className = 'kf-toast-stack';
  stack.setAttribute('role', 'status');
  stack.setAttribute('aria-live', 'polite');
  document.body.append(stack);
  function toast(message, kind = '') {
    const node = document.createElement('div');
    node.className = `kf-toast ${kind}`;
    node.textContent = message;
    stack.append(node);
    // Keep celebrations visible without covering the match on small screens.
    while (stack.children.length > 2) stack.firstElementChild.remove();
    setTimeout(() => { node.classList.add('out'); setTimeout(() => node.remove(), 300); }, 2300);
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
      bit.style.animationDelay = `${Math.random() * .55}s`;
      layer.append(bit);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 2600);
  }
  function updateCoins() {
    document.querySelectorAll('[data-kf-coins]').forEach(el => { el.textContent = KF.get().coins; });
  }
  KF.on('change', updateCoins);
  KF.on('coins', delta => { if (delta > 0) toast(`+${delta} 🪙`, 'coin'); });
  KF.on('achievement', a => { toast(`🏅 ${a.title} — нове досягнення!`); confetti(); });
  KF.on('sticker', x => { if (x.isNew) { toast(`🌟 Нова наліпка: ${x.name}!`); confetti(); } });
  function testRibbon() {
    if (!KF.TEST_MODE) return;
    const bar = document.createElement('div');
    bar.className = 'kf-test-ribbon';
    bar.setAttribute('role', 'note');
    const label = document.createElement('span');
    label.textContent = '🧪 Тест-режим · прогрес не зберігається';
    const exit = document.createElement('a');
    exit.href = `${location.pathname}?parent=off`;
    exit.textContent = 'Вийти';
    bar.append(label, exit);
    document.body.prepend(bar);
  }
  updateCoins();
  testRibbon();
  window.KFUI = { toast, confetti, updateCoins };
})();
