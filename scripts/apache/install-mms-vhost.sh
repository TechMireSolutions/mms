#!/usr/bin/env bash
# Install Apache vhost for MMS_APP_DOMAIN only (apex + *.domain → :5002).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=../lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

ENV_FILE="${1:-apps/backend/.env}"
TEMPLATE="$ROOT_DIR/scripts/apache/mmsv2-vhost.conf.template"
# 000- prefix: load before Moodle/default SSL vhosts when SNI matching fails.
TARGET="/etc/apache2/sites-available/000-mmsv2.conf"
LEGACY_TARGET="/etc/apache2/sites-available/mmsv2.conf"

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
  echo "ERROR: MMS_APP_DOMAIN required"
  exit 1
fi

if ! command -v apache2ctl >/dev/null 2>&1; then
  echo "Apache not installed — skip vhost install"
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

TMP="$(mktemp)"
sed \
  -e "s/@@MMS_APP_DOMAIN@@/${APP_DOMAIN}/g" \
  -e "s/@@BACKEND_PORT@@/${BACKEND_PORT}/g" \
  "$TEMPLATE" >"$TMP"

CERT_DIR="/etc/letsencrypt/live/${APP_DOMAIN}"
if [[ -d "$CERT_DIR" ]]; then
  {
    echo ""
    echo "    SSLCertificateFile ${CERT_DIR}/fullchain.pem"
    echo "    SSLCertificateKeyFile ${CERT_DIR}/privkey.pem"
  } >>"$TMP"
  if command -v openssl >/dev/null 2>&1; then
    CERT_SANS="$(openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -ext subjectAltName 2>/dev/null || true)"
    if ! echo "$CERT_SANS" | grep -qF "DNS:*.${APP_DOMAIN}"; then
      if echo "$CERT_SANS" | grep -qF ".${APP_DOMAIN}"; then
        echo "WARNING: cert lacks wildcard DNS:*.${APP_DOMAIN} (named tenant SANs only)"
        echo "         Registered tenants work; new madrasas need: certbot --expand --apache -d slug.${APP_DOMAIN}"
      else
        echo "ERROR: cert at ${CERT_DIR} lacks DNS:*.${APP_DOMAIN}"
        echo "       Tenant subdomains will route to the default SSL site (e.g. Moodle → edu.aabtaab.com)."
        echo "       Fix: bash scripts/production/fix-tenant-tls-wildcard.sh ${ENV_FILE}"
      fi
      if [[ "${MMS_REQUIRE_WILDCARD_TLS:-}" == "1" ]]; then
        exit 1
      fi
    fi
  fi
else
  echo "WARNING: no cert at ${CERT_DIR} — edit SSL paths in ${TARGET} after certbot"
fi

echo "Installing ${TARGET} for ${APP_DOMAIN} → :${BACKEND_PORT}"
run_priv cp "$TMP" "$TARGET"
rm -f "$TMP"

run_priv a2dissite mmsv2.conf z-mmsv2.conf 2>/dev/null || true
run_priv rm -f /etc/apache2/sites-enabled/mmsv2.conf /etc/apache2/sites-enabled/z-mmsv2.conf 2>/dev/null || true
run_priv rm -f /etc/apache2/sites-enabled/000-mmsv2.conf 2>/dev/null || true
run_priv a2ensite 000-mmsv2.conf 2>/dev/null || true
run_priv a2enmod proxy proxy_http headers ssl rewrite 2>/dev/null || true
run_priv apache2ctl configtest
run_priv systemctl reload apache2
if [[ -f /etc/apache2/sites-enabled/000-mmsv2.conf ]] \
  && grep -F -q "ServerAlias *.${APP_DOMAIN}" /etc/apache2/sites-enabled/000-mmsv2.conf 2>/dev/null; then
  echo "MMS vhost enabled — ${APP_DOMAIN} and *.${APP_DOMAIN} → :${BACKEND_PORT}"
else
  echo "WARNING: 000-mmsv2.conf missing ServerAlias *.${APP_DOMAIN} on :443"
fi
