#!/usr/bin/env bash
# One-shot production recovery on the Hetzner host (run over SSH or GitHub Actions).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "══ MMS production fix ══"
git pull origin main
bash scripts/apply-production-host-isolation.sh "${1:-apps/backend/.env}"
