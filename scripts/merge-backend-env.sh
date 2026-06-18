#!/usr/bin/env bash
# Merges deploy-time environment variables into apps/backend/.env (used by CI SSH deploy).
# Only overwrites keys present in the runner environment; existing JWT_SECRET / DATABASE_URL are kept.
set -euo pipefail

ENV_FILE="${1:-apps/backend/.env}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p "$(dirname "$ENV_FILE")"
touch "$ENV_FILE"

DEPLOY_KEYS=(
  NODE_ENV
  PLATFORM_RESEND_API_KEY
  PLATFORM_SMTP_HOST
  PLATFORM_SMTP_PORT
  PLATFORM_SMTP_SECURE
  PLATFORM_SMTP_USER
  PLATFORM_SMTP_PASS
  PLATFORM_EMAIL_FROM
  PLATFORM_EMAIL_FROM_NAME
  PLATFORM_APP_URL
  PLATFORM_ALLOW_ENV_BOOTSTRAP
  PLATFORM_ADMIN_EMAIL
  PLATFORM_ADMIN_PASSWORD
  PLATFORM_ADMIN_NAME
  MMS_APP_DOMAIN
  MMS_API_URL
)

write_env_var() {
  local key="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    return 0
  fi

  local tmp="${ENV_FILE}.tmp.$$"
  if [[ -f "$ENV_FILE" ]]; then
    grep -v "^${key}=" "$ENV_FILE" >"$tmp" 2>/dev/null || : >"$tmp"
  else
    : >"$tmp"
  fi

  local escaped="${value//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  printf '%s="%s"\n' "$key" "$escaped" >>"$tmp"
  mv "$tmp" "$ENV_FILE"
}

for key in "${DEPLOY_KEYS[@]}"; do
  write_env_var "$key" "${!key-}"
done

# Always force production mode on the server.
write_env_var "NODE_ENV" "production"

# Ensure JWT_SECRET exists and is at least 32 chars (required in production).
# Never overwrites a secret that is already long enough.
ensure_jwt_secret() {
  local current
  current="$(grep '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null | tail -1 || true)"
  current="${current#JWT_SECRET=}"
  current="${current%\"}"
  current="${current#\"}"
  if [[ ${#current} -ge 32 ]]; then
    return 0
  fi
  local new_secret
  new_secret="$(openssl rand -hex 32 2>/dev/null \
    || head -c 32 /dev/urandom | base64 | tr -d '\n/+=' | head -c 64)"
  write_env_var "JWT_SECRET" "$new_secret"
  echo "Generated new JWT_SECRET (previous was absent or shorter than 32 chars)"
}
ensure_jwt_secret

# Production always listens on :5002 (Apache upstream).
# shellcheck source=lib/deploy-ports.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-ports.sh"
write_env_var "PORT" "$MMS_PROD_BACKEND_PORT"

if [ -z "${PLATFORM_APP_URL:-}" ] && [ -n "${MMS_APP_DOMAIN:-}" ]; then
  write_env_var "PLATFORM_APP_URL" "https://${MMS_APP_DOMAIN}"
fi

echo "Merged deploy env keys into ${ENV_FILE}"
set +e
HAS_PROVIDER=$(grep -E '^PLATFORM_(RESEND_API_KEY|SMTP_HOST)=' "$ENV_FILE" 2>/dev/null | head -1)
HAS_FROM=$(grep '^PLATFORM_EMAIL_FROM=' "$ENV_FILE" 2>/dev/null | head -1)
set -e
if [ -n "$HAS_PROVIDER" ] && [ -n "$HAS_FROM" ]; then
  echo "Platform email: configured in ${ENV_FILE}"
else
  echo "WARNING: Platform email not in ${ENV_FILE} — add PLATFORM_RESEND_API_KEY (or SMTP_*) and PLATFORM_EMAIL_FROM as GitHub Actions secrets"
fi
if ! grep -q '^MMS_APP_DOMAIN=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "WARNING: MMS_APP_DOMAIN missing in ${ENV_FILE} — set to your apex domain (e.g. mms.example.com)"
fi
