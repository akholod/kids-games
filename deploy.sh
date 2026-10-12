#!/bin/sh
# Deploy the whole project root to surge (domain from CNAME, exclusions in .surgeignore).
set -e
cd "$(dirname "$0")"
npx -y surge . "$(cat CNAME)"
