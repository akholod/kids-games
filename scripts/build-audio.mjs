// Pre-recorded speech clips for the games (Microsoft Edge neural TTS, generated offline, never in the browser).
//
// Setup (once):   python3 -m venv ~/.cache/kf-tts && ~/.cache/kf-tts/bin/pip install -U edge-tts
// Run:            EDGE_TTS=~/.cache/kf-tts/bin/edge-tts node scripts/build-audio.mjs [--voice-en|es|uk=…] [--rate=-10%] [--pad=200] [--force]
//   --force regenerates every clip (after changing a voice / rate / pad); without it only the missing ones are made.
//   --pad = ms of silence before the word (ffmpeg, env FFMPEG): a speaker waking up from standby swallows the start of a
//   sound, and it must be the silence, not the first letter.
// Phrases: en = every distinct `en` of WM_CONTENT.words (games/word-match/content.js) + the coach's English commands,
//          es = the coach's Spanish commands (SimonEngine.phrases, games/coach-simon/engine.js),
//          + every word and sentence the coach dictates in games/dictado/content.js (`say` of its tasks),
//          es-slow = the dictado sentences again, slower (KFG.say(text, 'es', { slow: true })),
//          uk = the words and short texts of games/chytanka/content.js; the voice gets the words without the stress mark
//          (after U+0301 Polina spells the next consonants: «діду́сь» → «дідус м'який знак», «пирі́г» → «пирі ге»),
//          except the homographs of UK_STRESSED (the mark inside them is followed by a consonant + vowel: safe).
// Voices:  en-GB-SoniaNeural (British English, like the school), es-ES-ElviraNeural, uk-UA-PolinaNeural.
// Output:  audio/<lang>/<slug>.mp3 (slug = Ukrainian transliterated, accents dropped, lowercase, runs of non [a-z0-9] → '-'),
//          stale clips are deleted, shared/audio.js = window.KF_AUDIO = { en: [slugs], … } — the manifest KFG.say checks.
// The clips (~10 KB each) are committed and deployed. When Microsoft answers HTTP 403, update edge-tts
// (`~/.cache/kf-tts/bin/pip install -U edge-tts`) — old versions get blocked.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = path.join(root, 'shared/audio.js');

const args = process.argv.slice(2);
const flag = (name, def) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? def;
const force = args.includes('--force');
const VOICES = {
  en: flag('voice-en', 'en-GB-SoniaNeural'),
  es: flag('voice-es', 'es-ES-ElviraNeural'),
  uk: flag('voice-uk', 'uk-UA-PolinaNeural'),
};
VOICES['es-slow'] = VOICES.es;
const rate = flag('rate', '-10%');
/** @type {Record<string, string>} speech rate per clip set (default --rate) */
const RATES = { 'es-slow': flag('rate-slow', '-35%') };
const pad = Number(flag('pad', '200'));
const home = (/** @type {string} */ p) => p.replace(/^~(?=\/)/, process.env.HOME || '~');
const bin = home(process.env.EDGE_TTS || 'edge-tts');
const ffmpeg = home(process.env.FFMPEG || 'ffmpeg');

// Ukrainian → Latin for file names (кит → kyt, кіт → kit: look-alike words stay apart).
const UA = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
};
// Same rule as slug() in shared/kf-game.js: apostrophes dropped, Ukrainian transliterated, accents and stress marks dropped.
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[’'ʼ]/g, '')
    .replace(/[а-яґєії]/g, (c) => UA[c] ?? c)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---------- phrases ----------
const sb = { console, Math, KF: { lang: 'uk', i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a] } };
sb.window = sb;
vm.createContext(sb);
const FILES = [
  'shared/exam/exam.js',
  'shared/exam/types.js',
  'games/word-match/content.js',
  'games/coach-simon/engine.js',
  'games/chytanka/content.js',
  'games/dictado/content.js',
];
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sb, { filename: f });

const same = (/** @type {string} */ t) => [t, t];
/** Chytanka words the voice may stress wrongly without the mark (за́мок, not замо́к). */
const UK_STRESSED = new Set(['замок']);
const dictado = sb.DC_CONTENT.stations.flatMap((s) => s.tasks.filter((t) => t.say));
// [the text the game says (→ the file name), what the voice reads]
const SOURCES = {
  en: [...Object.values(sb.WM_CONTENT.words).map((w) => w.en), ...sb.SimonEngine.phrases('en')].map(same),
  es: [...sb.SimonEngine.phrases('es'), ...dictado.map((t) => t.say)].map(same),
  'es-slow': dictado.filter((t) => t.type === 'cloze').map((t) => same(t.say)),
  uk: [
    ...Object.values(sb.CH_CONTENT.words).map((w) => [w.word, UK_STRESSED.has(w.word) ? w.syl.join('') : w.word]),
    ...sb.CH_CONTENT.stations.flatMap((s) => s.tasks.filter((t) => t.type === 'story').map((t) => same(t.text))),
  ],
};

// Texts that differ only in case / punctuation ('Right!' and 'right') share a clip.
const bare = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
/** @type {Record<string, Map<string, { text: string, tts: string }>>} lang → slug → phrase */
const phrases = {};
for (const [lang, entries] of Object.entries(SOURCES)) {
  const map = new Map();
  for (const [text, tts] of entries) {
    const s = slug(text);
    if (!s) throw new Error(`empty slug for «${text}»`);
    const had = map.get(s);
    if (had && bare(had.text) !== bare(text)) throw new Error(`${lang} slug clash «${s}»: «${had.text}» / «${text}»`);
    // ¿…? / ¡…! are said with their intonation: they never share a clip with the same words said plainly.
    const marks = (/** @type {string} */ t) => t.replace(/[^¿¡]/g, '');
    if (had && marks(had.text) !== marks(text)) throw new Error(`${lang} «${had.text}» / «${text}»: same clip, other intonation`);
    if (!had) map.set(s, { text, tts });
  }
  phrases[lang] = map;
}

// ---------- generate ----------
const exec = (cmd, argv) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim().split('\n').pop() || `exit ${code}`))));
  });

const dirOf = (lang) => path.join(root, 'audio', lang);
const fileOf = (lang, s) => path.join(dirOf(lang), `${s}.mp3`);

const make = async ({ lang, s }) => {
  const raw = path.join(dirOf(lang), `.${s}.raw.tmp.mp3`);
  const tmp = path.join(dirOf(lang), `.${s}.tmp.mp3`);
  for (let attempt = 1; ; attempt++) {
    try {
      const r = RATES[lang] || rate;
      await exec(bin, ['--text', phrases[lang].get(s).tts, '--voice', VOICES[lang], `--rate=${r}`, '--write-media', raw]);
      if (fs.statSync(raw).size <= 1000) throw new Error('clip too small');
      // Edge pads every clip to ~1.9 s: cut the trailing silence down to 0.1 s, then add `pad` ms in front.
      const trim = 'areverse,silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB,areverse';
      const af = pad > 0 ? `${trim},adelay=${pad}:all=1` : trim;
      await exec(ffmpeg, ['-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '48k', tmp]);
      fs.rmSync(raw);
      fs.renameSync(tmp, fileOf(lang, s));
      return;
    } catch (e) {
      fs.rmSync(raw, { force: true });
      fs.rmSync(tmp, { force: true });
      if (attempt >= 3) throw new Error(`${lang}/${s}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

const queue = [];
for (const [lang, map] of Object.entries(phrases)) {
  fs.mkdirSync(dirOf(lang), { recursive: true });
  const todo = [...map.keys()].filter((s) => force || !fs.existsSync(fileOf(lang, s)) || fs.statSync(fileOf(lang, s)).size <= 1000);
  console.log(`${lang}: ${map.size} phrases, ${todo.length} to generate (${VOICES[lang]}, rate ${RATES[lang] || rate}, pad ${pad} ms)`);
  queue.push(...todo.map((s) => ({ lang, s })));
}
let done = 0;
let failed = 0;
const worker = async () => {
  for (let job = queue.shift(); job; job = queue.shift()) {
    try {
      await make(job);
      done++;
    } catch (e) {
      failed++;
      console.error(`FAILED ${e.message}`);
    }
  }
};
await Promise.all([worker(), worker(), worker(), worker()]);
console.log(`generated ${done}${failed ? `, failed ${failed}` : ''}`);

// ---------- stale clips, manifest ----------
for (const [lang, map] of Object.entries(phrases)) {
  for (const f of fs.readdirSync(dirOf(lang))) {
    if (f.startsWith('.') && f.endsWith('.tmp.mp3')) fs.rmSync(path.join(dirOf(lang), f), { force: true });
    else if (f.endsWith('.mp3') && !map.has(f.slice(0, -4))) {
      console.log(`stale, deleted: ${lang}/${f}`);
      fs.rmSync(path.join(dirOf(lang), f));
    }
  }
}

if (failed) {
  console.error('Some clips failed: the manifest is not written. If it is HTTP 403, update edge-tts and run again.');
  process.exit(1);
}
const list = (lang) => [...phrases[lang].keys()].sort().map((s) => `'${s}'`);
const body = Object.keys(phrases)
  .map((lang) => `  ${/^\w+$/.test(lang) ? lang : `'${lang}'`}: [${list(lang).join(', ')}],`)
  .join('\n');
fs.writeFileSync(
  manifest,
  `// Speech clips (generated by scripts/build-audio.mjs — do not edit by hand). Files: audio/<lang>/<slug>.mp3.\nwindow.KF_AUDIO = {\n${body}\n};\n`,
);
console.log(
  `wrote ${path.relative(root, manifest)} (${Object.keys(phrases)
    .map((l) => `${l} ${phrases[l].size}`)
    .join(', ')})`,
);
