#!/bin/sh
# Build card images if missing, apply remote D1 migrations, then deploy the Worker + static assets
# (exclusions in .assetsignore).
set -e
cd "$(dirname "$0")"

# Card WebPs are not in git: rebuild them from the source zips in images/cards/ when any is missing.
if ! node -e "global.window={};require('./shared/cards.js');const fs=require('fs');
  process.exit(window.KF_CARDS.every(c=>fs.existsSync('images/cards/'+c.id+'.webp')&&fs.existsSync('images/cards/thumb/'+c.id+'.webp'))?0:1)"; then
  set -- images/cards/*.zip
  [ -e "$1" ] || { echo "Card images missing and no source zip in images/cards/" >&2; exit 1; }
  build="$HOME/.cache/kf-cards-build"
  rm -rf "$build" && mkdir -p "$build"
  dirs=""
  n=0
  for zip in "$@"; do
    n=$((n + 1))
    mkdir "$build/$n"
    unzip -q -j "$zip" '*.png' '*.md' -d "$build/$n" || [ $? -eq 11 ]  # 11 = no .md in this zip
    dirs="$dirs $build/$n"
  done
  # shellcheck disable=SC2086
  python3 -I scripts/build-cards.py $dirs
  rm -rf "$build"
fi

wrangler d1 migrations apply keeper-fun-games --remote
wrangler deploy
