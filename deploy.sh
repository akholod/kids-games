#!/bin/sh
# Build card images if missing, apply remote D1 migrations, then deploy the Worker + static assets
# (exclusions in .assetsignore).
set -e
cd "$(dirname "$0")"

# Card WebPs are not in git: rebuild them from the source zip in images/cards/ when any is missing.
if ! node -e "global.window={};require('./shared/cards.js');const fs=require('fs');
  process.exit(window.KF_CARDS.every(c=>fs.existsSync('images/cards/'+c.id+'.webp')&&fs.existsSync('images/cards/thumb/'+c.id+'.webp'))?0:1)"; then
  zip=$(ls images/cards/*.zip 2>/dev/null | head -n 1)
  [ -n "$zip" ] || { echo "Card images missing and no source zip in images/cards/" >&2; exit 1; }
  src="$HOME/.cache/kf-cards-build"
  rm -rf "$src" && mkdir -p "$src"
  unzip -q -j "$zip" '*.png' '*.md' -d "$src"
  python3 -I scripts/build-cards.py "$src"
  rm -rf "$src"
fi

wrangler d1 migrations apply keeper-fun-games --remote
wrangler deploy
