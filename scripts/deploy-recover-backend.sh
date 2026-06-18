#!/usr/bin/env bash
# Re-create mmsv2-backend when restart leaves /health down.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

ENV_FILE="${1:-apps/backend/.env}"
BACKEND_PORT="$MMS_PROD_BACKEND_PORT"
DIST_ENTRY="apps/backend/dist/index.js"

read_env_var() {
  local key="$1"
  local default="${2:-}"
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "$default"
    return 0
  fi
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -1 || true)"
  if [[ -z "$line" ]]; then
    echo "$default"
    return 0
  fi
  local value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  echo "$value"
}

BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"
assert_production_backend_port "$BACKEND_PORT" "Backend recovery PORT" || exit 1

curl_health() {
  curl -fsS --connect-timeout 3 --max-time 8 "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1 \
    || curl -fsS --connect-timeout 3 --max-time 8 "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1
}

if curl_health; then
  echo "Backend already healthy on port ${BACKEND_PORT}"
  exit 0
fi

echo "Waiting for backend after pm2 restart..."
for _ in $(seq 1 15); do
  if curl_health; then
    echo "Backend health OK on port ${BACKEND_PORT}"
    exit 0
  fi
  sleep 2
done

if [[ ! -f "$DIST_ENTRY" ]]; then
  echo "ERROR: ${DIST_ENTRY} missing — run pnpm run build first"
  exit 1
fi

echo "Recovering mmsv2-backend from ${DIST_ENTRY} (port ${BACKEND_PORT})..."
set +e
pm2 delete mmsv2-backend 2>/dev/null
set -e

pm2 start "$DIST_ENTRY" \
  --name mmsv2-backend \
  --cwd "$ROOT_DIR" \
  --update-env \
  --time \
  -e "PORT=${BACKEND_PORT}" \
  -e "NODE_ENV=production"

for _ in $(seq 1 30); do
  if curl_health; then
    echo "Backend recovered — health OK on port ${BACKEND_PORT}"
    pm2 save 2>/dev/null || true
    exit 0
  fi
  sleep 2
done

echo "ERROR: backend recovery failed"
pm2 describe mmsv2-backend 2>/dev/null || true
pm2 logs mmsv2-backend --lines 50 --nostream 2>/dev/null || true
exit 1
