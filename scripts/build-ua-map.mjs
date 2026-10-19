// Generator for games/chytanka/map.js. Data: Natural Earth (public domain), https://www.naturalearthdata.com/
// The UKRAINE POINT-OF-VIEW file is used on purpose (Crimea is Ukraine); never use the default/de-facto worldview files.
// Usage: node scripts/build-ua-map.mjs <work-dir> [outfile]
// <work-dir> holds the source GeoJSON (outside the repo, treat the downloads as untrusted data; no npm packages needed):
//   mkdir -p /tmp/ua-map-data && cd /tmp/ua-map-data
//   curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ukr.geojson
//   curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson  # optional: the Dnipro
// Without the rivers file the `river` path is omitted. Tuning: UA_EPS (Douglas-Peucker, px), UA_MIN (smallest island area, px²).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WORK = process.argv[2];
if (!WORK) {
  console.error('Usage: node scripts/build-ua-map.mjs <work-dir> [outfile]');
  process.exit(1);
}
const OUT = process.argv[3] || fileURLToPath(new URL('../games/chytanka/map.js', import.meta.url));
const load = (f) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
  } catch (e) {
    throw new Error(`cannot read ${f} from ${WORK}: ${e instanceof Error ? e.message : e}`);
  }
};

/* ---------- projection: equirectangular, x = (lon - LON0) * cos(48.5deg), y = -lat, scaled to W px wide ---------- */
const W = 1000,
  MARGIN = 20,
  COS = Math.cos((48.5 * Math.PI) / 180),
  LON0 = 22;
const EPS = +process.env.UA_EPS || 2.4,
  MIN_AREA = +process.env.UA_MIN || 150;
const r1 = (v) => Math.round(v * 10) / 10;

/* ---------- helpers ---------- */
const multi = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);
const lines = (geom) => (geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates);
const ringArea = (r) => {
  let a = 0;
  for (let i = 0, n = r.length - 1; i < n; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return a / 2;
};

// Douglas-Peucker on an open polyline, iterative
function dpOpen(pts, eps) {
  const n = pts.length;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let dmax = 0,
      idx = -1;
    const [x1, y1] = pts[s],
      [x2, y2] = pts[e];
    const dx = x2 - x1,
      dy = y2 - y1,
      len2 = dx * dx + dy * dy;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = pts[i];
      let d;
      if (len2 === 0) d = Math.hypot(px - x1, py - y1);
      else {
        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        d = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
      }
      if (d > dmax) {
        dmax = d;
        idx = i;
      }
    }
    if (dmax > eps) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
// closed ring (first == last): split at the farthest point from the first so the closure is handled
function simplifyRing(ring, eps) {
  const pts = ring.slice(0, -1);
  if (pts.length < 4) return pts;
  let fi = 0,
    fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > fd) {
      fd = d;
      fi = i;
    }
  }
  const a = dpOpen(pts.slice(0, fi + 1), eps);
  const b = dpOpen(pts.slice(fi).concat([pts[0]]), eps);
  return a.concat(b.slice(1, -1));
}

// number in tenths -> '12.3' / '-.5' / '7'
const fmt = (t) => {
  const neg = t < 0;
  const a = Math.abs(t);
  let s;
  if (a % 10 === 0) s = String(a / 10);
  else s = String(Math.floor(a / 10)) + '.' + (a % 10);
  if (s.startsWith('0.')) s = s.slice(1);
  return (neg ? '-' : '') + s;
};
// points (px) -> relative path 'Mx yl dx dy…' (+ 'z' when closed); rounding is done on absolute tenths so it does not drift
function pathOf(pts, closed) {
  const q = [];
  for (const [x, y] of pts) {
    const p = [Math.round(x * 10), Math.round(y * 10)];
    const l = q[q.length - 1];
    if (!l || l[0] !== p[0] || l[1] !== p[1]) q.push(p);
  }
  if (q.length < 2) return '';
  let d = 'M' + fmt(q[0][0]) + ' ' + fmt(q[0][1]) + 'l';
  let prev = q[0],
    first = true;
  for (let i = 1; i < q.length; i++) {
    const dx = fmt(q[i][0] - prev[0]),
      dy = fmt(q[i][1] - prev[1]);
    d += (first || dx[0] === '-' ? '' : ' ') + dx + (dy[0] === '-' ? '' : ' ') + dy;
    first = false;
    prev = q[i];
  }
  return d + (closed ? 'z' : '');
}

/* ---------- Ukraine (its own point of view: with Crimea) ---------- */
const countries = load('ne_10m_admin_0_countries_ukr.geojson').features;
const ukr = countries.find((f) => f.properties.ADM0_A3 === 'UKR');
if (!ukr) throw new Error('no feature with ADM0_A3 === UKR');

// keep the big polygons (outer rings only; islets and the tiny ones are dropped by area, in degrees² first)
const polys = multi(ukr.geometry)
  .map((p) => p[0])
  .filter((r) => Math.abs(ringArea(r)) > 0.05);
if (!polys.length) throw new Error('no polygons left');
const lonLat = polys.flat();
const minLat = Math.min(...lonLat.map((p) => p[1])),
  maxLat = Math.max(...lonLat.map((p) => p[1]));
const minLon = Math.min(...lonLat.map((p) => p[0])),
  maxLon = Math.max(...lonLat.map((p) => p[0]));
// Crimea's south coast is ~44.4N; the mainland alone ends ~45.2N
if (!(minLat < 44.6)) {
  throw new Error(`outline ends at ${minLat.toFixed(2)}N (>= 44.6): Crimea is missing, wrong worldview file?`);
}

const S = (W - 2 * MARGIN) / ((maxLon - LON0) * COS - (minLon - LON0) * COS);
const px = ([lon, lat]) => [MARGIN + (lon - minLon) * COS * S, MARGIN + (maxLat - lat) * S];
const H = Math.ceil(2 * MARGIN + (maxLat - minLat) * S);

let outline = '',
  total = 0;
for (const ring of polys) {
  const proj = ring.map(px);
  if (Math.abs(ringArea(proj)) < MIN_AREA) continue;
  const s = simplifyRing(proj, EPS);
  total += s.length;
  outline += pathOf(s, true);
}
if (!outline) throw new Error('empty outline');

/* ---------- Dnipro (optional) ---------- */
let river;
const riversFile = path.join(WORK, 'ne_10m_rivers_lake_centerlines.geojson');
if (fs.existsSync(riversFile)) {
  const inBox = ([lon, lat]) => lon >= 30 && lon <= 35.5 && lat >= 46.3 && lat <= 51.5;
  // runs of consecutive points inside the box, from all Dnipro features (river + lake centerlines of the reservoirs)
  const runs = [];
  for (const f of load('ne_10m_rivers_lake_centerlines.geojson').features) {
    if (f.properties.name !== 'Dnipro' && f.properties.name_alt !== 'Dnieper') continue;
    for (const line of lines(f.geometry)) {
      let cur = [];
      for (const p of line) {
        if (inBox(p)) cur.push(p);
        else {
          if (cur.length > 1) runs.push(cur);
          cur = [];
        }
      }
      if (cur.length > 1) runs.push(cur);
    }
  }
  // chain runs end-to-start (endpoints within ~0.02 deg), then walk from the northernmost start
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.02;
  const chains = [];
  while (runs.length) {
    let chain = runs.pop(),
      grown = true;
    while (grown) {
      grown = false;
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i];
        const cs = chain[0],
          ce = chain[chain.length - 1];
        if (near(ce, r[0])) chain = chain.concat(r.slice(1));
        else if (near(ce, r[r.length - 1])) chain = chain.concat(r.slice(0, -1).reverse());
        else if (near(cs, r[r.length - 1])) chain = r.concat(chain.slice(1));
        else if (near(cs, r[0])) chain = r.slice(1).reverse().concat(chain);
        else continue;
        runs.splice(i, 1);
        grown = true;
        break;
      }
    }
    chains.push(chain);
  }
  river = chains
    .map((c) => pathOf(dpOpen(c.map(px), EPS * 0.6), false))
    .filter(Boolean)
    .join('');
  console.log(
    'river: chains',
    chains.length,
    'points',
    chains.reduce((n, c) => n + c.length, 0),
  );
} else {
  console.log('no rivers file: the river is omitted');
}

/* ---------- cities ---------- */
const cityDef = {
  kyiv: [30.52, 50.45],
  chernihiv: [31.29, 51.49],
  poltava: [34.55, 49.59],
  kharkiv: [36.23, 49.99],
  dnipro: [35.05, 48.46],
  zaporizhzhia: [35.14, 47.84],
  kherson: [32.62, 46.64],
  odesa: [30.72, 46.48],
  karpaty: [24.55, 48.45], // Yaremche
  lviv: [24.03, 49.84],
};
const cities = {};
for (const k in cityDef) cities[k] = px(cityDef[k]).map(r1);

/* ---------- output ---------- */
const cityLines = Object.entries(cities).map(([k, [x, y]]) => `    ${k}: [${x}, ${y}],`);
const header = `// Map data for the Chytanka game (Ukraine for the reading journey).
// Source: Natural Earth (public domain), https://www.naturalearthdata.com/ (10m countries, Ukraine's point of view: with Crimea; 10m rivers for the Dnipro).
// Generated by scripts/build-ua-map.mjs; do not edit by hand.
// Equirectangular: x = (lon - lon0) * cos(48.5deg), y = -lat, ${W}x${H}.
`;
const body =
  `window.CH_MAP = {\n  viewBox: '0 0 ${W} ${H}',\n  outline: '${outline}',\n` +
  (river ? `  river: '${river}',\n` : '') +
  `  cities: {\n${cityLines.join('\n')}\n  },\n};\n`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, header + body);
console.log('written', OUT, fs.statSync(OUT).size, 'bytes');
console.log(
  'outline points',
  total,
  `bbox lat ${minLat.toFixed(2)}..${maxLat.toFixed(2)} lon ${minLon.toFixed(2)}..${maxLon.toFixed(2)}`,
  `viewBox ${W}x${H}`,
);
