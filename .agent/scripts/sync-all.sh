#!/usr/bin/env bash
# Mirror MMS standards to Cursor, Antigravity, and Claude Code trees.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

bash .agent/scripts/sync-rules.sh
bash .agent/scripts/sync-skills.sh
bash .agent/scripts/sync-claude.sh

echo "All agent mirrors synced (.agent, .cursor, .claude)."
