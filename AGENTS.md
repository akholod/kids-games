# Kids games

Interactive HTML games/exercises for an 8-year-old.
Site: https://keeper-fun-games.surge.sh

## Child context
- Native language: Ukrainian. Goes to a Spanish school. Learning English.
- Interests: football.

## Structure
- `index.html` — catalog (game list, coins, sticker album, achievements).
- `games/<slug>/index.html` — one game per folder, inline game CSS/JS, no build step.
- `shared/kf.js` — progress core (`window.KF`): coins, stickers, achievements, game registry `KF.GAMES`.
- `shared/kf-ui.js`, `shared/kf.css` — shared look + toasts for coins/achievements.

## Conventions
- Big buttons, works offline after load.
- Every game must work both with touch (tablet/phone) and laptop keyboard + mouse:
  number/letter keys for input, Enter = submit, Backspace = erase, Esc = back/close, arrows/1–4 for choices;
  visible focus, hover states, no swipe-only or hover-only actions.
- UI text: Ukrainian by default; tasks may mix UA/ES/EN on purpose (see IDEAS.md).
- Short rounds (2–5 min), instant feedback, celebrate wins, no punishment for mistakes.
- Every game: include `../../shared/kf.css`, `kf.js`, `kf-ui.js`; call `KF.answer(slug, correct)` per answer
  and `KF.finishGame(slug, { score, max })` at round end; add a "back to catalog" link (`../../`).
- New game → add entry to `GAMES` in `shared/kf.js`: `beta` while in progress (visible only in test mode), then `ready`.
- Test mode for parents: any page with `?parent` (off: `?parent=off`) — per-tab sandbox progress (100 coins), real progress untouched.
- Progress is localStorage only; transfer between devices via export/import code in the catalog.

## Publish
- `./deploy.sh` (surge, domain from `CNAME`, exclusions in `.surgeignore`).
- First time: `npx surge login`.
