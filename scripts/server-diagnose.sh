#!/usr/bin/env bash
# Quick production diagnostics — run on the Hetzner host over SSH.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

ENV_FILE="${1:-apps/backend/.env}"
BACKEND_PORT="$MMS_PROD_BACKEND_PORT"
FRONTEND_PORT="$MMS_PROD_FRONTEND_PORT"

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

BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT)"
FRONTEND_PORT="$(read_env_var FRONTEND_PORT "$MMS_PROD_FRONTEND_PORT")"

echo "══ MMS server diagnose ══"
echo "Root: ${ROOT_DIR}"
echo "Node: $(node -v 2>/dev/null || echo 'missing')"
echo "pnpm: $(pnpm -v 2>/dev/null || echo 'missing')"
APP_DOMAIN="$(read_env_var MMS_APP_DOMAIN '')"
echo "MMS_APP_DOMAIN: ${APP_DOMAIN:-<NOT SET — tenant subdomains will not work>}"
echo "PORT: ${BACKEND_PORT}"
echo ""

echo "── PM2 ──"
pm2 status 2>/dev/null || echo "pm2 not available"
echo ""

echo "── Local ports ──"
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if curl -fsS --connect-timeout 2 --max-time 5 "http://127.0.0.1:${port}/" >/dev/null 2>&1 \
    || curl -fsS --connect-timeout 2 --max-time 5 "http://127.0.0.1:${port}/health" >/dev/null 2>&1; then
    echo "port ${port}: responding"
  else
    echo "port ${port}: NOT responding"
  fi
done
echo ""

echo "── Backend health ──"
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" 2>/dev/null || echo "backend /health failed"
echo ""
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/ready" 2>/dev/null || echo "backend /ready failed"
echo ""

echo "── Workspace registry (first 1.5k) ──"
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/workspace/registry" 2>/dev/null | head -c 1500 || echo "registry failed"
echo ""
echo ""

echo "── Recent backend logs ──"
pm2 logs mmsv2-backend --lines 20 --nostream 2>/dev/null || true
echo ""
echo "── Recent frontend logs ──"
pm2 logs mmsv2-frontend --lines 20 --nostream 2>/dev/null || true
