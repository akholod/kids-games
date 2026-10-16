// Generator for games/sociales-planeta/maps.js. Data: Natural Earth (public domain), https://www.naturalearthdata.com/
// Usage: node scripts/build-sp-maps.mjs <work-dir> [outfile]
// <work-dir> holds the source GeoJSON and the polygon-clipping package (both outside the repo):
//   mkdir -p ~/.cache/sp-maps && cd ~/.cache/sp-maps && npm i polygon-clipping
//   for f in ne_10m_admin_0_countries ne_10m_admin_1_states_provinces ne_50m_admin_0_countries; do
//     curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/$f.geojson; done
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const WORK = process.argv[2];
if (!WORK) {
  console.error('Usage: node scripts/build-sp-maps.mjs <work-dir> [outfile]');
  process.exit(1);
}
const pc = createRequire(path.join(path.resolve(WORK), 'package.json'))('polygon-clipping');
const load = (f) => JSON.parse(fs.readFileSync(path.join(WORK, f)));
const OUT = process.argv[3] || fileURLToPath(new URL('../games/sociales-planeta/maps.js', import.meta.url));

/* ---------- helpers ---------- */
const multi = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);
const ringArea = (r) => {
  let a = 0;
  for (let i = 0, n = r.length - 1; i < n; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return a / 2;
};
const mapMulti = (mp, f) => mp.map((poly) => poly.map((ring) => ring.map(f)));
const bboxPoly = (poly) => {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [x, y] of poly[0]) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return [a, b, c, d];
};
const rectPoly = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
const union = (mps) => {
  mps = mps.filter((m) => m.length);
  if (!mps.length) return [];
  return pc.union(mps[0], ...mps.slice(1));
};
const clip = (mp, x0, y0, x1, y1) => (mp.length ? pc.intersection(mp, rectPoly(x0, y0, x1, y1)) : []);

// Douglas-Peucker on a closed ring (first == last), iterative
function dpOpen(pts, eps) {
  const n = pts.length;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let dmax = 0, idx = -1;
    const [x1, y1] = pts[s], [x2, y2] = pts[e];
    const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = pts[i];
      let d;
      if (len2 === 0) d = Math.hypot(px - x1, py - y1);
      else {
        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        d = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
      }
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > eps) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function simplifyRing(ring, eps) {
  const pts = ring.slice(0, -1);
  if (pts.length < 4) return ring;
  // split at farthest point from the first so the closure is handled
  let fi = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > fd) { fd = d; fi = i; }
  }
  const a = dpOpen(pts.slice(0, fi + 1), eps);
  const b = dpOpen(pts.slice(fi).concat([pts[0]]), eps);
  const out = a.concat(b.slice(1));
  out.push(out[0]);
  return out;
}
// simplify + drop small rings; coords already projected (px)
function cleanMulti(mp, eps, minArea, minHole) {
  const out = [];
  for (const poly of mp) {
    const rings = [];
    poly.forEach((ring, i) => {
      const s = simplifyRing(ring, eps);
      const a = Math.abs(ringArea(s));
      if (s.length < 4) return;
      if (i === 0 ? a < minArea : a < (minHole || minArea * 3)) return;
      rings.push(s);
    });
    if (rings.length && poly[0] && rings[0] && Math.abs(ringArea(simplifyRing(poly[0], eps))) >= minArea) out.push(rings);
  }
  return out;
}

const fmt = (t) => {
  const neg = t < 0;
  let a = Math.abs(t);
  let s;
  if (a % 10 === 0) s = String(a / 10);
  else s = String(Math.floor(a / 10)) + '.' + (a % 10);
  if (s.startsWith('0.')) s = s.slice(1);
  return (neg ? '-' : '') + s;
};
function pathOf(mp) {
  let d = '';
  for (const poly of mp) {
    for (const ring of poly) {
      const q = [];
      for (const [x, y] of ring.slice(0, -1)) {
        const p = [Math.round(x * 10), Math.round(y * 10)];
        const l = q[q.length - 1];
        if (!l || l[0] !== p[0] || l[1] !== p[1]) q.push(p);
      }
      if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
      if (q.length < 3) continue;
      d += 'M' + fmt(q[0][0]) + ' ' + fmt(q[0][1]) + 'l';
      let prev = q[0], first = true;
      for (let i = 1; i < q.length; i++) {
        const dx = fmt(q[i][0] - prev[0]), dy = fmt(q[i][1] - prev[1]);
        d += (first || dx[0] === '-' ? '' : ' ') + dx + (dy[0] === '-' ? '' : ' ') + dy;
        first = false;
        prev = q[i];
      }
      d += 'z';
    }
  }
  return d;
}

// approximate pole of inaccessibility of the biggest polygon (grid search)
function inPoly(poly, x, y) {
  let ins = false;
  for (const ring of poly) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
  }
  return ins;
}
function distEdges(poly, x, y) {
  let m = 1e9;
  for (const ring of poly) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
      let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      m = Math.min(m, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
    }
  }
  return m;
}
function labelOf(mp) {
  let best = null, ba = -1;
  for (const poly of mp) {
    const a = Math.abs(ringArea(poly[0]));
    if (a > ba) { ba = a; best = poly; }
  }
  const [x0, y0, x1, y1] = bboxPoly(best);
  let bp = [(x0 + x1) / 2, (y0 + y1) / 2], bd = -1;
  const N = 40;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = x0 + ((x1 - x0) * i) / N, y = y0 + ((y1 - y0) * j) / N;
      if (!inPoly(best, x, y)) continue;
      const d = distEdges(best, x, y);
      if (d > bd) { bd = d; bp = [x, y]; }
    }
  }
  return [Math.round(bp[0] * 10) / 10, Math.round(bp[1] * 10) / 10];
}
const r1 = (v) => Math.round(v * 10) / 10;

/* ---------- WORLD ---------- */
const W = 1000, K = W / 360, LAT_TOP = 84, LAT_BOT = -90;
const H = Math.round((LAT_TOP - LAT_BOT) * K);
const wx = (lon) => (lon + 180) * K;
const wy = (lat) => (LAT_TOP - lat) * K;
const wp = ([lon, lat]) => [wx(lon), wy(lat)];

const countries = load('ne_50m_admin_0_countries.geojson').features;
const cmap = { Europe: 'europa', Asia: 'asia', Africa: 'africa', 'North America': 'america', 'South America': 'america', Oceania: 'oceania', Antarctica: 'antartida' };
const sevenSeas = {
  Seychelles: 'africa', Mauritius: 'africa', 'Saint Helena': 'africa', Maldives: 'asia', 'Br. Indian Ocean Ter.': 'asia', 'S. Geo. and the Is.': 'america',
};
const buckets = { europa: [], asia: [], africa: [], america: [], oceania: [], antartida: [] };
const farFrom = (poly) => { const [a, b, c, d] = bboxPoly(poly); return [(a + c) / 2, (b + d) / 2]; };
for (const f of countries) {
  const nm = f.properties.NAME;
  let cont = cmap[f.properties.CONTINENT] || sevenSeas[nm];
  if (!cont) continue;
  for (const poly of multi(f.geometry)) {
    let c = cont;
    if (['France', 'Netherlands', 'Norway', 'Portugal', 'Spain', 'United Kingdom', 'Denmark'].includes(nm)) {
      const [lo, la] = farFrom(poly);
      if (nm === 'Norway' && la < 50) continue; // Bouvet
      if (!(lo > -30 && lo < 60 && la > 30) && !(nm === 'Portugal' || nm === 'Spain')) {
        if (lo < -30) c = 'america';
        else if (la < 30 && lo > -30 && lo < 70) c = 'africa';
        else if (lo > 60 && la < 0) continue;
      }
    }
    if (nm === 'Russia') {
      const [lo] = farFrom(poly);
      const part = (mp, cc) => buckets[cc].push(mp);
      const eu = clip([poly], -181, 0, 60, 90), as = clip([poly], 60, 0, 181, 90);
      // chukotka pieces at lon ~ -180..-169 are asia
      if (lo < -100) part([poly], 'asia');
      else { part(eu, 'europa'); part(as, 'asia'); }
      continue;
    }
    buckets[c].push([poly]);
  }
}
const WEPS = +process.env.WEPS || 0.3, WMIN = +process.env.WMIN || 0.5;
const continentMeta = {
  europa: ['Europa', [15, 52]],
  asia: ['Asia', [90, 48]],
  africa: ['África', [20, 6]],
  america: ['América', [-100, 46]],
  oceania: ['Oceanía', [134, -25]],
  antartida: ['Antártida', [20, -79]],
};
const continents = {};
for (const k in buckets) {
  const u = union(buckets[k]);
  const proj = cleanMulti(mapMulti(u, wp), WEPS, WMIN);
  const [lon, lat] = continentMeta[k][1];
  continents[k] = { name: continentMeta[k][0], d: pathOf(proj), label: [r1(wx(lon)), r1(wy(lat))] };
}

// oceans: boundaries in lon/lat
const P = (pts) => [pts.map(wp).concat([wp(pts[0])])];
const pacEastLine = [[-168, 66], [-141, 64], [-125, 58], [-118, 50], [-108, 40], [-104, 30], [-103, 21], [-95, 17.5], [-90, 15], [-85, 11], [-82, 9], [-79.8, 9.2], [-77, 8], [-72, 0], [-72, -5], [-68, -18], [-69, -35], [-70, -52], [-68, -56], [-68, -60]];
const indWestLine = [[20, -60], [20, -34], [20, 0], [30, 25], [32.3, 30.5], [34, 31], [36, 32], [38, 36.5], [47, 36.5], [56, 36], [60, 40], [60, 66]];
const pacWestLine = [[99, 66], [99, 10], [101.5, 3], [102, -2], [106, -6.5], [106, -12], [127, -11], [131, -13], [135, -25], [147, -39], [147, -60]];
const ring = (pts) => pts.map(wp).concat([wp(pts[0])]);
const L = 180, B = -60, T = 66;
const oceans = {
  pacifico: { name: 'Océano Pacífico', rings: [
    ring([[-180, T]].concat(pacEastLine, [[-180, B]])),
    ring(pacWestLine.slice().reverse().concat([[180, T], [180, B]])),
  ], label: [-140, 5] },
  atlantico: { name: 'Océano Atlántico', rings: [ring(pacEastLine.concat(indWestLine))], label: [-35, 22] },
  indico: { name: 'Océano Índico', rings: [ring(indWestLine.slice().reverse().concat([[60, T]], pacWestLine).concat([]).filter(() => true))], label: [78, -22] },
  artico: { name: 'Océano Glacial Ártico', rings: [ring([[-180, T], [180, T], [180, LAT_TOP], [-180, LAT_TOP]])], label: [-135, 77] },
  antartico: { name: 'Océano Glacial Antártico', rings: [ring([[-180, B], [180, B], [180, LAT_BOT], [-180, LAT_BOT]])], label: [-110, -63] },
};
// indico: build explicitly (west line up, top along T, west line of Pacific down, bottom along B)
oceans.indico.rings = [ring(indWestLine.concat([[99, T]], pacWestLine.slice(1)))];
// pacEastLine ends at (-68,-60); indWestLine starts at (20,-60): atlantic ring closes along B
const oceanOut = {};
for (const k in oceans) {
  const o = oceans[k];
  const mp = o.rings.map((r) => [r]);
  oceanOut[k] = { name: o.name, d: pathOf(mp), label: [r1(wx(o.label[0])), r1(wy(o.label[1]))] };
}
const world = {
  viewBox: `0 0 ${W} ${H}`,
  continents,
  oceans: oceanOut,
  spain: [r1(wx(-3.7)), r1(wy(40.42))],
};

/* ---------- SPAIN ---------- */
const SW = 600, SH = 480;
const KS = 48, CX = Math.cos((39.5 * Math.PI) / 180) * KS, LON0 = -10, LAT0 = 45;
const sp = ([lon, lat]) => [(lon - LON0) * CX, (LAT0 - lat) * KS];
const INSET = [8, 394, 140, 78];
const KC = 25, CCX = Math.cos((28.5 * Math.PI) / 180) * KC;
const cw = 4.9 * CCX, ch = 1.9 * KC;
const cOx = INSET[0] + (INSET[2] - cw) / 2, cOy = INSET[1] + (INSET[3] - ch) / 2 + 4;
const spc = ([lon, lat]) => [cOx + (lon + 18.2) * CCX, cOy + (29.5 - lat) * KC];

const prov = load('ne_10m_admin_1_states_provinces.geojson').features.filter((f) => f.properties.adm0_a3 === 'ESP');
const ccaaDef = [
  ['Galicia', 'galicia', 'Galicia'],
  ['Asturias', 'asturias', 'Principado de Asturias'],
  ['Cantabria', 'cantabria', 'Cantabria'],
  ['País Vasco', 'pais-vasco', 'País Vasco'],
  ['Foral de Navarra', 'navarra', 'Comunidad Foral de Navarra'],
  ['La Rioja', 'la-rioja', 'La Rioja'],
  ['Aragón', 'aragon', 'Aragón'],
  ['Cataluña', 'cataluna', 'Cataluña'],
  ['Castilla y León', 'castilla-y-leon', 'Castilla y León'],
  ['Madrid', 'madrid', 'Comunidad de Madrid'],
  ['Castilla-La Mancha', 'castilla-la-mancha', 'Castilla-La Mancha'],
  ['Valenciana', 'valencia', 'Comunitat Valenciana'],
  ['Murcia', 'murcia', 'Región de Murcia'],
  ['Extremadura', 'extremadura', 'Extremadura'],
  ['Andalucía', 'andalucia', 'Andalucía'],
  ['Islas Baleares', 'baleares', 'Illes Balears'],
  ['Canary Is.', 'canarias', 'Canarias'],
];
const SEPS = +process.env.SEPS || 0.3, SMIN = +process.env.SMIN || 0.6;
const regions = [], allProj = [];
for (const [key, id, name] of ccaaDef) {
  const fs_ = prov.filter((f) => f.properties.region === key);
  if (!fs_.length) throw new Error('no provinces for ' + key);
  const proj = fs_.map((f) => mapMulti(multi(f.geometry), id === 'canarias' ? spc : sp));
  const u = union(proj);
  allProj.push(u);
  const cl = cleanMulti(u, SEPS, SMIN, 2);
  let label = labelOf(cl);
  if (id === 'canarias') label = [r1(INSET[0] + INSET[2] / 2), r1(INSET[1] + 12)];
  regions.push({ id, name, d: pathOf(cl), label });
}
const outline = pathOf(cleanMulti(union(allProj), SEPS, SMIN, 2));

// neighbours (10m countries so borders match the admin-1 data)
const c10 = load('ne_10m_admin_0_countries.geojson').features;
const nbNames = { Portugal: 'portugal', France: 'francia', Andorra: 'andorra', Morocco: 'marruecos', Algeria: 'argelia' };
const neighbors = {};
for (const f of c10) {
  const id = nbNames[f.properties.NAME];
  if (!id) continue;
  const mp = mapMulti(multi(f.geometry), sp).filter((poly) => {
    const [a, b, c, d] = bboxPoly(poly);
    return c > -50 && a < SW + 50 && d > -50 && b < SH + 50;
  });
  const cl = cleanMulti(clip(mp, 0, 0, SW, SH), SEPS, SMIN, 2);
  neighbors[id] = pathOf(cl);
}
const cityDef = [
  ['Madrid', -3.70, 40.42], ['Barcelona', 2.17, 41.39], ['Valencia', -0.38, 39.47],
  ['Sevilla', -5.98, 37.39], ['Bilbao', -2.93, 43.26], ['Oviedo', -5.84, 43.36],
];
const cities = cityDef.map(([name, lo, la]) => { const [x, y] = sp([lo, la]); return { name, x: r1(x), y: r1(y) }; });
const spain = { viewBox: `0 0 ${SW} ${SH}`, neighbors, regions, outline, inset: INSET, cities };

/* ---------- output ---------- */
// quoted keys with dashes (none) / values with ' are escaped above
const fix = (o) => {
  const s = JSON.stringify(o, (k, v) => v, 2);
  return s
    .replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:')
    .replace(/"((?:[^"\\]|\\.)*)"/g, (m, g) => "'" + g.replace(/\\"/g, '"').replace(/'/g, "\\'") + "'");
};
const compactArrays = (s) => s.replace(/\[\n\s+(-?[\d.]+),\n\s+(-?[\d.]+)\n\s+\]/g, '[$1, $2]')
  .replace(/\[\n\s+(-?[\d.]+),\n\s+(-?[\d.]+),\n\s+(-?[\d.]+),\n\s+(-?[\d.]+)\n\s+\]/g, '[$1, $2, $3, $4]');
const body = compactArrays(fix({ world, spain }));
const header = `// Map data for the Sociales: Planeta game.
// Source: Natural Earth (public domain), https://www.naturalearthdata.com/ (50m/10m countries, 10m admin-1).
// Generated by scripts/build-sp-maps.mjs; do not edit by hand.
// World: equirectangular, lon -180..180, lat 84..-90, ${W}x${H}. Spain: Iberia + Baleares, Canarias in an inset.
`;
fs.writeFileSync(OUT, header + 'window.SP_MAPS = ' + body + ';\n');
console.log('written', OUT, fs.statSync(OUT).size);
console.log('world', JSON.stringify(world).length, 'spain', JSON.stringify(spain).length);
