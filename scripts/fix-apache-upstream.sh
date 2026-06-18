#!/usr/bin/env bash
# Point Apache ProxyPass at the Fastify backend (default :5002). Requires root/sudo.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

ENV_FILE="${1:-apps/backend/.env}"

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
    echo "ERROR: need root/sudo to patch Apache"
    exit 1
  fi
}

UPSTREAM="http://127.0.0.1:${BACKEND_PORT}/"
PATCHED=false

patch_proxy_in_file() {
  local conf="$1"
  if ! grep -q "ProxyPass" "$conf" 2>/dev/null; then
    return 1
  fi
  echo "Patching ProxyPass in ${conf} → ${UPSTREAM}"
  run_priv sed -i -E \
    "s#(ProxyPass(Reverse)?[[:space:]]+/[[:space:]]+)http://(127\\.0\\.0\\.1|localhost):[0-9]+/?#\1${UPSTREAM}#g" \
    "$conf"
  return 0
}

should_patch_file() {
  local conf="$1"
  # Only patch vhosts for MMS_APP_DOMAIN — never other sites (aabtaab.com, darulquran.pk, …).
  if [[ -n "$APP_DOMAIN" ]] && grep -q "$APP_DOMAIN" "$conf" 2>/dev/null; then
    return 0
  fi
  return 1
}

for conf in /etc/apache2/sites-enabled/*; do
  [[ -f "$conf" ]] || continue
  if should_patch_file "$conf" && patch_proxy_in_file "$conf"; then
    PATCHED=true
  fi
done

if [[ "$PATCHED" != true ]]; then
  echo "ERROR: no Apache ProxyPass vhost patched for ${APP_DOMAIN:-MMS}"
  echo "Check: grep -r ProxyPass /etc/apache2/sites-enabled/"
  echo "Template: scripts/apache/mmsv2-vhost.conf.template"
  exit 1
fi

run_priv a2enmod proxy proxy_http headers ssl 2>/dev/null || true
run_priv apache2ctl configtest
run_priv systemctl reload apache2
echo "Apache reloaded — upstream is ${UPSTREAM}"
