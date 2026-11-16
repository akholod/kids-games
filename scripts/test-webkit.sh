#!/bin/sh
# Safari engine (WebKit) e2e: iPad, iPhone, desktop Safari projects in the official Playwright docker image
# (this host lacks WebKit's libraries). Same repo path inside, own user, host node_modules as they are.
# Extra args go to `playwright test`, e.g. `pnpm test:webkit tests/e2e/news.spec.mjs`.
set -e
cd "$(dirname "$0")/.."
REPO=$(pwd)
VER=$(node -p "require('@playwright/test/package.json').version")
OUT=/tmp/kf-pw-webkit
mkdir -p "$OUT"
exec docker run --rm --network host --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI= -e PW_WEBKIT=1 \
  -e PW_PORT="${PW_PORT:-8796}" -e PW_OUT="$OUT/out" \
  -v "$REPO:$REPO" -v "$OUT:$OUT" -w "$REPO" \
  "mcr.microsoft.com/playwright:v$VER-noble" ./node_modules/.bin/playwright test "$@"
