#!/usr/bin/env bash
# Apply Drizzle/data migrations then zero-downtime reload the production PM2 app.
# Intended for SSH/ops use on the Hetzner VPS — no user input is interpolated into commands.
#
# Usage (from monorepo root, as the deploy user that owns the PM2 process):
#   bash scripts/admin-migrate-and-reload.sh
#
# PM2 typically does NOT need sudo when the same user that started the process runs reload.
# If your unit uses systemd instead of PM2, adapt the reload step — do not grant broad sudo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[admin-migrate-and-reload] Applying migrations via mms-backend db:migrate..."
pnpm --filter mms-backend db:migrate

ECOSYSTEM="${ROOT}/ecosystem.config.cjs"
echo "[admin-migrate-and-reload] Reloading PM2 app mmsv2-backend..."
pm2 reload "$ECOSYSTEM" --only mmsv2-backend --update-env

echo "[admin-migrate-and-reload] Done. Verify: curl -fsS http://127.0.0.1:5002/ready"
