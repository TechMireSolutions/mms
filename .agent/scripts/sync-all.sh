#!/usr/bin/env bash
# Mirror MMS standards to Cursor, Antigravity, and Claude Code trees.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash .agents/scripts/sync-rules.sh
bash .agents/scripts/sync-skills.sh
bash .agents/scripts/sync-claude.sh

echo "All agent mirrors synced (.agents, .cursor, .claude)."
