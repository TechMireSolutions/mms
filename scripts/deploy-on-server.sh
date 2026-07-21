#!/usr/bin/env bash
# Hetzner deploy — invoked from .github/workflows/deploy.yml over SSH.
set +e

ROOT_DIR="${MMS_DEPLOY_ROOT:-/var/www/mmsv2}"
TARBALL="${MMS_DEPLOY_TARBALL:-/tmp/mms-dist.tar.gz}"
ENV_FILE="${MMS_DEPLOY_ENV:-apps/backend/.env}"

cd "$ROOT_DIR" || { echo "FATAL: cannot cd to ${ROOT_DIR}"; exit 1; }

# shellcheck source=lib/deploy-ports.sh
source "$ROOT_DIR/scripts/lib/deploy-ports.sh"

git reset --hard HEAD
git pull origin main
if [ $? -ne 0 ]; then
  echo "FATAL: git pull failed"
  exit 1
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
fi
export PATH="$HOME/.local/share/pnpm:$PATH"
export PUPPETEER_SKIP_DOWNLOAD=true

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
if [ "${NODE_MAJOR}" -lt 26 ] 2>/dev/null; then
  echo "WARNING: Node $(node -v 2>/dev/null || echo unknown) — MMS requires Node >= 26"
fi

if [ -f scripts/merge-backend-env.sh ]; then
  bash scripts/merge-backend-env.sh "$ENV_FILE"
else
  echo "WARNING: scripts/merge-backend-env.sh missing — skip env merge"
fi

pnpm install --frozen-lockfile
if [ $? -ne 0 ]; then
  echo "WARNING: pnpm install failed — continuing with existing node_modules"
fi

if [ ! -f "$TARBALL" ]; then
  echo "FATAL: tarball missing at ${TARBALL}"
  exit 1
fi

tar xzf "$TARBALL" -C "$ROOT_DIR"
if [ $? -ne 0 ]; then
  echo "FATAL: tar extract failed"
  exit 1
fi
rm -f "$TARBALL"

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

export PORT="$(read_env_var PORT "$MMS_PROD_BACKEND_PORT")"
export NODE_ENV=production
assert_production_backend_port "$PORT" "Deploy PORT" || exit 1

mkdir -p "$ROOT_DIR/.logs"
pm2 delete mmsv2-frontend 2>/dev/null || true

if [ -f "$ROOT_DIR/ecosystem.config.cjs" ]; then
  pm2 startOrReload "$ROOT_DIR/ecosystem.config.cjs" --only mmsv2-backend --update-env \
    || pm2 restart mmsv2-backend --update-env 2>/dev/null || true
else
  pm2 restart mmsv2-backend --update-env 2>/dev/null || pm2 restart mmsv2-backend 2>/dev/null || true
fi

DEPLOY_OK=true

if [ -f scripts/deploy-recover-backend.sh ]; then
  bash scripts/deploy-recover-backend.sh "$ENV_FILE" || {
    echo "ERROR: backend recovery failed"
    DEPLOY_OK=false
    pm2 logs mmsv2-backend --lines 50 --nostream || true
  }
fi

if [ -f scripts/apache/isolate-mms-vhost.sh ]; then
  bash scripts/apache/isolate-mms-vhost.sh "$ENV_FILE" || {
    echo "ERROR: failed to strip MMS proxy from non-MMS Apache vhosts"
    DEPLOY_OK=false
  }
fi

if [ -f scripts/apache/install-mms-vhost.sh ]; then
  bash scripts/apache/install-mms-vhost.sh "$ENV_FILE" || {
    echo "WARNING: MMS vhost install failed — ensure mmsv2.conf exists for ${MMS_APP_DOMAIN:-MMS_APP_DOMAIN}"
  }
fi

if [ -f scripts/fix-apache-upstream.sh ]; then
  bash scripts/fix-apache-upstream.sh "$ENV_FILE" || {
    echo "ERROR: Apache upstream patch failed — ProxyPass must point to :${MMS_PROD_BACKEND_PORT}"
    DEPLOY_OK=false
  }
fi

if [ -f scripts/deploy-verify.sh ]; then
  bash scripts/deploy-verify.sh "$ENV_FILE" || DEPLOY_OK=false
fi

pm2 save 2>/dev/null || true

if [ "$DEPLOY_OK" != true ]; then
  echo "FATAL: MMS deploy finished but services are not healthy"
  if [ -f scripts/server-diagnose.sh ]; then
    bash scripts/server-diagnose.sh "$ENV_FILE" || true
  fi
  exit 1
fi

echo "MMSv2 deploy finished — services healthy"
exit 0
