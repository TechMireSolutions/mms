#!/usr/bin/env bash
# Sync .agent/skills/ → .cursor/skills/ (canonical Antigravity → Cursor).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SRC=".agent/skills"
DEST=".cursor/skills"

for dir in "$SRC"/*/; do
  name="$(basename "$dir")"
  mkdir -p "$DEST/$name"
  if [[ -f "$dir/SKILL.md" ]]; then
    cp "$dir/SKILL.md" "$DEST/$name/SKILL.md"
    echo "synced skill $name"
  fi
  if [[ -d "$dir/scripts" ]]; then
    mkdir -p "$DEST/$name/scripts"
    cp -R "$dir/scripts/." "$DEST/$name/scripts/"
    echo "synced scripts $name"
  fi
done

cp "$SRC/README.md" "$DEST/README.md"
echo "Done. Skills mirrored to $DEST"
