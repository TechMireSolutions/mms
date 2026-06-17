#!/usr/bin/env bash
# Hetzner deploy — invoked from .github/workflows/deploy.yml over SSH.
set +e

ROOT_DIR="${MMS_DEPLOY_ROOT:-/var/www/mmsv2}"
TARBALL="${MMS_DEPLOY_TARBALL:-/tmp/mms-dist.tar.gz}"
ENV_FILE="${MMS_DEPLOY_ENV:-apps/backend/.env}"

cd "$ROOT_DIR" || { echo "FATAL: cannot cd to ${ROOT_DIR}"; exit 1; }

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

pm2 restart mmsv2-frontend --update-env 2>/dev/null || pm2 restart mmsv2-frontend 2>/dev/null || true
pm2 restart mmsv2-backend --update-env 2>/dev/null || pm2 restart mmsv2-backend 2>/dev/null || true

DEPLOY_OK=true

if [ -f scripts/deploy-recover-backend.sh ]; then
  bash scripts/deploy-recover-backend.sh "$ENV_FILE" || {
    echo "ERROR: backend recovery failed"
    DEPLOY_OK=false
    pm2 logs mmsv2-backend --lines 50 --nostream || true
  }
fi

if [ -f scripts/deploy-recover-frontend.sh ]; then
  bash scripts/deploy-recover-frontend.sh "$ENV_FILE" || {
    echo "WARNING: separate frontend PM2 recovery failed — backend should serve SPA on port ${BACKEND_PORT:-3000}"
    pm2 logs mmsv2-frontend --lines 30 --nostream || true
  }
fi

if [ -f scripts/fix-apache-upstream.sh ]; then
  bash scripts/fix-apache-upstream.sh "$ENV_FILE" || {
    echo "WARNING: Apache upstream patch failed — site may stay 503 until ProxyPass points to :3000"
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
