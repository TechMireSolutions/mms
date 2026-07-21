#!/usr/bin/env bash
# Remove MMS backend ProxyPass from Apache vhosts that are NOT for MMS_APP_DOMAIN.
# Fixes cases where aabtaab.com / darulquran.pk incorrectly proxy to :5002.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=../lib/deploy-ports.sh
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
  # Strip carriage returns and leading/trailing whitespace
  value="$(echo -n "$value" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  echo "$value"
}

APP_DOMAIN="$(read_env_var MMS_APP_DOMAIN "${MMS_APP_DOMAIN:-}")"
BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"

if [[ -z "$APP_DOMAIN" ]]; then
  echo "WARNING: MMS_APP_DOMAIN unset — skip Apache isolation"
  exit 0
fi

if ! command -v apache2ctl >/dev/null 2>&1; then
  echo "Apache not installed — skip isolation"
  exit 0
fi

run_priv() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "ERROR: need root/sudo"
    exit 1
  fi
}

MMS_PORTS="${BACKEND_PORT}"
STRIPPED=false

for conf in /etc/apache2/sites-enabled/*; do
  [[ -f "$conf" ]] || continue
  if grep -F -q "$APP_DOMAIN" "$conf" 2>/dev/null; then
    echo "MMS vhost (keep): ${conf}"
    continue
  fi
  if ! grep -qE "ProxyPass(Reverse)?[[:space:]]+/[[:space:]]+http://(127\\.0\\.0\\.1|localhost):(${MMS_PORTS})" "$conf" 2>/dev/null; then
    continue
  fi
  echo "Stripping MMS ProxyPass from non-MMS vhost: ${conf}"
  run_priv sed -i -E \
    "/ProxyPass(Reverse)?[[:space:]]+\\/[[:space:]]+http:\\/\\/(127\\.0\\.0\\.1|localhost):(${MMS_PORTS})/d" \
    "$conf"
  STRIPPED=true
done

if [[ "$STRIPPED" == true ]]; then
  run_priv apache2ctl configtest
  run_priv systemctl reload apache2
  echo "Apache reloaded — MMS proxy removed from other domains"
else
  echo "No foreign vhosts proxying MMS ports"
fi

if [[ -n "$APP_DOMAIN" ]]; then
  for conf in /etc/apache2/sites-enabled/*; do
    [[ -f "$conf" ]] || continue
    if grep -F -q "$APP_DOMAIN" "$conf" 2>/dev/null; then
      continue
    fi
    if grep -qE 'ServerAlias[[:space:]]+\*' "$conf" 2>/dev/null \
      && grep -q ':443' "$conf" 2>/dev/null; then
      echo "WARNING: ${conf} has wildcard ServerAlias on :443 — may steal tenant SNI if MMS lacks *.${APP_DOMAIN} TLS"
    fi
  done
fi
