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

pm2 restart mmsv2-frontend --update-env || pm2 restart mmsv2-frontend || echo "WARNING: mmsv2-frontend restart failed"
pm2 restart mmsv2-backend --update-env || pm2 restart mmsv2-backend || echo "WARNING: mmsv2-backend restart failed"

if [ -f scripts/deploy-recover-backend.sh ]; then
  bash scripts/deploy-recover-backend.sh "$ENV_FILE" || {
    echo "WARNING: backend recovery failed — check pm2 logs on the server"
    pm2 logs mmsv2-backend --lines 50 --nostream || true
  }
fi

if [ -f scripts/deploy-verify.sh ]; then
  bash scripts/deploy-verify.sh "$ENV_FILE" || true
fi

pm2 save 2>/dev/null || true
echo "MMSv2 deploy finished"
exit 0
