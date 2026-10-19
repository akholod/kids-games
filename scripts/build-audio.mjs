// Pre-recorded speech clips for the games (Microsoft Edge neural TTS, generated offline, never in the browser).
//
// Setup (once):   python3 -m venv ~/.cache/kf-tts && ~/.cache/kf-tts/bin/pip install -U edge-tts
// Run:            EDGE_TTS=~/.cache/kf-tts/bin/edge-tts node scripts/build-audio.mjs [--voice-en=…] [--voice-es=…] [--rate=-10%] [--pad=200] [--force]
//   --force regenerates every clip (after changing a voice / rate / pad); without it only the missing ones are made.
//   --pad = ms of silence before the word (ffmpeg, env FFMPEG): a speaker waking up from standby swallows the start of a
//   sound, and it must be the silence, not the first letter.
// Phrases: en = every distinct `en` of WM_CONTENT.words (games/word-match/content.js) + the coach's English commands,
//          es = the coach's Spanish commands (SimonEngine.phrases, games/coach-simon/engine.js).
// Voices:  en-GB-SoniaNeural (British English, like the school), es-ES-ElviraNeural.
// Output:  audio/<lang>/<slug>.mp3 (slug = accents dropped, lowercase, runs of non [a-z0-9] → '-'), stale clips are deleted,
//          shared/audio.js = window.KF_AUDIO = { en: [slugs], es: [slugs] } — the manifest KFG.say checks before using a clip.
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
const VOICES = { en: flag('voice-en', 'en-GB-SoniaNeural'), es: flag('voice-es', 'es-ES-ElviraNeural') };
const rate = flag('rate', '-10%');
const pad = Number(flag('pad', '200'));
const home = (/** @type {string} */ p) => p.replace(/^~(?=\/)/, process.env.HOME || '~');
const bin = home(process.env.EDGE_TTS || 'edge-tts');
const ffmpeg = home(process.env.FFMPEG || 'ffmpeg');

// Same rule as slug() in shared/kf-game.js.
const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---------- phrases ----------
const sb = { console, Math, KF: { lang: 'uk', i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a] } };
sb.window = sb;
vm.createContext(sb);
for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/word-match/content.js', 'games/coach-simon/engine.js'])
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sb, { filename: f });

const SOURCES = {
  en: [...Object.values(sb.WM_CONTENT.words).map((w) => w.en), ...sb.SimonEngine.phrases('en')],
  es: sb.SimonEngine.phrases('es'),
};

// Texts that differ only in case / punctuation ('Right!' and 'right') share a clip.
const bare = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
/** @type {Record<string, Map<string, string>>} lang → slug → text */
const phrases = {};
for (const [lang, texts] of Object.entries(SOURCES)) {
  const map = new Map();
  for (const text of texts) {
    const s = slug(text);
    if (!s) throw new Error(`empty slug for «${text}»`);
    if (map.has(s) && bare(map.get(s)) !== bare(text)) throw new Error(`${lang} slug clash «${s}»: «${map.get(s)}» / «${text}»`);
    if (!map.has(s)) map.set(s, text);
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
      await exec(bin, ['--text', phrases[lang].get(s), '--voice', VOICES[lang], `--rate=${rate}`, '--write-media', raw]);
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
  console.log(`${lang}: ${map.size} phrases, ${todo.length} to generate (${VOICES[lang]}, rate ${rate}, pad ${pad} ms)`);
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
  .map((lang) => `  ${lang}: [${list(lang).join(', ')}],`)
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
