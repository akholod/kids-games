#!/bin/sh
# Apply remote D1 migrations, then deploy the Worker + static assets (exclusions in .assetsignore).
set -e
cd "$(dirname "$0")"
wrangler d1 migrations apply keeper-fun-games --remote
wrangler deploy
