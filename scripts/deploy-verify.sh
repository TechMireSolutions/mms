#!/usr/bin/env bash
# Post-deploy verification — fails when local or public site is unreachable.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

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
  echo "$value"
}

BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"

curl_ok() {
  local url="$1"
  curl -fsS --connect-timeout 3 --max-time 8 "$url" >/dev/null 2>&1
}

report_setup_status() {
  local base="$1"
  local status
  status="$(curl -fsS "${base}/api/platform/auth/setup/status" 2>/dev/null || echo '{}')"
  echo "Platform setup status: ${status}"
  if echo "${status}" | grep -q '"smtpConfigured":false'; then
    echo "WARNING: Platform email not configured — add PLATFORM_RESEND_API_KEY (or SMTP_*) and PLATFORM_EMAIL_FROM as GitHub Actions secrets"
  fi
}

resolve_public_url() {
  local url="${MMS_API_URL:-}"
  if [[ -z "$url" ]]; then
    url="$(read_env_var MMS_API_URL '')"
  fi
  if [[ -z "$url" && -n "${MMS_APP_DOMAIN:-}" ]]; then
    url="https://${MMS_APP_DOMAIN}"
  fi
  if [[ -z "$url" ]]; then
    url="$(read_env_var MMS_APP_DOMAIN '')"
    if [[ -n "$url" && "$url" != http* ]]; then
      url="https://${url}"
    fi
  fi
  echo "${url%/}"
}

LOCAL_BASE="http://127.0.0.1:${BACKEND_PORT}"
LOCAL_OK=false

if curl_ok "${LOCAL_BASE}/health"; then
  echo "Backend health OK (port ${BACKEND_PORT})"
  LOCAL_OK=true
  if curl_ok "${LOCAL_BASE}/ready"; then
    echo "Backend ready (database connected)"
  else
    echo "WARNING: /ready failed — check DATABASE_URL and PostgreSQL"
  fi
  if curl_ok "${LOCAL_BASE}/"; then
    echo "SPA root OK on backend port ${BACKEND_PORT}"
  else
    echo "ERROR: backend / did not return SPA — check apps/frontend/dist in tarball"
    LOCAL_OK=false
  fi
fi

if [[ "$LOCAL_OK" == true ]]; then
  report_setup_status "$LOCAL_BASE"
  PUBLIC_API_URL="$(resolve_public_url)"
  if [[ -z "$PUBLIC_API_URL" ]]; then
    echo "Local deploy OK (no MMS_APP_DOMAIN for public check)"
    exit 0
  fi
  echo "Trying public site: ${PUBLIC_API_URL}/"
  if curl_ok "${PUBLIC_API_URL}/health" && curl_ok "${PUBLIC_API_URL}/"; then
    echo "Public site OK"
    report_setup_status "$PUBLIC_API_URL"
    exit 0
  fi
  echo "ERROR: public URL failed — Apache likely proxying to wrong port (run scripts/fix-apache-upstream.sh)"
  exit 1
fi

PUBLIC_API_URL="$(resolve_public_url)"
if [[ -n "$PUBLIC_API_URL" ]]; then
  echo "Trying public health: ${PUBLIC_API_URL}/health"
  if curl_ok "${PUBLIC_API_URL}/health" && curl_ok "${PUBLIC_API_URL}/"; then
    echo "Public site OK (local backend check failed — investigate ports)"
    report_setup_status "$PUBLIC_API_URL"
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
