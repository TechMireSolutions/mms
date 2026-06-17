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
