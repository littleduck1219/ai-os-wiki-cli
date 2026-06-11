#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
npm link

echo "Installed local ai-os command."
echo "Try: ai-os setup --dry-run"
