# Streamed to the production host by scripts/ci/ssh-exec.sh (deploy.yml).
# Pins the checkout to DEPLOY_SHA so this run's server scripts are on disk,
# then hands over to scripts/deploy-on-server.sh. The repo is public, so the
# fetch is anonymous — no GitHub token is sent to the server.
set -e
export GIT_TERMINAL_PROMPT=0
cd /var/www/mmsv2

if [ -n "${DEPLOY_SHA:-}" ]; then
  git fetch --depth=1 origin "${DEPLOY_SHA}" 2>/dev/null \
    || git fetch origin "${DEPLOY_SHA}" 2>/dev/null \
    || git fetch origin 2>/dev/null \
    || true
  git checkout --detach "${DEPLOY_SHA}" 2>/dev/null \
    || echo 'Notice: git checkout skipped (using current workspace state)'
fi

bash scripts/deploy-on-server.sh < /dev/null
