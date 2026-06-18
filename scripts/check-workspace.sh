#!/usr/bin/env bash
# Verify a madrasa workspace is registered and reachable on this host.
# Usage: bash scripts/check-workspace.sh <subdomain> [apps/backend/.env]
set -uo pipefail

SUBDOMAIN="${1:-}"
ENV_FILE="${2:-apps/backend/.env}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

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

if [[ -z "$SUBDOMAIN" ]]; then
  echo "Usage: bash scripts/check-workspace.sh <subdomain> [env-file]"
  exit 1
fi

BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"
APP_DOMAIN="$(read_env_var MMS_APP_DOMAIN '')"
LOCAL="http://127.0.0.1:${BACKEND_PORT}"

echo "══ Workspace check: ${SUBDOMAIN} ══"
echo "Backend: ${LOCAL}"
echo "MMS_APP_DOMAIN: ${APP_DOMAIN:-<not set — tenant routing will fail>}"
echo ""

echo "── Registry (apex) ──"
curl -fsS "${LOCAL}/api/workspace/registry" 2>/dev/null | head -c 2000 || echo "registry request failed"
echo ""
echo ""

echo "── By subdomain API ──"
HTTP_CODE="$(curl -s -o /tmp/mms-ws-check.json -w '%{http_code}' \
  "${LOCAL}/api/workspace/by-subdomain/${SUBDOMAIN}")"
echo "GET /api/workspace/by-subdomain/${SUBDOMAIN} → HTTP ${HTTP_CODE}"
head -c 1500 /tmp/mms-ws-check.json 2>/dev/null || true
echo ""
echo ""

if [[ -n "$APP_DOMAIN" ]]; then
  TENANT_HOST="${SUBDOMAIN}.${APP_DOMAIN}"
  echo "── Tenant host simulation (X-Forwarded-Host: ${TENANT_HOST}) ──"
  curl -fsS -H "Host: ${TENANT_HOST}" -H "X-Forwarded-Host: ${TENANT_HOST}" \
    "${LOCAL}/api/workspace/by-subdomain/${SUBDOMAIN}" 2>/dev/null | head -c 800 || echo "tenant host request failed"
  echo ""
  echo ""
  echo "Expected workspace URL: https://${TENANT_HOST}/login"
  echo "Ensure DNS: *.${APP_DOMAIN} → this server, and Apache ServerAlias *.${APP_DOMAIN}"
else
  echo "Set MMS_APP_DOMAIN in ${ENV_FILE} to your apex domain (no subdomain prefix)."
fi
