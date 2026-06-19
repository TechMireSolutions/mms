#!/usr/bin/env bash
# PostgreSQL backup for MMS — schedule via cron (daily 03:00 recommended).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${MMS_DEPLOY_ENV:-${ROOT_DIR}/apps/backend/.env}"
BACKUP_DIR="${MMS_BACKUP_DIR:-${ROOT_DIR}/.backups/postgres}"
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

DATABASE_URL="$(read_env_var DATABASE_URL 'postgresql://postgres@localhost:5432/mms')"
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/mms-${STAMP}.sql.gz"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found"
  exit 1
fi

pg_dump "$DATABASE_URL" | gzip -9 > "$OUT"
echo "Backup written: ${OUT} ($(du -h "$OUT" | cut -f1))"

find "$BACKUP_DIR" -name 'mms-*.sql.gz' -type f -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
