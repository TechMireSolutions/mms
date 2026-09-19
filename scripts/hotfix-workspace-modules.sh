#!/usr/bin/env bash
# Hotfix: grant all SYSTEM_MODULES into grantedModules + enabledModules for
# every active workspace without requiring a backend restart.
#
# Safe to run at any time — uses an explicit JSONB merge, not a destructive
# overwrite, so existing module flags are preserved. Idempotent.
#
# Usage:
#   bash scripts/hotfix-workspace-modules.sh            # uses apps/backend/.env
#   bash scripts/hotfix-workspace-modules.sh <env-file>
#
# Requires: psql available on PATH and DATABASE_URL in the env file.
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[MMS-HOTFIX]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[MMS-HOTFIX-WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[MMS-HOTFIX-ERR]${NC}  $1" >&2; }

trap 'log_err "Failed at line $LINENO: command \"$BASH_COMMAND\" exited with status $?"' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/read-env.sh
source "$ROOT_DIR/scripts/lib/read-env.sh"

ENV_FILE="${1:-apps/backend/.env}"

DATABASE_URL="$(read_env_var DATABASE_URL "" "$ENV_FILE")"
if [[ -z "$DATABASE_URL" ]]; then
  DATABASE_URL="${DATABASE_URL:-}"
fi
if [[ -z "$DATABASE_URL" ]]; then
  log_err "DATABASE_URL must be set in ${ENV_FILE} or environment"
  exit 1
fi

# Canonical list of system modules — keep in sync with @mms/shared SYSTEM_MODULES
SYSTEM_MODULES=(
  dashboard
  contacts
  messaging
  students
  teachers
  sessions
  attendance
  enrollment
  hasanat
  examination
  questionBank
  finance
  accounting
  obligations
  users
)

# Build a JSONB literal from the array: {"dashboard":true,"contacts":true,...}
build_modules_jsonb() {
  local json="{"
  local first=true
  for mod in "${SYSTEM_MODULES[@]}"; do
    if [[ "$first" == true ]]; then
      first=false
    else
      json+=","
    fi
    json+="\"${mod}\":true"
  done
  json+="}"
  echo "$json"
}

MODULES_JSONB="$(build_modules_jsonb)"

log_info "System modules to grant: ${SYSTEM_MODULES[*]}"
log_info "JSONB payload: $MODULES_JSONB"
log_info ""
log_info "Applying hotfix to all workspaces via psql..."

# Merge strategy:
#   granted_modules = defaults || stored_value
#   (defaults are values that SHOULD be present; stored explicit false values win)
#   enabled_modules same strategy — preserves admin-disabled modules.
SQL=$(cat <<SQL
DO \$\$
DECLARE
  defaults jsonb := '${MODULES_JSONB}'::jsonb;
  r RECORD;
  new_granted jsonb;
  new_enabled jsonb;
  updated int := 0;
BEGIN
  FOR r IN SELECT id, subdomain, granted_modules, enabled_modules FROM workspaces LOOP
    -- Merge: defaults supply missing keys; existing explicit values take precedence
    new_granted := defaults || COALESCE(r.granted_modules, '{}');
    new_enabled := defaults || COALESCE(r.enabled_modules, '{}');

    IF new_granted IS DISTINCT FROM COALESCE(r.granted_modules, '{}')
       OR new_enabled IS DISTINCT FROM COALESCE(r.enabled_modules, '{}') THEN
      UPDATE workspaces
         SET granted_modules = new_granted,
             enabled_modules = new_enabled
       WHERE id = r.id;
      RAISE NOTICE 'Patched workspace %', r.subdomain;
      updated := updated + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'Done — patched % workspace(s).', updated;
END;
\$\$;
SQL
)

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "$SQL"

log_info ""
log_info "Hotfix applied. If the backend has a module-access in-process cache (TTL 60s),"
log_info "requests will reflect the new grants within 60 seconds without a restart."
log_info "Run 'pm2 restart mmsv2-backend --update-env' to force immediate propagation."
