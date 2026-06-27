#!/usr/bin/env bash
# PostgreSQL restore script for MMS.
# Restores a gzipped (.gz) sql backup.
#
# Usage:
#   bash scripts/production/restore-postgres.sh /path/to/backup.sql.gz
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${MMS_DEPLOY_ENV:-${ROOT_DIR}/apps/backend/.env}"

# 1. Parse input arguments
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <path-to-backup-file>"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found at ${BACKUP_FILE}"
  exit 1
fi

# 2. Read database configuration
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

DATABASE_URL="$(read_env_var DATABASE_URL 'postgres://postgres:postgres@localhost:5432/mms')"

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql CLI not found. Please install postgresql-client."
  exit 1
fi

# 3. Stop PM2 service to prevent concurrent write transactions
PM2_PROCESS="mmsv2-backend"
PM2_STOPPED=false

# Load NVM if present so PM2 is in PATH
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
fi

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_PROCESS" >/dev/null 2>&1; then
    echo "Stopping PM2 process: ${PM2_PROCESS}..."
    pm2 stop "$PM2_PROCESS"
    PM2_STOPPED=true
  fi
else
  echo "WARNING: PM2 not found. Continuing without stopping PM2."
fi

# 4. Clean target database schema to ensure clean restore
echo "Cleaning schema 'public' in PostgreSQL database..."
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 5. Perform the restore
echo "Restoring PostgreSQL database from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" > /dev/null
else
  psql "$DATABASE_URL" < "$BACKUP_FILE" > /dev/null
fi

# 6. Restart PM2 backend process if stopped
if [[ "$PM2_STOPPED" == "true" ]]; then
  echo "Restarting PM2 process: ${PM2_PROCESS}..."
  pm2 start "$PM2_PROCESS"
fi

echo "Database restore completed successfully!"
