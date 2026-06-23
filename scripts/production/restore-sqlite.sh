#!/usr/bin/env bash
# SQLite restore script for MMS.
# Restores a gzipped (.gz) or uncompressed SQLite backup.
#
# Usage:
#   bash scripts/production/restore-sqlite.sh /path/to/backup.db.gz
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

DATABASE_URL="$(read_env_var DATABASE_URL 'sqlite://mms.db')"

# Resolve relative path for SQLite
DB_FILE="${DATABASE_URL#sqlite://}"
if [[ "$DB_FILE" != /* ]]; then
  if [[ -f "${ROOT_DIR}/${DB_FILE}" ]]; then
    DB_FILE="${ROOT_DIR}/${DB_FILE}"
  else
    DB_FILE="${ROOT_DIR}/apps/backend/${DB_FILE}"
  fi
fi

echo "Target database file: ${DB_FILE}"

# 3. Create a temporary file for extraction and validation
TEMP_DB="$(mktemp /tmp/mms-restore.XXXXXX.db)"
trap 'rm -f "$TEMP_DB"' EXIT

# Extract backup to temporary location
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Extracting gzipped backup..."
  gunzip -c "$BACKUP_FILE" > "$TEMP_DB"
else
  echo "Copying backup to temporary file..."
  cp "$BACKUP_FILE" "$TEMP_DB"
fi

# 4. Verify database integrity
if command -v sqlite3 >/dev/null 2>&1; then
  echo "Verifying backup database integrity..."
  INTEGRITY=$(sqlite3 "$TEMP_DB" "PRAGMA integrity_check;")
  if [[ "$INTEGRITY" != "ok" ]]; then
    echo "ERROR: Backup database is corrupted (integrity check failed: $INTEGRITY)"
    exit 1
  fi
  echo "Database integrity: OK"
else
  echo "WARNING: sqlite3 CLI not installed. Skipping integrity verification."
fi

# 5. Stop PM2 service to prevent concurrent write corruption
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

# 6. Delete WAL and SHM files to avoid journal recovery mismatch
DB_WAL="${DB_FILE}-wal"
DB_SHM="${DB_FILE}-shm"

echo "Removing WAL and SHM journal sidecar files..."
rm -f "$DB_WAL" "$DB_SHM"

# 7. Perform the restore by overwriting the target database file
echo "Overwriting target database..."
mkdir -p "$(dirname "$DB_FILE")"
cp "$TEMP_DB" "$DB_FILE"

# 8. Correctly set file ownership and permissions
# If running as root (sudo), set ownership to the owner of the parent directory.
if [[ "$EUID" -eq 0 ]]; then
  PARENT_OWNER=$(stat -c '%U:%G' "$(dirname "$DB_FILE")" 2>/dev/null || stat -f '%u:%g' "$(dirname "$DB_FILE")")
  echo "Setting database ownership to ${PARENT_OWNER}..."
  chown "$PARENT_OWNER" "$DB_FILE"
fi
chmod 644 "$DB_FILE"

# 9. Restart PM2 backend process if stopped
if [[ "$PM2_STOPPED" == "true" ]]; then
  echo "Restarting PM2 process: ${PM2_PROCESS}..."
  pm2 start "$PM2_PROCESS"
fi

echo "Database restore completed successfully!"
