#!/usr/bin/env bash
# SQLite backup for MMS — schedule via cron (daily 03:00 recommended).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${MMS_DEPLOY_ENV:-${ROOT_DIR}/apps/backend/.env}"
BACKUP_DIR="${MMS_BACKUP_DIR:-${ROOT_DIR}/.backups/sqlite}"
RETENTION_DAYS="${MMS_BACKUP_RETENTION_DAYS:-14}"

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

DATABASE_URL="$(read_env_var DATABASE_URL 'sqlite://mms.db')"
mkdir -p "$BACKUP_DIR"

# Resolve relative path for SQLite
DB_FILE="${DATABASE_URL#sqlite://}"
if [[ "$DB_FILE" != /* ]]; then
  if [[ -f "${ROOT_DIR}/${DB_FILE}" ]]; then
    DB_FILE="${ROOT_DIR}/${DB_FILE}"
  else
    DB_FILE="${ROOT_DIR}/apps/backend/${DB_FILE}"
  fi
fi

if [[ ! -f "$DB_FILE" ]]; then
  echo "ERROR: SQLite database file not found at ${DB_FILE}"
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/mms-${STAMP}.db"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "WARNING: sqlite3 CLI not found, performing standard copy backup"
  cp "$DB_FILE" "$OUT"
else
  sqlite3 "$DB_FILE" ".backup '$OUT'"
fi

gzip -9 "$OUT"
GZ_OUT="${OUT}.gz"
echo "Backup written: ${GZ_OUT} ($(du -h "$GZ_OUT" | cut -f1))"

find "$BACKUP_DIR" -name 'mms-*.db.gz' -type f -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
