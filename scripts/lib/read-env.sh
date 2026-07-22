# Sourced by backup/restore/deploy scripts — not executed directly.
# Provides a shared, robust helper for reading environment variables from .env files.

read_env_var() {
  local key="$1"
  local default="${2:-}"
  local env_file="${3:-${ENV_FILE:-}}"

  if [[ -z "$env_file" || ! -f "$env_file" ]]; then
    echo "$default"
    return 0
  fi
  local line
  line="$(grep -E "^${key}=" "$env_file" 2>/dev/null | tail -1 || true)"
  if [[ -z "$line" ]]; then
    echo "$default"
    return 0
  fi
  local value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  echo "$value"
}
