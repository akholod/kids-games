// Pre-recorded English clips for the games (Microsoft Edge neural TTS, generated offline, never in the browser).
//
// Setup (once):   python3 -m venv ~/.cache/kf-tts && ~/.cache/kf-tts/bin/pip install -U edge-tts
// Run:            EDGE_TTS=~/.cache/kf-tts/bin/edge-tts node scripts/build-audio.mjs [--voice=en-GB-SoniaNeural] [--rate=-10%] [--pad=200] [--force]
//   --force regenerates every clip (after changing the voice / rate / pad); without it only the missing ones are made.
//   --pad = ms of silence before the word (ffmpeg, env FFMPEG): a speaker waking up from standby swallows the start of a
//   sound, and it must be the silence, not the first letter.
// Phrases: every distinct `en` of WM_CONTENT.words (games/word-match/content.js).
// Output:  audio/en/<slug>.mp3 (slug = lowercase, runs of non [a-z0-9] → '-'), stale clips are deleted,
//          shared/audio.js = window.KF_AUDIO = { en: [slugs] } — the manifest KFG.say checks before using a clip.
// The clips (~10 KB each) are committed and deployed. When Microsoft answers HTTP 403, update edge-tts
// (`~/.cache/kf-tts/bin/pip install -U edge-tts`) — old versions get blocked.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(root, 'audio/en');
const manifest = path.join(root, 'shared/audio.js');

const args = process.argv.slice(2);
const flag = (name, def) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? def;
const force = args.includes('--force');
const voice = flag('voice', 'en-GB-SoniaNeural');
const rate = flag('rate', '-10%');
const pad = Number(flag('pad', '200'));
const home = (/** @type {string} */ p) => p.replace(/^~(?=\/)/, process.env.HOME || '~');
const bin = home(process.env.EDGE_TTS || 'edge-tts');
const ffmpeg = home(process.env.FFMPEG || 'ffmpeg');

// Same rule as slug() in shared/kf-game.js.
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---------- phrases ----------
const sb = { console, Math, KF: { lang: 'uk', i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a] } };
sb.window = sb;
vm.createContext(sb);
for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/word-match/content.js'])
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sb, { filename: f });

/** @type {Map<string, string>} slug → text */
const phrases = new Map();
for (const w of Object.values(sb.WM_CONTENT.words)) {
  const s = slug(w.en);
  if (!s) throw new Error(`empty slug for «${w.en}»`);
  if (phrases.has(s) && phrases.get(s) !== w.en) throw new Error(`slug clash «${s}»: «${phrases.get(s)}» / «${w.en}»`);
  phrases.set(s, w.en);
}
const slugs = [...phrases.keys()].sort();

// ---------- generate ----------
fs.mkdirSync(dir, { recursive: true });

const exec = (cmd, argv) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim().split('\n').pop() || `exit ${code}`))));
  });

const make = async (s) => {
  const file = path.join(dir, `${s}.mp3`);
  const raw = path.join(dir, `.${s}.raw.tmp.mp3`);
  const tmp = path.join(dir, `.${s}.tmp.mp3`);
  for (let attempt = 1; ; attempt++) {
    try {
      await exec(bin, ['--text', phrases.get(s), '--voice', voice, `--rate=${rate}`, '--write-media', raw]);
      if (fs.statSync(raw).size <= 1000) throw new Error('clip too small');
      // Edge pads every clip to ~1.9 s: cut the trailing silence down to 0.1 s, then add `pad` ms in front.
      const trim = 'areverse,silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB,areverse';
      const af = pad > 0 ? `${trim},adelay=${pad}:all=1` : trim;
      await exec(ffmpeg, ['-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '48k', tmp]);
      fs.rmSync(raw);
      fs.renameSync(tmp, file);
      return;
    } catch (e) {
      fs.rmSync(raw, { force: true });
      fs.rmSync(tmp, { force: true });
      if (attempt >= 3) throw new Error(`${s}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

const todo = slugs.filter(
  (s) => force || !fs.existsSync(path.join(dir, `${s}.mp3`)) || fs.statSync(path.join(dir, `${s}.mp3`)).size <= 1000,
);
console.log(`${slugs.length} phrases, ${todo.length} to generate (${voice}, rate ${rate}, pad ${pad} ms)`);
let done = 0;
let failed = 0;
const queue = [...todo];
const worker = async () => {
  for (let s = queue.shift(); s; s = queue.shift()) {
    try {
      await make(s);
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
const known = new Set(slugs);
for (const f of fs.readdirSync(dir)) {
  if (f.startsWith('.') && f.endsWith('.tmp.mp3')) fs.rmSync(path.join(dir, f), { force: true });
  else if (f.endsWith('.mp3') && !known.has(f.slice(0, -4))) {
    console.log(`stale, deleted: ${f}`);
    fs.rmSync(path.join(dir, f));
  }
}

if (failed) {
  console.error('Some clips failed: the manifest is not written. If it is HTTP 403, update edge-tts and run again.');
  process.exit(1);
}
const body = slugs.map((s) => `'${s}'`).join(', ');
fs.writeFileSync(
  manifest,
  `// English audio clips (generated by scripts/build-audio.mjs — do not edit by hand). Files: audio/<lang>/<slug>.mp3.\nwindow.KF_AUDIO = { en: [${body}] };\n`,
);
console.log(`wrote ${path.relative(root, manifest)} (${slugs.length} slugs)`);
