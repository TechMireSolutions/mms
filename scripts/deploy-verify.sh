#!/usr/bin/env bash
# Post-deploy verification — warnings only; does not fail the deploy job.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-apps/backend/.env}"
BACKEND_PORT=3000

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

BACKEND_PORT="$(read_env_var PORT 3000)"

curl_health() {
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

LOCAL_OK=false
if curl_health "http://127.0.0.1:${BACKEND_PORT}/health" \
  || curl_health "http://localhost:${BACKEND_PORT}/health"; then
  LOCAL_OK=true
  echo "Backend health OK (port ${BACKEND_PORT})"
  if curl_health "http://127.0.0.1:${BACKEND_PORT}/ready"; then
    echo "Backend ready (database connected)"
  else
    echo "WARNING: /ready failed — check DATABASE_URL and PostgreSQL"
  fi
  report_setup_status "http://127.0.0.1:${BACKEND_PORT}"
  exit 0
fi

PUBLIC_API_URL="${MMS_API_URL:-}"
if [[ -z "$PUBLIC_API_URL" ]]; then
  PUBLIC_API_URL="$(read_env_var MMS_API_URL '')"
fi
if [[ -z "$PUBLIC_API_URL" && -n "${MMS_APP_DOMAIN:-}" ]]; then
  PUBLIC_API_URL="https://${MMS_APP_DOMAIN}"
fi
if [[ -z "$PUBLIC_API_URL" ]]; then
  PUBLIC_API_URL="$(read_env_var MMS_APP_DOMAIN '')"
  if [[ -n "$PUBLIC_API_URL" && "$PUBLIC_API_URL" != http* ]]; then
    PUBLIC_API_URL="https://${PUBLIC_API_URL}"
  fi
fi

if [[ -n "$PUBLIC_API_URL" ]]; then
  PUBLIC_API_URL="${PUBLIC_API_URL%/}"
  echo "Trying public health: ${PUBLIC_API_URL}/health"
  if curl_health "${PUBLIC_API_URL}/health"; then
    echo "Public API health OK"
    report_setup_status "${PUBLIC_API_URL}"
    exit 0
  fi
fi

PM2_PID="$(pm2 pid mmsv2-backend 2>/dev/null || true)"
if [[ -n "$PM2_PID" && "$PM2_PID" != "0" ]]; then
  echo "WARNING: PM2 mmsv2-backend pid ${PM2_PID} but /health on port ${BACKEND_PORT} did not respond"
  pm2 describe mmsv2-backend 2>/dev/null | head -20 || true
else
  echo "WARNING: mmsv2-backend not healthy and PM2 has no running pid"
fi

pm2 logs mmsv2-backend --lines 30 --nostream 2>/dev/null || true
pm2 logs mmsv2-frontend --lines 20 --nostream 2>/dev/null || true
exit 1
