#!/usr/bin/env bash
set -euo pipefail

[ -f .env.local ] && source .env.local

if [ -z "${OBSIDIAN_VAULT:-}" ]; then
  echo "Error: OBSIDIAN_VAULT is not set."
  echo "Copy .env.local.example to .env.local and set your vault path."
  exit 1
fi

DEST="$OBSIDIAN_VAULT"
mkdir -p "$DEST"
cp main.js manifest.json styles.css "$DEST"
echo "Deployed to $DEST"

bash "$(dirname "$0")/deploy-android.sh"
