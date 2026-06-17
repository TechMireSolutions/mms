#!/usr/bin/env bash
# Point Apache ProxyPass for MMS_APP_DOMAIN at the Fastify backend (default :3000).
set -euo pipefail

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
APP_DOMAIN="$(read_env_var MMS_APP_DOMAIN '')"
if [[ -z "$APP_DOMAIN" && -n "${MMS_APP_DOMAIN:-}" ]]; then
  APP_DOMAIN="${MMS_APP_DOMAIN}"
fi

if ! command -v apache2ctl >/dev/null 2>&1; then
  echo "Apache not installed — skip upstream patch"
  exit 0
fi

run_priv() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "WARNING: need root/sudo to patch Apache — run manually on the server"
    exit 0
  fi
}

UPSTREAM="http://127.0.0.1:${BACKEND_PORT}/"
PATCHED=false

for conf in /etc/apache2/sites-enabled/*; do
  [[ -f "$conf" ]] || continue
  if [[ -n "$APP_DOMAIN" ]] && ! grep -q "$APP_DOMAIN" "$conf" 2>/dev/null; then
    continue
  fi
  if grep -q "ProxyPass" "$conf" 2>/dev/null; then
    echo "Patching ProxyPass in ${conf} → ${UPSTREAM}"
    run_priv sed -i \
      -E "s|ProxyPass / http://127\\.0\\.0\\.1:[0-9]+/|ProxyPass / ${UPSTREAM}|g" \
      "$conf"
    run_priv sed -i \
      -E "s|ProxyPassReverse / http://127\\.0\\.0\\.1:[0-9]+/|ProxyPassReverse / ${UPSTREAM}|g" \
      "$conf"
    PATCHED=true
  fi
done

if [[ "$PATCHED" != true ]]; then
  echo "No Apache ProxyPass vhost found for ${APP_DOMAIN:-MMS} — see scripts/apache/mmsv2-vhost.conf.template"
  exit 0
fi

run_priv apache2ctl configtest
run_priv systemctl reload apache2
echo "Apache reloaded — upstream is ${UPSTREAM}"
