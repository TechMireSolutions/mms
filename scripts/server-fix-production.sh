#!/usr/bin/env bash
# One-shot production recovery on the Hetzner host (run over SSH).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
ENV_FILE="${1:-apps/backend/.env}"

echo "══ MMS production fix ══"
git pull origin main

if [ -f scripts/merge-backend-env.sh ] && [ -n "${MMS_APP_DOMAIN:-}" ]; then
  bash scripts/merge-backend-env.sh "$ENV_FILE"
fi

bash scripts/deploy-recover-backend.sh "$ENV_FILE"
sudo bash scripts/fix-apache-upstream.sh "$ENV_FILE"
bash scripts/deploy-verify.sh "$ENV_FILE"
pm2 save 2>/dev/null || true
echo "Done — open https://${MMS_APP_DOMAIN:-your-domain}/"
