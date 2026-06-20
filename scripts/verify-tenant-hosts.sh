#!/usr/bin/env bash
# Verify tenant subdomain routing (DNS, TLS, Apache, workspace API).
# Usage: bash scripts/verify-tenant-hosts.sh [subdomain] [apps/backend/.env]
#   subdomain optional — when omitted, uses first entry from workspace registry.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"
# shellcheck source=lib/curl-local-backend.sh
source "$ROOT_DIR/scripts/lib/curl-local-backend.sh"

SUBDOMAIN="${1:-}"
ENV_FILE="${2:-apps/backend/.env}"
FAIL=0

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

warn() { echo "WARNING: $*"; }
fail() { echo "ERROR: $*"; FAIL=1; }
ok() { echo "OK: $*"; }

BACKEND_PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"
APP_DOMAIN="$(read_env_var MMS_APP_DOMAIN '')"
LOCAL="http://127.0.0.1:${BACKEND_PORT}"

echo "══ Tenant host verification ══"
echo "MMS_APP_DOMAIN: ${APP_DOMAIN:-<not set>}"
echo "Backend: ${LOCAL}"
echo ""

if [[ -z "$APP_DOMAIN" ]]; then
  fail "MMS_APP_DOMAIN missing in ${ENV_FILE} — set full apex hostname (e.g. mmsv2.example.com)"
  exit 1
fi

dot_count="$(printf '%s' "$APP_DOMAIN" | tr -cd '.' | wc -c | tr -d ' ')"
if [[ "$dot_count" -lt 2 ]]; then
  warn "MMS_APP_DOMAIN=${APP_DOMAIN} has only ${dot_count} dot(s) — use full platform host (e.g. mmsv2.yourdomain.com)"
fi

# ── DNS ──────────────────────────────────────────────────────────────────────
echo "── DNS ──"
if command -v dig >/dev/null 2>&1; then
  APEX_IP="$(dig +short "$APP_DOMAIN" A 2>/dev/null | head -1 || true)"
  if [[ -n "$APEX_IP" ]]; then
    ok "A ${APP_DOMAIN} → ${APEX_IP}"
  else
    fail "No A record for ${APP_DOMAIN}"
  fi

  PROBE="tenant-dns-probe-${RANDOM}.${APP_DOMAIN}"
  WILD_IP="$(dig +short "$PROBE" A 2>/dev/null | head -1 || true)"
  if [[ -n "$WILD_IP" ]]; then
    ok "Wildcard DNS resolves (${PROBE} → ${WILD_IP})"
  else
    fail "Wildcard DNS missing — add *.${APP_DOMAIN} A (or CNAME) → same server as apex"
    echo "       Without this, {slug}.${APP_DOMAIN} never reaches Apache."
  fi
else
  warn "dig not installed — skip DNS checks"
fi
echo ""

# ── Apache vhost ─────────────────────────────────────────────────────────────
echo "── Apache ──"
VHOST=""
for candidate in /etc/apache2/sites-enabled/000-mmsv2.conf /etc/apache2/sites-enabled/mmsv2.conf; do
  if [[ -f "$candidate" ]]; then
    VHOST="$candidate"
    break
  fi
done
if [[ -n "$VHOST" ]]; then
  if grep -q "ServerAlias \\*\\.${APP_DOMAIN}" "$VHOST" 2>/dev/null \
    || grep -q "ServerAlias \*\.${APP_DOMAIN}" "$VHOST" 2>/dev/null; then
    ok "$(basename "$VHOST") has ServerAlias *.${APP_DOMAIN}"
  else
    fail "$(basename "$VHOST") missing ServerAlias *.${APP_DOMAIN} — run: bash scripts/apache/install-mms-vhost.sh ${ENV_FILE}"
  fi
else
  fail "Missing MMS Apache vhost — run: bash scripts/apply-production-host-isolation.sh ${ENV_FILE}"
fi
echo ""

# ── Workspace registry ───────────────────────────────────────────────────────
echo "── Workspaces ──"
REGISTRY="$(curl_local_backend "${LOCAL}/api/workspace/registry" "$APP_DOMAIN" 2>/dev/null || true)"
if [[ -z "$REGISTRY" ]]; then
  fail "GET /api/workspace/registry failed — is backend running on :${BACKEND_PORT}?"
else
  ok "Workspace registry reachable"
  if [[ -z "$SUBDOMAIN" ]]; then
    SUBDOMAIN="$(printf '%s' "$REGISTRY" | grep -oE '"subdomain":"[a-z0-9-]+"' | head -1 | cut -d'"' -f4 || true)"
  fi
  if [[ -z "$SUBDOMAIN" ]]; then
    warn "No tenants in registry yet — create a madrasa on https://${APP_DOMAIN}/ first"
  else
    echo "Checking tenant slug: ${SUBDOMAIN}"
  fi
fi
echo ""

if [[ -n "$SUBDOMAIN" ]]; then
  TENANT_HOST="${SUBDOMAIN}.${APP_DOMAIN}"
  echo "── API (tenant host headers) ──"
  CODE="$(curl -s -o /tmp/mms-tenant-ws.json -w '%{http_code}' \
    -H "Host: ${TENANT_HOST}" -H "X-Forwarded-Host: ${TENANT_HOST}" \
    "${LOCAL}/api/workspace/by-subdomain/${SUBDOMAIN}")"
  if [[ "$CODE" == "200" ]]; then
    ok "GET /api/workspace/by-subdomain/${SUBDOMAIN} → 200 (with tenant Host)"
  else
    fail "GET /api/workspace/by-subdomain/${SUBDOMAIN} → HTTP ${CODE} (expected 200)"
    head -c 400 /tmp/mms-tenant-ws.json 2>/dev/null || true
    echo ""
  fi
  echo ""

  echo "── Public HTTPS ──"
  PUB_HDR="$(curl -sI --connect-timeout 5 --max-time 15 "https://${TENANT_HOST}/" 2>/dev/null || true)"
  PUB_CODE="$(printf '%s' "$PUB_HDR" | head -1 | awk '{print $2}')"
  if echo "$PUB_HDR" | grep -qi 'X-Redirect-By: Moodle'; then
    fail "https://${TENANT_HOST}/ is served by Moodle (wrong Apache SSL vhost)"
    echo "       Fix: bash scripts/production/fix-tenant-tls-wildcard.sh ${ENV_FILE}"
    echo "       Issue wildcard cert: *.${APP_DOMAIN} via certbot DNS challenge"
  elif [[ "$PUB_CODE" == "200" ]]; then
    ok "https://${TENANT_HOST}/ → HTTP 200"
  elif [[ -z "$PUB_CODE" ]]; then
    fail "https://${TENANT_HOST}/ unreachable (DNS, firewall, or TLS)"
    echo "       Common fix: wildcard cert — certbot DNS challenge for *.${APP_DOMAIN}"
  else
    fail "https://${TENANT_HOST}/ → HTTP ${PUB_CODE}"
  fi

  if command -v openssl >/dev/null 2>&1; then
    echo ""
    echo "── TLS certificate ──"
    CERT_SAN="$(echo | openssl s_client -servername "${TENANT_HOST}" -connect "${APP_DOMAIN}:443" 2>/dev/null \
      | openssl x509 -noout -text 2>/dev/null | grep -E 'DNS:' || true)"
    if echo "$CERT_SAN" | grep -qF "DNS:*.${APP_DOMAIN}" || echo "$CERT_SAN" | grep -qF "DNS:${TENANT_HOST}"; then
      ok "Certificate covers ${TENANT_HOST} or *.${APP_DOMAIN}"
    else
      fail "Certificate does not cover tenant subdomains (Apache may route to Moodle/default site)"
      echo "       SANs: ${CERT_SAN:-<could not read>}"
      echo "       Run: bash scripts/production/fix-tenant-tls-wildcard.sh ${ENV_FILE}"
    fi
  fi

  echo ""
  echo "Tenant login URL: https://${TENANT_HOST}/login"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "Tenant host checks passed."
  exit 0
fi
echo "Tenant host checks failed — fix errors above."
exit 1
