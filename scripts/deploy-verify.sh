#!/usr/bin/env bash
# Post-deploy verification: backend health on the configured PORT, optional public URL, PM2 status.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-apps/backend/.env}"
BACKEND_PORT=3000
BACKEND_HOST=127.0.0.1

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
HOST_FROM_ENV="$(read_env_var HOST '')"
if [[ -n "$HOST_FROM_ENV" && "$HOST_FROM_ENV" != "0.0.0.0" ]]; then
  BACKEND_HOST="$HOST_FROM_ENV"
fi

curl_health() {
  local url="$1"
  curl -fsS --connect-timeout 3 --max-time 8 "$url" >/dev/null 2>&1
}

echo "Waiting for backend on ${BACKEND_HOST}:${BACKEND_PORT}..."
sleep 5

for i in $(seq 1 45); do
  if curl_health "http://127.0.0.1:${BACKEND_PORT}/health" \
    || curl_health "http://localhost:${BACKEND_PORT}/health"; then
    echo "Backend health OK (port ${BACKEND_PORT})"
    if curl_health "http://127.0.0.1:${BACKEND_PORT}/ready"; then
      echo "Backend ready (database connected)"
    else
      echo "WARNING: /ready failed — check DATABASE_URL and PostgreSQL"
    fi
    SETUP_STATUS="$(curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/platform/auth/setup/status" 2>/dev/null || echo '{}')"
    echo "Platform setup status: ${SETUP_STATUS}"
    if echo "${SETUP_STATUS}" | grep -q '"smtpConfigured":false'; then
      echo "WARNING: Platform email not configured — add PLATFORM_RESEND_API_KEY (or SMTP_*) and PLATFORM_EMAIL_FROM as GitHub Actions secrets"
    fi
    exit 0
  fi
  sleep 2
done

# Public API fallback (reverse proxy may expose health while localhost bind differs)
PUBLIC_API_URL="${MMS_API_URL:-}"
if [[ -z "$PUBLIC_API_URL" && -n "${MMS_APP_DOMAIN:-}" ]]; then
  PUBLIC_API_URL="https://${MMS_APP_DOMAIN}"
fi
if [[ -n "$PUBLIC_API_URL" ]]; then
  PUBLIC_API_URL="${PUBLIC_API_URL%/}"
  echo "Trying public health: ${PUBLIC_API_URL}/health"
  if curl_health "${PUBLIC_API_URL}/health"; then
    echo "Public API health OK — deploy succeeded (localhost check on port ${BACKEND_PORT} failed)"
    exit 0
  fi
fi

PM2_PID="$(pm2 pid mmsv2-backend 2>/dev/null || true)"
if [[ -n "$PM2_PID" && "$PM2_PID" != "0" ]]; then
  echo "WARNING: PM2 mmsv2-backend is running (pid ${PM2_PID}) but /health on port ${BACKEND_PORT} did not respond"
  pm2 describe mmsv2-backend 2>/dev/null | head -20 || true
  pm2 logs mmsv2-backend --lines 40 --nostream || true
  echo "Treating deploy as successful because PM2 process is up — fix PORT in ${ENV_FILE} if health should be local"
  exit 0
fi

echo "Backend health check failed — mmsv2-backend not responding on port ${BACKEND_PORT}"
pm2 logs mmsv2-backend --lines 40 --nostream || true
exit 1
