// Renderers of the task types only «Conozco mi entorno» has. window.CN_TYPES = { filter } → KFExam.mount(..., { types }).
// Generic types (choice, tf, sort, order, pairs, label, fill) live in shared/exam/types.js.
// @ts-check
'use strict';

window.CN_TYPES = (() => {
  // Texts (Spanish on both sites, like the engine's).
  const S = {
    kFilter: ({ n }) => `Teclas 1–${n}`,
    filterStart: 'En la boca va un tapón blandito.',
    filterNext: 'Ahora, lo más fino que queda.',
    filterShown: ({ text }) => `Aquí va: ${text}.`,
    filterGood: ({ text }) => `¡Eso es! ${text}.`,
    filterPour: 'Ahora echamos el agua sucia…',
    filterNote: 'Más limpia, pero no potable',
    filterAnswer: ({ list }) => `de abajo arriba, ${list}`,
    and: 'y',
  };
  const U = KF.i18n({ uk: S, es: S });

  // ---------- The bottle ----------
  // viewBox 0 -34 340 384. The cut top of a bottle stands upside down (mouth at y 266) in its own bottom part (rim at y 196);
  // the layer names stand on the right (x 196…340).
  const NS = 'http://www.w3.org/2000/svg';
  const UPPER = 'M30 24H180V172C180 204 124 212 122 236V268H88V236C86 212 30 204 30 172Z';
  const INNER = 'M34 26H176V172C176 202 120 210 118 236V266H92V236C90 210 34 202 34 172Z';
  const LOWER = 'M22 196V330Q22 346 38 346H172Q188 346 188 330V196';
  /** Bands from the mouth up: [top, bottom] in viewBox units (5 layers; more layers share the same height). */
  const bandsFor = (/** @type {number} */ n) => {
    const bottom = 266;
    const top = 56;
    // The neck is narrow: the first band gets more height, so the cotton plug reads as a plug.
    const first = n > 1 ? 44 : bottom - top;
    const rest = n > 1 ? (bottom - first - top) / (n - 1) : 0;
    return Array.from({ length: n }, (_, i) => {
      const y1 = i === 0 ? bottom : bottom - first - rest * (i - 1);
      const y0 = i === 0 ? bottom - first : y1 - rest;
      return [Math.round(y0), Math.round(y1)];
    });
  };
  const rnd = (/** @type {number} */ seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const f = (/** @type {number} */ n) => n.toFixed(1);

  /** How a layer looks: gaps colour + stones (size range) or a texture. */
  const LOOK = {
    algodón: { kind: 'cotton', bg: '#e9e7de' },
    arena: { kind: 'sand', bg: '#e8c987' },
    'piedras pequeñas': { kind: 'stones', bg: '#c2b49c', r: [2.2, 3.4] },
    'piedras medianas': { kind: 'stones', bg: '#a3967f', r: [5.6, 7.6] },
    'piedras grandes': { kind: 'stones', bg: '#8b8070', r: [11, 15] },
  };
  const STONES = ['#a39e96', '#8d8a85', '#b7ae9f', '#c9bfae', '#7f7a73', '#a8937a', '#bdb3a4'];
  const lookOf = (/** @type {string} */ name) => LOOK[name] || { kind: 'stones', bg: '#9d907c', r: [5, 8] };

  /** Texture of one layer filling the box x0..x1 × y0..y1 (the bottle clips it). */
  const texture = (/** @type {string} */ name, x0, y0, x1, y1, seed = 1) => {
    const L = lookOf(name);
    const r = rnd(seed * 7919 + 13);
    let out = `<rect x="${x0}" y="${y0 - 2}" width="${x1 - x0}" height="${y1 - y0 + 4}" fill="${L.bg}"/>`;
    if (L.kind === 'cotton') {
      for (let x = x0; x < x1; x += 9)
        out += `<circle cx="${f(x + r() * 4)}" cy="${f(y0 + 2 + r() * 3)}" r="${f(6 + r() * 3)}" fill="#fff" stroke="#d3d0c4" stroke-width="1.2"/>`;
      for (let i = 0; i < 14; i++)
        out += `<path d="M${f(x0 + r() * (x1 - x0))} ${f(y0 + 6 + r() * (y1 - y0 - 8))}q4 -3 8 0" stroke="#e3e3dc" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    } else if (L.kind === 'sand') {
      const n = Math.round(((x1 - x0) * (y1 - y0)) / 26);
      for (let i = 0; i < n; i++)
        out += `<circle cx="${f(x0 + r() * (x1 - x0))}" cy="${f(y0 + r() * (y1 - y0))}" r="${f(0.8 + r() * 0.9)}" fill="${r() < 0.5 ? '#c9a560' : '#f6e2b2'}"/>`;
    } else {
      const [a, b] = L.r;
      const step = (a + b) * 0.95;
      let row = 0;
      for (let y = y1 - a; y > y0 - a; y -= step * 0.8, row++)
        for (let x = x0 + (row % 2 ? step / 2 : 0); x < x1 + a; x += step) {
          const rr = a + r() * (b - a);
          const cx = x + (r() - 0.5) * a;
          const cy = y + (r() - 0.5) * a * 0.6;
          const c = STONES[Math.floor(r() * STONES.length)];
          out += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr)}" ry="${f(rr * 0.78)}" fill="${c}" transform="rotate(${Math.round(r() * 60 - 30)} ${f(cx)} ${f(cy)})"/>`;
          if (rr > 5)
            out += `<path d="M${f(cx - rr * 0.5)} ${f(cy - rr * 0.3)}q${f(rr * 0.4)} ${f(-rr * 0.4)} ${f(rr * 0.8)} ${f(-rr * 0.2)}" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
        }
    }
    return out;
  };

  /** A small round sample of a layer for its chip. */
  const swatch = (/** @type {string} */ name, /** @type {number} */ k) => {
    const id = `cnsw${k}`;
    return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><circle cx="20" cy="20" r="18"/></clipPath></defs>
      <g clip-path="url(#${id})">${texture(name, 0, 0, 40, 40, k + 3)}</g><circle cx="20" cy="20" r="18" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="1.5"/></svg>`;
  };

  // Build the water filter (book p.22): put the layers into the bottle from its mouth up. A wrong layer shakes and counts;
  // the second miss on the same layer puts the right one in (amber). ≤1 mistake = correct. Then dirty water goes through it.
  /** @type {ExamRenderer<CNFilterTask>} */
  const filter = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, draggable, resolve, answered, setKeys } = ctx;
    const layers = task.layers || [];
    if (layers.length < 2) return ctx.fallback(task, work, [{ text: layers[0] || '—', ok: true }]);
    let chips = shuffle(layers.map((text, i) => ({ text, i })));
    // A random shuffle may come out already in order: then one swap.
    if (chips.every((c, k) => c.i === k)) chips = [chips[1], chips[0], ...chips.slice(2)];
    const bands = bandsFor(layers.length);
    let next = 0;
    let mistakes = 0;
    let missesHere = 0;
    let done = false;
    const hint = mkHint();

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 -34 340 384');
    svg.setAttribute('class', 'cn-bottle');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Filtro de agua');
    // Layers sit in a group clipped by the inside of the bottle, so a falling layer slides down through it.
    const slots = bands
      .map(
        ([y0, y1], i) => `<g class="cn-slot" data-pos="${i}" data-layer="${layers[i]}">${texture(layers[i], 30, y0, 180, y1, i + 1)}
        <rect class="cn-stain" x="30" y="${y0 - 2}" width="150" height="${y1 - y0 + 4}"/></g>`,
      )
      .join('');
    const labels = bands
      .map(([y0, y1], i) => {
        const y = Math.round((y0 + y1) / 2);
        const edge = y > 236 ? 124 : y > 172 ? 150 : 182;
        return `<g class="cn-lab" data-pos="${i}"><path d="M${edge} ${y}H${y > 196 ? 194 : 196}" stroke="#24402f" stroke-width="1.6" stroke-dasharray="1 4" stroke-linecap="round"/>
          <text x="200" y="${y + 5}">${layers[i]}</text></g>`;
      })
      .join('');
    svg.innerHTML = `<defs><clipPath id="cn-in"><path d="${INNER}"/></clipPath><clipPath id="cn-low"><path d="${LOWER}Z"/></clipPath></defs>
      <path class="cn-low-body" d="${LOWER}Z"/>
      <g clip-path="url(#cn-low)"><rect class="cn-clean" x="22" y="300" width="166" height="48"/><path class="cn-clean-top" d="M22 300H188"/></g>
      <g class="cn-drips"><circle cx="105" cy="274" r="3.6"/><circle cx="105" cy="274" r="3"/><circle cx="105" cy="274" r="3.3"/></g>
      <path class="cn-up-body" d="${UPPER}"/>
      <g clip-path="url(#cn-in)">${slots}
        <rect class="cn-next" x="36" y="0" width="138" height="10" rx="6"/>
        <rect class="cn-dirty" x="30" y="26" width="150" height="30"/></g>
      <path class="cn-up-line" d="${UPPER}"/><path class="cn-low-line" d="${LOWER}"/><path class="cn-rim" d="M18 196H192"/><path class="cn-rim" d="M26 24H184"/>
      <path class="cn-ring" d="M86 248H124M86 254H124"/>
      <path class="cn-shine" d="M44 40V160"/><path class="cn-shine" d="M34 212V320"/>
      <path class="cn-stream" d="M113 -12Q108 14 108 54"/>
      <g class="cn-jug">
        <path d="M130 -30H184Q192 -30 190 -22L186 10Q184 18 176 18H140Q132 18 132 10L128 -18Z" fill="#e7f3f7" stroke="#8fb3c2" stroke-width="2.5"/>
        <path d="M131 -12H189L186 10Q184 18 176 18H140Q132 18 132 10Z" fill="#9a6a3a" opacity=".85"/>
        <path d="M130 -30L118 -24L128 -18" fill="#e7f3f7" stroke="#8fb3c2" stroke-width="2.5" stroke-linejoin="round"/></g>
      ${labels}`;
    const slotEls = /** @type {SVGGElement[]} */ ([...svg.querySelectorAll('.cn-slot')]);
    const labEls = /** @type {SVGGElement[]} */ ([...svg.querySelectorAll('.cn-lab')]);
    const marker = /** @type {SVGRectElement} */ (svg.querySelector('.cn-next'));

    const note = h('p', { class: 'cn-filter-note', hidden: true }, h('span', { 'aria-hidden': 'true', text: '💧 ' }), U('filterNote'));
    const artBox = h('div', { class: 'cn-filter-art', 'data-step': '0' }, svg, note);
    const chipEls = chips.map((c, k) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip cn-layer', 'data-layer': c.text, 'data-i': String(k), onclick: () => place(k) },
        h('kbd', { text: String(k + 1) }),
        h('span', { class: 'cn-sw', html: swatch(c.text, k) }),
        h('span', { class: 'cn-layer-name', text: c.text }),
      );
      draggable(b, { targets: '.cn-filter-art', onDrop: () => place(k) });
      return b;
    });

    const showMarker = () => {
      if (next >= bands.length) {
        marker.style.display = 'none';
        return;
      }
      const [y0, y1] = bands[next];
      marker.setAttribute('y', String(y0 + 3));
      marker.setAttribute('height', String(Math.max(8, y1 - y0 - 6)));
      artBox.dataset.step = String(next);
    };

    const drop = (/** @type {number} */ pos, /** @type {boolean} */ fixed) => {
      const g = slotEls[pos];
      g.classList.add('is-on');
      if (fixed) g.classList.add('is-fixed');
      labEls[pos].classList.add('is-on');
      if (fixed) labEls[pos].classList.add('is-fixed');
      if (!reduced()) {
        // Falls from above the bottle's cut edge down to its band.
        const fall = bands[pos][0] + 20;
        g.animate([{ transform: `translateY(${-fall}px)` }, { transform: 'none' }], {
          duration: 420 + pos * 40,
          easing: 'cubic-bezier(.45,0,.75,1.2)',
        });
      }
    };

    const finish = () => {
      done = true;
      marker.style.display = 'none';
      artBox.dataset.step = 'done';
      chipEls.forEach((c) => {
        c.disabled = true;
      });
      const ok = mistakes <= 1;
      const list = `${layers.slice(0, -1).join(', ')} ${U('and')} ${layers[layers.length - 1]}`;
      const report = () => {
        if (!artBox.isConnected || answered()) return;
        note.hidden = false;
        hint.textContent = '';
        resolve(ok, ok ? { soft: mistakes === 1 } : { answer: U('filterAnswer', { list }) });
      };
      hint.textContent = U('filterPour');
      svg.classList.add('is-poured');
      if (reduced()) {
        svg.classList.add('is-still');
        report();
      } else setTimeout(report, 2300);
    };

    const place = (/** @type {number} */ k) => {
      if (done || answered()) return;
      const c = chips[k];
      const b = chipEls[k];
      if (!c || b.disabled) return;
      if (c.i === next) {
        b.disabled = true;
        b.classList.add('is-placed');
        hint.textContent = missesHere ? '' : U('filterGood', { text: cap(c.text) });
        drop(next, false);
      } else {
        mistakes++;
        missesHere++;
        shake(b, svg);
        if (missesHere < 2) {
          hint.textContent = next === 0 ? U('filterStart') : U('filterNext');
          return;
        }
        // Second miss on this layer: the right one goes in, marked.
        const right = chips.findIndex((x) => x.i === next);
        chipEls[right].disabled = true;
        chipEls[right].classList.add('is-placed', 'is-fixed');
        hint.textContent = U('filterShown', { text: layers[next] });
        drop(next, true);
      }
      missesHere = 0;
      next++;
      showMarker();
      if (next >= layers.length) finish();
    };

    showMarker();
    work.append(
      h(
        'div',
        { class: 'cn-filter' },
        artBox,
        h('div', { class: 'cn-filter-side' }, h('div', { class: 'cn-layers' }, chipEls), hint, kbdHint(U('kFilter', { n: chips.length }))),
      ),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= chips.length) {
        place(n - 1);
        return true;
      }
      return false;
    });
  };

  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);

  return { filter };
})();
