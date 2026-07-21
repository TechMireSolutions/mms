#!/usr/bin/env bash
# Post-deploy verification — fails when local or public site is unreachable.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"
# shellcheck source=lib/curl-local-backend.sh
source "$ROOT_DIR/scripts/lib/curl-local-backend.sh"

ENV_FILE="${1:-apps/backend/.env}"
BACKEND_PORT="$MMS_PROD_BACKEND_PORT"

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
  # Strip carriage returns and leading/trailing whitespace
  value="$(echo -n "$value" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  echo "$value"
}

BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"
assert_production_backend_port "$BACKEND_PORT" "Backend PORT in ${ENV_FILE}" || exit 1
APP_DOMAIN="$(read_env_var MMS_APP_DOMAIN '')"

curl_ok() {
  local url="$1"
  curl -fsS --connect-timeout 3 --max-time 8 "$url" >/dev/null 2>&1
}

report_setup_status() {
  local base="$1"
  local host="${2:-}"
  local status
  local code
  if [[ -n "$host" ]]; then
    code="$(curl -s -o /tmp/mms-setup.json -w '%{http_code}' \
      -H "Host: ${host}" -H "X-Forwarded-Host: ${host}" \
      "${base}/api/platform/auth/setup/status")"
    status="$(cat /tmp/mms-setup.json 2>/dev/null || echo '{}')"
  else
    code="$(curl -s -o /tmp/mms-setup.json -w '%{http_code}' \
      "${base}/api/platform/auth/setup/status")"
    status="$(cat /tmp/mms-setup.json 2>/dev/null || echo '{}')"
  fi
  echo "Platform setup status (HTTP ${code}): ${status}"
  if [[ "$code" == "403" ]]; then
    echo "ERROR: Platform apex misconfigured — set MMS_APP_DOMAIN to full hostname (e.g. mmsv2.aabtaab.com)"
    return 1
  fi
  if echo "${status}" | grep -q '"smtpConfigured":false'; then
    echo "WARNING: Platform email not configured — add PLATFORM_RESEND_API_KEY (or SMTP_*) and PLATFORM_EMAIL_FROM as GitHub Actions secrets"
  fi
  return 0
}

resolve_public_url() {
  local app_domain
  app_domain="$(read_env_var MMS_APP_DOMAIN '')"
  if [[ -n "$app_domain" ]]; then
    echo "https://${app_domain}"
  fi
}

LOCAL_BASE="http://127.0.0.1:${BACKEND_PORT}"
LOCAL_OK=false

if curl_local_backend_ok "${LOCAL_BASE}/health" "$APP_DOMAIN"; then
  echo "Backend health OK (port ${BACKEND_PORT})"
  LOCAL_OK=true
  if curl_local_backend_ok "${LOCAL_BASE}/ready" "$APP_DOMAIN"; then
    echo "Backend ready (database connected)"
  else
    echo "ERROR: /ready failed — check DATABASE_URL and database connection"
    LOCAL_OK=false
  fi
  if curl_local_backend_ok "${LOCAL_BASE}/" "$APP_DOMAIN"; then
    echo "SPA root OK on backend port ${BACKEND_PORT}"
  else
    echo "ERROR: backend / did not return SPA — check apps/frontend/dist in tarball"
    LOCAL_OK=false
  fi
fi

if [[ "$LOCAL_OK" == true ]]; then
  report_setup_status "$LOCAL_BASE" "$APP_DOMAIN" || LOCAL_OK=false
  PUBLIC_API_URL="$(resolve_public_url)"
  if [[ -z "$PUBLIC_API_URL" ]]; then
    echo "Local deploy OK (no MMS_APP_DOMAIN for public check)"
    exit 0
  fi
  echo "Trying public site: ${PUBLIC_API_URL}/"
  if curl_ok "${PUBLIC_API_URL}/health" && curl_ok "${PUBLIC_API_URL}/ready" && curl_ok "${PUBLIC_API_URL}/"; then
    echo "Public site OK"
    report_setup_status "$PUBLIC_API_URL" "$APP_DOMAIN" || exit 1
    if [[ -f "$ROOT_DIR/scripts/verify-tenant-hosts.sh" ]]; then
      bash "$ROOT_DIR/scripts/verify-tenant-hosts.sh" "" "$ENV_FILE" || exit 1
    fi
    exit 0
  fi
  echo "ERROR: public URL failed — Apache likely proxying to wrong port (run scripts/fix-apache-upstream.sh)"
  exit 1
fi

PUBLIC_API_URL="$(resolve_public_url)"
if [[ -n "$PUBLIC_API_URL" ]]; then
  echo "Trying public health: ${PUBLIC_API_URL}/health"
  if curl_ok "${PUBLIC_API_URL}/health" && curl_ok "${PUBLIC_API_URL}/ready" && curl_ok "${PUBLIC_API_URL}/"; then
    echo "Public site OK (local backend check failed — investigate ports)"
    report_setup_status "$PUBLIC_API_URL" "$APP_DOMAIN" || exit 1
    if [[ -f "$ROOT_DIR/scripts/verify-tenant-hosts.sh" ]]; then
      bash "$ROOT_DIR/scripts/verify-tenant-hosts.sh" "" "$ENV_FILE" || exit 1
    fi
    exit 0
  fi
fi

PM2_PID="$(pm2 pid mmsv2-backend 2>/dev/null || true)"
if [[ -n "$PM2_PID" && "$PM2_PID" != "0" ]]; then
  echo "ERROR: PM2 mmsv2-backend pid ${PM2_PID} but port ${BACKEND_PORT} did not respond"
  pm2 describe mmsv2-backend 2>/dev/null | head -20 || true
else
  echo "ERROR: mmsv2-backend not healthy and PM2 has no running pid"
fi

pm2 logs mmsv2-backend --lines 30 --nostream 2>/dev/null || true
pm2 logs mmsv2-frontend --lines 20 --nostream 2>/dev/null || true
exit 1
