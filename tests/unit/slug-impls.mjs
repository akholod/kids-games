// The two implementations of the clip file name rule, loaded from their real sources (not copies):
//   buildSlug(text)       slug() of scripts/build-audio.mjs (the script itself runs on import, so its slug code is cut out)
//   gameHasClip(text, s)  does shared/kf-game.js find a clip named `s` for `text`? (slug() is private there: KFG.canSay tells)
import vm from 'node:vm';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) => fs.readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

const buildSource = read('scripts/build-audio.mjs');
const from = buildSource.indexOf('// Ukrainian → Latin for file names');
const to = buildSource.indexOf('// ---------- phrases');
if (from < 0 || to < from) throw new Error('slug code not found in scripts/build-audio.mjs');
const sbBuild = {};
vm.createContext(sbBuild);
vm.runInContext(`${buildSource.slice(from, to)}\nglobalThis.slug = slug;`, sbBuild);
export const buildSlug = /** @type {(text: string) => string} */ (sbBuild.slug);

export const gameHasClip = (text, clipSlug) => {
  class HTMLScriptElement {}
  const sb = {
    console,
    HTMLScriptElement,
    URL,
    document: {
      currentScript: Object.assign(new HTMLScriptElement(), { src: 'http://localhost/shared/kf-game.js' }),
      addEventListener() {},
    },
    navigator: {},
    KF_AUDIO: { es: [clipSlug] },
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read('shared/kf-game.js'), sb, { filename: 'shared/kf-game.js' });
  return sb.KFG.canSay('es', text) === true && sb.KFG.canSay('es', `${text} zzz extra`) === false;
};
