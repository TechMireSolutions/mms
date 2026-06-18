#!/usr/bin/env bash
# Re-create mmsv2-frontend when restart leaves the preview server down.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

ENV_FILE="${1:-apps/backend/.env}"
FRONTEND_PORT="$MMS_PROD_FRONTEND_PORT"
DIST_DIR="apps/frontend/dist"

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

FRONTEND_PORT="$(read_env_var FRONTEND_PORT "$MMS_PROD_FRONTEND_PORT")"

curl_frontend() {
  curl -fsS --connect-timeout 3 --max-time 8 "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1 \
    || curl -fsS --connect-timeout 3 --max-time 8 "http://localhost:${FRONTEND_PORT}/" >/dev/null 2>&1
}

if curl_frontend; then
  echo "Frontend already healthy on port ${FRONTEND_PORT}"
  exit 0
fi

echo "Waiting for frontend after pm2 restart..."
for _ in $(seq 1 15); do
  if curl_frontend; then
    echo "Frontend OK on port ${FRONTEND_PORT}"
    exit 0
  fi
  sleep 2
done

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "ERROR: ${DIST_DIR}/index.html missing — run pnpm run build first"
  exit 1
fi

echo "Recovering mmsv2-frontend (vite preview on port ${FRONTEND_PORT})..."
set +e
pm2 delete mmsv2-frontend 2>/dev/null
set -e

# Resolve vite binary without relying on pnpm being in PATH.
VITE_BIN="$ROOT_DIR/apps/frontend/node_modules/.bin/vite"
if [[ ! -x "$VITE_BIN" ]]; then
  VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"
fi

pm2 start "$VITE_BIN" \
  --name mmsv2-frontend \
  --cwd "$ROOT_DIR/apps/frontend" \
  --update-env \
  --time \
  -- preview --host 127.0.0.1 --port "${FRONTEND_PORT}"

for _ in $(seq 1 30); do
  if curl_frontend; then
    echo "Frontend recovered — OK on port ${FRONTEND_PORT}"
    pm2 save 2>/dev/null || true
    exit 0
  fi
  sleep 2
done

echo "ERROR: frontend recovery failed"
pm2 describe mmsv2-frontend 2>/dev/null || true
pm2 logs mmsv2-frontend --lines 50 --nostream 2>/dev/null || true
exit 1
