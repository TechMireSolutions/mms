#!/usr/bin/env bash
# Quick production diagnostics — run on the Hetzner host over SSH.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"
# shellcheck source=lib/curl-local-backend.sh
source "$ROOT_DIR/scripts/lib/curl-local-backend.sh"

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
if ! assert_production_backend_port "$BACKEND_PORT" "Backend PORT in ${ENV_FILE}"; then
  echo "Fix: bash scripts/merge-backend-env.sh ${ENV_FILE}"
fi

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
  if curl_local_backend_ok "http://127.0.0.1:${port}/" "$APP_DOMAIN" \
    || curl_local_backend_ok "http://127.0.0.1:${port}/health" "$APP_DOMAIN"; then
    echo "port ${port}: responding"
  else
    echo "port ${port}: NOT responding"
  fi
done
echo ""

echo "── Backend health ──"
curl_local_backend "http://127.0.0.1:${BACKEND_PORT}/health" "$APP_DOMAIN" || echo "backend /health failed"
echo ""
curl_local_backend "http://127.0.0.1:${BACKEND_PORT}/ready" "$APP_DOMAIN" || echo "backend /ready failed"
echo ""

echo "── Workspace registry (first 1.5k) ──"
curl_local_backend "http://127.0.0.1:${BACKEND_PORT}/api/workspace/registry" "$APP_DOMAIN" | head -c 1500 || echo "registry failed"
echo ""
echo ""

if [[ -n "$APP_DOMAIN" ]] && [[ -f "$ROOT_DIR/scripts/verify-tenant-hosts.sh" ]]; then
  echo "── Tenant subdomain checks ──"
  bash "$ROOT_DIR/scripts/verify-tenant-hosts.sh" "" "$ENV_FILE" || true
  echo ""
fi

echo "── Recent backend logs ──"
pm2 logs mmsv2-backend --lines 20 --nostream 2>/dev/null || true
echo ""
echo "── Recent frontend logs ──"
pm2 logs mmsv2-frontend --lines 20 --nostream 2>/dev/null || true
